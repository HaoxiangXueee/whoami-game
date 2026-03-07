/**
 * 朕到底是谁 - 主应用组件
 * v1.1 核心玩法修复版 - 回归逆向图灵测试设计
 *
 * 重要变更：
 * - 移除剧本选择界面，改为随机分配
 * - 玩家不再知道自己是谁，必须通过NPC对话推断
 * - 恢复"逆向图灵测试"核心玩法
 * - 集成Kimi LLM服务
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '@stores/gameStore';
import { useLLM } from '@hooks/useLLM';
import { RandomScenarioLoader } from '@components/game/RandomScenarioLoader';
import { DialogueContainer } from '@components/game/DialogueContainer';
import { PlayerInput } from '@components/game/PlayerInput';
import { StatChangeAnimation } from '@components/game/StatChangeAnimation';
import { EndingScreen } from '@components/game/EndingScreen';
import { QuestionAnswerPanel } from '@components/game/QuestionAnswerPanel';
import type { ChatMessage, ScenarioConfig, AnswerValidationResult, AnswerState, EndingScore } from '@/types/game';

function App() {
  const {
    status,
    stats,
    currentScenario,
    chatHistory,
    isLoading,
    currentTurn,
    maxTurns,
    currentNpcIndex,
    ending,
    answerState,
    isAnsweringQuestions,
    resetGame,
    setScenario,
    addMessage,
    setLoading,
    updateStats,
    nextTurn,
    setEnding,
    submitAnswer,
    setAnsweringQuestions,
    setAnswerCorrect,
  } = useGameStore();

  // v1.1: 控制穿越动画显示
  const [isRandomLoading, setIsRandomLoading] = useState(false);

  // 防止剧本初始化逻辑重复执行
  const isScenarioInitialized = useRef(false);

  // LLM Hook
  const llm = useLLM({
    scenario: currentScenario,
    chatHistory,
    currentTurn,
    maxTurns,
    currentNpcIndex,
  });

  // 初始化LLM服务
  useEffect(() => {
    // 检测是否在Vercel生产环境（使用代理）
    const isProduction = import.meta.env.PROD;
    // 从环境变量获取（开发环境用，生产环境代理不需要
    const apiKey = import.meta.env.VITE_KIMI_API_KEY || '';

    if (!llm.isInitialized) {
      // 生产环境使用代理，不需要前端传真实API Key
      const success = llm.initialize(apiKey, isProduction);
      if (success) {
        console.log('[App] LLM服务初始化成功', { useProxy: isProduction });
      } else {
        console.error('[App] LLM服务初始化失败');
      }
    }
  }, [llm]);

  // 监听回合数，回合耗尽时触发结局
  useEffect(() => {
    if (status === 'playing' && currentTurn >= maxTurns && currentTurn > 0) {
      console.log('[App] 回合耗尽，自动开启问题回答');
      // 回合耗尽时自动开启问题回答面板
      setAnsweringQuestions(true);
    }
  }, [currentTurn, maxTurns, status, setAnsweringQuestions]);

  // v1.1: 处理开始游戏 - 显示穿越动画
  const handleStartGame = useCallback(() => {
    // 重置游戏状态，确保每次开始都是干净的
    resetGame();
    // 重置剧本初始化标志，允许新剧本的初始化逻辑执行
    isScenarioInitialized.current = false;
    setIsRandomLoading(true);
  }, [resetGame]);

  // 处理答案提交
  const handleAnswerSubmit = useCallback((answer: string) => {
    console.log('[App] 提交答案:', answer);
    submitAnswer(answer);
  }, [submitAnswer]);

  // 统一使用AI验证答案
  const validateAnswer = useCallback(async (
    answer: string
  ): Promise<AnswerValidationResult> => {
    if (!currentScenario) {
      return {
        isCorrect: false,
        feedback: '无法验证答案',
        similarity: 0,
      };
    }

    // 计算剩余次数
    const maxAttempts = 3;
    const currentAttempts = answerState.attempts;
    const remainingAttempts = maxAttempts - currentAttempts - 1;

    try {
      const { validateAnswerWithAI } = await import('@services/answerValidator');

      // 皇帝姓名使用AI验证
      const correctEmperor = currentScenario.emperor.name;

      const aiResult = await validateAnswerWithAI(
        'emperor',
        correctEmperor,
        answer,
        currentScenario
      );

      // 关键修复：如果验证正确，立即保存正确状态到store
      if (aiResult.isCorrect) {
        setAnswerCorrect(true);
      }

      return {
        isCorrect: aiResult.isCorrect,
        feedback: aiResult.isCorrect
          ? `回答正确！✓ ${aiResult.feedback}`
          : `回答错误，请继续尝试。剩余 ${Math.max(0, remainingAttempts)} 次机会。`,
        similarity: aiResult.isCorrect ? 1 : 0,
      };
    } catch (error) {
      console.error('[App] AI验证失败:', error);
      // AI验证失败时回退到简单包含匹配
      const correctAnswer = currentScenario.emperor.name;
      const isCorrect = answer.toLowerCase().includes(correctAnswer.toLowerCase()) ||
        correctAnswer.toLowerCase().includes(answer.toLowerCase());

      // 关键修复：如果验证正确，立即保存正确状态到store
      if (isCorrect) {
        setAnswerCorrect(true);
      }

      return {
        isCorrect,
        feedback: isCorrect
          ? `回答正确！✓`
          : `回答错误，请继续尝试。剩余 ${Math.max(0, remainingAttempts)} 次机会。`,
        similarity: isCorrect ? 1 : 0,
      };
    }
  }, [currentScenario, answerState, setAnswerCorrect]);

  // 结局评分计算函数
  const calculateEndingScore = useCallback((
    currentTurn: number,
    maxTurns: number,
    attempts: number,
    maxAttempts: number,
    authority: number,
    suspicion: number,
    isCorrect: boolean
  ): EndingScore => {
    // 1. 回合数得分：越早答题分越高 (0-30)
    // 第1回合答题: 30分，最后1回合答题: 0分
    const turnScore = maxTurns > 1
      ? Math.max(0, Math.round(30 * (1 - (currentTurn - 1) / (maxTurns - 1))))
      : 30;

    // 2. 剩余机会得分：剩余越多分越高 (0-20)
    // 剩余3次: 20分，剩余0次: 0分
    const remainingAttempts = maxAttempts - attempts;
    const attemptsScore = Math.round(20 * (remainingAttempts / maxAttempts));

    // 3. 威望值得分：越高越好 (0-30)
    const authorityScore = Math.round(30 * (authority / 100));

    // 4. 暴露值得分：越低越好 (0-20)
    const suspicionScore = Math.round(20 * (1 - suspicion / 100));

    // 总分
    let totalScore = turnScore + attemptsScore + authorityScore + suspicionScore;

    // 如果答对了，额外加20分奖励
    if (isCorrect) {
      totalScore += 20;
    }

    // 总分上限100
    totalScore = Math.min(100, totalScore);

    return {
      totalScore,
      turnScore,
      attemptsScore,
      authorityScore,
      suspicionScore,
      isCorrect,
    };
  }, []);

  // 处理问题回答完成
  const handleQuestionsComplete = useCallback((finalState: AnswerState) => {
    console.log('[App] 问题回答完成:', finalState);

    const isCorrect = finalState.correct === true;

    // 计算结局评分
    const score = calculateEndingScore(
      currentTurn,
      maxTurns,
      finalState.attempts,
      3, // maxAttempts
      stats.authority,
      stats.suspicion,
      isCorrect
    );

    console.log('[App] 结局评分:', score);

    // 根据分数决定结局类型
    let endingType: string;
    let title: string;
    let summary: string;
    let epilogue: string;

    if (score.totalScore >= 80) {
      endingType = 'win_correct_answer';
      title = '完美识破';
      summary = `太厉害了！你以${score.totalScore}分的高分完美找回了自己的身份！回合数得分${score.turnScore}分，剩余机会${score.attemptsScore}分，威望${score.authorityScore}分，暴露控制${score.suspicionScore}分。${isCorrect ? '答案正确额外+20分！' : ''}`;
      epilogue = '你的智慧和洞察力令人叹为观止，现在你可以稳稳地坐江山了！';
    } else if (score.totalScore >= 60) {
      endingType = 'win_correct_answer';
      title = '真相大白';
      summary = `不错！你以${score.totalScore}分成功找回了自己的身份！回合数得分${score.turnScore}分，剩余机会${score.attemptsScore}分，威望${score.authorityScore}分，暴露控制${score.suspicionScore}分。`;
      epilogue = '虽然过程有些波折，但你最终还是确认了自己的身份，天下可以安定了。';
    } else if (score.totalScore >= 40) {
      endingType = 'neutral_escape';
      title = '部分真相';
      summary = `你获得了${score.totalScore}分。回合数得分${score.turnScore}分，剩余机会${score.attemptsScore}分，威望${score.authorityScore}分，暴露控制${score.suspicionScore}分。虽然没有完全确认，但你隐约猜到了自己是谁。`;
      epilogue = '这份模糊的认知足以让你暂时稳住局势，但未来依然充满变数...';
    } else if (score.totalScore >= 20) {
      endingType = 'neutral_escape';
      title = '记忆模糊';
      summary = `你只获得了${score.totalScore}分。回合数得分${score.turnScore}分，剩余机会${score.attemptsScore}分，威望${score.authorityScore}分，暴露控制${score.suspicionScore}分。你的记忆依然混乱不堪。`;
      epilogue = '你勉强维持着皇帝的威严，但内心的不安越来越强烈...';
    } else {
      endingType = 'lose_wrong_answer';
      title = '身份迷失';
      summary = `很遗憾，你只获得了${score.totalScore}分。回合数得分${score.turnScore}分，剩余机会${score.attemptsScore}分，威望${score.authorityScore}分，暴露控制${score.suspicionScore}分。你的记忆完全混乱了。`;
      epilogue = '朝臣们开始窃窃私语，你的处境变得岌岌可危...';
    }

    setEnding({
      type: endingType as any,
      title,
      summary,
      epilogue,
    });

    setAnsweringQuestions(false);
  }, [setEnding, setAnsweringQuestions, currentTurn, maxTurns, stats, calculateEndingScore]);

  // v1.1: 穿越动画完成，RandomScenarioLoader 传回随机选中的剧本
  const handleScenarioReady = useCallback((scenario: ScenarioConfig) => {
    // 防止重复执行：如果已经初始化过，直接返回
    if (isScenarioInitialized.current) {
      console.log('[handleScenarioReady] 剧本已初始化，跳过重复执行');
      return;
    }
    isScenarioInitialized.current = true;

    // 关闭穿越动画
    setIsRandomLoading(false);

    // 设置剧本（状态会从 start_menu 变为 playing）
    setScenario(scenario);

    // 使用 playerIntro（模糊失忆场景）而非 background（完整历史）
    const introText =
      scenario.playerIntro ||
      '你醒来发现自己身处一座古老宫殿...';

    const openingMessage: ChatMessage = {
      id: `system_${Date.now()}`,
      role: 'system',
      content: introText,
      timestamp: Date.now(),
      type: 'narration',
    };

    addMessage(openingMessage);

    // 延迟发送第一个 NPC 问候（使用当前NPC索引）
    if (scenario.npcs && scenario.npcs.length > 0) {
      const currentNPC = scenario.npcs[currentNpcIndex % scenario.npcs.length];
      if (currentNPC) {
        setTimeout(() => {
          const introMessage: ChatMessage = {
            id: `npc_${Date.now()}`,
            role: 'assistant',
            content: currentNPC.introduction || '陛下，臣有要事禀报。',
            timestamp: Date.now(),
            type: 'dialogue',
            npcId: currentNPC.id,
            npcName: currentNPC.name,
          };
          addMessage(introMessage);
        }, 1500);
      }
    }
  }, [setScenario, addMessage]);

  // 处理发送消息
  const handleSendMessage = useCallback(async (content: string) => {
    if (!currentScenario || isLoading) return;

    // 添加玩家消息
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
      type: 'dialogue',
    };

    addMessage(userMessage);
    setLoading(true);

    // 检查LLM是否已初始化
    if (!llm.isInitialized) {
      console.error('[App] LLM服务未初始化');
      // 使用模拟响应作为回退
      setTimeout(() => {
        const npcIndex = currentNpcIndex % (currentScenario.npcs?.length || 1);
        const currentNPC = currentScenario.npcs?.[npcIndex];
        const npcMessage: ChatMessage = {
          id: `npc_${Date.now()}`,
          role: 'assistant',
          content: '陛下恕罪，老臣身体不适，请容老臣稍作歇息...',
          timestamp: Date.now(),
          type: 'dialogue',
          npcId: currentNPC?.id,
          npcName: currentNPC?.name,
        };
        addMessage(npcMessage);
        setLoading(false);
      }, 1500);
      return;
    }

    // 调用LLM服务
    try {
      console.log('[App] 调用LLM服务...');
      const response = await llm.sendMessage(content);

      if (response) {
        console.log('[App] LLM响应:', response);

        // 更新数值
        updateStats({
          authority: response.authority_delta,
          suspicion: response.suspicion_delta,
        });

        // 检查游戏是否结束
        if (response.is_game_over) {
          console.log('[App] 游戏结束:', response.ending_type);
          // 设置结局并更新游戏状态
          if (response.ending_type) {
            setEnding({
              type: response.ending_type,
              title: response.ending_title || '结局',
              summary: response.ending_summary || '游戏结束',
            });
          }
        }

        // 添加DM旁白（如果有）
        if (response.dm_narration) {
          const dmMessage: ChatMessage = {
            id: `dm_${Date.now()}`,
            role: 'system',
            content: response.dm_narration,
            timestamp: Date.now(),
            type: 'narration',
          };
          addMessage(dmMessage);
        }

        // 添加NPC回复（使用当前NPC）
        if (response.npc_dialogue) {
          const npcIndex = currentNpcIndex % (currentScenario.npcs?.length || 1);
          const currentNPC = currentScenario.npcs?.[npcIndex];
          const npcMessage: ChatMessage = {
            id: `npc_${Date.now()}`,
            role: 'assistant',
            content: response.npc_dialogue,
            timestamp: Date.now(),
            type: 'dialogue',
            npcId: currentNPC?.id,
            npcName: currentNPC?.name,
          };
          addMessage(npcMessage);
        }

        nextTurn();
      } else {
        // LLM返回空响应
        console.error('[App] LLM返回空响应');
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          role: 'system',
          content: '【系统】连接中断，请重试...',
          timestamp: Date.now(),
          type: 'system',
        };
        addMessage(errorMessage);
      }
    } catch (err) {
      console.error('[App] LLM调用失败:', err);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: '【系统】服务器繁忙，请稍后再试...',
        timestamp: Date.now(),
        type: 'system',
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentScenario, isLoading, addMessage, setLoading, updateStats, nextTurn, llm]);

  // 渲染主菜单
  const renderStartMenu = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* 标题区域 */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-amber-400 mb-3 sm:mb-4 tracking-wider">
          <span className="inline-block mr-2">🏛️</span>
          朕到底是谁
        </h1>
        <p className="text-sm sm:text-base text-slate-400 px-2">
          历史生存推理文字游戏 | 你的选择将决定命运
        </p>
      </div>

      {/* 按钮区域 */}
      <div className="w-full max-w-xs sm:max-w-sm space-y-3 sm:space-y-4">
        {/* 主按钮 */}
        <button
          onClick={handleStartGame}
          className="w-full py-3.5 sm:py-4 px-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 transition-all duration-300 flex items-center justify-center gap-2 text-base sm:text-lg"
        >
          <span>👑</span>
          登基为帝
        </button>

      </div>

      {/* 页脚 */}
      <footer className="mt-8 sm:mt-12 text-center text-slate-500 text-xs sm:text-sm">
        <p>版本 2.0.0 | 百帝之志</p>
      </footer>
    </div>
  );

  // 渲染结局
  const renderEnding = () => {
    if (!ending || !currentScenario) return null;

    return (
      <EndingScreen
        type={ending.type}
        title={ending.title}
        summary={ending.summary}
        epilogue={ending.epilogue}
        initialStats={currentScenario.initialStats}
        finalStats={stats}
        currentTurn={currentTurn}
        maxTurns={maxTurns}
        currentScenario={currentScenario}
        onRestart={handleStartGame}
        onReturnToMenu={resetGame}
      />
    );
  };

  // 渲染游戏中
  const renderPlaying = () => {
    if (!currentScenario) return null;

    // 如果正在回答问题，显示问题面板
    if (isAnsweringQuestions) {
      return (
        <QuestionAnswerPanel
          answerState={answerState}
          isForced={currentTurn >= maxTurns}
          maxAttempts={3}
          onSubmitAnswer={handleAnswerSubmit}
          onValidateAnswer={validateAnswer}
          onComplete={handleQuestionsComplete}
          onClose={() => setAnsweringQuestions(false)}
        />
      );
    }

    // 检查是否应该强制结束（答题完成或耗尽机会）
    const isDone = answerState.correct === true || answerState.attempts >= 3;
    const shouldForceAnswer = isDone;

    // 如果应该强制结束，但面板没打开，自动打开并触发结局
    if (shouldForceAnswer && !isAnsweringQuestions) {
      setAnsweringQuestions(true);
      // 延迟一点触发结局，让用户看到结果
      setTimeout(() => {
        handleQuestionsComplete(answerState);
      }, 1500);
    }

    return (
      <div className="game-screen flex flex-col h-screen bg-slate-950">
        {/* 顶部标题栏 */}
        <header className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-slate-900 border-b border-slate-800 shrink-0">
          <button
            onClick={resetGame}
            className="text-slate-400 hover:text-slate-200 text-sm sm:text-base flex items-center gap-1"
          >
            ← 返回
          </button>

          {/* v1.1: 隐藏身份信息，显示模糊描述 */}
          <div className="text-center">
            <h2 className="text-amber-400 text-sm sm:text-base font-bold">深宫之中</h2>
            <p className="text-slate-500 text-xs sm:text-sm">时辰不明</p>
          </div>

          <div className="text-right">
            <span className="text-slate-400 text-xs block">回合</span>
            <span className="text-amber-400 font-bold text-sm sm:text-base">{currentTurn}/{maxTurns}</span>
          </div>

          {/* 回答问题按钮 - 桌面端显示 */}
          {answerState.correct !== true && (
            <button
              onClick={() => setAnsweringQuestions(true)}
              className="hidden sm:block ml-2 px-3 py-1 bg-amber-600/80 hover:bg-amber-500 text-amber-100 rounded border border-amber-500 text-sm font-bold transition-colors"
            >
              答题 {answerState.attempts > 0 ? `(${answerState.attempts}/3)` : ''}
            </button>
          )}
        </header>

        {/* 数值条 - 响应式布局 */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-2 sm:p-4 bg-slate-900/50 border-b border-slate-800">
          {/* 威势值 */}
          <div className="flex-1 flex items-center gap-2 sm:gap-3 bg-slate-800/50 rounded-lg p-2 sm:p-3">
            <span className="text-lg sm:text-xl">🏺</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <span className="text-xs sm:text-sm text-slate-400">威势值</span>
                <span className="text-sm sm:text-base font-bold text-amber-400">{stats.authority}</span>
              </div>
              <div className="h-1.5 sm:h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                  style={{ width: `${stats.authority}%` }}
                />
              </div>
            </div>
            <StatChangeAnimation value={stats.authority} type="authority" />
          </div>

          {/* 暴露度 */}
          <div className="flex-1 flex items-center gap-2 sm:gap-3 bg-slate-800/50 rounded-lg p-2 sm:p-3">
            <span className="text-lg sm:text-xl">🐉</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <span className="text-xs sm:text-sm text-slate-400">暴露度</span>
                <span className="text-sm sm:text-base font-bold text-red-400">{stats.suspicion}</span>
              </div>
              <div className="h-1.5 sm:h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                  style={{ width: `${stats.suspicion}%` }}
                />
              </div>
            </div>
            <StatChangeAnimation value={stats.suspicion} type="suspicion" />
          </div>
        </div>

        {/* 对话区域 */}
        <DialogueContainer
          messages={chatHistory}
          currentScenario={currentScenario}
          isLoading={isLoading}
        />

        {/* 移动端浮动答题按钮 - 只在移动端显示 */}
        {answerState.correct !== true && (
          <button
            onClick={() => setAnsweringQuestions(true)}
            className="sm:hidden fixed right-4 bottom-28 z-40 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-full shadow-lg shadow-amber-600/40 transition-all duration-300 border-2 border-amber-400"
          >
            <div className="text-center">
              <span className="text-lg">❓</span>
              <span className="text-xs font-bold block leading-tight">
                {answerState.attempts > 0 ? `${answerState.attempts}/3` : ''}
              </span>
            </div>
          </button>
        )}

        {/* 输入区域 - 回合耗尽且未答对所有问题时禁用 */}
        {shouldForceAnswer ? (
          <div className="p-4 text-center bg-slate-800 border-t border-slate-700 text-amber-300 shrink-0">
            <p className="mb-3 font-bold">
              ⚠️ 回合已耗尽，请先回答问题！
            </p>
            <button
              onClick={() => setAnsweringQuestions(true)}
              className="px-5 py-2 bg-amber-300 text-slate-800 rounded font-bold hover:bg-amber-200 transition-colors"
            >
              立即回答问题
            </button>
          </div>
        ) : (
          <PlayerInput
            onSend={handleSendMessage}
            isLoading={isLoading}
            placeholder="朕意如何..."
            maxLength={500}
          />
        )}
      </div>
    );
  };

  // 主渲染
  // v1.1: 优先显示穿越动画
  if (isRandomLoading) {
    return (
      <div className="game-app">
        <RandomScenarioLoader onComplete={handleScenarioReady} />
      </div>
    );
  }

  return (
    <div className="game-app">
      {status === 'start_menu' && renderStartMenu()}
      {status === 'playing' && renderPlaying()}
      {status === 'game_over' && renderEnding()}
    </div>
  );
}

export default App;
