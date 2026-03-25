FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# รับ VITE env vars ตอน build (สำหรับ multi-platform / production)
ARG VITE_API_BASE
ARG VITE_ENV=production
ARG VITE_APP_TITLE="SENA Agent System"
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_ENV=${VITE_ENV}
ENV VITE_APP_TITLE=${VITE_APP_TITLE}
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY --from=build /app ./
EXPOSE 4173
CMD ["npm","run","preview","--","--host","0.0.0.0","--port","4173"]
