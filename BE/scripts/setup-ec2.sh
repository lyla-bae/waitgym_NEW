#!/bin/bash
# EC2 초기 세팅 스크립트 (Ubuntu 22.04 기준)
# EC2 SSH 접속 후 한 번만 실행

set -e

# Node.js 20 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 전역 설치
sudo npm install -g pm2

# 앱 디렉토리 생성
mkdir -p ~/waitgym-be

echo "✅ EC2 초기 세팅 완료"
echo "다음: deploy.sh 실행"
