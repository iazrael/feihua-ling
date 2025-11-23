# 腾讯云 ASR 签名生成和调用测试指南

## 测试目标

验证后端签名生成功能和前端直调腾讯云 ASR 的完整流程。

## 前置准备

### 1. 配置环境变量

复制 `.env.example` 为 `.env` 并填入真实的腾讯云凭证：

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 腾讯云 ASR 配置（必填）
TENCENT_ASR_SECRET_ID=AKIDxxxxxxxxxxxxxx
TENCENT_ASR_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
TENCENT_ASR_APP_ID=1234567890

# DeepSeek LLM 配置（必填）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
DEEPSEEK_API_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TIMEOUT=5000

# 缓存配置
LLM_CACHE_TTL=3600
LLM_CACHE_MAX_SIZE=1000

# 多轮对话配置
CONVERSATION_HISTORY_LIMIT=3
ENABLE_CONVERSATION_CONTEXT=true
```

### 2. 安装依赖并启动后端

```bash
cd backend
npm install
npm run dev
```

后端应该在 `http://localhost:3000` 启动。

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端应该在 `http://localhost:5173` 启动。

## 测试步骤

### 测试 1: 签名生成接口

使用 curl 测试签名生成接口：

```bash
curl -X POST http://localhost:3000/api/v1/speech/get-signature \
  -H "Content-Type: application/json" \
  -d '{"audioLength": 10240}'
```

**预期响应：**

```json
{
  "success": true,
  "headers": {
    "Content-Type": "application/json; charset=utf-8",
    "Authorization": "TC3-HMAC-SHA256 Credential=...",
    "X-TC-Action": "SentenceRecognition",
    "X-TC-Version": "2019-06-14",
    "X-TC-Timestamp": "1234567890",
    "X-TC-Region": "ap-beijing"
  },
  "payload": {
    "ProjectId": 0,
    "SubServiceType": 2,
    "EngSerViceType": "16k",
    "SourceType": 1,
    "VoiceFormat": 4,
    "UsrAudioKey": "session-1234567890",
    "DataLen": 10240
  },
  "endpoint": "https://asr.tencentcloudapi.com"
}
```

**验证要点：**
- ✅ `success` 为 `true`
- ✅ `headers.Authorization` 包含 TC3-HMAC-SHA256 签名
- ✅ `headers.X-TC-Timestamp` 是当前时间戳
- ✅ `payload.UsrAudioKey` 是唯一的会话 ID
- ✅ `endpoint` 是腾讯云 ASR 接口地址

### 测试 2: 端到端语音识别测试

#### 2.1 准备测试音频

准备一个包含古诗词的 WAV 格式音频文件，例如录制"春眠不觉晓"。

#### 2.2 在浏览器中测试

1. 打开 `http://localhost:5173`
2. 开始游戏，选择令字"春"
3. 按住"按住说话"按钮
4. 说出"春眠不觉晓"
5. 松开按钮

**预期行为：**
- ✅ 按住时显示"🎤 录音中...请说话"
- ✅ 松开后显示"🔍 语音识别中..."
- ✅ 计时器显示"语音识别中"并暂停倒计时
- ✅ 识别成功后输入框自动填充"春眠不觉晓"
- ✅ 如果 LLM 判断正确，自动提交答案
- ✅ 计时器恢复或进入下一回合

#### 2.3 查看浏览器控制台

打开浏览器开发者工具 Console 查看日志：

**成功日志示例：**
```
[speechRecognitionService] 获取签名成功
[speechRecognitionService] 调用腾讯云 ASR
[speechRecognitionService] ASR 识别结果: 春眠不觉晓
[speechRecognitionService] 调用 LLM 验证
[game.ts] 更新会话上下文
```

**失败日志示例：**
```
[speechRecognitionService] 腾讯云 ASR 识别失败: 超时
[speechRecognitionService] 降级到浏览器 Web Speech API
[browserSpeechService] 开始浏览器识别
```

### 测试 3: 网络请求验证

在浏览器开发者工具 Network 标签中观察请求：

#### 3.1 签名请求

