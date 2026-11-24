import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { mockApi, seed } from './helpers.ts'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme, reducedMotion: 'reduce' })

    test('dashboard has no axe violations (incl. colour contrast)', async ({ page }) => {
      await mockApi(page)
      await seed(page, { theme, history: true })
      await page.goto('./')
      await expect(page.getByRole('heading', { level: 2, name: /^Sydney/ })).toBeVisible()
      await page.getByText(/how to protect yourself/i).click()
      await page.getByRole('button', { name: /show as table/i }).click()
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
    })

    test('empty state has no axe violations', async ({ page }) => {
      await mockApi(page)
      await seed(page, { theme })
      await page.goto('./')
      await expect(page.getByRole('heading', { name: /where to/i })).toBeVisible()
      expect((await new AxeBuilder({ page }).withTags(TAGS).analyze()).violations).toEqual([])
    })

    test('API-key setup has no axe violations', async ({ page }) => {
      await mockApi(page)
      await seed(page, { theme, key: false })
      await page.goto('./')
      await expect(page.getByRole('heading', { name: /connect openweather/i })).toBeVisible()
      expect((await new AxeBuilder({ page }).withTags(TAGS).analyze()).violations).toEqual([])
    })
  })
}
