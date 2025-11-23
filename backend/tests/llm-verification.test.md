# LLM 验证和多轮对话上下文测试指南

## 测试目标

验证 DeepSeek LLM 智能判断功能和多轮对话上下文记录功能。

## 前置准备

### 1. 配置 DeepSeek API

确保 `.env` 文件包含有效的 DeepSeek API 密钥：

```env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
DEEPSEEK_API_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TIMEOUT=5000
```

### 2. 启动服务

```bash
# 后端
cd backend
npm run dev

# 前端
cd frontend
npm run dev
```

## 测试场景

### 测试 1: 基础 LLM 验证接口

使用 curl 测试 LLM 验证接口：

```bash
curl -X POST http://localhost:3000/api/v1/game/verify-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "recognizedText": "春眠不觉小",
    "keyword": "春",
    "usedPoems": []
  }'
```

**预期响应（识别错误但 LLM 修正）：**

```json
{
  "success": true,
  "valid": true,
  "isCorrect": true,
  "correctedSentence": "春眠不觉晓",
  "matchType": "llm_fuzzy",
  "poem": {
    "id": 123,
    "title": "春晓",
    "author": "孟浩然"
  },
  "message": "识别结果与诗句基本一致，判定正确！"
}
```

**验证要点：**
- ✅ `isCorrect` 为 `true`（尽管原始文本有误）
- ✅ `correctedSentence` 为修正后的标准诗句
- ✅ `matchType` 为 `llm_fuzzy`
- ✅ `poem` 包含诗词元数据

### 测试 2: LLM 宽松判断能力

测试不同程度的识别错误：

#### 2.1 谐音字替换

```bash
curl -X POST http://localhost:3000/api/v1/game/verify-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "recognizedText": "春眠不觉小",
    "keyword": "春",
    "usedPoems": []
  }'
```

**预期：** ✅ 判断为正确（"晓"与"小"谐音）

#### 2.2 个别字错误

```bash
curl -X POST http://localhost:3000/api/v1/game/verify-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "recognizedText": "春眠不觉晨",
    "keyword": "春",
    "usedPoems": []
  }'
```

**预期：** ✅ 判断为正确（字数、韵律一致，能推断出正确诗句）

#### 2.3 完全错误的内容

```bash
curl -X POST http://localhost:3000/api/v1/game/verify-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "recognizedText": "今天天气真好",
    "keyword": "春",
    "usedPoems": []
  }'
```

**预期：** ❌ 判断为错误（不是诗词）

```json
{
  "success": true,
  "valid": false,
  "isCorrect": false,
  "message": "这不是一句诗词，请再试一次"
}
```

### 测试 3: 多轮对话上下文功能

#### 3.1 第一轮答题（无上下文）

```bash
curl -X POST http://localhost:3000/api/v1/game/verify-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "recognizedText": "春眠不觉小",
    "keyword": "春",
    "usedPoems": [],
    "conversationContext": {
      "recentHistory": [],
      "userStyle": {
        "commonErrors": [],
        "accuracyRate": 0,
        "averageConfidence": "medium"
      }
    }
  }'
```

**预期：** LLM 根据文本内容判断，无历史参考。

#### 3.2 第二轮答题（带上下文）

```bash
curl -X POST http://localhost:3000/api/v1/game/verify-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "recognizedText": "春江潮水连海平",
    "keyword": "春",
    "usedPoems": ["春眠不觉晓"],
    "conversationContext": {
      "recentHistory": [
        {
          "round": 1,
          "recognizedText": "春眠不觉小",
          "correctedSentence": "春眠不觉晓",
          "isCorrect": true
        }
      ],
      "userStyle": {
        "commonErrors": ["晓->小"],
        "accuracyRate": 1.0,
        "averageConfidence": "high"
      }
    }
  }'
```

**预期：** LLM 参考上下文，知道用户容易将"晓"识别为"小"。

#### 3.3 第三轮答题（多个历史记录）