**请求：** `POST /api/v1/speech/get-signature`

**请求体：**
```json
{
  "audioLength": 12345
}
```

**响应状态：** `200 OK`

**响应体：** 包含签名信息的 JSON

#### 3.2 腾讯云 ASR 请求

**请求：** `POST https://asr.tencentcloudapi.com`

**请求头：**
```
Authorization: TC3-HMAC-SHA256 Credential=...
X-TC-Action: SentenceRecognition
X-TC-Version: 2019-06-14
X-TC-Timestamp: ...
```

**请求体：**
```json
{
  "ProjectId": 0,
  "SubServiceType": 2,
  "EngSerViceType": "16k",
  "SourceType": 1,
  "VoiceFormat": 4,
  "UsrAudioKey": "session-...",
  "Data": "base64-encoded-audio-data",
  "DataLen": 12345
}
```

**响应状态：** `200 OK`

**响应体：**
```json
{
  "Response": {
    "RequestId": "xxx-xxx-xxx",
    "Result": "春眠不觉晓"
  }
}
```

### 测试 4: 错误处理测试

#### 4.1 签名失败测试

临时删除环境变量中的 `TENCENT_ASR_SECRET_KEY`，重启后端。

**预期行为：**
- ✅ 签名接口返回 `{"success": false, "error": "签名生成失败"}`
- ✅ 前端显示"获取签名失败"错误提示
- ✅ 如果启用降级，自动切换到浏览器识别

#### 4.2 ASR 调用失败测试

故意使用错误的音频格式或超大文件。

**预期行为：**
- ✅ 腾讯云返回错误响应
- ✅ 前端显示具体错误信息
- ✅ 计时器恢复倒计时

## 测试检查清单

### 功能测试

- [ ] 签名生成接口正常返回
- [ ] 签名包含正确的时间戳和 Authorization 头
- [ ] 前端能够获取签名
- [ ] 前端能够使用签名调用腾讯云 ASR
- [ ] 腾讯云 ASR 返回正确的识别文本
- [ ] 识别文本能够正确显示在输入框
- [ ] 计时器在录音和识别期间暂停
- [ ] 识别完成后计时器恢复
- [ ] 降级到浏览器识别功能正常

### 安全性测试

- [ ] 前端无法直接访问 SecretKey
- [ ] 签名有效期验证（5分钟）
- [ ] 音频大小限制验证（5MB）

### 性能测试

- [ ] 签名生成时间 < 500ms
- [ ] ASR 识别时间 < 2s
- [ ] 端到端流程时间 < 5s

## 常见问题排查

### 问题 1: 签名生成失败

**可能原因：**
- 环境变量未正确配置
- SecretId 或 SecretKey 错误

**解决方案：**
- 检查 `.env` 文件配置
- 验证腾讯云控制台密钥是否正确
- 重启后端服务

### 问题 2: 腾讯云 ASR 调用失败

**可能原因：**
- 签名时间戳过期（超过5分钟）
- 音频格式不支持
- 网络问题

**解决方案：**
- 确保前端时间与服务器时间同步
- 使用 WAV 格式音频
- 检查网络连接

### 问题 3: 识别结果不准确

**可能原因：**
- 音频质量差
- 环境噪音
- 说话不清晰

**解决方案：**
- 使用高质量麦克风
- 在安静环境录音
- 说话时吐字清晰
- 依赖 LLM 进行宽松判断

## 测试报告模板

```markdown
## 测试日期
YYYY-MM-DD

## 测试环境
- 后端版本：
- 前端版本：
- 浏览器：Chrome/Safari/Firefox
- 操作系统：macOS/Windows/Linux

## 测试结果

### 签名生成测试
- [ ] 通过 / [ ] 失败
- 备注：

### ASR 调用测试
- [ ] 通过 / [ ] 失败
- 识别准确率：
- 备注：

### 计时器暂停测试
- [ ] 通过 / [ ] 失败
- 备注：

### 降级功能测试
- [ ] 通过 / [ ] 失败
- 备注：

## 发现的问题
1. 
2. 
3. 

## 改进建议
1. 
2. 
3. 
```
