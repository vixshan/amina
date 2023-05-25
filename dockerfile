FROM node:20.0-bullseye-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 8080-8089 449

CMD [ "node", "bot.js" ]
