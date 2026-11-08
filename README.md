# Eden

A private, browser-based JavaScript error debugging companion. Paste an error message or stack trace to get a likely explanation and practical next steps. Analysis runs locally; no server or API key is required.

## Run locally

1. Open a terminal in the project folder.
2. Start a local web server:

   ```bash
   python3 -m http.server 8000
   ```

3. Visit <http://localhost:8000>.
4. Paste an error, choose **Try a sample error**, or select a recent analysis, then select **Analyze error**.

Clipboard copy works in browsers that provide the Clipboard API on secure contexts (HTTPS or localhost).

## Features

- Rule-based hints for common TypeError, ReferenceError, SyntaxError, network, HTTP, and async errors.
- Extracts common JavaScript stack frames and displays file, line, and column clues.
- Saves up to five recent analyses locally in your browser so you can reopen them; **Clear history** removes them.
- Dark/light theme toggle, sample error, clear action, character count, and copyable results.
- Pasted errors are never uploaded. History and theme preference use this browser's local storage.

The guidance is an offline starting point, not a definitive diagnosis. Check the relevant source code and runtime context before applying a fix.

## Files

- `index.html` — accessible page structure
- `styles.css` — responsive visual design and themes
- `app.js` — local error matching, stack parsing, history, and interactions
