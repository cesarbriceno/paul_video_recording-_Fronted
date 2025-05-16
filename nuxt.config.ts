// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/icon'],
  devServer: {
    port: 4000, // Puerto fijado
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL || 'https://shiny-space-garbanzo-ggwvj99pr49fwvqp-3000.app.github.dev', // URL del backend
    },
  },
});