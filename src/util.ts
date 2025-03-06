import axios from "axios";
import { analyzeSentiment } from "./sentiment";


interface Tweet {
  text: string
}

export async function fetchData(): Promise<any> {
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


export async function analyzeAndCategorizeSentiment(tweets: Tweet[]): Promise<string> {
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