const form = document.getElementById('form')
const input = document.getElementById('input')
const conversation = document.getElementById('conversation')
const charCount = document.getElementById('char-count')
const historyList = document.getElementById('history-list')
const HISTORY_KEY = 'eden.analysis-history.v1'
const THEME_KEY = 'eden.theme.v1'

const samples = {
  type: `TypeError: Cannot read properties of undefined (reading 'name')\n    at renderProfile (src/profile.js:18:24)\n    at App (src/App.js:42:9)`,
  reference: `ReferenceError: userProfile is not defined\n    at renderProfile (src/profile.js:12:3)\n    at App (src/App.js:42:9)`,
  async: `Uncaught (in promise) TypeError: Failed to fetch\n    at async loadDashboard (src/api.js:28:18)\n    at async App (src/App.js:16:5)`
}

const diagnoses = [
  { category: 'Undefined value', severity: 'Common runtime error', match: /Cannot read propert(?:y|ies) of undefined|Cannot read propert(?:y|ies) of null|Cannot destructure propert(?:y|ies) of ['"]?\w+['"]? as it is (?:undefined|null)|undefined is not an object/i, title: 'A value is missing before it is used', summary: 'The code is reading a property from a value that is currently undefined or null. That value may still be loading, may not exist for this input, or may differ from the shape the code expects.', steps: ['Start at the first stack frame in your own source and inspect the exact property access.', 'Trace the value back to its source. Check whether an API response, prop, or function result can be missing.', 'Handle the missing state explicitly; avoid hiding a data-shape bug with a broad fallback.'], snippetTitle: 'Guard an optional value', snippet: 'if (profile == null) {\n  return null; // or render a loading / empty state\n}\n\nreturn profile.name' },
  { category: 'Null value', severity: 'Common runtime error', match: /Cannot read propert(?:y|ies) of null|Cannot read propert(?:y|ies) of (?:undefined|null)/i, title: 'A value is missing before it is used', summary: 'The code is reading a property from a nullish value. Verify whether the value is intentionally absent or whether an earlier step failed to populate it.', steps: ['Inspect the property access at the first application stack frame.', 'Check the value at runtime and find who sets it to null.', 'Add an explicit empty/loading branch if null is a valid state.'], snippetTitle: 'Check before reading', snippet: 'if (user == null) {\n  return; // choose the right empty state\n}\n\nconsole.log(user.name)' },
  { category: 'Wrong call / type', severity: 'Runtime error', match: /(?:\w+ )?is not a function|not a function/i, title: 'This value cannot be called as a function', summary: 'Something at the call site has a different type than expected. A mismatched import, misspelled method, or overwritten variable are common causes.', steps: ['Inspect the value immediately before the call using a breakpoint or console.log(typeof value).', 'Check the import/export and method spelling at the reported line.', 'Trace the value’s origin and compare its runtime shape with the expected API.'], snippetTitle: 'Check the value’s type', snippet: 'console.log({ value, type: typeof value })\n\nif (typeof value === \'function\') {\n  value()\n}' },
  { category: 'Missing name', severity: 'Runtime error', match: /ReferenceError:.*(?:not defined|is not defined)|\b\w+ is not defined\b/i, title: 'JavaScript cannot find this name in scope', summary: 'The identifier in the error is not available where it is being used. It may be misspelled, out of scope, or missing an import.', steps: ['Check the exact spelling and capitalization of the identifier.', 'Confirm its declaration is in scope and runs before this code path.', 'If it belongs to another module, verify the exported and imported names match.'], snippetTitle: 'Verify the module binding', snippet: '// profile.js\nexport const userProfile = { name: \'Ada\' }\n\n// consumer.js\nimport { userProfile } from \'./profile.js\'' },
  { category: 'Syntax / parse', severity: 'Parse error', match: /SyntaxError|Unexpected token|Unexpected end of (?:input|JSON)|unterminated (?:string|template)/i, title: 'The parser could not read this code or data', summary: 'A syntax error often comes from a missing delimiter or malformed input. If this happens while parsing JSON, the response might be empty or not JSON at all.', steps: ['Inspect the reported location and the line directly above it; parser locations can point after the real typo.', 'Check matching braces, parentheses, quotes, commas, and template-literal delimiters.', 'For JSON.parse, inspect the raw response and validate its status and content type first.'], snippetTitle: 'Validate a JSON response', snippet: 'const response = await fetch(url)\nif (!response.ok) throw new Error(`HTTP ${response.status}`)\nconst data = await response.json()' },
  { category: 'Network / fetch', severity: 'Request failed', match: /Failed to fetch|NetworkError|fetch failed|ERR_CONNECTION|Load failed/i, title: 'The browser could not complete a request', summary: 'The request did not produce a readable response. The server may be unavailable, the URL may be wrong, or browser security policy (such as CORS) may be blocking it.', steps: ['Inspect the request in DevTools → Network: URL, status, timing, and response.', 'Confirm the server is running and the URL, protocol, and port are correct.', 'If the console reports CORS, fix the server’s allowed-origin configuration; client code cannot bypass it.'], snippetTitle: 'Handle request failures', snippet: 'try {\n  const response = await fetch(url)\n  if (!response.ok) throw new Error(`HTTP ${response.status}`)\n  return await response.json()\n} catch (error) {\n  console.error(\'Request failed:\', error)\n  throw error\n}' },
  { category: 'HTTP 404', severity: 'Request returned an error', match: /\b404\b|Not Found/i, title: 'The server could not find this resource', summary: 'A 404 means a server responded, but there is no resource at the requested URL. This is different from a network connection failure.', steps: ['Read the full request URL in the Network panel and compare it with the expected route.', 'Check route spelling, capitalization, base path, and trailing slash.', 'Verify the route or file exists in the environment you are calling.'], snippetTitle: 'Check status before parsing', snippet: 'const response = await fetch(url)\nif (response.status === 404) {\n  throw new Error(`Route not found: ${url}`)\n}\nif (!response.ok) throw new Error(`HTTP ${response.status}`)' },
  { category: 'Unhandled async error', severity: 'Promise rejection', match: /UnhandledPromiseRejection|Uncaught \(in promise\)|Unhandled promise rejection/i, title: 'An asynchronous operation rejected without a handler', summary: 'A Promise failed, and this code path did not handle the rejection. The original cause may appear after the unhandled-rejection text.', steps: ['Find the awaited operation or Promise chain in the first relevant frame.', 'Handle the rejection where the app can recover meaningfully; preserve useful error details.', 'Decide what the user should see when the operation fails.'], snippetTitle: 'Handle an async failure', snippet: 'try {\n  const data = await loadData()\n  render(data)\n} catch (error) {\n  console.error(\'Could not load data:\', error)\n  showErrorState(error)\n}' },
  { category: 'Immutable assignment', severity: 'Runtime error', match: /Assignment to constant variable|Cannot assign to read only property/i, title: 'Code tried to change a value that cannot be reassigned', summary: 'The error points to reassignment of a const binding or a write to a read-only property. Check whether the value should be replaced or updated immutably.', steps: ['Find the assignment named in the stack trace.', 'Use let only if the binding itself must be reassigned; for state, prefer a new value.', 'Check whether the object is frozen or managed by an immutable state library.'], snippetTitle: 'Create an updated object', snippet: 'const nextUser = {\n  ...user,\n  name: updatedName\n}' },
  { category: 'JSON / data shape', severity: 'Data parsing', match: /JSON\.parse|Unexpected end of JSON|is not valid JSON/i, title: 'The input may not be valid JSON', summary: 'The parser expected JSON but received malformed, incomplete, or empty content. The response could also be an error page rather than JSON.', steps: ['Log the raw input safely before parsing and confirm it is non-empty.', 'Check the server status and Content-Type header.', 'Prefer response.json() for fetch responses and handle non-2xx statuses explicitly.'], snippetTitle: 'Check content before parsing', snippet: 'const text = await response.text()\nif (!text.trim()) throw new Error(\'Response was empty\')\nconst data = JSON.parse(text)' }
]

function parseFrames(message) {
  const pattern = /(?:at\s+([^\n(]+?)\s+\()?((?:https?:\/\/)?[^\s()]+\.(?:js|jsx|mjs|cjs|ts|tsx|vue|svelte)):(\d+)(?::(\d+))?\)?/g
  return [...message.matchAll(pattern)].slice(0, 8).map((match) => ({ name: match[1]?.trim() || '(anonymous)', file: match[2], line: match[3], column: match[4] || '—' }))
}

function analyze(message) {
  // More specific patterns must win when messages contain multiple signals.
  const ordered = [...diagnoses].sort((a, b) => {
    const priority = { 'Unhandled async error': 1, 'Network / fetch': 2, 'JSON / data shape': 3, 'HTTP 404': 4, 'Missing name': 5, 'Syntax / parse': 6, 'Immutable assignment': 7, 'Wrong call / type': 8, 'Undefined value': 9, 'Null value': 10 }
    return (priority[a.category] || 20) - (priority[b.category] || 20)
  })
  const diagnosis = ordered.find((item) => item.match.test(message))
  const frames = parseFrames(message)
  const explicitType = /\b(?:TypeError|ReferenceError|SyntaxError|RangeError|URIError|EvalError)\b/.test(message)
  const lineReference = /:\d+(?::\d+)?/.test(message)
  const confidence = diagnosis
    ? Math.min(96, 65 + (explicitType ? 12 : 0) + (frames.length ? 10 : 0) + (lineReference ? 5 : 0))
    : Math.min(54, 28 + (frames.length ? 12 : 0) + (lineReference ? 4 : 0))
  return {
    category: diagnosis?.category || 'Unclassified', severity: diagnosis?.severity || 'Needs investigation',
    title: diagnosis?.title || 'Let’s start with the first useful clue',
    summary: diagnosis?.summary || 'I couldn’t match this message to a known pattern with confidence. The first frame from your own code and the values on that line are the best place to begin.',
    steps: diagnosis?.steps || ['Find the earliest stack frame that points to your source code, not a browser or vendor bundle.', 'Inspect the exact expression and the values it uses at runtime.', 'Check the console and Network panel for an earlier error that may have triggered this one.'],
    snippetTitle: diagnosis?.snippetTitle || 'Add a focused diagnostic',
    snippet: diagnosis?.snippet || 'console.log({ value, type: typeof value })\n// Inspect the value immediately before the failing line.',
    matched: Boolean(diagnosis), frames, confidence
  }
}

function getHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(value) ? value.filter((item) => item && typeof item.message === 'string') : []
  } catch { return [] }
}

function saveHistory(message, result) {
  const items = getHistory().filter((item) => item.message !== message)
  items.unshift({ message, title: result.title, category: result.category, createdAt: Date.now() })
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 6))) } catch { /* Local storage may be unavailable. */ }
  renderHistory()
}

