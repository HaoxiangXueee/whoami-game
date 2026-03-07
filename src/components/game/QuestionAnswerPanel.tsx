/**
 * 问题与答案面板组件
 * 玩家可以在回合耗尽前或耗尽后回答一个问题：你是谁？
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { AnswerState, AnswerValidationResult } from '@/types/game';

interface QuestionAnswerPanelProps {
  answerState: AnswerState;
  isForced: boolean;
  maxAttempts?: number;
  onSubmitAnswer: (answer: string) => void;
  onValidateAnswer?: (answer: string) => Promise<AnswerValidationResult>;
  onComplete?: (finalState: AnswerState) => void;
  onClose?: () => void;
}

export function QuestionAnswerPanel({
  answerState,
  isForced,
  maxAttempts = 3,
  onSubmitAnswer,
  onValidateAnswer,
  onComplete,
  onClose,
}: QuestionAnswerPanelProps) {
  const [input, setInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [feedback, setFeedback] = useState<string>('');

  const { attempts, correct } = answerState;

  const maxAttemptsValue = maxAttempts || 3;

  const isDone = correct === true || attempts >= maxAttemptsValue;

  // 自动检测：答对后立即触发结算
  useEffect(() => {
    if (correct === true) {
      console.log('[QuestionAnswerPanel] 答对了，自动触发结算');
      onComplete?.(answerState);
    }
  }, [correct, onComplete, answerState]);

  const handleSubmit = async () => {
    if (!input.trim() || validating || isDone) return;

    setValidating(true);
    onSubmitAnswer(input.trim());

    if (onValidateAnswer) {
      const result = await onValidateAnswer(input.trim());
      setFeedback(result.feedback);
    } else {
      setFeedback(`已提交: ${input.trim()}`);
    }

    setValidating(false);
    setInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 rounded-xl shadow-2xl border border-slate-600">
        {/* 头部 */}
        <div className="p-6 border-b border-slate-600 bg-gradient-to-r from-amber-900/30 to-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-amber-400">
                {isForced ? '时间已到' : '身份确认'}
              </h2>
              <p className="mt-1 text-slate-400 text-sm">
                {isForced
                  ? '回合已经耗尽，现在必须回答这个问题...'
                  : '在回合耗尽前，你可以随时尝试回答这个问题'}
              </p>
            </div>
            {/* 关闭按钮 - 仅在非强制模式下显示 */}
            {!isForced && onClose && (
              <button
                onClick={onClose}
                className="ml-4 px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors text-xl"
                title="关闭"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 问题区域 */}
        <div className="p-6">
          {/* 皇帝问题 */}
          <div className={`p-4 rounded-lg border ${correct === true ? 'bg-green-900/30 border-green-600' : correct === false && isDone ? 'bg-red-900/30 border-red-600' : 'bg-slate-700/50 border-slate-600'}`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-slate-200">你是谁？</h3>
              {correct === true && <span className="text-green-400 text-sm">✓ 正确</span>}
              {correct === false && isDone && <span className="text-red-400 text-sm">✗ 错误</span>}
            </div>

            {!isDone ? (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="请输入皇帝姓名..."
                    disabled={validating}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!input.trim() || validating}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 text-white rounded font-medium transition-colors"
                  >
                    {validating ? '验证中...' : '提交'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  剩余机会: {maxAttemptsValue - attempts}/{maxAttemptsValue} | 已尝试 {attempts} 次
                </p>

                {/* 反馈显示 */}
                {feedback && (
                  <div className={`mt-3 p-3 rounded ${feedback.includes('正确') ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                    {feedback}
                  </div>
                )}
              </>
            ) : (
              <div className="py-2 text-center">
                {correct === true ? (
                  <div className="text-green-400">
                    <div className="font-semibold">回答正确！✓</div>
                    <div className="text-sm mt-1 text-green-300">正确答案：{answerState.guess}</div>
                  </div>
                ) : (
                  <div className="text-red-400">
                    <div className="font-semibold">回答错误</div>
                    <div className="text-sm mt-1 text-red-300">机会已用尽</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部说明 */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-500">
              <span className="text-amber-500">💡</span> 提示：可以在对话中收集线索
            </div>
            {isDone && (
              <button
                onClick={() => onComplete?.(answerState)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
              >
                确认结束
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default QuestionAnswerPanel;
