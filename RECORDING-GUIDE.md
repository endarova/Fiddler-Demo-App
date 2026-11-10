# Recording guide: Debugging an AI-generated app when a third-party API fails

The demo follows three steps: **Understand**, **Reproduce** and **Resolve**. It covers one bug, one external API and one complete debugging story.

---

## 0. Pre-flight (off camera)

1. Start Fiddler Everywhere, sign in and turn on **Network Capture**. The app doesn't use any proxy settings, so Network Capture is what picks up its server-side call to SkyCast.
2. Enable the Fiddler MCP server (**Settings → MCP Server**) and confirm that your coding agent (VS Code Copilot / Claude Code / Cursor) lists the Fiddler tools.
   - In VS Code, open the Copilot Chat tools picker and confirm that `fiddler` tools such as `get_sessions`, `get_session_details` and `apply_filters` are enabled.
3. Reset the repo to the broken state:
   ```bash
   git checkout main && git checkout -- .
   ```
4. Terminal 1, kept off-screen or minimized: `npm run api`
5. Terminal 2: `npm run app`
6. In Fiddler, clear all sessions.
7. Open `http://localhost:3000` in the browser.
8. Do a dry run: click **Check forecast** and confirm that a `/v1/forecast` session appears in Fiddler.

> **If the localhost call doesn't show up:** Network Capture may not see loopback traffic. Point the app at your machine's LAN IP instead. Set `SKYCAST_BASE_URL=http://<your-LAN-IP>:4001` in `.env` and restart `npm run app`. The mock already listens on all interfaces. Use the same host in the filters below.

---

## 1. Establish the problem (≈1 min)

1. Select **Sofia** and click **Check forecast**.
2. The UI shows a spinner, then **"Something went wrong. Please try again later."**
3. Terminal 2 only shows `Failed to load forecast: Forecast request failed`.
4. Open [server/skycast-client.js](server/skycast-client.js) briefly. Scroll past the bug without pointing at it.
   - Narration: *"The code looks reasonable. It reads the API key and calls SkyCast. But I can't tell what SkyCast actually received or why it rejected the call. I don't own that service, and I can't see its logs."*

**Takeaway:** The failure happens somewhere between my app and a service I don't control.

---

## 2. Understand (≈3 min): Fiddler + Fiddler MCP

### 2a. Show the evidence in Fiddler

1. Switch to Fiddler → **Live Traffic**.
2. Filter to the external API by typing `localhost:4001` or `/v1/forecast` in the search box. You can also add a URL filter that contains `/v1/forecast`.
3. Select the session. Show:
   - **URL:** `GET http://localhost:4001/v1/forecast?city=Sofia&days=3&units=metric`
   - **Status:** `401 Unauthorized`
   - **Request → Headers:** `Authorization: skc_demo_7f3a9e2b41c84d06`. There is **no scheme**.
   - **Response → Headers:** `WWW-Authenticate: Bearer realm="skycast-api", error="invalid_request"`
   - **Response → Body:** `{"error":"unauthorized","message":"Missing or invalid credentials."}`

### 2b. Ask the coding agent to diagnose it from real traffic (MCP)

Paste this into the agent chat:

```text
My Trip Planner app shows "Something went wrong" when loading the forecast.
Use the Fiddler MCP tools to find the captured requests to the SkyCast API
(host localhost:4001, path /v1/forecast). Inspect the failing session's request
headers, response status, response headers and body. Explain the root cause
based only on that traffic evidence. Don't change any code yet.
```

Expected result: the agent lists sessions, opens the 401 session and points out that `Authorization` holds a bare key while `WWW-Authenticate` asks for the `Bearer` scheme.

If the agent picks the wrong session, follow up with:

```text
Use only the most recent session whose URL contains /v1/forecast and whose status is 401.
```

**Takeaway:** The agent reasons from real request and response evidence, not by guessing from the source code.

---

## 3. Reproduce (≈2 min): Prove the fix before touching code

1. In Fiddler, right-click the 401 session → **Edit in Composer**.
2. In the request headers, change:
   ```text
   Authorization: skc_demo_7f3a9e2b41c84d06
   ```
   to:
   ```text
   Authorization: Bearer skc_demo_7f3a9e2b41c84d06
   ```
