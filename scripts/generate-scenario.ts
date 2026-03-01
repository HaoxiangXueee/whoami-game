/**
 * 剧本生成脚本
 * 使用 LLM 生成完整的剧本 JSON 文件
 *
 * 使用方法:
 *   npx ts-node scripts/generate-scenario.ts <emperor-id>
 *
 * 示例:
 *   npx ts-node scripts/generate-scenario.ts qin_shihuang
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ScenarioConfig, ScenarioNPC } from '../src/types/scenario';

// 简化的皇帝输入配置接口
interface EmperorInput {
  id: string;
  name: string;
  title: string;
  dynasty: string;
  time: string;
  location: string;
  difficulty: 'easy' | 'medium' | 'hard';
  scenarioType: 'founding' | 'expansion' | 'crisis' | 'decline' | 'survival';
  keyEvents: string[];
  personality: string;
  crisis: string;
  npcTypes: string[];
}

// 剧本模板
const SCENARIO_TEMPLATE: Omit<ScenarioConfig, 'id' | 'name' | 'description' | 'difficulty' | 'emperor' | 'setting' | 'initialStats' | 'maxTurns' | 'npcs' | 'background' | 'playerIntro' | 'winLoseConditions' | 'metadata'> = {
  // 这里可以添加剧本模板的默认值
};

/**
 * 生成剧本的主函数
 */
async function generateScenario(emperorId: string): Promise<void> {
  console.log(`[Generate] 开始生成剧本: ${emperorId}`);

  // 1. 读取输入配置
  const input = await readEmperorInput(emperorId);
  if (!input) {
    console.error(`[Generate] 未找到 ${emperorId} 的输入配置`);
    process.exit(1);
  }

  // 2. 生成完整的剧本配置
  const scenario = await createScenarioConfig(input);

  // 3. 验证剧本
  const validation = validateScenario(scenario);
  if (!validation.valid) {
    console.warn('[Generate] 剧本验证警告:', validation.warnings);
  }

  // 4. 保存剧本JSON
  await saveScenario(scenario);

  // 5. 更新索引
  await updateIndex(scenario);

  console.log(`[Generate] 剧本生成完成: ${scenario.name}`);
}

/**
 * 读取皇帝输入配置
 */
async function readEmperorInput(emperorId: string): Promise<EmperorInput | null> {
  const configPath = path.join(__dirname, 'emperors', `${emperorId}.json`);

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as EmperorInput;
  } catch {
    // 如果配置文件不存在，返回null
    return null;
  }
}

/**
 * 创建完整的剧本配置
 */
async function createScenarioConfig(input: EmperorInput): Promise<ScenarioConfig> {
  const now = new Date().toISOString();

  // 根据难度设置初始数值
  const initialStats = getInitialStatsByDifficulty(input.difficulty);

  // 根据场景类型设置回合数
  const maxTurns = getMaxTurnsByScenarioType(input.scenarioType);

  // 生成NPC
  const npcs = generateNPCs(input.npcTypes, input.dynasty);

  // 生成LLM背景
  const background = generateBackground(input);

  // 生成玩家开场白
  const playerIntro = generatePlayerIntro(input);

  // 生成胜负条件
  const winLoseConditions = generateWinLoseConditions(input);

  return {
    id: input.id,
    name: input.name,
    description: input.keyEvents.join('，'),
    difficulty: input.difficulty,

    emperor: {
      name: input.name,
      title: input.title,
      dynasty: input.dynasty,
      realIdentity: `${input.dynasty}${input.title}${input.name}`,
    },

    setting: {
      time: input.time,
      location: input.location,
      atmosphere: input.crisis,
    },

    initialStats,
    maxTurns,

    npcs,

    background,
    playerIntro,

    winLoseConditions,

    metadata: {
      author: 'AI Game Studio',
      createdAt: now,
      updatedAt: now,
      tags: [input.dynasty, input.scenarioType, input.difficulty],
    },
  };
}

/**
 * 根据难度获取初始数值
 */
function getInitialStatsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): { authority: number; suspicion: number } {
  switch (difficulty) {
    case 'easy':
      return { authority: 60, suspicion: 0 };
    case 'medium':
      return { authority: 45, suspicion: 0 };
    case 'hard':
      return { authority: 30, suspicion: 0 };
  }
}

/**
 * 根据场景类型获取回合数
 */
function getMaxTurnsByScenarioType(type: string): number {
  switch (type) {
    case 'founding':
      return 12;
    case 'expansion':
      return 10;
    case 'crisis':
      return 8;
    case 'decline':
      return 6;
    case 'survival':
      return 8;
    default:
      return 10;
  }
}

/**
 * 生成NPC列表
 */
function generateNPCs(npcTypes: string[], dynasty: string): ScenarioNPC[] {
  const npcTemplates: Record<string, Partial<ScenarioNPC>> = {
    loyal: {
      name: '忠臣',
      title: '辅政大臣',
      personality: '忠诚耿直，敢于直谏',
      attitude: 'loyal',
    },
    schemer: {
      name: '权臣',
      title: '权谋之士',
      personality: '心机深沉，善于权术',
      attitude: 'neutral',
    },
    eunuch: {
      name: '宦官',
      title: '内廷总管',
      personality: '谨慎小心，善于察言观色',
      attitude: 'loyal',
    },
    general: {
      name: '将军',
      title: '边关大将',
      personality: '忠勇善战，性格刚烈',
      attitude: 'loyal',
    },
    scholar: {
      name: '文臣',
      title: '翰林学士',
      personality: '学富五车，善于谋略',
      attitude: 'neutral',
    },
  };

  const npcs: ScenarioNPC[] = [];
  const usedTypes = new Set<string>();

  // 确保至少有2个，最多4个NPC
  const targetCount = Math.min(Math.max(npcTypes.length, 2), 4);

  for (let i = 0; i < targetCount; i++) {
    // 找到下一个未使用的类型
    let type = npcTypes.find(t => !usedTypes.has(t)) || 'loyal';
    usedTypes.add(type);

    const template = npcTemplates[type] || npcTemplates.loyal;

    npcs.push({
      id: `npc_${i + 1}`,
      name: template.name || '未知',
      title: template.title || '官员',
      description: `${dynasty}时期的${template.title}`,
      personality: template.personality || '性格不明',
      attitude: (template.attitude as 'loyal' | 'neutral' | 'hostile') || 'neutral',
      introduction: '启奏陛下...',
    });
  }

  return npcs;
}

