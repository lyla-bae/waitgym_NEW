#!/bin/bash
# 로컬에서 실행 — EC2에 빌드 결과물 배포
# 사용법: ./scripts/deploy.sh <EC2_PUBLIC_IP> <KEY_PATH>
# 예시: ./scripts/deploy.sh 13.124.xxx.xxx ~/.ssh/waitgym-key.pem

set -e

EC2_IP=$1
KEY_PATH=$2

if [ -z "$EC2_IP" ] || [ -z "$KEY_PATH" ]; then
  echo "사용법: $0 <EC2_PUBLIC_IP> <KEY_PATH>"
  exit 1
fi

EC2_USER="ubuntu"
REMOTE_DIR="~/waitgym-be"

echo "📦 빌드 중..."
npm run build

echo "📤 파일 전송 중..."
rsync -avz --exclude 'node_modules' --exclude '.env' \
  -e "ssh -i $KEY_PATH" \
  dist/ package.json package-lock.json ecosystem.config.js \
  $EC2_USER@$EC2_IP:$REMOTE_DIR/

echo "🔧 EC2에서 의존성 설치 및 서버 재시작..."
ssh -i $KEY_PATH $EC2_USER@$EC2_IP << 'EOF'
  cd ~/waitgym-be
  npm install --omit=dev
  npx prisma generate
  pm2 restart ecosystem.config.js --update-env || pm2 start ecosystem.config.js
  pm2 save
EOF

echo "✅ 배포 완료!"
echo "서버: http://$EC2_IP:4000"
