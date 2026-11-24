import type { CSSProperties, ReactNode } from 'react'
import { aqiLabel } from '../lib/conditions'
import { daylightProgress, formatDuration, formatTime } from '../lib/time'
import { compass, compassSpoken, distance, pressure, wind } from '../lib/units'
import { roundUv, uvBand, type UvLevel } from '../lib/uv'
import type { Units, WeatherReport } from '../lib/types'
import { Icon, type IconName } from './Icon'
import './Highlights.css'

function Tile({ title, icon, children, className }: { title: string; icon: IconName; children: ReactNode; className?: string }) {
  return (
    <li className={['tile card', className].filter(Boolean).join(' ')}>
      <h3 className="tile-title">
        <Icon name={icon} size={16} />
        {title}
      </h3>
      {children}
    </li>
  )
}

function WindCompass({ deg, speed }: { deg: number; speed: string }) {
  return (
    <svg className="compass" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="44" className="compass-ring" />
      {Array.from({ length: 36 }, (_, i) => (
        <line
          key={i}
          x1="50"
          y1="8"
          x2="50"
          y2={i % 9 === 0 ? 15 : 11}
          className={i % 9 === 0 ? 'compass-tick major' : 'compass-tick'}
          transform={`rotate(${i * 10} 50 50)`}
        />
      ))}
      {(['N', 'E', 'S', 'W'] as const).map((c, i) => (
        <text key={c} x="50" y="25" className="compass-label" transform={`rotate(${i * 90} 50 50)`}>
          {c}
        </text>
      ))}
      {/* Arrow points where the wind is blowing TO (meteorological deg is where it comes FROM). */}
      <g className="compass-needle" style={{ rotate: `${deg + 180}deg` }}>
        <path d="M50 18 56 50 50 46 44 50Z" className="compass-head" />
        <path d="M50 82 53 50 50 54 47 50Z" className="compass-tail" />
      </g>
      <circle cx="50" cy="50" r="15" className="compass-hub" />
      <text x="50" y="54" className="compass-speed">
        {speed}
      </text>
    </svg>
  )
}

function SunArc({ progress }: { progress: number | null }) {
  // Semicircle from (10,60) to (110,60), radius 50.
  const t = progress ?? 0
  const angle = Math.PI * (1 - t)
  const x = 60 + 50 * Math.cos(angle)
  const y = 60 - 50 * Math.sin(angle)
  return (
    <svg className="sun-arc" viewBox="0 0 120 70" aria-hidden="true" focusable="false">
      <path d="M10 60A50 50 0 0 1 110 60" className="sun-arc-track" />
      {progress !== null ? (
        <>
          <path d={`M10 60A50 50 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`} className="sun-arc-fill" />
          <circle cx={x} cy={y} r="6" className="sun-arc-sun" />
        </>
      ) : null}
      <line x1="2" y1="60" x2="118" y2="60" className="sun-arc-horizon" />
    </svg>
  )
}

const UV_LEVELS: { level: UvLevel; span: number }[] = [
  { level: 'low', span: 3 },
  { level: 'moderate', span: 3 },
  { level: 'high', span: 2 },
  { level: 'very-high', span: 3 },
  { level: 'extreme', span: 1 },
]

