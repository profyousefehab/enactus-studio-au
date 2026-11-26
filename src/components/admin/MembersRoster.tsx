import { useState, useEffect, useMemo, useRef } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';
import TierBadge from '../ui/TierBadge';
import SketchCallout from '../ui/SketchCallout';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useFocusTrap } from '../../utils/useFocusTrap';
import { getTier, getNextTier, getTierProgress } from '../../utils/tiers';
import { isExcludedMember } from '../../utils/accounts';

export interface AdminMember {
  id: string;
  name: string;
  nameLower?: string;
  pinCode: string;
  track: 'Design' | 'Content';
  role: 'member' | 'admin' | 'hr';
  points: number;
  sessionStreak: number;
  bestStreak: number;
  feedbackPartnerId: string | null;
  avatarId: string;
  customAvatarUrl?: string | null;
  createdAt?: any;
}

interface PointEvent {
  id: string;
  amount: number;
  reason: string;
  createdAt: any;
}

const POINT_ACTIONS = [
  { label: '+20 Task Completed', amount: 20, bg: 'var(--color-sticky-note-mint)' },
  { label: '+15 Peer Feedback', amount: 15, bg: 'var(--color-sticky-note-teal)' },
  { label: '+15 Initiative', amount: 15, bg: 'var(--color-sticky-note-teal)' },
  { label: '+10 Session Attendance', amount: 10, bg: 'var(--color-highlighter-yellow)' },
  { label: '\u221210 Missed Deadline', amount: -10, bg: 'var(--color-sticky-note-blush)' },
];

export interface MembersRosterProps {
  showMetrics?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  trackFilter?: 'All' | 'Design' | 'Content';
  onTrackFilterChange?: (t: 'All' | 'Design' | 'Content') => void;
  sortBy?: 'rank-desc' | 'rank-asc' | 'name-asc' | 'streak-desc' | 'pin-asc';
  onSortByChange?: (s: 'rank-desc' | 'rank-asc' | 'name-asc' | 'streak-desc' | 'pin-asc') => void;
}

