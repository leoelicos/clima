import { forecastSydney, currentSydney, TZ } from '../test/fixtures'
import { normaliseCurrent, normaliseHourly } from './api'
import { severity, toDaily } from './forecast'

const hourly = forecastSydney.list.map(normaliseHourly)
const current = normaliseCurrent(currentSydney)

describe('toDaily', () => {
  const days = toDaily(hourly, TZ, current)

  it('groups 3-hourly steps into local calendar days', () => {
    expect(days.length).toBeGreaterThanOrEqual(5)
    expect(days.length).toBeLessThanOrEqual(6)
    expect(days[0]!.date).toBe('2025-11-25')
    expect(new Set(days.map((d) => d.date)).size).toBe(days.length)
  })

  it('folds the current observation into today’s range', () => {
    expect(days[0]!.max).toBeGreaterThanOrEqual(current.tempMax)
    expect(days[0]!.min).toBeLessThanOrEqual(current.tempMin)
  })

  it('uses daytime icons and max chance of rain', () => {
    for (const d of days) {
      expect(d.condition.icon.endsWith('d')).toBe(true)
      expect(d.min).toBeLessThanOrEqual(d.max)
      expect(d.pop).toBeGreaterThanOrEqual(0)
    }
    expect(days.some((d) => d.pop === 0.65)).toBe(true)
  })

  it('ranks severe weather above clear skies', () => {
    expect(severity(211)).toBeGreaterThan(severity(500))
    expect(severity(500)).toBeGreaterThan(severity(800))
    expect(severity(804)).toBeGreaterThan(severity(801))
  })
})
