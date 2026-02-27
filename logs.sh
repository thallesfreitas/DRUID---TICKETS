#!/bin/bash
# ============================================
# LOGS - Projeto Clash BK (Cloud Run)
# ============================================
# Uso: ./logs.sh [comando]

set -e

PROJECT_ID="projeto-clash-bk"
REGION="southamerica-east1"
SERVICE_NAME="projeto-clash-bk"

case "$1" in
  tail)
    echo "📜 Logs em tempo real (Ctrl+C para sair)..."
    gcloud run services logs tail ${SERVICE_NAME} \
      --region=${REGION} \
      --project=${PROJECT_ID}
    ;;
  errors)
    echo "❌ Últimos erros:"
    gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME} AND severity>=ERROR" \
      --project=${PROJECT_ID} \
      --limit=${2:-50} \
      --format="table(timestamp,textPayload)"
    ;;
  *)
    LIMIT=${1:-100}
    echo "📜 Últimos ${LIMIT} logs:"
    gcloud run services logs read ${SERVICE_NAME} \
      --region=${REGION} \
      --project=${PROJECT_ID} \
      --limit=${LIMIT}
    ;;
esac
