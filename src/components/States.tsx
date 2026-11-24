import type { ReactNode } from 'react'
import { describeError } from '../lib/api'
import { placeLabel } from '../lib/storage'
import type { Place } from '../lib/types'
import { Icon } from './Icon'
import { WeatherIcon } from './WeatherIcon'
import './States.css'

export function LoadingState({ place }: { place: Place }) {
  return (
    <div className="state-loading" aria-hidden="true" data-testid="skeleton">
      <div className="skeleton skeleton-hero" />
      <div className="skeleton-row">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
      <div className="skeleton skeleton-chart" />
      <span className="sr-only">Loading weather for {placeLabel(place)}</span>
    </div>
  )
}

export function ErrorState({ error, place, onRetry, children }: { error: unknown; place?: Place; onRetry?: () => void; children?: ReactNode }) {
  const { title, detail } = describeError(error)
  return (
    <div className="state state-error card" role="alert">
      <Icon name="alert" size={32} className="state-icon" />
      <h2 className="state-title">{title}</h2>
      <p className="state-detail">
        {detail}
        {place ? <> (while loading {placeLabel(place)})</> : null}
      </p>
      <div className="state-actions">
        {onRetry ? (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            <Icon name="refresh" /> Try again
          </button>
        ) : null}
        {children}
      </div>
    </div>
  )
}

const SUGGESTIONS: Place[] = [
  { name: 'Sydney', state: 'New South Wales', country: 'AU', lat: -33.8698, lon: 151.2083 },
  { name: 'Tokyo', country: 'JP', lat: 35.6828, lon: 139.759 },
  { name: 'London', state: 'England', country: 'GB', lat: 51.5073, lon: -0.1276 },
  { name: 'New York', state: 'New York', country: 'US', lat: 40.7127, lon: -74.006 },
  { name: 'Reykjavík', country: 'IS', lat: 64.1466, lon: -21.9426 },
]

export function EmptyState({ onSelect }: { onSelect: (p: Place) => void }) {
  return (
    <section className="state state-empty" aria-labelledby="empty-title">
      <div className="empty-art" aria-hidden="true">
        <WeatherIcon id={801} size={120} animated />
      </div>
      <h2 id="empty-title" className="state-title display">
        Where to?
      </h2>
      <p className="state-detail">Search any city on Earth, use your location, or start with one of these.</p>
      <ul className="chips" aria-label="Suggested cities">
        {SUGGESTIONS.map((p) => (
          <li key={p.name}>
            <button type="button" className="chip" onClick={() => onSelect(p)}>
              {p.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
