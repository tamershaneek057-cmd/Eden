# Eden

Eden is a private, browser-based JavaScript debugging companion with a chat-style interface. It analyzes pasted errors with local, transparent pattern matching—there is no connected AI service, account, or upload.

## Run locally

1. Open a terminal in the project folder.
2. Start a local web server:

   ```bash
   python3 -m http.server 8000
   ```

3. Visit <http://localhost:8000>.
4. Paste an error or choose an example, then select **Start a session** (or press Ctrl/⌘ + Enter).

## Features

- Conversational diagnostic cards with error category, severity hint, and a heuristic match-confidence score.
- Common JavaScript runtime, scope, syntax, network, HTTP, JSON, and async patterns.
- Stack-frame clues and contextual fix-pattern snippets with copy support.
- Local follow-up prompts, recent session history, and a light/dark theme.
- All analysis runs locally. Recent sessions and theme preference are kept in this browser's local storage.

Confidence is a heuristic signal-strength score based on the matched message pattern and available stack-trace clues. It is not a probability that the diagnosis or code suggestion is correct. Snippets are examples to adapt, not automatic patches. Review your code and runtime context before applying changes.

## Files

- `index.html` — chat-style debugging workspace
- `styles.css` — cinematic responsive interface and themes
- `app.js` — local classification, confidence heuristic, stack parsing, suggestions, and history
