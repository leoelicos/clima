import { moodFor, type Mood } from '../lib/conditions'
import './WeatherIcon.css'

interface Props {
  /** OpenWeather condition id */
  id: number
  isDay?: boolean
  size?: number
  /** If provided the icon is exposed to assistive tech, otherwise it's decorative. */
  label?: string
  animated?: boolean
  className?: string
}

const Sun = ({ small = false }: { small?: boolean }) => (
  <g className="wi-sun" transform={small ? 'translate(-2 -2) scale(.72)' : undefined}>
    <circle cx="32" cy="32" r="11" className="wi-sun-core" />
    <g className="wi-rays">
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1="32" y1="12" x2="32" y2="6" transform={`rotate(${i * 45} 32 32)`} />
      ))}
    </g>
  </g>
)

const Moon = ({ small = false }: { small?: boolean }) => (
  <g className="wi-moon" transform={small ? 'translate(-2 -4) scale(.72)' : undefined}>
    <path d="M40 18a16 16 0 1 0 8 26A13 13 0 0 1 40 18Z" />
    <circle className="wi-star" cx="16" cy="16" r="1.4" />
    <circle className="wi-star wi-star-2" cx="50" cy="12" r="1.1" />
  </g>
)

const Cloud = ({ dark = false, offset = 0 }: { dark?: boolean; offset?: number }) => (
  <path
    className={`wi-cloud${dark ? ' wi-cloud-dark' : ''}`}
    transform={`translate(${offset} 0)`}
    d="M20 46h26a10 10 0 0 0 0-20 13 13 0 0 0-25-2 9 9 0 0 0-1 22Z"
  />
)

const Drops = ({ heavy = false }: { heavy?: boolean }) => (
  <g className="wi-drops">
    {(heavy ? [22, 30, 38, 46] : [26, 36, 44]).map((x, i) => (
      <line key={x} x1={x} y1="50" x2={x - 3} y2="58" style={{ animationDelay: `${i * 0.18}s` }} />
    ))}
  </g>
)

const Flakes = () => (
  <g className="wi-flakes">
    {[24, 34, 44].map((x, i) => (
      <circle key={x} cx={x} cy="54" r="2.2" style={{ animationDelay: `${i * 0.35}s` }} />
    ))}
  </g>
)

const Bolt = () => <path className="wi-bolt" d="M34 44l-6 10h6l-3 8 10-12h-6l3-6Z" />

const Fog = () => (
  <g className="wi-fog">
    <line x1="12" y1="50" x2="52" y2="50" />
    <line x1="18" y1="56" x2="46" y2="56" />
  </g>
)

function Scene({ mood, isDay }: { mood: Mood; isDay: boolean }) {
  const Body = isDay ? Sun : Moon
  switch (mood) {
    case 'clear':
      return <Body />
    case 'partly':
      return (
        <>
          <Body small />
          <Cloud offset={2} />
        </>
      )
    case 'cloudy':
      return (
        <>
          <Cloud dark offset={-6} />
          <Cloud offset={4} />
        </>
      )
    case 'drizzle':
      return (
        <>
          <Cloud />
          <Drops />
        </>
      )
    case 'rain':
      return (
        <>
          <Cloud dark />
          <Drops heavy />
        </>
      )
    case 'storm':
      return (
        <>
          <Cloud dark />
          <Bolt />
        </>
      )
    case 'snow':
      return (
        <>
          <Cloud />
          <Flakes />
        </>
      )
    case 'fog':
      return (
        <>
          <Cloud />
          <Fog />
        </>
      )
  }
}

/** Hand-drawn, theme-aware, optionally animated weather glyphs (replaces the remote OpenWeather PNGs). */
export function WeatherIcon({ id, isDay = true, size = 48, label, animated = false, className }: Props) {
  const mood = moodFor(id)
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const }
  return (
    <svg
      className={['wi', `wi-${mood}`, animated ? 'wi-animated' : '', className ?? ''].filter(Boolean).join(' ')}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      focusable="false"
      data-mood={mood}
      {...a11y}
    >
      <Scene mood={mood} isDay={isDay} />
    </svg>
  )
}
