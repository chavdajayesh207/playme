import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { useSocial } from './SocialContext';
import { ChatList } from './ChatList';
import { ConversationWindow } from './ConversationWindow';
import { ListeningRoomModal } from './ListeningRoomModal';
import type { SharedTrack } from './SocialTypes';

// Scoped scrollbar styles
const scrollbarStyles = `
  .social-scroll::-webkit-scrollbar { width: 4px; }
  .social-scroll::-webkit-scrollbar-track { background: transparent; }
  .social-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 9999px; }
  .social-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 9999px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
`;

export const SocialChatPage: React.FC = () => {
  const { chats, me, startRoom, activeRoom, leaveRoom } = useSocial();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const activeChat = chats.find(c => c.id === activeChatId) ?? null;

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setShowInfoPanel(false);
  };

  const handleBack = () => {
    setActiveChatId(null);
  };

  const handleListenTogether = (track: SharedTrack) => {
    startRoom(track);
    setShowRoomModal(true);
  };

  // ── Mobile: single column with back navigation
  // ── Desktop (md+): 2-3 column layout

  return (
    <div className="h-full flex flex-col relative">
      <style>{scrollbarStyles}</style>

      {/* Rounded bordered container */}
      <div className="flex-1 flex overflow-hidden rounded-2xl border border-white/[0.07]" style={{ background: 'rgba(13, 17, 28, 0.85)' }}>

        {/* ── Desktop Left: Chat List (always visible on md+) ── */}
        <div className={`
          shrink-0 border-r border-white/[0.06]
          w-full md:w-72 lg:w-80
          ${activeChat ? 'hidden md:flex' : 'flex'}
          flex-col h-full
        `} style={{ background: 'rgba(10, 12, 20, 0.5)' }}>
          <ChatList
            chats={chats}
            activeId={activeChatId}
            me={me}
            onSelect={handleSelectChat}
          />
        </div>

        {/* ── Center: Conversation / Empty State ── */}
        <div className={`
          flex-1 min-w-0 flex flex-col h-full
          ${!activeChat ? 'hidden md:flex' : 'flex'}
        `}>
          {activeChat ? (
            <ConversationWindow
              key={activeChat.id}
              chat={activeChat}
              onBack={handleBack}
              onListenTogether={handleListenTogether}
              showInfoPanel={showInfoPanel}
              onToggleInfo={() => setShowInfoPanel(v => !v)}
            />
          ) : (
            /* Empty state (desktop only when no chat selected) */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/20 flex items-center justify-center mb-5">
                <MessageCircle size={36} className="text-pink-400" />
              </div>
              <h3 className="text-white text-[18px] font-bold mb-2">Your Messages</h3>
              <p className="text-white/40 text-[13px] leading-relaxed max-w-xs">
                Select a chat to start messaging, or share a song with a friend.
              </p>
              <div className="mt-6 flex gap-2">
                <div className="h-1 w-8 bg-pink-500/40 rounded-full" />
                <div className="h-1 w-4 bg-pink-500/20 rounded-full" />
                <div className="h-1 w-2 bg-pink-500/10 rounded-full" />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Room Modal ── */}
      <AnimatePresence>
        {showRoomModal && activeRoom && (
          <ListeningRoomModal
            room={activeRoom}
            onClose={() => { setShowRoomModal(false); leaveRoom(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
