const fs = require('fs').promises
const path = require('path')

class StorageService {
  constructor() {
    // Telegram data
    this.telegramMessagesPath = path.join(__dirname, '../data/telegram_messages.json')
    this.telegramMessages = []
    this.maxStoredTelegramMessages = 100

    // Twitter data
    this.twitterTweetsPath = path.join(__dirname, '../data/twitter_tweets.json')
    this.twitterRepliesPath = path.join(__dirname, '../data/twitter_replies.json')
    this.twitterFollowsPath = path.join(__dirname, '../data/twitter_follows.json')
    this.twitterTweets = []
    this.twitterReplies = []
    this.twitterFollows = []
    this.maxStoredTwitterTweets = 100
    this.maxStoredTwitterReplies = 50
  }

  async init() {
    try {
      await fs.mkdir(path.dirname(path.join(__dirname, '../data')), { recursive: true })

      // Telegram Init
      try {
        const messagesData = await fs.readFile(this.telegramMessagesPath, 'utf8')
        this.telegramMessages = JSON.parse(messagesData)
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.saveTelegramMessages()
        } else {
          throw error
        }
      }
      
      // Twitter Init
      try {
        const tweetsData = await fs.readFile(this.twitterTweetsPath, 'utf8')
        this.twitterTweets = JSON.parse(tweetsData)
        
        const repliesData = await fs.readFile(this.twitterRepliesPath, 'utf8')
        this.twitterReplies = JSON.parse(repliesData)

        const followsData = await fs.readFile(this.twitterFollowsPath, 'utf8')
        this.twitterFollows = JSON.parse(followsData)
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.saveTwitterTweets()
          await this.saveTwitterReplies()
          await this.saveTwitterFollows()
        } else {
          throw error
        }
      }
    } catch (error) {
      throw error
    }
  }

  // Telegram Functions

  async saveTelegramMessages() {
    try {
      await fs.writeFile(this.telegramMessagesPath, JSON.stringify(this.telegramMessages, null, 2))
    } catch (error) {
      console.error('StorageService.saveTelegramMessages:', error)
      throw error
    }
  }

  async addTelegramMessage(message) {
    const messageData = {
      id: Math.floor(Math.random() * 1000000),
      chatId: message.chatId,
      content: message.content,
      timestamp: new Date().toISOString(),
      answerRequestId: null,
      answerContent: null,
    }

    this.telegramMessages.unshift(messageData)

    if (this.telegramMessages.length > this.maxStoredTelegramMessages) {
      this.telegramMessages = this.telegramMessages.slice(0, this.maxStoredTelegramMessages)
    }

    await this.saveTelegramMessages()
    return messageData
  }

  async setTelegramMessageAnswerRequestId(messageId, answerRequestId) {
    const message = this.telegramMessages.find(message => message.id === messageId)
    if (message) {
      message.answerRequestId = answerRequestId
      await this.saveTelegramMessages()
    }
  }

  async setTelegramMessageAnswerContent(messageId, answerContent) {
    const message = this.telegramMessages.find(message => message.id === messageId)
    if (message) {
      message.answerContent = answerContent
      await this.saveTelegramMessages()
    }
  }

  getLastTelegramMessagesByChatId(chatId, count = 10) {
    return this.telegramMessages.filter(message => message.chatId === chatId).slice(0, count)
  }

  getLastTelegramMessageByChatId(chatId) {
    return this.telegramMessages.find(message => message.chatId === chatId)
  }

  getTelegramMessagesWithoutAnswerContent() {
    return this.telegramMessages.filter(message => !message.answerContent)
  }

  getTelegramMessageByAnswerRequestId(answerRequestId) {
    return this.telegramMessages.find(message => message.answerRequestId === answerRequestId)
  }

  // Twitter Functions

  async saveTwitterTweets() {
    try {
      await fs.writeFile(this.twitterTweetsPath, JSON.stringify(this.twitterTweets, null, 2))
    } catch (error) {
      console.error('StorageService.saveTwitterTweets:', error)
      throw error
    }
  }

  async saveTwitterReplies() {
    try {
      await fs.writeFile(this.twitterRepliesPath, JSON.stringify(this.twitterReplies, null, 2))
    } catch (error) {
      console.error('StorageService.saveTwitterReplies:', error)
      throw error
    }
  }

  async saveTwitterFollows() {
    try {
      await fs.writeFile(this.twitterFollowsPath, JSON.stringify(this.twitterFollows, null, 2))
    } catch (error) {
      console.error('StorageService.saveTwitterFollows:', error)
      throw error
    }
  }

  async addTwitterTweet(tweet) {
    const tweetData = {
      content: tweet.text,
      timestamp: new Date().toISOString(),
      topic: tweet.topic,
    }

    this.twitterTweets.unshift(tweetData)

    if (this.twitterTweets.length > this.maxStoredTwitterTweets) {
      this.twitterTweets = this.twitterTweets.slice(0, this.maxStoredTwitterTweets)
    }

    await this.saveTwitterTweets()
    return tweetData
  }

  async addTwitterReply(reply) {
    const replyData = {
      id: reply.id,
      originalTweet: reply.originalTweet,
      replyContent: reply.content,
      timestamp: new Date().toISOString(),
    }

    this.twitterReplies.unshift(replyData)

    if (this.twitterReplies.length > this.maxStoredTwitterReplies) {
      this.twitterReplies = this.twitterReplies.slice(0, this.maxStoredTwitterReplies)
    }

    await this.saveTwitterReplies()
    return replyData
  }

  async addTwitterFollow(follow) {
    const followData = {
      id: follow.id,
      timestamp: new Date().toISOString(),
    }

    this.twitterFollows.unshift(followData)

    await this.saveTwitterFollows()
    return followData
  }

  getLastTwitterTweets(count = 10) {
    return this.twitterTweets.slice(0, count)
  }

  getLastTwitterReplies(count = 5) {
    return this.twitterReplies.slice(0, count)
  }

  getLastTwitterFollows(count = 5) {
    return this.twitterFollows.slice(0, count)
  }

  getLastTwitterTweet() {
    return this.twitterTweets[0]
  }

  getLastTwitterReply() {
    return this.twitterReplies[0]
  }

  getLastTwitterFollow() {
    return this.twitterFollows[0]
  }

  findTwitterFollow(id) {
    return this.twitterFollows.find(follow => follow.id === id)
  }

  findTwitterReply(id) {
    return this.twitterReplies.find(reply => reply.id === id)
  }

  findTwitterFollow(id) {
    const index = this.twitterFollows.findIndex(follow => follow.id === id)
    if (index !== -1) {
      this.twitterFollows.splice(index, 1)
      this.saveTwitterFollows()
    }
  }

  findTwitterReply(id) {
    const index = this.twitterReplies.findIndex(reply => reply.id === id)
    if (index !== -1) {
      this.twitterReplies.splice(index, 1)
      this.saveTwitterReplies()
    }
  }
}

module.exports = new StorageService()