'use client';

import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/auth';

interface RecipeRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: {
    history_id: string;
    title: string;
    url?: string;
    image_url?: string;
    rating?: number;
    notes?: string;
  } | null;
  onSave: (rating: number | null, notes: string) => void;
}

const RecipeRatingModal: React.FC<RecipeRatingModalProps> = ({
  isOpen,
  onClose,
  recipe,
  onSave,
}) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モーダルが開いたときにレシピデータを初期化
  useEffect(() => {
    if (isOpen && recipe) {
      setSelectedRating(recipe.rating || null);
      setNotes(recipe.notes || '');
      setError(null);
    } else {
      // モーダルが閉じられたときに状態をリセット
      setSelectedRating(null);
      setNotes('');
      setError(null);
    }
  }, [isOpen, recipe]);

  const handleSave = async () => {
    if (!recipe) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await authenticatedFetch(
        `/api/menu/history/${recipe.history_id}/rating`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rating: selectedRating,
            notes: notes.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result) {
        onSave(selectedRating, notes.trim());
        onClose();
      } else {
        throw new Error('評価の保存に失敗しました');
      }
    } catch (err) {
      console.error('Failed to save rating:', err);
      setError(err instanceof Error ? err.message : '評価の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageClick = () => {
    if (recipe?.url) {
      window.open(recipe.url, '_blank');
    }
  };

  if (!isOpen || !recipe) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            レシピの評価を選択してください
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
            disabled={isSaving}
          >
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">⚠️ {error}</p>
            </div>
          )}

          {/* レシピ画像 */}
          {recipe.image_url && (
            <div className="mb-6">
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-56 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                onClick={handleImageClick}
                title="クリックでレシピページを開く"
              />
            </div>
          )}

          {/* レシピタイトル */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white text-center">
              {recipe.title.replace(/^(主菜|副菜|汁物):\s*/, '')}
            </h3>
          </div>

          {/* 説明文 */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              このレシピに対するあなたの「好き」の度合いを選んでください。
            </p>
          </div>

          {/* 評価選択 */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setSelectedRating(5)}
                disabled={isSaving}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  selectedRating === 5
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 bg-white dark:bg-gray-800'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="text-5xl mb-2">❤️</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">めっちゃ好き</span>
              </button>
              <button
                onClick={() => setSelectedRating(3)}
                disabled={isSaving}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  selectedRating === 3
                    ? 'border-gray-400 bg-gray-50 dark:bg-gray-700 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="text-5xl mb-2">🤍</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">普通</span>
              </button>
              <button
                onClick={() => setSelectedRating(1)}
                disabled={isSaving}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  selectedRating === 1
                    ? 'border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-700 bg-white dark:bg-gray-800'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="text-5xl mb-2">💔</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">好きじゃない</span>
              </button>
            </div>
          </div>

          {/* コメント入力 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              コメント（任意）
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSaving}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              placeholder="コメントを入力してください..."
            />
          </div>
        </div>

        {/* フッター */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
            disabled={isSaving}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
          >
            {isSaving ? '保存中...' : '登録'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeRatingModal;

