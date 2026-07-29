# syntax=docker/dockerfile:1.6

# --- Stage 1: Build ---
ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --strict-peer-deps=false

COPY . .
RUN npm run build

# --- Stage 2: Runtime ---
FROM ${BASE_IMAGE} AS runner

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --strict-peer-deps=false

COPY --from=builder /app/dist ./dist

EXPOSE 5001
CMD ["node", "dist/src/main.js"]
