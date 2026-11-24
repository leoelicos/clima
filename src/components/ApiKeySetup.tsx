import { useId, useState, type FormEvent } from 'react'
import { looksLikeApiKey } from '../lib/apiKey'
import { Icon } from './Icon'
import './ApiKeySetup.css'

export function ApiKeySetup({ onSave, rejected = false }: { onSave: (key: string) => void; rejected?: boolean }) {
  const id = useId()
  const [value, setValue] = useState('')
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!looksLikeApiKey(value)) {
      setError('That doesn’t look like an OpenWeather key. Keys are 32 letters and numbers.')
      return
    }
    setError(null)
    onSave(value)
  }

  return (
    <section className="setup card" aria-labelledby={`${id}-title`}>
      <Icon name="key" size={32} className="state-icon" />
      <h2 id={`${id}-title`} className="state-title">
        {rejected ? 'That key didn’t work' : 'Connect OpenWeather'}
      </h2>
      <p className="state-detail">
        This deployment has no built-in API key. Paste your own free key from{' '}
        <a href="https://home.openweathermap.org/api_keys" target="_blank" rel="noreferrer">
          OpenWeather<span className="sr-only"> (opens in a new tab)</span>
          <Icon name="external" size={14} />
        </a>
        . It stays in this browser only.
      </p>
      <form className="setup-form" onSubmit={submit} noValidate>
        <label htmlFor={`${id}-key`} className="field-label">
          API key
        </label>
        <div className="setup-row">
          <input
            id={`${id}-key`}
            className="field"
            type={reveal ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            required
          />
          <button type="button" className="btn btn-ghost" aria-pressed={reveal} onClick={() => setReveal((r) => !r)}>
            <Icon name="eye" />
            {reveal ? 'Hide' : 'Show'}
          </button>
          <button type="submit" className="btn btn-primary">
            Save key
          </button>
        </div>
        {error ? (
          <p id={`${id}-error`} className="field-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  )
}
