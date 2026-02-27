#!/bin/bash
# ============================================
# ATUALIZAR SECRETS - Projeto Clash BK
# ============================================
# Uso: ./update-secrets.sh <nome-do-secret> <novo-valor>
# Exemplo: ./update-secrets.sh jwt-secret "minha-nova-chave-super-secreta"
#
# Para ver todos os secrets: ./update-secrets.sh list
# Para ver o valor de um secret: ./update-secrets.sh get <nome-do-secret>

set -e

PROJECT_ID="projeto-clash-bk"

# Lista de secrets do projeto
SECRETS=(
  "db-host"
  "db-password"
  "db-name"
  "db-user"
  "resend-api-key"
  "resend-from"
  "jwt-secret"
  "turnstile-site-key"
  "turnstile-secret-key"
)

case "$1" in
  list)
    echo "📋 Secrets do projeto ${PROJECT_ID}:"
    echo ""
    gcloud secrets list --project=${PROJECT_ID}
    ;;
  get)
    if [ -z "$2" ]; then
      echo "❌ Uso: ./update-secrets.sh get <nome-do-secret>"
      exit 1
    fi
    echo "🔑 Valor do secret '$2':"
    gcloud secrets versions access latest --secret="$2" --project=${PROJECT_ID}
    echo ""
    ;;
  get-all)
    echo "🔑 Todos os secrets do projeto ${PROJECT_ID}:"
    echo ""
    for secret in "${SECRETS[@]}"; do
      value=$(gcloud secrets versions access latest --secret="${secret}" --project=${PROJECT_ID} 2>/dev/null || echo "ERRO")
      echo "  ${secret} = ${value}"
    done
    ;;
  update)
    if [ -z "$2" ] || [ -z "$3" ]; then
      echo "❌ Uso: ./update-secrets.sh update <nome-do-secret> <novo-valor>"
      exit 1
    fi
    echo "🔄 Atualizando secret '$2'..."
    echo -n "$3" | gcloud secrets versions add "$2" --data-file=- --project=${PROJECT_ID}
    echo "✅ Secret '$2' atualizado!"
    echo ""
    echo "⚠️  Lembre-se: rode ./deploy.sh para aplicar as mudanças no Cloud Run."
    ;;
  create)
    if [ -z "$2" ] || [ -z "$3" ]; then
      echo "❌ Uso: ./update-secrets.sh create <nome-do-secret> <valor>"
      exit 1
    fi
    echo "➕ Criando secret '$2'..."
    echo -n "$3" | gcloud secrets create "$2" --data-file=- --project=${PROJECT_ID}
    echo "✅ Secret '$2' criado!"
    ;;
  *)
    echo "============================================"
    echo "  Gerenciador de Secrets - Projeto Clash BK"
    echo "============================================"
    echo ""
    echo "Comandos disponíveis:"
    echo "  ./update-secrets.sh list                          - Listar todos os secrets"
    echo "  ./update-secrets.sh get <nome>                    - Ver valor de um secret"
    echo "  ./update-secrets.sh get-all                       - Ver todos os valores"
    echo "  ./update-secrets.sh update <nome> <novo-valor>    - Atualizar um secret"
    echo "  ./update-secrets.sh create <nome> <valor>         - Criar novo secret"
    echo ""
    echo "Secrets disponíveis:"
    for secret in "${SECRETS[@]}"; do
      echo "  - ${secret}"
    done
    ;;
esac
