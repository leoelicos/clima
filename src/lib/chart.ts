import { formatTime } from './time'
import { percent, temp, tempUnit } from './units'
import { roundUv, uvBand } from './uv'
import type { Hourly, Units } from './types'

/** Catmull-Rom → cubic Bézier for a smooth line through every point. */
export function smoothPath(points: [number, number][]): string {
  if (points.length === 0) return ''
  const [first] = points
  let d = `M${first![0].toFixed(1)} ${first![1].toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

/** Plain-language summary used as the chart's text alternative (WCAG 1.1.1). */
export function describeHourly(steps: Hourly[], timezone: number, units: Units): string {
  if (steps.length === 0) return 'No hourly forecast available.'
  const hottest = steps.reduce((a, b) => (b.temp > a.temp ? b : a))
  const coldest = steps.reduce((a, b) => (b.temp < a.temp ? b : a))
  const wettest = steps.reduce((a, b) => (b.pop > a.pop ? b : a))
  const u = tempUnit(units)
  let s = `Over the next ${steps.length * 3 - 3} hours temperatures range from ${temp(coldest.temp, units)}${u} at ${formatTime(coldest.dt, timezone)} to ${temp(hottest.temp, units)}${u} at ${formatTime(hottest.dt, timezone)}.`
  s += wettest.pop >= 0.1 ? ` Highest chance of rain is ${percent(wettest.pop)}% at ${formatTime(wettest.dt, timezone)}.` : ' Little to no rain expected.'
  const withUv = steps.filter((h): h is Hourly & { uvi: number } => h.uvi !== null)
  if (withUv.length) {
    const sunniest = withUv.reduce((a, b) => (b.uvi > a.uvi ? b : a))
    s += roundUv(sunniest.uvi) >= 1 ? ` UV peaks at ${roundUv(sunniest.uvi)} (${uvBand(sunniest.uvi).label.toLowerCase()}) at ${formatTime(sunniest.dt, timezone)}.` : ' UV stays low.'
  }
  return s
}
