/** Deterministic OpenWeather-shaped fixtures (Sydney, AEDT +11). */
export const NOW = 1_764_040_800 // 2025-11-25T03:20:00Z → 2:20 pm in Sydney
export const TZ = 39_600

export const sydneyGeo = [
  { name: 'Sydney', local_names: { en: 'Sydney' }, lat: -33.8698, lon: 151.2083, country: 'AU', state: 'New South Wales' },
  { name: 'Sydney', lat: 46.1351, lon: -60.1831, country: 'CA', state: 'Nova Scotia' },
  { name: 'Sydney', lat: 46.1351, lon: -60.1831, country: 'CA', state: 'Nova Scotia' }, // duplicate on purpose
]

export const currentSydney = {
  dt: NOW,
  timezone: TZ,
  name: 'Sydney',
  weather: [{ id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }],
  main: { temp: 24.3, feels_like: 24.9, temp_min: 21.8, temp_max: 26.1, pressure: 1016, humidity: 62 },
  visibility: 10000,
  wind: { speed: 5.7, deg: 40, gust: 8.2 },
  clouds: { all: 20 },
  sys: { country: 'AU', sunrise: NOW - 8 * 3600, sunset: NOW + 5 * 3600 + 1800 },
}

const conditions = [
  { id: 801, main: 'Clouds', description: 'few clouds', icon: '02' },
  { id: 500, main: 'Rain', description: 'light rain', icon: '10' },
  { id: 800, main: 'Clear', description: 'clear sky', icon: '01' },
  { id: 803, main: 'Clouds', description: 'broken clouds', icon: '04' },
]

export const forecastSydney = {
  city: { timezone: TZ },
  list: Array.from({ length: 40 }, (_, i) => {
    const dt = NOW + 2400 + i * 3 * 3600
    const hour = new Date((dt + TZ) * 1000).getUTCHours()
    const day = hour >= 6 && hour < 19
    const c = conditions[Math.floor(i / 3) % conditions.length]!
    return {
      dt,
      main: { temp: 18 + 6 * Math.sin(((hour - 9) / 24) * 2 * Math.PI) + (i % 5) * 0.3, feels_like: 18, humidity: 60 },
      weather: [{ ...c, icon: `${c.icon}${day ? 'd' : 'n'}` }],
      wind: { speed: 4 },
      pop: c.id === 500 ? 0.65 : 0.05,
      ...(c.id === 500 ? { rain: { '3h': 1.2 } } : {}),
      sys: { pod: day ? ('d' as const) : ('n' as const) },
    }
  }),
}

export const airSydney = {
  list: [{ main: { aqi: 2 }, components: { pm2_5: 8.4, pm10: 14.1, o3: 61, no2: 9 } }],
}

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Minimal router standing in for api.openweathermap.org. */
export function mockOpenWeather(overrides: Partial<Record<'geo' | 'weather' | 'forecast' | 'air', () => Response>> = {}) {
  const json = jsonResponse
  return async (input: RequestInfo | URL): Promise<Response> => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    if (url.pathname.startsWith('/geo/1.0/direct')) return overrides.geo?.() ?? json(url.searchParams.get('q')?.toLowerCase().startsWith('syd') ? sydneyGeo : [])
    if (url.pathname.startsWith('/geo/1.0/reverse')) return json(sydneyGeo.slice(0, 1))
    if (url.pathname === '/data/2.5/weather') return overrides.weather?.() ?? json(currentSydney)
    if (url.pathname === '/data/2.5/forecast') return overrides.forecast?.() ?? json(forecastSydney)
    if (url.pathname === '/data/2.5/air_pollution') return overrides.air?.() ?? json(airSydney)
    return json({ message: 'not found' }, 404)
  }
}
