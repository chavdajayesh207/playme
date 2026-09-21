/**
 * PlayMe Social Platform — Type Definitions
 */

export type MessageType = 'text' | 'music' | 'playlist' | 'system' | 'voice';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export type ChatType = 'dm' | 'group';

export interface SocialUser {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  avatarColor: string; // fallback gradient for no avatar
  email?: string;      // shown in search results for recognition
  isOnline: boolean;
  lastSeen?: string;
  bio?: string;
  currentlyPlaying?: {
    title: string;
    artist: string;
    trackId: string;
    coverUrl?: string;
  };
}

export interface SharedTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl: string;
  duration: number; // seconds
  youtubeId?: string;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  track?: SharedTrack;
  replyTo?: string;
  reactions: MessageReaction[];
  createdAt: string; // ISO string
  isRead: boolean;
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string; // for group chats
  groupAvatarUrl?: string;
  members: SocialUser[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned?: boolean;
}

export interface FriendRequest {
  id: string;
  from: SocialUser;
  createdAt: string;
}

export interface ListeningRoom {
  id: string;
  name: string;
  hostId: string;
  track?: SharedTrack;
  status: 'playing' | 'paused';
  position: number; // seconds
  members: SocialUser[];
  createdAt: string;
}

export interface SocialState {
  currentUserId: string;
  chats: Chat[];
  contacts: SocialUser[];
  friendRequests: FriendRequest[];
  suggestions: SocialUser[];
  activeRoom: ListeningRoom | null;
}
