FROM node:24-alpine AS build
WORKDIR /app
COPY src/frontend/package*.json src/frontend/.npmrc ./
RUN npm ci
COPY src/frontend/ .
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine-slim@sha256:3a4485bf084957d56674ee22db07d77d5a281418815c5852827419d6d629d440 AS final
USER root
RUN apk upgrade --no-cache
USER nginx
COPY --from=build /app/dist /usr/share/nginx/html
COPY infrastructure/docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
