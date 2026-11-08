const form = document.getElementById('form')
const input = document.getElementById('input')
const result = document.getElementById('result')
const resultSummary = document.getElementById('result-summary')
const steps = document.getElementById('steps')
const charCount = document.getElementById('char-count')
const copyButton = document.getElementById('copy')

const sampleError = `TypeError: Cannot read properties of undefined (reading 'name')\n    at renderProfile (src/profile.js:18:24)\n    at App (src/App.js:42:9)`

const diagnoses = [
  {
    match: /Cannot read propert(?:y|ies) of (?:undefined|null)|cannot read (?:propert(?:y|ies)|length) of (?:undefined|null)/i,
    title: 'A value is missing before it is used',
    summary: 'Code is trying to access a property on a value that is currently null or undefined. The value may not have been initialized, loaded, or returned in the shape you expect.',
    steps: ['Use the first file and line number in the stack trace to find the property access.', 'Trace where that value comes from; check API responses, function return values, and component props.', 'If the value is optional, add an intentional loading/empty state or guard before accessing its property.']
  },
  {
    match: /(?:\w+ )?is not a function|not a function/i,
    title: 'Something is being called like a function, but isn’t one',
    summary: 'The value at the call site is not callable. A misspelled method, unexpected data shape, or overwritten variable are common causes.',
    steps: ['Find the call in the first relevant stack-trace frame.', 'Inspect the value immediately before the call (for example with a breakpoint or console.log).', 'Check spelling, imports, and whether the value has the type you expect.']
  },
  {
    match: /ReferenceError:.*(?:not defined|is not defined)|\b(?:is not defined|not defined)\b/i,
    title: 'A name is being used outside its available scope',
    summary: 'JavaScript cannot find the variable or function named in the error. It may be misspelled, not imported, or declared in a different scope.',
    steps: ['Check the exact identifier named in the error, including capitalization.', 'Confirm it is declared before use and in the current scope.', 'If it comes from another file, verify the import/export and the imported name.']
  },
  {
    match: /SyntaxError|Unexpected token|Unexpected end of (?:input|JSON)/i,
    title: 'The parser found code or data it could not read',
    summary: 'A syntax error usually points to a typo or malformed input. For JSON errors, the response may be empty or may not actually be JSON.',
    steps: ['Start at the reported file and line; also inspect the line immediately above it.', 'Check matching brackets, quotes, commas, and template-literal delimiters.', 'If parsing JSON, inspect the raw input and handle empty or non-JSON responses.']
  },
  {
    match: /Failed to fetch|NetworkError|fetch failed|ERR_CONNECTION|Load failed/i,
    title: 'The browser could not complete a network request',
    summary: 'The request may be blocked, unavailable, or pointed at the wrong address. Browser network errors can also be caused by CORS configuration.',
    steps: ['Open the browser Network panel and inspect the request URL, status, and response.', 'Confirm the server is running and the URL, protocol, and port are correct.', 'If the console mentions CORS, configure the server to allow the page origin; client-side code cannot bypass that policy.']
  },
  {
    match: /\b(?:404|Not Found)\b/i,
    title: 'The requested resource was not found',
    summary: 'A 404 means the server responded, but did not find a resource at the requested URL.',
    steps: ['Inspect the full request URL in the Network panel.', 'Check route names, path capitalization, and any base URL or trailing-slash assumptions.', 'Verify the resource exists in the environment you are running against.']
  }
]

function analyze(message) {
  const diagnosis = diagnoses.find((item) => item.match.test(message))
  if (diagnosis) return diagnosis

  return {
    title: 'Start with the first useful stack-trace frame',
    summary: 'Eden could not confidently match this message to a common JavaScript error. The stack trace and the code around the first frame are usually the best clues.',
    steps: ['Look for the first frame that points to your own source file, rather than a library or browser internals.', 'Inspect the exact line and the values it uses; reproduce the issue with the smallest possible input.', 'Check the browser console and Network panel for an earlier error that may have triggered this one.']
  }
}

function renderAnalysis(message) {
  const diagnosis = analyze(message)
  document.getElementById('result-title').textContent = diagnosis.title
  resultSummary.textContent = diagnosis.summary
  steps.replaceChildren(...diagnosis.steps.map((step) => {
    const item = document.createElement('li')
    item.textContent = step
    return item
  }))
  result.hidden = false
  copyButton.textContent = 'Copy'
}

input.addEventListener('input', () => {
  charCount.textContent = `${input.value.length} / 5000`
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const message = input.value.trim()
  if (!message) {
    input.focus()
    return
  }
  renderAnalysis(message)
})

document.getElementById('sample').addEventListener('click', () => {
  input.value = sampleError
  input.dispatchEvent(new Event('input'))
  input.focus()
})

document.getElementById('clear').addEventListener('click', () => {
  input.value = ''
  input.dispatchEvent(new Event('input'))
  result.hidden = true
  input.focus()
})

copyButton.addEventListener('click', async () => {
  const text = `${document.getElementById('result-title').textContent}\n\n${resultSummary.textContent}\n\nThings to check:\n${Array.from(steps.children, (item) => `- ${item.textContent}`).join('\n')}`
  try {
    await navigator.clipboard.writeText(text)
    copyButton.textContent = 'Copied'
  } catch {
    copyButton.textContent = 'Copy unavailable'
  }
})
