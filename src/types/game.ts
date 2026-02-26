/**
 * 游戏核心类型定义
 */

// 游戏状态
export type GameStatus =
  | 'start_menu'
  | 'scenario_select'
  | 'playing'
  | 'loading'
  | 'game_over';

// 游戏结局类型
export type EndingType =
  | 'win_parallel'     // 瞒天过海：在位善终
  | 'lose_coup'        // 被迫禅让或被推翻
  | 'lose_assassinated'// 被刺杀
  | 'lose_exposed'     // 真实身份被揭发
  | 'lose_suicide'     // 绝望自裁
  | 'neutral_escape';  // 成功逃离宫廷（另一种胜利）

// 游戏数值
export interface GameStats {
  authority: number;   // 威势值 0-100（九鼎）
  suspicion: number; // 暴露度 0-100（龙脉）
}

// 皇帝信息
export interface EmperorInfo {
  name: string;        // 皇帝姓名
  title: string;     // 庙号/称号
  dynasty: string;   // 朝代
  realIdentity?: string; // 真实身份（如果玩家是替身）
}

// 场景设置
export interface ScenarioSetting {
  time: string;      // 时间点
  location: string;  // 场景地点
  atmosphere: string;// 氛围描述
}

// NPC配置
export interface NPCConfig {
  id: string;
  name: string;
  title: string;     // 职位/身份
  description: string;// 人物描述
  avatar?: string;   // 头像路径
  personality: string;// 性格特点
  attitude: 'loyal' | 'neutral' | 'suspicious' | 'hostile'; // 对皇帝态度
}

// 剧本配置
export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  emperor: EmperorInfo;
  setting: ScenarioSetting;
  initialStats: GameStats;
  maxTurns: number;
  npcs: NPCConfig[];
  background: string;  // 给LLM的背景故事
  winConditions: string[];
  loseConditions: string[];
}

// 聊天消息
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  npcId?: string;      // 如果是NPC消息
  npcName?: string;
  timestamp: number;
  type?: 'narration' | 'dialogue' | 'system' | 'judgement';
}

// 游戏结局
export interface GameEnding {
  type: EndingType;
  title: string;
  summary: string;
  epilogue?: string;   // 尾声/后记
}

// 游戏状态
export interface GameState {
  status: GameStatus;
  currentScenario: ScenarioConfig | null;
  stats: GameStats;
  chatHistory: ChatMessage[];
  currentTurn: number;
  maxTurns: number;
  ending: GameEnding | null;
  isLoading: boolean;
  error: string | null;
}

// 游戏动作
export type GameAction =
  | { type: 'START_GAME'; payload: { scenarioId: string } }
  | { type: 'SET_SCENARIO'; payload: ScenarioConfig }
  | { type: 'SEND_MESSAGE'; payload: { content: string } }
  | { type: 'RECEIVE_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_STATS'; payload: Partial<GameStats> }
  | { type: 'NEXT_TURN' }
  | { type: 'SET_ENDING'; payload: GameEnding }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_GAME' };
