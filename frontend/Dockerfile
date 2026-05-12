# Stage 1: Build Angular app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
# Single-quote '$BACKEND_URL' so only that variable is substituted — nginx's own $uri/$host etc. are left intact
CMD ["/bin/sh", "-c", "envsubst '$BACKEND_URL' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
