// ═══════════════════════════════════════════
// Admin Seed Utility
// Creates the initial admin account in Firestore
// Run once: import and call seedAdmin() from browser console or a temp button
// ═══════════════════════════════════════════

import { collection, query, where, getDocs, addDoc, Timestamp, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function seedAdmin() {
  const PIN = '1234';
  const NAME = 'Yousef Ehab';

  // Check if admin already exists
  const q = query(collection(db, 'users'), where('pinCode', '==', PIN), limit(1));
  const snap = await getDocs(q);

  if (!snap.empty) {
    console.log('⚠️ Admin account already exists:', snap.docs[0].data());
    return snap.docs[0].id;
  }

  const docRef = await addDoc(collection(db, 'users'), {
    name: NAME,
    nameLower: NAME.toLowerCase(),
    pinCode: PIN,
    track: 'Design',
    avatarId: 'av-07', // Crown avatar
    role: 'admin',
    points: 0,
    sessionStreak: 0,
    bestStreak: 0,
    feedbackPartnerId: null,
    createdAt: Timestamp.now(),
  });

  console.log('✅ Admin account created! ID:', docRef.id);
  console.log(`   Name: ${NAME}`);
  console.log(`   PIN: ${PIN}`);
  console.log(`   Track: Design`);
  console.log(`   Role: admin`);

  return docRef.id;
}
