FROM node:20-alpine
RUN apk add --no-cache docker-cli
WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN npm run deploy
CMD [ "node", "index.js" ]