```bash
curl -X POST http://localhost:3000/api/v1/game/verify-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "recognizedText": "春风又绿江南岸",
    "keyword": "春",
    "usedPoems": ["春眠不觉晓", "春江潮水连海平"],
    "conversationContext": {
      "recentHistory": [
        {
          "round": 1,
          "recognizedText": "春眠不觉小",
          "correctedSentence": "春眠不觉晓",
          "isCorrect": true
        },
        {
          "round": 2,
          "recognizedText": "春江潮水连海平",
          "correctedSentence": "春江潮水连海平",
          "isCorrect": true
        }
      ],
      "userStyle": {
        "commonErrors": ["晓->小"],
        "accuracyRate": 1.0,
        "averageConfidence": "high"
      }
    }
  }'
```

**预期：** LLM 基于2轮历史进行更精准判断。

### 测试 4: 缓存功能验证

#### 4.1 首次请求

```bash
time curl -X POST http://localhost:3000/api/v1/game/verify-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "recognizedText": "春眠不觉小",
    "keyword": "春",
    "usedPoems": []
  }'
```

**预期：** 响应时间约 2-5 秒（调用 DeepSeek API）

#### 4.2 相同请求（命中缓存）

```bash
time curl -X POST http://localhost:3000/api/v1/game/verify-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "recognizedText": "春眠不觉小",
    "keyword": "春",
    "usedPoems": []
  }'
```

**预期：** 响应时间 < 100ms（从缓存返回）

**验证要点：**
- ✅ 第二次请求明显更快
- ✅ 响应内容完全一致
- ✅ 后端日志显示 "使用缓存结果"

### 测试 5: 前端集成测试

#### 5.1 在游戏中测试

1. 打开游戏，选择令字"春"
2. 第一轮：说"春眠不觉小"（故意说错）
3. 观察：
   - ✅ 输入框显示"春眠不觉晓"（LLM 修正）
   - ✅ 答案被判定为正确
   - ✅ 进入下一回合

4. 第二轮：说"春江潮水连海平"
5. 观察：
   - ✅ 会话上下文已包含第一轮记录
   - ✅ 用户风格统计显示"晓->小"错误

6. 第三轮：再次故意说错含"晓"的诗句
7. 观察：
   - ✅ LLM 基于历史错误模式更准确地修正

#### 5.2 查看浏览器控制台

```javascript
// 在 Console 中查看 Pinia Store
const gameStore = window.$pinia.state.value.game;

// 查看会话上下文
console.log(gameStore.conversationContext);

// 输出示例：
{
  recentHistory: [
    {
      round: 1,
      recognizedText: "春眠不觉小",
      correctedSentence: "春眠不觉晓",
      isCorrect: true
    },
    {
      round: 2,
      recognizedText: "春江潮水连海平",
      correctedSentence: "春江潮水连海平",
      isCorrect: true
    }
  ],
  userStyle: {
    commonErrors: ["晓->小"],
    accuracyRate: 1.0,
    averageConfidence: "high"
  }
}
```

### 测试 6: 降级策略测试

#### 6.1 模拟 LLM 服务失败

临时删除或错误配置 `DEEPSEEK_API_KEY`，重启后端。

```bash
curl -X POST http://localhost:3000/api/v1/game/verify-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "recognizedText": "春眠不觉晓",
    "keyword": "春",
    "usedPoems": []
  }'
```

**预期行为：**
- ✅ LLM 调用失败
- ✅ 自动降级到原有验证逻辑（拼音 + 编辑距离）
- ✅ 返回验证结果（可能更严格）
- ✅ 后端日志显示 "LLM 失败，降级到原有验证"

#### 6.2 模拟 LLM 超时

在 `.env` 中设置极短的超时时间：

```env
DEEPSEEK_TIMEOUT=1
```

**预期行为：**
- ✅ LLM 调用超时
- ✅ 自动降级
- ✅ 前端提示"验证服务繁忙，已使用备选方案"

