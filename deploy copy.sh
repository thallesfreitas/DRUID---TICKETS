#!/bin/bash
# ============================================
# DEPLOY - Projeto Clash BK (Google Cloud Run)
# ============================================
# Uso: ./deploy.sh
# Este script faz build da imagem Docker, push pro Artifact Registry e deploy no Cloud Run.

set -e

PROJECT_ID="projeto-clash-bk"
REGION="southamerica-east1"
REPO="projeto-clash-bk"
IMAGE_NAME="clash-app"
SERVICE_NAME="projeto-clash-bk"
TAG="latest"

IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}:${TAG}"

echo "🔨 Building Docker image (linux/amd64)..."
docker build --platform linux/amd64 -f Dockerfile.prod -t ${IMAGE_URL} .

echo "📤 Pushing image to Artifact Registry..."
docker push ${IMAGE_URL}

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image=${IMAGE_URL} \
  --region=${REGION} \
  --platform=managed \
  --port=3000 \
  --allow-unauthenticated \
  --set-secrets=RESEND_API_KEY=resend-api-key:latest,RESEND_FROM=resend-from:latest,JWT_SECRET=jwt-secret:latest,TURNSTILE_SITE_KEY=turnstile-site-key:latest,TURNSTILE_SECRET_KEY=turnstile-secret-key:latest,DB_HOST=db-host:latest,DB_PASSWORD=db-password:latest,DB_NAME=db-name:latest,DB_USER=db-user:latest \
  --add-cloudsql-instances=${PROJECT_ID}:${REGION}:${PROJECT_ID} \
  --min-instances=0 \
  --max-instances=3 \
  --memory=512Mi \
  --cpu=1 \
  --project=${PROJECT_ID}

echo ""
echo "✅ Deploy concluído!"
echo "🌐 URL: $(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --format='value(status.url)')"
