const fs = require('fs').promises
const path = require('path')

class StorageService {
  constructor() {
    this.storagePath = path.join(__dirname, '../data/tweets.json')
    this.repliesPath = path.join(__dirname, '../data/replies.json')
    this.followsPath = path.join(__dirname, '../data/follows.json')
    this.tweets = []
    this.replies = []
    this.follows = []
    this.maxStoredTweets = 100
    this.maxStoredReplies = 50
  }

  async init() {
    try {
      await fs.mkdir(path.dirname(this.storagePath), { recursive: true })
      
      try {
        const tweetsData = await fs.readFile(this.storagePath, 'utf8')
        this.tweets = JSON.parse(tweetsData)
        
        const repliesData = await fs.readFile(this.repliesPath, 'utf8')
        this.replies = JSON.parse(repliesData)

        const followsData = await fs.readFile(this.followsPath, 'utf8')
        this.follows = JSON.parse(followsData)
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.saveTweets()
          await this.saveReplies()
          await this.saveFollows()
        } else {
          throw error
        }
      }
    } catch (error) {
      throw error
    }
  }

  async saveTweets() {
    try {
      await fs.writeFile(this.storagePath, JSON.stringify(this.tweets, null, 2))
    } catch (error) {
      console.error('StorageService.saveTweets:', error)
      throw error
    }
  }

  async saveReplies() {
    try {
      await fs.writeFile(this.repliesPath, JSON.stringify(this.replies, null, 2))
    } catch (error) {
      console.error('StorageService.saveReplies:', error)
      throw error
    }
  }

  async saveFollows() {
    try {
      await fs.writeFile(this.followsPath, JSON.stringify(this.follows, null, 2))
    } catch (error) {
      console.error('StorageService.saveFollows:', error)
      throw error
    }
  }

  async addTweet(tweet) {
    const tweetData = {
      content: tweet.text,
      timestamp: new Date().toISOString(),
      topic: tweet.topic,
    }

    this.tweets.unshift(tweetData)

    if (this.tweets.length > this.maxStoredTweets) {
      this.tweets = this.tweets.slice(0, this.maxStoredTweets)
    }

    await this.saveTweets()
    return tweetData
  }

  async addReply(reply) {
    const replyData = {
      id: reply.id,
      originalTweet: reply.originalTweet,
      replyContent: reply.content,
      timestamp: new Date().toISOString(),
    }

    this.replies.unshift(replyData)

    if (this.replies.length > this.maxStoredReplies) {
      this.replies = this.replies.slice(0, this.maxStoredReplies)
    }

    await this.saveReplies()
    return replyData
  }

  async addFollow(follow) {
    const followData = {
      id: follow.id,
      timestamp: new Date().toISOString(),
    }

    this.follows.unshift(followData)

    await this.saveFollows()
    return followData
  }

  getLastTweets(count = 10) {
    return this.tweets.slice(0, count)
  }

  getLastReplies(count = 5) {
    return this.replies.slice(0, count)
  }

  getLastFollows(count = 5) {
    return this.follows.slice(0, count)
  }

  getLastTweet() {
    return this.tweets[0]
  }

  getLastReply() {
    return this.replies[0]
  }

  getLastFollow() {
    return this.follows[0]
  }

  findFollow(id) {
    return this.follows.find(follow => follow.id === id)
  }

  findReply(id) {
    return this.replies.find(reply => reply.id === id)
  }

  removeFollow(id) {
    const index = this.follows.findIndex(follow => follow.id === id)
    if (index !== -1) {
      this.follows.splice(index, 1)
      this.saveFollows()
    }
  }

  removeReply(id) {
    const index = this.replies.findIndex(reply => reply.id === id)
    if (index !== -1) {
      this.replies.splice(index, 1)
      this.saveReplies()
    }
  }
}

module.exports = new StorageService()