export function Logo() {
  return (
    <svg className="logo" viewBox="0 0 40 40" width="36" height="36" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--warm)" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="9" fill="url(#logo-g)" />
      <path d="M12 32h18a7 7 0 0 0 0-14 9 9 0 0 0-17 1.5A6.3 6.3 0 0 0 12 32Z" className="logo-cloud" />
    </svg>
  )
}
