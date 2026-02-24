#!/bin/bash

# Script para reconstruir tudo do zero

set -e

echo "🔄 Reconstruindo Docker setup..."
echo ""

# Parar containers
echo "⏹️  Parando containers..."
docker-compose down 2>/dev/null || true

echo ""
echo "🧹 Limpando volumes..."
docker-compose down -v 2>/dev/null || true

echo ""
echo "🐳 Buildando imagem..."
docker build -t promocode:latest .

echo ""
echo "▶️  Iniciando containers..."
docker-compose up -d

echo ""
echo "⏳ Aguardando serviços ficarem saudáveis..."
sleep 10

echo ""
echo "📊 Verificando status..."
bash docker-scripts/status.sh

echo ""
echo "✅ Reconstrução concluída com sucesso!"
echo ""
echo "Próximos passos:"
echo "  1. Verificar logs: bash docker-scripts/logs.sh"
echo "  2. Acessar aplicação: http://localhost:3000"
