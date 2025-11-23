'use client';

import { useState } from 'react';
import AuthWrapper from '@/components/AuthWrapper';
import UserProfile from '@/components/UserProfile';
import ChatSection from '@/components/ChatSection';
import VoiceSection from '@/components/VoiceSection';
import HistoryPanel from '@/components/HistoryPanel';
import InventoryPanel from '@/components/InventoryPanel';
import { RecipeModalResponsive } from '../components/RecipeModal';
import { ChatMessage } from '@/types/chat';
import { authenticatedFetch } from '@/lib/auth';
import { generateSSESessionId } from '@/lib/session-manager';

export default function Home() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isTextChatLoading, setIsTextChatLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalResponse, setModalResponse] = useState('');
  const [modalResult, setModalResult] = useState<unknown>(undefined);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isInventoryPanelOpen, setIsInventoryPanelOpen] = useState(false);



  // レシピモーダルを開く関数
  const openRecipeModal = (response: string, result?: unknown) => {
    setModalResponse(response);
    setModalResult(result);
    setModalOpen(true);
  };

  // レシピモーダルを閉じる関数
  const closeRecipeModal = () => {
    setModalOpen(false);
    setModalResponse('');
    setModalResult(undefined);
  };

  // 履歴パネル管理
  const openHistoryPanel = () => setIsHistoryPanelOpen(true);
  const closeHistoryPanel = () => setIsHistoryPanelOpen(false);

  // 在庫パネル管理
  const openInventoryPanel = () => setIsInventoryPanelOpen(true);
  const closeInventoryPanel = () => setIsInventoryPanelOpen(false);

  // 主菜提案リクエスト処理
  const handleRequestMainProposal = async (mainIngredient?: string) => {
    // 主菜提案メッセージを生成
    const message = mainIngredient 
      ? `${mainIngredient}の主菜を5件提案して`
      : '主菜を5件提案して';

    await sendChatMessage(message);
  };

  // その他提案リクエスト処理
  const handleRequestOtherProposal = async (message: string) => {
    await sendChatMessage(message);
  };

  // チャットメッセージ送信の共通処理
  const sendChatMessage = async (message: string) => {
    // ユーザーメッセージを追加
    setChatMessages(prev => [...prev, { type: 'user' as const, content: message }]);

    // 新しいSSEセッションIDを生成
    const sseSessionId = generateSSESessionId();

    // ストリーミング進捗表示を追加
    setChatMessages(prev => [...prev, { 
      type: 'streaming' as const, 
      content: '', 
      sseSessionId: sseSessionId 
    }]);

    setIsTextChatLoading(true);

    try {
      const response = await authenticatedFetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: message,
          sse_session_id: sseSessionId,
          confirm: false
        }),
      });

      if (!response.ok) {
        throw new Error(`チャットAPI エラー: ${response.status}`);
      }

      const data = await response.json();
      
      // ヘルプ応答の検出（useChatMessagesと同じロジック）
      const isHelpResponse = data.response && (
        data.response.includes('4つの便利な機能') ||
        data.response.includes('どの機能について知りたいですか') ||
        data.response.includes('食材を追加する') ||
        data.response.includes('食材を削除する') ||
        data.response.includes('主菜を選ぶ') ||
        data.response.includes('副菜を選ぶ') ||
        data.response.includes('汁物を選ぶ') ||
        data.response.includes('在庫一覧を確認する') ||
        data.response.includes('レシピ履歴を確認する')
      );
      
      // ヘルプ応答の場合は直接処理
      if (isHelpResponse && data.success && data.response) {
        setChatMessages(prev => prev.map((msg): ChatMessage => 
          msg.type === 'streaming' && msg.sseSessionId === sseSessionId
            ? { type: 'ai' as const, content: data.response }
            : msg
        ));
        setIsTextChatLoading(false);
        return;
      }
      
      // 通常の応答の場合はSSEで処理されるため、ここでは何もしない
      // SSEが完了すると自動的にstreamingメッセージが更新される
    } catch (error) {
      // エラー時はストリーミング進捗表示をエラーメッセージに置き換え
      setChatMessages(prev => prev.map((msg): ChatMessage => 
        msg.type === 'streaming' && msg.sseSessionId === sseSessionId
          ? { type: 'ai' as const, content: `エラー: ${error instanceof Error ? error.message : '不明なエラー'}` }
          : msg
      ));
    } finally {
      setIsTextChatLoading(false);
    }
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <UserProfile
            onOpenHistory={openHistoryPanel}
            onOpenInventory={openInventoryPanel}
            onRequestMainProposal={handleRequestMainProposal}
            onRequestOtherProposal={handleRequestOtherProposal}
          />
          
          {/* チャットセクション */}
          <ChatSection
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            isTextChatLoading={isTextChatLoading}
            setIsTextChatLoading={setIsTextChatLoading}
            openRecipeModal={openRecipeModal}
            isHistoryPanelOpen={isHistoryPanelOpen}
            closeHistoryPanel={closeHistoryPanel}
            isInventoryPanelOpen={isInventoryPanelOpen}
            closeInventoryPanel={closeInventoryPanel}
          />

          {/* 音声入力セクション */}
          <VoiceSection
            isChatLoading={isChatLoading}
            setIsChatLoading={setIsChatLoading}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
          />

          
        </div>
      </div>
      
      {/* レシピモーダル */}
      <RecipeModalResponsive
        isOpen={modalOpen}
        onClose={closeRecipeModal}
        response={modalResponse}
        result={modalResult}
      />

      {/* 履歴パネル */}
      <HistoryPanel
        isOpen={isHistoryPanelOpen}
        onClose={closeHistoryPanel}
      />
      
      {/* 在庫パネル */}
      <InventoryPanel
        isOpen={isInventoryPanelOpen}
        onClose={closeInventoryPanel}
      />
    </AuthWrapper>
  );
}
