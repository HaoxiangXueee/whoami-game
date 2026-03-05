/**
 * 剧本配置统一导出
 */

import { chongzhenScenario, chongzhenPlayerIntro } from './chongzhen';
import { liushanScenario, liushanPlayerIntro } from './liushan';
import { tangxuanzongScenario, tangxuanzongPlayerIntro } from './tangxuanzong';
import { xuantongScenario, xuantongPlayerIntro } from './xuantong';
import type { ScenarioConfig } from '@/types/game';

// 导出所有剧本
export { chongzhenScenario, chongzhenPlayerIntro } from './chongzhen';
export { liushanScenario, liushanPlayerIntro } from './liushan';
export { tangxuanzongScenario, tangxuanzongPlayerIntro } from './tangxuanzong';
export { xuantongScenario, xuantongPlayerIntro } from './xuantong';

// 剧本列表
export const scenarios: ScenarioConfig[] = [
  chongzhenScenario,
  liushanScenario,
  tangxuanzongScenario,
  xuantongScenario,
];

// 剧本映射表
export const scenarioMap: Record<string, ScenarioConfig> = {
  chongzhen: chongzhenScenario,
  liushan: liushanScenario,
  tangxuanzong: tangxuanzongScenario,
  xuantong: xuantongScenario,
};

// 获取剧本介绍文本
export function getScenarioIntro(scenarioId: string): string {
  switch (scenarioId) {
    case 'chongzhen':
      return chongzhenPlayerIntro;
    case 'liushan':
      return liushanPlayerIntro;
    case 'tangxuanzong':
      return tangxuanzongPlayerIntro;
    case 'xuantong':
      return xuantongPlayerIntro;
    default:
      return '';
  }
}

// 导出类型
export type { ScenarioConfig };
