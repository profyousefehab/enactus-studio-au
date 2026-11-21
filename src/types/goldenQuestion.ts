import type { Timestamp } from 'firebase/firestore';

export interface GoldenQuestion {
  questionId: string;
  question: string;
  options: string[];
  correctIndex: number;
  points: number;
  isActive: boolean;
  attemptedBy: string[];
  winnerId: string | null;
  winnerName: string | null;
  winnerAvatarId?: string | null;
  winnerCustomAvatarUrl?: string | null;
  winnerTrack?: 'Design' | 'Content' | null;
  solvedAt: Timestamp | null;
  createdAt?: Timestamp | null;
  cancelledAt?: Timestamp | null;
}
