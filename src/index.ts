import express from 'express'
import axios from 'axios'
import { Agent } from '@openserv-labs/sdk'
import { z } from 'zod'
import 'dotenv/config'
import natural from 'natural' // Importing the natural library for NLP

const app = express()
app.use(express.json())

// Create the Sentiment Agent
const agent = new Agent({
  systemPrompt: 'You analyze sentiment for Bitcoin.'
})

// Define environment variables
const TELEGRAM_WEBHOOK = process.env.TELEGRAM_WEBHOOK
const WORKSPACE_ID = process.env.WORKSPACE_ID
const TWITTER_INTEGRATION_ID = process.env.TWITTER_INTEGRATION_ID
let chatId: null = null // Variable to store the chatId for sending Telegram messages

if (!TELEGRAM_WEBHOOK || !WORKSPACE_ID || !TWITTER_INTEGRATION_ID) {
  throw new Error(
    'Missing environment variables: TELEGRAM_WEBHOOK, WORKSPACE_ID or TWITTER_INTEGRATION_ID.'
  )
}

// Initialize the NLP tokenizer
const tokenizer = new natural.WordTokenizer()

// Define positive and negative words for sentiment analysis
const positiveWords = ['good', 'great', 'positive', 'bullish', 'up']
const negativeWords = ['bad', 'terrible', 'negative', 'bearish', 'down']

// Function to fetch the last hour's tweets about Bitcoin
async function fetchRecentBitcoinTweets() {
  const currentTime = new Date()
  const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000)
  const formattedTime = oneHourAgo.toISOString()

  try {
    const response = await agent.callIntegration({
      workspaceId: WORKSPACE_ID,
      integrationId: 'twitter-v2',
      details: {
        endpoint: '/2/tweets/search/recent',
        method: 'GET',
        params: {
          query: 'bitcoin',
          start_time: formattedTime,
          tweet_fields: 'created_at,text'
        }
      }
    })

    return response.data.data || []
  } catch (error) {
    console.error('Error fetching tweets:', error)
    throw new Error('Failed to fetch recent Bitcoin tweets.')
  }
}

const Sentiment = require('sentiment')
const sentiment = new Sentiment()

function analyzeSentiment(text) {
  const result = sentiment.analyze(text)
  return result.score
}

// Add a new capability to the agent for sentiment analysis
agent.addCapability({
  name: 'bitcoin_sentiment_analysis',
  description:
    'Fetches recent Bitcoin tweets from the last hour and performs sentiment analysis on them.',
  schema: z.object({}),
  async run({ args }): Promise<string> {
    try {
      // Fetch the last hour's tweets about Bitcoin
      const tweets = await fetchRecentBitcoinTweets()

      if (tweets.length === 0) {
        return 'No recent Bitcoin tweets found.'
      }

      // Analyze sentiment for all the tweets
      let totalSentimentScore = 0
      tweets.forEach(tweet => {
        const sentimentScore = analyzeSentiment(tweet.text)
        totalSentimentScore += sentimentScore
      })

      const averageSentimentScore = tweets.length ? totalSentimentScore / tweets.length : 0

      let sentiment
      if (averageSentimentScore > 0.5) {
        sentiment = '🚀 Strongly Positive'
      } else if (averageSentimentScore > 0.2) {
        sentiment = '📈 Positive'
      } else if (averageSentimentScore < -0.5) {
        sentiment = '⚠️ Strongly Negative'
      } else if (averageSentimentScore < -0.2) {
        sentiment = '📉 Negative'
      } else {
        sentiment = '📊 Neutral'
      }

      const message = `Bitcoin Sentiment (Last Hour): ${sentiment} (Score: ${averageSentimentScore.toFixed(2)})`

      // Send sentiment result to Telegram bot via webhook
      if (chatId) {
        await axios.post(TELEGRAM_WEBHOOK, { chat_id: chatId, text: message })
      }

      return `Sentiment processed successfully. Result: ${sentiment}`
    } catch (error) {
      console.error('Error processing sentiment:', error)
      throw new Error('Sentiment processing failed.')
    }
  }
})

// Webhook to receive chatId from the user (Telegram-specific)
app.post('/receive-chat-id', (req, res) => {
  const { chatId: receivedChatId } = req.body

  if (!receivedChatId) {
    return res.status(400).send('Invalid request: Missing chatId.')
  }

  // Store the chatId for sending Telegram messages later
  chatId = receivedChatId
  res.status(200).json({ success: true, message: 'chatId received and stored.' })
})
// Start the Express server
const PORT = 3000
app.listen(PORT, () => {
  console.log(`Sentiment Agent listening on port ${PORT}`)
})

// Start the OpenServ Agent
agent.start()
