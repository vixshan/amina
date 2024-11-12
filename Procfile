worker: npm i pm2@latest && pm2 start src/index.js --name "amina" --no-daemon
web: cd astro && npm i && npm run build && cd .. && pm2 start astro/dist/server/entry.mjs --name "mina-web" --no-daemon