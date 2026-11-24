import type { Page } from '@playwright/test'
import { airSydney, currentSydney, forecastSydney, openMeteoSydney, sydneyGeo } from '../src/test/fixtures.ts'

export const TEST_KEY = '0123456789abcdef0123456789abcdef'

/** Serves OpenWeather and Open-Meteo fixtures so e2e runs are deterministic and need no real key. */
export async function mockApi(page: Page) {
  await page.route('https://api.openweathermap.org/**', async (route) => {
    const url = new URL(route.request().url())
    const body = url.pathname.startsWith('/geo/1.0/direct')
      ? url.searchParams.get('q')?.toLowerCase().startsWith('syd')
        ? sydneyGeo
        : []
      : url.pathname.startsWith('/geo/1.0/reverse')
        ? sydneyGeo.slice(0, 1)
        : url.pathname === '/data/2.5/weather'
          ? currentSydney
          : url.pathname === '/data/2.5/forecast'
            ? forecastSydney
            : url.pathname === '/data/2.5/air_pollution'
              ? airSydney
              : null
    await route.fulfill({ status: body ? 200 : 404, json: body ?? { message: 'not found' } })
  })
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: openMeteoSydney }))
}

export async function seed(page: Page, opts: { key?: boolean; theme?: 'light' | 'dark'; history?: boolean } = {}) {
  await page.addInitScript(
    ({ key, theme, history, sydney }) => {
      if (key) localStorage.setItem('clima:api-key', key)
      if (theme) localStorage.setItem('clima:theme', JSON.stringify(theme))
      localStorage.setItem('clima:units', '"metric"')
      if (history) localStorage.setItem('clima:history', JSON.stringify([sydney]))
    },
    {
      key: opts.key === false ? null : TEST_KEY,
      theme: opts.theme ?? null,
      history: opts.history ?? false,
      sydney: { name: 'Sydney', state: 'New South Wales', country: 'AU', lat: -33.8698, lon: 151.2083 },
    },
  )
}
