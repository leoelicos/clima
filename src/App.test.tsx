import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { saveApiKey } from './lib/apiKey'
import { saveHistory, saveUnits } from './lib/storage'
import { clearWeatherCache } from './lib/useWeather'
import { expectNoAxeViolations } from './test/axe'
import { jsonResponse, mockOpenWeather } from './test/fixtures'

const KEY = '0123456789abcdef0123456789abcdef'
const sydney = { name: 'Sydney', state: 'New South Wales', country: 'AU', lat: -33.8698, lon: 151.2083 }

beforeEach(() => {
  clearWeatherCache()
  saveUnits('metric') // jsdom reports en-US, which would default to °F
  vi.stubGlobal('fetch', vi.fn(mockOpenWeather()))
})
afterEach(() => vi.unstubAllGlobals())

describe('App', () => {
  it('asks for an API key when none is configured, validating input', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: /connect openweather/i })).toBeInTheDocument()
    await expectNoAxeViolations()

    const input = screen.getByLabelText('API key')
    await user.type(input, 'nope')
    await user.click(screen.getByRole('button', { name: /save key/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/doesn’t look like/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    await expectNoAxeViolations()

    await user.clear(input)
    await user.type(input, KEY)
    await user.click(screen.getByRole('button', { name: /save key/i }))
    expect(await screen.findByRole('heading', { name: /where to/i })).toBeInTheDocument()
    expect(localStorage.getItem('clima:api-key')).toBe(KEY)
  })

  it('shows a welcoming empty state that is accessible', async () => {
    saveApiKey(KEY)
    render(<App />)
    expect(screen.getByRole('heading', { name: /where to/i })).toBeInTheDocument()
    expect(screen.getByRole('search', { name: /find a place/i })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main')
    await expectNoAxeViolations()
  })

  it('loads a suggested city into an accessible dashboard and remembers it', async () => {
    const user = userEvent.setup()
    saveApiKey(KEY)
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Sydney' }))

    const heading = await screen.findByRole('heading', { level: 2, name: /^Sydney/ })
    expect(heading).toBeInTheDocument()
    expect(screen.getByText('24 degrees Celsius')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /day forecast/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /next 24 hours.*over the next 24 hours/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /recent/i })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/showing weather for sydney/i)).toBeInTheDocument())
    expect(JSON.parse(localStorage.getItem('clima:history')!)[0].name).toBe('Sydney')
    await expectNoAxeViolations()
  })

  it('shows UV, sun protection guidance and the SunSmart steps', async () => {
    const user = userEvent.setup()
    saveApiKey(KEY)
    saveHistory([sydney])
    render(<App />)
    const tile = (await screen.findByRole('heading', { name: 'UV index' })).closest('li')!
    expect(within(tile).getByText(/Very high|High/)).toBeInTheDocument()
    expect(within(tile).getByText(/Today’s peak was 9 at 1:00/i)).toBeInTheDocument()

    const sun = screen.getByRole('region', { name: /sun protection/i })
    expect(within(sun).getByText(/recommended now, until 6:\d\d PM/i)).toBeInTheDocument()
    expect(within(sun).getByText(/Peak UV 9/)).toBeInTheDocument()
    await user.click(within(sun).getByText(/how to protect yourself/i))
    expect(within(sun).getByRole('list', { name: /five sunsmart steps/i })).toHaveTextContent(/Slip.*Slop.*Slap.*Seek.*Slide/)

    expect(screen.getAllByText(/UV index up to \d+, (very high|high|moderate)/i).length).toBeGreaterThanOrEqual(5)
    expect(screen.getByRole('link', { name: /open-meteo/i })).toHaveAttribute('href', 'https://open-meteo.com/')
    expect(screen.getByRole('img', { name: /uv peaks at/i })).toBeInTheDocument()
    await expectNoAxeViolations()
  })

  it('hides UV gracefully when Open-Meteo is unavailable', async () => {
    saveApiKey(KEY)
    saveHistory([sydney])
    vi.stubGlobal('fetch', vi.fn(mockOpenWeather({ uv: () => jsonResponse({}, 500) })))
    render(<App />)
    await screen.findByText('24 degrees Celsius')
    expect(screen.queryByRole('heading', { name: 'UV index' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /sun protection/i })).not.toBeInTheDocument()
  })

  it('switches units and offers the chart as a data table', async () => {
    const user = userEvent.setup()
    saveApiKey(KEY)
    saveHistory([sydney])
    render(<App />)
    await screen.findByText('24 degrees Celsius')

    await user.click(screen.getByRole('radio', { name: '°F' }))
    expect(screen.getByText('76 degrees Fahrenheit')).toBeInTheDocument()
    expect(localStorage.getItem('clima:units')).toBe('"imperial"')

    await user.click(screen.getByRole('button', { name: /show as table/i }))
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(10)
    expect(within(table).getByRole('columnheader', { name: 'Temp (°F)' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'UV index' })).toBeInTheDocument()
    await expectNoAxeViolations()
  })

  it('searches with a keyboard-operable combobox and announces results', async () => {
    const user = userEvent.setup()
    saveApiKey(KEY)
    render(<App />)
    const combo = screen.getByRole('combobox', { name: /search for a city/i })
    await user.type(combo, 'Syd')
    const listbox = await screen.findByRole('listbox')
    expect(combo).toHaveAttribute('aria-expanded', 'true')
    expect(within(listbox).getAllByRole('option')).toHaveLength(2)
    expect(screen.getByText(/2 places found/i)).toBeInTheDocument()

    await user.keyboard('{ArrowDown}{ArrowDown}')
    const options = within(listbox).getAllByRole('option')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(combo).toHaveAttribute('aria-activedescendant', options[1]!.id)
    await user.keyboard('{ArrowUp}{Enter}')

    expect(await screen.findByRole('heading', { level: 2, name: /^Sydney/ })).toHaveTextContent('New South Wales')
    expect(combo).toHaveValue('')
  })

  it('"/" focuses the search box, Escape closes suggestions', async () => {
    const user = userEvent.setup()
    saveApiKey(KEY)
    render(<App />)
    await user.keyboard('/')
    const combo = screen.getByRole('combobox')
    expect(combo).toHaveFocus()
    await user.type(combo, 'Syd')
    await screen.findByRole('listbox')
    await user.keyboard('{Escape}')
    expect(combo).toHaveAttribute('aria-expanded', 'false')
  })

  it('removes and clears recent places', async () => {
    const user = userEvent.setup()
    saveApiKey(KEY)
    saveHistory([sydney, { name: 'Tokyo', country: 'JP', lat: 35.68, lon: 139.76 }])
    render(<App />)
    await user.click(screen.getByRole('button', { name: /remove tokyo, jp from recent places/i }))
    expect(screen.queryByRole('button', { name: /^tokyo/i })).not.toBeInTheDocument()
    saveHistory([])
  })

  it('shows a recoverable error state', async () => {
    const user = userEvent.setup()
    saveApiKey(KEY)
    saveHistory([sydney])
    let fail = true
    vi.stubGlobal('fetch', vi.fn(mockOpenWeather({ weather: () => (fail ? jsonResponse({}, 503) : jsonResponse(null)) })))
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/openweather is having trouble/i)
    await expectNoAxeViolations()

    fail = false
    vi.stubGlobal('fetch', vi.fn(mockOpenWeather()))
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('24 degrees Celsius')).toBeInTheDocument()
  })

  it('returns to key setup when a saved key is rejected', async () => {
    saveApiKey(KEY)
    saveHistory([sydney])
    vi.stubGlobal('fetch', vi.fn(mockOpenWeather({ weather: () => jsonResponse({ cod: 401 }, 401) })))
    render(<App />)
    expect(await screen.findByRole('heading', { name: /that key didn’t work/i })).toBeInTheDocument()
  })

  it('applies the chosen theme to the document', async () => {
    const user = userEvent.setup()
    saveApiKey(KEY)
    render(<App />)
    await user.click(screen.getByRole('radio', { name: 'Dark theme' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    await user.click(screen.getByRole('radio', { name: 'Match system theme' }))
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})
