# syntax=docker/dockerfile:1.6

ARG BASE_IMAGE
FROM ${BASE_IMAGE}

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

ENTRYPOINT ["sh", "/app/docker/ops/entrypoint.sh"]
