# 前端环境变量

<cite>
**本文档中引用的文件**  
- [frontend/.env.development](file://frontend/.env.development)
- [frontend/.env.production](file://frontend/.env.production)
- [frontend/vite.config.ts](file://frontend/vite.config.ts)
- [frontend/env.d.ts](file://frontend/env.d.ts)
- [frontend/src/stores/game.ts](file://frontend/src/stores/game.ts)
- [frontend/src/services/speechRecognitionService.ts](file://frontend/src/services/speechRecognitionService.ts)
</cite>

## 目录
1. [简介](#简介)
2. [环境变量配置文件](#环境变量配置文件)
3. [环境变量定义与使用](#环境变量定义与使用)
4. [Vite 配置中的代理设置](#vite-配置中的代理设置)
5. [环境变量类型声明](#环境变量类型声明)
6. [代码中环境变量的实际应用](#代码中环境变量的实际应用)
7. [开发与生产环境的一致性](#开发与生产环境的一致性)
8. [最佳实践建议](#最佳实践建议)

## 简介
本项目为一个基于 Vue 3 和 Vite 构建的前端应用，主要用于实现飞花令诗词接龙游戏。该项目通过环境变量管理 API 基础路径，并在不同环境中保持一致的接口调用方式。本文档详细分析了前端环境变量的配置、使用方式及其在项目架构中的作用。

## 环境变量配置文件
项目包含两个主要的环境变量配置文件，分别用于开发和生产环境。

**Section sources**
- [frontend/.env.development](file://frontend/.env.development#L1-L2)
- [frontend/.env.production](file://frontend/.env.production#L1-L2)

### 开发环境变量 (.env.development)
```env
VITE_API_BASE_URL=/api/v1
```

### 生产环境变量 (.env.production)
```env
VITE_API_BASE_URL=/api/v1
```

两个环境均设置相同的 `VITE_API_BASE_URL` 值，表明无论在开发还是生产环境下，前端都通过 `/api/v1` 路径访问后端服务。

## 环境变量定义与使用
项目中定义了一个关键环境变量 `VITE_API_BASE_URL`，其命名遵循 Vite 框架的要求：所有暴露给客户端代码的环境变量必须以 `VITE_` 开头。

该变量在源码中通过 `import.meta.env.VITE_API_BASE_URL` 的方式引用，这是 Vite 提供的标准访问机制，确保环境变量在构建时被正确注入。

**Section sources**
- [frontend/src/stores/game.ts](file://frontend/src/stores/game.ts#L4-L5)

## Vite 配置中的代理设置
在 `vite.config.ts` 文件中，配置了开发服务器的代理规则，用于解决开发环境下的跨域问题。

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

此配置表示：当浏览器请求以 `/api` 开头的路径时，Vite 开发服务器会将其代理到 `http://localhost:3000`（即后端服务地址），从而避免前端直接请求外部域名导致的 CORS 错误。

**Section sources**
- [frontend/vite.config.ts](file://frontend/vite.config.ts#L18-L24)

## 环境变量类型声明
项目根目录下的 `env.d.ts` 文件提供了环境变量的类型定义支持：

```ts
/// <reference types="vite/client" />
```

该语句引入了 Vite 客户端类型定义，使得 TypeScript 能够识别 `import.meta.env` 及其包含的环境变量（如 `VITE_API_BASE_URL`），提供类型检查和编辑器智能提示功能。

**Section sources**
- [frontend/env.d.ts](file://frontend/env.d.ts#L1-L1)

## 代码中环境变量的实际应用
环境变量 `VITE_API_BASE_URL` 在多个业务模块中被实际使用，最典型的是在 Pinia 状态管理中。

### 游戏状态管理模块 (game.ts)
在 `src/stores/game.ts` 中，定义了常量 `API_BASE_URL`：

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
```

该常量随后被用于构建所有与后端交互的 API 请求路径，例如：
- 启动游戏：`${API_BASE_URL}/game/start`
- 验证诗句：`${API_BASE_URL}/game/verify`
- AI 回合：`${API_BASE_URL}/game/ai-turn`
- 获取提示：`${API_BASE_URL}/game/hint`
- 随机关键字：`${API_BASE_URL}/game/random-char`

这种设计实现了 API 地址的集中管理，便于后期维护和环境切换。

**Section sources**
- [frontend/src/stores/game.ts](file://frontend/src/stores/game.ts#L4-L339)

### 语音识别服务模块 (speechRecognitionService.ts)
尽管该文件中未显式使用 `VITE_API_BASE_URL`，但其直接使用了相对路径 `/api/v1/speech/recognize` 发起请求：

```ts
const response = await fetch('/api/v1/speech/recognize', { ... });
```

这与 `VITE_API_BASE_URL` 的值保持一致，说明项目整体遵循统一的 API 路径规范。

**Section sources**
- [frontend/src/services/speechRecognitionService.ts](file://frontend/src/services/speechRecognitionService.ts#L16-L16)

## 开发与生产环境的一致性
值得注意的是，`.env.development` 和 `.env.production` 文件中的 `VITE_API_BASE_URL` 值完全相同，均为 `/api/v1`。这种设计意味着：

1. **路径一致性**：前后端接口路径在所有环境中保持一致。
2. **代理依赖**：开发环境依赖 Vite 的代理功能将 `/api` 请求转发至后端服务。
3. **部署简化**：生产环境通常由 Web 服务器（如 Nginx）统一处理静态资源和 API 请求，无需额外配置前端路径。

这种策略提高了部署灵活性，减少了因环境差异导致的错误。

## 最佳实践建议
根据本项目的环境变量使用情况，总结以下最佳实践：

1. **统一命名规范**：始终使用 `VITE_` 前缀暴露环境变量。
2. **集中管理 API 地址**：通过常量封装 `import.meta.env` 的访问，避免重复书写。
3. **提供默认值**：如 `import.meta.env.VITE_API_BASE_URL || '/api/v1'`，增强代码健壮性。
4. **类型支持**：引入 `vite/client` 类型定义，提升开发体验。
5. **合理使用代理**：开发环境利用代理解决跨域，生产环境交由服务器配置。
6. **环境隔离**：虽然当前环境变量相同，但在需要时可为不同环境配置不同值（如测试环境指向测试 API）。

这些实践有助于构建可维护、可扩展的前端应用。