'use client';

import React, { useState } from 'react';

type OtherProposalType = 'other' | 'rice' | 'noodle' | 'pasta';

interface OtherProposalOption {
  id: OtherProposalType;
  label: string;
  message: string;
}

interface OtherProposalSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (message: string) => void;
}

const OTHER_PROPOSAL_OPTIONS: OtherProposalOption[] = [
  {
    id: 'other',
    label: 'その他全体',
    message: 'その他のレシピを教えて',
  },
  {
    id: 'rice',
    label: 'ご飯もの',
    message: 'ご飯もののレシピを教えて',
  },
  {
    id: 'noodle',
    label: '麺もの',
    message: '麺もののレシピを教えて',
  },
  {
    id: 'pasta',
    label: 'パスタもの',
    message: 'パスタもののレシピを教えて',
  },
];

const OtherProposalSelectionModal: React.FC<OtherProposalSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [selectedType, setSelectedType] = useState<OtherProposalType | null>(null);

  const handleSelectType = (type: OtherProposalType) => {
    setSelectedType(type);
  };

  const handleConfirm = () => {
    if (selectedType) {
      const option = OTHER_PROPOSAL_OPTIONS.find(opt => opt.id === selectedType);
      if (option) {
        onSelect(option.message);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* モーダルコンテンツ */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            🍽️ その他提案 - カテゴリを選択
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="閉じる"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 選択肢リスト */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {OTHER_PROPOSAL_OPTIONS.map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedType === option.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="other-proposal-selection"
                  checked={selectedType === option.id}
                  onChange={() => handleSelectType(option.id)}
                  className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800 dark:text-white">
                    {option.label}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedType
              ? '1個のカテゴリを選択中'
              : 'カテゴリを選択してください'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedType}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              選択して提案
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherProposalSelectionModal;

