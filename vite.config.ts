import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set base to the repository name so the site works on GitHub Pages
const repoBase = '/traveltalk2.0/'

export default defineConfig({
  base: repoBase,
  plugins: [react()],
})
