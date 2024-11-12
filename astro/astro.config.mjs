import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import compressor from 'astro-compressor';
import node from '@astrojs/node';
import path from 'path';
import { fileURLToPath } from 'url';
import react from '@astrojs/react';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper function to ensure proper URL format
const getSiteURL = (val) => {
  const isProduction = import.meta.env.PROD === true;
  if (isProduction) {
    if (val && val !== '/') {
      return val.startsWith('http') ? val : `https://${val}`;
    }
  }
  return 'http://localhost:8080';
};

export default defineConfig({
  site: getSiteURL(process.env.BASE_URL),
  output: 'server',
  base: '/',
  server: {
    port: parseInt(process.env.PORT, 10),
    host: true
  },
  adapter: node({
    mode: 'standalone',
  }),
  image: { domains: ['images.unsplash.com'] },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  integrations: [
    react(),
    tailwind(),
    sitemap(),
    compressor({ gzip: true, brotli: true }),
  ],
  vite: {
    build: {
      cssMinify: true,
      minify: true,
    },
    
    envDir: path.resolve(__dirname, '..'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@content': path.resolve(__dirname, './src/content'),
        '@data': path.resolve(__dirname, './src/data_files'),
        '@images': path.resolve(__dirname, './src/images'),
        '@scripts': path.resolve(__dirname, './src/assets/scripts'),
        '@styles': path.resolve(__dirname, './src/assets/styles'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@layouts': path.resolve(__dirname, './src/layouts'),
        '@root': path.resolve(__dirname, '..'),
      },
    },
  },
});
