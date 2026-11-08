# Eden

A private, browser-based JavaScript error debugging companion. Paste an error message or stack trace to get a likely explanation and practical next steps. Analysis runs locally in your browser; no server or API key is required.

## Run locally

1. Open a terminal in the project folder.
2. Start a local web server:

   ```bash
   python3 -m http.server 8000
   ```

3. Visit <http://localhost:8000>.
4. Paste an error, or choose **Try a sample error**, then select **Analyze error**.

Clipboard copy works in browsers that provide the Clipboard API on secure contexts (HTTPS or localhost).

## What it does

- Recognizes several common JavaScript error patterns and offers a likely cause plus debugging checks.
- Provides a general stack-trace checklist when it cannot match an error.
- Keeps analysis in the browser; it does not send or save pasted errors.
- Includes a sample, clear action, character limit, and copyable analysis.

The guidance is rule-based and is not a substitute for checking the relevant code and runtime context.

## Files

- `index.html` — accessible page structure
- `styles.css` — responsive visual design
- `app.js` — local error matching and interactions
