import { capitalise, summarise } from '../lib/conditions'
import { formatDate, formatOffset, formatTime } from '../lib/time'
import { temp, tempSpoken, tempUnit, wind } from '../lib/units'
import type { Units, WeatherReport } from '../lib/types'
import { SunProtection } from './SunProtection'
import { WeatherIcon } from './WeatherIcon'
import './CurrentConditions.css'

export function CurrentConditions({ report, units }: { report: WeatherReport; units: Units }) {
  const { current, place, timezone, hourly } = report
  const isDay = current.dt >= current.sunrise && current.dt < current.sunset
  const description = capitalise(current.condition.description)
  const nextPop = Math.max(0, ...hourly.slice(0, 3).map((h) => h.pop))
  const summary = summarise({
    temp: current.temp,
    feelsLike: current.feelsLike,
    pop: nextPop,
    windKmh: current.windSpeed * 3.6,
  })
  const today = report.daily[0]

  return (
    <section className="now card card-hero" aria-labelledby="now-title">
      <div className="now-head">
        <h2 id="now-title" className="now-place display" tabIndex={-1}>
          {place.name}
          <span className="now-region">{[place.state, place.country].filter(Boolean).join(', ')}</span>
        </h2>
        <p className="now-time">
          <time dateTime={new Date(current.dt * 1000).toISOString()}>
            {formatDate(current.dt, timezone)} · {formatTime(current.dt, timezone)}
          </time>{' '}
          <span className="now-offset">{formatOffset(timezone)}</span>
        </p>
      </div>

      <div className="now-body">
        <WeatherIcon id={current.condition.id} isDay={isDay} size={148} animated className="now-icon" />
        <p className="now-temp">
          <span aria-hidden="true">
            {temp(current.temp, units)}
            <span className="now-unit">{tempUnit(units)}</span>
          </span>
          <span className="sr-only">{tempSpoken(current.temp, units)}</span>
        </p>
        <div className="now-desc">
          <p className="now-condition">{description}</p>
          <p className="now-feels">
            Feels like {temp(current.feelsLike, units)}
            {tempUnit(units)}
          </p>
          {today ? (
            <p className="now-range">
              <span>
                <abbr title="High">H</abbr> {temp(today.max, units)}°
              </span>
              <span>
                <abbr title="Low">L</abbr> {temp(today.min, units)}°
              </span>
            </p>
          ) : null}
        </div>
      </div>

      <p className="now-summary">
        {summary}{' '}
        <span className="now-wind-inline">
          Wind {wind(current.windSpeed, units).value} {wind(current.windSpeed, units).unit}.
        </span>
      </p>

      {report.uv ? <SunProtection uv={report.uv} now={current.dt} timezone={timezone} /> : null}
    </section>
  )
}
