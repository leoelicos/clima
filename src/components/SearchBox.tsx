import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { describeError, searchPlaces } from '../lib/api'
import { useDebounced } from '../lib/hooks'
import type { Place } from '../lib/types'
import { Icon } from './Icon'
import './SearchBox.css'

interface Props {
  apiKey: string | null
  onSelect: (place: Place) => void
  onLocate: () => void
  locating: boolean
}

type Status = 'idle' | 'loading' | 'done' | 'error'

/**
 * WAI-ARIA 1.2 combobox with a listbox popup.
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/
 */
export function SearchBox({ apiKey, onSelect, onLocate, locating }: Props) {
  const id = useId()
  const listId = `${id}-list`
  const hintId = `${id}-hint`
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<{ query: string; places: Place[]; error: string | null } | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const debounced = useDebounced(query.trim(), 280)

  // Derived, so there's no synchronous setState inside the effect.
  const searchable = debounced.length >= 2
  const settled = searchable && result?.query === debounced ? result : null
  const status: Status = !searchable ? 'idle' : settled ? (settled.error ? 'error' : 'done') : 'loading'
  const results = settled?.places ?? []
  const error = settled?.error ?? null

  useEffect(() => {
    if (debounced.length < 2) return
    const controller = new AbortController()
    searchPlaces(debounced, { key: apiKey, signal: controller.signal })
      .then((places) => setResult({ query: debounced, places, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setResult({ query: debounced, places: [], error: describeError(err).title })
      })
    return () => controller.abort()
  }, [debounced, apiKey])

  const expanded = open && (results.length > 0 || status === 'done' || status === 'error')

  const choose = (place: Place) => {
    onSelect(place)
    setQuery('')
    setOpen(false)
    setActive(-1)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        if (!results.length) return
        e.preventDefault()
        setOpen(true)
        setActive((i) => (i + 1) % results.length)
        break
      case 'ArrowUp':
        if (!results.length) return
        e.preventDefault()
        setOpen(true)
        setActive((i) => (i <= 0 ? results.length - 1 : i - 1))
        break
      case 'Home':
      case 'End':
        if (!expanded || active < 0) return
        e.preventDefault()
        setActive(e.key === 'Home' ? 0 : results.length - 1)
        break
      case 'Escape':
        if (expanded) {
          e.preventDefault()
          setOpen(false)
          setActive(-1)
        } else if (query) {
          e.preventDefault()
          setQuery('')
        }
        break
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const pick = results[active] ?? results[0]
    if (pick) choose(pick)
    else if (query.trim().length < 2) inputRef.current?.focus()
  }

  // Message for the polite live region (WCAG 4.1.3 Status Messages).
  let liveMessage = ''
  if (status === 'loading') liveMessage = 'Searching…'
  else if (status === 'error' && error) liveMessage = error
  else if (status === 'done')
    liveMessage = results.length
      ? `${results.length} ${results.length === 1 ? 'place' : 'places'} found. Use the up and down arrow keys to review, Enter to choose.`
      : `No places match “${debounced}”.`

  return (
    // Explicit role for browsers and assistive tech that predate the <search> element.
    // oxlint-disable-next-line jsx-a11y/no-redundant-roles
    <search className="search" role="search" aria-label="Find a place">
      <form className="search-form" onSubmit={onSubmit} noValidate>
        <label htmlFor={`${id}-input`} className="sr-only">
          Search for a city
        </label>
        <div className="search-field" data-status={status}>
          <Icon name="search" className="search-glyph" />
          <input
            ref={inputRef}
            id={`${id}-input`}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={listId}
            aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
            aria-describedby={hintId}
            autoComplete="off"
            autoCapitalize="words"
            spellCheck={false}
            enterKeyHint="search"
            placeholder="Search a city…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(-1)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
          />
          {status === 'loading' ? <span className="search-spinner" aria-hidden="true" /> : null}
          <kbd className="search-kbd" aria-hidden="true">
            /
          </kbd>
        </div>
        <span id={hintId} className="sr-only">
          Type at least two letters. Suggestions appear below. Press slash anywhere to jump here.
        </span>

        <ul id={listId} role="listbox" aria-label="Matching places" className="search-list" hidden={!expanded}>
          {results.map((place, i) => (
            // Keyboard interaction lives on the combobox input (APG pattern).
            // oxlint-disable-next-line jsx-a11y/click-events-have-key-events
            <li
              key={`${place.lat},${place.lon}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className="search-option"
              // mousedown keeps focus in the input so blur doesn't close the list first
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(place)}
              onMouseMove={() => setActive(i)}
            >
              <Icon name="pin" className="search-option-icon" />
              <span>
                <span className="search-option-name">{place.name}</span>
                <span className="search-option-meta">{[place.state, place.country].filter(Boolean).join(', ')}</span>
              </span>
            </li>
          ))}
          {status === 'done' && results.length === 0 ? (
            <li role="option" aria-selected={false} aria-disabled="true" className="search-empty">
              No places match “{debounced}”
            </li>
          ) : null}
          {status === 'error' && error ? (
            <li role="option" aria-selected={false} aria-disabled="true" className="search-empty">
              {error}
            </li>
          ) : null}
        </ul>
      </form>

      <button type="button" className="btn btn-ghost locate" onClick={onLocate} disabled={locating} aria-busy={locating}>
        <Icon name="locate" />
        <span className="locate-text">{locating ? 'Locating…' : 'Use my location'}</span>
      </button>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </p>
    </search>
  )
}
