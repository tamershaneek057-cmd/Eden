# Eden

Eden is a private, browser-based JavaScript debugging companion with an AI-inspired assistant interface. It uses transparent, local pattern matching—not a connected AI model—to explain common error messages and suggest practical next steps.

## Run locally

1. Open a terminal in the project folder.
2. Start a local web server:

   ```bash
   python3 -m http.server 8000
   ```

3. Visit <http://localhost:8000>.
4. Paste an error, choose one of the example chips, then select **Analyze error** (or press Ctrl/⌘ + Enter).

Clipboard copy works in browsers that provide the Clipboard API on secure contexts (HTTPS or localhost).

## Features

- Assistant-style interface with responsive light and dark themes.
- Local pattern matching for common TypeError, ReferenceError, SyntaxError, network, HTTP, and async errors.
- Stack-frame extraction with file, line, and column clues where present in the pasted text.
- Clear suggestions, one-click examples, copyable notes, and recent analysis history.
- Keeps analysis in the browser. History and theme preference use local storage on this device.

This is offline, rule-based guidance rather than an AI diagnosis. It does not upload pasted errors or connect to an AI service. Check the relevant source code and runtime context before applying a fix.

## Files

- `index.html` — assistant interface and accessible controls
- `styles.css` — responsive visual design and themes
- `app.js` — local error matching, stack parsing, history, and interactions
