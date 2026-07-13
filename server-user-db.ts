import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "server_data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

export interface SessionRecord {
  sessionId: string;
  deviceInfo: string;
  os: string;
  browser: string;
  ipAddress: string;
  loginTime: number;
  lastActive: number;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string;
  isVerified: boolean;
  createdAt: number;
  updatedAt: number;
  lastLogin: number;
  resetToken?: string;
  resetTokenExpiry?: number;
  verificationToken?: string;
  verificationTokenExpiry?: number;
  phoneNumber?: string;
  favorites?: string[];
  history?: any[];
  followedArtists?: string[];
  sessions?: SessionRecord[];
}

class UserDb {
  private users: Record<string, UserRecord> = {};

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(USERS_FILE)) {
      try {
        const raw = fs.readFileSync(USERS_FILE, "utf-8");
        this.users = JSON.parse(raw);
        console.log(`[User DB] Loaded ${Object.keys(this.users).length} user profiles.`);
      } catch (e) {
        console.error("[User DB] Error loading user database, resetting:", e);
        this.users = {};
      }
    } else {
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2), "utf-8");
    } catch (e) {
      console.error("[User DB] Error saving user database:", e);
    }
  }

  public findByEmail(email: string): UserRecord | null {
    const cleanEmail = email.trim().toLowerCase();
    for (const id in this.users) {
      if (this.users[id].email.toLowerCase() === cleanEmail) {
        return this.users[id];
      }
    }
    return null;
  }

  public findById(id: string): UserRecord | null {
    return this.users[id] || null;
  }

  public findByResetToken(token: string): UserRecord | null {
    for (const id in this.users) {
      const u = this.users[id];
      if (u.resetToken === token && u.resetTokenExpiry && u.resetTokenExpiry > Date.now()) {
        return u;
      }
    }
    return null;
  }

  public findByVerificationToken(token: string): UserRecord | null {
    for (const id in this.users) {
      const u = this.users[id];
      if (u.verificationToken === token && u.verificationTokenExpiry && u.verificationTokenExpiry > Date.now()) {
        return u;
      }
    }
    return null;
  }

  public create(name: string, email: string, passwordHash: string): UserRecord {
    const cleanEmail = email.trim().toLowerCase();
    const id = crypto.randomUUID();
    const now = Date.now();
    const user: UserRecord = {
      id,
      name,
      email: cleanEmail,
      passwordHash,
      avatar: `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(name)}&backgroundColor=transparent&baseColor=f9a8d4,fcd34d,86efac,93c5fd&mouth=smile,laughing`,
      isVerified: false,
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
      favorites: [],
      history: [],
      followedArtists: [],
      sessions: []
    };
    this.users[id] = user;
    this.save();
    return user;
  }

  public update(id: string, updates: Partial<UserRecord>): UserRecord | null {
    if (!this.users[id]) return null;
    this.users[id] = {
      ...this.users[id],
      ...updates,
      updatedAt: Date.now()
    };
    this.save();
    return this.users[id];
  }

  // --- Session Management ---

  public addSession(userId: string, session: SessionRecord): void {
    const user = this.users[userId];
    if (user) {
      if (!user.sessions) user.sessions = [];
      user.sessions.push(session);
      this.save();
    }
  }

  public removeSession(userId: string, sessionId: string): void {
    const user = this.users[userId];
    if (user && user.sessions) {
      user.sessions = user.sessions.filter(s => s.sessionId !== sessionId);
      this.save();
    }
  }

  public clearSessions(userId: string, exceptSessionId?: string): void {
    const user = this.users[userId];
    if (user) {
      if (exceptSessionId && user.sessions) {
        user.sessions = user.sessions.filter(s => s.sessionId === exceptSessionId);
      } else {
        user.sessions = [];
      }
      this.save();
    }
  }

  public getSessions(userId: string): SessionRecord[] {
    return this.users[userId]?.sessions || [];
  }

  public updateSessionActivity(userId: string, sessionId: string): void {
    const user = this.users[userId];
    if (user && user.sessions) {
      const session = user.sessions.find(s => s.sessionId === sessionId);
      if (session) {
        session.lastActive = Date.now();
        this.save();
      }
    }
  }

  public isValidSession(userId: string, sessionId: string): boolean {
    const user = this.users[userId];
    if (!user || !user.sessions) return false;
    return user.sessions.some(s => s.sessionId === sessionId);
  }
}

export const userDb = new UserDb();
