const config = require("../config")
const storageService = require("../services/storageService")
const twitterService = require("../services/twitterService")
const uomiService = require("../services/uomiService")

module.exports = async () => {
  try {
    const now = new Date().getTime()
    
    // be sure to not have interact more than maxDailyInteracts
    const lastInteracts = storageService.getLastReplies(config.bot.maxDailyInteracts)
    const firstInteract = lastInteracts[lastInteracts.length - 1]
    const firstInteractTimestamp = firstInteract ? new Date(firstInteract.timestamp).getTime() : 0
    if (lastInteracts.length >= config.bot.maxDailyInteracts && now - firstInteractTimestamp < 24 * 60 * 60 * 1000) throw 'Max daily interacts reached!'

    // be sure to wait at least the interactionInterval before interacting again
    const lastInteract = storageService.getLastReply()
    const lastInteractTimestamp = lastInteract ? new Date(lastInteract.timestamp).getTime() : 0
    if (now - lastInteractTimestamp < config.bot.interactionInterval) throw 'Waiting for next interact...'

    // find a random important user
    const importantUsers = config.bot.importantUsers
    const importantUser = importantUsers[Math.floor(Math.random() * importantUsers.length)]
    if (!importantUser) throw 'No important user found!'
    console.info('- 📚 Important user:', importantUser)

    // load tweets from important user
    const tweets = await twitterService.searchTweets("from:" + importantUser)
    const randomTweet = tweets._realData.data[Math.floor(Math.random() * tweets._realData.data.length)]
    if (!randomTweet) throw 'No tweet found!'
    console.info('- 📚 Random tweet:', randomTweet)

    // be sure random tweet is not already replied
    const alreadyReplied = storageService.findReply(randomTweet.id)
    if (alreadyReplied) throw 'Tweet already replied!'

    // prepare chat history
    const chatHistory = []
    chatHistory.push({ role: 'user', content: `You found this tweet: ${randomTweet.text}, generate a comment. MAX 200 characters.` })
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

    // wait for the request to be completed
    let request = null
    counter = 0
    while (!request?.completed && counter < 1000) {
      console.log(`---- (${counter}/1000) Waiting for request to be completed... [${request?.executions?.length || 0} executions]`)
      request = uomiService.getRequest(requestId)
      await new Promise(resolve => setTimeout(resolve, 500))
      counter++
    }
    if (!request?.completed) throw 'Request not completed!'
    console.info('- 📡 Request completed:', request)

    // convert output from hex to string
    const output = Buffer.from(request.output.replace('0x', ''), 'hex').toString()
    if (!output) throw 'No output found!'
    console.info('- 💬 Output:', output)

    // remove all emojis from the output
    const outputCleaned = output.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1F500}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').replace(/RT @\w+: /, '')
    console.info('- 🧽 Output cleaned:', outputCleaned)

    // reply to the tweet
    await twitterService.reply(randomTweet.id, `${outputCleaned}\n\nProof of Autonomous AI Execution ➞ https://app.uomi.ai/hist?id=${requestId}`)

    // save the reply
    await storageService.addReply({
      id: randomTweet.id,
      originalTweet: randomTweet.text,
      replyContent: outputCleaned,
    })

    return true
  } catch (error) {
    console.error('❌ Error interact:', error)
    return false
  }
}