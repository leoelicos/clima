import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, reverseGeocode } from './lib/api'
import { clearApiKey, getApiKey, hasBuiltInKey, saveApiKey } from './lib/apiKey'
import { moodFor } from './lib/conditions'
import { useAnnouncer, withViewTransition } from './lib/hooks'
import { addToHistory, loadHistory, loadTheme, loadUnits, placeLabel, samePlace, saveHistory, saveTheme, saveUnits } from './lib/storage'
import { tempSpoken } from './lib/units'
import { useWeather } from './lib/useWeather'
import type { Place, ThemePref, Units } from './lib/types'
import { ApiKeySetup } from './components/ApiKeySetup'
import { CurrentConditions } from './components/CurrentConditions'
import { DailyForecast } from './components/DailyForecast'
import { Footer } from './components/Footer'
import { Highlights } from './components/Highlights'
import { HourlyChart } from './components/HourlyChart'
import { Icon } from './components/Icon'
import { Logo } from './components/Logo'
import { RecentPlaces } from './components/RecentPlaces'
import { SearchBox } from './components/SearchBox'
import { Segmented } from './components/Segmented'
import { EmptyState, ErrorState, LoadingState } from './components/States'

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(() => getApiKey())
  const [history, setHistory] = useState<Place[]>(() => loadHistory())
  const [place, setPlace] = useState<Place | null>(() => history[0] ?? null)
  const [units, setUnits] = useState<Units>(() => loadUnits())
  const [theme, setTheme] = useState<ThemePref>(() => loadTheme())
  const [locating, setLocating] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [message, announce] = useAnnouncer()
  const { state, retry } = useWeather(place, apiKey)
  const announcedFor = useRef<number | null>(null)

  /* ---------- theme ---------- */
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
    saveTheme(theme)
  }, [theme])

  useEffect(() => saveUnits(units), [units])

  /* ---------- sky mood follows the weather ---------- */
  const report = state.status === 'success' ? state.report : state.status === 'loading' ? state.previous : null
  useEffect(() => {
    const root = document.documentElement
    if (!report) {
      root.dataset.mood = 'partly'
      root.dataset.daypart = 'day'
      return
    }
    const c = report.current
    root.dataset.mood = moodFor(c.condition.id)
    root.dataset.daypart = c.dt >= c.sunrise && c.dt < c.sunset ? 'day' : 'night'
  }, [report])

  /* ---------- announce results (WCAG 4.1.3) ---------- */
  useEffect(() => {
    if (state.status === 'success' && announcedFor.current !== state.report.fetchedAt) {
      announcedFor.current = state.report.fetchedAt
      const { current, place: p } = state.report
      announce(`Showing weather for ${placeLabel(p)}: ${tempSpoken(current.temp, units)}, ${current.condition.description}.`)
      document.title = `${p.name} · ${Math.round(current.temp)}° · Clima`
    }
    // `announcedFor` guards against re-announcing when only the units change.
  }, [state, announce, units])

  /* ---------- "/" focuses search ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing = target?.closest('input, textarea, select, [contenteditable="true"]')
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('.search input')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const select = useCallback((next: Place) => {
    setNotice(null)
    withViewTransition(() => {
      setPlace(next)
      setHistory((h) => {
        const updated = addToHistory(h, next)
        saveHistory(updated)
        return updated
      })
    })
  }, [])

  const removeFromHistory = (p: Place) => {
    setHistory((h) => {
      const updated = h.filter((x) => !samePlace(x, p))
      saveHistory(updated)
      return updated
    })
    announce(`Removed ${p.name} from recent places.`)
  }

  const clearHistory = () => {
    setHistory([])
    saveHistory([])
    announce('Recent places cleared.')
  }

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setNotice('Location isn’t available in this browser. Try searching instead.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const found = await reverseGeocode(coords.latitude, coords.longitude, { key: apiKey })
          select(found)
        } catch {
          select({ name: 'Your location', lat: coords.latitude, lon: coords.longitude, country: '' })
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        setNotice(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. You can still search for any city.'
            : 'We couldn’t get your location. Try searching instead.',
        )
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    )
  }

  const saveKey = (key: string) => {
    saveApiKey(key)
    setApiKey(key)
    announce('API key saved.')
  }

  const resetKey = () => {
    clearApiKey()
    setApiKey(getApiKey())
  }

  const keyRejected = state.status === 'error' && state.error instanceof ApiError && state.error.kind === 'unauthorized'
  const needsKey = !apiKey || (keyRejected && !hasBuiltInKey())

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="sky" aria-hidden="true">
        <div className="sky-orb" />
        <div className="sky-grain" />
      </div>

      <header className="site-header">
        <div className="wrap header-inner">
          <a className="brand" href="./" aria-label="Clima home">
            <Logo />
            <span className="brand-name">Clima</span>
          </a>
          {needsKey ? null : <SearchBox apiKey={apiKey} onSelect={select} onLocate={locate} locating={locating} />}
          <div className="header-controls">
            <Segmented
              legend="Temperature units"
              value={units}
              onChange={setUnits}
              options={[
                { value: 'metric', label: '°C' },
                { value: 'imperial', label: '°F' },
              ]}
            />
            <Segmented
              legend="Colour theme"
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'light', label: 'Light theme', icon: <Icon name="sun" size={16} />, iconOnly: true },
                { value: 'system', label: 'Match system theme', icon: <Icon name="monitor" size={16} />, iconOnly: true },
                { value: 'dark', label: 'Dark theme', icon: <Icon name="moon" size={16} />, iconOnly: true },
              ]}
            />
          </div>
        </div>
      </header>

      <main id="main" className="wrap main" tabIndex={-1} aria-busy={state.status === 'loading'}>
        <h1 className="sr-only">Clima weather dashboard</h1>

        {notice ? (
          <p className="notice" role="status">
            <Icon name="alert" size={16} /> {notice}
            <button type="button" className="notice-close" aria-label="Dismiss message" onClick={() => setNotice(null)}>
              <Icon name="x" size={14} />
            </button>
          </p>
        ) : null}

        {needsKey ? null : (
          <RecentPlaces history={history} current={place} onSelect={select} onRemove={removeFromHistory} onClear={clearHistory} />
        )}

        {needsKey ? (
          <ApiKeySetup onSave={saveKey} rejected={keyRejected} />
        ) : state.status === 'idle' ? (
          <EmptyState onSelect={select} />
        ) : state.status === 'loading' && !state.previous ? (
          <LoadingState place={state.place} />
        ) : state.status === 'error' ? (
          <ErrorState error={state.error} place={state.place} onRetry={retry} />
        ) : report ? (
          <div className="dashboard" data-stale={state.status === 'loading' || undefined}>
            {state.status === 'loading' ? <span className="sr-only">Loading weather for {placeLabel(state.place)}</span> : null}
            <CurrentConditions report={report} units={units} />
            <DailyForecast daily={report.daily} timezone={report.timezone} units={units} now={report.current.dt} />
            <HourlyChart hourly={report.hourly} timezone={report.timezone} units={units} />
            <Highlights report={report} units={units} />
          </div>
        ) : null}
      </main>

      <Footer onResetKey={!hasBuiltInKey() && apiKey ? resetKey : undefined} />

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {message}
      </div>
    </>
  )
}
