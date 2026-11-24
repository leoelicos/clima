/**
 * Maps OpenWeather condition ids to a visual "mood" that drives the sky
 * gradient and the animated icon. See https://openweathermap.org/weather-conditions
 */
export type Mood = 'clear' | 'partly' | 'cloudy' | 'drizzle' | 'rain' | 'storm' | 'snow' | 'fog'

export function moodFor(id: number): Mood {
  if (id >= 200 && id < 300) return 'storm'
  if (id >= 300 && id < 400) return 'drizzle'
  if (id >= 500 && id < 600) return id === 511 ? 'snow' : 'rain'
  if (id >= 600 && id < 700) return 'snow'
  if (id >= 700 && id < 800) return 'fog'
  if (id === 800) return 'clear'
  if (id === 801 || id === 802) return 'partly'
  return 'cloudy'
}

export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export const AQI_LABELS = ['Good', 'Fair', 'Moderate', 'Poor', 'Very poor'] as const

export function aqiLabel(aqi: number): string {
  return AQI_LABELS[Math.min(5, Math.max(1, aqi)) - 1]!
}

/** A short plain-English summary of the next few hours. */
export function summarise(opts: { temp: number; feelsLike: number; pop: number; windKmh: number }): string {
  const parts: string[] = []
  const diff = Math.round(opts.feelsLike - opts.temp)
  if (Math.abs(diff) >= 3) parts.push(diff > 0 ? 'Feels warmer than it is' : 'Feels cooler than it is')
  if (opts.pop >= 0.6) parts.push('rain is likely, take an umbrella')
  else if (opts.pop >= 0.3) parts.push('a chance of showers later')
  if (opts.windKmh >= 40) parts.push('strong winds')
  else if (opts.windKmh >= 25) parts.push('breezy')
  if (parts.length === 0) return 'Settled conditions for the next few hours.'
  const s = parts.join(', ')
  return `${capitalise(s)}.`
}
