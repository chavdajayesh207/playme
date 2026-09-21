import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  collection, doc, onSnapshot, addDoc, updateDoc, query,
  where, orderBy, serverTimestamp, setDoc, getDocs, getDoc,
  Timestamp, limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { connectSocket, disconnectSocket, getSocket } from '../../lib/socket';
import type { Chat, Message, SocialUser, FriendRequest, ListeningRoom, SharedTrack, MessageReaction } from './SocialTypes';

// ─── The ONE email that gets the demo/owner experience ────────────────────────
const OWNER_EMAIL = 'chavdajayesh207@gmail.com';

// ─── Mock Data (only shown to the owner account) ──────────────────────────────

const MOCK_ME: SocialUser = {
  id: 'me',
  displayName: 'Jayesh',
  username: 'jayesh',
  avatarColor: 'from-pink-500 to-purple-600',
  isOnline: true,
};

const MOCK_USERS: SocialUser[] = [
  { id: 'rahul', displayName: 'Rahul', username: 'rahul_music', avatarColor: 'from-blue-500 to-cyan-500', isOnline: true, bio: '🎵 Music is my soul', currentlyPlaying: { title: 'Apna Bana Le', artist: 'Arijit Singh', trackId: '1', coverUrl: 'https://i.ytimg.com/vi/DQ89B2p92II/hqdefault.jpg' } },
  { id: 'priya', displayName: 'Priya', username: 'priya_vibes', avatarColor: 'from-rose-400 to-pink-500', isOnline: true, bio: 'Late night music lover 🌙', currentlyPlaying: { title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', trackId: '2' } },
  { id: 'mummy', displayName: 'Mummy', username: 'mummy', avatarColor: 'from-amber-400 to-orange-500', isOnline: false, lastSeen: '2h ago', bio: '❤️ Family first' },
  { id: 'aman', displayName: 'Aman', username: 'aman_beats', avatarColor: 'from-green-400 to-teal-500', isOnline: true, bio: 'Hip-hop & more', currentlyPlaying: { title: 'Blinding Lights', artist: 'The Weeknd', trackId: '3' } },
  { id: 'anjali', displayName: 'Anjali', username: 'anjali_melody', avatarColor: 'from-violet-400 to-purple-600', isOnline: false, lastSeen: '45m ago', bio: 'Classical meets Bollywood' },
];

const MUSIC_LOVERS_GROUP: SocialUser[] = [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[3]];

const MOCK_TRACKS: SharedTrack[] = [
  { id: 't1', title: 'Apna Bana Le', artist: 'Arijit Singh', album: 'Bhediya', coverUrl: 'https://i.ytimg.com/vi/DQ89B2p92II/hqdefault.jpg', duration: 268 },
  { id: 't2', title: 'Tum Hi Ho', artist: 'Arijit Singh', album: 'Aashiqui 2', coverUrl: 'https://i.ytimg.com/vi/IJq0yyWug1k/hqdefault.jpg', duration: 261 },
  { id: 't3', title: 'Kesariya', artist: 'Arijit Singh', album: 'Brahmastra', coverUrl: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg', duration: 268 },
  { id: 't4', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', coverUrl: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg', duration: 200 },
  { id: 't5', title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', album: 'Single', coverUrl: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg', duration: 251 },
];

function makeMsg(id: string, chatId: string, senderId: string, text: string, offsetMins: number, track?: SharedTrack): Message {
  const d = new Date(Date.now() - offsetMins * 60000);
  return { id, chatId, senderId, type: track ? 'music' : 'text', text: track ? undefined : text, track, reactions: [], createdAt: d.toISOString(), isRead: true };
}

const MOCK_CHATS: Chat[] = [
  { id: 'dm_rahul', type: 'dm', members: [MOCK_USERS[0]], unreadCount: 2, messages: [makeMsg('m1','dm_rahul','rahul','Bro check this song 🔥',30), makeMsg('m2','dm_rahul','rahul','',28,MOCK_TRACKS[0]), makeMsg('m3','dm_rahul','me','This is 🔥🔥 love it!',25), makeMsg('m4','dm_rahul','rahul','Listen together? 🎧',20), makeMsg('m5','dm_rahul','me','Haan bhai send the room!',18), makeMsg('m6','dm_rahul','rahul','Also check this one',5), makeMsg('m7','dm_rahul','rahul','',2,MOCK_TRACKS[1])] },
  { id: 'grp_music', type: 'group', name: 'Music Lovers 🎵', members: MUSIC_LOVERS_GROUP, unreadCount: 5, messages: [makeMsg('g1','grp_music','priya','New drop alert 🚨',60), makeMsg('g2','grp_music','priya','',58,MOCK_TRACKS[4]), makeMsg('g3','grp_music','aman','This is actually fire 🔥',55), makeMsg('g4','grp_music','rahul','Agreed 🙌',50), makeMsg('g5','grp_music','me','Playing this on repeat rn 🎧',45), makeMsg('g6','grp_music','aman','Anyone want to do a listening room tonight?',10), makeMsg('g7','grp_music','priya',"Yess! Let's do 11pm",8)] },
  { id: 'dm_mummy', type: 'dm', members: [MOCK_USERS[2]], unreadCount: 0, messages: [makeMsg('mm1','dm_mummy','mummy','Beta, sun ye gaana bahut achha hai',120), makeMsg('mm2','dm_mummy','mummy','',118,MOCK_TRACKS[1]), makeMsg('mm3','dm_mummy','me','Haan Mummy bahut achha hai ❤️',115), makeMsg('mm4','dm_mummy','mummy','Purane zamane ka hai ye 😊',110)] },
  { id: 'dm_priya', type: 'dm', members: [MOCK_USERS[1]], unreadCount: 0, messages: [makeMsg('p1','dm_priya','priya','Aaj ka mood kya hai?',200), makeMsg('p2','dm_priya','me','Late night chill vibes 🌙',195), makeMsg('p3','dm_priya','priya','',190,MOCK_TRACKS[4]), makeMsg('p4','dm_priya','me','Perfect choice 💯',185)] },
  { id: 'dm_aman', type: 'dm', members: [MOCK_USERS[3]], unreadCount: 1, messages: [makeMsg('a1','dm_aman','aman','',15,MOCK_TRACKS[3]), makeMsg('a2','dm_aman','aman','This Weeknd track hits different at night',12)] },
];
MOCK_CHATS.forEach(c => { c.lastMessage = c.messages[c.messages.length - 1]; });

const MOCK_FRIEND_REQUESTS: FriendRequest[] = [
  { id: 'fr1', from: { id: 'dev1', displayName: 'Dev Kumar', username: 'dev_music', avatarColor: 'from-sky-400 to-blue-600', isOnline: false }, createdAt: new Date(Date.now() - 3600000).toISOString() },
];

const MOCK_SUGGESTIONS: SocialUser[] = [
  { id: 'sug1', displayName: 'Riya Shah', username: 'riya_shah', avatarColor: 'from-fuchsia-400 to-pink-600', isOnline: true, bio: 'Bollywood ❤️', currentlyPlaying: { title: 'Kesariya', artist: 'Arijit Singh', trackId: '3' } },
  { id: 'sug2', displayName: 'Arjun Patel', username: 'arjun_beats', avatarColor: 'from-emerald-400 to-green-600', isOnline: false, bio: 'Lo-fi & Jazz' },
  { id: 'sug3', displayName: 'Neha Joshi', username: 'neha_melody', avatarColor: 'from-orange-400 to-red-500', isOnline: true, currentlyPlaying: { title: 'Apna Bana Le', artist: 'Arijit Singh', trackId: '1' } },
];

// ─── Context Type ──────────────────────────────────────────────────────────────

interface SocialContextType {
  me: SocialUser;
  chats: Chat[];
  contacts: SocialUser[];
  friendRequests: FriendRequest[];
  suggestions: SocialUser[];
  activeRoom: ListeningRoom | null;
  availableTracks: SharedTrack[];
  isRealMode: boolean; // true = logged in, false = demo mode
  isOwner: boolean;    // true = chavdajayesh207@gmail.com
  sendMessage: (chatId: string, text: string) => void;
  sendMusicMessage: (chatId: string, track: SharedTrack) => void;
  addReaction: (chatId: string, messageId: string, emoji: string) => void;
  markAsRead: (chatId: string) => void;
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  startRoom: (track: SharedTrack) => void;
  joinRoom: (room: ListeningRoom) => void;
  leaveRoom: () => void;
  getUserById: (id: string) => SocialUser | undefined;
  sendMusicToChat: (chatId: string, track: SharedTrack) => void;
  searchUsers: (query: string) => Promise<SocialUser[]>;
  sendFriendRequest: (userId: string) => Promise<void>;
  createDMChat: (user: SocialUser) => Promise<string>;
  typingUsers: Record<string, string[]>; // chatId → list of display names typing
  sendTyping: (chatId: string) => void;
  totalUnread: number;
}

const SocialContext = createContext<SocialContextType | null>(null);

// ─── Helper: build SocialUser from Firebase user data ─────────────────────────
function buildSocialUser(id: string, data: any): SocialUser {
  return {
    id,
    displayName: data.displayName || 'Unknown',
    username: data.username || id,
    avatarUrl: data.avatarUrl,
    avatarColor: data.avatarColor || 'from-pink-500 to-purple-600',
    email: data.email,
    isOnline: data.isOnline ?? false,
    lastSeen: data.lastSeen,
    bio: data.bio,
    currentlyPlaying: data.currentlyPlaying,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface SocialProviderProps {
  children: React.ReactNode;
  firebaseUser?: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null } | null;
}

export const SocialProvider: React.FC<SocialProviderProps> = ({ children, firebaseUser }) => {
  const isOwner = firebaseUser?.email === OWNER_EMAIL;
  const isRealMode = !!firebaseUser;

  // ── State ──────────────────────────────────────────────────────────────────
  const [chats, setChats] = useState<Chat[]>(isOwner ? MOCK_CHATS : []);
  const [contacts, setContacts] = useState<SocialUser[]>(isOwner ? MOCK_USERS : []);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(isOwner ? MOCK_FRIEND_REQUESTS : []);
  const [suggestions] = useState<SocialUser[]>(MOCK_SUGGESTIONS);
  const [activeRoom, setActiveRoom] = useState<ListeningRoom | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const msgCounter = useRef(1000);

  // Me user object
  const me: SocialUser = firebaseUser ? {
    id: firebaseUser.uid,
    displayName: firebaseUser.displayName || 'You',
    username: firebaseUser.email?.split('@')[0] || 'user',
    avatarUrl: firebaseUser.photoURL || undefined,
    avatarColor: 'from-pink-500 to-purple-600',
    isOnline: true,
  } : MOCK_ME;

  // ── Total unread count ──────────────────────────────────────────────────────
  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // ── Firebase real-time listeners ────────────────────────────────────────────
  useEffect(() => {
    if (!firebaseUser) return;

    const uid = firebaseUser.uid;

    // Update user presence in Firestore
    const userRef = doc(db, 'users', uid);
    setDoc(userRef, {
      displayName: firebaseUser.displayName || 'User',
      username: firebaseUser.email?.split('@')[0] || uid,
      avatarUrl: firebaseUser.photoURL || null,
      avatarColor: 'from-pink-500 to-purple-600',
      isOnline: true,
      lastSeen: serverTimestamp(),
      email: firebaseUser.email,
    }, { merge: true }).catch(console.error);

    // Set offline on disconnect
    return () => {
      setDoc(userRef, { isOnline: false, lastSeen: serverTimestamp() }, { merge: true }).catch(console.error);
    };
  }, [firebaseUser]);

  // ── Listen to real chats from Firestore ─────────────────────────────────────
  useEffect(() => {
    if (!firebaseUser) return;

    const uid = firebaseUser.uid;
    const chatsQuery = query(
      collection(db, 'chats'),
      where('memberIds', 'array-contains', uid),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    const unsubChats = onSnapshot(chatsQuery, async (snap) => {
      const realChats: Chat[] = [];

      for (const chatDoc of snap.docs) {
        const data = chatDoc.data();
        const chatId = chatDoc.id;

        // Load members
        const memberUsers: SocialUser[] = [];
        for (const memberId of (data.memberIds || [])) {
          if (memberId === uid) continue;
          try {
            const userSnap = await getDoc(doc(db, 'users', memberId));
            if (userSnap.exists()) {
              memberUsers.push(buildSocialUser(memberId, userSnap.data()));
            }
          } catch { /* skip */ }
        }

        // Load latest messages
        const msgsQuery = query(
          collection(db, 'chats', chatId, 'messages'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const msgsSnap = await getDocs(msgsQuery);
        const messages: Message[] = msgsSnap.docs.reverse().map(m => {
          const d = m.data();
          return {
            id: m.id,
            chatId,
            senderId: d.senderId,
            type: d.type || 'text',
            text: d.text,
            track: d.track,
            reactions: d.reactions || [],
            createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : d.createdAt,
            isRead: d.isRead ?? true,
          };
        });

        const lastMsg = messages[messages.length - 1];
        const unreadCount = (data.unreadCounts || {})[uid] || 0;

        realChats.push({
          id: chatId,
          type: data.type || 'dm',
          name: data.name,
          members: memberUsers,
          messages,
          lastMessage: lastMsg,
          unreadCount,
        });
      }

      // Merge: owner gets demo chats first, then real chats
      if (isOwner) {
        setChats([...MOCK_CHATS, ...realChats]);
      } else {
        setChats(realChats);
      }
    }, (err) => {
      console.warn('[Social] Firestore chats listener error:', err.message);
      // Firestore may need index or rules — fall back gracefully
      if (isOwner) setChats(MOCK_CHATS);
    });

    return () => unsubChats();
  }, [firebaseUser, isOwner]);

  // ── Socket.IO setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!firebaseUser) return;

    const socket = connectSocket(firebaseUser.uid, firebaseUser.displayName || 'User');

    socket.on('new_message', (msg: { chatId: string; message: Message }) => {
      setChats(prev => prev.map(c => {
        if (c.id !== msg.chatId) return c;
        // Don't add if already present (from Firestore listener)
        if (c.messages.find(m => m.id === msg.message.id)) return c;
        const newMsg = { ...msg.message };
        return { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg, unreadCount: c.unreadCount + 1 };
      }));
    });

    socket.on('typing', ({ chatId, displayName }: { chatId: string; displayName: string }) => {
      setTypingUsers(prev => {
        const existing = prev[chatId] || [];
        if (existing.includes(displayName)) return prev;
        return { ...prev, [chatId]: [...existing, displayName] };
      });
      setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || []).filter(n => n !== displayName),
        }));
      }, 3000);
    });

    socket.on('room_sync', ({ position, status }: { position: number; status: string }) => {
      setActiveRoom(prev => prev ? { ...prev, position, status: status as any } : prev);
    });

    socket.on('user_joined_room', ({ user }: { user: SocialUser }) => {
      setActiveRoom(prev => prev ? { ...prev, members: [...prev.members.filter(m => m.id !== user.id), user] } : prev);
    });

    socket.on('user_left_room', ({ userId }: { userId: string }) => {
      setActiveRoom(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== userId) } : prev);
    });

    return () => {
      socket.off('new_message');
      socket.off('typing');
      socket.off('room_sync');
      socket.off('user_joined_room');
      socket.off('user_left_room');
      disconnectSocket();
    };
  }, [firebaseUser]);

  // ── Core actions ────────────────────────────────────────────────────────────

  const getUserById = useCallback((id: string) => {
    if (id === 'me' || id === firebaseUser?.uid) return me;
    return MOCK_USERS.find(u => u.id === id) || MOCK_SUGGESTIONS.find(u => u.id === id);
  }, [firebaseUser, me]);

  const addLocalMessage = useCallback((chatId: string, msg: Omit<Message, 'id' | 'createdAt' | 'isRead' | 'reactions'>) => {
    const newMsg: Message = { ...msg, id: `msg_${++msgCounter.current}`, createdAt: new Date().toISOString(), isRead: true, reactions: [] };
    setChats(prev => prev.map(c => {
      if (c.id !== chatId) return c;
      return { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg, unreadCount: 0 };
    }));
    return newMsg;
  }, []);

  const sendMessage = useCallback(async (chatId: string, text: string) => {
    // For demo chats (mock IDs), only update local state
    const isDemoChat = chatId.startsWith('dm_') || chatId.startsWith('grp_');
    if (isDemoChat || !firebaseUser) {
      addLocalMessage(chatId, { chatId, senderId: firebaseUser?.uid || 'me', type: 'text', text });
      return;
    }

    // Real Firestore + Socket.IO
    const msgData = {
      chatId,
      senderId: firebaseUser.uid,
      type: 'text',
      text,
      createdAt: serverTimestamp(),
      isRead: false,
      reactions: [],
    };

    try {
      const ref = await addDoc(collection(db, 'chats', chatId, 'messages'), msgData);
      await updateDoc(doc(db, 'chats', chatId), { updatedAt: serverTimestamp(), lastMessageText: text });

      // Also emit via socket for instant delivery
      const socket = getSocket();
      const newMsg: Message = { id: ref.id, chatId, senderId: firebaseUser.uid, type: 'text', text, createdAt: new Date().toISOString(), isRead: false, reactions: [] };
      socket.emit('send_message', { chatId, message: newMsg });

      // Optimistic local update
      setChats(prev => prev.map(c => {
        if (c.id !== chatId) return c;
        return { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg, unreadCount: 0 };
      }));
    } catch (err) {
      console.error('[Social] Failed to send message:', err);
      // Fallback: local only
      addLocalMessage(chatId, { chatId, senderId: firebaseUser.uid, type: 'text', text });
    }
  }, [firebaseUser, addLocalMessage]);

  const sendMusicMessage = useCallback(async (chatId: string, track: SharedTrack) => {
    const isDemoChat = chatId.startsWith('dm_') || chatId.startsWith('grp_');
    if (isDemoChat || !firebaseUser) {
      addLocalMessage(chatId, { chatId, senderId: firebaseUser?.uid || 'me', type: 'music', track });
      return;
    }

    const msgData = { chatId, senderId: firebaseUser.uid, type: 'music', track, createdAt: serverTimestamp(), isRead: false, reactions: [] };
    try {
      const ref = await addDoc(collection(db, 'chats', chatId, 'messages'), msgData);
      await updateDoc(doc(db, 'chats', chatId), { updatedAt: serverTimestamp(), lastMessageText: `🎵 ${track.title}` });
      const newMsg: Message = { id: ref.id, chatId, senderId: firebaseUser.uid, type: 'music', track, createdAt: new Date().toISOString(), isRead: false, reactions: [] };
      getSocket().emit('send_message', { chatId, message: newMsg });
      setChats(prev => prev.map(c => c.id !== chatId ? c : { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg, unreadCount: 0 }));
    } catch {
      addLocalMessage(chatId, { chatId, senderId: firebaseUser.uid, type: 'music', track });
    }
  }, [firebaseUser, addLocalMessage]);

  const sendMusicToChat = useCallback((chatId: string, track: SharedTrack) => {
    sendMusicMessage(chatId, track);
  }, [sendMusicMessage]);

  const addReaction = useCallback((chatId: string, messageId: string, emoji: string) => {
    const myId = firebaseUser?.uid || 'me';
    setChats(prev => prev.map(c => {
      if (c.id !== chatId) return c;
      return {
        ...c,
        messages: c.messages.map(m => {
          if (m.id !== messageId) return m;
          const existing = m.reactions.find(r => r.emoji === emoji);
          if (existing) {
            const alreadyReacted = existing.userIds.includes(myId);
            return { ...m, reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, userIds: alreadyReacted ? r.userIds.filter(id => id !== myId) : [...r.userIds, myId] } : r).filter(r => r.userIds.length > 0) };
          }
          return { ...m, reactions: [...m.reactions, { emoji, userIds: [myId] }] };
        }),
      };
    }));
  }, [firebaseUser]);

  const markAsRead = useCallback((chatId: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c));
  }, []);

  const acceptFriendRequest = useCallback(async (requestId: string) => {
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'friendships', requestId), { status: 'accepted' });
      } catch { /* ignore */ }
    }
  }, [firebaseUser]);

  const declineFriendRequest = useCallback(async (requestId: string) => {
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'friendships', requestId), { status: 'declined' });
      } catch { /* ignore */ }
    }
  }, [firebaseUser]);

  const startRoom = useCallback((track: SharedTrack) => {
    const room: ListeningRoom = {
      id: `room_${Date.now()}`,
      name: `${me.displayName}'s Room`,
      hostId: me.id,
      track,
      status: 'playing',
      position: 0,
      members: [me],
      createdAt: new Date().toISOString(),
    };
    setActiveRoom(room);
    if (firebaseUser) {
      getSocket().emit('create_room', { room });
    }
  }, [me, firebaseUser]);

  const joinRoom = useCallback((room: ListeningRoom) => {
    setActiveRoom({ ...room, members: [...room.members.filter(m => m.id !== me.id), me] });
    if (firebaseUser) {
      getSocket().emit('join_room', { roomId: room.id, user: me });
    }
  }, [me, firebaseUser]);

  const leaveRoom = useCallback(() => {
    if (activeRoom && firebaseUser) {
      getSocket().emit('leave_room', { roomId: activeRoom.id, userId: me.id });
    }
    setActiveRoom(null);
  }, [activeRoom, me, firebaseUser]);

  const searchUsers = useCallback(async (searchQuery: string): Promise<SocialUser[]> => {
    if (!searchQuery.trim()) return [];
    try {
      const lowerQuery = searchQuery.toLowerCase();
      // For a more robust partial search without a dedicated search engine,
      // we'll fetch up to 100 users and filter locally by displayName or email/username
      const q = query(
        collection(db, 'users'),
        limit(100)
      );
      const snap = await getDocs(q);
      
      const allUsers = snap.docs
        .filter(d => d.id !== firebaseUser?.uid)
        .map(d => buildSocialUser(d.id, d.data()));

      return allUsers.filter(u => 
        u.displayName.toLowerCase().includes(lowerQuery) ||
        u.username.toLowerCase().includes(lowerQuery) ||
        (u.email && u.email.toLowerCase().includes(lowerQuery))
      );
    } catch {
      return [];
    }
  }, [firebaseUser]);

  const sendFriendRequest = useCallback(async (userId: string) => {
    if (!firebaseUser) return;
    try {
      await addDoc(collection(db, 'friendships'), {
        userIds: [firebaseUser.uid, userId],
        requestedBy: firebaseUser.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('[Social] Failed to send friend request:', err);
    }
  }, [firebaseUser]);

  const createDMChat = useCallback(async (user: SocialUser): Promise<string> => {
    if (!firebaseUser) return '';

    // Check if DM already exists
    const existingChat = chats.find(c =>
      c.type === 'dm' &&
      c.members.some(m => m.id === user.id) &&
      !c.id.startsWith('dm_') // not a demo chat
    );
    if (existingChat) return existingChat.id;

    try {
      const chatRef = await addDoc(collection(db, 'chats'), {
        type: 'dm',
        memberIds: [firebaseUser.uid, user.id],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageText: '',
        unreadCounts: { [firebaseUser.uid]: 0, [user.id]: 0 },
      });
      return chatRef.id;
    } catch (err) {
      console.error('[Social] Failed to create chat:', err);
      return '';
    }
  }, [firebaseUser, chats]);

  const sendTyping = useCallback((chatId: string) => {
    if (!firebaseUser || chatId.startsWith('dm_') || chatId.startsWith('grp_')) return;
    getSocket().emit('typing', { chatId, displayName: me.displayName });
  }, [firebaseUser, me.displayName]);

  return (
    <SocialContext.Provider value={{
      me,
      chats,
      contacts,
      friendRequests,
      suggestions,
      activeRoom,
      availableTracks: MOCK_TRACKS,
      isRealMode,
      isOwner,
      sendMessage,
      sendMusicMessage,
      addReaction,
      markAsRead,
      acceptFriendRequest,
      declineFriendRequest,
      startRoom,
      joinRoom,
      leaveRoom,
      getUserById,
      sendMusicToChat,
      searchUsers,
      sendFriendRequest,
      createDMChat,
      typingUsers,
      sendTyping,
      totalUnread,
    }}>
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used inside SocialProvider');
  return ctx;
};
