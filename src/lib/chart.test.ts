import { forecastSydney, TZ } from '../test/fixtures'
import { normaliseHourly } from './api'
import { describeHourly, smoothPath } from './chart'

describe('chart helpers', () => {
  it('builds a smooth path through every point', () => {
    const d = smoothPath([
      [0, 0],
      [10, 10],
      [20, 0],
    ])
    expect(d.startsWith('M0.0 0.0')).toBe(true)
    expect(d.match(/C/g)).toHaveLength(2)
    expect(d.endsWith('20.0 0.0')).toBe(true)
    expect(smoothPath([])).toBe('')
  })

  it('writes a text alternative for the chart', () => {
    const steps = forecastSydney.list.slice(0, 9).map(normaliseHourly)
    const text = describeHourly(steps, TZ, 'metric')
    expect(text).toMatch(/^Over the next 24 hours temperatures range from \d+°C at .+ to \d+°C at .+\./)
    expect(text).toMatch(/chance of rain is 65%/)
    expect(describeHourly([], TZ, 'metric')).toMatch(/No hourly/)
  })
})
