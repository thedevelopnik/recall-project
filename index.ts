import { authorize, nextEventWithGMeet, extractSchedule } from "./google"
import { createAndSendBot, sendChatMessage, takeActions } from "./recall"

async function start() {
    // find next event with gmeet
    const auth = await authorize()
    const event = await nextEventWithGMeet(auth)

    // pull schedule from event
    const schedule = extractSchedule(event)

    // create a bot and send to meeting
    const botId = await createAndSendBot(event)

    // take meeting actions
    takeActions(botId, event, schedule)
}
