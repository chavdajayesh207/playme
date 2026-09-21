import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Message, SocialUser } from './SocialTypes';
import { MusicMessageCard } from './MusicMessageCard';
import type { SharedTrack } from './SocialTypes';

const REACTIONS = ['❤️', '🔥', '😍', '👏', '😂', '😢'];

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  sender?: SocialUser;
  showAvatar: boolean;
  showName: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onListenTogether?: (track: SharedTrack) => void;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMine,
  sender,
  showAvatar,
  showName,
  onReact,
  onListenTogether,
}) => {
  const [showReactions, setShowReactions] = useState(false);

  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-white/30 bg-white/5 px-3 py-1 rounded-full">{message.text}</span>
      </div>
    );
  }

  const avatarChar = sender?.displayName?.[0]?.toUpperCase() || '?';

  return (
    <div className={`flex gap-2 group mb-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className="w-7 h-7 shrink-0 self-end">
        {showAvatar && !isMine && (
          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${sender?.avatarColor || 'from-gray-500 to-gray-700'} flex items-center justify-center text-white text-[11px] font-bold`}>
            {sender?.avatarUrl ? (
              <img src={sender.avatarUrl} alt={sender.displayName} className="w-full h-full rounded-full object-cover" />
            ) : avatarChar}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
        {showName && !isMine && (
          <span className="text-[11px] text-white/50 mb-1 ml-1">{sender?.displayName}</span>
        )}

        <div
          className="relative"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {/* Reaction picker on hover */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 4 }}
                className={`absolute ${isMine ? 'right-0' : 'left-0'} -top-10 z-10 flex gap-1 bg-[#1a1f2e] border border-white/15 rounded-2xl px-2 py-1.5 shadow-xl`}
              >
                {REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => onReact(message.id, emoji)}
                    className="text-base hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* The bubble / card */}
          {message.type === 'music' && message.track ? (
            <MusicMessageCard
              track={message.track}
              isMine={isMine}
              onListenTogether={onListenTogether}
            />
          ) : (
            <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
              isMine
                ? 'bg-pink-500/25 border border-pink-500/30 text-white rounded-br-md'
                : 'bg-white/[0.07] border border-white/10 text-white/90 rounded-bl-md'
            }`}>
              {message.text}
            </div>
          )}

          {/* Reactions display */}
          {message.reactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
              {message.reactions.map(r => (
                <button
                  key={r.emoji}
                  onClick={() => onReact(message.id, r.emoji)}
                  className="flex items-center gap-0.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full px-2 py-0.5 text-[11px] transition-colors"
                >
                  <span>{r.emoji}</span>
                  <span className="text-white/60">{r.userIds.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-white/25 mt-0.5 px-1">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
};
