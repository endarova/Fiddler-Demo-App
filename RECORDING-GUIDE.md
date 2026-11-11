# Recording guide: Debugging an AI-generated app when a third-party API fails

The demo follows three steps: **Understand**, **Reproduce** and **Resolve**. It covers one bug, one external API and one complete debugging story.

---

## 0. Pre-flight (off camera)

1. Start Fiddler Everywhere and sign in.
2. Enable the Fiddler MCP server (**Settings → MCP Server**) and confirm that your coding agent (VS Code Copilot / Claude Code / Cursor) lists the Fiddler tools.
   - In VS Code, open new chat in  Copilot and paste this into the agent chat:

```text
List all available Fiddler MCP tools and briefly explain what each tool does.
```
3. Reset the repo to the broken state:
   ```bash
   git checkout main && git checkout -- .
   ```
4. Terminal 1, run: `npm run api`
5. Terminal 2 run: `npm run app`
7. In Fiddler, open a capturing browser (**Live Traffic → Browser**) and go to `http://localhost:3000`.

> **Why a Fiddler browser?** The app calls SkyCast from the browser. A browser that Fiddler opens is already set up for capture, including `localhost` traffic. The app needs no configuration. When you narrate this, say: *"I open the app in a browser that Fiddler captures."* Don't turn it into a setup tutorial.

---

## 1. Establish the problem (≈1 min)

1. Select **Sofia** and click **Check forecast**.
2. The UI shows a spinner, then **"Something went wrong. Please try again later."**
3. The code doesn't log the real API error.
4. Open [public/skycast-client.js](public/skycast-client.js) briefly. Scroll past the bug without pointing at it.
   - Narration: *"The code looks reasonable. It reads the API key and calls SkyCast. But I can't tell what SkyCast actually received or why it rejected the call. I don't own that service, and I can't see its logs."*

**Takeaway:** The failure happens somewhere between my app and a service I don't control.

---

## 2. Understand (≈3 min): Fiddler + Fiddler MCP

### 2a. Use the mcp to get insights for the failed requests in the coding agent directly
1. Check Fiddler captured the sessions from your app:
Paste this into the agent chat:

```text
Are there any captured sessions in Fiddler? Give me a brief overview of the captured traffic.
```
2. Narrow dowh to the failed sessions: 
Paste this into the agent chat:

```text
In Fiddler filter the requests that have failed and show me details for them
```

3. Examine teh details. unauthorized — “Missing or invalid credentials.” error is visible there


### 2b. Show the evidence in Fiddler

1. Switch to Fiddler → **Live Traffic**.
3. Select the session with double click (this will open directly the most appropriate inspector). Show:
   - **URL:** `GET http://localhost:4001/v1/forecast?city=Sofia&days=3&units=metric`
   - **Status:** `401 Unauthorized`
   - **Request → Headers:** `Authorization: skc_demo_7f3a9e2b41c84d06`. There is **no scheme**.
   - **Response → Headers:** `WWW-Authenticate: Bearer realm="skycast-api", error="invalid_request"`
   - **Response → Body:** `{"error":"unauthorized","message":"Missing or invalid credentials."}`

### 2c. Ask the coding agent to diagnose it from real traffic (MCP)

Paste this into the agent chat:

```text
Analyze the failed sessions and identify the most likely reason for the failure.
Suggest how to fix it.
```

Expected result: the agent lists sessions, opens the 401 session and points out that `Authorization` holds a bare key while `WWW-Authenticate` asks for the `Bearer` scheme.

If the agent tryes to use different method rather fiddler tools, follow up with:

```text
Base your conclusions on the captured traffic in Fiddler.
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
in public/skycast-client.js. Make the smallest possible change.
```

Expected diff in [public/skycast-client.js](public/skycast-client.js):

```diff
-      Authorization: SKYCAST_API_KEY,
+      Authorization: `Bearer ${SKYCAST_API_KEY}`,
```

Review the diff on camera and accept it. Reload the page in the Fiddler browser. No restart is needed.

**Takeaway:** Fiddler gave the agent trustworthy evidence, so the agent made the right fix.

---

## 5. Validate (≈1–2 min)

1. In Fiddler, clear sessions, or keep the failed session for comparison.
2. In the app, click **Check forecast** for Sofia again. The forecast renders.
3. In Fiddler, show the new session: `Authorization: Bearer …`, `200 OK` and the forecast payload.
4. Optional: select the failed and successful sessions → right-click → **Compare** to show the header difference side by side.
5. Optional MCP validation prompt:
   ```text
   Using Fiddler, confirm the latest /v1/forecast request succeeded 
   ```
(Comparing the headers is not possible by default here because Fiddler MCP sanitizes the output for sensitive data before sending it to the coding agent, so the token is not visible to the agent. But if we want to show that too, we need to disable sanitization in the Fiddler app settings:: **Settings → Sanitization ->uncheck: Sanitize mcp output**)

**Takeaway:** Runtime evidence verifies the fix. You don't have to assume the code change worked.

---

## Backup path: If MCP behaves unpredictably

- **Fallback A: Manual evidence.** Skip 2b and stay in Fiddler for the Understand step. In step 4, paste the evidence into the agent manually:
  ```text
  The SkyCast API returns 401. Captured request header: "Authorization: skc_demo_...".
  Response header: WWW-Authenticate: Bearer realm="skycast-api", error="invalid_request".
  A replay with "Authorization: Bearer <key>" returned 200. Fix public/skycast-client.js.
  ```
- **Fallback B: If narowing down the failed session with the mcp didn't work.** 2. Filter to the external API by typing `localhost:4001` or `/v1/forecast` in the search box. You can also add a URL filter that contains `/v1/forecast`. The browser first sends an `OPTIONS` CORS preflight (204). Select the `GET` session that follows it.
- **Fallback c: Pre-recorded sessions.** Before recording, save the failed and fixed sessions as a `.saz` archive. If live capture fails, load the archive and continue.
- **Fallback D: Fix not applied.** Run `git checkout solution -- public/skycast-client.js`.
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








