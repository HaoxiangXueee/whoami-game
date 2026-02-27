/**
 * LLM Hook
 * 用于在组件中调用LLM服务
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getLLMService, resetLLMService } from '@services/llm/LLMService';
import { generateSystemPrompt } from '@config/prompts/systemPrompt';
import type {
  GameLLMResponse,
  GameContext,
} from '@services/llm/types';
import type { ScenarioConfig, ChatMessage } from '@types/game';

interface UseLLMOptions {
  scenario: ScenarioConfig | null;
  chatHistory: ChatMessage[];
  currentTurn: number;
  maxTurns: number;
}

interface UseLLMReturn {
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<GameLLMResponse | null>;
  initialize: (apiKey: string) => boolean;
  isInitialized: boolean;
}

export function useLLM(options: UseLLMOptions): UseLLMReturn {
  const { scenario, chatHistory, currentTurn, maxTurns } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const llmServiceRef = useRef(getLLMService());

  // 初始化LLM服务
  const initialize = useCallback((apiKey: string): boolean => {
    try {
      const service = llmServiceRef.current;
      const success = service.initialize({
        provider: 'kimi',
        apiKey,
        baseUrl: 'https://api.moonshot.cn',
        model: 'moonshot-v1-8k',
        defaultConfig: {
          temperature: 0.7,
          maxTokens: 1500,
          topP: 0.9,
        },
      });

      if (success) {
        setIsInitialized(true);
        setError(null);
        console.log('[LLM] Kimi服务初始化成功');
      } else {
        setError('LLM服务初始化失败');
        console.error('[LLM] Kimi服务初始化失败');
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(`LLM初始化错误: ${errorMessage}`);
      console.error('[LLM] 初始化错误:', err);
      return false;
    }
  }, []);

  // 发送消息
  const sendMessage = useCallback(
    async (content: string): Promise<GameLLMResponse | null> => {
      if (!scenario) {
        setError('没有可用的剧本');
        return null;
      }

      if (!isInitialized) {
        setError('LLM服务未初始化');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const service = llmServiceRef.current;
        // 确保参数有默认值，避免 undefined
        const safeCurrentTurn = currentTurn ?? 1;
        const safeMaxTurns = maxTurns ?? 10;
        const systemPrompt = generateSystemPrompt(
          scenario.background || '',
          safeCurrentTurn,
          safeMaxTurns,
          0, // authority 会在后续更新
          0  // suspicion 会在后续更新
        );

        const gameContext: GameContext = {
          scenario,
          currentTurn,
          maxTurns,
          stats: { authority: 0, suspicion: 0 }, // 会在实际调用时更新
          chatHistory,
        };

        console.log('[LLM] 发送请求:', { content, systemPromptLength: systemPrompt.length });

        const response = await service.sendGameMessage(
          content,
          gameContext,
          systemPrompt
        );

        console.log('[LLM] 收到响应:', response);

        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '未知错误';
        setError(`请求失败: ${errorMessage}`);
        console.error('[LLM] 请求错误:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [scenario, chatHistory, currentTurn, maxTurns, isInitialized]
  );

  // 清理
  useEffect(() => {
    return () => {
      // 可选：清理资源
    };
  }, []);

  return {
    isLoading,
    error,
    sendMessage,
    initialize,
    isInitialized,
  };
}
