// 腾讯云语音识别后端服务

import crypto from 'crypto';
import axios from 'axios';

// 配置信息 - 在生产环境中应该从环境变量中读取
const SECRET_ID = process.env.TENCENT_ASR_SECRET_ID || 'your-secret-id';
const SECRET_KEY = process.env.TENCENT_ASR_SECRET_KEY || 'your-secret-key';
const APP_ID = process.env.TENCENT_ASR_APP_ID || 'your-app-id';

// 生成腾讯云API签名
function generateSignature(secretKey: string, date: string, service: string, payload: string): string {
  // 第一步：生成签名字符串
  const algorithm = 'TC3-HMAC-SHA256';
  const timestamp = Math.floor(Date.now() / 1000);
  const credentialScope = `${date}/${service}/tc3_request`;
  
  // 第二步：构造规范请求串
  const httpRequestMethod = 'POST';
  const canonicalUri = '/';
  const canonicalQueryString = '';
  const canonicalHeaders = 'content-type:application/json; charset=utf-8\nhost:asr.tencentcloudapi.com\n';
  const signedHeaders = 'content-type;host';
  const hashedRequestPayload = crypto.createHash('sha256').update(payload).digest('hex');
  const canonicalRequest = `${httpRequestMethod}
${canonicalUri}
${canonicalQueryString}
${canonicalHeaders}
${signedHeaders}
${hashedRequestPayload}`;
  
  // 第三步：构造待签名字符串
  const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;
  
  // 第四步：计算签名
  const kDate = crypto.createHmac('sha256', `TC3${secretKey}`).update(date).digest();
  const kService = crypto.createHmac('sha256', kDate).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('tc3_request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  
  return signature;
}

// 生成请求头
function generateHeaders(action: string, payload: string): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000);
  // 修复日期格式：腾讯云要求的格式是 YYYY-MM-DD
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  
  // 生成签名
  const signature = generateSignature(SECRET_KEY, date, 'asr', payload);
  const authorization = `TC3-HMAC-SHA256 Credential=${SECRET_ID}/${date}/asr/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`;
  
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Authorization': authorization,
    'X-TC-Action': action,
    'X-TC-Version': '2019-06-14',
    'X-TC-Timestamp': timestamp.toString(),
    'X-TC-Region': 'ap-beijing'
  };
}

// 调用腾讯云语音识别API
export async function recognizeSpeech(base64Audio: string, audioLength: number): Promise<string> {
  try {
    // 构造请求参数
    const payloadObj = {
      ProjectId: 0,
      SubServiceType: 2,
      EngSerViceType: '16k',
      SourceType: 1,
      VoiceFormat: 4,
      UsrAudioKey: 'session-' + Date.now(),
      Data: base64Audio,
      DataLen: audioLength
    };
    
    const payload = JSON.stringify(payloadObj);
    
    // 生成请求头
    const headers = generateHeaders('SentenceRecognition', payload);
    
    // 发送请求到腾讯云语音识别API
    const response = await axios.post('https://asr.tencentcloudapi.com', payloadObj, { headers });
    
    // 解析识别结果
    if (response.data.Response && response.data.Response.Result) {
      return response.data.Response.Result;
    } else {
      throw new Error('语音识别失败: ' + (response.data.Response?.Error?.Message || '未知错误'));
    }
  } catch (error) {
    console.error('语音识别错误:', error);
    throw new Error('语音识别失败: ' + (error instanceof Error ? error.message : '未知错误'));
  }
}