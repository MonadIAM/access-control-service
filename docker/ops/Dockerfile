# syntax=docker/dockerfile:1.6

ARG BASE_IMAGE
FROM ${BASE_IMAGE}

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY . .

ENTRYPOINT ["sh", "/app/docker/ops/entrypoint.sh"]
