/**
 * 游戏核心类型定义
 * v2.0: 统一类型系统，ScenarioConfig 从 scenario.ts 重新导出
 */

import type { ScenarioConfig as ScenarioConfigFromScenario } from './scenario';

/**
 * 剧本配置
 * 从 scenario.ts 重新导出，确保整个应用使用一致的类型定义
 */
export type ScenarioConfig = ScenarioConfigFromScenario;

/**
 * 游戏状态
 */
export type GameStatus = 'start_menu' | 'playing' | 'game_over' | 'paused';

/**
 * 游戏数值
 */
export interface GameStats {
  /** 权威值 (0-100) */
  authority: number;
  /** 暴露度 (0-100) */
  suspicion: number;
}

/**
 * 皇帝信息
 * v2.0: 为了兼容性，保留此简化版本
 */
export interface EmperorInfo {
  /** 皇帝姓名 */
  name: string;
  /** 皇帝称号 */
  title: string;
  /** 所属朝代 */
  dynasty: string;
  /** 完整身份描述 */
  realIdentity: string;
}

/**
 * NPC信息
 * v2.0: 为了兼容性，保留此简化版本
 */
export interface NPCInfo {
  /** NPC ID */
  id: string;
  /** NPC姓名 */
  name: string;
  /** NPC职位 */
  title: string;
  /** 性格描述 */
  personality: string;
  /** 对玩家态度 */
  attitude: 'loyal' | 'neutral' | 'hostile';
  /** 开场白 */
  introduction: string;
}

/**
 * 胜利/失败条件
 */
export interface WinLoseConditions {
  winConditions: string[];
  loseConditions: string[];
}

/**
 * 线索
 */
export interface Clue {
  id: string;
  description: string;
  relatedNPC?: string;
}

/**
 * 聊天消息类型
 */
export type MessageType = 'dialogue' | 'narration' | 'system' | 'event' | 'thought';

/**
 * 聊天消息
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  type: MessageType;
  npcId?: string;
  npcName?: string;
}

/**
 * 结局类型
 */
export type EndingType =
  | 'win_correct_answer'
  | 'neutral_escape'
  | 'lose_wrong_answer'
  | 'lose_exposed'
  | 'lose_overthrown'
  | 'special_hidden';

/**
 * 结局信息
 */
export interface EndingInfo {
  type: EndingType;
  title: string;
  summary: string;
  epilogue?: string;
}

/**
 * 答案验证结果
 */
export interface AnswerValidationResult {
  isCorrect: boolean;
  feedback: string;
  similarity: number;
}

/**
 * 答案状态
 */
export interface AnswerState {
  emperorGuess: string;
  dynastyGuess: string;
  emperorCorrect: boolean | null;
  dynastyCorrect: boolean | null;
  emperorAttempts: number;
  dynastyAttempts: number;
  isSubmitting: boolean;
}

/**
 * LLM响应
 */
export interface LLMResponse {
  npc_dialogue: string;
  authority_delta: number;
  suspicion_delta: number;
  dm_narration?: string;
  is_game_over?: boolean;
  ending_type?: EndingType;
  ending_title?: string;
  ending_summary?: string;
}

/**
 * 游戏状态存储
 */
export interface GameState {
  // 状态
  status: GameStatus;
  currentScenario: ScenarioConfig | null;
  chatHistory: ChatMessage[];
  isLoading: boolean;
  currentTurn: number;
  maxTurns: number;

  // 游戏数值
  stats: GameStats;

  // 结局
  ending: EndingInfo | null;

  // 答题状态
  answerState: AnswerState;
  isAnsweringQuestions: boolean;

  // 操作方法
  resetGame: () => void;
  setScenario: (scenario: ScenarioConfig) => void;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  updateStats: (changes: Partial<GameStats>) => void;
  nextTurn: () => void;
  setEnding: (ending: EndingInfo | null) => void;
  submitAnswer: (type: 'emperor' | 'dynasty', answer: string) => void;
  setAnsweringQuestions: (isAnswering: boolean) => void;
  setAnswerCorrect: (type: 'emperor' | 'dynasty', isCorrect: boolean) => void;
  incrementAnswerAttempt: (type: 'emperor' | 'dynasty') => void;
}
