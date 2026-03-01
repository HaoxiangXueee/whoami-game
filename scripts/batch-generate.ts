/**
 * 批量剧本生成脚本
 * 批量生成前20个皇帝剧本
 *
 * 使用方法:
 *   npx ts-node scripts/batch-generate.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateScenario, updateIndex } from './generate-scenario';

// 前20个皇帝的配置列表
const EMPERORS_TO_GENERATE = [
  {
    id: 'qin_shihuang',
    name: '秦始皇',
    title: '始皇帝',
    dynasty: '秦',
    time: '公元前221年',
    location: '咸阳宫',
    difficulty: 'medium' as const,
    scenarioType: 'founding' as const,
    keyEvents: ['统一六国', '称帝建制', '焚书坑儒'],
    personality: '雄才大略，刚愎自用，追求永生',
    crisis: '六国遗民反抗，求仙问道耗竭国力',
    npcTypes: ['loyal', 'schemer', 'eunuch', 'general'],
  },
  {
    id: 'han_wudi',
    name: '汉武帝',
    title: '武帝',
    dynasty: '西汉',
    time: '公元前141年-前87年',
    location: '未央宫',
    difficulty: 'medium' as const,
    scenarioType: 'expansion' as const,
    keyEvents: ['北伐匈奴', '开拓西域', '推恩令'],
    personality: '雄才大略，好大喜功，独断专行',
    crisis: '连年征战国库空虚，巫蛊之祸动摇国本',
    npcTypes: ['loyal', 'general', 'scholar', 'eunuch'],
  },
  {
    id: 'cao_cao',
    name: '曹操',
    title: '魏武帝',
    dynasty: '东汉/魏',
    time: '公元196年-220年',
    location: '许都',
    difficulty: 'medium' as const,
    scenarioType: 'crisis' as const,
    keyEvents: ['挟天子以令诸侯', '官渡之战', '赤壁之战'],
    personality: '奸雄本色，唯才是举，雄才大略',
    crisis: '北方初定人心未附，赤壁战败元气大伤',
    npcTypes: ['schemer', 'general', 'scholar', 'loyal'],
  },
  {
    id: 'tang_taizong',
    name: '唐太宗',
    title: '太宗',
    dynasty: '唐',
    time: '公元626年-649年',
    location: '大明宫',
    difficulty: 'medium' as const,
    scenarioType: 'founding' as const,
    keyEvents: ['玄武门之变', '贞观之治', '天可汗'],
    personality: '虚怀若谷，从谏如流，开明君主',
    crisis: '玄武门之变手足相残，突厥压境长安震动',
    npcTypes: ['loyal', 'scholar', 'general', 'eunuch'],
  },
  {
    id: 'wu_zetian',
    name: '武则天',
    title: '则天皇帝',
    dynasty: '唐/武周',
    time: '公元690年-705年',
    location: '神都洛阳',
    difficulty: 'hard' as const,
    scenarioType: 'crisis' as const,
    keyEvents: ['称帝建周', '酷吏政治', '神龙政变'],
    personality: '心狠手辣，雄才大略，唯我独尊',
    crisis: '女主称帝朝野震动，酷吏横行人人自危',
    npcTypes: ['schemer', 'eunuch', 'loyal', 'hostile'],
  },
];

/**
 * 批量生成剧本
 */
async function batchGenerate(): Promise<void> {
  console.log('='.repeat(60));
  console.log('批量剧本生成工具');
  console.log('='.repeat(60));
  console.log(`\n计划生成: ${EMPERORS_TO_GENERATE.length} 个剧本\n`);

  const results = {
    success: [] as string[],
    failed: [] as { id: string; error: string }[],
  };

  for (let i = 0; i < EMPERORS_TO_GENERATE.length; i++) {
    const emperor = EMPERORS_TO_GENERATE[i];
    console.log(`\n[${i + 1}/${EMPERORS_TO_GENERATE.length}] 生成剧本: ${emperor.name}`);

    try {
      // 动态导入 generateScenario 避免循环依赖
      const { generateScenario } = await import('./generate-scenario');
      await generateScenario(emperor.id);
      results.success.push(emperor.name);
      console.log(`✅ ${emperor.name} - 成功`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      results.failed.push({ id: emperor.id, error: errorMessage });
      console.error(`❌ ${emperor.name} - 失败: ${errorMessage}`);
    }
  }

  // 打印总结
  console.log('\n' + '='.repeat(60));
  console.log('生成完成');
  console.log('='.repeat(60));
  console.log(`成功: ${results.success.length} 个`);
  console.log(`失败: ${results.failed.length} 个`);

  if (results.failed.length > 0) {
    console.log('\n失败列表:');
    results.failed.forEach(({ id, error }) => {
      console.log(`  - ${id}: ${error}`);
    });
  }

  console.log('\n提示:');
  console.log('  - 生成的剧本保存在: public/scenarios/');
  console.log('  - 索引文件已自动更新: public/scenarios/index.json');
  console.log('  - 单个生成: npx ts-node scripts/generate-scenario.ts <id>');

  process.exit(results.failed.length > 0 ? 1 : 0);
}

// 如果直接运行此脚本
if (require.main === module) {
  batchGenerate().catch(error => {
    console.error('[Batch] 批量生成失败:', error);
    process.exit(1);
  });
}

export { batchGenerate, EMPERORS_TO_GENERATE };
