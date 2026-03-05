/**
 * LLM服务类型定义
 */

import type { GameStats, ScenarioConfig, ChatMessage, EndingType } from '@/types/game';
export type { EndingType } from '@/types/game';

// LLM提供商类型
export type LLMProviderType = 'anthropic' | 'openai' | 'gemini' | 'volcano' | 'zhipu' | 'kimi';

// LLM请求配置
export interface LLMRequestConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

// LLM消息格式
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// LLM请求参数
export interface LLMRequest {
  messages: LLMMessage[];
  config?: LLMRequestConfig;
  systemPrompt?: string;
}

// LLM响应
export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
}

// 游戏LLM响应结构 (JSON格式)
export interface GameLLMResponse {
  dm_narration: string;        // 旁白描述
  npc_dialogue: string;       // NPC台词
  authority_delta: number;     // 威势变化
  suspicion_delta: number;     // 暴露度变化
  judgement_log: string;      // DM评价理由
  is_game_over: boolean;      // 是否结束
  ending_type: EndingType | null; // 结局类型
  ending_title: string | null; // 结局标题
  ending_summary: string | null; // 结局总结
}

// EndingType is now re-exported from '@/types/game'

// 游戏上下文
export interface GameContext {
  scenario: ScenarioConfig;
  currentTurn: number;
  maxTurns: number;
  stats: GameStats;
  chatHistory: ChatMessage[];
}

// LLM提供者接口
export interface ILLMProvider {
  readonly name: string;
  readonly type: LLMProviderType;
  sendMessage(request: LLMRequest): Promise<LLMResponse>;
  streamMessage?(request: LLMRequest, onChunk: (chunk: string) => void): Promise<void>;
  validateConfig(): boolean;
}

// LLM服务配置
export interface LLMServiceConfig {
  provider: LLMProviderType;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  useProxy?: boolean;
  proxyUrl?: string;
  defaultConfig?: LLMRequestConfig;
}

// 错误类型
export class LLMError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

// 重试配置
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};
