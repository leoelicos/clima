import type { Units } from './types'

export const cToF = (c: number): number => (c * 9) / 5 + 32

export function temp(c: number, units: Units): number {
  return Math.round(units === 'metric' ? c : cToF(c))
}

export function tempLabel(c: number, units: Units): string {
  return `${temp(c, units)}°`
}

/** Full, screen-reader friendly temperature, e.g. "21 degrees Celsius". */
export function tempSpoken(c: number, units: Units): string {
  return `${temp(c, units)} degrees ${units === 'metric' ? 'Celsius' : 'Fahrenheit'}`
}

export const tempUnit = (units: Units): string => (units === 'metric' ? '°C' : '°F')

/** Wind arrives in m/s. Metric shows km/h (what most people read on forecasts), imperial mph. */
export function wind(ms: number, units: Units): { value: number; unit: string; spoken: string } {
  if (units === 'metric') {
    const value = Math.round(ms * 3.6)
    return { value, unit: 'km/h', spoken: `${value} kilometres per hour` }
  }
  const value = Math.round(ms * 2.236936)
  return { value, unit: 'mph', spoken: `${value} miles per hour` }
}

export function distance(metres: number, units: Units): { value: number; unit: string } {
  if (units === 'metric') return { value: Math.round((metres / 1000) * 10) / 10, unit: 'km' }
  return { value: Math.round((metres / 1609.344) * 10) / 10, unit: 'mi' }
}

export function precip(mm: number, units: Units): { value: number; unit: string } {
  if (units === 'metric') return { value: Math.round(mm * 10) / 10, unit: 'mm' }
  return { value: Math.round((mm / 25.4) * 100) / 100, unit: 'in' }
}

export function pressure(hpa: number, units: Units): { value: number; unit: string } {
  if (units === 'metric') return { value: Math.round(hpa), unit: 'hPa' }
  return { value: Math.round(hpa * 0.02953 * 100) / 100, unit: 'inHg' }
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'] as const
const COMPASS_WORDS = [
  'north', 'north-northeast', 'northeast', 'east-northeast', 'east', 'east-southeast', 'southeast', 'south-southeast',
  'south', 'south-southwest', 'southwest', 'west-southwest', 'west', 'west-northwest', 'northwest', 'north-northwest',
] as const

const compassIndex = (deg: number): number => Math.round((((deg % 360) + 360) % 360) / 22.5) % 16

export const compass = (deg: number): string => COMPASS[compassIndex(deg)]!

export const compassSpoken = (deg: number): string => COMPASS_WORDS[compassIndex(deg)]!

export const percent = (fraction: number): number => Math.round(fraction * 100)
