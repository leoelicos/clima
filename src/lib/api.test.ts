import { airSydney, currentSydney, jsonResponse, mockOpenWeather, sydneyGeo } from '../test/fixtures'
import { ApiError, dedupePlaces, describeError, fetchWeather, normaliseAir, normalisePlace, searchPlaces } from './api'

const sydney = normalisePlace(sydneyGeo[0]!)

describe('api', () => {
  it('normalises and de-duplicates geocoding results', async () => {
    const places = await searchPlaces('Syd', { key: 'k', fetcher: mockOpenWeather() as typeof fetch })
    expect(places).toHaveLength(2)
    expect(places[0]).toEqual({ name: 'Sydney', lat: -33.8698, lon: 151.2083, country: 'AU', state: 'New South Wales' })
    expect(dedupePlaces([sydney, { ...sydney }])).toHaveLength(1)
  })

  it('skips the network for very short queries', async () => {
    const fetcher = vi.fn<typeof fetch>()
    expect(await searchPlaces('a', { key: 'k', fetcher })).toEqual([])
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('sends the key as appid and never without one', async () => {
    const fetcher = vi.fn<typeof fetch>(mockOpenWeather())
    await searchPlaces('Sydney', { key: 'abc123', fetcher })
    const url = new URL(String(fetcher.mock.calls[0]![0]))
    expect(url.searchParams.get('appid')).toBe('abc123')
    await expect(searchPlaces('Sydney', { key: null, fetcher })).rejects.toMatchObject({ kind: 'no-key' })
  })

  it('builds a full weather report', async () => {
    const report = await fetchWeather(sydney, { key: 'k', fetcher: mockOpenWeather() as typeof fetch })
    expect(report.timezone).toBe(39600)
    expect(report.current.temp).toBe(currentSydney.main.temp)
    expect(report.hourly).toHaveLength(40)
    expect(report.daily.length).toBeGreaterThanOrEqual(5)
    expect(report.air).toEqual(normaliseAir(airSydney))
  })

  it('merges Open-Meteo UV into the report without needing a key for it', async () => {
    const fetcher = vi.fn<typeof fetch>(mockOpenWeather())
    const report = await fetchWeather(sydney, { key: 'k', fetcher })
    const uvCall = fetcher.mock.calls.map(([u]) => new URL(String(u))).find((u) => u.hostname === 'api.open-meteo.com')!
    expect(uvCall.searchParams.has('appid')).toBe(false)
    expect(report.uv).not.toBeNull()
    expect(report.hourly.every((h) => typeof h.uvi === 'number')).toBe(true)
    expect(report.daily.slice(0, 5).every((d) => typeof d.uvMax === 'number')).toBe(true)
  })

  it('still returns a report when UV fails', async () => {
    const fetcher = mockOpenWeather({ uv: () => jsonResponse({ error: true }, 429) })
    const report = await fetchWeather(sydney, { key: 'k', fetcher })
    expect(report.uv).toBeNull()
    expect(report.hourly[0]!.uvi).toBeNull()
    expect(report.daily[0]!.uvMax).toBeNull()
  })

  it('still returns a report when air quality fails', async () => {
    const fetcher = mockOpenWeather({ air: () => jsonResponse({}, 500) })
    const report = await fetchWeather(sydney, { key: 'k', fetcher })
    expect(report.air).toBeNull()
  })

  it.each([
    [401, 'unauthorized'],
    [404, 'not-found'],
    [429, 'rate-limited'],
    [503, 'server'],
    [418, 'unknown'],
  ] as const)('maps HTTP %i to %s', async (status, kind) => {
    const fetcher = mockOpenWeather({ weather: () => jsonResponse({}, status) })
    const err = await fetchWeather(sydney, { key: 'k', fetcher }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).kind).toBe(kind)
    expect(describeError(err).title.length).toBeGreaterThan(0)
  })

  it('reports network failures', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(searchPlaces('Sydney', { key: 'k', fetcher })).rejects.toBeInstanceOf(ApiError)
  })
})
