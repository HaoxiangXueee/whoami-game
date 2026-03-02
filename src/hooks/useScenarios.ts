/**
 * 剧本管理 Hook
 * 管理剧本加载、缓存和已玩过剧本的记录
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { scenarioLoader } from '@services/ScenarioLoader';
import type { ScenarioConfig, ScenarioIndex, ScenarioIndexItem } from '../types/scenario';

const PLAYED_SCENARIOS_KEY = 'whoami_played_scenarios';
const MAX_RETRIES = 3;

interface UseScenariosOptions {
  enablePreload?: boolean;
  preloadCount?: number;
}

interface UseScenariosReturn {
  // 状态
  index: ScenarioIndex | null;
  availableScenarios: ScenarioIndexItem[];
  playedScenarioIds: string[];
  currentScenario: ScenarioConfig | null;
  isLoading: boolean;
  isLoadingIndex: boolean;
  error: string | null;
  consecutiveFailures: number;

  // 操作方法
  loadIndex: () => Promise<void>;
  getRandomScenario: () => Promise<ScenarioConfig | null>;
  loadScenario: (id: string) => Promise<ScenarioConfig | null>;
  markAsPlayed: (id: string) => void;
  resetPlayedList: () => void;
  clearError: () => void;
  clearCache: () => void;
}

export function useScenarios(options: UseScenariosOptions = {}): UseScenariosReturn {
  const { enablePreload = true, preloadCount = 3 } = options;

  // 状态
  const [index, setIndex] = useState<ScenarioIndex | null>(null);
  const [playedScenarioIds, setPlayedScenarioIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(PLAYED_SCENARIOS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentScenario, setCurrentScenario] = useState<ScenarioConfig | null>(null);
  const [isLoadingIndex, setIsLoadingIndex] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  // 用于追踪已预加载的剧本
  const preloadedIds = useRef<Set<string>>(new Set());

  // 计算可用剧本列表（排除已玩过的）
  const availableScenarios = index?.scenarios.filter(
    s => !playedScenarioIds.includes(s.id)
  ) ?? [];

  // 保存已玩列表到 localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PLAYED_SCENARIOS_KEY, JSON.stringify(playedScenarioIds));
    } catch (e) {
      console.warn('[useScenarios] 保存已玩列表失败:', e);
    }
  }, [playedScenarioIds]);

  // 加载剧本索引
  const loadIndex = useCallback(async () => {
    if (isLoadingIndex) return;

    setIsLoadingIndex(true);
    setError(null);

    try {
      const loadedIndex = await scenarioLoader.loadIndex();
      setIndex(loadedIndex);
      setConsecutiveFailures(0);
      console.log('[useScenarios] 索引加载完成:', loadedIndex.scenarios.length, '个剧本');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载索引失败';
      console.error('[useScenarios] 加载索引失败:', err);
      setError(errorMessage);
      setConsecutiveFailures(prev => prev + 1);
    } finally {
      setIsLoadingIndex(false);
    }
  }, [isLoadingIndex]);

  // 加载单个剧本
  const loadScenario = useCallback(async (id: string): Promise<ScenarioConfig | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const scenario = await scenarioLoader.loadScenario(id);
      setCurrentScenario(scenario);
      console.log('[useScenarios] 剧本加载完成:', scenario.name);
      return scenario;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载剧本失败';
      console.error('[useScenarios] 加载剧本失败:', err);
      setError(errorMessage);
      setConsecutiveFailures(prev => prev + 1);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取随机剧本（确保不重复）
  const getRandomScenario = useCallback(async (): Promise<ScenarioConfig | null> => {
    // 如果索引未加载，先加载索引
    if (!index) {
      await loadIndex();
      return null;
    }

    // 如果没有可用剧本（全部玩过），重置列表
    if (availableScenarios.length === 0) {
      console.log('[useScenarios] 所有剧本都已玩过，重置列表');
      setPlayedScenarioIds([]);
      return null;
    }

    // 随机选择一个可用剧本
    const randomIndex = Math.floor(Math.random() * availableScenarios.length);
    const selected = availableScenarios[randomIndex];

    // 加载剧本
    const scenario = await loadScenario(selected.id);

    // 预加载其他剧本（如果启用）
    if (enablePreload && scenario) {
      const otherIds = availableScenarios
        .filter(s => s.id !== selected.id)
        .slice(0, preloadCount)
        .map(s => s.id);

      if (otherIds.length > 0) {
        scenarioLoader.preloadScenarios(otherIds);
      }
    }

    return scenario;
  }, [index, availableScenarios, loadIndex, loadScenario, enablePreload, preloadCount]);

  // 标记剧本为已玩过
  const markAsPlayed = useCallback((id: string) => {
    setPlayedScenarioIds(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  // 重置已玩列表
  const resetPlayedList = useCallback(() => {
    setPlayedScenarioIds([]);
    preloadedIds.current.clear();
    console.log('[useScenarios] 已玩列表已重置');
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
    setConsecutiveFailures(0);
  }, []);

  // 清除缓存
  const clearCache = useCallback(() => {
    scenarioLoader.clearCache();
    preloadedIds.current.clear();
    console.log('[useScenarios] 缓存已清除');
  }, []);

  return {
    // 状态
    index,
    availableScenarios,
    playedScenarioIds,
    currentScenario,
    isLoading,
    isLoadingIndex,
    error,
    consecutiveFailures,

    // 操作方法
    loadIndex,
    getRandomScenario,
    loadScenario,
    markAsPlayed,
    resetPlayedList,
    clearError,
    clearCache,
  };
}

export default useScenarios;
