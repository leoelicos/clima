const STORAGE_KEY = 'clima:api-key'

/**
 * Resolves the OpenWeather API key.
 *
 * 1. `VITE_OPENWEATHER_API_KEY` baked in at build time (GitHub Actions secret / Vercel env var), or
 * 2. a key the visitor pasted into the in-app setup panel, stored only in their browser.
 *
 * Client-side keys are always visible to visitors, so restrict the key in your
 * OpenWeather account. For a fully private key, proxy requests through a
 * serverless function instead (see README).
 */
export function getApiKey(): string | null {
  const built = import.meta.env.VITE_OPENWEATHER_API_KEY?.trim()
  if (built) return built
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() || null
  } catch {
    return null
  }
}

export function hasBuiltInKey(): boolean {
  return Boolean(import.meta.env.VITE_OPENWEATHER_API_KEY?.trim())
}

export function saveApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key.trim())
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/** OpenWeather keys are 32 hex characters. */
export function looksLikeApiKey(key: string): boolean {
  return /^[a-f0-9]{32}$/i.test(key.trim())
}
