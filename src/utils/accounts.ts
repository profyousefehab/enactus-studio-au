/**
 * Determines whether a user account should be hidden from student committee rankings,
 * member rosters, attendance sessions, points adjustments, and pairing.
 *
 * Excludes:
 * - Admin coordinator accounts (role === 'admin' or name 'Yousef Ehab')
 * - HR operations accounts (role === 'hr')
 * - Test accounts (e.g. 'youse test', 'test account')
 */
export function isExcludedMember(user: { role?: string; name?: string } | null | undefined): boolean {
  if (!user) return true;
  const role = user.role?.toString().trim().toLowerCase();
  if (role === 'admin' || role === 'hr') return true;

  const name = user.name?.trim().toLowerCase() || '';
  if (
    name === 'yousef ehab' ||
    name === 'youse test' ||
    name.startsWith('youse test') ||
    name === 'test' ||
    name === 'test account' ||
    name.includes('test account')
  ) {
    return true;
  }

  return false;
}
