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
import { useScenarios } from '@hooks/useScenarios';
import { RandomScenarioLoader } from '@components/game/RandomScenarioLoader';
import { DialogueContainer } from '@components/game/DialogueContainer';
import { PlayerInput } from '@components/game/PlayerInput';
import { StatChangeAnimation } from '@components/game/StatChangeAnimation';
import { EndingScreen } from '@components/game/EndingScreen';
import { QuestionAnswerPanel } from '@components/game/QuestionAnswerPanel';
import type { ChatMessage, ScenarioConfig, AnswerValidationResult, AnswerState } from '@types/game';
import { getScenarioIntro } from '@config/scenarios';

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

  // 防止剧本初始化逻辑重复执行
  const isScenarioInitialized = useRef(false);

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
    // 重置剧本初始化标志，允许新剧本的初始化逻辑执行
    isScenarioInitialized.current = false;
    setIsRandomLoading(true);
  }, [resetGame]);

  // 处理答案提交
  const handleAnswerSubmit = useCallback((type: 'emperor' | 'dynasty', answer: string) => {
    console.log(`[App] 提交${type === 'emperor' ? '皇帝' : '朝代'}答案:`, answer);
    submitAnswer(type, answer);
  }, [submitAnswer]);

  // 皇帝答案别名映射（支持多种正确答案）
  const emperorAliasMap: Record<string, string[]> = {
    // 明朝
    '朱由检': ['崇祯', '崇祯帝', '明思宗', '思宗', '庄烈帝', '怀宗'],
    '朱元璋': ['太祖', '明太祖', '洪武', '洪武帝'],
    '朱棣': ['明成祖', '成祖', '永乐', '永乐帝', '太宗'],
    '朱允炆': ['建文', '建文帝', '惠帝'],
    '朱祁镇': ['英宗', '明英宗', '正统', '天顺'],
    '朱祁钰': ['景泰', '景泰帝', '代宗'],
    '朱厚熜': ['嘉靖', '嘉靖帝', '世宗'],
    '朱载坖': ['隆庆', '隆庆帝', '穆宗'],
    '朱翊钧': ['万历', '万历帝', '神宗'],
    '朱常洛': ['泰昌', '泰昌帝', '光宗'],
    '朱由校': ['天启', '天启帝', '熹宗'],
    // 秦朝
    '嬴政': ['秦始皇', '始皇', '秦王', '赵政'],
    '胡亥': ['秦二世', '二世', '嬴胡亥'],
    // 汉朝
    '刘邦': ['汉高祖', '高祖', '汉太祖', '沛公'],
    '刘彻': ['汉武帝', '武帝', '世宗'],
    '刘秀': ['汉光武帝', '光武帝', '世祖', '汉世祖'],
    '刘备': ['昭烈帝', '先主', '汉中王'],
    '刘禅': ['后主', '安乐公'],
    '刘协': ['汉献帝', '献帝', '山阳公'],
    // 三国
    '曹操': ['魏武帝', '武帝', '曹孟德'],
    '曹丕': ['魏文帝', '文帝'],
    '孙权': ['吴大帝', '大帝', '大皇帝'],
    '孙策': ['长沙桓王', '伯符'],
    // 晋朝
    '司马炎': ['晋武帝', '武帝'],
    '司马睿': ['晋元帝', '元帝'],
    // 隋朝
    '杨坚': ['隋文帝', '文帝', '隋高祖'],
    '杨广': ['隋炀帝', '炀帝'],
    // 唐朝
    '李渊': ['唐高祖', '高祖'],
    '李世民': ['唐太宗', '太宗', '秦王'],
    '李治': ['唐高宗', '高宗'],
    '武则天': ['则天皇后', '武后', '女皇'],
    '李隆基': ['唐玄宗', '玄宗', '唐明皇'],
    '李适': ['唐德宗', '德宗'],
    '李纯': ['唐宪宗', '宪宗'],
    '李晔': ['唐昭宗', '昭宗'],
    // 宋朝
    '赵匡胤': ['宋太祖', '太祖'],
    '赵光义': ['宋太宗', '太宗', '赵匡义'],
    '赵恒': ['宋真宗', '真宗'],
    '赵祯': ['宋仁宗', '仁宗'],
    '赵顼': ['宋神宗', '神宗'],
    '赵煦': ['宋哲宗', '哲宗'],
    '赵佶': ['宋徽宗', '徽宗'],
    '赵构': ['宋高宗', '高宗'],
    '赵昚': ['宋孝宗', '孝宗'],
    '赵扩': ['宋宁宗', '宁宗'],
    // 元朝
    '忽必烈': ['元世祖', '世祖'],
    '铁穆耳': ['元成宗', '成宗'],
    // 清朝
    '皇太极': ['清太宗', '太宗'],
    '福临': ['顺治', '顺治帝', '清世祖'],
    '玄烨': ['康熙', '康熙帝', '清圣祖'],
    '胤禛': ['雍正', '雍正帝', '清世宗'],
    '弘历': ['乾隆', '乾隆帝', '清高宗'],
    '颙琰': ['嘉庆', '嘉庆帝', '清仁宗'],
    '旻宁': ['道光', '道光帝', '清宣宗'],
    '奕詝': ['咸丰', '咸丰帝', '清文宗'],
    '载淳': ['同治', '同治帝', '清穆宗'],
    '载湉': ['光绪', '光绪帝', '清德宗'],
    '溥仪': ['宣统', '宣统帝', '清逊帝'],
  };

  // 朝代答案别名映射
  const dynastyAliasMap: Record<string, string[]> = {
    '秦': ['秦朝', '大秦', '秦代'],
    '汉': ['汉朝', '大汉', '西汉', '东汉', '汉代'],
    '三国': ['三国时期', '三国时代'],
    '晋': ['晋朝', '西晋', '东晋', '晋代'],
    '南北朝': ['南北朝时期'],
    '隋': ['隋朝', '隋代', '大隋'],
    '唐': ['唐朝', '大唐', '唐代'],
    '五代': ['五代十国', '五代时期'],
    '宋': ['宋朝', '大宋', '北宋', '南宋', '宋代'],
    '元': ['元朝', '大元', '元代', '蒙古'],
    '明': ['明朝', '大明', '明代'],
    '清': ['清朝', '大清', '清代', '满清'],
  };

  // 验证答案（支持别名系统）
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

    // 获取别名列表
    const aliasMap = type === 'emperor' ? emperorAliasMap : dynastyAliasMap;
    const aliases = aliasMap[correctAnswer] || [];

    // 标准化用户输入
    const normalizedAnswer = answer.trim().toLowerCase().replace(/[\s·]/g, '');

    // 检查是否匹配正确答案或任何别名
    const isCorrect = aliases.some(alias => {
      const normalizedAlias = alias.toLowerCase().replace(/[\s·]/g, '');
      const normalizedCorrectName = correctAnswer.toLowerCase().replace(/[\s·]/g, '');

      return normalizedAnswer === normalizedAlias ||
        normalizedAnswer === normalizedCorrectName ||
        normalizedAlias.includes(normalizedAnswer) ||
        normalizedAnswer.includes(normalizedAlias);
    }) || normalizedAnswer === correctAnswer.toLowerCase().replace(/[\s·]/g, '');

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

        {/* 次要按钮组 */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            onClick={() => {}}
            className="py-3 px-3 sm:px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg border border-slate-600 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 text-sm"
          >
            <span>📊</span>
            <span className="hidden sm:inline">游戏统计</span>
            <span className="sm:hidden">统计</span>
          </button>
          <button
            onClick={() => {}}
            className="py-3 px-3 sm:px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg border border-slate-600 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 text-sm"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">游戏设置</span>
            <span className="sm:hidden">设置</span>
          </button>
        </div>
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

          {/* 回答问题按钮 - 只在桌面端显示，移动端放到底部 */}
          {(answerState.emperorCorrect !== true || answerState.dynastyCorrect !== true) && (
            <button
              onClick={() => setAnsweringQuestions(true)}
              className="hidden sm:block ml-2 px-3 py-1 bg-amber-600/80 hover:bg-amber-500 text-amber-100 rounded border border-amber-500 text-sm font-bold transition-colors"
            >
              答题 ({[answerState.emperorCorrect, answerState.dynastyCorrect].filter(Boolean).length}/2)
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
