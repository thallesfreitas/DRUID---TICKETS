#!/bin/bash
# ============================================
# DATABASE - Projeto Clash BK (Cloud SQL)
# ============================================
# Uso: ./database.sh <comando>

set -e

PROJECT_ID="projeto-clash-bk"
INSTANCE_NAME="projeto-clash-bk"
REGION="southamerica-east1"
DB_NAME="postgres"
DB_USER="postgres"
DB_HOST="34.151.243.152"
DB_PORT="5432"

case "$1" in
  connect)
    echo "🔗 Conectando ao Cloud SQL (vai pedir a senha)..."
    gcloud sql connect ${INSTANCE_NAME} --user=${DB_USER} --project=${PROJECT_ID}
    ;;
  run-sql)
    if [ -z "$2" ]; then
      echo "❌ Uso: ./database.sh run-sql <arquivo.sql>"
      exit 1
    fi
    echo "📄 Executando $2 no banco..."
    gcloud sql connect ${INSTANCE_NAME} --user=${DB_USER} --project=${PROJECT_ID} < "$2"
    echo "✅ SQL executado!"
    ;;
  export)
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    FILENAME="backup_${DB_NAME}_${TIMESTAMP}.sql"
    echo "📦 Exportando banco para ${FILENAME}..."
    PGPASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=${PROJECT_ID}) \
      pg_dump -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -F p -f "${FILENAME}"
    echo "✅ Backup salvo em ${FILENAME}"
    ;;
  export-data)
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    FILENAME="data_${DB_NAME}_${TIMESTAMP}.sql"
    echo "📦 Exportando apenas dados para ${FILENAME}..."
    PGPASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=${PROJECT_ID}) \
      pg_dump -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} --data-only -F p -f "${FILENAME}"
    echo "✅ Dados salvos em ${FILENAME}"
    ;;
  export-schema)
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    FILENAME="schema_${DB_NAME}_${TIMESTAMP}.sql"
    echo "📦 Exportando apenas schema para ${FILENAME}..."
    PGPASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=${PROJECT_ID}) \
      pg_dump -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} --schema-only -F p -f "${FILENAME}"
    echo "✅ Schema salvo em ${FILENAME}"
    ;;
  export-table)
    if [ -z "$2" ]; then
      echo "❌ Uso: ./database.sh export-table <nome-da-tabela>"
      exit 1
    fi
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    FILENAME="${2}_${TIMESTAMP}.csv"
    echo "📦 Exportando tabela $2 para ${FILENAME}..."
    PGPASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=${PROJECT_ID}) \
      psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -c "\\COPY $2 TO '${FILENAME}' WITH CSV HEADER"
    echo "✅ Tabela exportada em ${FILENAME}"
    ;;
  tables)
    echo "📋 Listando tabelas..."
    PGPASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=${PROJECT_ID}) \
      psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -c "\\dt"
    ;;
  query)
    if [ -z "$2" ]; then
      echo "❌ Uso: ./database.sh query \"SELECT * FROM tabela LIMIT 10\""
      exit 1
    fi
    PGPASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=${PROJECT_ID}) \
      psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -c "$2"
    ;;
  status)
    echo "📊 Status da instância Cloud SQL:"
    gcloud sql instances describe ${INSTANCE_NAME} --project=${PROJECT_ID} --format="table(state,settings.tier,databaseVersion,ipAddresses[0].ipAddress)"
    ;;
  allow-ip)
    if [ -z "$2" ]; then
      MY_IP=$(curl -s ifconfig.me)
      echo "🌐 Seu IP: ${MY_IP}"
    else
      MY_IP="$2"
    fi
    echo "🔓 Liberando IP ${MY_IP} no Cloud SQL..."
    gcloud sql instances patch ${INSTANCE_NAME} \
      --authorized-networks=${MY_IP}/32 \
      --project=${PROJECT_ID}
    echo "✅ IP ${MY_IP} liberado!"
    ;;
  *)
    echo "============================================"
    echo "  Database Manager - Projeto Clash BK"
    echo "============================================"
    echo ""
    echo "Comandos disponíveis:"
    echo "  ./database.sh connect                    - Conectar via psql"
    echo "  ./database.sh run-sql <arquivo.sql>      - Executar arquivo SQL"
    echo "  ./database.sh export                     - Backup completo (schema + dados)"
    echo "  ./database.sh export-data                - Exportar apenas dados"
    echo "  ./database.sh export-schema              - Exportar apenas schema"
    echo "  ./database.sh export-table <tabela>      - Exportar tabela como CSV"
    echo "  ./database.sh tables                     - Listar tabelas"
    echo "  ./database.sh query \"SQL\"                - Executar query"
    echo "  ./database.sh status                     - Status da instância"
    echo "  ./database.sh allow-ip [ip]              - Liberar IP (default: seu IP atual)"
    echo ""
    echo "Conexão direta (SQLPro Studio):"
    echo "  Host: ${DB_HOST}"
    echo "  Port: ${DB_PORT}"
    echo "  Database: ${DB_NAME}"
    echo "  User: ${DB_USER}"
    echo "  Password: (rode ./update-secrets.sh get db-password)"
    ;;
esac
