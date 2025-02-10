const config = require('../config')
const storageService = require('../services/storageService')
const uomiService = require('../services/uomiService')
const twitterService = require('../services/twitterService')

module.exports = async () => {
  try {
    const now = new Date().getTime()

    // be sure to not have tweeted more than maxDailyTweets
    const lastTweets = storageService.getLastTweets(config.bot.maxDailyTweets)
    const firstTweet = lastTweets[lastTweets.length - 1]
    const firstTweetTimestamp = firstTweet ? new Date(firstTweet.timestamp).getTime() : 0
    if (lastTweets.length >= config.bot.maxDailyTweets && now - firstTweetTimestamp < 24 * 60 * 60 * 1000) throw 'Max daily tweets reached!'

    // be sure to wait at least the tweetInterval before tweeting again
    const lastTweet = storageService.getLastTweet()
    const lastTweetTimestamp = lastTweet ? new Date(lastTweet.timestamp).getTime() : 0
    if (now - lastTweetTimestamp < config.bot.tweetInterval) throw 'Waiting for next tweet...'

    // find a random topic
    const topic = config.bot.topicsOfInterest[Math.floor(Math.random() * config.bot.topicsOfInterest.length)]
    if (!topic) throw 'No topic found!'
    console.info('- 📚 Topic:', topic)

    // prepare chat history
    const chatHistory = []
    storageService.getLastTweets(100).forEach(tweet => {
      chatHistory.push({ role: 'user', content: 'make a tweet' })
      chatHistory.push({ role: 'assistant', content: tweet.content })
    })
    chatHistory.push({ role: 'user', content: `Make a tweet about: ${topic}\n Important: always make the tweet different from the previous ones and make just 1 tweet per message. NEVER REPEAT. Max 200 characters.` })
    console.info('- 💬 Chat history length:', chatHistory.length)

    // load last request to detect the new requestId
    const lastRequestId = uomiService.getLastRequest()?.requestId
    console.info('- 📡 Last request id:', lastRequestId)

    // call the agent
    const inputData = JSON.stringify(chatHistory)
    console.log('inputData', inputData)
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
      await new Promise(resolve => setTimeout(resolve, 5000))
      counter++
    }
    if (!request?.completed) throw 'Request not completed!'
    console.info('- 📡 Request completed:', `${request.totalConsensus}/${request.totalExecutions} executions`)

    // convert output from hex to string
    const output = Buffer.from(request.output.replace('0x', ''), 'hex').toString()
    if (!output) throw 'No output found!'
    console.info('- 💬 Output:', output)

    // remove all emojis from the output
    const outputCleaned = output.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1F500}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    console.info('- 🧽 Output cleaned:', outputCleaned)

    // tweet the output
    await twitterService.tweet(`${outputCleaned}\n\nProof of Autonomous AI Execution ➞ https://app.uomi.ai/hist?id=${requestId}`)

    // save the tweet
    await storageService.addTweet({
      text: outputCleaned,
      topic: topic
    })

    return true
  } catch (error) {
    console.error('❌ Error tweet:', error)
    return false
  }
}
