const config = require('./config')
const storageService = require('./services/storageService')
const uomiService = require('./services/uomiService')
const telegramChat = require('./actions/telegram/chat')
const twitterTweet = require('./actions/twitter/tweet')
const twitterInteract = require('./actions/twitter/interact')
const twitterFollow = require('./actions/twitter/follow')

const telegram = async () => {
  console.log('-----> TELEGRAM chat...')
  await telegramChat()
}

const twitter = async () => {
  console.log('-----> TWITTER Tweeting...')
  await twitterTweet()

  // NOTE: Interactions and follows are available only for premium twitter accounts.
  // Uncomment the following lines if you have a premium account.

  // console.log('-----> TWITTER Interacting...')
  // await twitterInteract()
  // console.log('-----> TWITTER Following...')
  // await twitterFollow()
}

const loop = async () => {
  console.log('🔄 Loop...')

  if (config.telegram.active) await telegram()
  if (config.twitter.active) await twitter()

  setTimeout(loop, 500)
}

const _ = async () => {
  console.info('🤖 Staring Web2 proxy')

  console.info('Initializing storage service...')
  await storageService.init()
  console.info('✅ Storage service initialized!')

  console.info('Initializing uomi service...')
  await uomiService.init()
  console.info('✅ Uomi service initialized!')

  console.info('🤖 Web2 proxy started!')

  loop()
}

_()