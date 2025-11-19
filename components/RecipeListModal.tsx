'use client';

import React, { useState } from 'react';
import { RecipeCandidate } from '@/types/menu';
import ImageHandler from './ImageHandler';
import { RecipeListModalSelectionInfo } from '@/hooks/useModalManagement';
import { authenticatedFetch } from '@/lib/auth';

interface RecipeListModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: RecipeCandidate[];
  selectionInfo?: RecipeListModalSelectionInfo | null;
}

const RecipeListModal: React.FC<RecipeListModalProps> = ({
  isOpen,
  onClose,
  candidates,
  selectionInfo
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [showStageConfirmation, setShowStageConfirmation] = useState<boolean>(false);
  const [confirmationData, setConfirmationData] = useState<{
    message: string;
    nextStageName: string;
  } | null>(null);

  // 段階名の表示テキスト
  const stageLabel = selectionInfo?.currentStage === 'main' ? '主菜' : 
                     selectionInfo?.currentStage === 'sub' ? '副菜' : 
                     selectionInfo?.currentStage === 'soup' ? '汁物' : '';

  // 決定ボタンのクリックハンドラー
  const handleConfirm = async () => {
    if (!selectionInfo || selectedIndex === null) return;
    
    // 確認ダイアログが表示されている場合は処理をスキップ
    if (showStageConfirmation) {
      return;
    }
    
    // SSEセッションIDの検証
    if (!selectionInfo.sseSessionId || selectionInfo.sseSessionId === 'unknown') {
      alert('セッション情報が無効です。ページを再読み込みしてください。');
      return;
    }
    
    setIsConfirming(true);
    
    try {
      // バックエンドに選択結果を送信
      const response = await authenticatedFetch('/api/chat/selection', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: selectionInfo.taskId,
          selection: selectedIndex + 1, // 1-based index
          sse_session_id: selectionInfo.sseSessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // 選択結果を親コンポーネントに通知
        selectionInfo.onSelect(selectedIndex + 1, result);
        
        // 確認ステップが必要な場合
        if (result.requires_stage_confirmation && result.confirmation_message && result.next_stage_name) {
          setConfirmationData({
            message: result.confirmation_message,
            nextStageName: result.next_stage_name
          });
          setShowStageConfirmation(true);
          setIsConfirming(false);
          return;
        }
        
        // 確認ステップが不要な場合
        if (result.requires_next_stage && selectionInfo.onNextStageRequested) {
          selectionInfo.onNextStageRequested();
        }
        
        // モーダルを閉じる
        onClose();
      } else {
        throw new Error(result.error || 'Selection failed');
      }
    } catch (error) {
      console.error('Selection failed:', error);
      alert('選択に失敗しました。もう一度お試しください。');
    } finally {
      setIsConfirming(false);
    }
  };

  // モーダルが閉じる時に選択状態をリセット
  const handleClose = () => {
    setSelectedIndex(null);
    setShowStageConfirmation(false);
    setConfirmationData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {stageLabel ? `${stageLabel}の提案（${candidates.length}件）` : `レシピ提案（${candidates.length}件）`}
                </h2>
                {selectionInfo && selectedIndex !== null && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {selectedIndex + 1}番のレシピを選択中
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>
            
            {/* レシピグリッド（3列×2行） */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((candidate, index) => (
                <div 
                  key={index}
                  onClick={() => {
                    if (selectionInfo) {
                      setSelectedIndex(selectedIndex === index ? null : index);
                    }
                  }}
                  className={`bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md p-4 border transition-all duration-200 cursor-pointer ${
                    selectionInfo && selectedIndex === index
                      ? 'border-blue-500 border-2 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:shadow-lg'
                  }`}
                >
                  {/* 画像表示 */}
                  {candidate.urls && candidate.urls.length > 0 && (
                    <div className="mb-3">
                      <ImageHandler
                        urls={candidate.urls}
                        title={candidate.title}
                        onUrlClick={(url) => window.open(url, '_blank')}
                      />
                    </div>
                  )}
                  
                  {/* レシピタイトル */}
                  <div className="flex items-center mb-2">
                    {selectionInfo && (
                      <input
                        type="radio"
                        checked={selectedIndex === index}
                        onChange={() => {
                          setSelectedIndex(selectedIndex === index ? null : index);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mr-2"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {index + 1}. {candidate.title}
                    </h3>
                  </div>
                  
                  {/* 食材情報 */}
                  <div className="mb-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      📋 使用食材
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {candidate.ingredients.join(', ')}
                    </p>
                  </div>
                  
                  {/* 調理時間 */}
                  {candidate.cooking_time && (
                    <div className="mb-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        ⏱️ 調理時間
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {candidate.cooking_time}
                      </p>
                    </div>
                  )}
                  
                  {/* 説明 */}
                  {candidate.description && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                        {candidate.description}
                      </p>
                    </div>
                  )}
                  
                  {/* ソース情報 */}
                  {candidate.source && (
                    <div className="mb-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-white text-xs ${
                        candidate.source === 'llm' 
                          ? 'bg-purple-500' 
                          : candidate.source === 'rag' 
                            ? 'bg-green-500' 
                            : 'bg-blue-500'
                      }`}>
                        {candidate.source === 'llm' ? '斬新提案' : 
                         candidate.source === 'rag' ? '伝統提案' : 'Web検索'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* 段階遷移確認ダイアログ */}
            {showStageConfirmation && confirmationData && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-base font-medium text-gray-800 dark:text-white mb-4 text-center">
                  {confirmationData.message}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setShowStageConfirmation(false);
                      setConfirmationData(null);
                      if (selectionInfo?.onNextStageRequested) {
                        selectionInfo.onNextStageRequested();
                      }
                      handleClose();
                    }}
                    className="px-6 py-3 rounded-lg font-medium transition-colors duration-200 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    進む
                  </button>
                  <button
                    onClick={() => {
                      setShowStageConfirmation(false);
                      setConfirmationData(null);
                      handleClose();
                    }}
                    className="px-6 py-3 rounded-lg font-medium transition-colors duration-200 bg-gray-400 hover:bg-gray-500 text-white"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* フッター */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
              {selectionInfo && (
                <button
                  onClick={handleConfirm}
                  disabled={selectedIndex === null || isConfirming || selectionInfo.isLoading || showStageConfirmation}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    selectedIndex === null || isConfirming || selectionInfo.isLoading || showStageConfirmation
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isConfirming ? '確定中...' : 'このレシピを決定'}
                </button>
              )}
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 rounded-lg transition-colors font-medium"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default RecipeListModal;
