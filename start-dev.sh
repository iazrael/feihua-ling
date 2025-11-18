#!/bin/bash

# 飞花令项目本地开发启动脚本

set -e  # 遇到错误立即退出

echo "🚀 启动飞花令本地开发环境..."

# 检查是否已安装依赖
echo "📦 检查依赖..."

# 后端依赖
cd backend
if [ ! -d "node_modules" ]; then
  echo "📥 安装后端依赖..."
  npm install
else
  echo "✓ 后端依赖已安装"
fi

# 检查并初始化数据库
if [ ! -f "dev.db" ]; then
  echo "🗄️  初始化数据库..."
  npx prisma generate
  npx prisma migrate deploy
  npm run seed:new
else
  echo "✓ 数据库已存在"
fi

# 启动后端服务
echo "🔧 启动后端服务 (端口: 3000)..."
npx prisma generate &
npm start &

# 等待后端启动
sleep 3

# 前端依赖
cd ../frontend
if [ ! -d "node_modules" ]; then
  echo "📥 安装前端依赖..."
  npm install
else
  echo "✓ 前端依赖已安装"
fi

# 启动前端开发服务器
echo "🎨 启动前端开发服务器 (端口: 5173)..."
npm run dev
