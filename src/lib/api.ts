import { toDaily } from './forecast'
import type { AirQuality, Condition, Current, Hourly, Place, UvReport, WeatherReport } from './types'
import { normaliseUv, openMeteoUrl, uvAt, type RawOpenMeteo } from './uv'

const BASE = 'https://api.openweathermap.org'

export type ApiErrorKind = 'no-key' | 'unauthorized' | 'not-found' | 'rate-limited' | 'offline' | 'server' | 'unknown'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | undefined

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }
}

/** Human friendly copy for each failure mode. */
export function describeError(error: unknown): { title: string; detail: string } {
  const kind = error instanceof ApiError ? error.kind : 'unknown'
  switch (kind) {
    case 'no-key':
      return { title: 'An API key is needed', detail: 'Add an OpenWeather API key to start searching.' }
    case 'unauthorized':
      return {
        title: 'That API key was rejected',
        detail: 'OpenWeather did not accept the key. New keys can take up to two hours to activate.',
      }
    case 'not-found':
      return { title: 'Place not found', detail: 'OpenWeather has no data for that location. Try another search.' }
    case 'rate-limited':
      return { title: 'Too many requests', detail: 'The API rate limit was reached. Wait a minute and try again.' }
    case 'offline':
      return { title: 'You appear to be offline', detail: 'Check your connection and try again.' }
    case 'server':
      return { title: 'OpenWeather is having trouble', detail: 'The weather service returned an error. Try again shortly.' }
    default:
      return { title: 'Something went wrong', detail: 'An unexpected error occurred. Try again.' }
  }
}

type Fetcher = typeof fetch

async function request<T>(path: string, params: Record<string, string | number>, key: string | null, signal?: AbortSignal, fetcher: Fetcher = fetch): Promise<T> {
  if (!key) throw new ApiError('no-key', 'Missing OpenWeather API key')
  const url = new URL(path, BASE)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  url.searchParams.set('appid', key)

  let res: Response
  try {
    res = await fetcher(url, signal ? { signal } : undefined)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false
    throw new ApiError(offline ? 'offline' : 'unknown', 'Network request failed')
  }

  if (!res.ok) {
    const status = res.status
    if (status === 401) throw new ApiError('unauthorized', 'Invalid API key', status)
    if (status === 404) throw new ApiError('not-found', 'Not found', status)
    if (status === 429) throw new ApiError('rate-limited', 'Rate limited', status)
    if (status >= 500) throw new ApiError('server', `Server error ${status}`, status)
    throw new ApiError('unknown', `Request failed with ${status}`, status)
  }
  return (await res.json()) as T
}

/* ------------------------------------------------------------------ */
/* Raw API shapes (only the fields we read)                            */
/* ------------------------------------------------------------------ */

interface RawPlace {
  name: string
  lat: number
  lon: number
  country: string
  state?: string
  local_names?: Record<string, string>
}

interface RawCurrent {
  dt: number
  timezone: number
  name: string
  weather: Condition[]
  main: { temp: number; feels_like: number; temp_min: number; temp_max: number; pressure: number; humidity: number }
  visibility?: number
  wind: { speed: number; deg: number; gust?: number }
  clouds: { all: number }
  rain?: { '1h'?: number }
  snow?: { '1h'?: number }
  sys: { country?: string; sunrise: number; sunset: number }
}

interface RawForecastItem {
  dt: number
  main: { temp: number; feels_like: number; humidity: number }
  weather: Condition[]
  wind: { speed: number }
  pop?: number
  rain?: { '3h'?: number }
  snow?: { '3h'?: number }
  sys?: { pod?: 'd' | 'n' }
}

interface RawForecast {
  list: RawForecastItem[]
  city: { timezone: number }
}

interface RawAir {
  list: { main: { aqi: number }; components: { pm2_5: number; pm10: number; o3: number; no2: number } }[]
}

const FALLBACK_CONDITION: Condition = { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }

/* ------------------------------------------------------------------ */
/* Normalisers (pure, unit tested)                                     */
/* ------------------------------------------------------------------ */

export function normalisePlace(raw: RawPlace): Place {
  const place: Place = {
    name: raw.local_names?.en ?? raw.name,
    lat: raw.lat,
    lon: raw.lon,
    country: raw.country,
  }
  if (raw.state) place.state = raw.state
  return place
}

