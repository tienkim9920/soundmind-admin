# Sử dụng Node.js v24.12.0 trên nền Alpine Linux để tối ưu dung lượng image
FROM node:24.12.0-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json (nếu có)
COPY package*.json ./

# Cài đặt các phụ thuộc (production dependencies)
RUN npm ci --only=production

# Sao chép toàn bộ mã nguồn ứng dụng (bao gồm các thư mục views chứa tệp .ejs)
COPY . .

# Thiết lập biến môi trường production và chuyển cổng thành 4000
ENV NODE_ENV=production
ENV PORT=4000

# Mở cổng 4000
EXPOSE 4000

# Lệnh khởi chạy ứng dụng ExpressJS
CMD ["node", "index.js"]
