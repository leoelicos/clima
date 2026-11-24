import { formatTime, localDateKey } from './time'
import type { ProtectionWindow, UvPoint, UvReport } from './types'

/**
 * UV index helpers. Bands follow the WHO Global Solar UV Index; the protection
 * threshold (UV 3+) and wording follow Australia's SunSmart guidance:
 * https://www.sunsmart.com.au/uv-sun-protection/uv/uv-index
 */
export const PROTECTION_THRESHOLD = 3

export type UvLevel = 'low' | 'moderate' | 'high' | 'very-high' | 'extreme'

export interface UvBand {
  level: UvLevel
  label: string
  advice: string
}

const BANDS: (UvBand & { min: number })[] = [
  { min: 11, level: 'extreme', label: 'Extreme', advice: 'Avoid being outside in the middle of the day. Seek shade, cover up and reapply sunscreen.' },
  { min: 8, level: 'very-high', label: 'Very high', advice: 'Extra protection needed: shade, hat, sunglasses, clothing and SPF 50+ sunscreen.' },
  { min: 6, level: 'high', label: 'High', advice: 'Protection needed: slip, slop, slap, seek and slide.' },
  { min: 3, level: 'moderate', label: 'Moderate', advice: 'Protection needed: slip, slop, slap, seek and slide.' },
  { min: 0, level: 'low', label: 'Low', advice: 'No sun protection needed unless you’re outdoors for a long time or near snow or water.' },
]

/** UV is reported to one decimal but the scale is read as whole numbers. */
export const roundUv = (uvi: number): number => Math.max(0, Math.round(uvi))

export function uvBand(uvi: number): UvBand {
  const r = roundUv(uvi)
  const { level, label, advice } = BANDS.find((b) => r >= b.min) ?? BANDS[BANDS.length - 1]!
  return { level, label, advice }
}

/** The 5 Ss of SunSmart, for the protection card. */
export const FIVE_S = [
  { verb: 'Slip', what: 'on clothing' },
  { verb: 'Slop', what: 'on SPF 50+ sunscreen' },
  { verb: 'Slap', what: 'on a hat' },
  { verb: 'Seek', what: 'shade' },
  { verb: 'Slide', what: 'on sunglasses' },
] as const

/** Linear interpolation of the moment UV crosses `level` between two points. */
function crossing(a: UvPoint, b: UvPoint, level: number): number {
  if (b.uvi === a.uvi) return a.dt
  const t = (level - a.uvi) / (b.uvi - a.uvi)
  return Math.round(a.dt + Math.min(1, Math.max(0, t)) * (b.dt - a.dt))
}

/**
 * Finds the window on `date` (place-local) when UV is at or above the threshold,
 * interpolating between hourly points so times read like SunSmart's ("9:10 am").
 */
export function protectionWindow(points: UvPoint[], date: string, timezone: number, threshold = PROTECTION_THRESHOLD): ProtectionWindow | null {
  const idx = points.map((p, i) => ({ p, i })).filter(({ p }) => localDateKey(p.dt, timezone) === date)
  if (idx.length === 0) return null
  const above = idx.filter(({ p }) => p.uvi >= threshold)
  if (above.length === 0) return null
  const first = above[0]!
  const last = above[above.length - 1]!
  const before = points[first.i - 1]
  const after = points[last.i + 1]
  const from = before && before.uvi < threshold ? crossing(before, first.p, threshold) : first.p.dt
  const to = after && after.uvi < threshold ? crossing(last.p, after, threshold) : last.p.dt
  const peak = above.reduce((m, { p }) => (p.uvi > m.uvi ? p : m), first.p)
  return { date, from, to, peak }
}

export function peakOn(points: UvPoint[], date: string, timezone: number): UvPoint | null {
  const day = points.filter((p) => localDateKey(p.dt, timezone) === date)
  return day.length ? day.reduce((m, p) => (p.uvi > m.uvi ? p : m)) : null
}

/** Value at the nearest hourly point within 90 minutes of `dt`. */
export function uvAt(points: UvPoint[], dt: number): number | null {
  let best: UvPoint | null = null
  for (const p of points) if (!best || Math.abs(p.dt - dt) < Math.abs(best.dt - dt)) best = p
  return best && Math.abs(best.dt - dt) <= 5400 ? best.uvi : null
}

/* ------------------------------------------------------------------ */
/* Open-Meteo                                                          */
/* ------------------------------------------------------------------ */

export const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'

export interface RawOpenMeteo {
  utc_offset_seconds: number
  current?: { time: number; uv_index: number | null }
  hourly?: { time: number[]; uv_index: (number | null)[] }
  daily?: { time: number[]; uv_index_max: (number | null)[] }
}

export function openMeteoUrl(lat: number, lon: number): URL {
  const url = new URL(OPEN_METEO_URL)
  url.search = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: 'uv_index',
    hourly: 'uv_index',
    daily: 'uv_index_max',
    timezone: 'auto',
    timeformat: 'unixtime',
    past_days: '1', // lets "today" start before the current hour
    forecast_days: '6',
  }).toString()
  return url
}

/**
 * Normalises Open-Meteo's UV payload against the place's clock.
 * `now` is the observation time we treat as "now" (OpenWeather's `dt`).
 */
export function normaliseUv(raw: RawOpenMeteo, timezone: number, now: number): UvReport | null {
  const times = raw.hourly?.time ?? []
  const values = raw.hourly?.uv_index ?? []
  const hourly: UvPoint[] = []
  times.forEach((dt, i) => {
    const uvi = values[i]
    if (typeof uvi === 'number' && Number.isFinite(uvi)) hourly.push({ dt, uvi })
  })
  if (hourly.length === 0) return null

  const dailyMax: Record<string, number> = {}
  const dTimes = raw.daily?.time ?? []
  const dValues = raw.daily?.uv_index_max ?? []
  dTimes.forEach((dt, i) => {
    const v = dValues[i]
    // daily `time` is local midnight; shift by Open-Meteo's own offset to get the date
    if (typeof v === 'number') dailyMax[localDateKey(dt, raw.utc_offset_seconds)] = v
  })

  const today = localDateKey(now, timezone)
  const tomorrow = localDateKey(now + 86_400, timezone)
  const current = raw.current?.uv_index
  return {
    now: typeof current === 'number' ? current : (uvAt(hourly, now) ?? 0),
    hourly,
    dailyMax,
    todayPeak: peakOn(hourly, today, timezone),
    today: protectionWindow(hourly, today, timezone),
    tomorrow: protectionWindow(hourly, tomorrow, timezone),
  }
}

/** Plain-language sun protection guidance in the style of Australia's SunSmart app. */
export function protectionMessage(uv: UvReport, now: number, timezone: number): { headline: string; needed: boolean } {
  const t = (dt: number) => formatTime(dt, timezone)
  const { today, tomorrow } = uv
  if (today && now < today.from) return { headline: `Sun protection recommended from ${t(today.from)} to ${t(today.to)} today.`, needed: true }
  if (today && now <= today.to) return { headline: `Sun protection recommended now, until ${t(today.to)}.`, needed: true }
  const rest = today ? 'UV is below 3 for the rest of today.' : 'UV stays below 3 today. No sun protection needed.'
  if (tomorrow) return { headline: `${rest} Tomorrow: protection from ${t(tomorrow.from)} to ${t(tomorrow.to)}.`, needed: false }
  return { headline: rest, needed: false }
}
