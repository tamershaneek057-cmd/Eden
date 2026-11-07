import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent } from '@testing-library/dom'
import { setupEdenApp } from './app.js'

describe('Eden app', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <main>
        <form id="form" novalidate>
          <label class="sr-only" for="input">Message</label>
          <input id="input" name="message" type="text" placeholder="Type here" />
          <button type="submit">Run</button>
        </form>
        <p id="status" aria-live="polite">Ready.</p>
        <pre id="out" aria-live="polite">No message yet.</pre>
      </main>
    `

    setupEdenApp(document)
  })

  it('shows a validation message when submitting empty input', () => {
    const form = document.getElementById('form')
    fireEvent.submit(form)

    expect(document.getElementById('status').textContent).toBe('Type something first.')
    expect(document.getElementById('out').textContent).toBe('No message yet.')
  })

  it('echoes the input text and clears the field on submit', () => {
    const form = document.getElementById('form')
    const input = document.getElementById('input')
    const out = document.getElementById('out')
    const status = document.getElementById('status')

    fireEvent.change(input, { target: { value: 'Hello Eden' } })
    fireEvent.submit(form)

    expect(out.textContent).toBe('Eden v0 received: Hello Eden')
    expect(input.value).toBe('')
    expect(status.textContent).toBe('Echo received.')
  })

  it('updates the status as the user types', () => {
    const input = document.getElementById('input')
    const status = document.getElementById('status')

    fireEvent.input(input, { target: { value: 'Hi' } })

    expect(status.textContent).toBe('Ready to echo.')
  })
})
