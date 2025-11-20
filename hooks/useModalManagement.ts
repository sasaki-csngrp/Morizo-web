import { useState } from 'react';
import { RecipeCandidate } from '@/types/menu';

/**
 * レシピ一覧モーダルで選択に必要な情報
 */
export interface RecipeListModalSelectionInfo {
  taskId: string;
  sseSessionId: string;
  onSelect: (selection: number, selectionResult?: any) => void;
  currentStage?: 'main' | 'sub' | 'soup' | 'other';
  onNextStageRequested?: () => void;
  isLoading?: boolean;
}

/**
 * モーダル管理フック
 * レシピ詳細モーダル、レシピ一覧モーダル、履歴パネル、在庫パネルの状態を管理
 */
export function useModalManagement() {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeCandidate | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listModalCandidates, setListModalCandidates] = useState<RecipeCandidate[]>([]);
  const [listModalSelectionInfo, setListModalSelectionInfo] = useState<RecipeListModalSelectionInfo | null>(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isInventoryPanelOpen, setIsInventoryPanelOpen] = useState(false);

  const handleViewDetails = (recipe: RecipeCandidate) => {
    setSelectedRecipe(recipe);
    setIsDetailModalOpen(true);
  };

  const handleViewList = (
    candidates: RecipeCandidate[],
    selectionInfo?: RecipeListModalSelectionInfo
  ) => {
    setListModalCandidates(candidates);
    setListModalSelectionInfo(selectionInfo || null);
    setIsListModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRecipe(null);
  };

  const closeListModal = () => {
    setIsListModalOpen(false);
    setListModalCandidates([]);
    setListModalSelectionInfo(null);
  };

  const closeHistoryPanel = () => {
    setIsHistoryPanelOpen(false);
  };

  const openHistoryPanel = () => {
    setIsHistoryPanelOpen(true);
  };

  const closeInventoryPanel = () => {
    setIsInventoryPanelOpen(false);
  };

  const openInventoryPanel = () => {
    setIsInventoryPanelOpen(true);
  };

  return {
    // 詳細モーダル
    isDetailModalOpen,
    selectedRecipe,
    handleViewDetails,
    closeDetailModal,
    // 一覧モーダル
    isListModalOpen,
    listModalCandidates,
    listModalSelectionInfo,
    handleViewList,
    closeListModal,
    // 履歴パネル
    isHistoryPanelOpen,
    openHistoryPanel,
    closeHistoryPanel,
    // 在庫パネル
    isInventoryPanelOpen,
    openInventoryPanel,
    closeInventoryPanel,
  };
}

