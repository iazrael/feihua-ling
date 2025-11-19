# 飞花令项目 Vercel 部署指南

## 前置准备

### 1. 确保你有以下账号
- GitHub 账号
- Vercel 账号（可用 GitHub 登录）

### 2. 准备数据库和环境变量

在部署之前，需要准备一个远程 PostgreSQL 数据库和正确的环境变量配置：

```bash
# 在项目根目录执行
# 1. 设置环境变量
export DATABASE_URL=postgres://username:password@host:port/database?sslmode=require
export PRISMA_DATABASE_URL=postgres://username:password@host:port/database?sslmode=require

# 2. 准备部署文件
cd backend

# 安装依赖
npm install

# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

cd ..

# 3. 创建前端生产环境变量
mkdir -p frontend
cd frontend
cat > .env.production << EOF
VITE_API_BASE_URL=/api/v1
EOF
cd ..
```

## 方法一：通过 Vercel Dashboard 部署（推荐）

### 步骤 1：推送代码到 GitHub

确保你的项目已经推送到 GitHub：

```bash
git add .
git commit -m "chore: 准备 Vercel 部署"
git push origin main
```

### 步骤 2：在 Vercel 导入项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New..." → "Project"
3. 选择你的 GitHub 仓库
4. Vercel 会自动检测到 `vercel.json` 配置

### 步骤 3：配置环境变量

在项目设置中添加环境变量：

- **变量名**: `DATABASE_URL`
- **值**: `postgres://username:password@host:port/database?sslmode=require`
- **适用范围**: Production, Preview, Development

- **变量名**: `PRISMA_DATABASE_URL`
- **值**: `postgres://username:password@host:port/database?sslmode=require`
- **适用范围**: Production, Preview, Development

### 步骤 4：部署

点击 "Deploy" 按钮，等待部署完成（通常 2-3 分钟）。

### 步骤 5：验证部署

部署成功后，访问 Vercel 提供的 URL，测试以下功能：
- 首页是否正常加载
- 游戏功能是否可用
- API 是否响应正常

## 方法二：通过 Vercel CLI 部署

### 步骤 1：安装 Vercel CLI

```bash
npm install -g vercel
```

### 步骤 2：登录 Vercel

```bash
vercel login
```

### 步骤 3：准备数据库

```bash
# 设置环境变量
export DATABASE_URL=postgres://username:password@host:port/database?sslmode=require
export PRISMA_DATABASE_URL=postgres://username:password@host:port/database?sslmode=require

# 确保后端依赖已安装
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
cd ..

# 确保前端环境变量配置正确
mkdir -p frontend
cd frontend
cat > .env.production << EOF
VITE_API_BASE_URL=/api/v1
EOF
cd ..
```

### 步骤 4：初始化项目

```bash
vercel
```

首次部署时会询问：
- Set up and deploy? **Yes**
- Which scope? 选择你的账号
- Link to existing project? **No**
- What's your project's name? **feihua-ling** (或自定义)
- In which directory is your code located? **./** (默认)

### 步骤 5：配置环境变量

```bash
vercel env add DATABASE_URL production
# 输入值: postgres://username:password@host:port/database?sslmode=require

vercel env add PRISMA_DATABASE_URL production
# 输入值: postgres://username:password@host:port/database?sslmode=require

vercel env add DATABASE_URL preview
# 输入值: postgres://username:password@host:port/database?sslmode=require

vercel env add PRISMA_DATABASE_URL preview
# 输入值: postgres://username:password@host:port/database?sslmode=require
```

### 步骤 6：生产部署

```bash
vercel --prod
```

## 部署后配置

### 自定义域名（可选）

1. 在 Vercel Dashboard 中进入项目设置
2. 点击 "Domains"
3. 添加你的自定义域名
4. 按照指引配置 DNS

### 环境变量管理

通过 Vercel Dashboard 可以管理环境变量：
- Production: 生产环境
- Preview: 预览环境（Git 分支部署）
- Development: 本地开发环境

## 常见问题排查

### 1. API 返回 500 错误

**可能原因**：数据库连接配置错误

**解决方案**：
```bash
# 确保环境变量正确设置
export DATABASE_URL=postgres://username:password@host:port/database?sslmode=require
export PRISMA_DATABASE_URL=postgres://username:password@host:port/database?sslmode=require

# 重新部署
vercel --prod
```

### 2. 构建失败

**可能原因**：依赖安装失败

**解决方案**：
- 检查 `package.json` 中的依赖版本
- 确保 Node.js 版本符合要求（>= 20.19.0）
- 查看 Vercel 构建日志排查具体错误

### 3. 前端页面空白

**可能原因**：路由配置问题

**解决方案**：
- 检查 `vercel.json` 中的路由配置
- 确保 `outputDirectory` 设置正确

### 4. CORS 错误

**可能原因**：API 跨域配置

**解决方案**：
已在 `api/index.ts` 中配置 CORS，无需额外设置。

## 更新部署

每次推送代码到 GitHub 主分支，Vercel 会自动触发重新部署。

手动触发部署：
```bash
vercel --prod
```

## 监控和日志

在 Vercel Dashboard 中可以查看：
- 部署历史
- 运行时日志
- 性能指标
- 错误追踪

## 性能优化建议

1. **使用 Edge Functions**（可选）
   - 将 API 部署到离用户更近的边缘节点
   
2. **启用缓存**
   - 为静态资源配置缓存策略
   
3. **数据库优化**
   - 为生产环境添加数据库索引

4. **CDN 加速**
   - Vercel 默认使用 CDN，无需额外配置

## 注意事项

⚠️ **重要**：
- 项目现在使用远程 PostgreSQL 数据库而不是本地 SQLite
- 确保数据库连接信息正确且可访问
- 确保 `.gitignore` 中包含敏感信息（如密钥）

## 下一步

部署成功后，你可以：
- 配置自定义域名
- 设置 GitHub Actions 自动化测试
- 添加监控和告警
- 优化性能和 SEO

---

如有问题，请查看 [Vercel 官方文档](https://vercel.com/docs) 或提交 Issue。