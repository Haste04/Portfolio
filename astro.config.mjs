import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { lifewoodMediaIntegration } from './scripts/lifewood-media.mjs';
import { localMediaPlugin } from './scripts/local-media-plugin.mjs';

export default defineConfig({
  output: 'static',
  integrations: [lifewoodMediaIntegration()],
  vite: { plugins: [tailwindcss(), localMediaPlugin()] },
});
