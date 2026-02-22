#!/bin/bash

# Script para limpar containers, imagens e volumes

echo "🧹 Limpeza de containers Docker..."
echo ""

read -p "Deseja remover containers parados? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker container prune -f
    echo "✅ Containers parados removidos"
fi

echo ""
read -p "Deseja remover imagens órfãs? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker image prune -f
    echo "✅ Imagens órfãs removidas"
fi

echo ""
read -p "Deseja remover volumes não utilizados? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker volume prune -f
    echo "✅ Volumes não utilizados removidos"
fi

echo ""
read -p "⚠️  Deseja remover TUDO (containers, imagens e volumes)? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Removendo tudo..."
    docker-compose down -v
    docker image rm promocode:latest 2>/dev/null || true
    echo "✅ Limpeza completa realizada!"
    echo ""
    echo "Para reconstruir tudo, execute:"
    echo "  bash docker-scripts/build.sh"
    echo "  bash docker-scripts/start.sh"
fi

echo ""
echo "✅ Limpeza finalizada!"
