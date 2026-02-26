/**
 * 游戏核心逻辑工具函数
 */

import { ENDING_TYPES, GAME_CONSTANTS } from '@config/constants';
import type { GameStats, GameEnding, EndingType } from '@types/game';

/**
 * 检查游戏是否结束
 */
export function checkGameOver(
  stats: GameStats,
  currentTurn: number,
  maxTurns: number
): { isGameOver: boolean; endingType?: EndingType } {
  // 检查威势值
  if (stats.authority <= GAME_CONSTANTS.AUTHORITY.MIN) {
    return { isGameOver: true, endingType: ENDING_TYPES.LOSE_COUP };
  }

  // 检查暴露度
  if (stats.suspicion >= GAME_CONSTANTS.SUSPICION.MAX) {
    return { isGameOver: true, endingType: ENDING_TYPES.LOSE_IMPOSTER };
  }

  // 检查回合数
  if (currentTurn >= maxTurns) {
    // 根据最终状态判断结局
    if (stats.authority >= 80 && stats.suspicion <= 20) {
      return { isGameOver: true, endingType: ENDING_TYPES.WIN_PARALLEL };
    }
    return { isGameOver: true, endingType: ENDING_TYPES.LOSE_TIMEOUT };
  }

  return { isGameOver: false };
}

/**
 * 生成游戏结局
 */
export function generateEnding(
  endingType: EndingType,
  stats: GameStats,
  turnsUsed: number
): GameEnding {
  const endings: Record<EndingType, { title: string; summary: string; epilogue?: string }> = {
    win_parallel: {
      title: '瞒天过海',
      summary: '你成功稳住了朝局，扭转了历史走向。群臣慑服，四海升平。',
      epilogue: '史书记载：「帝临朝而威，群臣慑服，遂成大治。」后世称颂你的智慧与胆识。',
    },
    win_escape: {
      title: '金蝉脱壳',
      summary: '你放弃皇位但保全性命，隐居山林，过上了逍遥自在的生活。',
      epilogue: '史书记载：「帝弃位而去，不知所终，或曰隐于终南。」有樵夫声称曾在深山见过一位仙风道骨的老者...',
    },
    win_surrender: {
      title: '保全百姓',
      summary: '开城投降但保全了百姓性命，以一人之辱换万民之安。',
      epilogue: '史书记载：「帝开城请降，以身殉国，百姓得全。」百姓感念你的仁德，立碑纪念。',
    },
    lose_coup: {
      title: '政变夺权',
      summary: '权臣发动政变，废黜了你的帝位，你被软禁于冷宫。',
      epilogue: '史书记载：「权臣柄政，帝被幽禁，天下大乱。」你的余生在监视中度过，郁郁而终。',
    },
    lose_imposter: {
      title: '身份败露',
      summary: '你被识破不是真正的皇帝，遭囚禁处决，为天下笑。',
      epilogue: '史书记载：「假帝事败，伏诛于市，天下哗然。」你的名字成为后世的笑柄。',
    },
    lose_timeout: {
      title: '大势已去',
      summary: '回合耗尽，大势已去，你未能改变命运。',
      epilogue: '史书记载：「帝昏庸无能，国破家亡。」你的不作为导致了王朝的覆灭。',
    },
  };

  const ending = endings[endingType];

  return {
    type: endingType,
    title: ending.title,
    summary: ending.summary,
    epilogue: ending.epilogue,
  };
}

/**
 * 计算威势值变化
 */
export function calculateAuthorityChange(
  baseChange: number,
  currentAuthority: number
): number {
  // 确保在有效范围内
  const newValue = currentAuthority + baseChange;
  return Math.max(
    GAME_CONSTANTS.AUTHORITY.MIN,
    Math.min(GAME_CONSTANTS.AUTHORITY.MAX, newValue)
  );
}

/**
 * 计算暴露度变化
 */
export function calculateSuspicionChange(
  baseChange: number,
  currentSuspicion: number
): number {
  // 确保在有效范围内
  const newValue = currentSuspicion + baseChange;
  return Math.max(
    GAME_CONSTANTS.SUSPICION.MIN,
    Math.min(GAME_CONSTANTS.SUSPICION.MAX, newValue)
  );
}

/**
 * 获取难度配置
 */
export function getDifficultyConfig(difficulty: 'easy' | 'medium' | 'hard') {
  const configs = {
    easy: {
      initialAuthority: GAME_CONSTANTS.AUTHORITY.INITIAL_EASY,
      maxTurns: GAME_CONSTANTS.TURNS.EASY,
    },
    medium: {
      initialAuthority: GAME_CONSTANTS.AUTHORITY.INITIAL_MEDIUM,
      maxTurns: GAME_CONSTANTS.TURNS.MEDIUM,
    },
    hard: {
      initialAuthority: GAME_CONSTANTS.AUTHORITY.INITIAL_HARD,
      maxTurns: GAME_CONSTANTS.TURNS.HARD,
    },
  };

  return configs[difficulty];
}
