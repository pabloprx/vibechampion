export default defineNuxtConfig({
  devtools: { enabled: false },

  app: {
    head: {
      title: 'VibeBattle - Claude Code Usage Leaderboard',
      meta: [
        { name: 'description', content: 'Track and compare Claude Code usage with your team. Monthly leaderboard for token battles.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://vibechampion.vercel.app' },
        { property: 'og:title', content: 'VibeBattle - Claude Code Usage Leaderboard' },
        { property: 'og:description', content: 'Track and compare Claude Code usage with your team. Who burns the most tokens?' },
        { property: 'og:image', content: 'https://vibechampion.vercel.app/og.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'VibeBattle - Claude Code Usage Leaderboard' },
        { name: 'twitter:description', content: 'Track and compare Claude Code usage with your team.' },
        { name: 'twitter:image', content: 'https://vibechampion.vercel.app/og.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  // Server-only mode - no client
  ssr: true,

  nitro: {
    // Store SQLite in .data folder
    storage: {
      db: {
        driver: 'fs',
        base: './.data'
      }
    }
  },

  compatibilityDate: '2025-01-01'
})
