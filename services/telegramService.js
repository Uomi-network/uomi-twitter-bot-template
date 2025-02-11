const TelegramBot = require('node-telegram-bot-api')
const storageService = require('./storageService')
const config = require('../config')

class TelegramService {
  constructor() {
    this.bot = new TelegramBot(config.telegram.telegramBotToken, {polling: true})

    this.bot.onText(/\/start/, (msg) => {
      console.log("🔔 telegram.start")
      this.bot.sendMessage(msg.chat.id, config.telegram.telegramWelcomeMessage || 'Welcome!')
    })

    this.bot.on('message', (msg) => {
      const chatId = msg.chat.id
      const content = msg.text
      console.log("🔔 telegram.message", chatId, content)

      const lastMessage = storageService.getLastTelegramMessageByChatId(chatId)
      if (lastMessage && lastMessage.answerContent == null) {
        this.bot.sendMessage(chatId, 'Please wait for the bot to respond before sending another message...')
        return
      }

      storageService.addTelegramMessage({ chatId, content })
    })
  }

  sendMessage(content, chatId) {
    this.bot.sendMessage(chatId, content)
  }
}

module.exports = new TelegramService()