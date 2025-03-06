import express from 'express'
import axios from 'axios'
import { Agent } from '@openserv-labs/sdk'
import { z } from 'zod'
import 'dotenv/config'
import { analyzeSentiment } from './sentiment'
import fs from 'fs'
import { analyzeAndCategorizeSentiment } from './util'


// Create the Sentiment Agent
const agent = new Agent({
  systemPrompt: 'You analyze sentiment for Bitcoin.'
})

// Define environment variables
const TELEGRAM_WEBHOOK = process.env.TELEGRAM_WEBHOOK
// Variable to store the chatId for sending Telegram messages

if (!TELEGRAM_WEBHOOK) {
  throw new Error('Missing environment variables: TELEGRAM_WEBHOOK')
}

agent.addCapability({
  name: 'bitcoin_sentiment_analysis',
  description:
    'Fetches recent Bitcoin tweets from the last hour and performs sentiment analysis, expected output: Sentiment scores and sentiment analysis based on them',
  schema: z.object({}),
  async run({ action }) {
    try {
      // Fetch the last hour's tweets about Bitcoin
      const workspaceId = action?.workspace.id?.toString()

      if (!workspaceId) {
        throw new Error('Workspace ID is missing or invalid.')
      }

      const tweets = await fetchTweetsWithPagination(workspaceId)

      const message = await analyzeAndCategorizeSentiment(tweets)
      // Send sentiment result to Telegram bot via webhook
      // if (chatId) {
      //   await axios.post(TELEGRAM_WEBHOOK, { chat_id: chatId, text: message })
      // }

      return `Sentiment processed successfully. Result: ${message}`
    } catch (error) {
      console.error('Error processing sentiment:', error)
      throw new Error('Sentiment processing failed.')
    }
  }
})

interface Tweet {
  text: string
}

async function fetchTweetsWithPagination(passed_workspaceId: string) {
  console.log('Fetching tweets...');
  let allTweets: Tweet[] = [];
  let nextToken = undefined;
  const currentTime = new Date();
  const oneHourAgo = new Date(currentTime.getTime() - 30 * 60 * 1000);
  const formattedTime = oneHourAgo.toISOString();

  try {
    do {
      const params: { 
        query: string; 
        start_time: string; 
        'tweet.fields': string; 
        expansions: string; 
        'user.fields': string; 
        max_results: number; 
        pagination_token?: string 
      } = {
        query: 'bitcoin (price OR analysis OR market OR forecast OR trend) lang:en -is:retweet -has:links -has:cashtags',
        start_time: formattedTime, // Ensure ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
        'tweet.fields': 'created_at,text,author_id,public_metrics',
        'expansions': 'author_id',
        'user.fields': 'username,name,verified',
        max_results: 100
      };

      if (nextToken) {
        console.log('Next token found, using for pagination');
        params.pagination_token = nextToken;
      }

      // Call the Twitter API
      const response = await agent.callIntegration({
        workspaceId: Number(passed_workspaceId),
        integrationId: 'twitter-v2',
        details: {
          endpoint: '/2/tweets/search/recent',
          method: 'GET',
          params: params
        }
      });

      console.log("🔎 Raw API Response:", JSON.stringify(response.output.data, null, 2));

      // ✅ Check if response contains tweets
      const tweets = response?.output?.data
      if (!tweets || tweets.length === 0) {
        console.log("❌ No tweets found in API response.");
        return allTweets;
      }

      console.log(`✅ Found ${tweets.length} tweets.`);

      // ✅ Filter relevant tweets
      interface PublicMetrics {
        like_count: number;
        retweet_count: number;
        reply_count: number;
      }

      interface TweetWithMetrics extends Tweet {
        public_metrics: PublicMetrics;
      }

      const relevantTweets: TweetWithMetrics[] = tweets.filter((tweet: TweetWithMetrics) => 
        tweet.public_metrics &&
        tweet.public_metrics.like_count >= 5 ||
        tweet.public_metrics.retweet_count >= 5 ||
        tweet.public_metrics.reply_count >= 2 ||
        tweet.text.split(' ').length > 5
      ).sort((a: TweetWithMetrics, b: TweetWithMetrics) => 
        (b.public_metrics.like_count + b.public_metrics.retweet_count) - 
        (a.public_metrics.like_count + a.public_metrics.retweet_count)
      );

      allTweets = allTweets.concat(relevantTweets);

      // ✅ Check if there's a next_token for pagination
      nextToken = response?.output?.data?.meta?.next_token || undefined;

    } while (nextToken); // Continue looping until there's no next_token

  } catch (error) {
    console.error('🚨 Error fetching tweets:', error);
    throw new Error('Error fetching tweets.');
  }

  console.log(`🔍 Fetched ${allTweets.length} relevant tweets`);
  //fs.writeFileSync('tweets.json', JSON.stringify(allTweets, null, 2));
  return allTweets;
}

// Start the OpenServ Agent
agent.start()
