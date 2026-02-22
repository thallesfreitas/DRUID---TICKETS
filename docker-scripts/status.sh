#!/bin/bash

# Script para verificar status dos containers

echo "📊 Status dos containers:"
echo ""

docker-compose ps

echo ""
echo "📊 Health check dos serviços:"
echo ""

# App
if docker-compose exec app curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ App: Saudável"
else
    echo "❌ App: Não respondendo"
fi

# Redis
if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: Saudável"
else
    echo "❌ Redis: Não respondendo"
fi

echo ""
echo "🔗 URLs e Portas:"
echo "  - App:   http://localhost:3000"
echo "  - Redis: localhost:6379"
echo ""
echo "📊 Informações do Redis:"
echo ""
docker-compose exec redis redis-cli -a redis123 info stats 2>/dev/null | grep -E "connected_clients|total_commands_processed" || echo "Redis não acessível"
