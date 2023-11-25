const fs = require('fs').promises;
const path = require('path');
import * as process from 'process'
import { authenticate } from '@google-cloud/local-auth'
import { google } from 'googleapis'
import { calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials) as OAuth2Client;
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client: OAuth2Client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
export async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
export async function nextEventWithGMeet(auth: OAuth2Client): Promise<calendar_v3.Schema$Event> {
  const calendar = google.calendar({version: 'v3', auth});
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 2,
    singleEvents: true,
    orderBy: 'startTime',
  });
  const events = res.data.items;
  if (!events || events.length === 0) {
    throw new Error('No upcoming events found.')
  }
  const eventsWithGMeet = events.filter((event) => {
    if (event.hangoutLink) {
        return event
    }
  });
  if (eventsWithGMeet.length === 0) {
      throw new Error('No upcoming events with Google Meet found.')
  }
  return eventsWithGMeet[0]
}

export function extractSchedule(event: calendar_v3.Schema$Event): (string | number)[][] {
    const desc = event.description
    if (!desc) {
        throw new Error('No description found in event.')
    }
    const agendaLines = desc.split('\n')
    const agenda = agendaLines.filter((line) => {
        if (line.includes('minutes')) {
            return line
        }
    })
    let totalTime = 0
    let previousAgendaEnd = 0
    const schedule = agenda.map(line => {
      const titleAndTime = line.split(' - ')
      const title = titleAndTime[0]
      const timeAndDuration = titleAndTime[1].split(' ')
      const sourceTime = Number(timeAndDuration[0])
      previousAgendaEnd = totalTime
      const time = sourceTime + totalTime
      totalTime = time
      const duration = timeAndDuration[1]
      return [title, previousAgendaEnd, duration]
    })
    return schedule
}

authorize().then(nextEventWithGMeet).catch(console.error);