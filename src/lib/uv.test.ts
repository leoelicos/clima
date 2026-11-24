import { NOW, openMeteoSydney, TZ } from '../test/fixtures'
import { normaliseUv, openMeteoUrl, protectionMessage, protectionWindow, roundUv, uvAt, uvBand } from './uv'
import type { UvPoint } from './types'

const H = 3600
const t = (s: string) => new RegExp(s, 'i')

describe('uv bands (WHO)', () => {
  it.each([
    [0, 'low'],
    [2.4, 'low'],
    [2.5, 'moderate'],
    [5.4, 'moderate'],
    [6, 'high'],
    [7.6, 'very-high'],
    [10.4, 'very-high'],
    [11, 'extreme'],
    [14, 'extreme'],
  ] as const)('UV %d is %s', (uvi, level) => {
    expect(uvBand(uvi).level).toBe(level)
  })

  it('never rounds below zero', () => {
    expect(roundUv(-0.2)).toBe(0)
  })
})

describe('protectionWindow', () => {
  // UTC timezone keeps the arithmetic obvious: day starts at 0.
  const pts: UvPoint[] = [0, 1, 2, 4, 6, 4, 2, 0].map((uvi, i) => ({ dt: (6 + i) * H, uvi }))

  it('interpolates when UV crosses 3', () => {
    const w = protectionWindow(pts, '1970-01-01', 0)!
    expect(w.from).toBe(8.5 * H) // 2 → 4 between 08:00 and 09:00
    expect(w.to).toBe(11.5 * H)
    expect(w.peak).toEqual({ dt: 10 * H, uvi: 6 })
  })

  it('returns null on a low-UV day or a missing day', () => {
    expect(protectionWindow(pts.map((p) => ({ ...p, uvi: 1 })), '1970-01-01', 0)).toBeNull()
    expect(protectionWindow(pts, '1970-01-02', 0)).toBeNull()
  })

  it('finds the nearest point within 90 minutes', () => {
    expect(uvAt(pts, 10 * H + 1200)).toBe(6)
    expect(uvAt(pts, 30 * H)).toBeNull()
  })
})

describe('Open-Meteo', () => {
  it('asks for current, hourly and daily UV with unix times and local dates', () => {
    const url = openMeteoUrl(-33.86986, 151.20833)
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast')
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      latitude: '-33.8699',
      longitude: '151.2083',
      current: 'uv_index',
      hourly: 'uv_index',
      daily: 'uv_index_max',
      timezone: 'auto',
      timeformat: 'unixtime',
    })
    expect(url.searchParams.has('apikey')).toBe(false)
  })

  it('normalises a payload into today/tomorrow windows', () => {
    const uv = normaliseUv(openMeteoSydney, TZ, NOW)!
    expect(uv.now).toBeCloseTo(openMeteoSydney.current.uv_index)
    expect(uv.dailyMax['2025-11-25']).toBeGreaterThan(9)
    expect(roundUv(uv.todayPeak!.uvi)).toBe(9)
    expect(uv.today!.from).toBeLessThan(NOW)
    expect(uv.today!.to).toBeGreaterThan(NOW)
    expect(uv.tomorrow!.date).toBe('2025-11-26')
  })

  it('ignores null values and returns null with no data', () => {
    expect(normaliseUv({ utc_offset_seconds: 0, hourly: { time: [1, 2], uv_index: [null, null] } }, 0, 0)).toBeNull()
  })
})

describe('protectionMessage', () => {
  const uv = normaliseUv(openMeteoSydney, TZ, NOW)!

  it('before, during and after the window', () => {
    expect(protectionMessage(uv, uv.today!.from - H, TZ)).toMatchObject({ needed: true, headline: expect.stringMatching(t('^Sun protection recommended from 7:\\d\\d AM to 6:\\d\\d PM today')) })
    expect(protectionMessage(uv, NOW, TZ)).toMatchObject({ needed: true, headline: expect.stringMatching(t('recommended now, until 6:\\d\\d PM')) })
    const after = protectionMessage(uv, uv.today!.to + H, TZ)
    expect(after.needed).toBe(false)
    expect(after.headline).toMatch(t('below 3 for the rest of today. Tomorrow: protection from'))
  })

  it('says when no protection is needed', () => {
    expect(protectionMessage({ ...uv, today: null, tomorrow: null }, NOW, TZ).headline).toMatch(/No sun protection needed/)
  })
})