/** OpenWeather often returns the same city several times; keep the first of each name/state/country. */
export function dedupePlaces(places: Place[]): Place[] {
  const seen = new Set<string>()
  return places.filter((p) => {
    const id = `${p.name}|${p.state ?? ''}|${p.country}`
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export function normaliseCurrent(raw: RawCurrent): Current {
  return {
    dt: raw.dt,
    temp: raw.main.temp,
    feelsLike: raw.main.feels_like,
    tempMin: raw.main.temp_min,
    tempMax: raw.main.temp_max,
    humidity: raw.main.humidity,
    pressure: raw.main.pressure,
    visibility: raw.visibility ?? null,
    windSpeed: raw.wind.speed,
    windGust: raw.wind.gust ?? null,
    windDeg: raw.wind.deg,
    clouds: raw.clouds.all,
    precip: (raw.rain?.['1h'] ?? 0) + (raw.snow?.['1h'] ?? 0),
    sunrise: raw.sys.sunrise,
    sunset: raw.sys.sunset,
    condition: raw.weather[0] ?? FALLBACK_CONDITION,
  }
}

export function normaliseHourly(raw: RawForecastItem): Hourly {
  const condition = raw.weather[0] ?? FALLBACK_CONDITION
  return {
    dt: raw.dt,
    temp: raw.main.temp,
    feelsLike: raw.main.feels_like,
    pop: raw.pop ?? 0,
    precip: (raw.rain?.['3h'] ?? 0) + (raw.snow?.['3h'] ?? 0),
    windSpeed: raw.wind.speed,
    humidity: raw.main.humidity,
    isDay: raw.sys?.pod ? raw.sys.pod === 'd' : condition.icon.endsWith('d'),
    condition,
    uvi: null,
  }
}

export function normaliseAir(raw: RawAir): AirQuality | null {
  const first = raw.list[0]
  if (!first) return null
  const aqi = Math.min(5, Math.max(1, Math.round(first.main.aqi))) as AirQuality['aqi']
  return { aqi, ...first.components }
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export interface ApiOptions {
  key: string | null
  signal?: AbortSignal
  fetcher?: Fetcher
}

export async function searchPlaces(query: string, { key, signal, fetcher }: ApiOptions): Promise<Place[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const raw = await request<RawPlace[]>('/geo/1.0/direct', { q, limit: 5 }, key, signal, fetcher)
  return dedupePlaces(raw.map(normalisePlace))
}

export async function reverseGeocode(lat: number, lon: number, { key, signal, fetcher }: ApiOptions): Promise<Place> {
  const raw = await request<RawPlace[]>('/geo/1.0/reverse', { lat, lon, limit: 1 }, key, signal, fetcher)
  const first = raw[0]
  if (!first) return { name: 'Your location', lat, lon, country: '' }
  return { ...normalisePlace(first), lat, lon }
}

/**
 * UV index from Open-Meteo (free, keyless, CORS-enabled, CC BY 4.0).
 * OpenWeather's free APIs don't include UV.
 */
export async function fetchOpenMeteoUv(place: Place, { signal, fetcher = fetch }: Omit<ApiOptions, 'key'>): Promise<RawOpenMeteo> {
  const res = await fetcher(openMeteoUrl(place.lat, place.lon), signal ? { signal } : undefined)
  if (!res.ok) throw new ApiError(res.status === 429 ? 'rate-limited' : 'server', `Open-Meteo ${res.status}`, res.status)
  return (await res.json()) as RawOpenMeteo
}

/** Adds UV values onto hourly steps and daily rows. */
export function mergeUv(report: WeatherReport, uv: UvReport | null): WeatherReport {
  if (!uv) return report
  return {
    ...report,
    uv,
    hourly: report.hourly.map((h) => ({ ...h, uvi: uvAt(uv.hourly, h.dt) })),
    daily: report.daily.map((d) => ({ ...d, uvMax: uv.dailyMax[d.date] ?? null })),
  }
}

const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError'

/**
 * Fetches current conditions, the 5 day / 3 hour forecast and air quality in parallel.
 * Uses the free 2.5 endpoints (the legacy One Call 2.5 API the original app used was retired in 2024).
 */
export async function fetchWeather(place: Place, { key, signal, fetcher }: ApiOptions): Promise<WeatherReport> {
  const coords = { lat: place.lat, lon: place.lon }
  const [current, forecast, air, uvRaw] = await Promise.all([
    request<RawCurrent>('/data/2.5/weather', { ...coords, units: 'metric' }, key, signal, fetcher),
    request<RawForecast>('/data/2.5/forecast', { ...coords, units: 'metric' }, key, signal, fetcher),
    // Air quality is a nice-to-have: never fail the whole report because of it.
    request<RawAir>('/data/2.5/air_pollution', coords, key, signal, fetcher).catch((err: unknown) => {
      if (isAbort(err)) throw err
      return null
    }),
    // Raw Open-Meteo payload; normalised below once we know OpenWeather's clock.
    fetchOpenMeteoUv(place, { ...(signal ? { signal } : {}), ...(fetcher ? { fetcher } : {}) }).catch((err: unknown) => {
      // UV is a nice-to-have too: a failure just hides the UV UI.
      if (isAbort(err)) throw err
      return null
    }),
  ])

  const timezone = current.timezone ?? forecast.city.timezone
  const normalisedCurrent = normaliseCurrent(current)
  const hourly = forecast.list.map(normaliseHourly)
  const report: WeatherReport = {
    place,
    timezone,
    current: normalisedCurrent,
    hourly,
    daily: toDaily(hourly, timezone, normalisedCurrent),
    air: air ? normaliseAir(air) : null,
    uv: null,
    fetchedAt: Date.now(),
  }
  return mergeUv(report, uvRaw ? normaliseUv(uvRaw, timezone, normalisedCurrent.dt) : null)
}
