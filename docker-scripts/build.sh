#!/bin/bash

# Script para fazer build da imagem Docker

set -e

echo "🐳 Buildando imagem Docker..."

# Criar .env.docker se não existir
if [ ! -f .env.docker ]; then
    echo "⚠️  Arquivo .env.docker não encontrado!"
    echo "Criando a partir de .env.docker.example..."
    cp .env.docker.example .env.docker
    echo "✅ Arquivo .env.docker criado"
    echo "⚠️  Por favor, atualize as variáveis de ambiente em .env.docker"
fi

# Build da imagem
docker build -t promocode:latest .

echo ""
echo "✅ Build concluído com sucesso!"
echo ""
echo "Próximos passos:"
echo "  1. Editar .env.docker com suas configurações"
echo "  2. Executar: bash docker-scripts/start.sh"
