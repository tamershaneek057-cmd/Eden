export function setupEdenApp(root = document) {
  const form = root.getElementById('form')
  const input = root.getElementById('input')
  const out = root.getElementById('out')
  const status = root.getElementById('status')

  if (!form || !input || !out || !status) {
    return
  }

  const updateStatus = (message) => {
    status.textContent = message
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const value = input.value.trim()

    if (!value) {
      updateStatus('Type something first.')
      out.textContent = 'No message yet.'
      input.focus()
      return
    }

    updateStatus('Echo received.')
    out.textContent = `Eden v0 received: ${value}`
    input.value = ''
    input.focus()
  })

  input.addEventListener('input', () => {
    updateStatus(input.value.trim() ? 'Ready to echo.' : 'Ready.')
  })

  updateStatus('Ready.')
  out.textContent = 'No message yet.'
}

if (typeof document !== 'undefined') {
  setupEdenApp(document)
}
