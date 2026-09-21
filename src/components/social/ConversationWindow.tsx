import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, Search, X, Music2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Chat, SocialUser, SharedTrack } from './SocialTypes';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { useSocial } from './SocialContext';

// Mini Music Picker Modal
const MusicPickerModal: React.FC<{
  tracks: SharedTrack[];
  onPick: (track: SharedTrack) => void;
  onClose: () => void;
}> = ({ tracks, onPick, onClose }) => {
  const [q, setQ] = useState('');
  const filtered = tracks.filter(t =>
    t.title.toLowerCase().includes(q.toLowerCase()) ||
    t.artist.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-20 left-0 right-0 z-30 mx-4 bg-[#161b27] border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Music2 size={16} className="text-pink-400" />
          <span className="text-white font-semibold text-[13px]">Share a Song</span>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white"><X size={16} /></button>
      </div>
      <div className="px-4 py-2">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search songs..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[13px] placeholder-white/30 outline-none"
          autoFocus
        />
      </div>
      <div className="overflow-y-auto max-h-56 px-2 pb-2">
        {filtered.map(track => (
          <button
            key={track.id}
            onClick={() => { onPick(track); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-white/10">
              {track.coverUrl && <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="text-white text-[13px] font-medium truncate">{track.title}</p>
              <p className="text-white/40 text-[11px] truncate">{track.artist}</p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

// Right info panel
const ChatInfoPanel: React.FC<{ chat: Chat; onClose: () => void }> = ({ chat, onClose }) => {
  const other = chat.type === 'dm' ? chat.members[0] : null;
  const name = chat.type === 'group' ? chat.name : other?.displayName;
  const avatarColor = other?.avatarColor || 'from-purple-500 to-pink-500';

  const sharedMusic = chat.messages.filter(m => m.type === 'music' && m.track);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
        <span className="text-white font-bold text-[15px]">Info</span>
        <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {/* Profile */}
        <div className="flex flex-col items-center text-center">
          <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-3xl font-bold mb-3`}>
            {chat.type === 'group' ? '🎵' : (name || '?')[0].toUpperCase()}
          </div>
          <h3 className="text-white font-bold text-[16px]">{name}</h3>
          {other?.username && <p className="text-white/40 text-[12px]">@{other.username}</p>}
          {other?.bio && <p className="text-white/60 text-[12px] mt-2">{other.bio}</p>}
          {other?.currentlyPlaying && (
            <div className="mt-3 flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 rounded-xl px-3 py-2">
              <span className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <span key={i} className="inline-block w-0.5 h-3 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: `${i*150}ms` }} />
                ))}
              </span>
              <div className="text-left min-w-0">
                <p className="text-pink-400 text-[11px] font-semibold truncate">{other.currentlyPlaying.title}</p>
                <p className="text-pink-300/60 text-[10px] truncate">{other.currentlyPlaying.artist}</p>
              </div>
            </div>
          )}
        </div>

        {/* Shared Music */}
        {sharedMusic.length > 0 && (
          <div>
            <h4 className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-2">
              Shared Music ({sharedMusic.length})
            </h4>
            <div className="space-y-2">
              {sharedMusic.slice().reverse().map(msg => (
                <div key={msg.id} className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-white/10">
                    {msg.track?.coverUrl && <img src={msg.track.coverUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-[12px] font-medium truncate">{msg.track?.title}</p>
                    <p className="text-white/40 text-[10px] truncate">{msg.track?.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group members */}
        {chat.type === 'group' && (
          <div>
            <h4 className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-2">
              Members ({chat.members.length + 1})
            </h4>
            <div className="space-y-2">
              {[{ id: 'me', displayName: 'You', avatarColor: 'from-pink-500 to-purple-600', isOnline: true } as any, ...chat.members].map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${m.avatarColor} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                    {m.displayName[0]}
                  </div>
                  <span className="text-white text-[13px]">{m.displayName}</span>
                  {m.isOnline && <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-auto" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Conversation Window ────────────────────────────────────────────────

interface ConversationWindowProps {
  chat: Chat;
  onBack?: () => void;
  onListenTogether?: (track: SharedTrack) => void;
  showInfoPanel: boolean;
  onToggleInfo: () => void;
}

export const ConversationWindow: React.FC<ConversationWindowProps> = ({
  chat,
  onBack,
  onListenTogether,
  showInfoPanel,
  onToggleInfo,
}) => {
  const { me, addReaction, markAsRead, sendMusicMessage, availableTracks, getUserById } = useSocial();
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const other = chat.type === 'dm' ? chat.members[0] : null;
  const name = chat.type === 'group' ? chat.name : other?.displayName;

  useEffect(() => {
    markAsRead(chat.id);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.id, chat.messages.length, markAsRead]);

  // Group consecutive messages by sender
  const groupedMessages = chat.messages.map((msg, i) => {
    const prev = chat.messages[i - 1];
    const showAvatar = !prev || prev.senderId !== msg.senderId;
    const showName = chat.type === 'group' && showAvatar && msg.senderId !== 'me';
    return { msg, showAvatar, showName };
  });

  return (
    <div className="flex h-full">
      {/* Main chat area */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${showInfoPanel ? '' : ''}`}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-black/20 backdrop-blur-sm shrink-0">
          {onBack && (
            <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </button>
          )}

          {/* Avatar */}
          <div className="relative">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${other?.avatarColor || 'from-purple-500 to-pink-500'} flex items-center justify-center text-white font-bold text-sm overflow-hidden`}>
              {chat.type === 'group' ? '🎵' : (name || '?')[0].toUpperCase()}
            </div>
            {other?.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0d1117]" />}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-[14px] truncate">{name}</p>
            <p className="text-[11px] truncate">
              {other?.currentlyPlaying ? (
                <span className="text-pink-400">🎵 {other.currentlyPlaying.title}</span>
              ) : other?.isOnline ? (
                <span className="text-green-400">online</span>
              ) : (
                <span className="text-white/30">{other?.lastSeen ? `last seen ${other.lastSeen}` : 'offline'}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Search"><Search size={16} /></button>
            <button onClick={onToggleInfo} className={`p-2 rounded-xl transition-colors ${showInfoPanel ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-white/10 text-white/40 hover:text-white'}`} title="Info"><MoreVertical size={16} /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 custom-scrollbar relative">
          {groupedMessages.map(({ msg, showAvatar, showName }) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.senderId === 'me'}
              sender={getUserById(msg.senderId)}
              showAvatar={showAvatar}
              showName={showName}
              onReact={(msgId, emoji) => addReaction(chat.id, msgId, emoji)}
              onListenTogether={onListenTogether}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="px-4 pb-4 pt-2 shrink-0 relative">
          <AnimatePresence>
            {showMusicPicker && (
              <MusicPickerModal
                tracks={availableTracks}
                onPick={(track) => sendMusicMessage(chat.id, track)}
                onClose={() => setShowMusicPicker(false)}
              />
            )}
          </AnimatePresence>
          <MessageComposer chatId={chat.id} onMusicPick={() => setShowMusicPicker(v => !v)} />
        </div>
      </div>

      {/* Info Panel (desktop right column) */}
      <AnimatePresence>
        {showInfoPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-white/5 bg-black/20 overflow-hidden shrink-0 hidden md:block"
            style={{ minWidth: 0 }}
          >
            <ChatInfoPanel chat={chat} onClose={onToggleInfo} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
