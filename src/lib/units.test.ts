import { compass, compassSpoken, distance, precip, pressure, temp, tempSpoken, wind } from './units'

describe('units', () => {
  it('converts temperatures and rounds', () => {
    expect(temp(21.6, 'metric')).toBe(22)
    expect(temp(0, 'imperial')).toBe(32)
    expect(temp(100, 'imperial')).toBe(212)
    expect(tempSpoken(-3.4, 'metric')).toBe('-3 degrees Celsius')
  })

  it('converts wind from m/s', () => {
    expect(wind(10, 'metric')).toMatchObject({ value: 36, unit: 'km/h' })
    expect(wind(10, 'imperial')).toMatchObject({ value: 22, unit: 'mph' })
  })

  it('converts distance, precipitation and pressure', () => {
    expect(distance(10000, 'metric')).toEqual({ value: 10, unit: 'km' })
    expect(distance(10000, 'imperial')).toEqual({ value: 6.2, unit: 'mi' })
    expect(precip(25.4, 'imperial')).toEqual({ value: 1, unit: 'in' })
    expect(pressure(1013.25, 'imperial').value).toBeCloseTo(29.92, 1)
  })

  it('names compass points', () => {
    expect(compass(0)).toBe('N')
    expect(compass(359)).toBe('N')
    expect(compass(225)).toBe('SW')
    expect(compass(-90)).toBe('W')
    expect(compassSpoken(22.5)).toBe('north-northeast')
  })
})
