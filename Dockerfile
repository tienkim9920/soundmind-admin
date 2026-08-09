# Stage 1: Build & Install dependencies
FROM node:24.12.0-alpine AS builder

WORKDIR /app

# Sao chép file package
COPY package*.json ./

# Sử dụng cache của BuildKit để tránh tải lại npm packages mỗi lần build
RUN npm ci --omit=dev

# Stage 2: Production image cực nhẹ
FROM node:24.12.0-alpine AS runner

WORKDIR /app

# Khai báo môi trường Production để Node.js tối ưu hiệu năng
ENV NODE_ENV=production

# Copy node_modules đã cài đặt từ Stage 1
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy mã nguồn ứng dụng
COPY . .

# Sử dụng non-root user của Alpine để tăng bảo mật
USER node

EXPOSE 4000

CMD ["node", "index.js"]
