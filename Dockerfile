# syntax=docker/dockerfile:1.6

# --- Stage 1: Build ---
ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# --- Stage 2: Runtime ---
FROM ${BASE_IMAGE} AS runner

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist

EXPOSE 5001
CMD ["node", "dist/src/main.js"]
