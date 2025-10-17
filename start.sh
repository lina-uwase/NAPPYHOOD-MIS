#!/bin/bash
set -e

echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "📋 Verifying installation..."
node --version
npm --version

echo "🏗️ Installing dependencies..."
cd backend
npm ci

echo "🔨 Building application..."
npm run build

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🗄️ Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npm run seed || echo "⚠️ Seeding failed, continuing..."

echo "🚀 Starting application..."
npm start