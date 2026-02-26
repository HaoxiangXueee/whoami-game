/**
 * 对话气泡组件
 * 显示NPC对话和玩家回复
 */

import type { ChatMessage } from '@types/game';

interface DialogueBubbleProps {
  message: ChatMessage;
  npcAvatar?: string;
  npcName?: string;
}

/**
 * 格式化时间戳
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * NPC对话气泡
 */
export function NPCBubble({ message, npcAvatar, npcName }: DialogueBubbleProps) {
  const displayName = npcName || message.npcName || '宫中侍从';
  const avatar = npcAvatar || '👤';

  return (
    <div className="dialogue-bubble npc-bubble">
      <div className="bubble-avatar">
        <span className="avatar-emoji">{avatar}</span>
      </div>
      <div className="bubble-content">
        <div className="bubble-header">
          <span className="npc-name">{displayName}</span>
          <span className="message-time">{formatTime(message.timestamp)}</span>
        </div>
        <div className="bubble-text">
          {message.content}
        </div>
      </div>
    </div>
  );
}

/**
 * 玩家对话气泡
 */
export function PlayerBubble({ message }: DialogueBubbleProps) {
  return (
    <div className="dialogue-bubble player-bubble">
      <div className="bubble-content">
        <div className="bubble-header">
          <span className="player-title">朕</span>
          <span className="message-time">{formatTime(message.timestamp)}</span>
        </div>
        <div className="bubble-text">
          {message.content}
        </div>
      </div>
      <div className="bubble-avatar">
        <span className="avatar-emoji">🐉</span>
      </div>
    </div>
  );
}

/**
 * 系统/旁白气泡
 */
export function SystemBubble({ content }: { content: string }) {
  return (
    <div className="dialogue-bubble system-bubble">
      <div className="system-content">
        <span className="system-icon">📜</span>
        <span className="system-text">{content}</span>
      </div>
    </div>
  );
}

/**
 * 智能对话气泡（根据消息类型自动选择）
 */
export function DialogueBubble({ message, npcAvatar, npcName }: DialogueBubbleProps) {
  switch (message.role) {
    case 'user':
      return <PlayerBubble message={message} />;
    case 'assistant':
      return <NPCBubble message={message} npcAvatar={npcAvatar} npcName={npcName} />;
    case 'system':
      return <SystemBubble content={message.content} />;
    default:
      return <NPCBubble message={message} npcAvatar={npcAvatar} npcName={npcName} />;
  }
}
