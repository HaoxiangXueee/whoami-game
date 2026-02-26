/**
 * API 相关类型定义
 */

import type { GameStats } from './game';

// LLM 提供商类型
export type LLMProvider = 'anthropic' | 'openai' | 'google' | 'custom';

// LLM 配置
export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}

// LLM 请求参数
export interface LLMRequestParams {
  systemPrompt: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
}

// LLM 响应
export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

// 游戏LLM响应（JSON结构）
export interface GameLLMResponse {
  dm_narration: string; // 旁白描述
  npc_dialogue: string; // NPC台词
  authority_delta: number; // 威势变化
  suspicion_delta: number; // 暴露度变化
  judgement_log: string; // DM评价理由
  is_game_over: boolean; // 是否结束
  ending_type: string | null; // 结局类型
  ending_title: string | null; // 结局标题
  ending_summary: string | null; // 结局总结
}

// API 错误
export interface APIError {
  code: string;
  message: string;
  details?: unknown;
}

// 请求状态
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

// API Hook 返回类型
export interface UseAPIReturn<T> {
  data: T | null;
  status: RequestStatus;
  error: APIError | null;
  execute: (...args: unknown[]) => Promise<T | void>;
  reset: () => void;
}
