#!/usr/bin/env bash
# =============================================================
#  build-and-push.sh
#  Build multi-platform Docker images (amd64 + arm64) และ push
#  ไปยัง Docker Hub  chanetw/sena-api  chanetw/sena-web
#
#  Usage:
#    bash build-and-push.sh [TAG] [VITE_API_BASE]
#
#  Example (production server 172.22.22.11):
#    bash build-and-push.sh latest http://172.22.22.11:4000/api
# =============================================================
set -euo pipefail

DOCKER_USER="chanetw"
API_IMAGE="${DOCKER_USER}/sena-api"
WEB_IMAGE="${DOCKER_USER}/sena-web"
PLATFORMS="linux/amd64,linux/arm64"
TAG="${1:-latest}"
VITE_API_BASE="${2:-http://172.22.22.11:4000/api}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SENA HAPPY REFER — Multi-platform Docker Build & Push"
echo "  Platforms    : ${PLATFORMS}"
echo "  Tag          : ${TAG}"
echo "  VITE_API_BASE: ${VITE_API_BASE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ตรวจสอบว่า login แล้ว
if ! docker info | grep -q "Username"; then
  echo "❌  กรุณา docker login ก่อน:"
  echo "    docker login"
  exit 1
fi

# สร้าง/ใช้ buildx builder ที่รองรับ multi-platform
BUILDER="sena-builder"
if ! docker buildx ls | grep -q "${BUILDER}"; then
  echo ""
  echo "📦  สร้าง buildx builder: ${BUILDER}"
  docker buildx create --name "${BUILDER}" --driver docker-container --bootstrap
else
  echo "📦  ใช้ buildx builder เดิม: ${BUILDER}"
fi
docker buildx use "${BUILDER}"

# ─── Build & Push API ────────────────────────────────────────
echo ""
echo "🔨  Building + Pushing API  →  ${API_IMAGE}:${TAG}"
docker buildx build \
  --platform "${PLATFORMS}" \
  --tag "${API_IMAGE}:${TAG}" \
  --tag "${API_IMAGE}:$(date +%Y%m%d)" \
  --push \
  ./backend

# ─── Build & Push Web ────────────────────────────────────────
echo ""
echo "🔨  Building + Pushing Web  →  ${WEB_IMAGE}:${TAG}"
echo "    VITE_API_BASE = ${VITE_API_BASE}"
docker buildx build \
  --platform "${PLATFORMS}" \
  --tag "${WEB_IMAGE}:${TAG}" \
  --tag "${WEB_IMAGE}:$(date +%Y%m%d)" \
  --build-arg "VITE_API_BASE=${VITE_API_BASE}" \
  --build-arg "VITE_ENV=production" \
  --push \
  ./frontend

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  Push สำเร็จ!"
echo "  API : https://hub.docker.com/r/${API_IMAGE}"
echo "  Web : https://hub.docker.com/r/${WEB_IMAGE}"
echo ""
echo "  คำสั่ง pull บน server production:"
echo "  docker compose -f docker-compose.prod.yml pull"
echo "  docker compose -f docker-compose.prod.yml up -d"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
