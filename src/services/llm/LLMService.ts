/**
 * LLM服务主类
 * 负责管理LLM提供商和处理游戏对话请求
 */

import { AnthropicProvider, KimiProvider } from './providers';
import type {
  ILLMProvider,
  LLMRequest,
  LLMResponse,
  LLMServiceConfig,
  GameLLMResponse,
  GameContext,
  RetryConfig,
} from './types';
import { DEFAULT_RETRY_CONFIG } from './types';

export class LLMService {
  private provider: ILLMProvider | null = null;
  private config: LLMServiceConfig | null = null;

  // 重试配置
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

  // 初始化服务
  initialize(config: LLMServiceConfig): boolean {
    this.config = config;

    try {
      switch (config.provider) {
        case 'anthropic':
          this.provider = new AnthropicProvider(config.apiKey, {
            baseUrl: config.baseUrl,
            model: config.model,
            defaultConfig: config.defaultConfig,
          });
          break;
        case 'kimi':
          this.provider = new KimiProvider(config.apiKey, {
            baseUrl: config.baseUrl ?? 'https://api.moonshot.cn',
            model: config.model ?? 'moonshot-v1-8k',
            defaultConfig: config.defaultConfig,
          });
          break;
        default:
          console.error(`Unsupported LLM provider: ${config.provider}`);
          return false;
      }

      if (!this.provider.validateConfig()) {
        console.error('LLM provider configuration is invalid');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize LLM service:', error);
      return false;
    }
  }

  // 检查服务是否已初始化
  isInitialized(): boolean {
    return this.provider !== null;
  }

  // 发送通用消息
  async sendMessage(request: LLMRequest): Promise<LLMResponse> {
    if (!this.provider) {
      throw new Error('LLM service not initialized');
    }

    return this.withRetry(() => this.provider!.sendMessage(request));
  }

  // 发送流式消息
  async streamMessage(
    request: LLMRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    if (!this.provider) {
      throw new Error('LLM service not initialized');
    }

    if (!this.provider.streamMessage) {
      throw new Error('Current provider does not support streaming');
    }

    return this.withRetry(() =>
      this.provider!.streamMessage!(request, onChunk)
    );
  }

  // 发送游戏对话请求
  async sendGameMessage(
    userInput: string,
    gameContext: GameContext,
    systemPrompt: string
  ): Promise<GameLLMResponse> {
    const messages = this.buildGameMessages(userInput, gameContext);

    const request: LLMRequest = {
      messages,
      systemPrompt,
      config: {
        temperature: 0.7,
        maxTokens: 1500,
        topP: 0.9,
      },
    };

    const response = await this.sendMessage(request);
    return this.parseGameResponse(response.content);
  }

  // 构建游戏消息上下文
  private buildGameMessages(
    userInput: string,
    context: GameContext
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // 添加上下文消息（最近的对话历史）
    const recentHistory = context.chatHistory.slice(-10); // 保留最近10条
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // 添加当前用户输入
    messages.push({
      role: 'user',
      content: userInput,
    });

    return messages;
  }

  // 解析游戏响应
  private parseGameResponse(content: string): GameLLMResponse {
    try {
      // 尝试直接解析JSON
      const parsed = JSON.parse(content);
      return this.validateGameResponse(parsed);
    } catch (e) {
      // 如果直接解析失败，尝试提取JSON块
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return this.validateGameResponse(parsed);
        } catch (e2) {
          // JSON解析失败，返回默认响应
          return this.createDefaultResponse(content);
        }
      }
      // 完全无法解析，返回默认响应
      return this.createDefaultResponse(content);
    }
  }

  // 验证游戏响应结构
  private validateGameResponse(parsed: unknown): GameLLMResponse {
    const response = parsed as Partial<GameLLMResponse>;

    return {
      dm_narration: response.dm_narration ?? '',
      npc_dialogue: response.npc_dialogue ?? '',
      authority_delta: response.authority_delta ?? 0,
      suspicion_delta: response.suspicion_delta ?? 0,
      judgement_log: response.judgement_log ?? '',
      is_game_over: response.is_game_over ?? false,
      ending_type: response.ending_type ?? null,
      ending_title: response.ending_title ?? null,
      ending_summary: response.ending_summary ?? null,
    };
  }

  // 创建默认响应（当JSON解析失败时）
  private createDefaultResponse(rawContent: string): GameLLMResponse {
    return {
      dm_narration: '殿内一片寂静，似乎无人应答...',
      npc_dialogue: rawContent.slice(0, 200), // 截取原始内容
      authority_delta: 0,
      suspicion_delta: 0,
      judgement_log: '响应格式异常，使用默认处理',
      is_game_over: false,
      ending_type: null,
      ending_title: null,
      ending_summary: null,
    };
  }

  // 带重试的请求
  private async withRetry<T>(
    operation: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customConfig };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 如果是最后一次尝试，抛出错误
        if (attempt === config.maxRetries) {
          break;
        }

        // 计算延迟时间（指数退避）
        const delay = Math.min(
          config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );

        console.warn(
          `LLM request failed (attempt ${attempt + 1}/${config.maxRetries + 1}), retrying in ${delay}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error(
      `LLM request failed after ${config.maxRetries + 1} attempts: ${lastError?.message}`
    );
  }

  // 更新重试配置
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  // 获取当前重试配置
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  // 验证答案正确性
  async validateAnswer(
    answer: string,
    correctAnswer: string,
    questionType: 'emperor' | 'dynasty'
  ): Promise<{ isCorrect: boolean; feedback: string; similarity: number }> {
    // 简单的字符串匹配（可以改进为调用LLM进行更智能的匹配）
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();

    // 完全匹配或包含关系
    const isCorrect =
      normalizedAnswer === normalizedCorrect ||
      normalizedCorrect.includes(normalizedAnswer) ||
      normalizedAnswer.includes(normalizedCorrect);

    const typeName = questionType === 'emperor' ? '皇帝' : '朝代';

    return {
      isCorrect,
      feedback: isCorrect
        ? `回答正确！${typeName}确实是"${correctAnswer}"。`
        : `回答错误。正确答案是"${correctAnswer}"。`,
      similarity: isCorrect ? 1 : 0,
    };
  }
}

// 单例实例
let llmServiceInstance: LLMService | null = null;

export function getLLMService(): LLMService {
  if (!llmServiceInstance) {
    llmServiceInstance = new LLMService();
  }
  return llmServiceInstance;
}

export function resetLLMService(): void {
  llmServiceInstance = null;
}
