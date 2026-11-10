# Trip Planner — Fiddler Everywhere demo app

A small web app that loads a 3-day forecast from **SkyCast**, an external weather API. The front end calls SkyCast directly from the browser. The app was "built by an AI coding agent", and it has one bug: the `Authorization` header is sent without the `Bearer` scheme, so SkyCast returns **401 Unauthorized**. The UI only shows a generic error.

SkyCast runs locally as a mock ([mock-api/skycast.js](mock-api/skycast.js)) so the demo is deterministic and uses no real credentials. In the story, treat it as a third-party service whose code and logs you can't see.

## Requirements

- Node.js 20.6 or later. No `npm install` step is needed because the app has no dependencies.
- Fiddler Everywhere. Capture with a browser that Fiddler opens (**Live Traffic → Browser**). The app needs no proxy settings.

## Run

```bash
# Terminal 1: the "third-party" API (keep this terminal off-screen)
npm run api

# Terminal 2: the app
npm run app
```

Open `http://localhost:3000` in the browser that Fiddler opened.

## Layout

| Path | Purpose |
| --- | --- |
| [public/skycast-client.js](public/skycast-client.js) | AI-generated API client. **The bug is here.** |
| [public/app.js](public/app.js) | UI logic. It hides the API error behind a generic message |
| [public/config.js](public/config.js) | SkyCast base URL and the demo API key |
| [server/index.js](server/index.js) | Static file server for `public/` |
| [mock-api/skycast.js](mock-api/skycast.js) | SkyCast mock. It requires `Authorization: Bearer <key>` |

## Branches

- `main`: the broken version used for recording.
- `solution`: the one-line fix, if you need a backup.

To reset between takes, run `git checkout -- public/skycast-client.js`.

See [RECORDING-GUIDE.md](RECORDING-GUIDE.md) for the step-by-step recording script.
