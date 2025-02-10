module.exports = {
  botId: "YourBotId", // This is the twitter id of the bot account
  botUsername: "YourBotUsername", // This is the twitter username of the bot account
  tweetInterval: 7200000, // This is the interval in milliseconds between each tweet
  interactionInterval: 1800000, // This is the interval in milliseconds between each interaction
  maxDailyTweets: 50, // This is the maximum number of tweets the bot will make in a day
  maxDailyFollows: 50, // This is the maximum number of users the bot will follow in a day
  maxDailyInteracts: 50, // This is the maximum number of interactions the bot will make in a day
  topicsOfInterest: [ // This is a list of topics the bot is interested in (used to generate tweets)
    "life",
    "politics",
    "philosophy",
    "economics",
  ],
  topicsOfInterestForSearch: [ // This is a list of topics the bot is interested in (used to search for tweets)
    "uomi",
    "agents",
    "llm",
    "blockchain",
    "nft",
    "ai"
  ], 
  importantUsers: [ // This is a list of important users the bot will interact with
    "UomiNetwork",
  ]
}