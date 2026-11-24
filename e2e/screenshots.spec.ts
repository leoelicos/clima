import { expect, test } from '@playwright/test'
import { mockApi, seed } from './helpers.ts'

// Regenerates README screenshots: `npm run screenshots` (PNG; the committed copies were converted to WebP to keep the repo small)
test.skip(!process.env.SCREENSHOTS, 'Set SCREENSHOTS=1 to regenerate docs/screenshots')

for (const theme of ['dark', 'light'] as const) {
  test(`dashboard ${theme}`, async ({ page }, info) => {
    await mockApi(page)
    await seed(page, { theme, history: true })
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('./')
    await expect(page.getByRole('heading', { level: 2, name: /^Sydney/ })).toBeVisible()
    if (info.project.name === 'desktop') {
      // Size the viewport to the content so the fixed sky backdrop covers the whole shot.
      const height = await page.evaluate(() => document.documentElement.scrollHeight)
      await page.setViewportSize({ width: 1360, height })
    }
    await page.waitForTimeout(400)
    await page.screenshot({ path: `docs/screenshots/${info.project.name}-${theme}.png` })
  })
}

test('empty state', async ({ page }, info) => {
  await mockApi(page)
  await seed(page, { theme: 'dark' })
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.goto('./')
  await expect(page.getByRole('heading', { name: /where to/i })).toBeVisible()
  await page.screenshot({ path: `docs/screenshots/${info.project.name}-empty.png` })
})
