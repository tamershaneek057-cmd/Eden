const form = document.getElementById('form')
const input = document.getElementById('input')
const out = document.getElementById('out')
const status = document.getElementById('status')

form.addEventListener('submit', (e) => {
  e.preventDefault()

  const value = input.value.trim()

  if (!value) {
    status.textContent = 'Type something first.'
    out.textContent = 'No message yet.'
    input.focus()
    return
  }

  status.textContent = 'Echo received.'
  out.textContent = `Eden v0 received: ${value}`
  input.value = ''
  input.focus()
})

input.addEventListener('input', () => {
  if (input.value.trim()) {
    status.textContent = 'Ready to echo.'
    return
  }

  status.textContent = 'Ready.'
})
