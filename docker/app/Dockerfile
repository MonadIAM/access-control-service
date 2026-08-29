# syntax=docker/dockerfile:1.6

# --- Stage 1: Build ---
ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# --- Stage 2: Runtime ---
FROM builder AS runner

EXPOSE 4001
CMD ["node", "dist/src/main.js"]
