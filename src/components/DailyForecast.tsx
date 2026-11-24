import type { CSSProperties } from 'react'
import { capitalise } from '../lib/conditions'
import { formatWeekday, isToday } from '../lib/time'
import { percent, temp, tempSpoken } from '../lib/units'
import type { Daily, Units } from '../lib/types'
import { roundUv, uvBand } from '../lib/uv'
import { Icon } from './Icon'
import { WeatherIcon } from './WeatherIcon'
import './DailyForecast.css'

export function DailyForecast({ daily, timezone, units, now }: { daily: Daily[]; timezone: number; units: Units; now: number }) {
  if (daily.length === 0) return null
  const weekMin = Math.min(...daily.map((d) => d.min))
  const weekMax = Math.max(...daily.map((d) => d.max))
  const range = Math.max(weekMax - weekMin, 1)

  return (
    <section className="daily card" aria-labelledby="daily-title">
      <h2 id="daily-title" className="section-title">
        {daily.length}-day forecast
      </h2>
      <ol className="daily-list">
        {daily.map((d) => {
          const name = isToday(d.dt, timezone, now) ? 'Today' : formatWeekday(d.dt, timezone, 'short')
          const longName = isToday(d.dt, timezone, now) ? 'Today' : formatWeekday(d.dt, timezone, 'long')
          const start = ((d.min - weekMin) / range) * 100
          const end = ((d.max - weekMin) / range) * 100
          return (
            <li key={d.date} className="daily-row">
              <span className="daily-day">
                <span aria-hidden="true">{name}</span>
                <span className="sr-only">{longName}:</span>
              </span>
              <span className="daily-cond">
                <WeatherIcon id={d.condition.id} size={36} />
                <span className="sr-only">{capitalise(d.condition.description)},</span>
              </span>
              <span className="daily-meta">
                {d.pop >= 0.1 ? (
                  <span className="daily-pop">
                    <Icon name="droplet" size={14} /> {percent(d.pop)}%<span className="sr-only"> chance of rain,</span>
                  </span>
                ) : null}
                {d.uvMax !== null ? (
                  <span className="daily-uv">
                    <span className="uv-swatch" data-level={uvBand(d.uvMax).level} aria-hidden="true" />
                    <span aria-hidden="true">UV {roundUv(d.uvMax)}</span>
                    <span className="sr-only">
                      UV index up to {roundUv(d.uvMax)}, {uvBand(d.uvMax).label.toLowerCase()},
                    </span>
                  </span>
                ) : null}
              </span>
              <span className="daily-min">
                <span aria-hidden="true">{temp(d.min, units)}°</span>
                <span className="sr-only">low {tempSpoken(d.min, units)},</span>
              </span>
              <span
                className="daily-bar"
                aria-hidden="true"
                style={{ '--start': `${start}%`, '--end': `${end}%` } as CSSProperties}
              >
                <span className="daily-bar-fill" />
              </span>
              <span className="daily-max">
                <span aria-hidden="true">{temp(d.max, units)}°</span>
                <span className="sr-only">high {tempSpoken(d.max, units)}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
