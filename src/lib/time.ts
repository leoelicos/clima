/**
 * All weather times are rendered in the *place's* local time, not the visitor's.
 * OpenWeather gives a fixed UTC offset in seconds, so we shift the timestamp and
 * format it as UTC.
 */
function shifted(dt: number, timezone: number): Date {
  return new Date((dt + timezone) * 1000)
}

export function localDateKey(dt: number, timezone: number): string {
  return shifted(dt, timezone).toISOString().slice(0, 10)
}

export function localHour(dt: number, timezone: number): number {
  return shifted(dt, timezone).getUTCHours()
}

const fmtCache = new Map<string, Intl.DateTimeFormat>()
function fmt(options: Intl.DateTimeFormatOptions, locale?: string): Intl.DateTimeFormat {
  const id = `${locale ?? ''}|${JSON.stringify(options)}`
  let f = fmtCache.get(id)
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' })
    fmtCache.set(id, f)
  }
  return f
}

export function formatTime(dt: number, timezone: number, locale?: string): string {
  return fmt({ hour: 'numeric', minute: '2-digit' }, locale).format(shifted(dt, timezone))
}

export function formatHour(dt: number, timezone: number, locale?: string): string {
  return fmt({ hour: 'numeric' }, locale).format(shifted(dt, timezone))
}

export function formatWeekday(dt: number, timezone: number, style: 'short' | 'long' = 'short', locale?: string): string {
  return fmt({ weekday: style }, locale).format(shifted(dt, timezone))
}

export function formatDate(dt: number, timezone: number, locale?: string): string {
  return fmt({ weekday: 'long', day: 'numeric', month: 'long' }, locale).format(shifted(dt, timezone))
}

/** Is `dt` the same calendar day as `now` at the place? */
export function isToday(dt: number, timezone: number, now = Date.now() / 1000): boolean {
  return localDateKey(dt, timezone) === localDateKey(now, timezone)
}

/** "UTC+11" / "UTC−3:30" */
export function formatOffset(timezone: number): string {
  const sign = timezone >= 0 ? '+' : '−'
  const abs = Math.abs(timezone)
  const h = Math.floor(abs / 3600)
  const m = Math.round((abs % 3600) / 60)
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`
}

/** 0..1 progress of the sun between sunrise and sunset, or null at night. */
export function daylightProgress(now: number, sunrise: number, sunset: number): number | null {
  if (now < sunrise || now > sunset) return null
  return (now - sunrise) / (sunset - sunrise)
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return `${h} h ${m} min`
}
