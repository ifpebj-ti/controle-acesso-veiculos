FROM node:24-alpine AS build
WORKDIR /app
COPY src/frontend/package*.json src/frontend/.npmrc ./
RUN npm ci
COPY src/frontend/ .
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine-slim@sha256:7bbe8940bc478e5618e6d4cfbeda406e5b4217cacc06faacd665aca5e468595e AS final
USER root
RUN apk upgrade --no-cache
USER nginx
COPY --from=build /app/dist /usr/share/nginx/html
COPY infrastructure/docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
