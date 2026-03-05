/**
 * AI答案验证服务
 * 使用AI语义识别来判断玩家答案是否正确
 */

import { getLLMService } from './llm';
import type { ScenarioConfig } from '@config/scenarios';

export interface AIAnswerValidationResult {
  isCorrect: boolean;
  confidence: 'high' | 'medium' | 'low';
  feedback: string;
  reasoning?: string;
}

/**
 * 构建答案验证prompt
 */
function buildValidationPrompt(
  questionType: 'emperor' | 'event',
  correctAnswer: string,
  playerAnswer: string,
  scenario?: ScenarioConfig
): string {
  const scenarioContext = scenario
    ? `当前剧本背景：${scenario.name} - ${scenario.description}`
    : '';

  if (questionType === 'emperor') {
    return `请判断玩家的回答是否正确地识别了皇帝身份。

${scenarioContext}

正确答案（皇帝姓名/称谓）：${correctAnswer}
玩家回答：${playerAnswer}

判断规则：
1. 玩家回答必须包含正确的皇帝姓名或主要称谓
2. 接受常见别名（如"崇祯"对应"朱由检"）
3. 不接受错误皇帝或含糊不清的回答

请返回JSON格式：
{
  "isCorrect": boolean,
  "confidence": "high" | "medium" | "low",
  "feedback": "简要反馈说明",
  "reasoning": "判断理由"
}`;
  } else {
    return `请判断玩家的回答是否正确地识别了历史事件。

${scenarioContext}

正确答案（历史事件）：${correctAnswer}
玩家回答：${playerAnswer}

判断规则：
1. 玩家回答必须与正确答案指向同一历史事件
2. 接受不同的描述方式（如"崇祯煤山自缢"、"李自成攻破北京"、"明亡于闯贼"都指向同一事件）
3. 关注事件的核心要素：时间、地点、主要人物、结果
4. 不接受指向不同事件的回答

请返回JSON格式：
{
  "isCorrect": boolean,
  "confidence": "high" | "medium" | "low",
  "feedback": "简要反馈说明",
  "reasoning": "判断理由"
}`;
  }
}

/**
 * 使用AI验证答案
 */
export async function validateAnswerWithAI(
  questionType: 'emperor' | 'event',
  correctAnswer: string,
  playerAnswer: string,
  scenario?: ScenarioConfig
): Promise<AIAnswerValidationResult> {
  try {
    const prompt = buildValidationPrompt(questionType, correctAnswer, playerAnswer, scenario);

    const llmService = getLLMService();
    const response = await llmService.sendMessage({
      messages: [
        {
          role: 'system',
          content: '你是一个专门验证历史知识答案的AI助手。你的任务是判断玩家的回答是否与正确答案语义等价。只返回JSON格式，不要添加任何其他文字。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      config: {
        temperature: 0.1, // 低温度以获得更确定性的结果
        maxTokens: 500,
      },
    });

    // 解析JSON响应
    const cleanedResponse = response.content.trim().replace(/^```json\s*|\s*```$/g, '');
    const result = JSON.parse(cleanedResponse);

    return {
      isCorrect: result.isCorrect ?? false,
      confidence: result.confidence ?? 'medium',
      feedback: result.feedback ?? (result.isCorrect ? '回答正确' : '回答不正确'),
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error('[AnswerValidator] AI验证失败:', error);
    // 失败时回退到保守策略：认为不正确
    return {
      isCorrect: false,
      confidence: 'low',
      feedback: '验证过程出现错误，请重试',
      reasoning: 'AI服务暂时不可用',
    };
  }
}

/**
 * 批量验证答案（用于同时验证两个问题的场景）
 */
export async function validateBothAnswers(
  emperorAnswer: string,
  eventAnswer: string,
  correctEmperor: string,
  correctEvent: string,
  scenario?: ScenarioConfig
): Promise<{
  emperor: AIAnswerValidationResult;
  event: AIAnswerValidationResult;
}> {
  const [emperorResult, eventResult] = await Promise.all([
    validateAnswerWithAI('emperor', correctEmperor, emperorAnswer, scenario),
    validateAnswerWithAI('event', correctEvent, eventAnswer, scenario),
  ]);

  return {
    emperor: emperorResult,
    event: eventResult,
  };
}
