# WhatsApp Greetings Bot

A Node.js bot that automatically sends **birthday and holiday greetings** on WhatsApp, on time, every time. You keep a list of contacts and a list of holiday messages, and the bot does the rest, with a small web dashboard so you can see what is happening.




## Features

- **Birthday messages**: sends each contact's own custom message, or a default one if none is set
- **Holiday messages**: sends a message on set dates (New Year, New Month, Valentine's Day, and more)
- **Group and gender filters**: a holiday can target only certain groups (e.g. `Family`) or a specific gender (e.g. Mother's Day)
- **Anti-duplicate protection**: keeps a daily log so nobody gets the same greeting twice
- **Lagos timezone**: all dates and the daily schedule run on `Africa/Lagos` time
- **Web dashboard**: shows the bot's status, today's event, messages sent today, and upcoming events
- **QR login page**: scan the WhatsApp QR code from your browser at `/qr`, which is handy when the bot runs on a server

## How it works

1. The bot logs in to WhatsApp through a linked device (QR code).
2. Every day at **00:00 (Africa/Lagos)**, a cron job checks whether today is a holiday or someone's birthday. The bot also runs one check when it first connects.
3. For each matching contact it sends the message, waits a few seconds between messages, and records the contact in `sent-log.json` so the same person is not messaged twice in a day.

## Tech stack

| Purpose | Tool |
| --- | --- |
| Runtime | Node.js |
| WhatsApp connection | whatsapp-web.js (Baileys migration in progress) |
| Scheduling | node-cron |
| Dashboard and QR page | Express |
| Contact import | csv-parser |
| QR rendering | qrcode, qrcode-terminal |
| Package manager | pnpm |

## Getting started

### Prerequisites

- Node.js 18 or newer
- [pnpm](https://pnpm.io/)
- A WhatsApp account you can link as a device

### Setup

```bash
git clone https://github.com/Shigerukamado/whatsapp-greetings-bot.git
cd whatsapp-greetings-bot
pnpm install
```

Create your contacts file from the example:

```bash
cp contacts.example.csv contacts.csv
```

Edit `contacts.csv` with your own contacts (see the format below), then start the bot:

```bash
pnpm start
```

Open `http://localhost:3000/qr` and scan the QR code with WhatsApp (**Settings, Linked devices, Link a device**). When the bot says it is connected, the dashboard is at `http://localhost:3000`.

## Configuration

### `contacts.csv`

| Column | Description | Example |
| --- | --- | --- |
| `name` | Contact's name | `Ada` |
| `number` | Phone number with country code, digits only | `2348012345678` |
| `birthday` | Birthday as `MM-DD` | `04-21` |
| `custom_message` | Optional birthday message (a default is used if empty) | `Happy Birthday!` |
| `groups` | One or more groups, separated by `\|` | `Family\|Friends` |
| `gender` | `male` or `female` (used for gender-specific holidays) | `female` |

### `holidays.json`

Each key is a date in `MM-DD` format:

```json
{
  "01-01": {
    "message": "Happy New Year!",
    "groups": ["Family"]
  },
  "05-10": {
    "message": "Happy Mother's Day!",
    "groups": ["everyone"],
    "gender": "female"
  }
}
```

- `groups`: who receives the message. Use `"everyone"` to send to all contacts.
- `gender`: optional. Only contacts with this gender receive the message.

## Deployment

Hosted deployments on Railway and Render are **currently offline**, so for now the bot runs locally (see *Getting started*). Notes for anyone hosting it:

- It needs an **always-on host** (a long-running process with persistent storage), so serverless platforms such as Vercel will not work.
- The dashboard runs on the `PORT` provided by the host (defaults to `3000`).
- WhatsApp session data is stored in `.wwebjs_auth/`. If that folder is not persisted between deploys, you will need to scan the QR code again after each redeploy.

## Roadmap

- [ ] Finish the migration to Baileys (no Chrome dependency, lighter to host)
- [ ] Get a stable hosted deployment running again
- [ ] Add authentication to the dashboard
- [ ] Multi-user version

## Privacy and safety

- **Never commit real contacts.** `contacts.csv` is git-ignored; only `contacts.example.csv` belongs in the repo.
- This project uses an **unofficial** WhatsApp library. Automated messaging can breach WhatsApp's terms and can get an account restricted, so only message people who know you and expect to hear from you.

## License

ISC

## Author

Praise Olomola ([@Shigerukamado](https://github.com/Shigerukamado))
