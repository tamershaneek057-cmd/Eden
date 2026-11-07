const form = document.getElementById('form')
const input = document.getElementById('input')
const out = document.getElementById('out')

form.addEventListener('submit', (e) => {
  e.preventDefault()

  const v = input.value.trim()
  out.textContent = v ? 'Eden v0 received: ' + v : 'Type something first.'
})
