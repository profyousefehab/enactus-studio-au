import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/icons';
import { SessionProvider } from './context/SessionContext';
import { SessionFeedbackProvider } from './context/SessionFeedbackContext';
import { GoldenQuestionProvider } from './context/GoldenQuestionContext';
import App from './App';
import './index.css';

// Expose admin seed utility in dev console
if (import.meta.env.DEV) {
  import('./utils/seedAdmin').then((m) => {
    (window as unknown as Record<string, unknown>).seedAdmin = m.seedAdmin;
    console.log('💡 Run seedAdmin() in console to create the admin account.');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <SessionFeedbackProvider>
        <GoldenQuestionProvider>
          <App />
        </GoldenQuestionProvider>
      </SessionFeedbackProvider>
    </SessionProvider>
  </StrictMode>,
);