### 测试 7: 边界条件测试

#### 7.1 空文本

```bash
curl -X POST http://localhost:3000/api/v1/game/verify-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "recognizedText": "",
    "keyword": "春",
    "usedPoems": []
  }'
```

**预期：** ❌ 返回错误或判定为无效

#### 7.2 超长文本

```bash
curl -X POST http://localhost:3000/api/v1/game/verify-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "recognizedText": "春眠不觉晓春眠不觉晓春眠不觉晓春眠不觉晓春眠不觉晓春眠不觉晓",
    "keyword": "春",
    "usedPoems": []
  }'
```

**预期：** ❌ 判定为无效（不符合诗词格式）

#### 7.3 重复诗句

```bash
curl -X POST http://localhost:3000/api/v1/game/verify-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "recognizedText": "春眠不觉晓",
    "keyword": "春",
    "usedPoems": ["春眠不觉晓"]
  }'
```

**预期：** ❌ 返回"诗句重复"错误

## 测试检查清单

### LLM 功能测试

- [ ] LLM 验证接口正常返回
- [ ] 能够正确修正谐音字错误
- [ ] 能够正确修正个别字错误
- [ ] 能够拒绝完全错误的内容
- [ ] 能够拒绝非诗词内容
- [ ] 能够验证令字存在性
- [ ] 能够检测诗句重复

### 多轮对话上下文测试

- [ ] 前端能够正确记录历史答题
- [ ] 最多保留3轮历史记录
- [ ] 能够统计常见识别错误
- [ ] 能够计算识别准确率
- [ ] 能够更新平均置信度
- [ ] 上下文能够传递给 LLM
- [ ] 新游戏开始时重置上下文

### 缓存功能测试

- [ ] 相同请求命中缓存
- [ ] 缓存响应时间显著更快
- [ ] 缓存包含上下文哈希
- [ ] 不同上下文不共享缓存
- [ ] 缓存过期时间正确（3600秒）

### 降级策略测试

- [ ] LLM 失败时自动降级
- [ ] 降级后使用原有验证逻辑
- [ ] 降级提示清晰
- [ ] 降级不影响游戏继续

## 性能基准

### 响应时间

- LLM 首次调用: < 5s
- LLM 缓存命中: < 100ms
- 数据库查询: < 200ms
- 端到端验证: < 6s

### 准确率

- 谐音字识别: > 90%
- 个别字错误: > 80%
- 完全正确文本: 100%
- 误判率: < 5%

## 常见问题排查

### 问题 1: LLM 调用失败

**可能原因：**
- DeepSeek API 密钥错误
- 网络连接问题
- API 额度用尽

**解决方案：**
- 验证 API 密钥
- 检查网络连接
- 查看 DeepSeek 控制台额度

### 问题 2: 上下文未生效

**可能原因：**
- 前端未传递 conversationContext
- Store 更新逻辑错误

**解决方案：**
- 检查 API 请求体
- 验证 Store 的 updateConversationContext 方法

### 问题 3: 缓存未命中

**可能原因：**
- 上下文哈希不一致
- 缓存已过期

**解决方案：**
- 检查缓存键生成逻辑
- 验证 TTL 配置

## 测试报告模板

```markdown
## 测试日期
YYYY-MM-DD

## 测试环境
- DeepSeek API 版本：
- 后端版本：
- 前端版本：

## 测试结果

### LLM 验证功能
- [ ] 通过 / [ ] 失败
- 准确率：
- 备注：

### 多轮对话上下文
- [ ] 通过 / [ ] 失败
- 备注：

### 缓存功能
- [ ] 通过 / [ ] 失败
- 命中率：
- 备注：

### 降级策略
- [ ] 通过 / [ ] 失败
- 备注：

## 性能指标
- LLM 平均响应时间：
- 缓存命中率：
- 端到端验证时间：

## 发现的问题
1. 
2. 

## 改进建议
1. 
2. 
```
