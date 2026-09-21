import React, { useState, useRef } from 'react';
import { Music2, Send, Smile, Paperclip, X } from 'lucide-react';
import { useSocial } from './SocialContext';
import type { SharedTrack } from './SocialTypes';

const EMOJIS = ['😊', '😂', '❤️', '🔥', '👏', '🎵', '🎧', '💯', '😍', '🙌', '😢', '😮'];

interface MessageComposerProps {
  chatId: string;
  onMusicPick: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ chatId, onMusicPick }) => {
  const { sendMessage } = useSocial();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(chatId, trimmed);
    setText('');
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Emoji picker */}
      {showEmoji && (
        <div className="absolute bottom-full mb-2 left-0 bg-[#161b27] border border-white/10 rounded-2xl p-3 shadow-2xl z-20 w-64">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/50 text-[11px] font-bold uppercase tracking-wider">Quick Reactions</span>
            <button onClick={() => setShowEmoji(false)} className="text-white/40 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => insertEmoji(e)}
                className="text-xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-white/10"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 bg-white/[0.04] border border-white/10 rounded-2xl px-3 py-2">
        {/* Attachment */}
        <button
          className="p-1.5 text-white/40 hover:text-white transition-colors shrink-0 self-center"
          title="Attach"
        >
          <Paperclip size={18} />
        </button>

        {/* Music picker */}
        <button
          onClick={onMusicPick}
          className="p-1.5 text-white/40 hover:text-pink-400 transition-colors shrink-0 self-center"
          title="Share a song"
        >
          <Music2 size={18} />
        </button>

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-transparent text-white text-[13px] placeholder-white/30 outline-none resize-none min-h-[24px] max-h-[100px] overflow-y-auto leading-6"
          style={{ height: 'auto' }}
          onInput={e => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = 'auto';
            t.style.height = Math.min(t.scrollHeight, 100) + 'px';
          }}
        />

        {/* Emoji */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className={`p-1.5 transition-colors shrink-0 self-center ${showEmoji ? 'text-pink-400' : 'text-white/40 hover:text-white'}`}
          title="Emoji"
        >
          <Smile size={18} />
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2 rounded-xl bg-pink-500 hover:bg-pink-400 disabled:bg-white/10 disabled:text-white/30 text-white transition-all shrink-0 self-center"
          title="Send"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
