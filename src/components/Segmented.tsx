import { useId, type ReactNode } from 'react'
import './Segmented.css'

interface Option<T extends string> {
  value: T
  label: string
  icon?: ReactNode
  /** Hide the text visually (still read by screen readers). */
  iconOnly?: boolean
}

interface Props<T extends string> {
  legend: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
}

/**
 * A segmented control built from native radio inputs inside a fieldset,
 * so arrow-key navigation and semantics come for free.
 */
export function Segmented<T extends string>({ legend, value, options, onChange }: Props<T>) {
  const name = useId()
  return (
    <fieldset className="segmented">
      <legend className="sr-only">{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className="segmented-option" title={o.iconOnly ? o.label : undefined}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          {o.icon}
          <span className={o.iconOnly ? 'sr-only' : undefined}>{o.label}</span>
        </label>
      ))}
    </fieldset>
  )
}
