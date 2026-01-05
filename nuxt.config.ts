export default defineNuxtConfig({
  devtools: { enabled: false },

  // Server-only mode - no client
  ssr: false,

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
