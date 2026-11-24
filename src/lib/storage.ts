import type { Place, ThemePref, Units } from './types'

const HISTORY_KEY = 'clima:history'
const UNITS_KEY = 'clima:units'
const THEME_KEY = 'clima:theme'
export const HISTORY_LIMIT = 8

function read<T>(key: string, fallback: T, validate: (v: unknown) => v is T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed: unknown = JSON.parse(raw)
    return validate(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or disabled (private mode): fail silently */
  }
}

export function isPlace(v: unknown): v is Place {
  if (typeof v !== 'object' || v === null) return false
  const p = v as Record<string, unknown>
  return typeof p.name === 'string' && typeof p.lat === 'number' && typeof p.lon === 'number' && typeof p.country === 'string'
}

const isPlaceList = (v: unknown): v is Place[] => Array.isArray(v) && v.every(isPlace)
const isUnits = (v: unknown): v is Units => v === 'metric' || v === 'imperial'
const isTheme = (v: unknown): v is ThemePref => v === 'system' || v === 'light' || v === 'dark'

export const samePlace = (a: Place, b: Place): boolean =>
  Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lon - b.lon) < 0.01

export const loadHistory = (): Place[] => read(HISTORY_KEY, [], isPlaceList).slice(0, HISTORY_LIMIT)

/** Most recent first, de-duplicated by coordinates, capped at HISTORY_LIMIT. */
export function addToHistory(history: Place[], place: Place): Place[] {
  return [place, ...history.filter((p) => !samePlace(p, place))].slice(0, HISTORY_LIMIT)
}

export const saveHistory = (history: Place[]): void => write(HISTORY_KEY, history)

export function defaultUnits(locale = typeof navigator !== 'undefined' ? navigator.language : 'en-AU'): Units {
  // Fahrenheit countries: US and a few territories / neighbours.
  return /-(US|LR|MM|BS|BZ|KY|PW|FM|MH)$/i.test(locale) ? 'imperial' : 'metric'
}

export const loadUnits = (): Units => read(UNITS_KEY, defaultUnits(), isUnits)
export const saveUnits = (u: Units): void => write(UNITS_KEY, u)

export const loadTheme = (): ThemePref => read(THEME_KEY, 'system', isTheme)
export const saveTheme = (t: ThemePref): void => write(THEME_KEY, t)

export function placeLabel(p: Place): string {
  return [p.name, p.state, p.country].filter(Boolean).join(', ')
}
