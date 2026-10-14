# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS run
RUN apk add --no-cache su-exec
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/data

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/seed ./seed

COPY docker-entrypoint.sh /usr/local/bin/

# 콘텐츠(설정·페이지·에피소드·미디어)는 볼륨에 저장된다. 비어 있으면 seed로 채운다.
VOLUME /data
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
