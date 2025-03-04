
# Sentiment Analysis Agent 🚀🤖  

<div>
    <img src="https://readme-typing-svg.demolab.com/?pause=1&size=30&color=f75c7e&center=True&width=1000&height=50&vCenter=True&lines=Click+the+⭐+Star+to+Support+This+Project;Open+Issues+for+Feedback+or+Questions!" />
</div>  

---

## Table of Contents 📚  
- [Features ✨](#features-✨)  
- [Setup 🛠️](#setup-🛠️)  
  - [Clone This Repository 📂](#clone-this-repository-📂)  
  - [Install Dependencies 📦](#install-dependencies-📦)  
  - [Configure Environment Variables ⚙️](#configure-environment-variables-⚙️)  
- [Example Usage 📋](#example-usage-📋)  
- [Development 🔧](#development-🔧)  
  - [Run the Development Server 🖥️](#run-the-development-server-🖥️)  
  - [Code Quality 🧹](#code-quality-🧹)  
  - [Building 🏗️](#building-🏗️)  
- [Task Workflow 🗂️](#task-workflow-🗂️)  
- [Advanced Features 💡](#advanced-features-💡)  
- [Example Report Output 📝](#example-report-output-📝)  
- [Next Steps 🚀](#next-steps-🚀)  
- [Resources 📖](#resources-📖)  

---

## Features ✨  
### Core Functionalities  
- 🐦 **Tweet Scraping**: Fetches and filters tweets mentioning specific token tickers for sentiment analysis.  
- 📊 **Sentiment Analysis**: Analyzes tweet content for positive, neutral, or negative sentiment associated with the token.  
- 🧠 **Data Aggregation**: Aggregates sentiment scores for a more comprehensive view over time, including analysis across multiple tweets or users.  
- ✨ **Webhook Integration**: Sends processed sentiment data to other systems or triggers automated actions based on sentiment.  

### Modular Design 🛠️  
- 🌐 Built with **TypeScript** for type safety and scalability.  
- ✅ Validates environment variables using **Zod** for reliable configuration.  
- 🔄 Configured for extensibility to add new capabilities or platforms.  

---

## Setup 🛠️  

### Clone This Repository 📂  
```bash  
git clone <repository-url>  
cd <repository-folder>  
```  

### Install Dependencies 📦  
```bash  
npm install  
```  

### Configure Environment Variables ⚙️  
1. Copy `.env.example` to `.env`:  
   ```bash  
   cp .env.example .env  
   ```  
2. Update the `.env` file with your environment variables:  
   ```makefile  
   API_KEY=<Your API Key>  
   TWITTER_BEARER_TOKEN=<Your Twitter Bearer Token>  
   ```  

---

## Example Usage 📋  
The agent processes user commands to analyze the sentiment of tweets mentioning specific tokens. For instance:  

### Example Command  
```bash  
/sentiment analysis $TOKEN  
```  

### What Happens:  
1. 🐦 **Fetch Tweets**: Scrapes tweets mentioning the specified token.  
2. 🧠 **Sentiment Analysis**: Analyzes the sentiment of the fetched tweets.  
3. 📊 **Aggregate Sentiment**: Aggregates sentiment data over the selected time period or number of tweets.  
4. ✨ **Webhook Integration**: Sends the results to a configured webhook or triggers automated actions based on the sentiment.  

---

## Development 🔧  

### Run the Development Server 🖥️  
The project uses **ts-node-dev** for hot reloading during development:  
```bash  
npm run dev  
```  

### Code Quality 🧹  
- **Linting**:  
  ```bash  
  # Check for linting issues  
  npm run lint  

  # Automatically fix linting issues  
  npm run lint:fix  
  ```  
- **Formatting**:  
  ```bash  
  # Format the codebase  
  npm run format  
  ```  

### Building 🏗️  
- **Build the Project**:  
  ```bash  
  npm run build  
  ```  
- **Run the Built Version**:  
  ```bash  
  npm start  
  ```  

---

## Task Workflow 🗂️  
The agent operates through a **sequential task workflow** to ensure efficient and accurate processing:  

1. **Fetch Tweets** 🐦:  
   - **Task Name**: `fetchTweets`  
   - **Description**: Retrieves tweets mentioning the specified token.  
   - **Output**: A JSON file containing the fetched tweets (`token_tweets_<taskDetails>.json`).  

2. **Perform Sentiment Analysis** 🧠:  
   - **Task Name**: `analyzeSentiment`  
   - **Description**: Analyzes the sentiment of the tweets and categorizes them as positive, neutral, or negative.  
   - **Output**: A JSON file with sentiment scores (`token_sentiment_<taskDetails>.json`).  

3. **Aggregate Sentiment** 📊:  
   - **Task Name**: `aggregateSentiment`  
   - **Description**: Aggregates sentiment scores to provide a more comprehensive view of sentiment trends.  
   - **Output**: A JSON file with aggregated sentiment data (`token_aggregated_sentiment_<taskDetails>.json`).  

4. **Send Results** ✨:  
   - **Task Name**: `sendResults`  
   - **Description**: Sends the sentiment results to a specified webhook or triggers automated actions based on the sentiment.  
   - **Output**: Confirmation of the action or webhook delivery.  

---

## Advanced Features 💡  
1. **Webhook Integration** ✨:  
   - Sends sentiment analysis results to other platforms via webhooks.  
   - Can trigger automated responses based on sentiment thresholds.  

2. **Custom Time Period Analysis** ⏳:  
   - Allows sentiment analysis over a custom time period (e.g., last 24 hours, last 7 days).  

3. **Aggregated Sentiment Over Time** 📊:  
   - Tracks sentiment trends over time, offering a historical perspective on how a token's sentiment evolves.  

---

## Example Report Output 📝  
Here’s a sample **sentiment analysis report** for a token:

```plaintext  
*cloudyheart (cloudy)* 📊  

*Recent Tweets*:  
1. "I'm bullish on $CLOUDY, this token is looking strong!"  
   Sentiment: Positive  
2. "$CLOUDY token dump and rebuy happening now!"  
   Sentiment: Negative  

🔍 *Aggregated Sentiment*:  
• Positive: 70%  
• Neutral: 20%  
• Negative: 10%  

📈 *Sentiment Trend (Last 24 hours)*:  
• Positive: 75%  
• Neutral: 15%  
• Negative: 10%  
```  

---

## Next Steps 🚀  
To expand the functionality of this agent, consider:  
- Adding support for additional data sources or sentiment analysis models.  
- Implementing **multi-platform support** for sentiment analysis (e.g., Reddit, Discord).  
- Adding **real-time monitoring** for sentiment analysis of new tweets as they are posted.  

---

## Resources 📖  
- **[Twitter API Documentation](https://developer.twitter.com/en/docs)**: Retrieve tweets and user data.  
- **[Sentiment Analysis Libraries](https://github.com/topics/sentiment-analysis)**: Explore various sentiment analysis tools and libraries.  

---

Feel free to contribute or provide feedback by opening issues! 🌟