function renderHistory() {
  const items = getHistory()
  document.getElementById('history-empty').hidden = items.length > 0
  historyList.replaceChildren(...items.map((entry) => {
    const li = document.createElement('li')
    const button = document.createElement('button')
    button.className = 'history-item'
    button.type = 'button'
    const title = document.createElement('span')
    title.textContent = entry.title
    const detail = document.createElement('small')
    detail.textContent = `${entry.category} · ${new Date(entry.createdAt).toLocaleDateString()}`
    button.append(title, detail)
    button.addEventListener('click', () => {
      input.value = entry.message
      updateCount()
      runAnalysis(entry.message, false)
    })
    li.append(button)
    return li
  }))
}

function createMessage(className) {
  const message = document.createElement('article')
  message.className = `chat-message ${className}`
  return message
}

function appendAssistantAnalysis(message, data) {
  const article = createMessage('assistant-turn')
  const avatar = document.createElement('div')
  avatar.className = 'message-avatar'
  avatar.textContent = 'e'
  const body = document.createElement('div')
  body.className = 'message-body'
  const author = document.createElement('div')
  author.className = 'message-author'
  author.innerHTML = '<strong>Eden</strong><span>LOCAL DEBUG COMPANION</span>'
  const intro = document.createElement('p')
  intro.className = 'chat-prose'
  intro.textContent = data.matched ? 'I see a pattern here. Let’s treat this as a useful lead, not a verdict.' : 'I don’t want to guess too confidently. Here are the clues I’d start with.'

  const card = document.createElement('section')
  card.className = 'diagnostic-card'
  const cardTop = document.createElement('div')
  cardTop.className = 'diagnostic-card-top'
  const category = document.createElement('span')
  category.className = 'diagnostic-category'
  category.textContent = data.category
  const severity = document.createElement('span')
  severity.className = 'severity-label'
  severity.textContent = data.severity
  cardTop.append(category, severity)
  const title = document.createElement('h3')
  title.textContent = data.title
  const summary = document.createElement('p')
  summary.className = 'diagnostic-summary'
  summary.textContent = data.summary

  const confidence = document.createElement('div')
  confidence.className = 'confidence-block'
  const confidenceTop = document.createElement('div')
  confidenceTop.className = 'confidence-top'
  const confidenceLabel = document.createElement('span')
  confidenceLabel.textContent = 'MATCH CONFIDENCE'
  const confidenceValue = document.createElement('strong')
  confidenceValue.textContent = `${data.confidence}%`
  confidenceTop.append(confidenceLabel, confidenceValue)
  const meter = document.createElement('div')
  meter.className = 'confidence-meter'
  meter.setAttribute('role', 'meter')
  meter.setAttribute('aria-label', 'Heuristic pattern match confidence')
  meter.setAttribute('aria-valuemin', '0')
  meter.setAttribute('aria-valuemax', '100')
  meter.setAttribute('aria-valuenow', String(data.confidence))
  const fill = document.createElement('span')
  fill.style.width = `${data.confidence}%`
  meter.append(fill)
  const confidenceNote = document.createElement('small')
  confidenceNote.textContent = data.matched ? 'Heuristic signal score based on message and trace clues—not probability of a correct fix.' : 'No known pattern matched; score reflects only available trace clues.'
  confidence.append(confidenceTop, meter, confidenceNote)
  card.append(cardTop, title, summary, confidence)
  body.append(author, intro, card)

  if (data.frames.length) body.append(buildFramesCard(data.frames))
  body.append(buildSuggestionCard(data))
  body.append(buildFollowups(data))
  article.append(avatar, body)
  conversation.append(article)
}

