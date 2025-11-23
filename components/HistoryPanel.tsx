'use client';

import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/auth';
import IngredientDeleteModal from './IngredientDeleteModal';
import RecipeRatingModal from './RecipeRatingModal';

interface HistoryRecipe {
  category: string | null;
  title: string;
  source: string;
  url?: string;
  history_id: string;
  duplicate_warning?: string;
  rating?: number;
  notes?: string;
  image_url?: string;
}

interface HistoryEntry {
  date: string;
  recipes: HistoryRecipe[];
  ingredients_deleted?: boolean; // 食材削除済みフラグ（オプショナル）
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [days, setDays] = useState(14);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<HistoryRecipe | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, days, categoryFilter]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const url = `/api/menu/history?days=${days}${categoryFilter ? `&category=${categoryFilter}` : ''}`;
      const response = await authenticatedFetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setHistory(result.data);
      }
    } catch (error) {
      console.error('History load failed:', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecipeDelete = async (e: React.MouseEvent, recipe: HistoryRecipe) => {
    e.stopPropagation(); // レシピクリックイベントの伝播を防ぐ
    
    if (!confirm(`「${recipe.title.replace(/^(主菜|副菜|汁物):\s*/, '')}」を削除しますか？`)) {
      return;
    }
    
    try {
      const response = await authenticatedFetch(`/api/menu/history/${recipe.history_id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // 削除成功後、履歴を再読み込み
      await loadHistory();
    } catch (error) {
      console.error('Recipe delete failed:', error);
      alert('削除に失敗しました');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`;
  };

  const getCategoryIcon = (category: string | null) => {
    if (category === 'main') return '🍖';
    if (category === 'sub') return '🥗';
    if (category === 'soup') return '🍲';
    return '🍽️';
  };

  const handleDeleteClick = (date: string) => {
    setSelectedDate(date);
    setDeleteModalOpen(true);
  };

  const handleDeleteComplete = () => {
    // 削除完了後、該当日付のingredients_deletedフラグを更新
    setHistory((prevHistory) =>
      prevHistory.map((entry) =>
        entry.date === selectedDate
          ? { ...entry, ingredients_deleted: true }
          : entry
      )
    );
    // 履歴を再読み込み（オプション）
    // loadHistory();
  };

  const handleRecipeClick = (recipe: HistoryRecipe) => {
    setSelectedRecipe(recipe);
    setIsRatingModalOpen(true);
  };

  const handleRatingSave = async (rating: number | null, notes: string) => {
    // 履歴を再読み込みして最新の評価・コメントを反映
    await loadHistory();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            📅 献立履歴
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        {/* フィルター */}
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
              期間: {days === 0 ? 'それ以前' : `${days}日間`}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setDays(7)}
                className={`px-3 py-1 rounded text-sm ${
                  days === 7
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                7日
              </button>
              <button
                onClick={() => setDays(14)}
                className={`px-3 py-1 rounded text-sm ${
                  days === 14
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                14日
              </button>
              <button
                onClick={() => setDays(30)}
                className={`px-3 py-1 rounded text-sm ${
                  days === 30
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                30日
              </button>
              <button
                onClick={() => setDays(0)}
                className={`px-3 py-1 rounded text-sm ${
                  days === 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                それ以前
              </button>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
              カテゴリ
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">全て</option>
              <option value="main">主菜</option>
              <option value="sub">副菜</option>
              <option value="soup">汁物</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">読み込み中...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            履歴がありません
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400">
                    📆 {formatDate(entry.date)}
                  </h3>
                  {entry.ingredients_deleted ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      削除済み
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDeleteClick(entry.date)}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      食材削除
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {entry.recipes.map((recipe, recipeIndex) => (
                    <div
                      key={recipeIndex}
                      onClick={() => handleRecipeClick(recipe)}
                      className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                        recipe.duplicate_warning
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start">
                        <span className="text-xl mr-2">
                          {getCategoryIcon(recipe.category)}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {recipe.title.replace(/^(主菜|副菜|汁物):\s*/, '')}
                            </p>
                            <div className="flex items-center gap-2">
                              {/* 評価アイコン */}
                              {recipe.rating && (
                                <span 
                                  className={`text-lg ${
                                    recipe.rating === 5 
                                      ? 'text-red-500' 
                                      : recipe.rating === 3 
                                      ? 'text-gray-400' 
                                      : 'text-purple-600 dark:text-purple-500'
                                  }`} 
                                  title="評価済み"
                                >
                                  {recipe.rating === 5 ? '❤️' : recipe.rating === 3 ? '🩶' : '💔'}
                                </span>
                              )}
                              {/* コメントアイコン */}
                              {recipe.notes && (
                                <span className="text-blue-500 text-lg" title="コメントあり">
                                  💬
                                </span>
                              )}
                              {/* 削除ボタン（それ以前選択時のみ表示） */}
                              {days === 0 && (
                                <button
                                  onClick={(e) => handleRecipeDelete(e, recipe)}
                                  className="text-red-500 hover:text-red-700 text-lg px-1"
                                  title="削除"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                          {recipe.duplicate_warning && (
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                              ⚠️ 重複警告（{recipe.duplicate_warning}）
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 食材削除モーダル */}
      <IngredientDeleteModal
        date={selectedDate}
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDeleteComplete={handleDeleteComplete}
      />

      {/* 評価モーダル */}
      <RecipeRatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        recipe={selectedRecipe}
        onSave={handleRatingSave}
      />
    </div>
  );
};

export default HistoryPanel;

