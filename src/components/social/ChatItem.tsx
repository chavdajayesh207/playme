import React from 'react';
import { Music2 } from 'lucide-react';
import type { Chat, SocialUser } from './SocialTypes';

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  me: SocialUser;
  onClick: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export const ChatItem: React.FC<ChatItemProps> = ({ chat, isActive, me, onClick }) => {
  const other = chat.type === 'dm' ? chat.members[0] : null;
  const name = chat.type === 'group' ? chat.name : other?.displayName;
  const avatarColor = other?.avatarColor || 'from-gray-500 to-gray-700';
  const avatarChar = (name || '?')[0].toUpperCase();
  const isOnline = chat.type === 'dm' ? other?.isOnline : chat.members.some(m => m.isOnline);

  const lastMsg = chat.lastMessage;
  let preview = '';
  if (lastMsg) {
    if (lastMsg.type === 'music' && lastMsg.track) {
      preview = `🎵 ${lastMsg.track.title}`;
    } else {
      preview = lastMsg.senderId === 'me' ? `You: ${lastMsg.text}` : (lastMsg.text || '');
    }
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-left group ${
        isActive
          ? 'bg-pink-500/15 border border-pink-500/20'
          : 'hover:bg-white/[0.05] border border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {chat.type === 'group' ? (
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
            🎵
          </div>
        ) : (
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-sm overflow-hidden`}>
            {other?.avatarUrl ? (
              <img src={other.avatarUrl} alt={name || ''} className="w-full h-full object-cover" />
            ) : avatarChar}
          </div>
        )}
        {/* Online indicator */}
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0d1117]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`font-semibold text-[13px] truncate ${isActive ? 'text-white' : 'text-white/90'}`}>
            {name}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {lastMsg && (
              <span className="text-[10px] text-white/30">{timeAgo(lastMsg.createdAt)}</span>
            )}
            {chat.unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {lastMsg?.type === 'music' && <Music2 size={11} className="text-pink-400 shrink-0" />}
          <p className="text-[11px] text-white/40 truncate">{preview}</p>
        </div>
        {/* Currently listening for DM */}
        {other?.currentlyPlaying && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="flex gap-0.5">
              {[0, 1, 2].map(i => (
                <span key={i} className="inline-block w-0.5 bg-pink-400 rounded-full animate-pulse" style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 150}ms` }} />
              ))}
            </span>
            <span className="text-[10px] text-pink-400 truncate">{other.currentlyPlaying.title}</span>
          </div>
        )}
      </div>
    </button>
  );
};
