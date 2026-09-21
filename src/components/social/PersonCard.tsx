import React from 'react';
import { UserPlus, MessageCircle, Headphones, Music2 } from 'lucide-react';
import type { SocialUser } from './SocialTypes';

interface PersonCardProps {
  user: SocialUser;
  variant: 'friend' | 'suggestion' | 'listening';
  onMessage?: () => void;
  onAdd?: () => void;
  onJoin?: () => void;
}

export const PersonCard: React.FC<PersonCardProps> = ({ user, variant, onMessage, onAdd, onJoin }) => {
  return (
    <div className="flex items-center gap-3 bg-white/[0.04] border border-white/8 rounded-2xl px-4 py-3.5 hover:bg-white/[0.07] hover:border-white/15 transition-all group">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${user.avatarColor} flex items-center justify-center text-white font-bold text-sm overflow-hidden`}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
          ) : user.displayName[0]}
        </div>
        {user.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0d1117]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-white font-semibold text-[13px] truncate">{user.displayName}</p>
        </div>
        <p className="text-white/40 text-[11px]">@{user.username}</p>
        {user.currentlyPlaying ? (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="flex gap-0.5">
              {[0,1,2].map(i => (
                <span key={i} className="inline-block w-0.5 h-2.5 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: `${i*150}ms` }} />
              ))}
            </span>
            <span className="text-pink-400 text-[10px] truncate">{user.currentlyPlaying.title}</span>
          </div>
        ) : user.bio ? (
          <p className="text-white/30 text-[11px] truncate mt-0.5">{user.bio}</p>
        ) : (
          <p className="text-white/20 text-[11px] mt-0.5">{user.isOnline ? 'online' : `last seen ${user.lastSeen || 'a while ago'}`}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {variant === 'suggestion' && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 rounded-xl text-[11px] font-bold transition-all"
          >
            <UserPlus size={13} />
            Add
          </button>
        )}
        {(variant === 'friend' || variant === 'listening') && (
          <>
            <button
              onClick={onMessage}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              title="Message"
            >
              <MessageCircle size={15} />
            </button>
            {user.currentlyPlaying && variant === 'listening' && (
              <button
                onClick={onJoin}
                className="flex items-center gap-1 px-3 py-1.5 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-400 rounded-xl text-[11px] font-bold transition-all"
              >
                <Headphones size={13} />
                Join
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
