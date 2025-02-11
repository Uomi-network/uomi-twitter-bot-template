const config = require("../../config")
const storageService = require("../../services/storageService")
const twitterService = require("../../services/twitterService")

module.exports = async () => {
  try {
    const now = new Date().getTime()

    // be sure to not have follow more than maxDailyFollows
    const lastFollows = storageService.getLastTwitterFollows(config.twitter.maxDailyFollows)
    const firstFollow = lastFollows[lastFollows.length - 1]
    const firstFollowTimestamp = firstFollow ? new Date(firstFollow.timestamp).getTime() : 0
    if (lastFollows.length >= config.twitter.maxDailyFollows && now - firstFollowTimestamp < 24 * 60 * 60 * 1000) throw 'Max daily follows reached!'

    // calculate the total follows that can be done today
    const todayFollowed = lastFollows.filter(follow => new Date(follow.timestamp).toDateString() === new Date().toDateString()).length
    const remainingFollows = config.twitter.maxDailyFollows - todayFollowed
    console.info('- 📅 Today followed:', todayFollowed)

    // find a topic of interest
    const topic = config.twitter.topicsOfInterest[Math.floor(Math.random() * config.twitter.topicsOfInterest.length)]
    if (!topic) throw 'No topic found!'
    console.info('- 📚 Topic:', topic)

    // search for tweets about the topic
    const tweets = await twitterService.searchTweets(topic)
    console.info('- 🔍 Tweets found:', tweets._realData.data.length)

    // loop tweets and follow users
    let followed = 0
    for (const tweet of tweets._realData.data) {
      if (followed >= remainingFollows) break

      const userId = tweet.author_id
      if (storageService.findTwitterFollow(userId)) continue
      
      if (Math.random() <= 0.7) continue // 70% chance to follow

      console.info(`- 📝 Waiting 1 minute to follow ${userId}...`)
      await new Promise(resolve => setTimeout(resolve, 60000))

      await twitterService.follow(userId)
      storageService.addTwitterFollow({ id: userId })
      followed++
      console.info(`- 🤝 Followed: ${userId}`)
    }

    // get current following
    const following = await twitterService.getFollowing()
            
    let unfollowed = 0
    for (const userId of following) {
      if (unfollowed >= 10) break

      // get user tweets
      const userTweets = await twitterService.getUserTweets(userId)
      
      // check user is active
      const lastTweetDate = new Date(userTweets.data[0]?.created_at)
      const daysSinceLastTweet = (new Date() - lastTweetDate) / (1000 * 60 * 60 * 24)

      if (daysSinceLastTweet > 30) {
        console.info(`- 📝 Waiting 1 minute to unfollow ${userId}...`)
        await new Promise(resolve => setTimeout(resolve, 60000))

        await twitterService.unfollow(userId)
        storageService.findTwitterFollow(userId)
        unfollowed++
      }
    }

    return true
  } catch (error) {
    console.error('❌ Error follow:', error)
    return false
  }
}