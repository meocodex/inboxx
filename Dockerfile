# =============================================================================
# Stage 1: Frontend Build
# =============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY web/package*.json ./

RUN npm ci

COPY web/ .

RUN npm run build

# =============================================================================
# Stage 2: Backend Build
# =============================================================================
FROM node:20-alpine AS api-builder

WORKDIR /app

COPY api/package*.json ./

RUN npm ci

COPY api/ .

RUN npm run build

# =============================================================================
# Stage 3: Production
# =============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# Criar usuario nao-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Backend
COPY --from=api-builder /app/package*.json ./
COPY --from=api-builder /app/dist ./dist
COPY --from=api-builder /app/node_modules ./node_modules

# Frontend build -> servido pelo Fastify como static files
COPY --from=frontend-builder /app/dist ./public

# Diretorio de uploads
RUN mkdir -p uploads && chown nodejs:nodejs uploads

USER nodejs

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/saude/vivo || exit 1

CMD ["node", "dist/index.js"]
