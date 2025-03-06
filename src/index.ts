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

async function fetchData(): Promise<any> {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin`, 
      {
        headers: {
          'x-cg-demo-api-key': process.env.COINGECKO_API_KEY
        }
      }
    );
    return response.data[0];
  } catch (error) {
    console.error("Error fetching price change:", error);
    return 0; // Return a default value if the API call fails
  }
}


async function analyzeAndCategorizeSentiment(tweets: Tweet[]): Promise<string> {
  const normalizeSentimentScore = (score: number): number => {
    return ((score + 5) / 10) * 100;
  };
  
  let totalSentimentScore: number = 0;
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;
  
  tweets.forEach(tweet => {
    const sentimentScore: number = analyzeSentiment(tweet.text);
  
    // Normalize sentiment score to a percentage (0-100%)
    const normalizedScore = normalizeSentimentScore(sentimentScore);
    totalSentimentScore += normalizedScore;
  
    // Categorize sentiment based on the normalized score
    if (normalizedScore > 60) {  // Positive sentiment
      positiveCount++;
    } else if (normalizedScore >= 40) {  // Neutral sentiment
      neutralCount++;
    } else {  // Negative sentiment
      negativeCount++;
    }
  });
  
  // Calculate weighted aggregated sentiment score
  const aggregatedSentimentScore = 
    (positiveCount * 100 + neutralCount * 50 + negativeCount * 0) / tweets.length;
  
  // Calculate the average sentiment score (optional: consider weighted average)
  // const averageSentimentScore = tweets.length ? totalSentimentScore / tweets.length : 0;
  
  // Calculate percentages for each category
  const totalTweets: number = tweets.length;
  const positivePercentage: string = totalTweets
    ? ((positiveCount / totalTweets) * 100).toFixed(2)
    : '0';
  const neutralPercentage: string = totalTweets
    ? ((neutralCount / totalTweets) * 100).toFixed(2)
    : '0';
  const negativePercentage: string = totalTweets
    ? ((negativeCount / totalTweets) * 100).toFixed(2)
    : '0';
  
  const bitcoinData = await fetchData();

  // Extracting relevant market data
  const currentPrice = bitcoinData.current_price;
  const priceChangePercentage24h = bitcoinData.price_change_percentage_24h;
  const high24h = bitcoinData.high_24h;
  const low24h = bitcoinData.low_24h;
  const ath = bitcoinData.ath;

  // Combine sentiment with market data insights
  let priceTrendInsight = '';
  if (priceChangePercentage24h > 0) {
    priceTrendInsight = '🚀 Bitcoin is currently on the rise, with an upward trend over the last 24 hours.';
  } else if (priceChangePercentage24h < 0) {
    priceTrendInsight = '⚠️ Bitcoin has experienced a drop in price over the last 24 hours. Caution is advised.';
  } else {
    priceTrendInsight = '🔍 Bitcoin’s price remains relatively stable over the last 24 hours.';
  }

  // Combine sentiment with price trend
  let sentimentTrendInsight = '';
  if (aggregatedSentimentScore > 60) {
    sentimentTrendInsight = '😊 The market sentiment is positive, indicating a bullish outlook from the community.';
  } else if (aggregatedSentimentScore < 40) {
    sentimentTrendInsight = '😞 The market sentiment is negative, indicating bearish trends in the community.';
  } else {
    sentimentTrendInsight = '🤔 The market sentiment is neutral, indicating indecisiveness in the community.';
  }

  // Generate the final combined report
  const report = `
    🟢 *Bitcoin Insights* 🟢

    💰 **Current Price**: $${currentPrice.toFixed(2)}
    📉 **24h Change**: ${priceChangePercentage24h > 0 ? '+' : ''}${priceChangePercentage24h.toFixed(2)}%
    🔝 **24h High**: $${high24h}
    🔻 **24h Low**: $${low24h}

    🏆 **Market Cap Rank**: #${bitcoinData.market_cap_rank}
    💵 **Market Cap**: $${(bitcoinData.market_cap / 1e9).toFixed(2)} Billion

    📈 **All-Time High (ATH)**: $${ath}
    
    🚀 *Price Trend Insight*: ${priceTrendInsight}
    😊 *Sentiment Insight*: ${sentimentTrendInsight}

    📊 *Sentiment Breakdown*:
    - **Positive Sentiment**: ${positivePercentage}%
    - **Neutral Sentiment**: ${neutralPercentage}%
    - **Negative Sentiment**: ${negativePercentage}%

    📝 *Aggregated Sentiment*: ${aggregatedSentimentScore.toFixed(2)}%
  `;

  return report;
  
  
}

// interface TweetResponse {
//   data: Tweet[]
//   meta: {
//     next_token?: string
//   }
// }

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
  return allTweets;
}

// Start the OpenServ Agent
agent.start()
