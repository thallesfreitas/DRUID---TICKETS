# Desenvolvimento com Vite HMR + Express Server
FROM node:22-alpine

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código + .env
COPY . .
COPY .env* ./

# Expor porta
EXPOSE 3000

# Variáveis de desenvolvimento
ENV NODE_ENV=development \
  PORT=3000 \
  CHOKIDAR_USEPOLLING=true

# Comando: servidor Express com Vite middleware (hot-reload)
CMD ["npm", "run", "dev"]
