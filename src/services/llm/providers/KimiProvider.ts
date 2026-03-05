/**
 * Moonshot Kimi API Provider
 * 支持Kimi大模型API调用
 */

import type {
  ILLMProvider,
  LLMRequest,
  LLMResponse,
  LLMMessage,
  LLMRequestConfig,
  LLMProviderType,
} from '../types';

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

interface KimiUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface KimiChoice {
  index: number;
  message: KimiMessage;
  finish_reason: string;
}

interface KimiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: KimiChoice[];
  usage: KimiUsage;
}

export class KimiProvider implements ILLMProvider {
  readonly name = 'Moonshot Kimi';
  readonly type: LLMProviderType = 'kimi';

  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private defaultConfig: LLMRequestConfig;
  private useProxy: boolean;
  private proxyUrl: string;

  constructor(
    apiKey: string,
    options?: {
      baseUrl?: string;
      model?: string;
      defaultConfig?: LLMRequestConfig;
      useProxy?: boolean;
      proxyUrl?: string;
    }
  ) {
    this.apiKey = apiKey;
    this.baseUrl = options?.baseUrl ?? 'https://api.moonshot.cn';
    this.model = options?.model ?? 'moonshot-v1-8k';
    this.defaultConfig = options?.defaultConfig ?? {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
    };
    this.useProxy = options?.useProxy ?? false;
    this.proxyUrl = options?.proxyUrl ?? '/api/kimi';
  }

  validateConfig(): boolean {
    if (!this.apiKey) {
      console.error('Kimi API key is required');
      return false;
    }
    return true;
  }

  async sendMessage(request: LLMRequest): Promise<LLMResponse> {
    if (!this.validateConfig()) {
      throw new Error('Invalid Kimi configuration');
    }

    const kimiRequest = this.convertToKimiFormat(request);

    try {
      const url = this.useProxy ? this.proxyUrl : `${this.baseUrl}/v1/chat/completions`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (!this.useProxy) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(kimiRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Kimi API error: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const data: KimiResponse = await response.json();
      return this.convertFromKimiFormat(data);
    } catch (error) {
      console.error('Kimi API error:', error);
      throw error;
    }
  }

  async streamMessage(
    request: LLMRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    if (!this.validateConfig()) {
      throw new Error('Invalid Kimi configuration');
    }

    const kimiRequest = this.convertToKimiFormat(request);

    try {
      const url = this.useProxy ? this.proxyUrl : `${this.baseUrl}/v1/chat/completions`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (!this.useProxy) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...kimiRequest,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Kimi API error: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Kimi streaming error:', error);
      throw error;
    }
  }

  private convertToKimiFormat(request: LLMRequest): KimiRequest {
    const config = { ...this.defaultConfig, ...request.config };

    // Convert messages to Kimi format
    const messages: KimiMessage[] = [];

    // Handle system prompt
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }

    // Add other messages
    for (const msg of request.messages) {
      if (msg.role === 'system' && messages.length === 0) {
        // Skip if already added as systemPrompt
        if (msg.content !== request.systemPrompt) {
          messages.push({
            role: 'system',
            content: msg.content,
          });
        }
      } else {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    return {
      model: this.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      top_p: config.topP,
    };
  }

  private convertFromKimiFormat(response: KimiResponse): LLMResponse {
    const choice = response.choices[0];
    return {
      content: choice?.message?.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      model: response.model,
      finishReason: choice?.finish_reason,
    };
  }
}
