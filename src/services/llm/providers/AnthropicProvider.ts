/**
 * Anthropic Claude API Provider
 */

import type {
  ILLMProvider,
  LLMRequest,
  LLMResponse,
  LLMMessage,
  LLMRequestConfig,
  LLMError,
  LLMProviderType,
} from '../types';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string;
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
}

interface AnthropicContent {
  type: 'text';
  text: string;
}

interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: AnthropicContent[];
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: AnthropicUsage;
}

interface AnthropicStreamChunk {
  type: 'content_block_delta' | 'message_delta';
  delta?: {
    text?: string;
  };
}

export class AnthropicProvider implements ILLMProvider {
  readonly name = 'Anthropic Claude';
  readonly type: LLMProviderType = 'anthropic';

  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private defaultConfig: LLMRequestConfig;

  constructor(
    apiKey: string,
    options?: {
      baseUrl?: string;
      model?: string;
      defaultConfig?: LLMRequestConfig;
    }
  ) {
    this.apiKey = apiKey;
    this.baseUrl = options?.baseUrl ?? 'https://api.anthropic.com';
    this.model = options?.model ?? 'claude-3-sonnet-20240229';
    this.defaultConfig = options?.defaultConfig ?? {
      temperature: 0.7,
      maxTokens: 1024,
      topP: 0.9,
    };
  }

  validateConfig(): boolean {
    if (!this.apiKey) {
      console.error('Anthropic API key is required');
      return false;
    }
    if (!this.apiKey.startsWith('sk-')) {
      console.error('Invalid Anthropic API key format');
      return false;
    }
    return true;
  }

  async sendMessage(request: LLMRequest): Promise<LLMResponse> {
    if (!this.validateConfig()) {
      throw new Error('Invalid Anthropic configuration');
    }

    const anthropicRequest = this.convertToAnthropicFormat(request);

    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(anthropicRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Anthropic API error: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const data: AnthropicResponse = await response.json();
      return this.convertFromAnthropicFormat(data);
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }

  async streamMessage(
    request: LLMRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    if (!this.validateConfig()) {
      throw new Error('Invalid Anthropic configuration');
    }

    const anthropicRequest = this.convertToAnthropicFormat(request);

    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          ...anthropicRequest,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Anthropic API error: ${response.status} - ${errorData.error?.message || response.statusText}`
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
              const parsed: AnthropicStreamChunk = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                onChunk(parsed.delta.text);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Anthropic streaming error:', error);
      throw error;
    }
  }

  private convertToAnthropicFormat(request: LLMRequest): AnthropicRequest {
    const config = { ...this.defaultConfig, ...request.config };

    // Convert messages to Anthropic format
    const messages: AnthropicMessage[] = request.messages.map((msg: LLMMessage) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // If there's a system prompt, extract it
    let systemPrompt: string | undefined;
    if (request.systemPrompt) {
      systemPrompt = request.systemPrompt;
    } else {
      // Check if first message is from system
      const firstMessage = request.messages[0];
      if (firstMessage?.role === 'system') {
        systemPrompt = firstMessage.content;
        messages.shift();
      }
    }

    return {
      model: this.model,
      max_tokens: config.maxTokens || 1024,
      messages,
      system: systemPrompt,
      temperature: config.temperature,
      top_p: config.topP,
      stop_sequences: config.stopSequences,
    };
  }

  private convertFromAnthropicFormat(response: AnthropicResponse): LLMResponse {
    const content = response.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('');

    return {
      content,
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens:
          (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
      model: response.model,
      finishReason: response.stop_reason || undefined,
    };
  }
}
