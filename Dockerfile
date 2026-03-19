FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# เปิดพอร์ต API (ปรับถ้า server.js ใช้พอร์ตอื่น)
EXPOSE 4000
CMD ["npm","run","start"]
