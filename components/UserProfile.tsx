'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface UserProfileProps {
  onOpenHistory?: () => void;
  onOpenInventory?: () => void;
}

export default function UserProfile({
  onOpenHistory,
  onOpenInventory,
}: UserProfileProps) {
  const { user, session, signOut, forceSignOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

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

  return (
    <>
      {/* ユーザーアイコンとボタン */}
      <div className="flex items-center justify-end gap-2 mb-4">
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
    </>
  )
}