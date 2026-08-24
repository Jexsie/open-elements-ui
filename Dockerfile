# syntax=docker/dockerfile:1

# The component showcase: a static Storybook build served by nginx.
#
# A Dockerfile rather than Coolify's static build pack, so the build command and
# the publish directory stay in version control and the whole thing is
# reproducible locally with `docker build . && docker run -p 8080:80 <image>`.

# --- build ---------------------------------------------------------------------
FROM node:24-alpine AS build

WORKDIR /app

# Node 24 to match .nvmrc; pnpm comes from the packageManager field.
RUN corepack enable

ENV CI=true
ENV STORYBOOK_DISABLE_TELEMETRY=1
# Corepack fetches the pinned pnpm on first use; never wait for a prompt.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# Manifests first, so editing a story does not reinstall the toolchain.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build-storybook

# --- serve ---------------------------------------------------------------------
FROM nginx:stable-alpine AS serve

COPY .docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/storybook-static /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://localhost/healthz || exit 1
