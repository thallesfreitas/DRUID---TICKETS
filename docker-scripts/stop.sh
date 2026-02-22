#!/bin/bash

# Script para parar os containers

echo "⏹️  Parando containers..."

docker-compose down

echo "✅ Containers parados com sucesso!"
echo ""
echo "Próximos passos:"
echo "  - Iniciar novamente: bash docker-scripts/start.sh"
echo "  - Remover volumes: docker-compose down -v"
