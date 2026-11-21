import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import BricolageHeadline from '../components/ui/BricolageHeadline';
import FilterPills from '../components/ui/FilterPills';
import PostComposer from '../components/wall/PostComposer';
import AdminDropCard from '../components/wall/AdminDropCard';
import MemberPostCard from '../components/wall/MemberPostCard';
import SkeletonCard from '../components/ui/SkeletonCard';
import WallEmptyState from '../components/wall/WallEmptyState';
import SketchCallout from '../components/ui/SketchCallout';
import type { WallPost } from '../components/wall/MemberPostCard';
import type { AdminDrop } from '../components/wall/AdminDropCard';

const FILTERS = ['All', 'Admin Drops', 'Community'];

export default function StudioWall() {
  const [filter, setFilter] = useState('All');
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener on wallPosts
  useEffect(() => {
    const q = query(collection(db, 'wallPosts'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as WallPost[];

      // Sort: pinned first, then by createdAt desc
      data.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0; // createdAt ordering already from query
      });

      setPosts(data);
      setLoading(false);
    });

    return unsub;
  }, []);

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    if (filter === 'Admin Drops') return p.postType !== 'member_post';
    if (filter === 'Community') return p.postType === 'member_post';
    return true;
  });

  const adminPosts = filteredPosts.filter((p) => p.postType !== 'member_post');
  const memberPosts = filteredPosts.filter((p) => p.postType === 'member_post');

  return (
    <div className="p-4 flex flex-col gap-4">
      <BricolageHeadline highlight={['Wall']} className="text-3xl">
        Team Wall
      </BricolageHeadline>

      {/* Filter pills */}
      <FilterPills options={FILTERS} active={filter} onChange={setFilter} />

      {/* Post composer */}
      <PostComposer />

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          <SkeletonCard height={100} />
          <SkeletonCard height={80} />
          <SkeletonCard height={80} />
        </div>
      )}

      {/* Admin drops */}
      {!loading && adminPosts.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span
              className="text-[11px] font-bold uppercase tracking-wider font-mono text-[var(--color-pencil-gray)]"
            >
              Announcements & Tasks
            </span>
            <SketchCallout
              text="pinned by coordinator"
              arrow="down-right"
              color="var(--color-forest-ink)"
              rotate="-rotate-2"
              fontSize={22}
            />
          </div>
          {adminPosts.map((post) => (
            <AdminDropCard
              key={post.id}
              post={post as unknown as AdminDrop}
            />
          ))}
        </div>
      )}

      {/* Member posts */}
      {!loading && memberPosts.length > 0 && (
        <div className="flex flex-col gap-3">
          {memberPosts.map((post) => (
            <MemberPostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredPosts.length === 0 && (
        <WallEmptyState
          filter={filter}
          onActionClick={() => {
            if (filter !== 'All') {
              setFilter('All');
            } else {
              const textarea = document.querySelector('textarea');
              textarea?.focus();
            }
          }}
        />
      )}
    </div>
  );
}
