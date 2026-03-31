# Next.js CSR WebView Template - Production Dockerfile
# Static export with Nginx (includes API proxy + Action Log proxy)

# ============================================
# Stage 1: Builder
# ============================================
FROM node:22-alpine AS builder
WORKDIR /app

# Build-time 환경변수 (NEXT_PUBLIC_* 는 빌드 시점에 치환됨)
ARG NEXT_PUBLIC_FLO_ENV
ARG NEXT_PUBLIC_CRYPTO_SECRET_KEY
ARG NEXT_PUBLIC_MIXPANEL_TOKEN

ENV NEXT_PUBLIC_FLO_ENV=$NEXT_PUBLIC_FLO_ENV
ENV NEXT_PUBLIC_CRYPTO_SECRET_KEY=$NEXT_PUBLIC_CRYPTO_SECRET_KEY
ENV NEXT_PUBLIC_MIXPANEL_TOKEN=$NEXT_PUBLIC_MIXPANEL_TOKEN

# 의존성 설치
COPY package*.json ./
RUN npm ci --production=false

# 소스 복사 및 빌드
COPY . .
RUN npm run build:${NEXT_PUBLIC_FLO_ENV}

# ============================================
# Stage 2: Production (Nginx)
# ============================================
FROM nginx:alpine

# 정적 파일 복사
COPY --from=builder /app/out /usr/share/nginx/html

# Nginx 설정 복사 (API + Action Log 프록시 포함)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# 포트 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
