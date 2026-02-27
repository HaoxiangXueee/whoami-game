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
import { getScenarioIntro } from '@config/scenarios';
import type { ChatMessage, ScenarioConfig } from '@types/game';

function App() {
  const {
    status,
    stats,
    currentScenario,
    chatHistory,
    isLoading,
    currentTurn,
    maxTurns,
    resetGame,
    setScenario,
    addMessage,
    setLoading,
    updateStats,
    nextTurn,
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

  // v1.1: 处理开始游戏 - 显示穿越动画
  const handleStartGame = () => {
    setIsRandomLoading(true);
  };

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
          // TODO: 处理游戏结束
          console.log('[App] 游戏结束:', response.ending_type);
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

  // 渲染游戏中
  const renderPlaying = () => {
    if (!currentScenario) return null;

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

        {/* 输入区域 */}
        <PlayerInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          placeholder="朕意如何..."
          maxLength={500}
        />
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
    </div>
  );
}

export default App;
