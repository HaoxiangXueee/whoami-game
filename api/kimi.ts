import type { Request, Response } from '@vercel/node';

interface KimiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface KimiRequest {
  model: string;
  messages: KimiMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export default async function handler(request: Request, response: Response) {
  // 只允许POST请求
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  // 获取API Key
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'API Key not configured' });
  }

  try {
    const body = request.body as KimiRequest;

    // 转发请求到Kimi API
    const kimiResponse = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!kimiResponse.ok) {
      const errorData = await kimiResponse.json().catch(() => ({}));
      return response.status(kimiResponse.status).json({
        error: errorData.error?.message || kimiResponse.statusText
      });
    }

    // 如果是流式请求
    if (body.stream) {
      response.setHeader('Content-Type', 'text/event-stream');
      response.setHeader('Cache-Control', 'no-cache');
      response.setHeader('Connection', 'keep-alive');

      const reader = kimiResponse.body?.getReader();
      if (!reader) {
        return response.status(500).json({ error: 'No response body' });
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        response.write(decoder.decode(value));
      }
      response.end();
    } else {
      // 非流式请求
      const data = await kimiResponse.json();
      response.status(200).json(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
}
