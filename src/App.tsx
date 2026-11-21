import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './context/SessionContext';
import { SessionFeedbackProvider } from './context/SessionFeedbackContext';
import { GoldenQuestionProvider } from './context/GoldenQuestionContext';
import TopHeader from './components/layout/TopHeader';
import BackgroundWave from './components/layout/BackgroundWave';
import SessionFeedbackModal from './components/feedback/SessionFeedbackModal';
import GoldenQuestionModal from './components/popquiz/GoldenQuestionModal';
import LiveToast from './components/ui/LiveToast';
import Onboarding from './pages/Onboarding';
import StudioWall from './pages/StudioWall';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Guidelines from './pages/Guidelines';
import AdminPanel from './pages/AdminPanel';

function AppRoutes() {
  const { user, loading } = useSession();

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: 'var(--color-cream-paper)' }}
      >
        <p
          className="text-sm animate-pulse"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pencil-gray)' }}
        >
          Loading...
        </p>
      </div>
    );
  }

  // Not logged in → show onboarding
  if (!user) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Logged in → show app shell with routes
  return (
    <div className="relative min-h-screen">
      <BackgroundWave />
      <TopHeader />
      <LiveToast />
      <SessionFeedbackModal />
      <GoldenQuestionModal />
      <main className="relative z-10">
        <Routes>
          <Route path="/" element={<StudioWall />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route
            path="/admin"
            element={user.role === 'admin' ? <AdminPanel /> : <Navigate to="/" replace />}
          />
          <Route
            path="/admin/members"
            element={user.role === 'admin' ? <AdminPanel initialTab="members" /> : <Navigate to="/" replace />}
          />
          <Route path="/onboarding" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionFeedbackProvider>
        <GoldenQuestionProvider>
          <AppRoutes />
        </GoldenQuestionProvider>
      </SessionFeedbackProvider>
    </BrowserRouter>
  );
}
