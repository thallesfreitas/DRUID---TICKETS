#!/bin/bash

# Script para ver logs dos containers

if [ $# -eq 0 ]; then
    echo "📋 Mostrando logs em tempo real de todos os serviços (Ctrl+C para sair)..."
    echo ""
    docker-compose logs -f
else
    case $1 in
        app)
            echo "📋 Logs da aplicação:"
            docker-compose logs -f app
            ;;
        redis)
            echo "📋 Logs do Redis:"
            docker-compose logs -f redis
            ;;
        postgres)
            echo "📋 Logs do Postgres:"
            docker-compose logs -f postgres
            ;;
        *)
            echo "Uso: bash docker-scripts/logs.sh [app|redis|postgres]"
            echo ""
            echo "Exemplos:"
            echo "  bash docker-scripts/logs.sh app      # Logs da aplicação"
            echo "  bash docker-scripts/logs.sh redis    # Logs do Redis"
            echo "  bash docker-scripts/logs.sh          # Todos os logs"
            exit 1
            ;;
    esac
fi
