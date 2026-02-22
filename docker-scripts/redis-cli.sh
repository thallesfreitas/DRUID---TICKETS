#!/bin/bash

# Script para acessar Redis CLI

echo "🔴 Conectando ao Redis..."
echo ""

docker-compose exec redis redis-cli -a redis123

echo ""
echo "Comandos úteis do Redis:"
echo "  PING                    # Verificar conexão"
echo "  INFO                    # Informações do servidor"
echo "  KEYS *                  # Listar todas as chaves"
echo "  GET <chave>             # Obter valor"
echo "  DEL <chave>             # Deletar chave"
echo "  FLUSHDB                 # Limpar banco atual"
echo "  FLUSHALL                # Limpar todos os bancos"
echo "  MONITOR                 # Monitorar comandos em tempo real"
echo "  QUIT                    # Sair do Redis CLI"
