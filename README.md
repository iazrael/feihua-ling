# 飞花令项目

这是一个使用 Vue3 + TypeScript 开发的飞花令 H5 应用，支持手机和平板访问，提供人机对战古诗词飞花令游戏。

## ✨ 功能特性

- 🎮 人机对战飞花令游戏
- 📝 智能诗句验证（支持精确匹配、同音字识别、编辑距离模糊匹配）
- 🤖 AI 智能出句
- 📚 内置丰富的古诗词数据库
- 🎨 中国风主题 UI 设计
- 📱 完全适配移动端和平板设备

## 🛠️ 技术栈

### 前端
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS v4
- **路由**: Vue Router
- **状态管理**: Pinia
- **工具库**: html2canvas（分享卡片生成）

### 后端
- **运行环境**: Node.js
- **框架**: Express
- **数据库**: PostgreSQL + Prisma ORM（原SQLite）
- **工具库**: pinyin-pro（拼音处理）、fastest-levenshtein（编辑距离计算）

## 📦 项目结构

```
feihua_ling/
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── components/   # Vue 组件
│   │   ├── views/        # 页面视图
│   │   ├── stores/       # Pinia 状态管理
│   │   ├── router/       # 路由配置
│   │   ├── services/     # 服务层（音效等）
│   │   └── types/        # TypeScript 类型定义
│   └── package.json
├── backend/           # 后端开发环境
│   ├── src/
│   │   └── index.ts      # Express 服务入口
│   ├── prisma/
│   │   ├── schema.prisma # 数据库模型
│   │   └── seed.ts       # 数据初始化脚本
│   └── package.json
├── api/               # Vercel Serverless API
│   ├── index.ts          # Serverless Function 入口
│   ├── schema.prisma     # 数据库模型
│   ├── prod.db           # 生产数据库（需提交到 Git）
│   └── package.json
├── vercel.json        # Vercel 部署配置
├── deploy-prepare.sh  # Vercel 部署准备脚本
├── start-dev.sh       # 本地开发启动脚本
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 20.19.0 或 >= 22.12.0
- npm 或 pnpm

### 本地开发

#### 1. 克隆项目

```bash
git clone <你的仓库地址>
cd feihua_ling
```

#### 2. 使用启动脚本（推荐）

项目提供了一个便捷的启动脚本，可以自动安装依赖、初始化数据库并启动开发服务器：

```bash
# 在项目根目录执行
# 首先设置环境变量
export DATABASE_URL="postgres://username:password@host:port/database?sslmode=require"
export PRISMA_DATABASE_URL="postgres://username:password@host:port/database?sslmode=require"

# 然后运行启动脚本
./start-dev.sh
```

该脚本会：
- 自动检查并安装前后端依赖
- 使用远程 PostgreSQL 数据库（不再使用本地 SQLite）
- 同时启动前后端开发服务器

#### 3. 手动安装依赖（可选）

如果不想使用启动脚本，也可以手动安装依赖：

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

#### 4. 配置环境变量

在运行任何脚本之前，需要设置以下环境变量：

```bash
# 数据库连接URL
export DATABASE_URL="postgres://username:password@host:port/database?sslmode=require"
export PRISMA_DATABASE_URL="postgres://username:password@host:port/database?sslmode=require"
```

或者创建一个 `.env` 文件在项目根目录：

```env
DATABASE_URL=postgres://username:password@host:port/database?sslmode=require
PRISMA_DATABASE_URL=postgres://username:password@host:port/database?sslmode=require
```

#### 5. 准备 Vercel 部署（可选）

如果要部署到 Vercel，运行部署准备脚本：

```bash
# 首先设置环境变量
export DATABASE_URL="postgres://username:password@host:port/database?sslmode=require"
export PRISMA_DATABASE_URL="postgres://username:password@host:port/database?sslmode=require"

