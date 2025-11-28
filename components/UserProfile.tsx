'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import InventorySelectionModal from '@/components/InventorySelectionModal'
import OtherProposalSelectionModal from '@/components/OtherProposalSelectionModal'
import { authenticatedFetch } from '@/lib/auth'

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  storage_location: string | null;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

interface UserProfileProps {
  onOpenHistory?: () => void;
  onOpenInventory?: () => void;
  onRequestMainProposal?: (mainIngredient?: string) => void;
  onRequestOtherProposal?: (message: string) => void;
}

export default function UserProfile({
  onOpenHistory,
  onOpenInventory,
  onRequestMainProposal,
  onRequestOtherProposal,
}: UserProfileProps) {
  const { user, session, signOut, forceSignOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [isInventorySelectionModalOpen, setIsInventorySelectionModalOpen] = useState(false)
  const [isOtherProposalSelectionModalOpen, setIsOtherProposalSelectionModalOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    try {
      const { error } = await signOut()
      if (error) {
        console.warn('通常のログアウトに失敗しました。強制ログアウトを試行します:', error)
        // エラーが発生した場合は強制ログアウトを試行
        await forceSignOut()
        // ページをリロードして状態をリセット
        window.location.reload()
      }
    } catch (error) {
      console.error('ログアウトエラー:', error)
      // 例外が発生した場合も強制ログアウトを試行
      try {
        await forceSignOut()
        window.location.reload()
      } catch (forceError) {
        console.error('強制ログアウトも失敗しました:', forceError)
        setLoading(false)
      }
    } finally {
      // エラーがなければ通常通り終了
      if (!loading) {
        setLoading(false)
      }
    }
  }

  const handleCopyToken = async () => {
    try {
      if (session?.access_token) {
        await navigator.clipboard.writeText(session.access_token)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000) // 2秒後にメッセージを非表示
      }
    } catch (error) {
      console.error('トークンコピーエラー:', error)
      // フォールバック: テキストエリアを使用
      const textArea = document.createElement('textarea')
      textArea.value = session?.access_token || ''
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const handleOpenMainProposal = () => {
    setIsInventorySelectionModalOpen(true)
  }

  const handleInventorySelect = (selectedItem: InventoryItem | null) => {
    setIsInventorySelectionModalOpen(false)
    if (onRequestMainProposal) {
      // 選択された在庫がある場合はアイテム名を主要食材として使用
      const mainIngredient = selectedItem ? selectedItem.item_name : undefined
      onRequestMainProposal(mainIngredient)
    }
  }

  const handleOpenOtherProposal = () => {
    setIsOtherProposalSelectionModalOpen(true)
  }

  const handleOtherProposalSelect = (message: string) => {
    setIsOtherProposalSelectionModalOpen(false)
    if (onRequestOtherProposal) {
      onRequestOtherProposal(message)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const response = await authenticatedFetch('/api/user/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'アカウント削除に失敗しました' }))
        throw new Error(errorData.error || errorData.details || 'アカウント削除に失敗しました')
      }

      const data = await response.json()
      
      if (data.success) {
        // 削除成功後、ログアウト処理を実行
        await forceSignOut()
        // ページをリロードしてログイン画面に遷移
        window.location.href = '/'
      } else {
        throw new Error(data.message || 'アカウント削除に失敗しました')
      }
    } catch (error) {
      console.error('アカウント削除エラー:', error)
      alert(error instanceof Error ? error.message : 'アカウント削除に失敗しました')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      {/* ユーザーアイコンとボタン */}
      <div className="flex items-center justify-end gap-2 mb-4">
        {/* 主菜提案ボタン */}
        {onRequestMainProposal && (
          <button
            onClick={handleOpenMainProposal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="主菜提案を開始"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span className="text-sm font-medium">主菜提案</span>
          </button>
        )}

        {/* その他提案ボタン */}
        {onRequestOtherProposal && (
          <button
            onClick={handleOpenOtherProposal}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="その他提案を開始"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span className="text-sm font-medium">その他提案</span>
          </button>
        )}

        {/* 在庫一覧ボタン */}
        {onOpenInventory && (
          <button
            onClick={onOpenInventory}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="在庫一覧を表示"
          >
            <svg
              className="w-5 h-5 text-gray-700 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">在庫</span>
          </button>
        )}

        {/* 履歴ボタン */}
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="レシピ履歴を表示"
          >
            <svg
              className="w-5 h-5 text-gray-700 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">履歴</span>
          </button>
        )}

        {/* ユーザーアイコン */}
        <button
          onClick={() => setShowProfileModal(true)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="プロフィールを表示"
        >
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
        </button>
      </div>

      {/* プロフィールモーダル */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* オーバーレイ */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowProfileModal(false)}
            aria-hidden="true"
          />
          
          {/* モーダルコンテンツ */}
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 text-center">
            {/* ヘッダー */}
            <div className="flex items-center justify-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                プロフィール
              </h2>
            </div>
            
            {/* プロフィール情報 */}
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                ログイン中
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>

            {/* ボタン一覧（縦並び） */}
            <div className="space-y-3 mb-4">
              {/* トークンをコピー */}
              <button
                onClick={handleCopyToken}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                トークンをコピー
              </button>

              {/* ログアウト */}
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {loading ? 'ログアウト中...' : 'ログアウト'}
              </button>

              {/* アカウント削除 */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="w-full bg-red-800 hover:bg-red-900 disabled:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {isDeleting ? '削除中...' : 'アカウントを削除'}
              </button>

              {/* 閉じる */}
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                閉じる
              </button>
            </div>

            {/* コピー成功メッセージ */}
            {copySuccess && (
              <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                コピーしました！
              </div>
            )}
          </div>
        </div>
      )}

      {/* 在庫選択モーダル */}
      <InventorySelectionModal
        isOpen={isInventorySelectionModalOpen}
        onClose={() => setIsInventorySelectionModalOpen(false)}
        onSelect={handleInventorySelect}
      />

      {/* その他提案選択モーダル */}
      <OtherProposalSelectionModal
        isOpen={isOtherProposalSelectionModalOpen}
        onClose={() => setIsOtherProposalSelectionModalOpen(false)}
        onSelect={handleOtherProposalSelect}
      />

      {/* アカウント削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* オーバーレイ */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
            aria-hidden="true"
          />
          
          {/* 確認ダイアログ */}
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              アカウントを削除しますか？
            </h3>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                この操作は取り消せません。すべてのデータが削除されます。
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc list-inside space-y-1">
                <li>在庫データ</li>
                <li>レシピ履歴</li>
                <li>ユーザー設定</li>
                <li>その他のすべてのデータ</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}