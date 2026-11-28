FROM node:24-alpine AS build
WORKDIR /app
COPY src/frontend/package*.json src/frontend/.npmrc ./
RUN npm ci
COPY src/frontend/ .
# The same CI-validated build argument also provides the public release label.
ARG IMAGE_VERSION=dev
RUN VITE_APP_VERSION="$IMAGE_VERSION" npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine-slim@sha256:5d8bb9437d74a600ec5dbf90c035451c724dc33eac8d3a71078f6f8612c345f6 AS final
# Local builds are explicitly unidentified; CI supplies validated application metadata.
ARG IMAGE_VERSION=dev
ARG IMAGE_REVISION=unknown
LABEL org.opencontainers.image.version="${IMAGE_VERSION}" \
      org.opencontainers.image.revision="${IMAGE_REVISION}" \
      org.opencontainers.image.source="https://github.com/ifpebj-ti/controle-acesso-veiculos"
USER root
RUN apk upgrade --no-cache
USER nginx
COPY --from=build /app/dist /usr/share/nginx/html
COPY infrastructure/docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
