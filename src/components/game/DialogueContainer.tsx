/**
 * 对话容器组件
 * 显示游戏对话历史，包含NPC对话和玩家回复
 */

import { useRef, useEffect } from 'react';
import type { ChatMessage, ScenarioConfig } from '@types/game';
import { DialogueBubble, NPCBubble, PlayerBubble, SystemBubble } from './DialogueBubble';

interface DialogueContainerProps {
  messages: ChatMessage[];
  currentScenario: ScenarioConfig | null;
  isLoading?: boolean;
}

/**
 * 开场旁白生成
 */
function generateOpeningNarration(scenario: ScenarioConfig): string {
  return `${scenario.emperor.dynasty}，${scenario.setting.time}。${scenario.setting.atmosphere}`;
}

export function DialogueContainer({
  messages,
  currentScenario,
  isLoading = false,
}: DialogueContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // 获取NPC信息
  const getNPCInfo = (npcId?: string, npcName?: string) => {
    if (!currentScenario) return { name: npcName || '宫中侍从', avatar: '👤' };

    const npc = currentScenario.npcs.find((n) => n.id === npcId);
    if (npc) {
      return { name: npc.name, avatar: npc.avatar || '👤' };
    }

    return { name: npcName || '宫中侍从', avatar: '👤' };
  };

  return (
    <div className="dialogue-container" ref={containerRef}>
      {/* 开场旁白 */}
      {currentScenario && messages.length === 0 && (
        <SystemBubble content={generateOpeningNarration(currentScenario)} />
      )}

      {/* 对话历史 */}
      {messages.map((message, index) => {
        switch (message.role) {
          case 'user':
            return <PlayerBubble key={message.id || index} message={message} />;

          case 'assistant': {
            const npcInfo = getNPCInfo(message.npcId, message.npcName);
            return (
              <NPCBubble
                key={message.id || index}
                message={message}
                npcAvatar={npcInfo.avatar}
                npcName={npcInfo.name}
              />
            );
          }

          case 'system':
            return <SystemBubble key={message.id || index} content={message.content} />;

          default:
            return null;
        }
      })}

      {/* 加载中提示 */}
      {isLoading && (
        <div className="loading-indicator">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="loading-text">圣上正在思索...</span>
        </div>
      )}

      {/* 底部占位 */}
      <div className="dialogue-end-spacer"></div>
    </div>
  );
}
