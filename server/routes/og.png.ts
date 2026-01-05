export default defineEventHandler(async (event) => {
  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0c0c0c"/>
          <stop offset="100%" style="stop-color:#141414"/>
        </linearGradient>
      </defs>

      <rect width="1200" height="630" fill="url(#bg)"/>

      <!-- Big crown -->
      <text x="600" y="250" font-family="system-ui, sans-serif" font-size="150" fill="#4ade80" text-anchor="middle" opacity="0.9">👑</text>

      <!-- Title -->
      <text x="600" y="380" font-family="system-ui, sans-serif" font-size="72" font-weight="700" fill="#e0e0e0" text-anchor="middle">VIBE</text>
      <text x="600" y="460" font-family="system-ui, sans-serif" font-size="72" font-weight="700" fill="#4ade80" text-anchor="middle">CHAMPION</text>

      <!-- Subtitle -->
      <text x="600" y="520" font-family="system-ui, sans-serif" font-size="28" fill="#666" text-anchor="middle">who's burning the most tokens?</text>

      <!-- Handwritten roast -->
      <text x="850" y="200" font-family="Georgia, serif" font-size="24" fill="#4ade80" opacity="0.7" transform="rotate(-8, 850, 200)">← claude's landlord</text>

      <!-- Footer -->
      <text x="600" y="590" font-family="system-ui, sans-serif" font-size="18" fill="#444" text-anchor="middle">vibechampion.vercel.app</text>
    </svg>
  `

  setHeader(event, 'Content-Type', 'image/svg+xml')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')

  return svg
})
