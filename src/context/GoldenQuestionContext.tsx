// ═══════════════════════════════════════════
// Golden Question (Pop Quiz) Context
// Real-time Firestore onSnapshot + Atomic runTransaction for first-winner locking
// ═══════════════════════════════════════════

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
  runTransaction,
  arrayUnion,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSession } from './SessionContext';
import type { GoldenQuestion } from '../types/goldenQuestion';

interface SubmitResult {
  success: boolean;
  isWinner?: boolean;
  message?: string;
}

interface GoldenQuestionContextType {
  activeQuestion: GoldenQuestion | null;
  loading: boolean;
  isModalOpen: boolean;
  hasAttempted: boolean;
  isWinner: boolean;
  openModal: () => void;
  closeModal: () => void;
  dismissModal: () => void;
  submitAnswer: (selectedIndex: number) => Promise<SubmitResult>;
  dropQuestion: (
    question: string,
    options: string[],
    correctIndex: number,
    points: number
  ) => Promise<void>;
  cancelQuestion: () => Promise<void>;
}

const GoldenQuestionContext = createContext<GoldenQuestionContextType | undefined>(undefined);

export function GoldenQuestionProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const [activeQuestion, setActiveQuestion] = useState<GoldenQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dismissedQuestionId, setDismissedQuestionId] = useState<string | null>(null);

  // 1. Listen in real time (onSnapshot) to goldenQuestions/active
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'goldenQuestions', 'active'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as GoldenQuestion;
          setActiveQuestion(data);
        } else {
          setActiveQuestion(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to goldenQuestions/active:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // 2. Reactive pop-up logic for members
  useEffect(() => {
    if (!activeQuestion) {
      setIsModalOpen(false);
      return;
    }

    // Only auto-pop for members
    if (user?.role !== 'member') {
      return;
    }

    const { isActive, questionId, attemptedBy = [], winnerId } = activeQuestion;

    // If the question is active and user hasn't attempted or dismissed this questionId
    if (isActive) {
      const alreadyAttempted = user?.id ? attemptedBy.includes(user.id) : false;
      const alreadyDismissed = dismissedQuestionId === questionId;

      if (!alreadyAttempted && !alreadyDismissed) {
        setIsModalOpen(true);
      }
    } else {
      // Auto-Dismiss for Everyone:
      // The moment isActive becomes false (solved or cancelled), close for non-winners
      if (winnerId !== user?.id) {
        setIsModalOpen(false);
      }
    }
  }, [activeQuestion, user, dismissedQuestionId]);

  const hasAttempted = Boolean(
    user?.id && activeQuestion?.attemptedBy?.includes(user.id)
  );

  const isWinner = Boolean(
    user?.id && activeQuestion?.winnerId === user.id
  );

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const dismissModal = useCallback(() => {
    if (activeQuestion?.questionId) {
      setDismissedQuestionId(activeQuestion.questionId);
    }
    setIsModalOpen(false);
  }, [activeQuestion?.questionId]);

  // 3. Coordinator Launch: Drop Golden Question ⚡
  const dropQuestion = useCallback(
    async (
      question: string,
      options: string[],
      correctIndex: number,
      points: number
    ) => {
      const questionId = `gq_${Date.now()}`;
      const docRef = doc(db, 'goldenQuestions', 'active');

      await setDoc(docRef, {
        questionId,
        question: question.trim(),
        options: options.map((opt) => opt.trim()),
        correctIndex,
        points: Number(points) || 30,
        isActive: true,
        attemptedBy: [],
        winnerId: null,
        winnerName: null,
        solvedAt: null,
        createdAt: serverTimestamp(),
      });
    },
    []
  );

  // 4. Coordinator Cancel: Cancel Question
  const cancelQuestion = useCallback(async () => {
    const docRef = doc(db, 'goldenQuestions', 'active');
    await updateDoc(docRef, {
      isActive: false,
      cancelledAt: serverTimestamp(),
    });
  }, []);

  // 5. Member Lock In Answer: Atomic runTransaction for first-winner locking
  const submitAnswer = useCallback(
    async (selectedIndex: number): Promise<SubmitResult> => {
      if (!user || !activeQuestion || !activeQuestion.isActive) {
        return { success: false, message: 'Question is no longer active.' };
      }

      if (activeQuestion.attemptedBy?.includes(user.id)) {
        return {
          success: false,
          message: 'Your 1 attempt is used — waiting for someone else to crack it.',
        };
      }

      // ── WRONG ANSWER ──
      if (selectedIndex !== activeQuestion.correctIndex) {
        try {
          const docRef = doc(db, 'goldenQuestions', 'active');
          await updateDoc(docRef, {
            attemptedBy: arrayUnion(user.id),
          });
        } catch (err) {
          console.error('Failed to log wrong attempt:', err);
        }

        return {
          success: false,
          isWinner: false,
          message: 'Wrong answer! Your 1 attempt is used — waiting for someone else to crack it.',
        };
      }

      // ── CORRECT ANSWER (ATOMIC TRANSACTION) ──
      try {
        const activeDocRef = doc(db, 'goldenQuestions', 'active');
        const userDocRef = doc(db, 'users', user.id);

        await runTransaction(db, async (transaction) => {
          const activeSnap = await transaction.get(activeDocRef);
          if (!activeSnap.exists()) {
            throw new Error('NOT_FOUND');
          }

          const freshData = activeSnap.data() as GoldenQuestion;
          // Verify question is still active and matches current questionId
          if (!freshData.isActive || freshData.questionId !== activeQuestion.questionId) {
            throw new Error('ALREADY_SOLVED');
          }

          // Lock in the winner atomically
          transaction.update(activeDocRef, {
            isActive: false,
            winnerId: user.id,
            winnerName: user.name,
            winnerAvatarId: user.avatarId || 'av-07',
            winnerCustomAvatarUrl: user.customAvatarUrl || null,
            winnerTrack: user.track || 'Design',
            solvedAt: serverTimestamp(),
          });

          // Award points to winner
          transaction.update(userDocRef, {
            points: increment(freshData.points),
          });
        });

        // Atomic transaction succeeded! Current user is the verified sole winner.
        const rewardPoints = activeQuestion.points;
        const rewardQuestion = activeQuestion.question;
        const rewardCorrectAnswer = activeQuestion.options[activeQuestion.correctIndex];

        // 1. Log point event in pointEvents
        try {
          await addDoc(collection(db, 'pointEvents'), {
            userId: user.id,
            amount: rewardPoints,
            reason: 'Solved Golden Question',
            createdAt: serverTimestamp(),
          });
        } catch (evtErr) {
          console.error('Error logging pointEvent for winner:', evtErr);
        }

        // 2. Automatically post celebratory announcement on Team Wall (wallPosts)
        try {
          await addDoc(collection(db, 'wallPosts'), {
            postType: 'golden_win',
            title: '⚡ Golden Question Solved!',
            content: `🏆 **${user.name}** was the first to solve the Golden Question!\n\n❓ **Question:** ${rewardQuestion}\n✅ **Correct Answer:** ${rewardCorrectAnswer}\n🎁 **Reward:** +${rewardPoints} PTS awarded!`,
            isPinned: true,
            authorId: user.id,
            authorName: user.name,
            authorAvatarId: user.avatarId || 'av-07',
            authorCustomAvatarUrl: user.customAvatarUrl || null,
            authorTrack: user.track || 'Design',
            winnerId: user.id,
            winnerName: user.name,
            winnerAvatarId: user.avatarId || 'av-07',
            winnerCustomAvatarUrl: user.customAvatarUrl || null,
            winnerTrack: user.track || 'Design',
            questionText: rewardQuestion,
            correctAnswer: rewardCorrectAnswer,
            points: rewardPoints,
            reactions: { '🔥': [user.id] },
            commentCount: 0,
            createdAt: serverTimestamp(),
          });
        } catch (wallErr) {
          console.error('Error creating wall post for winner:', wallErr);
        }

        return {
          success: true,
          isWinner: true,
          message: `🎉 Correct! You were the first to answer and won +${rewardPoints} PTS!`,
        };
      } catch (err: any) {
        console.warn('Transaction outcome:', err?.message || err);
        if (err?.message === 'ALREADY_SOLVED') {
          return {
            success: false,
            isWinner: false,
            message: 'Someone else solved it a split second before you!',
          };
        }
        return {
          success: false,
          isWinner: false,
          message: err?.message || 'Could not verify answer. Please check connection.',
        };
      }
    },
    [user, activeQuestion]
  );

  return (
    <GoldenQuestionContext.Provider
      value={{
        activeQuestion,
        loading,
        isModalOpen,
        hasAttempted,
        isWinner,
        openModal,
        closeModal,
        dismissModal,
        submitAnswer,
        dropQuestion,
        cancelQuestion,
      }}
    >
      {children}
    </GoldenQuestionContext.Provider>
  );
}

export function useGoldenQuestion() {
  const ctx = useContext(GoldenQuestionContext);
  if (!ctx) {
    throw new Error('useGoldenQuestion must be used within GoldenQuestionProvider');
  }
  return ctx;
}
