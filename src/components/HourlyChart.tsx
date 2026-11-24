import { useId, useState, type CSSProperties } from 'react'
import { capitalise } from '../lib/conditions'
import { describeHourly, smoothPath } from '../lib/chart'
import { formatHour, formatTime } from '../lib/time'
import { percent, precip, temp, tempUnit } from '../lib/units'
import { roundUv, uvBand } from '../lib/uv'
import type { Hourly, Units } from '../lib/types'
import { Icon } from './Icon'
import { WeatherIcon } from './WeatherIcon'
import './HourlyChart.css'

const W = 720
const H = 264
const PAD = { top: 64, right: 28, bottom: 86, left: 28 }

export function HourlyChart({ hourly, timezone, units }: { hourly: Hourly[]; timezone: number; units: Units }) {
  const id = useId()
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const steps = hourly.slice(0, 9)
  if (steps.length < 2) return null

  const temps = steps.map((s) => temp(s.temp, units))
  const lo = Math.min(...temps)
  const hi = Math.max(...temps)
  const span = Math.max(hi - lo, 4)
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (i / (steps.length - 1)) * innerW
  const y = (t: number) => PAD.top + (1 - (t - (lo - (span - (hi - lo)) / 2)) / span) * innerH * 0.8 + innerH * 0.1
  const pts: [number, number][] = temps.map((t, i) => [x(i), y(t)])
  const line = smoothPath(pts)
  const area = `${line} L${x(steps.length - 1)} ${H - PAD.bottom} L${x(0)} ${H - PAD.bottom}Z`
  const barW = (innerW / (steps.length - 1)) * 0.42
  const summary = describeHourly(steps, timezone, units)

  return (
    <section className="hourly card" aria-labelledby={`${id}-title`}>
      <div className="section-bar">
        <h2 id={`${id}-title`} className="section-title">
          Next 24 hours
        </h2>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-pressed={view === 'table'}
          onClick={() => setView((v) => (v === 'chart' ? 'table' : 'chart'))}
        >
          <Icon name={view === 'chart' ? 'table' : 'chart'} size={16} />
          {view === 'chart' ? 'Show as table' : 'Show as chart'}
        </button>
      </div>
      <p id={`${id}-desc`} className="hourly-summary">
        {summary}
      </p>

      {view === 'chart' ? (
        <div className="hourly-scroll" role="region" aria-label="Hourly temperature chart, scrollable" tabIndex={0}>
          <figure className="hourly-figure">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="hourly-svg"
              role="img"
              aria-labelledby={`${id}-title ${id}-desc`}
            >
              <defs>
                <linearGradient id={`${id}-area`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`${id}-line`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="var(--cool)" />
                  <stop offset="100%" stopColor="var(--warm)" />
                </linearGradient>
              </defs>
              {steps.map((s, i) =>
                s.pop >= 0.1 ? (
                  <rect
                    key={`bar-${s.dt}`}
                    className="hourly-pop"
                    x={x(i) - barW / 2}
                    width={barW}
                    y={H - PAD.bottom - s.pop * innerH * 0.4}
                    height={s.pop * innerH * 0.4}
                    rx="4"
                  />
                ) : null,
              )}
              <path d={area} fill={`url(#${id}-area)`} className="hourly-area" />
              <path d={line} stroke={`url(#${id}-line)`} className="hourly-line" pathLength={1} />
              {steps.map((s, i) => (
                <g key={s.dt} className="hourly-point" style={{ '--i': i } as CSSProperties}>
                  <circle cx={x(i)} cy={y(temps[i]!)} r="4.5" className="hourly-dot" />
                  <text x={x(i)} y={y(temps[i]!) - 14} className="hourly-temp">
                    {temps[i]}°
                  </text>
                  <foreignObject x={x(i) - 14} y={8} width="28" height="28">
                    <WeatherIcon id={s.condition.id} isDay={s.isDay} size={28} />
                  </foreignObject>
                  {s.pop >= 0.1 ? (
                    <text x={x(i)} y={H - PAD.bottom + 20} className="hourly-pop-label">
                      {percent(s.pop)}%
                    </text>
                  ) : null}
                  {s.uvi !== null ? (
                    <g className="hourly-uv">
                      <circle cx={x(i) - 17} cy={H - 38} r="4" className="uv-dot" data-level={uvBand(s.uvi).level} />
                      <text x={x(i) + 3} y={H - 34} className="hourly-uv-label">
                        UV {roundUv(s.uvi)}
                      </text>
                    </g>
                  ) : null}
                  <text x={x(i)} y={H - 10} className="hourly-hour">
                    {i === 0 ? 'Now' : formatHour(s.dt, timezone)}
                  </text>
                </g>
              ))}
            </svg>
            <figcaption className="hourly-legend" aria-hidden="true">
              <span className="legend-line" /> Temperature ({tempUnit(units)})
              <span className="legend-bar" /> Chance of rain
              {steps.some((st) => st.uvi !== null) ? (
                <>
                  <span className="legend-uv" /> UV index
                </>
              ) : null}
            </figcaption>
          </figure>
        </div>
      ) : (
        <div className="hourly-scroll" role="region" aria-label="Hourly forecast table, scrollable" tabIndex={0}>
          <table className="data-table">
            <caption className="sr-only">Hourly forecast for the next 24 hours, in 3 hour steps</caption>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Conditions</th>
                <th scope="col">Temp ({tempUnit(units)})</th>
                <th scope="col">Feels like</th>
                <th scope="col">Chance of rain</th>
                <th scope="col">Precipitation</th>
                {steps.some((st) => st.uvi !== null) ? <th scope="col">UV index</th> : null}
              </tr>
            </thead>
            <tbody>
              {steps.map((s) => {
                const pr = precip(s.precip, units)
                return (
                  <tr key={s.dt}>
                    <th scope="row">{formatTime(s.dt, timezone)}</th>
                    <td>{capitalise(s.condition.description)}</td>
                    <td>{temp(s.temp, units)}°</td>
                    <td>{temp(s.feelsLike, units)}°</td>
                    <td>{percent(s.pop)}%</td>
                    <td>
                      {pr.value} {pr.unit}
                    </td>
                    {steps.some((st) => st.uvi !== null) ? (
                      <td>{s.uvi !== null ? `${roundUv(s.uvi)} (${uvBand(s.uvi).label})` : '—'}</td>
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
