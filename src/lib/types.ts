/** A place the user can look up the weather for. */
export interface Place {
  name: string
  lat: number
  lon: number
  country: string
  state?: string
}

export interface Condition {
  /** OpenWeather condition id, see https://openweathermap.org/weather-conditions */
  id: number
  main: string
  description: string
  /** OpenWeather icon code such as `10d`. */
  icon: string
}

/** Normalised current conditions (always metric internally). */
export interface Current {
  dt: number
  temp: number
  feelsLike: number
  tempMin: number
  tempMax: number
  humidity: number
  pressure: number
  /** metres */
  visibility: number | null
  /** m/s */
  windSpeed: number
  windGust: number | null
  windDeg: number
  clouds: number
  /** mm in the last hour */
  precip: number
  sunrise: number
  sunset: number
  condition: Condition
}

/** A 3-hourly forecast step. */
export interface Hourly {
  dt: number
  temp: number
  feelsLike: number
  /** probability of precipitation 0..1 */
  pop: number
  /** mm in the 3h window */
  precip: number
  windSpeed: number
  humidity: number
  isDay: boolean
  condition: Condition
  /** UV index at this step (from Open-Meteo), null when unavailable */
  uvi: number | null
}

export interface Daily {
  /** city-local ISO date, e.g. 2026-11-24 */
  date: string
  /** a representative unix timestamp inside the day */
  dt: number
  min: number
  max: number
  pop: number
  precip: number
  condition: Condition
  /** Forecast daily maximum UV index, null when unavailable */
  uvMax: number | null
}

export interface AirQuality {
  /** 1 (good) .. 5 (very poor) */
  aqi: 1 | 2 | 3 | 4 | 5
  pm2_5: number
  pm10: number
  o3: number
  no2: number
}

export interface WeatherReport {
  place: Place
  /** offset from UTC in seconds for the place */
  timezone: number
  current: Current
  hourly: Hourly[]
  daily: Daily[]
  air: AirQuality | null
  uv: UvReport | null
  fetchedAt: number
}

export type Units = 'metric' | 'imperial'
export type ThemePref = 'system' | 'light' | 'dark'

/** One hourly UV observation/forecast point. */
export interface UvPoint {
  dt: number
  uvi: number
}

/** A stretch of the day when UV is at or above 3 and sun protection is recommended. */
export interface ProtectionWindow {
  /** local date key the window belongs to */
  date: string
  from: number
  to: number
  peak: UvPoint
}

export interface UvReport {
  now: number
  /** hourly points, oldest first */
  hourly: UvPoint[]
  /** local date key → daily max */
  dailyMax: Record<string, number>
  /** peak for the place's current calendar day */
  todayPeak: UvPoint | null
  /** today's protection window, if UV reaches 3 */
  today: ProtectionWindow | null
  /** tomorrow's protection window, used once today's has passed */
  tomorrow: ProtectionWindow | null
}
