import express from 'express'
import axios from 'axios'
import { Agent } from '@openserv-labs/sdk'
import { z } from 'zod'
import 'dotenv/config'
import { analyzeSentiment } from './sentiment'

const app = express()
app.use(express.json())

// Create the Sentiment Agent
const agent = new Agent({
  systemPrompt: 'You analyze sentiment for Bitcoin.'
})

// Define environment variables
const TELEGRAM_WEBHOOK = process.env.TELEGRAM_WEBHOOK
let chatId: null = null // Variable to store the chatId for sending Telegram messages

if (!TELEGRAM_WEBHOOK) {
  throw new Error(
    'Missing environment variables: TELEGRAM_WEBHOOK'
  )
}

agent.addCapability({
  name: 'bitcoin_sentiment_analysis',
  description:
    'Fetches recent Bitcoin tweets from the last hour and performs sentiment analysis on them.',
  schema: z.object({}),
  async run({ args, action }) {
    try {
      // Fetch the last hour's tweets about Bitcoin
      const tweets = await fetchTweetsWithPagination(action?.workspace.id)

      const message = await analyzeAndCategorizeSentiment(tweets)
      // Send sentiment result to Telegram bot via webhook
      if (chatId) {
        await axios.post(TELEGRAM_WEBHOOK, { chat_id: chatId, text: message })
      }

      return `Sentiment processed successfully. Result: ${message}`
    } catch (error) {
      console.error('Error processing sentiment:', error)
      throw new Error('Sentiment processing failed.')
    }
  }
})

async function analyzeAndCategorizeSentiment(tweets) {
  let totalSentimentScore = 0
  let positiveCount = 0
  let neutralCount = 0
  let negativeCount = 0

  tweets.forEach(tweet => {
    const sentimentScore = analyzeSentiment(tweet.text)
    totalSentimentScore += sentimentScore

    // Categorize sentiment based on the score
    if (sentimentScore > 0.5) {
      positiveCount++
    } else if (sentimentScore > 0.2) {
      neutralCount++
    } else if (sentimentScore < -0.5) {
      negativeCount++
    } else if (sentimentScore < -0.2) {
      neutralCount++
    }
  })

  // Calculate the average sentiment score
  const averageSentimentScore = tweets.length ? totalSentimentScore / tweets.length : 0

  // Determine the overall sentiment
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

  // Calculate percentages for each category
  const totalTweets = tweets.length
  const positivePercentage = totalTweets ? ((positiveCount / totalTweets) * 100).toFixed(2) : 0
  const neutralPercentage = totalTweets ? ((neutralCount / totalTweets) * 100).toFixed(2) : 0
  const negativePercentage = totalTweets ? ((negativeCount / totalTweets) * 100).toFixed(2) : 0

  // Generate the final report message
  const message =
    `Bitcoin Sentiment (Last Hour): ${sentiment} (Score: ${averageSentimentScore.toFixed(2)})\n\n` +
    `🔍 *Aggregated Sentiment*: \n` +
    `• Positive: ${positivePercentage}% \n` +
    `• Neutral: ${neutralPercentage}% \n` +
    `• Negative: ${negativePercentage}%`

  return message
}

async function fetchTweetsWithPagination(passed_workspaceId) {
  let allTweets = []
  let nextToken = null
  const currentTime = new Date()
  const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000)
  const formattedTime = oneHourAgo.toISOString()
  // Keep making requests while there's a nextToken
  do {
    const params: Record<string, any> = {
      query: 'bitcoin',
      start_time: formattedTime,
      tweet_fields: 'created_at,text',
      max_results: 100 // Max number of tweets per request
    }

    if (nextToken) {
      params.pagination_token = nextToken
    }

    // Call the Twitter integration with pagination
    const response = await agent.callIntegration({
      workspaceId: passed_workspaceId,
      integrationId: 'twitter-v2',
      details: {
        endpoint: '/2/tweets/search/recent',
        method: 'GET',
        params: params
      }
    })

    // Add the retrieved tweets to the allTweets array
    const tweets = response?.output?.data ?? []
    allTweets = allTweets.concat(tweets)

    // Check if there's a next_token for the next page of results
    nextToken = response?.output?.meta?.next_token || undefined
  } while (nextToken) // Continue looping until there's no next_token

  return allTweets
}

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
