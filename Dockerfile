# Desenvolvimento com Vite HMR + Express Server
# Estágio builder: deps + código (script import-csv disponível aqui e no app)
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
COPY .env* ./

# Estágio final: mesma imagem para dev e para rodar import-csv
FROM builder

EXPOSE 3000

ENV NODE_ENV=development \
  PORT=3000 \
  CHOKIDAR_USEPOLLING=true

CMD ["npm", "run", "dev"]
