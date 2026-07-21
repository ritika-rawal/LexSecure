FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json

RUN npm ci --omit=dev --workspace=@lexsecure/backend \
  && npm cache clean --force

COPY --chown=node:node server server

RUN mkdir -p /app/server/storage/documents \
  && chown -R node:node /app/server/storage/documents

USER node
WORKDIR /app/server

EXPOSE 5000
CMD ["node", "scripts/docker-start.js"]
