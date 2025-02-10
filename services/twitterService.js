const { TwitterApi } = require('twitter-api-v2')
const config = require('../config')

class TwitterService {
  constructor() {
    this.client = new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessTokenSecret,
    })
  }

  async tweet(content) {
    try {
      const tweet = await this.client.v2.tweet(content)
      return tweet
    } catch (error) {
      console.error('TwitterService.tweet:', error)
      throw error
    }
  }
  
  async getComments(tweetId) {
    try {
      const replies = await this.client.v2.search(
        `conversation_id:${tweetId}`, 
        {
          'tweet.fields': [
            'author_id',
            'created_at',
            'in_reply_to_user_id',
            'referenced_tweets'
          ],
          'user.fields': [
            'id',
            'name',
            'username'
          ],
          expansions: ['author_id']
        }
      )
      return replies
    } catch (error) {
      console.error('TwitterService.getComments:', error)
      throw error
    }
  }

  async getMyTweets() {
    try {
      const tweets = await this.searchTweets(`from:${config.bot.botUsername} -is:reply -is:retweet`)
      return tweets.data
    } catch (error) {
      console.error('TwitterService.getMyTweets:', error)
      throw error
    }
  }

  async like(tweetId) {
    try {
      await this.client.v2.like(config.bot.botId, tweetId)
    } catch (error) {
      console.error('TwitterService.like:', error)
      throw error
    }
  }

  async reply(tweetId, content) {
    try {
      const reply = await this.client.v2.reply(content, tweetId)
      return reply
    } catch (error) {
      console.error('TwitterService.reply:', error)
      throw error
    }
  }

  async follow(userId) {
    try {
      await this.client.v2.follow(config.bot.botId, userId)
    } catch (error) {
      console.error('TwitterService.follow:', error)
      throw error
    }
  }

  async unfollow(userId) {
    try {
      await this.client.v2.unfollow(userId)
    } catch (error) {
      console.error('TwitterService.unfollow:', error)
      throw error
    }
  }

  async searchTweets(query) {
    try {
      const tweets = await this.client.v2.search(query, {
        expansions: ['author_id'],
        'user.fields': ['id', 'name', 'username', 'profile_image_url']
      })
      return tweets
    } catch (error) {
      console.error('TwitterService.searchTweets:', error)
      throw error
    }
  }
}

module.exports = new TwitterService()