/**
 * 生成LLM背景
 */
function generateBackground(input: EmperorInput): string {
  return `这是${input.dynasty}时期。
皇帝是${input.name}（${input.title}）。
当前处境：${input.crisis}。
关键事件：${input.keyEvents.join('、')}。
皇帝性格：${input.personality}。
时间地点：${input.time}，${input.location}。

NPC对话注意事项：
- 绝不直接说出皇帝的真实姓名
- 绝不直接说出朝代名
- 使用模糊称谓暗示时代背景
- 通过对话内容暗示历史事件`;
}

/**
 * 生成玩家开场白
 */
function generatePlayerIntro(input: EmperorInput): string {
  return `你缓缓睁开眼睛，发现自己身处一座古老而宏伟的宫殿之中。

殿内烛火摇曳，四周弥漫着一种压抑的紧张感。
${input.crisis}

你试图回忆自己是谁，却惊恐地发现——
你的记忆一片空白！
你不知道自己是谁，不知道自己为何会在这里，
更不知道外面究竟发生了什么...

就在这时，一位身穿官服的人快步走入。
他见到你醒来，脸上露出如释重负的表情，
随即跪倒在地，颤声说道：

"陛...陛下！您终于醒了！
您...您还记得老臣吗？"

你心中猛地一震——
他为什么叫我"陛下"？
我...我到底是谁？！`;
}

/**
 * 生成胜负条件
 */
function generateWinLoseConditions(input: EmperorInput): {
  winConditions: string[];
  loseConditions: string[];
} {
  return {
    winConditions: [
      '威势值达到80以上且暴露度不超过20',
      `成功应对${input.keyEvents[0] || '当前危机'}`,
      '坚持到最后回合未被推翻',
    ],
    loseConditions: [
      '威势值降至0（被政变废黜）',
      '暴露度达到100（被识破身份）',
      '做出明显违背历史常识的决定',
    ],
  };
}

/**
 * 验证剧本
 */
function validateScenario(scenario: ScenarioConfig): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必填字段检查
  if (!scenario.id) errors.push('缺少 id');
  if (!scenario.name) errors.push('缺少 name');
  if (!scenario.emperor?.name) errors.push('缺少 emperor.name');
  if (!scenario.background) warnings.push('缺少 background');
  if (!scenario.playerIntro) warnings.push('缺少 playerIntro');

  // NPC检查
  if (!scenario.npcs || scenario.npcs.length === 0) {
    warnings.push('没有配置NPC');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 保存剧本到文件
 */
async function saveScenario(scenario: ScenarioConfig): Promise<void> {
  const outputPath = path.join(__dirname, '..', 'public', 'scenarios', `${scenario.id}.json`);

  // 确保目录存在
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 写入文件
  fs.writeFileSync(outputPath, JSON.stringify(scenario, null, 2), 'utf-8');
  console.log(`[Generate] 剧本已保存: ${outputPath}`);
}

/**
 * 更新索引文件
 */
async function updateIndex(scenario: ScenarioConfig): Promise<void> {
  const indexPath = path.join(__dirname, '..', 'public', 'scenarios', 'index.json');

  let index: {
    version: string;
    lastUpdated: string;
    scenarios: Array<{
      id: string;
      name: string;
      description: string;
      difficulty: string;
      tags: string[];
    }>;
  };

  // 读取现有索引或创建新索引
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf-8');
    index = JSON.parse(content);
  } else {
    index = {
      version: '2.0.0',
      lastUpdated: new Date().toISOString(),
      scenarios: [],
    };
  }

  // 检查是否已存在
  const existingIndex = index.scenarios.findIndex(s => s.id === scenario.id);
  const indexItem = {
    id: scenario.id,
    name: scenario.name,
    description: scenario.description,
    difficulty: scenario.difficulty,
    tags: scenario.metadata.tags,
  };

  if (existingIndex >= 0) {
    // 更新现有条目
    index.scenarios[existingIndex] = indexItem;
    console.log(`[Generate] 更新索引: ${scenario.name}`);
  } else {
    // 添加新条目
    index.scenarios.push(indexItem);
    console.log(`[Generate] 添加索引: ${scenario.name}`);
  }

  // 更新时间和版本
  index.lastUpdated = new Date().toISOString();

  // 写入文件
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`[Generate] 索引已更新: ${indexPath}`);
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const emperorId = process.argv[2];

  if (!emperorId) {
    console.error('用法: npx ts-node scripts/generate-scenario.ts <emperor-id>');
    console.error('示例: npx ts-node scripts/generate-scenario.ts qin_shihuang');
    process.exit(1);
  }

  try {
    await generateScenario(emperorId);
  } catch (error) {
    console.error('[Generate] 生成失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { generateScenario, saveScenario, updateIndex };
