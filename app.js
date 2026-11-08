const form = document.getElementById('form')
const input = document.getElementById('input')
const result = document.getElementById('result')
const resultSummary = document.getElementById('result-summary')
const steps = document.getElementById('steps')
const charCount = document.getElementById('char-count')
const copyButton = document.getElementById('copy')
const historyList = document.getElementById('history-list')
const HISTORY_KEY = 'eden.analysis-history.v1'
const THEME_KEY = 'eden.theme.v1'

const sampleError = `TypeError: Cannot read properties of undefined (reading 'name')\n    at renderProfile (src/profile.js:18:24)\n    at App (src/App.js:42:9)`

const diagnoses = [
  { category: 'TypeError', match: /Cannot read propert(?:y|ies) of (?:undefined|null)|cannot read (?:propert(?:y|ies)|length) of (?:undefined|null)/i, title: 'A value is missing before it is used', summary: 'Code is trying to access a property on a value that is currently null or undefined. It may not have been initialized, loaded, or returned in the shape you expect.', steps: ['Use the first application file and line in the stack trace to find the property access.', 'Trace where the value comes from; check API responses, function returns, and component props.', 'If the value is optional, add an intentional loading/empty state or guard before accessing its property.'] },
  { category: 'TypeError', match: /(?:\w+ )?is not a function|not a function/i, title: 'Something is being called like a function, but isn’t one', summary: 'The value at the call site is not callable. A misspelled method, unexpected data shape, or overwritten variable are common causes.', steps: ['Find the call in the first relevant stack-trace frame.', 'Inspect the value immediately before the call with a breakpoint or console.log.', 'Check spelling, imports, and whether the value has the type you expect.'] },
  { category: 'ReferenceError', match: /ReferenceError:.*(?:not defined|is not defined)|\b(?:is not defined|not defined)\b/i, title: 'A name is being used outside its available scope', summary: 'JavaScript cannot find the variable or function named in the error. It may be misspelled, not imported, or declared in a different scope.', steps: ['Check the exact identifier named in the error, including capitalization.', 'Confirm it is declared before use and in the current scope.', 'If it comes from another file, verify the import/export and imported name.'] },
  { category: 'SyntaxError', match: /SyntaxError|Unexpected token|Unexpected end of (?:input|JSON)/i, title: 'The parser found code or data it could not read', summary: 'A syntax error usually points to a typo or malformed input. For JSON errors, the response may be empty or may not actually be JSON.', steps: ['Start at the reported file and line; also inspect the line immediately above it.', 'Check matching brackets, quotes, commas, and template-literal delimiters.', 'If parsing JSON, inspect the raw input and handle empty or non-JSON responses.'] },
  { category: 'Network', match: /Failed to fetch|NetworkError|fetch failed|ERR_CONNECTION|Load failed/i, title: 'The browser could not complete a network request', summary: 'The request may be blocked, unavailable, or pointed at the wrong address. Browser network errors can also be caused by CORS configuration.', steps: ['Open the browser Network panel and inspect the request URL, status, and response.', 'Confirm the server is running and the URL, protocol, and port are correct.', 'If the console mentions CORS, configure the server to allow the page origin; client-side code cannot bypass that policy.'] },
  { category: 'HTTP', match: /\b(?:404|Not Found)\b/i, title: 'The requested resource was not found', summary: 'A 404 means the server responded, but did not find a resource at the requested URL.', steps: ['Inspect the full request URL in the Network panel.', 'Check route names, path capitalization, and base URL or trailing-slash assumptions.', 'Verify the resource exists in the environment you are running against.'] },
  { category: 'Async', match: /UnhandledPromiseRejection|Uncaught \(in promise\)|Unhandled promise rejection/i, title: 'An asynchronous operation rejected without being handled', summary: 'A Promise rejected and no handler dealt with the failure. The underlying reason is often included after the rejection message.', steps: ['Inspect the rejection reason and the async operation that produced it.', 'Add appropriate try/catch around await, or a .catch() handler for the Promise chain.', 'Decide how the UI should recover or communicate the failure; avoid silently swallowing it.'] },
  { category: 'TypeError', match: /\b(?:Assignment to constant variable|Cannot assign to read only property)\b/i, title: 'Code tried to change a value that cannot be reassigned', summary: 'The error points to reassignment of a const binding or mutation of a read-only property.', steps: ['Find the assignment named in the stack trace.', 'If the binding should change, use let; if it is an object property, check whether the object is frozen or immutable.', 'Prefer creating a new object when working with immutable state.'] }
]

function analyze(message) {
  const diagnosis = diagnoses.find((item) => item.match.test(message)) || {
    category: 'Unclassified', title: 'Start with the first useful stack-trace frame',
    summary: 'Eden could not confidently match this message to a common JavaScript error. The stack trace and code around the first frame are usually the best clues.',
    steps: ['Look for the first frame that points to your own source file, rather than a library or browser internals.', 'Inspect the exact line and values it uses; reproduce the issue with the smallest possible input.', 'Check the browser console and Network panel for an earlier error that may have triggered this one.']
  }
  return { ...diagnosis, frames: parseFrames(message) }
}