function buildFramesCard(frames) {
  const section = document.createElement('section')
  section.className = 'detail-card trace-card'
  const heading = document.createElement('h4')
  heading.textContent = 'Stack trace clues'
  const list = document.createElement('ol')
  list.className = 'frame-list'
  frames.forEach((frame, index) => {
    const li = document.createElement('li')
    const indexLabel = document.createElement('span')
    indexLabel.className = 'frame-index'
    indexLabel.textContent = String(index + 1).padStart(2, '0')
    const code = document.createElement('code')
    code.textContent = `${frame.name} · ${frame.file}:${frame.line}:${frame.column}`
    li.append(indexLabel, code)
    list.append(li)
  })
  section.append(heading, list)
  return section
}

function buildSuggestionCard(data) {
  const section = document.createElement('section')
  section.className = 'detail-card suggestion-card'
  const headingRow = document.createElement('div')
  headingRow.className = 'suggestion-heading'
  const headingWrap = document.createElement('div')
  const eyebrow = document.createElement('p')
  eyebrow.className = 'eyebrow'
  eyebrow.textContent = 'A SAFE PLACE TO START'
  const heading = document.createElement('h4')
  heading.textContent = data.snippetTitle
  headingWrap.append(eyebrow, heading)
  const copy = document.createElement('button')
  copy.className = 'snippet-copy'
  copy.type = 'button'
  copy.textContent = 'Copy snippet'
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(data.snippet); copy.textContent = 'Copied ✓' }
    catch { copy.textContent = 'Unavailable' }
  })
  headingRow.append(headingWrap, copy)
  const pre = document.createElement('pre')
  const code = document.createElement('code')
  code.textContent = data.snippet
  pre.append(code)
  section.append(headingRow, pre)
  return section
}

