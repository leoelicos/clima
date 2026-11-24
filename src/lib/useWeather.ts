import { useCallback, useEffect, useState } from 'react'
import { fetchWeather } from './api'
import type { Place, WeatherReport } from './types'

export type WeatherState =
  | { status: 'idle' }
  | { status: 'loading'; place: Place; previous: WeatherReport | null }
  | { status: 'success'; report: WeatherReport }
  | { status: 'error'; place: Place; error: unknown }

type Result = { id: string; report: WeatherReport } | { id: string; error: unknown }

const CACHE_MS = 10 * 60 * 1000
const cache = new Map<string, WeatherReport>()
const coordsKey = (p: Place) => `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`

/** Exposed for tests. */
export const clearWeatherCache = () => cache.clear()

function fresh(place: Place): WeatherReport | null {
  const hit = cache.get(coordsKey(place))
  return hit && Date.now() - hit.fetchedAt < CACHE_MS ? hit : null
}

/**
 * Loads a weather report for `place`, cancelling stale requests and serving
 * reports younger than 10 minutes from an in-memory cache. State is derived
 * from the latest settled result so the effect only talks to the network.
 */
export function useWeather(place: Place | null, apiKey: string | null) {
  const [result, setResult] = useState<Result | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [lastReport, setLastReport] = useState<WeatherReport | null>(null)

  const id = place && apiKey ? `${coordsKey(place)}#${attempt}` : null
  const cached = place && apiKey && attempt === 0 ? fresh(place) : null

  useEffect(() => {
    if (!place || !apiKey || !id || cached) return
    const controller = new AbortController()
    fetchWeather(place, { key: apiKey, signal: controller.signal })
      .then((report) => {
        cache.set(coordsKey(place), report)
        setResult({ id, report })
        setLastReport(report)
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({ id, error })
      })
    return () => controller.abort()
  }, [place, apiKey, id, cached])

  let state: WeatherState
  if (!place || !apiKey) state = { status: 'idle' }
  else if (cached) state = { status: 'success', report: { ...cached, place } }
  else if (result && result.id === id) {
    state = 'report' in result ? { status: 'success', report: { ...result.report, place } } : { status: 'error', place, error: result.error }
  } else state = { status: 'loading', place, previous: lastReport }

  // Remember cache hits too, so the next load can keep showing them while it fetches.
  if (cached && lastReport !== cached) setLastReport(cached)

  const retry = useCallback(() => {
    if (place) cache.delete(coordsKey(place))
    setAttempt((n) => n + 1)
  }, [place])

  // A new place starts a fresh attempt counter.
  const placeId = place ? coordsKey(place) : null
  const [prevPlaceId, setPrevPlaceId] = useState(placeId)
  if (placeId !== prevPlaceId) {
    setPrevPlaceId(placeId)
    setAttempt(0)
  }

  return { state, retry }
}
