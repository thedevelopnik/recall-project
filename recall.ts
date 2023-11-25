import { calendar_v3 } from 'googleapis';
import fetch from 'node-fetch';
import dayjs, { ManipulateType } from 'dayjs'

const botUrl = 'https://api.recall.ai/api/v1/bot/'

export function createAndSendBot(event: calendar_v3.Schema$Event): Promise<string> {
    const body = {
        meeting_url: event.hangoutLink,
        bot_name: 'TestBot'
    }
    const options = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'Authorization': `Token ${process.env.RECALL_TOKEN}`
        },
        body: JSON.stringify(body)
    }

    return fetch(botUrl, options).then(res => res.json()).then((data: any) => data.id)
}

export function sendChatMessage(botId: string, message: string) {
    const body = {
        message: message
    }
    const options = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'Authorization': `Token ${process.env.RECALL_TOKEN}`
        },
        body: JSON.stringify(body)
    }

    fetch(`${botUrl}${botId}/send_chat_message/`, options)
}

export function takeActions(botId: string, event: calendar_v3.Schema$Event, schedule: (string | number)[][]) {
    const startTime = dayjs(event.start!.dateTime)
    const endTime = dayjs(event.end!.dateTime)

    const firstAgendaMessage = `It's currently time on the agenda for: ${schedule[0][0]}`
    sendChatMessage(botId, firstAgendaMessage)

    while (dayjs() < endTime) {
        schedule.forEach(item => {
            if (dayjs() === startTime.add(Number(item[1]), 'minute')) {
                sendChatMessage(botId, `It's currently time on the agenda for: ${item[0]}`)
            }
        })

        if (dayjs() === endTime.subtract(1, 'minute')) {
            sendChatMessage(botId, `1 minute warning!`)
        }
    }
}