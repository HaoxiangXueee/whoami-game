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

import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '@stores/gameStore';
import { useLLM } from '@hooks/useLLM';
import { RandomScenarioLoader } from '@components/game/RandomScenarioLoader';
import { DialogueContainer } from '@components/game/DialogueContainer';
import { PlayerInput } from '@components/game/PlayerInput';
import { StatChangeAnimation } from '@components/game/StatChangeAnimation';
import { EndingScreen } from '@components/game/EndingScreen';
import { QuestionAnswerPanel } from '@components/game/QuestionAnswerPanel';
import { getScenarioIntro } from '@config/scenarios';
import type { ChatMessage, ScenarioConfig, AnswerValidationResult, AnswerState } from '@types/game';

function App() {
  const {
    status,
    stats,
    currentScenario,
    chatHistory,
    isLoading,
    currentTurn,
    maxTurns,
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
    incrementAnswerAttempt,
  } = useGameStore();

  // v1.1: 控制穿越动画显示
  const [isRandomLoading, setIsRandomLoading] = useState(false);

  // LLM Hook
  const llm = useLLM({
    scenario: currentScenario,
    chatHistory,
    currentTurn,
    maxTurns,
  });

  // 初始化LLM服务
  useEffect(() => {
    // 从环境变量或硬编码初始化（生产环境应使用环境变量）
    const apiKey = import.meta.env.VITE_KIMI_API_KEY || 'sk-HpoMZwOkPXQzzpzGE8r0slVSfCf96KWbXCV83crtfp32REAo';

    if (!llm.isInitialized) {
      const success = llm.initialize(apiKey);
      if (success) {
        console.log('[App] LLM服务初始化成功');
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
    setIsRandomLoading(true);
  }, [resetGame]);

  // 处理答案提交
  const handleAnswerSubmit = useCallback((type: 'emperor' | 'dynasty', answer: string) => {
    console.log(`[App] 提交${type === 'emperor' ? '皇帝' : '朝代'}答案:`, answer);
    submitAnswer(type, answer);
  }, [submitAnswer]);

  // 验证答案（简单版本，不调用LLM）
  const validateAnswer = useCallback(async (
    type: 'emperor' | 'dynasty',
    answer: string
  ): Promise<AnswerValidationResult> => {
    if (!currentScenario) {
      return {
        isCorrect: false,
        feedback: '无法验证答案',
        similarity: 0,
      };
    }

    const correctAnswer = type === 'emperor'
      ? currentScenario.emperor.name
      : currentScenario.emperor.dynasty;

    // 简单的字符串匹配（可以改进为更智能的匹配）
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();

    // 完全匹配或包含关系
    const isCorrect = normalizedAnswer === normalizedCorrect ||
      normalizedCorrect.includes(normalizedAnswer) ||
      normalizedAnswer.includes(normalizedCorrect);

    // 计算剩余次数
    const maxAttempts = 3;
    const currentAttempts = type === 'emperor' ? answerState.emperorAttempts : answerState.dynastyAttempts;
    const remainingAttempts = maxAttempts - currentAttempts - 1; // -1 because this attempt just happened

    return {
      isCorrect,
      // 不透露正确答案，只告诉用户是否正确
      feedback: isCorrect
        ? `回答正确！✓`
        : `回答错误，请继续尝试。剩余 ${Math.max(0, remainingAttempts)} 次机会。`,
      similarity: isCorrect ? 1 : 0,
    };
  }, [currentScenario, answerState]);

  // 处理问题回答完成
  const handleQuestionsComplete = useCallback((finalState: AnswerState) => {
    console.log('[App] 问题回答完成:', finalState);

    // 根据回答结果决定结局
    const hasCorrectEmperor = finalState.emperorCorrect === true;
    const hasCorrectDynasty = finalState.dynastyCorrect === true;

    if (hasCorrectEmperor && hasCorrectDynasty) {
      // 两个问题都答对了
      setEnding({
        type: 'win_correct_answer',
        title: '真相大白',
        summary: '你成功找回了自己的身份！通过对朝臣们的巧妙试探和对局势的敏锐判断，你终于确认了自己的真实身份。',
        epilogue: '你的智慧和耐心帮助你度过了这场危机，现在你终于可以以真实的身份治理天下了。',
      });
    } else if (hasCorrectEmperor || hasCorrectDynasty) {
      // 答对了一个
      setEnding({
        type: 'neutral_escape',
        title: '部分真相',
        summary: `你只答对了${hasCorrectEmperor ? '皇帝身份' : '朝代'}，但这也足以让你暂时稳住局势。`,
        epilogue: '虽然你没有完全找回自己的身份，但你的部分认知足以让你在这个危险的世界中生存下去。',
      });
    } else {
      // 都没答对
      setEnding({
        type: 'lose_wrong_answer',
        title: '身份迷失',
        summary: '你没有正确回答出任何一个问题。你的记忆混乱到了极点，连最基本的自我认知都无法保持。',
        epilogue: '朝臣们对你的怀疑越来越深，你的处境变得越来越危险...最终，你被当作冒名顶替者处理。',
      });
    }

    setAnsweringQuestions(false);
  }, [setEnding, setAnsweringQuestions]);

  // v1.1: 穿越动画完成，RandomScenarioLoader 传回随机选中的剧本
  const handleScenarioReady = useCallback((scenario: ScenarioConfig) => {
    // 关闭穿越动画
    setIsRandomLoading(false);

    // 设置剧本（状态会从 start_menu 变为 playing）
    setScenario(scenario);

    // 使用 playerIntro（模糊失忆场景）而非 background（完整历史）
    const introText =
      getScenarioIntro(scenario.id) ||
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

    // 延迟发送第一个 NPC 问候
    const firstNPC = scenario.npcs[0];
    if (firstNPC) {
      setTimeout(() => {
        const introMessage: ChatMessage = {
          id: `npc_${Date.now()}`,
          role: 'assistant',
          content: firstNPC.introduction || '陛下，臣有要事禀报。',
          timestamp: Date.now(),
          type: 'dialogue',
          npcId: firstNPC.id,
          npcName: firstNPC.name,
        };
        addMessage(introMessage);
      }, 1500);
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
        const npcMessage: ChatMessage = {
          id: `npc_${Date.now()}`,
          role: 'assistant',
          content: '陛下恕罪，老臣身体不适，请容老臣稍作歇息...',
          timestamp: Date.now(),
          type: 'dialogue',
          npcId: currentScenario.npcs[0]?.id,
          npcName: currentScenario.npcs[0]?.name,
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

        // 添加NPC回复
        if (response.npc_dialogue) {
          const npcMessage: ChatMessage = {
            id: `npc_${Date.now()}`,
            role: 'assistant',
            content: response.npc_dialogue,
            timestamp: Date.now(),
            type: 'dialogue',
            npcId: currentScenario.npcs[0]?.id,
            npcName: currentScenario.npcs[0]?.name,
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
    <div className="start-menu">
      <div className="title-section">
        <h1 className="game-title">
          <span className="title-icon">🏛️</span>
          朕到底是谁
        </h1>
        <p className="game-subtitle">历史生存推理文字游戏 | 你的选择将决定命运</p>
      </div>

      <div className="menu-buttons">
        <button className="btn-primary" onClick={handleStartGame}>
          <span className="btn-icon">👑</span>
          登基为帝
        </button>

        <div className="secondary-buttons">
          <button className="btn-secondary" onClick={() => {}}>
            <span className="btn-icon">📊</span>
            游戏统计
          </button>
          <button className="btn-secondary" onClick={() => {}}>
            <span className="btn-icon">⚙️</span>
            设置
          </button>
        </div>
      </div>

      <footer className="game-footer">
        <p>版本 1.1.0 | 制作：AI Game Studio</p>
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

    // 检查是否应该强制结束（任意问题耗尽且答错，或全部完成）
    const isEmperorDone = answerState.emperorCorrect === true || answerState.emperorAttempts >= 3;
    const isDynastyDone = answerState.dynastyCorrect === true || answerState.dynastyAttempts >= 3;
    const isAllDone = isEmperorDone && isDynastyDone;

    // 任意一个问题耗尽且答错，就应该强制结束
    const hasEmperorFailed = answerState.emperorAttempts >= 3 && answerState.emperorCorrect !== true;
    const hasDynastyFailed = answerState.dynastyAttempts >= 3 && answerState.dynastyCorrect !== true;
    const shouldForceAnswer = hasEmperorFailed || hasDynastyFailed || isAllDone;

    // 如果应该强制结束，但面板没打开，自动打开并触发结局
    if (shouldForceAnswer && !isAnsweringQuestions) {
      setAnsweringQuestions(true);
      // 延迟一点触发结局，让用户看到结果
      setTimeout(() => {
        handleQuestionsComplete(answerState);
      }, 1500);
    }

    return (
      <div className="game-screen">
        {/* 顶部标题栏 */}
        <header className="game-header">
          <button className="back-btn" onClick={resetGame}>
            ← 返回
          </button>
          {/* v1.1: 隐藏身份信息，显示模糊描述 */}
          <div className="header-title">
            <h2>深宫之中</h2>
            <p>时辰不明</p>
          </div>
          <div className="turn-info">
            <span className="turn-label">回合</span>
            <span className="turn-value">{currentTurn}/{maxTurns}</span>
          </div>

          {/* 回答问题按钮 - 玩家随时可以点击 */}
          {(answerState.emperorCorrect !== true || answerState.dynastyCorrect !== true) && (
            <button
              onClick={() => setAnsweringQuestions(true)}
              className="answer-btn"
              style={{
                marginLeft: '10px',
                padding: '5px 12px',
                backgroundColor: '#d4a574',
                color: '#2a2a2a',
                border: '1px solid #8b6914',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              回答问题 ({[answerState.emperorCorrect, answerState.dynastyCorrect].filter(Boolean).length}/2)
            </button>
          )}
        </header>

        {/* 数值条 */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-icon">🏺</span>
            <div className="stat-info">
              <span className="stat-label">威势值</span>
              <span className="stat-value">{stats.authority}</span>
            </div>
            <div className="stat-bar">
              <div
                className="stat-fill authority-fill"
                style={{ width: `${stats.authority}%` }}
              ></div>
            </div>
            <StatChangeAnimation value={stats.authority} type="authority" />
          </div>

          <div className="stat-item">
            <span className="stat-icon">🐉</span>
            <div className="stat-info">
              <span className="stat-label">暴露度</span>
              <span className="stat-value">{stats.suspicion}</span>
            </div>
            <div className="stat-bar">
              <div
                className="stat-fill suspicion-fill"
                style={{ width: `${stats.suspicion}%` }}
              ></div>
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

        {/* 输入区域 - 回合耗尽且未答对所有问题时禁用 */}
        {shouldForceAnswer ? (
          <div style={{
            padding: '15px',
            textAlign: 'center',
            backgroundColor: '#2a2a2a',
            borderTop: '1px solid #444',
            color: '#d4a574'
          }}>
            <p style={{margin: '0 0 10px 0', fontWeight: 'bold'}}>
              ⚠️ 回合已耗尽，请先回答问题！
            </p>
            <button
              onClick={() => setAnsweringQuestions(true)}
              style={{
                padding: '8px 20px',
                backgroundColor: '#d4a574',
                color: '#2a2a2a',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
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
