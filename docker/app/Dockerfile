# syntax=docker/dockerfile:1.6

ARG BASE_IMAGE

# ---------------------------------------------------------------------------
# Shared
# ---------------------------------------------------------------------------
FROM ${BASE_IMAGE} AS builder

WORKDIR /app
ENV COREPACK_HOME=/opt/corepack

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build



# ---------------------------------------------------------------------------
# Development
# ---------------------------------------------------------------------------
FROM builder AS development

RUN apk add --no-cache make
ENV SERVICE_EXEC_WITH_SECRETS="sh /usr/local/bin/with-vault-secrets.sh"

EXPOSE 4001
CMD ["node", "dist/src/main.js"]



# ---------------------------------------------------------------------------
# Production
# ---------------------------------------------------------------------------
FROM builder AS production-dependencies
RUN pnpm prune --prod

FROM ${BASE_IMAGE} AS runner

ARG VCS_REF
RUN : "${VCS_REF:?VCS_REF build argument is required}"

LABEL org.opencontainers.image.source="https://github.com/MonadIAM/access-control-service" \
    org.opencontainers.image.revision="${VCS_REF}" \
    org.opencontainers.image.description="MonadIAM Access Control service"

WORKDIR /app
ENV NODE_ENV=production \
    COREPACK_HOME=/opt/corepack \
    COREPACK_ENABLE_NETWORK=0 \
    SERVICE_EXEC_WITH_SECRETS=""

RUN apk add --no-cache make && corepack enable

COPY --from=builder /opt/corepack /opt/corepack
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder --chown=node:node /app/src ./src
COPY --chown=node:node configs/tsconfig.base.json ./configs/tsconfig.base.json
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml Makefile mikro-orm.config.ts tsconfig.json env.d.ts ./

RUN mkdir uploads && chown node:node uploads
USER node

EXPOSE 4001 50051
CMD ["node", "--require", "./dist/src/observability/tracing/script.js", "dist/src/main.js"]
