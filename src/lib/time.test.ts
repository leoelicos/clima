import { NOW, TZ } from '../test/fixtures'
import { daylightProgress, formatOffset, formatTime, isToday, localDateKey, localHour } from './time'

describe('time', () => {
  it('formats in the place’s local time, not the visitor’s', () => {
    expect(localHour(NOW, TZ)).toBe(14)
    expect(localDateKey(NOW, TZ)).toBe('2025-11-25')
    expect(localDateKey(NOW, -10 * 3600)).toBe('2025-11-24')
    expect(formatTime(NOW, TZ, 'en-AU')).toMatch(/2:20\s?pm/i)
  })

  it('formats UTC offsets', () => {
    expect(formatOffset(39600)).toBe('UTC+11')
    expect(formatOffset(-12600)).toBe('UTC−3:30')
    expect(formatOffset(0)).toBe('UTC+0')
  })

  it('knows when it is today and how far through the day we are', () => {
    expect(isToday(NOW + 3600, TZ, NOW)).toBe(true)
    expect(isToday(NOW + 24 * 3600, TZ, NOW)).toBe(false)
    expect(daylightProgress(50, 0, 100)).toBe(0.5)
    expect(daylightProgress(150, 0, 100)).toBeNull()
  })
})
