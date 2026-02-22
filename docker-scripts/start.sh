#!/bin/bash

# Script para iniciar os containers

set -e

echo "🐳 Iniciando containers..."

# Verificar se .env.docker existe
if [ ! -f .env.docker ]; then
    echo "❌ Erro: arquivo .env.docker não encontrado!"
    echo "Crie a partir de .env.docker.example:"
    echo "  cp .env.docker.example .env.docker"
    exit 1
fi

# Iniciar serviços
docker-compose up -d

echo ""
echo "✅ Containers iniciados com sucesso!"
echo ""
echo "Serviços rodando:"
echo "  - App:   http://localhost:3000"
echo "  - Redis: localhost:6379"
echo ""
echo "Próximas etapas:"
echo "  1. Verificar logs: bash docker-scripts/logs.sh"
echo "  2. Acessar aplicação: http://localhost:3000"
echo "  3. Dashboard admin: http://localhost:3000 (clique no ícone de admin)"
echo ""
echo "Comandos úteis:"
echo "  docker-compose ps              # Ver status dos containers"
echo "  docker-compose logs -f app     # Logs em tempo real"
echo "  docker-compose down            # Parar os containers"
echo "  docker-compose down -v         # Parar e remover volumes"
