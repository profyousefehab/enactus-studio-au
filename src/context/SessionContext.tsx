// ═══════════════════════════════════════════
// Session / Auth Context
// Real-time Firestore onSnapshot listener + Live Toast Notifications
// ═══════════════════════════════════════════

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { collection, doc, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getTier } from '../utils/tiers';

export interface User {
  id: string;
  name: string;
  nameLower: string;
  pinCode: string;
  track: 'Design' | 'Content';
  avatarId: string;
  customAvatarUrl?: string | null;
  role: 'member' | 'admin';
  points: number;
  sessionStreak: number;
  bestStreak: number;
  feedbackPartnerId: string | null;
}

export interface Toast {
  id: string;
  message: string;
}

interface SessionContextType {
  user: User | null;
  loading: boolean;
  login: (pinCode: string, name?: string) => Promise<User | null>;
  setUser: (user: User) => void;
  logout: () => void;
  toast: Toast | null;
  dismissToast: () => void;
}

const STORAGE_KEY = 'enactus_studio_session';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Active user ID restored from localStorage
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { id: string; pinCode: string };
        return parsed.id || null;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Toast notifications queue
  const [toasts, setToasts] = useState<Toast[]>([]);
  const currentToast = toasts[0] || null;

  // Refs to track previous snapshot values for live diffing without firing on initial mount
  const isInitialLoadRef = useRef(true);
  const prevUserRef = useRef<User | null>(null);

  // Auto-dismiss active toast after 4 seconds
  useEffect(() => {
    if (!currentToast) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 4000);
    return () => clearTimeout(timer);
  }, [currentToast?.id]);

  const addToast = (t: Toast) => {
    setToasts((prev) => [...prev, t]);
  };

  const dismissToast = () => {
    setToasts((prev) => prev.slice(1));
  };

  // Compare previous vs incoming snapshot data
  async function checkAndTriggerToasts(prev: User, next: User) {
    const prevTier = getTier(prev.points).name;
    const nextTier = getTier(next.points).name;

    // 1. Tier Level Up Check
    if (next.points > prev.points && nextTier !== prevTier) {
      addToast({
        id: `tier-${Date.now()}`,
        message: `🎉 Level Up! You're now ${nextTier}!`,
      });
    }

    // 2. Points Increase Check
    if (next.points > prev.points) {
      const diff = next.points - prev.points;
      let reasonText = '';
      try {
        const peQ = query(
          collection(db, 'pointEvents'),
          where('userId', '==', next.id),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const peSnap = await getDocs(peQ);
        if (!peSnap.empty) {
          const r = peSnap.docs[0].data().reason;
          if (r) reasonText = ` (${r})`;
        }
      } catch {
        // Fallback without orderBy index
      }

      addToast({
        id: `pts-${Date.now()}`,
        message: `⚡ +${diff} PTS earned!${reasonText}`,
      });
    }

    // 3. Attendance Streak Increase Check
    if (next.sessionStreak > prev.sessionStreak) {
      addToast({
        id: `streak-${Date.now()}`,
        message: `🔥 Streak up! ${next.sessionStreak} sessions in a row`,
      });
    }
  }

  // Live Firestore onSnapshot listener for the logged-in user
  useEffect(() => {
    if (!currentUserId) {
      setUserState(null);
      prevUserRef.current = null;
      isInitialLoadRef.current = true;
      setLoading(false);
      return;
    }

    isInitialLoadRef.current = true;

    const unsub = onSnapshot(
      doc(db, 'users', currentUserId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const updatedUser: User = {
            id: snap.id,
            name: data.name,
            nameLower: data.nameLower,
            pinCode: data.pinCode,
            track: data.track,
            avatarId: data.avatarId,
            customAvatarUrl: data.customAvatarUrl ?? null,
            role: data.role,
            points: data.points ?? 0,
            sessionStreak: data.sessionStreak ?? 0,
            bestStreak: data.bestStreak ?? 0,
            feedbackPartnerId: data.feedbackPartnerId ?? null,
          };

          if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            prevUserRef.current = updatedUser;
          } else {
            const prev = prevUserRef.current;
            if (prev && prev.id === updatedUser.id) {
              checkAndTriggerToasts(prev, updatedUser);
            }
            prevUserRef.current = updatedUser;
          }

          setUserState(updatedUser);
        } else {
          // User deleted from Firestore
          setUserState(null);
          setCurrentUserId(null);
          localStorage.removeItem(STORAGE_KEY);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error in user onSnapshot listener:', error);
        setLoading(false);
      }
    );

    return () => {
      unsub();
    };
  }, [currentUserId]);

  async function login(pinCode: string, name?: string): Promise<User | null> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('pinCode', '==', pinCode), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) return null;

    const docSnap = snap.docs[0];
    const data = docSnap.data();

    // Optional name verification (case-insensitive)
    if (name && data.nameLower !== name.trim().toLowerCase()) {
      return null;
    }

    const u: User = {
      id: docSnap.id,
      name: data.name,
      nameLower: data.nameLower,
      pinCode: data.pinCode,
      track: data.track,
      avatarId: data.avatarId,
      customAvatarUrl: data.customAvatarUrl ?? null,
      role: data.role,
      points: data.points ?? 0,
      sessionStreak: data.sessionStreak ?? 0,
      bestStreak: data.bestStreak ?? 0,
      feedbackPartnerId: data.feedbackPartnerId ?? null,
    };

    isInitialLoadRef.current = true;
    prevUserRef.current = u;
    setUserState(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: u.id, pinCode: u.pinCode }));
    setCurrentUserId(u.id);
    return u;
  }

  function setUser(u: User) {
    isInitialLoadRef.current = true;
    prevUserRef.current = u;
    setUserState(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: u.id, pinCode: u.pinCode }));
    setCurrentUserId(u.id);
  }

  function logout() {
    setCurrentUserId(null);
    setUserState(null);
    prevUserRef.current = null;
    isInitialLoadRef.current = true;
    setToasts([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        login,
        setUser,
        logout,
        toast: currentToast,
        dismissToast,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
