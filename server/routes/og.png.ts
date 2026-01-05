export default defineEventHandler(async (event) => {
  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#09090b"/>
          <stop offset="100%" style="stop-color:#18181b"/>
        </linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#facc15"/>
          <stop offset="100%" style="stop-color:#a16207"/>
        </linearGradient>
      </defs>

      <rect width="1200" height="630" fill="url(#bg)"/>

      <!-- Noise texture simulation -->
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="1200" height="630" filter="url(#noise)" opacity="0.03"/>

      <!-- Podium bars -->
      <rect x="350" y="380" width="120" height="180" fill="#52525b" rx="4"/>
      <rect x="540" y="280" width="120" height="280" fill="url(#gold)" rx="4"/>
      <rect x="730" y="430" width="120" height="130" fill="#78716c" rx="4"/>

      <!-- Rank numbers -->
      <text x="410" y="350" font-family="system-ui, sans-serif" font-size="48" font-weight="700" fill="#a1a1aa" text-anchor="middle">2</text>
      <text x="600" y="250" font-family="system-ui, sans-serif" font-size="48" font-weight="700" fill="#facc15" text-anchor="middle">1</text>
      <text x="790" y="400" font-family="system-ui, sans-serif" font-size="48" font-weight="700" fill="#d97706" text-anchor="middle">3</text>

      <!-- Star/crown on #1 -->
      <text x="600" y="195" font-family="system-ui, sans-serif" font-size="40" fill="#facc15" text-anchor="middle">&#9733;</text>

      <!-- Title -->
      <text x="600" y="100" font-family="system-ui, sans-serif" font-size="64" font-weight="700" fill="#fafafa" text-anchor="middle">VIBE CHAMPION</text>
      <text x="600" y="145" font-family="system-ui, sans-serif" font-size="24" fill="#71717a" text-anchor="middle">Claude Code Usage Leaderboard</text>

      <!-- Footer -->
      <text x="600" y="600" font-family="system-ui, sans-serif" font-size="20" fill="#52525b" text-anchor="middle">vibechampion.vercel.app</text>
    </svg>
  `

  setHeader(event, 'Content-Type', 'image/svg+xml')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')

  return svg
})
