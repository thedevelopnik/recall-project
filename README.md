# Recall.ai Demo

This demo shows code for a bot that will read a meeting agenda from Google Calendar
and use it to send prompts in a meeting to keep the conversation on track.

## Structure

`google.ts` contains code for interacting with the Google Calendar API,
getting the next event with a Google Meet attached, and parsing the agenda.

`recall.ts` contains code for creating a new bot to send to a meeting,
sending chat messages, and using the parsed agenda to determine what messages
to send and when.

`index.ts` chains these processes together.

I could not find the Recall.ai SDK for Node that is shown on the marketing page, so
just used the API documentation to put together API calls.
