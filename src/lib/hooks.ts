import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeMedia(query: string) {
  return (cb: () => void) => {
    const mq = window.matchMedia(query)
    mq.addEventListener('change', cb)
    return () => mq.removeEventListener('change', cb)
  }
}

/** Live media query match. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribeMedia(query),
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const useReducedMotion = (): boolean => useMediaQuery(REDUCED_QUERY)

/** Debounces a fast-changing value (search input). */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

export const useOnline = (): boolean =>
  useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)

type DocWithVT = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }

/**
 * Runs a state update inside a View Transition when supported and motion is allowed.
 * Falls back to a plain update everywhere else.
 */
export function withViewTransition(update: () => void): void {
  const doc = document as DocWithVT
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_QUERY).matches
  if (typeof doc.startViewTransition === 'function' && !reduced) {
    doc.startViewTransition(update)
  } else {
    update()
  }
}

/** Polite screen reader announcements through a single shared live region. */
export function useAnnouncer(): [string, (message: string) => void] {
  const [message, setMessage] = useState('')
  const announce = useCallback((next: string) => {
    // Clear first so repeating the same message is still announced.
    setMessage('')
    requestAnimationFrame(() => setMessage(next))
  }, [])
  return [message, announce]
}
