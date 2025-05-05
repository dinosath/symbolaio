FROM node:18-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml .

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

ENV BACKEND_URL=http://localhost:8080

COPY --from=build /app/dist /usr/share/nginx/html

COPY docker/nginx.conf.template /etc/nginx/nginx.conf.template

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

CMD ["/entrypoint.sh"]