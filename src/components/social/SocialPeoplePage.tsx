import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, UserCheck, Headphones, UserPlus, Check, X, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSocial } from './SocialContext';
import { useAuth } from '../AuthContext';
import { PersonCard } from './PersonCard';
import type { SocialUser } from './SocialTypes';

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 9999px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
`;

export const SocialPeoplePage: React.FC = () => {
  const { contacts, suggestions, friendRequests, acceptFriendRequest, declineFriendRequest, searchUsers, sendFriendRequest, isRealMode, me } = useSocial();
  const { user, updatePhotoURL } = useAuth();
  const [query, setQuery] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<SocialUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  const listeningNow = contacts.filter(c => c.currentlyPlaying);
  const onlineFriends = contacts.filter(c => c.isOnline);

  // Debounced real-time search
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    if (!query.trim()) { setSearchResults([]); return; }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchUsers(query);
      setSearchResults(results);
      setSearching(false);
    }, 400);

    return () => clearTimeout(searchTimeout.current);
  }, [query, searchUsers]);

  const handleAddFriend = async (userId: string) => {
    setAddedIds(prev => new Set(prev).add(userId));
    await sendFriendRequest(userId);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !updatePhotoURL) return;
    setPhotoLoading(true);
    setPhotoMsg(null);
    try {
      await updatePhotoURL(file);
      setPhotoMsg('Photo updated! ✨');
    } catch (err: any) {
      setPhotoMsg(err?.message || 'Upload failed');
    } finally {
      setPhotoLoading(false);
      setTimeout(() => setPhotoMsg(null), 3000);
    }
  };

  // Filtered local contacts (used when not searching)
  const localFiltered = query
    ? contacts.filter(c =>
        c.displayName.toLowerCase().includes(query.toLowerCase()) ||
        c.username.toLowerCase().includes(query.toLowerCase())
      )
    : contacts;

  // When in real mode and searching, show Firestore results; otherwise local
  const showResults = query && isRealMode ? searchResults : (query ? localFiltered : []);

  return (
    <div className="h-full flex flex-col">
      <style>{scrollbarStyles}</style>
      <div className="flex-1 overflow-hidden rounded-2xl border border-white/[0.07]" style={{ background: 'rgba(13, 17, 28, 0.85)' }}>
        <div className="h-full overflow-y-auto custom-scrollbar px-5 py-5 space-y-6 max-w-2xl mx-auto">

          {/* My Profile Card (with photo upload) */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3"
            >
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-pink-500/30"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    {(user.displayName || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {photoLoading ? <Loader2 size={18} className="text-white animate-spin" /> : <Camera size={18} className="text-white" />}
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-[15px]">{user.displayName}</p>
                <p className="text-white/40 text-[12px]">{user.email}</p>
                <AnimatePresence>
                  {photoMsg && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-pink-400 text-[11px] mt-0.5"
                    >
                      {photoMsg}
                    </motion.p>
                  )}
                </AnimatePresence>
                {!photoMsg && (
                  <p className="text-white/25 text-[11px] mt-0.5">Tap photo to update · others see you by this</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Search */}
          <div>
            <h2 className="text-white text-[20px] font-bold tracking-tight mb-4">People</h2>
            <div className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5">
              <Search size={15} className="text-white/30 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name or username..."
                className="bg-transparent text-[13px] text-white placeholder-white/30 outline-none flex-1"
              />
              {searching && <Loader2 size={14} className="text-white/30 animate-spin shrink-0" />}
            </div>
          </div>

          {/* Search Results */}
          <AnimatePresence>
            {query && (
              <motion.section
                key="search-results"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Search size={14} className="text-cyan-400" />
                  <h3 className="text-white/60 text-[12px] font-bold uppercase tracking-widest">
                    {isRealMode ? 'PlayMe Users' : 'Friends'}
                  </h3>
                  {!searching && <span className="text-white/30 text-[11px]">({showResults.length} found)</span>}
                </div>
                <div className="space-y-2">
                  {searching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={20} className="text-pink-500 animate-spin" />
                    </div>
                  ) : showResults.length === 0 ? (
                    <div className="text-center py-8 text-white/30 text-[13px]">
                      No users found for "{query}"
                    </div>
                  ) : (
                    showResults.map(u => (
                      <motion.div
                        key={u.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] hover:border-white/15 rounded-2xl px-4 py-3 transition-all"
                      >
                        {/* Avatar */}
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.displayName} className="w-11 h-11 rounded-2xl object-cover shrink-0" />
                        ) : (
                          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${u.avatarColor} flex items-center justify-center text-white font-bold shrink-0`}>
                            {u.displayName[0]}
                          </div>
                        )}
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold text-[13px]">{u.displayName}</p>
                            {u.isOnline && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
                          </div>
                          {/* Email shown for confirmation */}
                          {'email' in u && (u as any).email && (
                            <p className="text-white/40 text-[11px] truncate">{(u as any).email}</p>
                          )}
                          {u.currentlyPlaying && (
                            <p className="text-pink-400/70 text-[10px] truncate flex items-center gap-1 mt-0.5">
                              <Headphones size={9} />
                              {u.currentlyPlaying.title}
                            </p>
                          )}
                        </div>
                        {/* Action */}
                        <button
                          onClick={() => addedIds.has(u.id) ? null : handleAddFriend(u.id)}
                          disabled={addedIds.has(u.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors shrink-0 ${
                            addedIds.has(u.id)
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                              : 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 border border-pink-500/20'
                          }`}
                        >
                          {addedIds.has(u.id) ? <><Check size={12} /> Sent</> : <><UserPlus size={12} /> Add</>}
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Friend Requests */}
          {!query && friendRequests.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <UserCheck size={15} className="text-pink-400" />
                <h3 className="text-white/60 text-[12px] font-bold uppercase tracking-widest">Friend Requests</h3>
                <span className="bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{friendRequests.length}</span>
              </div>
              <div className="space-y-2">
                {friendRequests.map(req => (
                  <div key={req.id} className="flex items-center gap-3 bg-pink-500/5 border border-pink-500/15 rounded-2xl px-4 py-3">
                    {req.from.avatarUrl ? (
                      <img src={req.from.avatarUrl} alt={req.from.displayName} className="w-11 h-11 rounded-2xl object-cover shrink-0" />
                    ) : (
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${req.from.avatarColor} flex items-center justify-center text-white font-bold shrink-0`}>
                        {req.from.displayName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-[13px]">{req.from.displayName}</p>
                      <p className="text-white/40 text-[11px]">@{req.from.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptFriendRequest(req.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-pink-500 hover:bg-pink-400 text-white rounded-xl text-[11px] font-bold transition-colors"
                      >
                        <Check size={13} /> Accept
                      </button>
                      <button
                        onClick={() => declineFriendRequest(req.id)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-colors"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Listening Now */}
          {!query && listeningNow.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <Headphones size={15} className="text-pink-400" />
                <h3 className="text-white/60 text-[12px] font-bold uppercase tracking-widest">Listening Now</h3>
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              </div>
              <div className="space-y-2">
                {listeningNow.map(u => <PersonCard key={u.id} user={u} />)}
              </div>
            </motion.section>
          )}

          {/* Online Friends */}
          {!query && onlineFriends.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <Users size={15} className="text-emerald-400" />
                <h3 className="text-white/60 text-[12px] font-bold uppercase tracking-widest">Online Friends</h3>
              </div>
              <div className="space-y-2">
                {onlineFriends.map(u => <PersonCard key={u.id} user={u} />)}
              </div>
            </motion.section>
          )}

          {/* Discover */}
          {!query && suggestions.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <UserPlus size={15} className="text-cyan-400" />
                <h3 className="text-white/60 text-[12px] font-bold uppercase tracking-widest">Discover People</h3>
              </div>
              <div className="space-y-2">
                {suggestions.map(u => <PersonCard key={u.id} user={u} showAdd onAdd={() => handleAddFriend(u.id)} added={addedIds.has(u.id)} />)}
              </div>
            </motion.section>
          )}

          {/* Bottom padding */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
};
