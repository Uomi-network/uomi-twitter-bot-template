const telegramService = require('../../services/telegramService')
const storageService = require('../../services/storageService')
const uomiService = require('../../services/uomiService')

module.exports = async () => {
  const messagesWithoutAnswer = storageService.getTelegramMessagesWithoutAnswerContent()

  for (message of messagesWithoutAnswer) {
    console.info(`- 📞 Message:`, message.id, 'request id', message.answerRequestId)

    if (message.answerRequestId) {
      const request = uomiService.getRequest(message.answerRequestId)
      if (!request) {
        console.error('- Request not found!')
        continue
      }

      if (!request.completed) {
        console.info('- 🕒 Request not completed yet...(', request.executions.length, 'esecutions)')
        continue
      }

      // convert output from hex to string
      const output = Buffer.from(request.output.replace('0x', ''), 'hex').toString()
      if (!output) throw 'No output found!'
      console.info('- 💬 Output:', output)

      // remove all emojis from the output
      const outputCleaned = output.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1F500}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      console.info('- 🧽 Output cleaned:', outputCleaned)

      // send the output
      await telegramService.sendMessage(`${outputCleaned}\n\nProof of Autonomous AI Execution ➞ https://app.uomi.ai/hist?id=${message.answerRequestId}`, message.chatId)
  
      // save the answer
      await storageService.setTelegramMessageAnswerContent(message.id, outputCleaned)
    } else {
      // prepare chat history
      const chatHistory = []
      storageService.getLastTelegramMessagesByChatId(message.chatId, 100).forEach(message => {
        chatHistory.push({ role: 'user', content: message.content })
        if (message.answerContent) chatHistory.push({ role: 'assistant', content: message.answerContent })
      })
      console.info('- 💬 Chat history length:', chatHistory.length)

      // load last request to detect the new requestId
      const lastRequestId = uomiService.getLastRequest()?.requestId
      console.info('- 📡 Last request id:', lastRequestId)

      // call the agent
      const inputData = JSON.stringify(chatHistory)
      const response = await uomiService.callAgent(inputData)
      console.info('- 📡 Agent response tx hash:', response.transactionHash)

      // detect new requestId by waiting new request
      let requestId = null
      let counter = 0
      while (!requestId && counter < 100) {
        console.log(`---- (${counter}/100) Waiting for new request id...`)
        const lastRequest = uomiService.getLastRequest()
        if (lastRequest?.requestId !== lastRequestId) requestId = lastRequest.requestId
        await new Promise(resolve => setTimeout(resolve, 500))
        counter++
      }
      if (!requestId) throw 'Request not found!'
      console.info('- 📡 New request id:', requestId)

      // store the answerRequestId
      await storageService.setTelegramMessageAnswerRequestId(message.id, requestId)

      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}