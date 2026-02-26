/**
 * 全局常量配置
 */

// 游戏数值范围
export const GAME_CONSTANTS = {
  // 威势值范围
  AUTHORITY: {
    MIN: 0,
    MAX: 100,
    INITIAL_EASY: 60,
    INITIAL_MEDIUM: 40,
    INITIAL_HARD: 30,
  },

  // 暴露度范围
  SUSPICION: {
    MIN: 0,
    MAX: 100,
    INITIAL: 0,
    WARNING_THRESHOLD: 70,  // 警告阈值
    DANGER_THRESHOLD: 90,   // 危险阈值
  },

  // 回合数
  TURNS: {
    EASY: 12,
    MEDIUM: 10,
    HARD: 8,
  },
} as const;

// 数值变化范围
export const STAT_CHANGES = {
  // 暴露度变化
  SUSPICION: {
    MODERN_WORDS: { min: 30, max: 50 },      // 现代词汇
    VAGUE_RESPONSE: { min: 10, max: 15 },    // 敷衍应对
    PROPER_SPEECH: { min: -10, max: -5 },    // 古雅得体
    IGNORANT_QUESTION: { min: 20, max: 25 }, // 无知问题
  },

  // 威势值变化
  AUTHORITY: {
    COWARDLY: { min: -25, max: -15 },        // 懦弱退缩
    HESITANT: { min: -10, max: -5 },         // 犹豫不决
    DECISIVE: { min: 20, max: 30 },          // 果断决策
    HISTORICAL_HERO: { min: 35, max: 45 },   // 召唤历史英雄
    WRONG_HERO: { min: -15, max: -10 },      // 召唤错误英雄
    SHOW_KNOWLEDGE: { min: 10, max: 20 },    // 展现历史知识
  },
} as const;

// 结局类型
export const ENDING_TYPES = {
  // 胜利结局
  WIN_PARALLEL: 'win_parallel',       // 瞒天过海：在位善终
  WIN_ESCAPE: 'win_escape',          // 金蝉脱壳：成功逃离
  WIN_SURRENDER: 'win_surrender',      // 保全百姓：投降但保全百姓

  // 失败结局
  LOSE_COUP: 'lose_coup',              // 政变夺权：被政变推翻
  LOSE_IMPOSTER: 'lose_imposter',      // 身份败露：被识破身份
  LOSE_TIMEOUT: 'lose_timeout',        // 超时结束：回合耗尽
} as const;

// 游戏状态
export const GAME_STATUS = {
  START_MENU: 'start_menu',
  SCENARIO_SELECT: 'scenario_select',
  INTRO: 'intro',
  PLAYING: 'playing',
  PROCESSING: 'processing',
  GAME_OVER: 'game_over',
  ENDING: 'ending',
} as const;

// 消息角色
export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  NARRATOR: 'narrator',
} as const;

// 难度级别
export const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

// 本地存储键名
export const STORAGE_KEYS = {
  GAME_STATE: 'whoami_game_state',
  SETTINGS: 'whoami_settings',
  ACHIEVEMENTS: 'whoami_achievements',
  STATISTICS: 'whoami_statistics',
  UNLOCKED_SCENARIOS: 'whoami_unlocked',
} as const;
