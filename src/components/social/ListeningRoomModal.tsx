import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Users, Headphones, Crown } from 'lucide-react';
import type { ListeningRoom, SharedTrack } from './SocialTypes';
import { useSocial } from './SocialContext';
import { useAudioPlayer } from '../AudioPlayerContext';

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface ListeningRoomModalProps {
  room: ListeningRoom;
  onClose: () => void;
}

export const ListeningRoomModal: React.FC<ListeningRoomModalProps> = ({ room, onClose }) => {
  const { leaveRoom, getUserById, me } = useSocial();
  const { playTrack, allTracks } = useAudioPlayer();
  const [reactions, setReactions] = React.useState<{ emoji: string; id: number }[]>([]);
  const reactionCounter = React.useRef(0);

  const host = getUserById(room.hostId);
  const isHost = room.hostId === 'me';

  const handleReact = (emoji: string) => {
    const id = ++reactionCounter.current;
    setReactions(prev => [...prev, { emoji, id }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2000);
  };

  const handlePlay = () => {
    if (!room.track) return;
    const found = allTracks.find(t =>
      t.title.toLowerCase().includes(room.track!.title.toLowerCase())
    );
    if (found) playTrack(found);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-end sm:items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 60, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 60, scale: 0.95, opacity: 0 }}
        className="w-full max-w-sm bg-[#0d1117] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Glow bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-pink-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 relative">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <span key={i} className="inline-block w-1 bg-pink-400 rounded-full animate-pulse" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 150}ms` }} />
                ))}
              </span>
              <span className="text-pink-400 text-[11px] font-bold uppercase tracking-widest">Live Room</span>
            </div>
            <h3 className="text-white font-bold text-[17px] mt-0.5">{room.name}</h3>
            <p className="text-white/40 text-[12px]">Hosted by {host?.displayName || 'Someone'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Track info */}
        {room.track && (
          <div className="px-5 pb-4">
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex gap-4 items-center">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 shrink-0">
                {room.track.coverUrl && <img src={room.track.coverUrl} alt={room.track.title} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-[14px] truncate">{room.track.title}</p>
                <p className="text-white/50 text-[12px] truncate">{room.track.artist}</p>
                <p className="text-pink-400/70 text-[11px] mt-0.5">{formatDuration(room.position)} / {formatDuration(room.track.duration)}</p>
              </div>
              <button onClick={handlePlay} className="p-2.5 bg-pink-500 hover:bg-pink-400 rounded-xl transition-colors">
                <Play size={16} fill="white" className="text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Members */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-white/40" />
            <span className="text-white/40 text-[12px]">{room.members.length} listening</span>
          </div>
          <div className="flex -space-x-2">
            {room.members.map((m, i) => (
              <div
                key={m.id}
                className={`w-9 h-9 rounded-full border-2 border-[#0d1117] bg-gradient-to-br ${m.avatarColor} flex items-center justify-center text-white text-[12px] font-bold relative`}
                style={{ zIndex: room.members.length - i }}
                title={m.displayName}
              >
                {m.displayName[0]}
                {m.id === room.hostId && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                    <Crown size={8} className="text-black" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Floating reactions */}
        <div className="relative h-10 px-5 overflow-hidden pointer-events-none">
          <AnimatePresence>
            {reactions.map(r => (
              <motion.span
                key={r.id}
                initial={{ y: 0, opacity: 1, scale: 1 }}
                animate={{ y: -60, opacity: 0, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="absolute text-2xl"
                style={{ left: `${20 + Math.random() * 60}%` }}
              >
                {r.emoji}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {/* Reaction buttons */}
        <div className="flex justify-center gap-3 px-5 pb-4">
          {['❤️', '🔥', '😍', '👏', '🎵'].map(e => (
            <button
              key={e}
              onClick={() => handleReact(e)}
              className="text-2xl hover:scale-125 active:scale-110 transition-transform p-1"
            >
              {e}
            </button>
          ))}
        </div>

        {/* Leave */}
        <div className="px-5 pb-5">
          <button
            onClick={() => { leaveRoom(); onClose(); }}
            className="w-full py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-[14px] transition-colors"
          >
            {isHost ? '🏁 End Room' : '← Leave Room'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
