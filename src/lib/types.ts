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
  fetchedAt: number
}

export type Units = 'metric' | 'imperial'
export type ThemePref = 'system' | 'light' | 'dark'
