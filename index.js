const config = require('./config')
const storageService = require('./services/storageService')
const uomiService = require('./services/uomiService')
const tweet = require('./actions/tweet')
const follow = require('./actions/follow')
const interact = require('./actions/interact')

const loop = async () => {
  console.log('🔄 Looping...')

  console.log('-----> Tweeting...')
  await tweet()
  console.log('-----> Interacting...')
  await interact()
  // console.log('-----> Following...')
  // await follow()

  setTimeout(loop, 5000)
}

const _ = async () => {
  console.info('🤖 Staring Twitter Bot', config.bot.botUsername)

  console.info('Initializing storage service...')
  await storageService.init()
  console.info('✅ Storage service initialized!')

  console.info('Initializing uomi service...')
  await uomiService.init()
  console.info('✅ Uomi service initialized!')

  console.info('🤖 Twitter Bot started!')
  loop()
}

_()