function buildFollowups(data) {
  const section = document.createElement('div')
  section.className = 'followup-area'
  const prompt = document.createElement('p')
  prompt.textContent = 'Where do you want to go next?'
  const buttons = document.createElement('div')
  buttons.className = 'followup-buttons'
  const options = [
    ['first', 'What should I inspect first?'],
    ['simple', 'Explain it simply'],
    ['caution', 'Anything to watch out for?']
  ]
  options.forEach(([key, label]) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'followup-chip'
    button.textContent = label
    button.addEventListener('click', () => appendFollowup(key, data))
    buttons.append(button)
  })
  section.append(prompt, buttons)
  return section
}

function appendFollowup(key, data) {
  const answers = {
    first: data.frames.length ? `I’d begin at ${data.frames[0].file}:${data.frames[0].line}. That’s the first frame Eden could parse. Inspect the expression on that line, then trace the value one step upstream.` : 'Start at the exact line mentioned in the browser console. If there is no line number, reproduce the issue with a breakpoint and inspect the values immediately before the failing operation.',
    simple: data.summary,
    caution: 'Treat the suggested snippet as a pattern, not a drop-in patch. Keep the original error visible while debugging, and avoid broad try/catch or fallback values that can hide the real cause.'
  }
  const article = createMessage('assistant-turn followup-turn')
  const avatar = document.createElement('div')
  avatar.className = 'message-avatar'
  avatar.textContent = 'e'
  const body = document.createElement('div')
  body.className = 'message-body followup-answer'
  const author = document.createElement('div')
  author.className = 'message-author'
  author.innerHTML = '<strong>Eden</strong><span>FOLLOW-UP</span>'
  const text = document.createElement('p')
  text.className = 'chat-prose'
  text.textContent = answers[key]
  body.append(author, text)
  article.append(avatar, body)
  conversation.append(article)
  article.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function runAnalysis(message, save = true) {
  const data = analyze(message)
  document.getElementById('welcome-state').hidden = true
  conversation.querySelectorAll('.chat-message').forEach((item) => item.remove())
  const userTurn = createMessage('user-turn')
  const userAvatar = document.createElement('div')
  userAvatar.className = 'user-avatar'
  userAvatar.textContent = 'YOU'
  const userBody = document.createElement('div')
  userBody.className = 'user-message-body'
  const label = document.createElement('span')
  label.className = 'user-label'
  label.textContent = 'THE ERROR YOU SHARED'
  const text = document.createElement('pre')
  text.className = 'user-error'
  text.textContent = message.length > 1200 ? `${message.slice(0, 1200)}\n… (input clipped for display)` : message
  userBody.append(label, text)
  userTurn.append(userAvatar, userBody)
  conversation.append(userTurn)
  appendAssistantAnalysis(message, data)
  document.getElementById('session-number').textContent = `#${String(Date.now()).slice(-4)}`
  document.getElementById('conversation-footer').innerHTML = '<span><i class="status-dot"></i> Analysis complete</span><span>LOCAL PATTERN MATCH</span>'
  if (save) saveHistory(message, data)
  const last = conversation.lastElementChild
  last.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function updateCount() { charCount.textContent = `${input.value.length} / 5000` }
input.addEventListener('input', updateCount)
form.addEventListener('submit', (event) => {
  event.preventDefault()
  const message = input.value.trim()
  if (message) runAnalysis(message)
  else input.focus()
})
input.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') form.requestSubmit()
})
document.querySelectorAll('.example-chip').forEach((button) => {
  button.addEventListener('click', () => {
    input.value = samples[button.dataset.example]
    updateCount()
    input.focus()
  })
})
document.getElementById('clear-history').addEventListener('click', () => {
  try { localStorage.removeItem(HISTORY_KEY) } catch { /* Storage may be disabled. */ }
  renderHistory()
})

const themeToggle = document.getElementById('theme-toggle')
function setTheme(theme) {
  document.documentElement.dataset.theme = theme
  const dark = theme === 'dark'
  themeToggle.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`)
  themeToggle.title = `Switch to ${dark ? 'light' : 'dark'} theme`
  themeToggle.firstElementChild.textContent = dark ? '☼' : '☾'
  try { localStorage.setItem(THEME_KEY, theme) } catch { /* Theme still works for this page view. */ }
}
themeToggle.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'))
try { setTheme(localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark') } catch { setTheme('dark') }
renderHistory()