function parseFrames(message) {
  const matches = [...message.matchAll(/(?:at\s+([^\n(]+?)\s+\()?((?:https?:\/\/)?[^\s()]+\.(?:js|jsx|mjs|cjs|ts|tsx|vue|svelte)):(\d+):(\d+)\)?/g)]
  return matches.slice(0, 8).map((match) => ({ functionName: match[1]?.trim() || '(anonymous)', file: match[2], line: match[3], column: match[4] }))
}

function getHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(value) ? value.filter((item) => typeof item.message === 'string') : []
  } catch { return [] }
}

function saveHistory(message, diagnosis) {
  const history = getHistory().filter((item) => item.message !== message)
  history.unshift({ message, title: diagnosis.title, category: diagnosis.category, createdAt: Date.now() })
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 5))) } catch { /* Storage may be disabled or full. */ }
  renderHistory()
}

function renderHistory() {
  const history = getHistory()
  document.getElementById('history-empty').hidden = history.length > 0
  historyList.replaceChildren(...history.map((item) => {
    const li = document.createElement('li')
    const button = document.createElement('button')
    button.className = 'history-item'
    button.type = 'button'
    const title = document.createElement('span')
    title.className = 'history-item-title'
    title.textContent = item.title
    const detail = document.createElement('span')
    detail.className = 'history-item-detail'
    detail.textContent = `${item.category} · ${new Date(item.createdAt).toLocaleString()}`
    button.append(title, detail)
    button.addEventListener('click', () => {
      input.value = item.message
      updateCharCount()
      renderAnalysis(item.message, false)
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
    li.append(button)
    return li
  }))
}

function renderAnalysis(message, save = true) {
  const diagnosis = analyze(message)
  document.getElementById('result-title').textContent = diagnosis.title
  document.getElementById('result-category').textContent = diagnosis.category
  resultSummary.textContent = diagnosis.summary
  steps.replaceChildren(...diagnosis.steps.map((step) => {
    const item = document.createElement('li')
    item.textContent = step
    return item
  }))
  const framesSection = document.getElementById('frames-section')
  const frames = document.getElementById('frames')
  framesSection.hidden = diagnosis.frames.length === 0
  frames.replaceChildren(...diagnosis.frames.map((frame) => {
    const item = document.createElement('li')
    const code = document.createElement('code')
    code.textContent = `${frame.functionName} — ${frame.file}:${frame.line}:${frame.column}`
    item.append(code)
    return item
  }))
  result.hidden = false
  copyButton.textContent = 'Copy'
  if (save) saveHistory(message, diagnosis)
}

function updateCharCount() { charCount.textContent = `${input.value.length} / 5000` }

input.addEventListener('input', updateCharCount)
form.addEventListener('submit', (event) => {
  event.preventDefault()
  const message = input.value.trim()
  if (!message) { input.focus(); return }
  renderAnalysis(message)
})

document.getElementById('sample').addEventListener('click', () => {
  input.value = sampleError
  updateCharCount()
  input.focus()
})
document.getElementById('clear').addEventListener('click', () => {
  input.value = ''
  updateCharCount()
  result.hidden = true
  input.focus()
})
document.getElementById('clear-history').addEventListener('click', () => {
  try { localStorage.removeItem(HISTORY_KEY) } catch { /* Storage may be disabled. */ }
  renderHistory()
})

copyButton.addEventListener('click', async () => {
  const frameText = Array.from(document.getElementById('frames').children, (item) => `- ${item.textContent}`).join('\n')
  const text = `${document.getElementById('result-title').textContent} [${document.getElementById('result-category').textContent}]\n\n${resultSummary.textContent}${frameText ? `\n\nStack trace clues:\n${frameText}` : ''}\n\nThings to check:\n${Array.from(steps.children, (item) => `- ${item.textContent}`).join('\n')}`
  try { await navigator.clipboard.writeText(text); copyButton.textContent = 'Copied' }
  catch { copyButton.textContent = 'Copy unavailable' }
})

const themeToggle = document.getElementById('theme-toggle')
function setTheme(theme) {
  document.documentElement.dataset.theme = theme
  const isDark = theme === 'dark'
  themeToggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`)
  themeToggle.title = `Switch to ${isDark ? 'light' : 'dark'} theme`
  themeToggle.firstElementChild.textContent = isDark ? '☼' : '☾'
  try { localStorage.setItem(THEME_KEY, theme) } catch { /* Theme still works for this page view. */ }
}
themeToggle.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'))
try { setTheme(localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark') } catch { setTheme('dark') }
renderHistory()
