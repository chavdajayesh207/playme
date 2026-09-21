import React, { useState } from 'react';
import { Search, Edit, Users } from 'lucide-react';
import type { Chat, SocialUser } from './SocialTypes';
import { ChatItem } from './ChatItem';

interface ChatListProps {
  chats: Chat[];
  activeId: string | null;
  me: SocialUser;
  onSelect: (chatId: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ chats, activeId, me, onSelect }) => {
  const [query, setQuery] = useState('');

  const filtered = chats.filter(c => {
    const name = c.type === 'group' ? c.name : c.members[0]?.displayName;
    return name?.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-[18px] font-bold tracking-tight">Chats</h2>
          <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors" title="New Chat">
            <Edit size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2">
          <Search size={14} className="text-white/30 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search chats..."
            className="bg-transparent text-[13px] text-white placeholder-white/30 outline-none flex-1"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users size={32} className="text-white/20 mb-2" />
            <p className="text-white/30 text-[13px]">No chats found</p>
          </div>
        ) : (
          filtered.map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeId}
              me={me}
              onClick={() => onSelect(chat.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