export default function MembersRoster({
  showMetrics = false,
  searchQuery: externalSearch,
  onSearchQueryChange,
  trackFilter: externalTrack,
  onTrackFilterChange,
  sortBy: externalSort,
  onSortByChange,
}: MembersRosterProps = {}) {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalSearch, setInternalSearch] = useState('');
  const [internalTrack, setInternalTrack] = useState<'All' | 'Design' | 'Content'>('All');
  const [internalSort, setInternalSort] = useState<'rank-desc' | 'rank-asc' | 'name-asc' | 'streak-desc' | 'pin-asc'>('rank-desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<AdminMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const searchQuery = externalSearch !== undefined ? externalSearch : internalSearch;
  const setSearchQuery = onSearchQueryChange || setInternalSearch;

  const trackFilter = externalTrack !== undefined ? externalTrack : internalTrack;
  const setTrackFilter = onTrackFilterChange || setInternalTrack;

  const sortBy = externalSort !== undefined ? externalSort : internalSort;
  const setSortBy = onSortByChange || setInternalSort;

  // Subscribe to users collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
          points: d.data().points ?? 0,
          sessionStreak: d.data().sessionStreak ?? 0,
          bestStreak: d.data().bestStreak ?? 0,
        })) as AdminMember[];

      // Filter out admin, HR, and test accounts from standard committee member rankings
      const filteredMembers = data.filter((m) => !isExcludedMember(m));

      setMembers(filteredMembers);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Sync selectedMember with updated list if open
  useEffect(() => {
    if (selectedMember) {
      const updated = members.find((m) => m.id === selectedMember.id);
      if (updated) {
        setSelectedMember(updated);
      } else {
        setSelectedMember(null);
      }
    }
  }, [members]);

  // Derive Ranks dynamically across the entire committee
  const memberRankings = useMemo(() => {
    // Overall rank sorted by points descending, then sessionStreak desc
    const sortedOverall = [...members].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.sessionStreak - a.sessionStreak;
    });

    const overallMap = new Map<string, number>();
    sortedOverall.forEach((m, idx) => overallMap.set(m.id, idx + 1));

    // Design track rank
    const designTrack = members
      .filter((m) => m.track === 'Design')
      .sort((a, b) => (b.points !== a.points ? b.points - a.points : b.sessionStreak - a.sessionStreak));
    const designMap = new Map<string, number>();
    designTrack.forEach((m, idx) => designMap.set(m.id, idx + 1));

    // Content track rank
    const contentTrack = members
      .filter((m) => m.track === 'Content')
      .sort((a, b) => (b.points !== a.points ? b.points - a.points : b.sessionStreak - a.sessionStreak));
    const contentMap = new Map<string, number>();
    contentTrack.forEach((m, idx) => contentMap.set(m.id, idx + 1));

    return { overallMap, designMap, contentMap };
  }, [members]);

  // Overall aggregate stats
  const stats = useMemo(() => {
    const total = members.length;
    const design = members.filter((m) => m.track === 'Design').length;
    const content = members.filter((m) => m.track === 'Content').length;
    const totalPoints = members.reduce((sum, m) => sum + (m.points || 0), 0);
    const avgPoints = total > 0 ? Math.round(totalPoints / total) : 0;
    return { total, design, content, totalPoints, avgPoints };
  }, [members]);

  // Filtered & Sorted list
  const processedMembers = useMemo(() => {
    let list = members.filter((m) => {
      if (trackFilter !== 'All' && m.track !== trackFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = m.name?.toLowerCase().includes(query);
        const matchesPin = m.pinCode?.includes(query);
        return matchesName || matchesPin;
      }
      return true;
    });

    list.sort((a, b) => {
      const rankA = memberRankings.overallMap.get(a.id) ?? 9999;
      const rankB = memberRankings.overallMap.get(b.id) ?? 9999;

      switch (sortBy) {
        case 'rank-desc':
          return rankA - rankB; // #1 first
        case 'rank-asc':
          return rankB - rankA; // lowest score first
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'streak-desc':
          return b.sessionStreak - a.sessionStreak;
        case 'pin-asc':
          return a.pinCode.localeCompare(b.pinCode);
        default:
          return rankA - rankB;
      }
    });

    return list;
  }, [members, trackFilter, searchQuery, sortBy, memberRankings]);

  function copyText(text: string, id: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleDeleteMember() {
    if (!memberToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      // If member has a feedback partner, clear their partner's reference
      if (memberToDelete.feedbackPartnerId) {
        try {
          const partnerDocRef = doc(db, 'users', memberToDelete.feedbackPartnerId);
          await updateDoc(partnerDocRef, { feedbackPartnerId: null });
        } catch {
          // Partner might not exist or failed to update; continue deletion
        }
      }

      // Check if any other member has this member as feedback partner and clear it
      try {
        const pairedQuery = query(
          collection(db, 'users'),
          where('feedbackPartnerId', '==', memberToDelete.id),
          limit(5)
        );
        const snap = await getDocs(pairedQuery);
        for (const docSnap of snap.docs) {
          await updateDoc(doc(db, 'users', docSnap.id), { feedbackPartnerId: null });
        }
      } catch {
        // ignore
      }

      // Delete orphaned attendance records for this member
      try {
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('userId', '==', memberToDelete.id)
        );
        const attendanceSnap = await getDocs(attendanceQuery);
        for (const docSnap of attendanceSnap.docs) {
          await deleteDoc(doc(db, 'attendance', docSnap.id));
        }
      } catch {
        // Ignore cleanup failure; proceed to delete user
      }

      const deletedName = memberToDelete.name;

      // Delete member document
      await deleteDoc(doc(db, 'users', memberToDelete.id));

      if (selectedMember?.id === memberToDelete.id) {
        setSelectedMember(null);
      }
      setMemberToDelete(null);
      setDeleteSuccess(`Removed member "${deletedName}".`);
      setTimeout(() => setDeleteSuccess(null), 4000);
    } catch (err: any) {
      console.error('Failed to delete member:', err);
      setDeleteError(err?.message || 'Failed to delete member. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ───── Header & Description ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3
              className="text-xl sm:text-2xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
            >
              Members Directory
            </h3>
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded border border-[var(--color-forest-ink)]"
              style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
            >
              {stats.total} TOTAL
            </span>
          </div>
          <p
            className="text-xs sm:text-sm mt-0.5"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}
          >
            Real-time roster with login PINs, committee ranks, score ledger, and attendance streaks.
          </p>
        </div>

        <div className="hidden sm:block">
          <SketchCallout
            text="tap any member for point ledger ⤵"
            arrow="down-right"
            color="#cb5521"
            rotate="-rotate-2"
            fontSize={20}
          />
        </div>
      </div>

      {deleteSuccess && (
        <div className="p-3 rounded-xl border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)] text-[var(--color-forest-ink)] text-xs font-bold font-mono animate-fadeIn flex items-center justify-between">
          <span>{deleteSuccess}</span>
          <button
            type="button"
            onClick={() => setDeleteSuccess(null)}
            className="text-[var(--color-forest-ink)] hover:opacity-70 cursor-pointer"
            aria-label="Dismiss message"
          >
            <Icon icon="solar:close-circle-linear" width={16} height={16} />
          </button>
        </div>
      )}

      {/* ───── Key Metrics Strip (Only rendered if showMetrics is true; otherwise live solely on Dashboard) ───── */}
      {showMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div
            className="p-3 rounded-lg border border-[var(--color-forest-ink)] flex flex-col justify-between"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <span className="text-[11px] font-mono uppercase text-[var(--color-pencil-gray)] font-bold">
              Total Members
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-[var(--color-forest-ink)]">
                {stats.total}
              </span>
              <span className="text-xs font-medium font-inter text-[var(--color-pencil-gray)]">
                active
              </span>
            </div>
          </div>

          <div
            className="p-3 rounded-lg border border-[var(--color-forest-ink)] flex flex-col justify-between"
            style={{ backgroundColor: 'var(--color-sticky-note-teal)' }}
          >
            <span className="text-[11px] font-mono uppercase text-[var(--color-forest-ink)]/80 font-bold">
              Design Track
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-[var(--color-forest-ink)]">
                {stats.design}
              </span>
              <span className="text-xs font-medium font-inter text-[var(--color-forest-ink)]/70">
                creatives
              </span>
            </div>
          </div>

          <div
            className="p-3 rounded-lg border border-[var(--color-forest-ink)] flex flex-col justify-between"
            style={{ backgroundColor: 'var(--color-sticky-note-mint)' }}
          >
            <span className="text-[11px] font-mono uppercase text-[var(--color-forest-ink)]/80 font-bold">
              Content Track
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-[var(--color-forest-ink)]">
                {stats.content}
              </span>
              <span className="text-xs font-medium font-inter text-[var(--color-forest-ink)]/70">
                writers
              </span>
            </div>
          </div>

          <div
            className="p-3 rounded-lg border border-[var(--color-forest-ink)] flex flex-col justify-between"
            style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
          >
            <span className="text-[11px] font-mono uppercase text-[var(--color-forest-ink)] font-bold">
              Total Score
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-[var(--color-forest-ink)]">
                {stats.totalPoints}
              </span>
              <span className="text-xs font-mono font-medium text-[var(--color-forest-ink)]">
                pts (avg {stats.avgPoints})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ───── Search & Filter Toolbar ───── */}
      <div
        className="p-3 sm:p-4 rounded-xl border border-[var(--color-forest-ink)] flex flex-col gap-3"
        style={{ backgroundColor: 'var(--color-cream-paper)' }}
      >
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search Input (Name or PIN) */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-pencil-gray)]">
              <Icon icon="doodle:search" width={16} height={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or 4-digit PIN..."
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none transition-colors"
              style={{
                fontFamily: 'var(--font-inter)',
                backgroundColor: 'white',
                color: 'var(--color-forest-ink)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-[var(--color-pencil-gray)] hover:text-[var(--color-forest-ink)] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono text-[var(--color-pencil-gray)] hidden md:inline">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2 px-2.5 text-xs font-medium rounded-lg border border-[var(--color-pencil-gray)] bg-white text-[var(--color-forest-ink)] cursor-pointer focus:outline-none"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              <option value="rank-desc">Rank / Score (High → Low)</option>
              <option value="rank-asc">Rank / Score (Low → High)</option>
              <option value="name-asc">Name (A → Z)</option>
              <option value="streak-desc">Streak (Highest)</option>
              <option value="pin-asc">Member PIN (#0000)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-[var(--color-forest-ink)] rounded-lg overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 cursor-pointer text-xs flex items-center gap-1 transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-[var(--color-forest-ink)] text-[var(--color-cream-paper)]'
                    : 'bg-white text-[var(--color-forest-ink)] hover:bg-[var(--color-sticky-note-mint)]'
                }`}
                title="Grid Cards View"
              >
                <Icon icon="solar:widget-2-bold" width={14} height={14} />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 cursor-pointer text-xs flex items-center gap-1 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[var(--color-forest-ink)] text-[var(--color-cream-paper)]'
                    : 'bg-white text-[var(--color-forest-ink)] hover:bg-[var(--color-sticky-note-mint)]'
                }`}
                title="Compact Table Ledger"
              >
                <Icon icon="solar:list-bold" width={14} height={14} />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Track Filter Pills */}
        <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-pencil-gray)]/30 flex-wrap">
          <span className="text-xs font-mono text-[var(--color-pencil-gray)]">Track:</span>
          {(['All', 'Design', 'Content'] as const).map((track) => {
            const isActive = trackFilter === track;
            const count =
              track === 'All'
                ? stats.total
                : track === 'Design'
                ? stats.design
                : stats.content;

            return (
              <button
                key={track}
                type="button"
                onClick={() => setTrackFilter(track)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all btn-spring"
                style={{
                  fontFamily: 'var(--font-inter)',
                  backgroundColor: isActive
                    ? 'var(--color-forest-ink)'
                    : 'rgba(26, 51, 0, 0.05)',
                  color: isActive
                    ? 'var(--color-cream-paper)'
                    : 'var(--color-forest-ink)',
                  border: isActive
                    ? '1px solid var(--color-forest-ink)'
                    : '1px solid transparent',
                }}
              >
                {track} ({count})
              </button>
            );
          })}

          {searchQuery && (
            <span className="text-xs font-inter text-[var(--color-pencil-gray)] ml-auto">
              Found {processedMembers.length} of {stats.total}
            </span>
          )}
        </div>
      </div>

      {/* ───── Loading State ───── */}
      {loading && (
        <div className="p-10 text-center flex flex-col items-center justify-center">
          <p
            className="text-sm animate-pulse font-mono"
            style={{ color: 'var(--color-pencil-gray)' }}
          >
            Loading committee roster from Firestore...
          </p>
        </div>
      )}

      {/* ───── Empty State ───── */}
      {!loading && processedMembers.length === 0 && (
        <div
          className="p-8 text-center rounded-xl border border-[var(--color-forest-ink)]"
          style={{ backgroundColor: 'var(--color-cream-paper)' }}
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-sticky-note-blush)] border border-[var(--color-forest-ink)] flex items-center justify-center mb-3">
            <Icon icon="doodle:close" width={24} height={24} style={{ color: 'var(--color-terracotta)' }} />
          </div>
          <p
            className="text-sm font-bold"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
          >
            No members found matching your search.
          </p>
          <p
            className="text-xs mt-1"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}
          >
            Try adjusting your search query or track filter.
          </p>
          {(searchQuery || trackFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTrackFilter('All');
              }}
              className="mt-3 px-3 py-1 text-xs font-semibold underline cursor-pointer"
              style={{ color: 'var(--color-forest-ink)' }}
            >
              Reset filters
            </button>
          )}
        </div>
      )}

      {/* ───── CARDS GRID VIEW ───── */}
      {!loading && processedMembers.length > 0 && viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
          {processedMembers.map((member) => {
            const overallRank = memberRankings.overallMap.get(member.id) ?? 999;
            const trackRank =
              member.track === 'Design'
                ? memberRankings.designMap.get(member.id) ?? 999
                : memberRankings.contentMap.get(member.id) ?? 999;

            const rankBg =
              overallRank === 1
                ? 'var(--color-highlighter-yellow)'
                : overallRank === 2
                ? 'var(--color-sticky-note-mint)'
                : overallRank === 3
                ? 'var(--color-sticky-note-teal)'
                : 'white';

            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="p-4 rounded-xl border border-[var(--color-forest-ink)] flex flex-col justify-between card-spring cursor-pointer transition-all hover:shadow-md relative overflow-hidden group"
                style={{
                  backgroundColor: 'var(--color-cream-paper)',
                }}
              >
                {/* Top Row: Rank Badge + PIN Pill */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    {/* Rank Badge */}
                    <span
                      className="px-2 py-0.5 rounded text-xs font-mono font-bold border border-[var(--color-forest-ink)] flex items-center gap-1 shadow-2xs"
                      style={{
                        backgroundColor: rankBg,
                        color: 'var(--color-forest-ink)',
                      }}
                      title={`Overall Rank #${overallRank}`}
                    >
                      {overallRank === 1 && '🏆'}
                      {overallRank === 2 && '🥈'}
                      {overallRank === 3 && '🥉'}
                      #{overallRank}
                    </span>

                    {/* Track Rank Mini Badge */}
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded text-[var(--color-forest-ink)]/80 bg-black/5"
                    >
                      #{trackRank} in {member.track}
                    </span>
                  </div>

                  {/* Member ID / PIN Pill with One-Click Copy */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      copyText(member.pinCode, member.id);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--color-forest-ink)] cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: 'var(--color-highlighter-yellow)',
                      fontFamily: 'var(--font-mono)',
                    }}
                    title="Click to copy member login PIN"
                  >
                    <span className="text-[11px] font-semibold text-[var(--color-forest-ink)]">
                      PIN #{member.pinCode}
                    </span>
                    {copiedId === member.id ? (
                      <span className="text-[10px] font-bold text-[#1a3300]">✓</span>
                    ) : (
                      <Icon
                        icon="solar:copy-linear"
                        width={12}
                        height={12}
                        className="text-[var(--color-forest-ink)] opacity-70 group-hover:opacity-100"
                      />
                    )}
                  </div>
                </div>

                {/* Member Identity: Avatar + Name + Track */}
                <div className="flex items-center gap-3 mb-3.5">
                  <StudioAvatar
                    avatarId={member.avatarId}
                    customAvatarUrl={member.customAvatarUrl}
                    size={46}
                  />
                  <div className="min-w-0 flex-1">
                    <h4
                      className="text-sm sm:text-base font-bold truncate leading-snug"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        color: 'var(--color-forest-ink)',
                      }}
                    >
                      {member.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <TrackBadge track={member.track} size="sm" />
                      {member.sessionStreak > 0 && (
                        <span
                          className="text-[11px] font-mono font-medium px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 border border-orange-300"
                          title={`${member.sessionStreak} consecutive sessions attended`}
                        >
                          🔥 {member.sessionStreak}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Score + Tier Badge + Deep Dive Button */}
                <div
                  className="pt-2.5 border-t border-[var(--color-pencil-gray)]/40 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    {/* Score */}
                    <span
                      className="text-xs sm:text-sm font-bold font-mono px-2 py-0.5 rounded border border-[var(--color-forest-ink)]"
                      style={{
                        backgroundColor:
                          member.points >= 150
                            ? 'var(--color-sticky-note-mint)'
                            : 'var(--color-cream-paper)',
                        color: 'var(--color-forest-ink)',
                      }}
                    >
                      {member.points} PTS
                    </span>

                    {/* Tier */}
                    <TierBadge points={member.points} size="sm" showName={true} />
                  </div>

                  {/* View Details Icon/Prompt & Delete Action */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteError(null);
                        setMemberToDelete(member);
                      }}
                      className="p-1 rounded text-[var(--color-pencil-gray)] hover:text-[var(--color-terracotta)] hover:bg-red-50 transition-colors cursor-pointer"
                      title={`Delete ${member.name}`}
                      aria-label={`Delete ${member.name}`}
                    >
                      <Icon icon="solar:trash-bin-trash-linear" width={15} height={15} />
                    </button>
                    <span className="text-xs font-semibold text-[var(--color-pencil-gray)] group-hover:text-[var(--color-forest-ink)] flex items-center gap-0.5 transition-colors">
                      <span>Details</span>
                      <Icon icon="solar:arrow-right-linear" width={14} height={14} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ───── COMPACT TABLE / LEDGER VIEW ───── */}
      {!loading && processedMembers.length > 0 && viewMode === 'table' && (
        <div
          className="rounded-xl border border-[var(--color-forest-ink)] overflow-hidden shadow-xs"
          style={{ backgroundColor: 'var(--color-cream-paper)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="border-b border-[var(--color-forest-ink)] text-[11px] font-mono uppercase tracking-wider text-[var(--color-forest-ink)]"
                  style={{ backgroundColor: 'rgba(26, 51, 0, 0.05)' }}
                >
                  <th className="py-2.5 px-3 w-16 text-center">Rank</th>
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">PIN ID</th>
                  <th className="py-2.5 px-3">Track</th>
                  <th className="py-2.5 px-3 text-right">Score</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3 text-center">Streak</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-pencil-gray)]/30 text-sm">
                {processedMembers.map((member) => {
                  const overallRank = memberRankings.overallMap.get(member.id) ?? 999;
                  const trackRank =
                    member.track === 'Design'
                      ? memberRankings.designMap.get(member.id) ?? 999
                      : memberRankings.contentMap.get(member.id) ?? 999;

                  return (
                    <tr
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className="hover:bg-black/2.5 cursor-pointer transition-colors"
                    >
                      {/* Rank */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block font-mono font-bold text-xs px-1.5 py-0.5 rounded border border-[var(--color-forest-ink)] ${
                            overallRank === 1
                              ? 'bg-[var(--color-highlighter-yellow)]'
                              : overallRank === 2
                              ? 'bg-[var(--color-sticky-note-mint)]'
                              : overallRank === 3
                              ? 'bg-[var(--color-sticky-note-teal)]'
                              : 'bg-white'
                          }`}
                        >
                          #{overallRank}
                        </span>
                      </td>

                      {/* Name + Avatar */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <StudioAvatar
                            avatarId={member.avatarId}
                            customAvatarUrl={member.customAvatarUrl}
                            size={32}
                          />
                          <div className="min-w-0">
                            <p
                              className="font-bold truncate text-xs sm:text-sm text-[var(--color-forest-ink)]"
                              style={{ fontFamily: 'var(--font-inter)' }}
                            >
                              {member.name}
                            </p>
                            <span className="text-[10px] font-mono text-[var(--color-pencil-gray)] block sm:hidden">
                              #{trackRank} in {member.track}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* PIN / Member ID */}
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyText(member.pinCode, member.id);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--color-forest-ink)] font-mono text-xs cursor-pointer hover:opacity-90"
                          style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
                          title="Click to copy PIN"
                        >
                          <span>#{member.pinCode}</span>
                          {copiedId === member.id ? (
                            <span className="text-[10px] font-bold text-[#1a3300]">✓</span>
                          ) : (
                            <Icon icon="solar:copy-linear" width={11} height={11} />
                          )}
                        </button>
                      </td>

                      {/* Track */}
                      <td className="py-2.5 px-3">
                        <TrackBadge track={member.track} size="sm" />
                      </td>

                      {/* Score */}
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className="font-mono font-bold text-xs sm:text-sm px-1.5 py-0.5 rounded border border-[var(--color-forest-ink)] bg-white"
                          style={{ color: 'var(--color-forest-ink)' }}
                        >
                          {member.points}
                        </span>
                      </td>

                      {/* Tier */}
                      <td className="py-2.5 px-3">
                        <TierBadge points={member.points} size="sm" showName={true} />
                      </td>

                      {/* Streak */}
                      <td className="py-2.5 px-3 text-center font-mono text-xs">
                        {member.sessionStreak > 0 ? (
                          <span className="text-orange-700 font-bold">
                            🔥 {member.sessionStreak}
                          </span>
                        ) : (
                          <span className="text-[var(--color-pencil-gray)]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMember(member);
                            }}
                            className="px-2 py-1 text-xs font-semibold rounded border border-[var(--color-forest-ink)] bg-white hover:bg-[var(--color-sticky-note-mint)] transition-colors cursor-pointer btn-spring"
                            style={{ fontFamily: 'var(--font-inter)' }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteError(null);
                              setMemberToDelete(member);
                            }}
                            className="p-1 rounded text-[var(--color-pencil-gray)] hover:text-[var(--color-terracotta)] hover:bg-red-50 transition-colors cursor-pointer"
                            title={`Delete ${member.name}`}
                            aria-label={`Delete ${member.name}`}
                          >
                            <Icon icon="solar:trash-bin-trash-linear" width={15} height={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───── MEMBER DETAIL MODAL / DEEP DIVE ───── */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          overallRank={memberRankings.overallMap.get(selectedMember.id) ?? 1}
          trackRank={
            selectedMember.track === 'Design'
              ? memberRankings.designMap.get(selectedMember.id) ?? 1
              : memberRankings.contentMap.get(selectedMember.id) ?? 1
          }
          totalMembers={members.length}
          allMembers={members}
          onClose={() => setSelectedMember(null)}
          onCopy={copyText}
          isCopied={copiedId === selectedMember.id}
          onDelete={(m) => {
            setDeleteError(null);
            setMemberToDelete(m);
          }}
          isDeleteDialogOpen={Boolean(memberToDelete)}
        />
      )}

      {/* Confirm Delete Member Dialog */}
      <ConfirmDialog
        open={Boolean(memberToDelete)}
        title="Delete Member"
        message={`Are you sure you want to permanently delete "${memberToDelete?.name}" (PIN: #${memberToDelete?.pinCode})? All profile data will be permanently removed.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Member'}
        cancelLabel="Cancel"
        destructive={true}
        loading={isDeleting}
        error={deleteError}
        onConfirm={handleDeleteMember}
        onCancel={() => {
          if (!isDeleting) {
            setMemberToDelete(null);
            setDeleteError(null);
          }
        }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════
// Member Deep Dive Modal Component
// Shows full details, score history ledger, and quick point awards
// ══════════════════════════════════════════════════
function MemberDetailModal({
  member,
  overallRank,
  trackRank,
  totalMembers,
  allMembers,
  onClose,
  onCopy,
  isCopied,
  onDelete,
  isDeleteDialogOpen,
}: {
  member: AdminMember;
  overallRank: number;
  trackRank: number;
  totalMembers: number;
  allMembers: AdminMember[];
  onClose: () => void;
  onCopy: (text: string, id: string) => void;
  isCopied: boolean;
  onDelete: (member: AdminMember) => void;
  isDeleteDialogOpen: boolean;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [pointEvents, setPointEvents] = useState<PointEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [applyingPoints, setApplyingPoints] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useFocusTrap(!isDeleteDialogOpen, modalRef, onClose);

  const tier = getTier(member.points);
  const nextTier = getNextTier(member.points);
  const tierProgress = getTierProgress(member.points);

  // Find feedback partner name
  const partner = allMembers.find((m) => m.id === member.feedbackPartnerId);

  // Fetch recent point events for this member
  useEffect(() => {
    const q = query(
      collection(db, 'pointEvents'),
      where('userId', '==', member.id),
      limit(20)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const events = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PointEvent[];

        // In-memory sort by createdAt desc
        events.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() ?? 0;
          const timeB = b.createdAt?.toMillis?.() ?? 0;
          return timeB - timeA;
        });

        setPointEvents(events);
        setLoadingEvents(false);
      },
      (err) => {
        console.error('Error fetching member pointEvents:', err);
        setLoadingEvents(false);
      }
    );

    return () => {
      unsub();
    };
  }, [member.id]);

  // Award or Deduct Points directly for this member
  async function handleAdjustPoints(amount: number, reason: string) {
    if (isNaN(amount) || amount === 0) return;
    setApplyingPoints(true);
    setActionSuccess(null);

    try {
      const userRef = doc(db, 'users', member.id);
      await updateDoc(userRef, {
        points: increment(amount),
      });

      await addDoc(collection(db, 'pointEvents'), {
        userId: member.id,
        amount,
        reason,
        createdAt: Timestamp.now(),
      });

      setActionSuccess(`Successfully applied ${amount > 0 ? `+${amount}` : amount} points!`);
      setCustomAmount('');
      setCustomReason('');
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      console.error('Failed to adjust points:', err);
      alert(`Error adjusting points: ${err?.message || err}`);
    } finally {
      setApplyingPoints(false);
    }
  }

  // Toggle Track (Design ↔ Content)
  async function handleSwitchTrack() {
    const newTrack = member.track === 'Design' ? 'Content' : 'Design';
    if (!window.confirm(`Switch ${member.name}'s track to ${newTrack}?`)) return;

    try {
      await updateDoc(doc(db, 'users', member.id), {
        track: newTrack,
      });
      setActionSuccess(`Track updated to ${newTrack}!`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(`Error updating track: ${err?.message || err}`);
    }
  }

  function formatTimestamp(ts?: any): string {
    if (!ts) return 'Recent';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return (
        d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
        ' · ' +
        d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      return 'Recent';
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      style={{ backgroundColor: 'rgba(26, 51, 0, 0.45)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${member.name} member details`}
        tabIndex={-1}
        className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl border-2 border-[var(--color-forest-ink)] overflow-hidden relative"
        style={{ backgroundColor: 'var(--color-cream-paper)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div
          className="p-4 sm:p-5 border-b border-[var(--color-forest-ink)] flex items-start justify-between gap-3"
          style={{ backgroundColor: 'var(--color-cream-paper)' }}
        >
          <div className="flex items-center gap-3.5">
            <StudioAvatar
              avatarId={member.avatarId}
              customAvatarUrl={member.customAvatarUrl}
              size={56}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="text-lg sm:text-xl font-bold leading-tight"
                  style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
                >
                  {member.name}
                </h3>
                {member.role === 'admin' && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-forest-ink)] text-[var(--color-cream-paper)]">
                    COORDINATOR
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <TrackBadge track={member.track} size="sm" />

                {/* Member ID Pill with copy */}
                <button
                  type="button"
                  onClick={() => onCopy(member.pinCode, member.id)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--color-forest-ink)] font-mono text-xs cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
                  title="Click to copy login PIN"
                >
                  <span>Member ID #{member.pinCode}</span>
                  {isCopied ? (
                    <span className="text-[10px] font-bold text-[#1a3300]">✓ Copied</span>
                  ) : (
                    <Icon icon="solar:copy-linear" width={12} height={12} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[var(--color-forest-ink)] flex items-center justify-center bg-white hover:bg-[var(--color-sticky-note-blush)] cursor-pointer shrink-0 transition-colors"
          >
            <Icon icon="doodle:close" width={16} height={16} style={{ color: 'var(--color-forest-ink)' }} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-5 flex-1">
          {actionSuccess && (
            <div
              className="p-3 rounded-lg border border-[#1a3300] text-xs font-semibold font-inter flex items-center gap-2 animate-fadeIn"
              style={{ backgroundColor: 'var(--color-sticky-note-mint)', color: 'var(--color-forest-ink)' }}
            >
              <Icon icon="solar:check-circle-bold" width={16} height={16} />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* 4-Stat Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Rank Overall */}
            <div
              className="p-3 rounded-xl border border-[var(--color-forest-ink)] text-center flex flex-col justify-center"
              style={{ backgroundColor: 'white' }}
            >
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--color-pencil-gray)]">
                Overall Rank
              </span>
              <p
                className="text-xl sm:text-2xl font-bold font-mono mt-0.5"
                style={{ color: 'var(--color-forest-ink)' }}
              >
                #{overallRank}
              </p>
              <span className="text-[10px] font-mono text-[var(--color-pencil-gray)]">
                of {totalMembers} members
              </span>
            </div>

            {/* Rank in Track */}
            <div
              className="p-3 rounded-xl border border-[var(--color-forest-ink)] text-center flex flex-col justify-center"
              style={{
                backgroundColor:
                  member.track === 'Design'
                    ? 'var(--color-sticky-note-teal)'
                    : 'var(--color-sticky-note-mint)',
              }}
            >
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--color-forest-ink)]/80">
                Track Rank
              </span>
              <p
                className="text-xl sm:text-2xl font-bold font-mono mt-0.5 text-[var(--color-forest-ink)]"
              >
                #{trackRank}
              </p>
              <span className="text-[10px] font-mono text-[var(--color-forest-ink)]/70">
                in {member.track}
              </span>
            </div>

            {/* Score */}
            <div
              className="p-3 rounded-xl border border-[var(--color-forest-ink)] text-center flex flex-col justify-center"
              style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
            >
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--color-forest-ink)]">
                Total Score
              </span>
              <p
                className="text-xl sm:text-2xl font-bold font-mono mt-0.5 text-[var(--color-forest-ink)]"
              >
                {member.points}
              </p>
              <span className="text-[10px] font-mono text-[var(--color-forest-ink)]">
                points earned
              </span>
            </div>

            {/* Attendance Streak */}
            <div
              className="p-3 rounded-xl border border-[var(--color-forest-ink)] text-center flex flex-col justify-center"
              style={{ backgroundColor: 'white' }}
            >
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--color-pencil-gray)]">
                Session Streak
              </span>
              <p
                className="text-xl sm:text-2xl font-bold font-mono mt-0.5 text-orange-700"
              >
                🔥 {member.sessionStreak}
              </p>
              <span className="text-[10px] font-mono text-[var(--color-pencil-gray)]">
                best: {member.bestStreak}
              </span>
            </div>
          </div>

          {/* Tier & Progression Progress */}
          <div
            className="p-3.5 rounded-xl border border-[var(--color-forest-ink)] flex flex-col gap-2"
            style={{ backgroundColor: 'white' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-[var(--color-pencil-gray)] uppercase">
                  Current Tier:
                </span>
                <TierBadge points={member.points} size="sm" />
              </div>
              {nextTier ? (
                <span className="text-xs font-mono text-[var(--color-pencil-gray)]">
                  Next: {nextTier.emoji} {nextTier.name} at {nextTier.minPoints} pts
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-purple-700">
                  💎 Max Tier (Mythic)
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-2.5 rounded-full border border-[var(--color-forest-ink)] overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${tierProgress}%`,
                  backgroundColor: tier.color || 'var(--color-sticky-note-mint)',
                }}
              />
            </div>
          </div>

          {/* Feedback Partner Details */}
          <div
            className="p-3 rounded-xl border border-[var(--color-forest-ink)] flex items-center justify-between gap-3"
            style={{ backgroundColor: 'white' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[var(--color-pencil-gray)] uppercase">
                Feedback Partner:
              </span>
              {partner ? (
                <div className="flex items-center gap-1.5">
                  <StudioAvatar
                    avatarId={partner.avatarId}
                    customAvatarUrl={partner.customAvatarUrl}
                    size={22}
                  />
                  <span className="text-xs font-bold font-inter text-[var(--color-forest-ink)]">
                    {partner.name}
                  </span>
                  <TrackBadge track={partner.track} size="sm" />
                </div>
              ) : (
                <span className="text-xs font-mono text-[var(--color-pencil-gray)] italic">
                  Not paired yet
                </span>
              )}
            </div>

            {/* Switch Track Button */}
            <button
              type="button"
              onClick={handleSwitchTrack}
              className="text-[11px] font-semibold underline text-[var(--color-pencil-gray)] hover:text-[var(--color-forest-ink)] cursor-pointer"
            >
              Switch track →
            </button>
          </div>

          {/* ───── Quick Points Adjuster ───── */}
          <div
            className="p-4 rounded-xl border border-[var(--color-forest-ink)] flex flex-col gap-3"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <div className="flex items-center justify-between">
              <h4
                className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-[var(--color-forest-ink)]"
              >
                Quick Point Award / Penalty
              </h4>
              <span className="text-[11px] font-mono text-[var(--color-pencil-gray)]">
                Coordinator Action
              </span>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POINT_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  disabled={applyingPoints}
                  onClick={() => handleAdjustPoints(action.amount, action.label.replace(/^[+\u2212]\d+\s/, ''))}
                  className="p-2 rounded-lg border border-[var(--color-forest-ink)] text-xs font-bold cursor-pointer btn-spring text-left flex items-center justify-between transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    backgroundColor: action.bg,
                    color: 'var(--color-forest-ink)',
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  <span className="truncate">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Custom Amount Form */}
            <div className="flex gap-2 items-center pt-2 border-t border-[var(--color-pencil-gray)]/30">
              <input
                type="number"
                placeholder="Pts (+/-)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-24 p-2 text-xs font-mono rounded-lg border border-[var(--color-pencil-gray)] bg-white text-[var(--color-forest-ink)] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Custom reason note..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="flex-1 p-2 text-xs font-inter rounded-lg border border-[var(--color-pencil-gray)] bg-white text-[var(--color-forest-ink)] focus:outline-none"
              />
              <button
                type="button"
                disabled={applyingPoints || !customAmount}
                onClick={() => {
                  const amt = parseInt(customAmount);
                  const reason = customReason.trim() || `Manual adjustment (${amt > 0 ? `+${amt}` : amt})`;
                  handleAdjustPoints(amt, reason);
                }}
                className="px-3 py-2 rounded-lg border border-[var(--color-forest-ink)] text-xs font-bold cursor-pointer btn-spring shrink-0 disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--color-forest-ink)',
                  color: 'var(--color-cream-paper)',
                }}
              >
                Apply
              </button>
            </div>
          </div>

          {/* ───── Member Points History Ledger ───── */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h4
                className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-[var(--color-forest-ink)]"
              >
                Points Ledger & Activity
              </h4>
              <span className="text-[11px] font-mono text-[var(--color-pencil-gray)]">
                {pointEvents.length} events recorded
              </span>
            </div>

            {loadingEvents && (
              <p className="text-xs font-mono text-[var(--color-pencil-gray)] animate-pulse py-3 text-center">
                Loading transaction history...
              </p>
            )}

            {!loadingEvents && pointEvents.length === 0 && (
              <div
                className="p-4 text-center rounded-xl border border-[var(--color-pencil-gray)]"
                style={{ backgroundColor: 'white' }}
              >
                <p className="text-xs font-inter text-[var(--color-pencil-gray)]">
                  No point events recorded yet for this member.
                </p>
              </div>
            )}

            {!loadingEvents && pointEvents.length > 0 && (
              <div
                className="rounded-xl border border-[var(--color-forest-ink)] overflow-hidden divide-y divide-[var(--color-pencil-gray)]/30"
                style={{ backgroundColor: 'white' }}
              >
                {pointEvents.map((evt) => {
                  const isPositive = evt.amount > 0;
                  return (
                    <div
                      key={evt.id}
                      className="p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p
                          className="font-semibold text-[var(--color-forest-ink)] truncate font-inter"
                        >
                          {evt.reason || 'Point Transaction'}
                        </p>
                        <p className="text-[10px] font-mono text-[var(--color-pencil-gray)] mt-0.5">
                          {formatTimestamp(evt.createdAt)}
                        </p>
                      </div>

                      <span
                        className="px-2 py-0.5 rounded font-mono font-bold text-xs shrink-0 border"
                        style={{
                          backgroundColor: isPositive
                            ? 'var(--color-sticky-note-mint)'
                            : 'var(--color-sticky-note-blush)',
                          color: isPositive ? 'var(--color-forest-ink)' : 'var(--color-terracotta)',
                          borderColor: isPositive
                            ? 'var(--color-forest-ink)'
                            : 'var(--color-terracotta)',
                        }}
                      >
                        {isPositive ? `+${evt.amount}` : evt.amount} PTS
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div
          className="p-3 sm:p-4 border-t border-[var(--color-forest-ink)] flex flex-wrap items-center justify-between gap-2.5 bg-[var(--color-cream-paper)]"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const text = `Enactus AU Beta\nMember: ${member.name}\nMember ID: #${member.pinCode}\nTrack: ${member.track}\nScore: ${member.points} pts`;
                onCopy(text, member.id);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-forest-ink)] bg-white cursor-pointer btn-spring flex items-center gap-1.5"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              <Icon icon="solar:copy-linear" width={14} height={14} />
              <span>{isCopied ? 'Credentials Copied!' : 'Copy Member Info'}</span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(member)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-terracotta)]/50 bg-white text-[var(--color-terracotta)] hover:bg-[#ffebe6] cursor-pointer btn-spring flex items-center gap-1.5 transition-colors"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              <Icon icon="solar:trash-bin-trash-linear" width={14} height={14} />
              <span>Delete Member</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg border border-[var(--color-forest-ink)] cursor-pointer btn-spring"
            style={{
              backgroundColor: 'var(--color-forest-ink)',
              color: 'var(--color-cream-paper)',
              fontFamily: 'var(--font-inter)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
