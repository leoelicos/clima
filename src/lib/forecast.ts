import { localDateKey } from './time'
import type { Condition, Current, Daily, Hourly } from './types'

/** Higher number = more noteworthy, so a stormy afternoon beats a clear morning. */
export function severity(id: number): number {
  if (id >= 200 && id < 300) return 7 // thunderstorm
  if (id >= 600 && id < 700) return 6 // snow
  if (id >= 500 && id < 600) return 5 // rain
  if (id >= 300 && id < 400) return 4 // drizzle
  if (id >= 700 && id < 800) return 3 // atmosphere (mist, fog...)
  if (id > 801) return 2 // broken / overcast clouds
  if (id === 801) return 1
  return 0 // clear
}

function representativeCondition(items: Hourly[]): Condition {
  // Prefer daytime steps; pick the most severe condition that appears at least twice,
  // falling back to the most severe overall.
  const pool = items.some((h) => h.isDay) ? items.filter((h) => h.isDay) : items
  const counts = new Map<number, { n: number; c: Condition }>()
  for (const h of pool) {
    const entry = counts.get(h.condition.id)
    counts.set(h.condition.id, { n: (entry?.n ?? 0) + 1, c: entry?.c ?? h.condition })
  }
  const ranked = [...counts.values()].toSorted((a, b) => severity(b.c.id) - severity(a.c.id) || b.n - a.n)
  const recurring = ranked.find((r) => r.n >= 2)
  const chosen = (recurring ?? ranked[0])!.c
  // Always show the daytime variant of the icon in the daily strip.
  return { ...chosen, icon: chosen.icon.replace(/n$/, 'd') }
}

/**
 * Aggregates 3-hourly forecast steps into calendar days in the place's own timezone.
 * The current observation is folded into "today" so its high/low is honest.
 */
export function toDaily(hourly: Hourly[], timezone: number, current?: Current): Daily[] {
  const groups = new Map<string, Hourly[]>()
  for (const h of hourly) {
    const key = localDateKey(h.dt, timezone)
    const list = groups.get(key)
    if (list) list.push(h)
    else groups.set(key, [h])
  }

  const days: Daily[] = []
  for (const [date, items] of groups) {
    const temps = items.map((h) => h.temp)
    let min = Math.min(...temps)
    let max = Math.max(...temps)
    if (current && localDateKey(current.dt, timezone) === date) {
      min = Math.min(min, current.temp, current.tempMin)
      max = Math.max(max, current.temp, current.tempMax)
    }
    days.push({
      date,
      dt: items[Math.floor(items.length / 2)]!.dt,
      min,
      max,
      pop: Math.max(...items.map((h) => h.pop)),
      precip: items.reduce((sum, h) => sum + h.precip, 0),
      condition: representativeCondition(items),
    })
  }

  // A trailing day with only one or two steps is misleading; drop it if we have enough days.
  const last = days.at(-1)
  if (last && days.length > 5 && (groups.get(last.date)?.length ?? 0) < 3) days.pop()
  return days
}
