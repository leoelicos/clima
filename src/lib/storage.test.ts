import { addToHistory, defaultUnits, HISTORY_LIMIT, loadHistory, loadTheme, loadUnits, saveHistory, saveUnits } from './storage'
import type { Place } from './types'

const place = (name: string, lat: number): Place => ({ name, lat, lon: 0, country: 'XX' })

describe('storage', () => {
  it('keeps most-recent-first, de-duplicated, capped history', () => {
    let h: Place[] = []
    for (let i = 0; i < HISTORY_LIMIT + 3; i++) h = addToHistory(h, place(`P${i}`, i))
    expect(h).toHaveLength(HISTORY_LIMIT)
    expect(h[0]!.name).toBe(`P${HISTORY_LIMIT + 2}`)
    h = addToHistory(h, place('again', HISTORY_LIMIT))
    expect(h[0]!.name).toBe('again')
    expect(h.filter((p) => p.lat === HISTORY_LIMIT)).toHaveLength(1)
  })

  it('round-trips and survives corrupt data', () => {
    saveHistory([place('A', 1)])
    expect(loadHistory()).toEqual([place('A', 1)])
    localStorage.setItem('clima:history', '{not json')
    expect(loadHistory()).toEqual([])
    localStorage.setItem('clima:history', JSON.stringify([{ nope: true }]))
    expect(loadHistory()).toEqual([])
  })

  it('remembers units and theme with sensible defaults', () => {
    expect(defaultUnits('en-US')).toBe('imperial')
    expect(defaultUnits('en-AU')).toBe('metric')
    saveUnits('imperial')
    expect(loadUnits()).toBe('imperial')
    expect(loadTheme()).toBe('system')
  })
})
