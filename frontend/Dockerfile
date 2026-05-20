# ÉTAPE 1 : Build Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build --configuration=production

# ÉTAPE 2 : Servir avec Nginx
FROM nginx:alpine
COPY --from=build /app/dist/mon-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80