3. Click **Execute**. Show the **200 OK** status and the JSON body with the `location` and 3-day `forecast`.
4. Optional contrast: change the key to a wrong value with `Bearer` and execute again. The response is still 401, now with `error="invalid_token"`. This shows that the scheme was the problem, not the key.

**Takeaway:** The diagnosis is proven against the real service before any code changes.

---

## 4. Resolve (≈2 min): Agent applies the fix

Paste this into the agent chat:

```text
Based on the Fiddler evidence (401 + WWW-Authenticate: Bearer, and the successful
Composer replay with "Authorization: Bearer <key>"), fix the Authorization header
in server/skycast-client.js. Make the smallest possible change.
```

Expected diff in [server/skycast-client.js](server/skycast-client.js):

```diff
-      Authorization: API_KEY,
+      Authorization: `Bearer ${API_KEY}`,
```

Review the diff on camera and accept it. Restart Terminal 2 with `Ctrl+C`, then `npm run app`.

**Takeaway:** Fiddler gave the agent trustworthy evidence, so the agent made the right fix.

---

## 5. Validate (≈1–2 min)

1. In Fiddler, clear sessions, or keep the failed session for comparison.
2. In the app, click **Check forecast** for Sofia again. The forecast renders.
3. In Fiddler, show the new session: `Authorization: Bearer …`, `200 OK` and the forecast payload.
4. Optional: select the failed and successful sessions → right-click → **Compare** to show the header difference side by side.
5. Optional MCP validation prompt:
   ```text
   Using Fiddler, confirm the latest /v1/forecast request succeeded and compare its
   Authorization header with the earlier failing request.
   ```

**Takeaway:** Runtime evidence verifies the fix. You don't have to assume the code change worked.

---

## Backup path: If MCP behaves unpredictably

- **Fallback A: Manual evidence.** Skip 2b and stay in Fiddler for the Understand step. In step 4, paste the evidence into the agent manually:
  ```text
  The SkyCast API returns 401. Captured request header: "Authorization: skc_demo_...".
  Response header: WWW-Authenticate: Bearer realm="skycast-api", error="invalid_request".
  A replay with "Authorization: Bearer <key>" returned 200. Fix server/skycast-client.js.
  ```
- **Fallback B: Pre-recorded sessions.** Before recording, save the failed and fixed sessions as a `.saz` archive. If live capture fails, load the archive and continue.
- **Fallback C: Fix not applied.** Run `git checkout solution -- server/skycast-client.js`.
- If MCP tool calls fail, confirm that Fiddler is running and signed in, that the MCP server is enabled, and that the agent's MCP config has the current API key. Restart the agent's MCP connection.

---

## Do-not-show list

- Fiddler account email, license details or the **MCP API key**, including MCP config files such as `.vscode/mcp.json` and `~/.claude.json`.
- Unrelated captured traffic, such as browser tabs, Teams, Outlook or internal Progress hosts. Clear sessions before each take and filter the views.
- Real tokens or cookies from any other service.
- The off-screen SkyCast mock terminal and [mock-api/skycast.js](mock-api/skycast.js). The story is that you don't own this service.
- The `solution` branch.
- The demo key `skc_demo_…` is fake and only accepted by the local mock, so it **is** safe to show.

---

## Loom checklist (internal, 10–15 min)

| # | Item | Where |
| --- | --- | --- |
| 1 | Sample app and repo | README, folder tour |
| 2 | Run locally | `npm run api`, `npm run app` |
| 3 | Broken version | `main`, `server/skycast-client.js` |
| 4 | Trigger action | Sofia → **Check forecast** |
| 5 | Fiddler capture setup | Pre-flight, Network Capture |
| 6 | Filter used | `/v1/forecast` or `localhost:4001` |
| 7 | Fields to inspect | URL, 401, request `Authorization`, response `WWW-Authenticate`, body |
| 8 | Replay and edit | Composer, add `Bearer ` |
| 9 | Exact code fix | `` Authorization: `Bearer ${API_KEY}` `` |
| 10 | Validation capture | 200 session, optional Compare |
| 11 | MCP setup and prompts | Pre-flight steps 2 and 2b, 4 and 5 prompts |
| 12 | MCP backup path | Section above |
