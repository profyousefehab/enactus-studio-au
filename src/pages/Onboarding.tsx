// ═══════════════════════════════════════════
// 3-Step Onboarding Flow
// Step 1: Name + Track → Step 2: Avatar → Step 3: Studio Pass Reveal
// ═══════════════════════════════════════════

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import StickerIcon from '../components/ui/StickerIcon';
import { db } from '../lib/firebase';
import { useSession, type User } from '../context/SessionContext';
import { useFocusTrap } from '../utils/useFocusTrap';
import { AVATARS } from '../data/avatars';
import { compressImage } from '../utils/image';
import BricolageHeadline from '../components/ui/BricolageHeadline';
import StudioAvatar from '../components/ui/StudioAvatar';
import SketchCallout from '../components/ui/SketchCallout';

type Step = 1 | 2 | 3;

export default function Onboarding() {
  const navigate = useNavigate();
  const { login, setUser } = useSession();

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [track, setTrack] = useState<'Design' | 'Content' | null>(null);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [compressingImage, setCompressingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pinCode, setPinCode] = useState('');
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // PIN Login modal state
  const [showLogin, setShowLogin] = useState(false);
  const [loginPin, setLoginPin] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const loginModalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(showLogin, loginModalRef, () => {
    setShowLogin(false);
    setLoginError('');
  });

  const nameValid = /^[A-Za-z\s]{2,}$/.test(name.trim());

  // ───── Step 1: Name + Track ─────
  function renderStep1() {
    return (
      <div className="flex flex-col items-center px-5 pt-10 pb-6 min-h-[calc(100dvh-40px)]">
        {/* Progress */}
        <p className="text-xs mb-6" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pencil-gray)' }}>
          Step 1 of 3
        </p>

        <BricolageHeadline highlight={['Beta']} className="text-4xl text-center mb-2">
          Join the Beta
        </BricolageHeadline>
        <p className="text-base text-center mb-8" style={{ color: 'var(--color-forest-ink)', fontFamily: 'var(--font-inter)' }}>
          Welcome to Social Media & Design!
        </p>

        {/* Name input */}
        <div className="w-full mb-6">
          <label
            htmlFor="onboarding-full-name"
            className="block text-sm font-medium mb-1.5"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
          >
            Full Name (English)
          </label>
          <input
            id="onboarding-full-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Yousef Ehab"
            autoComplete="name"
            inputMode="text"
            className="w-full px-4 py-3 text-base outline-none"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'var(--color-forest-ink)',
              backgroundColor: 'var(--color-cream-paper)',
              border: `1px solid ${name && !nameValid ? 'var(--color-terracotta)' : 'var(--color-forest-ink)'}`,
              borderRadius: 'var(--radius-cards)',
            }}
          />
          {name && !nameValid && (
            <p className="text-xs mt-1.5" style={{ color: 'var(--color-terracotta)', fontFamily: 'var(--font-inter)' }}>
              Please enter your name in English letters only.
            </p>
          )}
        </div>

        {/* Track selection */}
        <div className="w-full mb-8">
          <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
            Choose Your Track
          </label>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Track selection">
            {(['Design', 'Content'] as const).map((t) => {
              const selected = track === t;
              return (
                <button
                  key={t}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTrack(t)}
                  className="flex flex-col items-center justify-center p-5 cursor-pointer card-spring transition-colors duration-150"
                  style={{
                    backgroundColor: selected ? (t === 'Design' ? 'var(--color-sticky-note-teal)' : 'var(--color-sticky-note-teal)') : 'var(--color-cream-paper)',
                    border: selected ? '2px solid var(--color-forest-ink)' : '1px solid var(--color-pencil-gray)',
                    borderRadius: 'var(--radius-cards)',
                  }}
                >
                  <div className="flex items-center justify-center mb-1" style={{ width: 36, height: 36 }}>
                    <StickerIcon
                      name={t === 'Design' ? 'artist-palette' : 'pencil'}
                      size={34}
                    />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-forest-ink)', fontFamily: 'var(--font-inter)' }}>
                    {t}
                  </span>
                  <span className="text-xs mt-0.5" style={{ color: 'var(--color-forest-ink)', fontFamily: 'var(--font-inter)' }}>
                    {t === 'Design' ? 'Visuals, branding & layouts' : 'Copy, ideas & storytelling'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <button
          disabled={!nameValid || !track}
          onClick={() => setStep(2)}
          className="w-full py-4 text-base font-medium cursor-pointer btn-spring transition-opacity duration-150"
          style={{
            fontFamily: 'var(--font-inter)',
            backgroundColor: 'var(--color-forest-ink)',
            color: 'var(--color-cream-paper)',
            borderRadius: 'var(--radius-buttons)',
            opacity: nameValid && track ? 1 : 0.4,
            border: 'none',
          }}
        >
          Continue →
        </button>

        {/* Handwritten sketchbook annotation */}
        <div className="mt-2.5 flex justify-center">
          <SketchCallout
            text="takes less than 30 seconds"
            arrow="up-left"
            color="#cb5521"
            rotate="-rotate-2"
          />
        </div>

        {/* Login link */}
        <button
          onClick={() => setShowLogin(true)}
          className="mt-4 text-sm cursor-pointer underline"
          style={{ color: 'var(--color-forest-ink)', fontFamily: 'var(--font-inter)', background: 'none', border: 'none' }}
        >
          Already have a PIN? Log in →
        </button>

        {/* Login Modal */}
        {showLogin && renderLoginModal()}
      </div>
    );
  }

  // ───── Login Modal ─────
  function renderLoginModal() {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(26, 51, 0, 0.3)' }}
        onClick={() => {
          setShowLogin(false);
          setLoginError('');
        }}
      >
        <div
          ref={loginModalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          tabIndex={-1}
          className="w-full max-w-sm p-6"
          style={{
            backgroundColor: 'var(--color-cream-paper)',
            border: '2px solid var(--color-forest-ink)',
            borderRadius: 'var(--radius-nav)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            id="login-modal-title"
            className="text-xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
          >
            Welcome back!
          </h2>

          <label
            htmlFor="login-name-input"
            className="block text-sm font-medium mb-1"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
          >
            Your Name
          </label>
          <input
            id="login-name-input"
            type="text"
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
            placeholder="e.g. Yousef Ehab"
            autoComplete="name"
            className="w-full px-3 py-2.5 text-sm mb-3 outline-none"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'var(--color-forest-ink)',
              backgroundColor: 'var(--color-cream-paper)',
              border: '1px solid var(--color-forest-ink)',
              borderRadius: 'var(--radius-buttons)',
            }}
          />

          <label
            htmlFor="login-pin-input"
            className="block text-sm font-medium mb-1"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
          >
            4-Digit PIN
          </label>
          <input
            id="login-pin-input"
            type="text"
            value={loginPin}
            onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="e.g. 4829"
            inputMode="numeric"
            maxLength={4}
            className="w-full px-3 py-2.5 text-sm mb-4 outline-none"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-forest-ink)',
              backgroundColor: 'var(--color-cream-paper)',
              border: '1px solid var(--color-forest-ink)',
              borderRadius: 'var(--radius-buttons)',
              letterSpacing: '0.15em',
            }}
          />

          {loginError && (
            <p
              role="alert"
              className="text-xs mb-3"
              style={{ color: 'var(--color-terracotta)', fontFamily: 'var(--font-inter)' }}
            >
              {loginError}
            </p>
          )}

          <button
            type="button"
            disabled={loginPin.length !== 4 || loginLoading}
            onClick={async () => {
              setLoginLoading(true);
              setLoginError('');
              try {
                const user = await login(loginPin, loginName || undefined);
                if (user) {
                  const isHR = user.role?.toString().trim().toLowerCase() === 'hr';
                  if (isHR) {
                    navigate('/hr', { replace: true });
                  } else {
                    navigate('/', { replace: true });
                  }
                } else {
                  setLoginError('No matching account found. Check your PIN and name.');
                }
              } catch (err: unknown) {
                console.error('Login error in Firestore:', err);
                const message =
                  err instanceof Error
                    ? err.message
                    : typeof err === 'string'
                      ? err
                      : 'Failed to log in due to a database error.';
                setLoginError(message);
              } finally {
                setLoginLoading(false);
              }
            }}
            className="w-full py-3 min-h-[44px] text-sm font-medium cursor-pointer mb-2"
            style={{
              fontFamily: 'var(--font-inter)',
              backgroundColor: 'var(--color-forest-ink)',
              color: 'var(--color-cream-paper)',
              borderRadius: 'var(--radius-buttons)',
              opacity: loginPin.length === 4 && !loginLoading ? 1 : 0.4,
              border: 'none',
            }}
          >
            {loginLoading ? 'Logging in...' : 'Log In →'}
          </button>
          <button
            type="button"
            onClick={() => { setShowLogin(false); setLoginError(''); }}
            className="w-full py-2 min-h-[44px] text-sm cursor-pointer"
            style={{ color: 'var(--color-forest-ink)', fontFamily: 'var(--font-inter)', background: 'none', border: 'none' }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressingImage(true);
    setError('');
    try {
      const dataUrl = await compressImage(file, 200, 0.75);
      setCustomAvatarUrl(dataUrl);
      setAvatarId('custom');
    } catch (err) {
      console.error('Image compression error:', err);
      setError(err instanceof Error ? err.message : 'Could not process image.');
    } finally {
      setCompressingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ───── Step 2: Avatar Picker ─────
  function renderStep2() {
    const firstName = name.trim().split(' ')[0];
    const hasSelection = Boolean(customAvatarUrl || avatarId);

    return (
      <div className="flex flex-col items-center px-5 pt-10 pb-6">
        <p className="text-xs mb-6" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pencil-gray)' }}>
          Step 2 of 3
        </p>

        <BricolageHeadline highlight={[firstName]} className="text-3xl text-center mb-6">
          {`Hi ${firstName}, pick your avatar!`}
        </BricolageHeadline>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Option 1: Custom Photo Upload or Preview */}
        {customAvatarUrl ? (
          <div
            className="w-full p-3.5 mb-5 flex items-center justify-between gap-3 card-spring"
            style={{
              backgroundColor: 'var(--color-sticky-note-mint)',
              border: '2px solid var(--color-forest-ink)',
              borderRadius: 'var(--radius-cards)',
            }}
          >
            <div className="flex items-center gap-3">
              <img
                src={customAvatarUrl}
                alt="Custom photo preview"
                className="w-20 h-20 rounded-full object-cover shrink-0 select-none"
                style={{
                  border: '2px solid var(--color-forest-ink)',
                }}
              />
              <div className="min-w-0">
                <span
                  className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 inline-block mb-1"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: 'var(--color-forest-ink)',
                    color: 'var(--color-cream-paper)',
                    borderRadius: 'var(--radius-buttons)',
                  }}
                >
                  Custom Photo
                </span>
                <p
                  className="text-sm font-bold truncate leading-tight"
                  style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
                >
                  Photo Selected
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)', opacity: 0.8 }}
                >
                  Center-cropped & ready
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold cursor-pointer btn-spring"
                style={{
                  fontFamily: 'var(--font-inter)',
                  backgroundColor: 'var(--color-cream-paper)',
                  color: 'var(--color-forest-ink)',
                  border: '1px solid var(--color-forest-ink)',
                  borderRadius: 'var(--radius-buttons)',
                }}
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomAvatarUrl(null);
                  setAvatarId(null);
                }}
                className="px-3 py-1 text-[11px] cursor-pointer"
                style={{
                  fontFamily: 'var(--font-inter)',
                  color: 'var(--color-terracotta)',
                  background: 'none',
                  border: 'none',
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={compressingImage}
            className="w-full p-4 mb-5 flex items-center justify-center gap-3 cursor-pointer card-spring"
            style={{
              backgroundColor: 'var(--color-cream-paper)',
              border: '2px dashed var(--color-forest-ink)',
              borderRadius: 'var(--radius-cards)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--color-highlighter-yellow)',
                border: '1px solid var(--color-forest-ink)',
              }}
            >
              <Icon icon="doodle:camera" width={22} height={22} style={{ color: 'var(--color-forest-ink)' }} />
            </div>
            <div className="text-left min-w-0">
              <p
                className="text-sm font-bold"
                style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
              >
                {compressingImage ? 'Optimizing photo...' : 'Upload your own photo'}
              </p>
              <p
                className="text-xs"
                style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}
              >
                Auto center-cropped to square (or pick an avatar below)
              </p>
            </div>
          </button>
        )}

        {/* Divider */}
        <div className="flex items-center gap-2 w-full mb-3">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-pencil-gray)' }} />
          <span
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pencil-gray)' }}
          >
            Or pick a team avatar
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-pencil-gray)' }} />
        </div>

        {/* Avatar grid */}
        <div className="grid grid-cols-4 gap-3 w-full mb-8">
          {AVATARS.map((av) => {
            const selected = !customAvatarUrl && avatarId === av.id;
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => {
                  setAvatarId(av.id);
                  setCustomAvatarUrl(null);
                }}
                className="aspect-square flex items-center justify-center cursor-pointer overflow-hidden card-spring transition-colors duration-150 p-2"
                style={{
                  backgroundColor: selected ? 'var(--color-sticky-note-mint)' : 'var(--color-cream-paper)',
                  border: selected ? '2px solid var(--color-forest-ink)' : '1px solid var(--color-pencil-gray)',
                  borderRadius: 'var(--radius-cards)',
                }}
                aria-label={`Avatar ${av.id}`}
                aria-pressed={selected}
              >
                <StudioAvatar avatarId={av.id} size={56} />
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => setStep(1)}
            className="flex-1 py-3 text-sm font-medium cursor-pointer btn-spring"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'var(--color-forest-ink)',
              backgroundColor: 'var(--color-cream-paper)',
              border: '1px solid var(--color-forest-ink)',
              borderRadius: 'var(--radius-buttons)',
            }}
          >
            ← Back
          </button>
          <button
            disabled={!hasSelection || loading || compressingImage}
            onClick={handleCreateUser}
            className="flex-[2] py-3 text-sm font-medium cursor-pointer btn-spring transition-opacity duration-150"
            style={{
              fontFamily: 'var(--font-inter)',
              backgroundColor: 'var(--color-forest-ink)',
              color: 'var(--color-cream-paper)',
              borderRadius: 'var(--radius-buttons)',
              opacity: hasSelection && !loading && !compressingImage ? 1 : 0.4,
              border: 'none',
            }}
          >
            {loading ? 'Creating...' : 'Confirm Avatar →'}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="w-full mt-4 p-3.5 flex items-start gap-2.5 text-left"
            style={{
              backgroundColor: 'rgba(203, 85, 33, 0.1)',
              border: '1px solid var(--color-terracotta)',
              borderRadius: 'var(--radius-buttons)',
            }}
          >
            <StickerIcon name="warning" size={18} className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold"
                style={{ color: 'var(--color-terracotta)', fontFamily: 'var(--font-inter)' }}
              >
                Failed to create user
              </p>
              <p
                className="text-xs mt-0.5 break-words font-mono"
                style={{ color: 'var(--color-forest-ink)' }}
              >
                {error}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ───── Create User in Firestore ─────
  async function handleCreateUser() {
    if (!nameValid || !track || (!avatarId && !customAvatarUrl)) return;
    setLoading(true);
    setError('');

    try {
      // Pre-flight check for Firebase environment configuration
      if (!import.meta.env.VITE_FIREBASE_PROJECT_ID || !import.meta.env.VITE_FIREBASE_API_KEY) {
        throw new Error('Firebase configuration missing: check your .env variables (VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_API_KEY).');
      }

      // Generate unique 4-digit PIN
      let pin = '';
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 20) {
        pin = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        const q = query(collection(db, 'users'), where('pinCode', '==', pin), limit(1));
        const snap = await getDocs(q);
        isUnique = snap.empty;
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Could not generate a unique 4-digit PIN after 20 attempts. Please try again.');
      }

      // Create user document
      const docRef = await addDoc(collection(db, 'users'), {
        name: name.trim(),
        nameLower: name.trim().toLowerCase(),
        pinCode: pin,
        track,
        avatarId: avatarId || 'custom',
        customAvatarUrl: customAvatarUrl || null,
        role: 'member',
        points: 0,
        sessionStreak: 0,
        bestStreak: 0,
        feedbackPartnerId: null,
        createdAt: Timestamp.now(),
      });

      // Save user record in local state for Step 3 display
      setCreatedUser({
        id: docRef.id,
        name: name.trim(),
        nameLower: name.trim().toLowerCase(),
        pinCode: pin,
        track,
        avatarId: avatarId || 'custom',
        customAvatarUrl: customAvatarUrl || null,
        role: 'member',
        points: 0,
        sessionStreak: 0,
        bestStreak: 0,
        feedbackPartnerId: null,
      });

      setPinCode(pin);
      setStep(3);
    } catch (err: unknown) {
      console.error('Failed to create user in Firestore:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Unknown Firestore error occurred during user creation.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // ───── Step 3: Studio Pass Reveal ─────
  function renderStep3() {
    return (
      <div className="flex flex-col items-center justify-center px-5 pt-10 pb-6 min-h-[calc(100dvh-40px)]">
        <p className="text-xs mb-6" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pencil-gray)' }}>
          Step 3 of 3
        </p>

        <BricolageHeadline highlight={['Member Pass']} className="text-3xl text-center mb-2">
          Beta Member Pass
        </BricolageHeadline>
        <p className="text-sm font-medium text-center mb-6" style={{ color: 'var(--color-forest-ink)', fontFamily: 'var(--font-inter)' }}>
          Welcome to Social Media & Design!
        </p>

        {/* Beta Member Pass Card Container with Washi Tape and Callout */}
        <div className="relative w-full max-w-xs mt-8">
          {/* Callout sitting cleanly above the card's top border and to the left of washi tape */}
          <div className="absolute -top-9 right-10 z-20 pointer-events-none select-none">
            <SketchCallout
              text="screenshot this!"
              arrow="down-right"
              color="#cb5521"
              rotate="-rotate-2"
              fontSize={23}
              arrowPosition="right"
            />
          </div>

          {/* Translucent yellow Washi Tape strip on top-right corner */}
          <div
            className="absolute -top-3.5 right-2 z-10 w-22 h-6 pointer-events-none -rotate-12"
            style={{
              backgroundColor: 'rgba(255, 233, 92, 0.85)',
              border: '1px dashed rgba(26, 51, 0, 0.25)',
              backdropFilter: 'blur(2px)',
            }}
          />

          <div
            className="w-full p-6 flex flex-col items-center gap-4 card-spring"
            style={{
              backgroundColor: 'var(--color-cream-paper)',
              border: '2px solid var(--color-forest-ink)',
              borderRadius: 'var(--radius-nav)',
            }}
          >
          {/* Avatar */}
          <StudioAvatar avatarId={avatarId || 'av-01'} customAvatarUrl={customAvatarUrl} size={80} />

          {/* Name */}
          <p className="text-lg font-bold text-center" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
            {name.trim()}
          </p>

          {/* Track badge */}
          <span
            className="text-xs font-medium px-3 py-1 inline-flex items-center gap-1.5"
            style={{
              backgroundColor: track === 'Design' ? 'var(--color-sticky-note-mint)' : 'var(--color-sticky-note-teal)',
              color: 'var(--color-forest-ink)',
              borderRadius: 'var(--radius-tags)',
            }}
          >
            <StickerIcon
              name={track === 'Design' ? 'artist-palette' : 'pencil'}
              size={16}
            />
            {track}
          </span>

          {/* Member ID PIN */}
          <div
            className="px-5 py-3 text-center"
            style={{
              backgroundColor: 'var(--color-highlighter-yellow)',
              borderRadius: 'var(--radius-buttons)',
            }}
          >
            <p className="text-xs font-semibold mb-0.5" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
              Member ID (PIN)
            </p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-ink)', letterSpacing: '0.15em' }}>
              #{pinCode}
            </p>
          </div>
        </div>
      </div>

        {/* Microcopy */}
        <p className="text-xs text-center mt-4 max-w-xs" style={{ color: 'var(--color-pencil-gray)', fontFamily: 'var(--font-inter)' }}>
          Save this 4-digit code—you'll need it if you log in from another device.
        </p>

        {/* CTA */}
        <button
          onClick={() => {
            if (createdUser) {
              setUser(createdUser);
            }
            navigate('/');
          }}
          className="w-full max-w-xs mt-6 py-4 text-base font-medium cursor-pointer btn-spring"
          style={{
            fontFamily: 'var(--font-inter)',
            backgroundColor: 'var(--color-forest-ink)',
            color: 'var(--color-cream-paper)',
            borderRadius: 'var(--radius-buttons)',
            border: 'none',
          }}
        >
          Enter Team Wall →
        </button>
      </div>
    );
  }

  // ───── Render current step ─────
  return (
    <div style={{ backgroundColor: 'var(--color-cream-paper)', minHeight: '100dvh' }}>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
}
