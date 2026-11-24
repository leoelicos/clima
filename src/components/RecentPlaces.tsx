import { placeLabel, samePlace } from '../lib/storage'
import type { Place } from '../lib/types'
import { Icon } from './Icon'
import './RecentPlaces.css'

interface Props {
  history: Place[]
  current: Place | null
  onSelect: (place: Place) => void
  onRemove: (place: Place) => void
  onClear: () => void
}

export function RecentPlaces({ history, current, onSelect, onRemove, onClear }: Props) {
  if (history.length === 0) return null
  return (
    <nav className="recent" aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="recent-heading">
        <Icon name="history" size={16} />
        Recent
      </h2>
      <ul className="recent-list">
        {history.map((place) => {
          const isCurrent = current ? samePlace(place, current) : false
          return (
            <li key={`${place.lat},${place.lon}`} className="recent-item" data-current={isCurrent || undefined}>
              <button
                type="button"
                className="recent-place"
                aria-current={isCurrent ? 'true' : undefined}
                onClick={() => onSelect(place)}
                title={placeLabel(place)}
              >
                {place.name}
                {place.country ? <span className="recent-country">{place.country}</span> : null}
              </button>
              <button
                type="button"
                className="recent-remove"
                aria-label={`Remove ${placeLabel(place)} from recent places`}
                onClick={() => onRemove(place)}
              >
                <Icon name="x" size={14} />
              </button>
            </li>
          )
        })}
      </ul>
      {history.length > 1 ? (
        <button type="button" className="recent-clear" onClick={onClear}>
          Clear all
        </button>
      ) : null}
    </nav>
  )
}
