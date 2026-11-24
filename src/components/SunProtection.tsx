import { useId } from 'react'
import { formatTime } from '../lib/time'
import { FIVE_S, protectionMessage, roundUv, uvBand } from '../lib/uv'
import type { UvReport } from '../lib/types'
import { Icon } from './Icon'
import './SunProtection.css'

export function SunProtection({ uv, now, timezone }: { uv: UvReport; now: number; timezone: number }) {
  const id = useId()
  const { headline, needed } = protectionMessage(uv, now, timezone)
  const peak = uv.today?.peak ?? uv.todayPeak
  const band = uvBand(peak?.uvi ?? uv.now)

  return (
    <section className="sun" data-needed={needed || undefined} aria-labelledby={`${id}-title`}>
      <div className="sun-head">
        <span className="uv-swatch" data-level={band.level} aria-hidden="true" />
        <h3 id={`${id}-title`} className="sun-title">
          Sun protection
        </h3>
        {peak ? (
          <span className="sun-peak">
            Peak UV {roundUv(peak.uvi)} <span className="sun-peak-band">({band.label})</span> at {formatTime(peak.dt, timezone)}
          </span>
        ) : null}
      </div>
      <p className="sun-headline">{headline}</p>
      {needed || (uv.today && roundUv(uv.today.peak.uvi) >= 3) ? (
        <details className="sun-tips">
          <summary>
            <Icon name="sun" size={16} /> How to protect yourself
          </summary>
          <p className="sun-advice">{band.advice}</p>
          <ul className="five-s" aria-label="The five SunSmart steps">
            {FIVE_S.map((s) => (
              <li key={s.verb}>
                <b>{s.verb}</b> {s.what}
              </li>
            ))}
          </ul>
          <p className="sun-source">
            Guidance follows{' '}
            <a href="https://www.sunsmart.com.au/uv-sun-protection/uv/uv-index" target="_blank" rel="noreferrer">
              SunSmart<span className="sr-only"> (opens in a new tab)</span>
            </a>{' '}
            (Cancer Council). Forecasts aren’t medical advice; check local warnings.
          </p>
        </details>
      ) : null}
    </section>
  )
}
