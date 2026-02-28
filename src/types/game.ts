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
  | 'win_parallel'      // 完美结局：瞒天过海，在位善终
  | 'win_escape'        // 逃亡结局：成功逃离但失去皇位
  | 'win_surrender'     // 投降结局：保全性命但国破
  | 'lose_coup'         // 政变结局：威势归零被废黜
  | 'lose_imposter'     // 穿帮结局：暴露度满被识破
  | 'lose_assassinated' // 刺杀结局：被暗杀身亡
  | 'lose_timeout'      // 超时结局：回合耗尽未解决
  | 'lose_suicide'      // 自裁结局：绝望自尽
  | 'lose_exposed'      // 暴露结局：真实身份被揭发
  | 'neutral_escape'    // 逃离结局：成功逃离宫廷
  | 'win_correct_answer' // 新增：正确回答问题后胜利
  | 'lose_wrong_answer'; // 新增：回答问题错误后失败

// 游戏数值
export interface GameStats {
  authority: number;   // 威势值 0-100（九鼎）
  suspicion: number; // 暴露度 0-100（龙脉）
}

// 答案状态
export interface AnswerState {
  emperorGuess: string;      // 玩家猜测的皇帝姓名
  dynastyGuess: string;        // 玩家猜测的朝代
  emperorAttempts: number;     // 皇帝问题尝试次数
  dynastyAttempts: number;     // 朝代问题尝试次数
  emperorCorrect: boolean | null;  // 皇帝答案是否正确
  dynastyCorrect: boolean | null;  // 朝代答案是否正确
  isSubmitting: boolean;     // 是否正在提交答案
  lastValidationResult?: AnswerValidationResult; // 最后一次验证结果
}

// 答案验证结果
export interface AnswerValidationResult {
  isCorrect: boolean;
  feedback: string;          // 反馈信息
  similarity: number;        // 相似度 0-1
  suggestions?: string[];    // 建议（如果答错了）
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
  introduction?: string; // v1.1: NPC开场介绍台词
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
  playerIntro?: string; // v1.1: 给玩家的模糊失忆场景描述
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
  answerState: AnswerState;  // 新增：答案状态
  isAnsweringQuestions: boolean;  // 新增：是否正在回答问题阶段
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
