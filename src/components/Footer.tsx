import { useOnline } from '../lib/hooks'
import { Icon } from './Icon'
import './Footer.css'

export function Footer({ onResetKey }: { onResetKey?: (() => void) | undefined }) {
  const online = useOnline()
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <p>
          Weather data ©{' '}
          <a href="https://openweathermap.org/" target="_blank" rel="noreferrer">
            OpenWeather<span className="sr-only"> (opens in a new tab)</span>
          </a>
          . Times shown in each place’s local time.
        </p>
        <p className="footer-meta">
          {!online ? (
            <span className="offline-pill" role="status">
              <Icon name="wifiOff" size={14} /> Offline
            </span>
          ) : null}
          {onResetKey ? (
            <button type="button" className="link-btn" onClick={onResetKey}>
              Change API key
            </button>
          ) : null}
          <a href="https://github.com/leoelicos/clima" target="_blank" rel="noreferrer" className="footer-gh">
            <Icon name="github" size={16} /> Source<span className="sr-only"> on GitHub (opens in a new tab)</span>
          </a>
          <span>© Leo Wong · MIT</span>
        </p>
      </div>
    </footer>
  )
}
