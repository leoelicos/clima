import axe from 'axe-core'
import { expect } from 'vitest'

/**
 * Runs axe-core against a rendered container. Colour contrast is disabled here
 * because jsdom has no layout/paint; the Playwright e2e suite checks contrast
 * against real rendering in both themes.
 */
export async function expectNoAxeViolations(container: Element = document.body) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
  })
  const summary = results.violations.map((v) => `${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`)
  expect(summary).toEqual([])
}