# 然后运行部署准备脚本
./deploy-prepare.sh
```

该脚本会自动完成以下任务：
- 安装所有依赖
- 生成 Prisma Client
- 运行数据库迁移
- 测试前端构建

#### 6. 启动开发服务器

```bash
# 启动后端（在 backend 目录）
cd backend
npm start          # 默认运行在 http://localhost:3000

# 启动前端（新开一个终端，在 frontend 目录）
cd frontend
npm run dev        # 默认运行在 http://localhost:5173
```

#### 7. 访问应用

打开浏览器访问 `http://localhost:5173`

## ☁️ 部署到 Vercel（一键部署）

### 方式一：通过 Vercel Dashboard（推荐）

1. **Fork 或上传项目到 GitHub**
   - 确保你的项目已经推送到 GitHub 仓库
   - 运行 `./deploy-prepare.sh` 脚本准备部署文件

2. **登录 Vercel**
   - 访问 [Vercel](https://vercel.com)
   - 使用 GitHub 账号登录

3. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的 GitHub 仓库
   - Vercel 会自动检测到 `vercel.json` 配置

4. **配置环境变量**
   
   在 Vercel 项目设置中添加以下环境变量：
   
   | 变量名 | 值 | 说明 |
   |--------|-----|------|
   | `DATABASE_URL` | `postgres://username:password@host:port/database?sslmode=require` | 远程数据库连接字符串 |
   | `PRISMA_DATABASE_URL` | `postgres://username:password@host:port/database?sslmode=require` | Prisma 数据库连接字符串 |
   | `NODE_ENV` | `production` | 运行环境 |

5. **部署**
   - 点击 "Deploy" 按钮
   - Vercel 会自动构建并部署前后端
   - 等待部署完成（通常 2-3 分钟）

6. **访问应用**
   - 部署成功后，Vercel 会提供一个访问链接
   - 例如：`https://your-project.vercel.app`

### 方式二：通过 Vercel CLI

#### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登录 Vercel

```bash
vercel login
```

#### 3. 准备部署文件

```bash
# 在项目根目录执行
# 首先设置环境变量
export DATABASE_URL="postgres://username:password@host:port/database?sslmode=require"
export PRISMA_DATABASE_URL="postgres://username:password@host:port/database?sslmode=require"

# 然后运行部署准备脚本
./deploy-prepare.sh
```

#### 4. 部署项目

```bash
# 在项目根目录执行
vercel

# 首次部署时，Vercel 会询问一些配置问题：
# - Set up and deploy? Yes
# - Which scope? 选择你的账号
# - Link to existing project? No
# - What's your project's name? feihua-ling（或自定义）
# - In which directory is your code located? ./（默认）
```

#### 5. 配置环境变量

```bash
# 添加数据库 URL
vercel env add DATABASE_URL production
# 输入值: postgres://username:password@host:port/database?sslmode=require

# 添加 Prisma 数据库 URL
vercel env add PRISMA_DATABASE_URL production
# 输入值: postgres://username:password@host:port/database?sslmode=require

# 添加 Node 环境
vercel env add NODE_ENV production
# 输入值: production
```

#### 6. 生产部署

```bash
vercel --prod
```

### 部署配置说明

项目使用 `vercel.json` 进行部署配置，包含：

- **前端构建**：自动构建 Vue 项目并托管静态文件
- **后端部署**：将 Express API 部署为 Serverless Functions
- **路由规则**：
  - `/api/v1/*` 请求转发到后端 API
  - 其他请求转发到前端静态页面
- **环境变量**：自动注入配置的环境变量

### 数据库配置（重要）

⚠️ **项目现在使用远程 PostgreSQL 数据库而不是本地 SQLite**

在部署之前，需要确保：
1. 有一个可用的 PostgreSQL 数据库实例
2. 正确配置了 `DATABASE_URL` 和 `PRISMA_DATABASE_URL` 环境变量
3. 数据库已经初始化并导入了诗词数据

### 自动部署

配置完成后，每次推送到 GitHub 主分支时，Vercel 会自动触发部署。

## 📝 API 接口文档

所有 API 接口统一使用前缀 `/api/v1/`

### 1. 获取随机令字

```http
GET /api/v1/game/random-char
```

**响应示例**：
```json
{
  "char": "春"
}
```

### 2. 开始游戏

```http
POST /api/v1/game/start
Content-Type: application/json

{
  "keyword": "春"
}
```

**响应示例**：
```json
{
  "success": true,
  "keyword": "春",
  "firstSentence": {
    "content": "春眠不觉晓",
    "title": "春晓",
    "author": "孟浩然"
  }
}
```

### 3. 验证用户诗句

```http
POST /api/v1/game/verify
Content-Type: application/json

{
  "sentence": "春江潮水连海平",
  "char": "春",
  "usedPoems": []
}
```

**响应示例**：
```json
{
  "valid": true,
  "message": "验证成功",
  "matchType": "exact",
  "poem": {
    "id": 1,
    "title": "春江花月夜",
    "author": "张若虚"
  }
}
```

### 4. AI 出句

```http
POST /api/v1/game/ai-turn
Content-Type: application/json

{
  "char": "春",
  "usedPoems": ["春眠不觉晓"]
}
```

**响应示例**：
```json
{
  "sentence": "春江潮水连海平",
  "title": "春江花月夜",
  "author": "张若虚"
}
```

### 5. 获取提示

```http
POST /api/v1/game/hint
Content-Type: application/json

{
  "keyword": "春",
  "hintLevel": 1
}
```

**响应示例**：
```json
{
  "hint": "提示：这句诗的作者是孟浩然",
  "sentence": "春眠不觉晓"
}
```

## 🔧 开发规范

### 编码规范

- **语言模式**: TypeScript 严格模式
- **代码风格**: 遵循 ESLint 配置
- **注释语言**: 必须使用中文
- **命名规范**:
  - 组件文件：PascalCase（如 `GameView.vue`）
  - 普通文件：camelCase（如 `soundService.ts`）
  - 常量：UPPER_SNAKE_CASE

### 项目约定

- **架构**: 前后端分离，保持分层清晰
- **API 路由**: 统一使用 `/api/v1/` 前缀
- **组件目录**: `src/components/`
- **工具函数**: `src/utils/`（如需要）
- **测试文件**: 使用 `.test.ts` 后缀

### Git 提交规范

建议使用语义化提交信息：

```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 重构代码
test: 测试相关
chore: 构建/工具链相关
```

## 🐛 常见问题

### 1. 前端无法连接后端 API

**问题**：跨域错误或连接失败

**解决方案**：
- 确保后端服务已启动（默认 3000 端口）
- 检查前端 API 请求地址配置
- 后端已启用 CORS，无需额外配置

### 2. 数据库连接失败

**问题**：无法连接到远程数据库

**解决方案**：
- 检查 `DATABASE_URL` 和 `PRISMA_DATABASE_URL` 环境变量是否正确设置
- 确保数据库服务器可访问
- 检查数据库凭据是否正确

### 3. Prisma Client 错误

**问题**：`@prisma/client` 未生成

**解决方案**：
```bash
cd backend
npx prisma generate
```

### 4. Vercel 部署后 API 无响应

**问题**：部署成功但接口 500 错误

**解决方案**：
- 检查环境变量是否正确配置
- 确保数据库已初始化
- 查看 Vercel 部署日志排查错误

### 5. Tailwind CSS 样式不生效

**问题**：样式无法应用

**解决方案**：
- 确保使用 Tailwind CSS v4 语法
- 检查 `main.css` 中的 `@import "tailwindcss"` 是否正确
- 清除缓存重新构建：`npm run build`

## 📄 许可证

MIT License

## 👥 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📮 联系方式

如有问题或建议，欢迎通过 Issue 反馈。

---

**祝你使用愉快！** 🎉