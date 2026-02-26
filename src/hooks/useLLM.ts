/**
 * LLM交互Hook
 * 封装与LLM服务的交互逻辑
 */

import { useCallback, useRef, useState } from 'react';
import { getLLMService, generateSystemPrompt, type GameLLMResponse } from '@services/llm';
import { useGameStore } from '@stores/gameStore';

interface UseLLMOptions {
  onSuccess?: (response: GameLLMResponse) => void;
  onError?: (error: Error) => void;
}

interface UseLLMReturn {
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  abort: () => void;
}

export function useLLM(options: UseLLMOptions = {}): UseLLMReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const { currentScenario, stats, currentTurn, maxTurns, chatHistory } = useGameStore();

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!currentScenario) {
      setError('没有选中的剧本');
      return;
    }

    const llmService = getLLMService();
    if (!llmService.isInitialized()) {
      setError('LLM服务未初始化');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 生成系统提示词
      const systemPrompt = generateSystemPrompt(
        currentScenario.background,
        currentTurn,
        maxTurns,
        stats.authority,
        stats.suspicion
      );

      // 构建游戏上下文
      const gameContext = {
        scenario: currentScenario,
        currentTurn,
        maxTurns,
        stats,
        chatHistory: chatHistory.slice(-10), // 最近10条消息
      };

      // 发送请求到LLM
      const response = await llmService.sendGameMessage(
        content,
        gameContext,
        systemPrompt
      );

      // 处理成功响应
      options.onSuccess?.(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      options.onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [currentScenario, stats, currentTurn, maxTurns, chatHistory, options]);

  return {
    sendMessage,
    isLoading,
    error,
    abort,
  };
}
