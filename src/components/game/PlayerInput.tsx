/**
 * 玩家输入组件
 * 包含文本输入框和玉玺发送按钮
 */

import { useState, useRef, useCallback } from 'react';

interface PlayerInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
}

/**
 * 快捷回复选项
 */
const QUICK_REPLIES = [
  '朕知道了',
  '此事需从长计议',
  '传朕旨意',
  '退下吧',
];

export function PlayerInput({
  onSend,
  isLoading = false,
  placeholder = '朕意如何...',
  maxLength = 500,
}: PlayerInputProps) {
  const [content, setContent] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * 处理发送消息
   */
  const handleSend = useCallback(() => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isLoading) return;

    onSend(trimmedContent);
    setContent('');
    setShowQuickReplies(false);

    // 重置textarea高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [content, isLoading, onSend]);

  /**
   * 处理快捷键
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl/Command + Enter 发送
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  /**
   * 处理文本变化
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setContent(value);

      // 自动调整高度
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [maxLength]);

  /**
   * 选择快捷回复
   */
  const selectQuickReply = useCallback((reply: string) => {
    setContent(reply);
    setShowQuickReplies(false);
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="bg-slate-900 border-t border-slate-800 p-2 sm:p-3">
      {/* 快捷回复选项 */}
      {showQuickReplies && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-800/50 rounded-lg">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              onClick={() => selectQuickReply(reply)}
              className="px-2 py-1 text-xs sm:text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div className="flex items-end gap-2">
        <button
          onClick={() => setShowQuickReplies(!showQuickReplies)}
          title="快捷回复"
          className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors text-base sm:text-lg"
        >
          💬
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="w-full min-h-[40px] sm:min-h-[44px] max-h-[120px] px-3 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-sm sm:text-base resize-none focus:outline-none focus:border-amber-600/50 disabled:opacity-50"
          />
          {/* 字数统计 - 移动端显示在textarea内 */}
          <span className="absolute bottom-1 right-2 text-[10px] sm:hidden text-slate-600">
            {content.length}/{maxLength}
          </span>
        </div>

        <button
          onClick={handleSend}
          disabled={!content.trim() || isLoading}
          title="发送 (Ctrl+Enter)"
          className={`shrink-0 h-9 sm:h-11 px-3 sm:px-4 rounded-lg font-bold text-sm sm:text-base flex items-center justify-center gap-1 transition-all ${
            !content.trim() || isLoading
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-600/30'
          }`}
        >
          {isLoading ? (
            <span className="animate-spin text-lg">⟳</span>
          ) : (
            <>
              <span className="hidden sm:inline text-base">🧧</span>
              <span className="hidden sm:inline">下旨</span>
              <span className="sm:hidden text-lg">📤</span>
            </>
          )}
        </button>
      </div>

      {/* 字数统计和快捷键提示 - 桌面端显示 */}
      <div className="hidden sm:flex items-center justify-between mt-1.5 px-1 text-xs text-slate-500">
        <span>
          {content.length}/{maxLength} 字
        </span>
        <span className="hidden lg:inline">Ctrl+Enter 发送</span>
      </div>
    </div>
  );
}

