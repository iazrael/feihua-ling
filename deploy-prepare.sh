#!/bin/bash

# 飞花令项目 Vercel 部署准备脚本

set -e  # 遇到错误立即退出

echo "🚀 开始准备 Vercel 部署..."
echo ""


# 1. 检查并安装后端依赖
echo "📦 安装后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
  npm install
else
  echo "✓ 后端依赖已存在"
fi

# 2. 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
npx prisma generate

# 3. 跳过数据库迁移（在部署环境中使用远程数据库）

# 4. 跳过本地数据库初始化，使用远程数据库

# 5. 编译后端代码
echo "🔨 编译后端代码..."
npm run build

# 6. 同步编译后的后端代码到 API 目录
echo "🔄 同步编译后的后端代码到 API 目录..."
cd ..
mkdir -p api
cp -r backend/dist api/
cp backend/package.json api/package.json

# 7. 创建前端环境变量文件
echo "⚙️  创建前端环境变量文件..."
cd frontend
cat > .env.production << EOF
VITE_API_BASE_URL=/api/v1
EOF
echo "✓ 前端环境变量文件已创建"
cd ..

# 8. 安装 API 依赖
echo "📦 安装 API 依赖..."
cd api
if [ ! -d "node_modules" ]; then
  npm install
else
  echo "✓ API 依赖已存在"
fi

# 9. 安装前端依赖
echo "📦 安装前端依赖..."
cd ../frontend
if [ ! -d "node_modules" ]; then
  npm install
else
  echo "✓ 前端依赖已存在"
fi

# 10. 测试前端构建
echo "🏗️  测试前端构建..."
npm run build

cd ..

echo ""
echo "✅ 部署准备完成！"
echo ""
echo "📝 文件检查清单："
echo "  ✓ 使用远程数据库"
echo "  ✓ frontend/dist - 前端构建产物"
echo "  ✓ frontend/.env.production - 前端生产环境变量"
echo ""
echo "🚀 下一步部署选项："
echo ""
echo "方法一：通过 Vercel Dashboard（推荐新手）"
echo "  1. 将代码推送到 GitHub"
echo "  2. 访问 https://vercel.com/dashboard"
echo "  3. 导入你的 GitHub 仓库"
echo "  4. Vercel 会自动检测配置并部署"
echo ""
echo "方法二：通过 Vercel CLI（推荐有经验用户）"
echo "  1. 安装 CLI: npm install -g vercel"
echo "  2. 登录: vercel login"
echo "  3. 部署: vercel --prod"
echo ""
echo "📖 详细部署文档请查看: DEPLOY.md"
echo ""