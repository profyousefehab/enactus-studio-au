import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import StudioAvatar from '../ui/StudioAvatar';
import SketchCallout from '../ui/SketchCallout';
import ConfirmDialog from '../ui/ConfirmDialog';

interface HRAccount {
  id: string;
  name: string;
  pinCode: string;
  role: string;
  avatarId?: string;
  createdAt?: any;
}

export default function HRAccountsManager() {
  const [hrAccounts, setHrAccounts] = useState<HRAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Creation form state
  const [name, setName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Deletion confirmation state
  const [hrToDelete, setHrToDelete] = useState<HRAccount | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Subscribe to all HR accounts
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as HRAccount))
        .filter((u) => u.role === 'hr');
      data.sort((a, b) => a.name.localeCompare(b.name));
      setHrAccounts(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Quick helper to generate a random 4-digit PIN
  function handleGeneratePin() {
    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    setPinCode(randomPin);
    setErrorMsg('');
  }

  // Handle creating a new HR account
  async function handleCreateHR(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedName = name.trim();
    const trimmedPin = pinCode.trim();

    if (!trimmedName) {
      setErrorMsg('Please enter an HR user name.');
      return;
    }

    if (trimmedPin.length !== 4 || !/^\d{4}$/.test(trimmedPin)) {
      setErrorMsg('PIN must be exactly 4 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check PIN uniqueness in users collection
      const q = query(collection(db, 'users'), where('pinCode', '==', trimmedPin));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setErrorMsg(`PIN "${trimmedPin}" is already assigned to another user. Please choose a different PIN.`);
        setIsSubmitting(false);
        return;
      }

      // Create HR user document
      await addDoc(collection(db, 'users'), {
        name: trimmedName,
        nameLower: trimmedName.toLowerCase(),
        pinCode: trimmedPin,
        role: 'hr',
        track: 'Design',
        avatarId: '1',
        points: 0,
        sessionStreak: 0,
        bestStreak: 0,
        feedbackPartnerId: null,
        createdAt: Timestamp.now(),
      });

      setSuccessMsg(`✓ Created HR account for "${trimmedName}" (PIN: ${trimmedPin})`);
      setName('');
      setPinCode('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error('Error creating HR account:', err);
      setErrorMsg(`Failed to create account: ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Prompt removal of an HR account
  function handleRemoveHR(account: HRAccount) {
    setRemoveError(null);
    setHrToDelete(account);
  }

  async function confirmRemoveHR() {
    const account = hrToDelete;
    if (!account) return;
    setIsRemoving(true);
    setRemoveError(null);

    try {
      await deleteDoc(doc(db, 'users', account.id));
      setSuccessMsg(`Removed HR account "${account.name}".`);
      setHrToDelete(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error removing HR account:', err);
      setRemoveError('Failed to remove account: ' + (err?.message || err));
    } finally {
      setIsRemoving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-mono animate-pulse text-[var(--color-pencil-gray)]">
          Loading HR accounts...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ───── In-Page Header ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-pencil-gray)]/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-forest-ink)]"
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              HR Accounts Manager
            </h2>
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-[var(--color-forest-ink)]"
              style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
            >
              ACCESS CONTROL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-pencil-gray)]" style={{ fontFamily: 'var(--font-inter)' }}>
            Create and remove HR accounts. HR users log in with their PIN and only have access to Attendance & Points.
          </p>
        </div>

        <SketchCallout
          text="session attendance access ⤵"
          arrow="down-right"
          color="#cb5521"
          rotate="-rotate-2"
          fontSize={18}
        />
      </div>

      {/* ───── Shared 2-Column Section Template (Desktop lg+) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (~2/3): Existing HR Accounts List */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon icon="doodle:shield" width={18} height={18} className="text-[var(--color-forest-ink)]" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                Active HR Accounts ({hrAccounts.length})
              </span>
            </div>
            <span className="text-xs font-mono text-[var(--color-pencil-gray)]">
              Limited to Attendance & Points
            </span>
          </div>

          {successMsg && (
            <div className="p-3 rounded-xl border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)] text-[var(--color-forest-ink)] text-xs font-bold font-mono animate-fadeIn flex items-center justify-between">
              <span>{successMsg}</span>
              <button
                type="button"
                onClick={() => setSuccessMsg('')}
                className="text-[var(--color-forest-ink)] hover:opacity-70 cursor-pointer"
              >
                <Icon icon="doodle:close" width={14} height={14} />
              </button>
            </div>
          )}

          {hrAccounts.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[var(--color-pencil-gray)] bg-white/60">
              <div className="w-10 h-10 rounded-full border border-[var(--color-forest-ink)] bg-[var(--color-highlighter-yellow)] flex items-center justify-center mx-auto mb-2">
                <Icon icon="doodle:shield" width={20} height={20} className="text-[var(--color-forest-ink)]" />
              </div>
              <p className="text-sm font-bold text-[var(--color-forest-ink)] font-inter">
                No HR accounts created yet.
              </p>
              <p className="text-xs text-[var(--color-pencil-gray)] font-inter mt-0.5">
                Use the form on the right to grant an operations member HR panel access.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {hrAccounts.map((account) => (
                <div
                  key={account.id}
                  className="p-4 rounded-xl border border-[var(--color-forest-ink)] bg-white flex flex-col justify-between gap-3 shadow-2xs card-spring"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <StudioAvatar avatarId={account.avatarId || '1'} size={36} />
                      <div className="min-w-0">
                        <h4
                          className="text-xs sm:text-sm font-bold truncate text-[var(--color-forest-ink)]"
                          style={{ fontFamily: 'var(--font-inter)' }}
                        >
                          {account.name}
                        </h4>
                        <span
                          className="inline-block mt-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)] text-[var(--color-forest-ink)]"
                        >
                          ROLE: HR
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-cream-paper)] border border-[var(--color-forest-ink)] text-[var(--color-forest-ink)]">
                        PIN: {account.pinCode}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <span className="text-[11px] text-[var(--color-pencil-gray)] font-mono">
                      Session Check-in Access
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveHR(account)}
                      className="px-2 py-1 text-xs font-semibold rounded-lg border border-[var(--color-terracotta)]/40 bg-white text-[var(--color-terracotta)] hover:bg-[#ffebe6] cursor-pointer btn-spring transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (~1/3): Sticky Create HR Account Rail */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-20 z-10 flex flex-col gap-4">
          <div
            className="p-4 sm:p-5 rounded-2xl border-2 border-[var(--color-forest-ink)] shadow-sm flex flex-col gap-4"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <div className="pb-2 border-b border-[var(--color-pencil-gray)]/30">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                Create HR Account
              </span>
              <p className="text-[11px] text-[var(--color-pencil-gray)] font-inter mt-0.5">
                Assign a coordinator helper who only needs attendance check-in.
              </p>
            </div>

            <form onSubmit={handleCreateHR} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1 text-[var(--color-forest-ink)] font-inter">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Ahmed"
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-white text-[var(--color-forest-ink)]"
                  style={{ fontFamily: 'var(--font-inter)' }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[var(--color-forest-ink)] font-inter">
                    4-Digit Login PIN
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePin}
                    className="text-[11px] font-mono font-bold text-[var(--color-forest-ink)] underline cursor-pointer hover:opacity-80"
                  >
                    Generate Random
                  </button>
                </div>

                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="e.g. 5824"
                  maxLength={4}
                  inputMode="numeric"
                  className="w-full text-sm p-2.5 rounded-lg border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-white font-mono text-center tracking-widest text-[var(--color-forest-ink)]"
                />
              </div>

              {errorMsg && (
                <div className="p-2 rounded-lg border border-[var(--color-terracotta)] bg-[#ffebe6] text-[var(--color-terracotta)] text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Exactly ONE dark-green primary CTA */}
              <button
                type="submit"
                disabled={!name.trim() || pinCode.length !== 4 || isSubmitting}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-xl border border-[var(--color-forest-ink)] cursor-pointer btn-spring transition-opacity disabled:opacity-40 text-center"
                style={{
                  fontFamily: 'var(--font-inter)',
                  backgroundColor: 'var(--color-forest-ink)',
                  color: 'var(--color-cream-paper)',
                }}
              >
                {isSubmitting ? 'Creating HR Account...' : 'Create HR Account →'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(hrToDelete)}
        title="Remove HR Account"
        message={`Are you sure you want to remove HR account for "${hrToDelete?.name}"? They will no longer be able to log in.`}
        confirmLabel={isRemoving ? 'Removing...' : 'Remove Account'}
        cancelLabel="Cancel"
        destructive={true}
        loading={isRemoving}
        error={removeError}
        onConfirm={confirmRemoveHR}
        onCancel={() => {
          if (!isRemoving) {
            setHrToDelete(null);
            setRemoveError(null);
          }
        }}
      />
    </div>
  );
}
