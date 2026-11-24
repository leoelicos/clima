import { expect, test } from '@playwright/test'
import { mockApi, seed } from './helpers.ts'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('keyboard-only: skip link, search, choose, toggle units', async ({ page }) => {
  await seed(page)
  await page.goto('./')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: /skip to content/i })).toBeFocused()

  await page.keyboard.press('/')
  const combo = page.getByRole('combobox', { name: /search for a city/i })
  await expect(combo).toBeFocused()
  await combo.pressSequentially('Syd')
  await expect(page.getByRole('option')).toHaveCount(2)
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 2, name: /^Sydney/ })).toBeVisible()
  await expect(page).toHaveTitle(/Sydney/)

  await page.getByRole('radio', { name: '°F' }).focus()
  await page.keyboard.press('Space')
  await expect(page.getByText('76 degrees Fahrenheit', { exact: true })).toBeAttached()
})

test('chart has a data table alternative', async ({ page }) => {
  await seed(page, { history: true })
  await page.goto('./')
  await page.getByRole('button', { name: /show as table/i }).click()
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(10)
})

test('geolocation is optional and handled gracefully', async ({ page, context }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: -33.87, longitude: 151.21 })
  await seed(page)
  await page.goto('./')
  await page.getByRole('button', { name: /use my location/i }).click()
  await expect(page.getByRole('heading', { level: 2, name: /^Sydney/ })).toBeVisible()
})

test('no horizontal page overflow', async ({ page }) => {
  await seed(page, { history: true })
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 2, name: /^Sydney/ })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
