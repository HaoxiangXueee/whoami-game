/**
 * 剧本系统类型定义
 * 支持JSON动态加载的剧本配置
 */

import type { EndingType } from './game';

/**
 * 剧本NPC配置
 */
export interface ScenarioNPC {
  id: string;
  name: string;
  title: string;
  description: string;
  personality: string;
  attitude: 'loyal' | 'neutral' | 'hostile';
  introduction: string;
}

/**
 * 皇帝信息
 */
export interface EmperorInfo {
  name: string;
  title: string;
  dynasty: string;
  realIdentity: string;
  /**
   * 历史事件描述（用于第二题问答）
   * 例如："崇祯煤山自缢"、"李自成攻破北京"等
   */
  historicalEvent?: string;
}

/**
 * 场景设定
 */
export interface SceneSetting {
  time: string;
  location: string;
  atmosphere: string;
  weather?: string;
}

/**
 * 初始数值
 */
export interface InitialStats {
  authority: number;
  suspicion: number;
}

/**
 * 胜利/失败条件
 */
export interface WinLoseConditions {
  winConditions: string[];
  loseConditions: string[];
}

/**
 * 剧本配置 - JSON可序列化格式
 */
export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';

  // 皇帝信息
  emperor: EmperorInfo;

  // 场景设定
  setting: SceneSetting;

  // 初始数值
  initialStats: InitialStats;

  // 游戏参数
  maxTurns: number;

  // NPC配置
  npcs: ScenarioNPC[];

  // 背景故事（给LLM看的完整背景）
  background: string;

  // 给玩家看的开场白
  playerIntro: string;

  // 胜利/失败条件
  winLoseConditions: WinLoseConditions;

  // 元数据
  metadata: {
    author: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
  };
}

/**
 * 剧本索引项（用于列表加载）
 */
export interface ScenarioIndexItem {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

/**
 * 剧本索引
 */
export interface ScenarioIndex {
  version: string;
  lastUpdated: string;
  scenarios: ScenarioIndexItem[];
}

/**
 * 结局定义
 */
export interface EndingDefinition {
  type: EndingType;
  title: string;
  description: string;
  unlockCondition: string;
}

/**
 * 剧本验证结果
 */
export interface ScenarioValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
