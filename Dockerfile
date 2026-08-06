# Sử dụng Node.js v24.12.0 trên nền Alpine Linux
FROM node:24.12.0-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép các file quản lý package
COPY package*.json ./

# Cài đặt chỉ các dependencies cho production (dùng --omit=dev thay cho --only=production)
RUN npm ci --omit=dev

# Sao chép toàn bộ mã nguồn ứng dụng (bao gồm thư mục views, public,...)
COPY . .

# Mở cổng 4000
EXPOSE 4000

# Khởi chạy ứng dụng ExpressJS
CMD ["node", "index.js"]
