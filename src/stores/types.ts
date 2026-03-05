/**
 * Store 类型定义
 */

import type {
  ChatMessage,
  GameEnding,
  GameStats,
  ScenarioConfig,
} from '@/types/game';

// ============================================
// Game Store
// ============================================

export interface GameStoreState {
  // 游戏状态
  status: 'start_menu' | 'scenario_select' | 'playing' | 'loading' | 'game_over';
  currentScenario: ScenarioConfig | null;
  stats: GameStats;
  chatHistory: ChatMessage[];
  currentTurn: number;
  maxTurns: number;
  ending: GameEnding | null;

  // 加载状态
  isLoading: boolean;
  error: string | null;
}

export interface GameStoreActions {
  // 游戏生命周期
  startGame: (scenarioId: string) => void;
  setScenario: (scenario: ScenarioConfig) => void;
  resetGame: () => void;

  // 对话相关
  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  clearHistory: () => void;

  // 数值更新
  updateStats: (delta: Partial<GameStats>) => void;
  setStats: (stats: GameStats) => void;

  // 回合管理
  nextTurn: () => void;
  setMaxTurns: (turns: number) => void;

  // 结局
  setEnding: (ending: GameEnding) => void;

  // 加载状态
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export type GameStore = GameStoreState & GameStoreActions;
