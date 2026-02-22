# Multi-stage build para otimizar tamanho da imagem
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar todas as dependências (production + development)
RUN npm ci

# Copiar código fonte
COPY . .

# Build do frontend (Vite)
RUN npm run build

# Stage de produção
FROM node:22-alpine

WORKDIR /app

# Instalar apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production

# Copiar código refatorado
COPY . .

# Copiar build do frontend do stage anterior
COPY --from=builder /app/dist ./dist

# Expor portas
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    PORT=3000 \
    DISABLE_HMR=true

# Comando de inicialização (usando tsx para suportar TypeScript)
CMD ["npx", "tsx", "server.ts"]