/** WHO-coloured 0–11+ scale with a marker. Decorative; the value is in text. */
function UvScale({ uvi }: { uvi: number }) {
  const pos = Math.min(roundUv(uvi), 11.5) / 12
  return (
    <div className="uv-scale" aria-hidden="true">
      <div className="uv-scale-track">
        {UV_LEVELS.map((l) => (
          <span key={l.level} data-level={l.level} style={{ flexGrow: l.span }} />
        ))}
      </div>
      <span className="uv-scale-marker" style={{ insetInlineStart: `${pos * 100}%` }} />
      <div className="uv-scale-ticks">
        {[
          ['0', 0],
          ['3', 25],
          ['6', 50],
          ['8', 66.7],
          ['11+', 100],
        ].map(([label, at]) => (
          <span key={label} style={{ '--at': `${at}%` } as CSSProperties}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  return <meter className="meter" min={0} max={max} value={value} aria-label={label} />
}

export function Highlights({ report, units }: { report: WeatherReport; units: Units }) {
  const { current, timezone, air } = report
  const w = wind(current.windSpeed, units)
  const gust = current.windGust !== null ? wind(current.windGust, units) : null
  const vis = current.visibility !== null ? distance(current.visibility, units) : null
  const p = pressure(current.pressure, units)
  const progress = daylightProgress(current.dt, current.sunrise, current.sunset)
  const daylight = formatDuration(current.sunset - current.sunrise)

  return (
    <section className="highlights" aria-labelledby="highlights-title">
      <h2 id="highlights-title" className="section-title">
        Right now
      </h2>
      <ul className="tiles">
        <Tile title="Wind" icon="wind" className="tile-wind">
          <WindCompass deg={current.windDeg} speed={String(w.value)} />
          <p className="tile-value">
            {w.value} <span className="tile-unit">{w.unit}</span>
          </p>
          <p className="tile-note">
            <span aria-hidden="true">From {compass(current.windDeg)}</span>
            <span className="sr-only">From the {compassSpoken(current.windDeg)}</span>
            {gust ? (
              <>
                {' '}
                · gusts {gust.value} {gust.unit}
              </>
            ) : null}
          </p>
        </Tile>

        <Tile title="Sun" icon="sunrise" className="tile-sun">
          <SunArc progress={progress} />
          <dl className="tile-pairs">
            <div>
              <dt>Sunrise</dt>
              <dd>{formatTime(current.sunrise, timezone)}</dd>
            </div>
            <div>
              <dt>Sunset</dt>
              <dd>{formatTime(current.sunset, timezone)}</dd>
            </div>
          </dl>
          <p className="tile-note">
            {daylight} of daylight
            {progress !== null ? ` · ${Math.round(progress * 100)}% through the day` : ' · the sun has set'}
          </p>
        </Tile>

        {report.uv ? (
          <Tile title="UV index" icon="sun" className="tile-uv">
            <p className="tile-value">
              {roundUv(report.uv.now)} <span className="tile-unit">{uvBand(report.uv.now).label}</span>
            </p>
            <UvScale uvi={report.uv.now} />
            <p className="tile-note">
              {report.uv.todayPeak && report.uv.todayPeak.dt > current.dt
                ? `Peaks at ${roundUv(report.uv.todayPeak.uvi)} around ${formatTime(report.uv.todayPeak.dt, timezone)}`
                : report.uv.todayPeak
                  ? `Today’s peak was ${roundUv(report.uv.todayPeak.uvi)} at ${formatTime(report.uv.todayPeak.dt, timezone)}`
                  : 'No peak data for today'}
            </p>
          </Tile>
        ) : null}

        <Tile title="Humidity" icon="droplet">
          <p className="tile-value">
            {current.humidity}
            <span className="tile-unit">%</span>
          </p>
          <Meter value={current.humidity} max={100} label="Humidity" />
          <p className="tile-note">{current.clouds}% cloud cover</p>
        </Tile>

        <Tile title="Air quality" icon="leaf" className="tile-air">
          {air ? (
            <>
              <p className="tile-value" data-aqi={air.aqi}>
                {aqiLabel(air.aqi)}
              </p>
              <ol className="aqi-scale" aria-label={`Air quality index ${air.aqi} of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <li key={n} data-level={n} aria-current={n === air.aqi ? 'true' : undefined}>
                    <span className="sr-only">
                      {n} {aqiLabel(n)}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="tile-note">
                PM<sub>2.5</sub> {Math.round(air.pm2_5)} µg/m³
              </p>
            </>
          ) : (
            <p className="tile-note">Not available for this location.</p>
          )}
        </Tile>

        <Tile title="Visibility" icon="eye">
          <p className="tile-value">
            {vis ? vis.value : '—'} {vis ? <span className="tile-unit">{vis.unit}</span> : null}
          </p>
          <p className="tile-note">{current.visibility !== null && current.visibility >= 10000 ? 'Crystal clear' : 'Reduced visibility'}</p>
        </Tile>

        <Tile title="Pressure" icon="gauge">
          <p className="tile-value">
            {p.value} <span className="tile-unit">{p.unit}</span>
          </p>
          <p className="tile-note">{current.pressure >= 1013 ? 'Higher than average' : 'Lower than average'}</p>
        </Tile>
      </ul>
    </section>
  )
}
