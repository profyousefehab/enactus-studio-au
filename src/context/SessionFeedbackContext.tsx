import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSession } from './SessionContext';

export interface SessionFeedbackSettings {
  isOpen: boolean;
  sessionId: string;
  sessionTitle: string;
  openedAt?: any;
}

interface SessionFeedbackContextType {
  feedbackSettings: SessionFeedbackSettings | null;
  loading: boolean;
  isModalOpen: boolean;
  hasSubmitted: boolean;
  isFeedbackLive: boolean; // isOpen && !hasSubmitted
  openModal: () => void;
  closeModal: () => void;
  dismissModal: () => void;
  submitFeedback: (rating: number, message: string) => Promise<void>;
  activateFeedback: (sessionTitle: string) => Promise<string>;
  closeFeedback: () => Promise<void>;
}

const SessionFeedbackContext = createContext<SessionFeedbackContextType | undefined>(undefined);

export function SessionFeedbackProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const [feedbackSettings, setFeedbackSettings] = useState<SessionFeedbackSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Real-time listener for settings/sessionFeedback
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'sessionFeedback'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as SessionFeedbackSettings;
          setFeedbackSettings(data);
        } else {
          setFeedbackSettings({
            isOpen: false,
            sessionId: '',
            sessionTitle: '',
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to sessionFeedback settings:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // 2. Check if current user has already submitted for the current sessionId
  useEffect(() => {
    if (!user || !feedbackSettings?.sessionId || !feedbackSettings.isOpen) {
      setHasSubmitted(false);
      return;
    }

    const sessionId = feedbackSettings.sessionId;
    const localKey = `feedback_submitted_${user.id}_${sessionId}`;

    // Fast check: localStorage
    if (localStorage.getItem(localKey) === 'true') {
      setHasSubmitted(true);
      return;
    }

    // Secondary verify with Firestore
    const q = query(
      collection(db, 'sessionFeedbackResponses'),
      where('sessionId', '==', sessionId),
      where('userId', '==', user.id),
      limit(1)
    );

    getDocs(q)
      .then((snap) => {
        if (!snap.empty) {
          localStorage.setItem(localKey, 'true');
          setHasSubmitted(true);
        } else {
          setHasSubmitted(false);
        }
      })
      .catch((err) => {
        console.warn('Error checking existing feedback submission:', err);
      });
  }, [user, feedbackSettings?.sessionId, feedbackSettings?.isOpen]);

  // 3. Auto-open modal when feedback opens and member hasn't submitted & hasn't dismissed yet
  useEffect(() => {
    if (!user) {
      setIsModalOpen(false);
      return;
    }

    // Only regular members get the auto-pop-up modal (coordinators manage it from Admin Panel)
    if (user.role === 'admin') {
      setIsModalOpen(false);
      return;
    }

    if (feedbackSettings?.isOpen && !hasSubmitted) {
      const sessionId = feedbackSettings.sessionId;
      const dismissedInSession = sessionStorage.getItem(`feedback_dismissed_${user.id}_${sessionId}`) === 'true';

      if (!dismissedInSession && !isDismissed) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(false);
    }
  }, [feedbackSettings?.isOpen, feedbackSettings?.sessionId, hasSubmitted, isDismissed, user]);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const dismissModal = useCallback(() => {
    if (user && feedbackSettings?.sessionId) {
      sessionStorage.setItem(`feedback_dismissed_${user.id}_${feedbackSettings.sessionId}`, 'true');
    }
    setIsDismissed(true);
    setIsModalOpen(false);
  }, [user, feedbackSettings?.sessionId]);

  // 4. Submit feedback response to sessionFeedbackResponses
  const submitFeedback = useCallback(
    async (rating: number, message: string) => {
      if (!user || !feedbackSettings?.sessionId) {
        throw new Error('User not authenticated or no active feedback session.');
      }

      const responseDoc = {
        sessionId: feedbackSettings.sessionId,
        sessionTitle: feedbackSettings.sessionTitle || 'Live Session',
        userId: user.id,
        userName: user.name,
        userAvatarId: user.avatarId || 'custom',
        userCustomAvatarUrl: user.customAvatarUrl || null,
        userTrack: user.track,
        rating,
        message: message.trim(),
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'sessionFeedbackResponses'), responseDoc);

      // Record submitted state in localStorage and state
      localStorage.setItem(`feedback_submitted_${user.id}_${feedbackSettings.sessionId}`, 'true');
      setHasSubmitted(true);
      setIsModalOpen(false);
    },
    [user, feedbackSettings]
  );

  // 5. Coordinator control: Activate feedback
  const activateFeedback = useCallback(
    async (sessionTitle: string) => {
      const sessionId = `session_${Date.now()}`;
      const title = sessionTitle.trim() || 'Session Review';

      await setDoc(
        doc(db, 'settings', 'sessionFeedback'),
        {
          isOpen: true,
          sessionId,
          sessionTitle: title,
          openedAt: Timestamp.now(),
        },
        { merge: true }
      );

      // Reset local dismissed state
      setIsDismissed(false);
      return sessionId;
    },
    []
  );

  // 6. Coordinator control: Close feedback
  const closeFeedback = useCallback(async () => {
    await updateDoc(doc(db, 'settings', 'sessionFeedback'), {
      isOpen: false,
    });
    setIsModalOpen(false);
  }, []);

  const isFeedbackLive = Boolean(feedbackSettings?.isOpen && !hasSubmitted);

  return (
    <SessionFeedbackContext.Provider
      value={{
        feedbackSettings,
        loading,
        isModalOpen,
        hasSubmitted,
        isFeedbackLive,
        openModal,
        closeModal,
        dismissModal,
        submitFeedback,
        activateFeedback,
        closeFeedback,
      }}
    >
      {children}
    </SessionFeedbackContext.Provider>
  );
}

export function useSessionFeedback() {
  const context = useContext(SessionFeedbackContext);
  if (!context) {
    throw new Error('useSessionFeedback must be used within a SessionFeedbackProvider');
  }
  return context;
}
