import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

test('R1: AdminPanel navigation groups & labels', () => {
  const adminPanelSrc = fs.readFileSync(path.join(projectRoot, 'src/pages/AdminPanel.tsx'), 'utf-8');

  // Verify Groups
  assert.match(adminPanelSrc, /name:\s*['"]OVERVIEW['"]/);
  assert.match(adminPanelSrc, /name:\s*['"]PEOPLE['"]/);
  assert.match(adminPanelSrc, /name:\s*['"]LIVE SESSION['"]/);
  assert.match(adminPanelSrc, /name:\s*['"]TEAM COMMS['"]/);

  // Verify short nav labels
  assert.match(adminPanelSrc, /label:\s*['"]Dashboard['"]/);
  assert.match(adminPanelSrc, /label:\s*['"]Members['"]/);
  assert.match(adminPanelSrc, /label:\s*['"]Attendance['"]/);
  assert.match(adminPanelSrc, /label:\s*['"]Points['"]/);
  assert.match(adminPanelSrc, /label:\s*['"]Quiz['"]/);
  assert.match(adminPanelSrc, /label:\s*['"]Feedback['"]/);
  assert.match(adminPanelSrc, /label:\s*['"]Random Picker['"]/);
  assert.match(adminPanelSrc, /label:\s*['"]Wall Drops['"]/);
  assert.match(adminPanelSrc, /label:\s*['"]Pairing['"]/);

  // Verify aria-current on active item for accessibility
  assert.match(adminPanelSrc, /aria-current=\{isActive \? 'page' : undefined\}/);

  // Verify mobile accordion preserved
  assert.match(adminPanelSrc, /className="md:hidden/);
  assert.match(adminPanelSrc, /aria-expanded=\{isOpen\}/);

  // Verify state hoisting above responsive branches
  assert.match(adminPanelSrc, /const \[rosterSearch, setRosterSearch\] = useState/);
  assert.match(adminPanelSrc, /const \[rosterTrackFilter, setRosterTrackFilter\] = useState/);
  assert.match(adminPanelSrc, /const \[rosterSortBy, setRosterSortBy\] = useState/);
});

test('R2: Real Dashboard Home & no duplicated stat cards', () => {
  const adminPanelSrc = fs.readFileSync(path.join(projectRoot, 'src/pages/AdminPanel.tsx'), 'utf-8');
  const dashboardSrc = fs.readFileSync(path.join(projectRoot, 'src/components/admin/DashboardHome.tsx'), 'utf-8');
  const rosterSrc = fs.readFileSync(path.join(projectRoot, 'src/components/admin/MembersRoster.tsx'), 'utf-8');

  // Dashboard is default home
  assert.match(adminPanelSrc, /return 'dashboard'/);

  // Old 'all' stacked 8-section view removed
  assert.doesNotMatch(adminPanelSrc, /activeTab === 'all'/);

  // 4 stat cards live on Dashboard
  assert.match(dashboardSrc, /Total Members/);
  assert.match(dashboardSrc, /Design Track/);
  assert.match(dashboardSrc, /Content Track/);
  assert.match(dashboardSrc, /Total Points/);

  // Stat cards are loading-aware (skeleton / dash, not false zero)
  assert.match(dashboardSrc, /stats\.loading \? '—'/);

  // Quick actions row with 4 session-day buttons
  assert.match(dashboardSrc, /Session Day Quick Actions/);
  assert.match(dashboardSrc, /Take attendance/);
  assert.match(dashboardSrc, /Launch quiz/);
  assert.match(dashboardSrc, /Collect feedback/);
  assert.match(dashboardSrc, /Post a drop/);

  // Needs your attention list with real data and honest empty state
  assert.match(dashboardSrc, /Needs Your Attention/);
  assert.match(dashboardSrc, /All clear! Session operations are running smoothly/);

  // MembersRoster hides metrics by default to avoid duplicate cards outside Dashboard
  assert.match(rosterSrc, /showMetrics = false/);
  assert.match(rosterSrc, /\{showMetrics && \(/);
});

test('R3: Shared Two-Column Section Template on Desktop with Sticky Rail', () => {
  const files = [
    'src/components/admin/AttendanceLogger.tsx',
    'src/components/admin/SessionFeedbackManager.tsx',
    'src/components/admin/WallDropPublisher.tsx',
    'src/components/admin/FeedbackPairer.tsx',
    'src/components/admin/GoldenQuestionLauncher.tsx',
  ];

  for (const file of files) {
    const src = fs.readFileSync(path.join(projectRoot, file), 'utf-8');

    // 2-column grid at desktop breakpoint
    assert.match(src, /grid-cols-1 lg:grid-cols-12/);

    // Left column ~2/3
    assert.match(src, /lg:col-span-7 xl:col-span-8/);

    // Right column ~1/3 sticky controls rail
    assert.match(src, /lg:col-span-5 xl:col-span-4 sticky top-20/);
  }
});

test('R4: Slimmer Header', () => {
  const adminPanelSrc = fs.readFileSync(path.join(projectRoot, 'src/pages/AdminPanel.tsx'), 'utf-8');

  // Reduced to one slim line with logo/back button, Coordinator Mode badge, compact stats
  assert.match(adminPanelSrc, /← Team Wall/);
  assert.match(adminPanelSrc, /COORDINATOR MODE/);
  assert.match(adminPanelSrc, /· Coordinator Workspace/);
  assert.match(adminPanelSrc, /stats\.loading \? \(/);
});

test('R5: Density and Hierarchy Polish', () => {
  const files = [
    'src/components/admin/SessionAttendance.tsx',
    'src/components/admin/PointsManager.tsx',
    'src/components/admin/SessionFeedbackManager.tsx',
    'src/components/admin/WallDropPublisher.tsx',
    'src/components/admin/FeedbackPairer.tsx',
    'src/components/admin/GoldenQuestionLauncher.tsx',
    'src/components/admin/DashboardHome.tsx',
  ];

  for (const file of files) {
    const src = fs.readFileSync(path.join(projectRoot, file), 'utf-8');

    // Primary CTA uses Forest Ink background
    assert.match(src, /var\(--color-forest-ink\)/);

    // Count SketchCallout occurrences (at most 1 per file)
    const callouts = (src.match(/<SketchCallout/g) || []).length;
    assert.ok(callouts <= 1, `${file} has ${callouts} callouts, expected <= 1`);
  }
});

test('R7: Separate Attendance & Points Pages', () => {
  const attendanceSrc = fs.readFileSync(path.join(projectRoot, 'src/components/admin/SessionAttendance.tsx'), 'utf-8');
  const pointsSrc = fs.readFileSync(path.join(projectRoot, 'src/components/admin/PointsManager.tsx'), 'utf-8');

  // Attendance: sessions list + new session creation
  assert.match(attendanceSrc, /New Session/);
  assert.match(attendanceSrc, /Create Attendance Session/);

  // Attendance: large ID input check-in
  assert.match(attendanceSrc, /Rapid Member ID Check-In/);
  assert.match(attendanceSrc, /Attend Member \(Enter\)/);

  // Attendance: edge cases handling
  assert.match(attendanceSrc, /already checked in/);
  assert.match(attendanceSrc, /Unknown ID/);

  // Attendance: undo check-in action
  assert.match(attendanceSrc, /handleUndoCheckIn/);
  assert.match(attendanceSrc, />\s*Undo\s*</);

  // Attendance: secondary full roster toggle
  assert.match(attendanceSrc, /Manual Roster Checklist/);

  // Points: search & track filters
  assert.match(pointsSrc, /Search member name or PIN/);
  assert.match(pointsSrc, /trackFilter/);

  // Points: sticky bottom action bar with actions
  assert.match(pointsSrc, /fixed bottom-4/);
  assert.match(pointsSrc, /\+20 Task Completed/);
  assert.match(pointsSrc, /\+10 Session/);
  assert.match(pointsSrc, /\+15 Initiative/);
  assert.match(pointsSrc, /\\u221210 Missed Deadline/);
  assert.match(pointsSrc, /Custom\.\.\./);
});

test('R6: Copy Simplifications', () => {
  const adminPanelSrc = fs.readFileSync(path.join(projectRoot, 'src/pages/AdminPanel.tsx'), 'utf-8');
  const feedbackSrc = fs.readFileSync(path.join(projectRoot, 'src/components/admin/SessionFeedbackManager.tsx'), 'utf-8');

  // Short navigation labels
  assert.match(adminPanelSrc, /label:\s*'Quiz'/);
  assert.match(adminPanelSrc, /label:\s*'Feedback'/);
  assert.match(adminPanelSrc, /label:\s*'Pairing'/);
  assert.match(adminPanelSrc, /label:\s*'Members'/);

  // Subtitle shortened
  assert.match(adminPanelSrc, /Coordinator Workspace/);
  assert.doesNotMatch(adminPanelSrc, /Social Media & Design Track Management Workstation/);

  // Renamed heading
  assert.match(feedbackSrc, /Feedback results/);
  assert.doesNotMatch(feedbackSrc, /Feedback Results & Sentiment/);
});

test('R8: HR Role, Dedicated HR Panel & Coordinator HR Accounts Manager', () => {
  const sessionSrc = fs.readFileSync(path.join(projectRoot, 'src/context/SessionContext.tsx'), 'utf-8');
  const appSrc = fs.readFileSync(path.join(projectRoot, 'src/App.tsx'), 'utf-8');
  const hrPanelSrc = fs.readFileSync(path.join(projectRoot, 'src/pages/HRPanel.tsx'), 'utf-8');
  const hrManagerSrc = fs.readFileSync(path.join(projectRoot, 'src/components/admin/HRAccountsManager.tsx'), 'utf-8');
  const adminPanelSrc = fs.readFileSync(path.join(projectRoot, 'src/pages/AdminPanel.tsx'), 'utf-8');
  const rulesSrc = fs.readFileSync(path.join(projectRoot, 'firestore.rules'), 'utf-8');

  // 1. HR Role in SessionContext
  assert.match(sessionSrc, /role:\s*'member'\s*\|\s*'admin'\s*\|\s*'hr'/);

  // 2. Strict route guard in App.tsx: HR users only reach /hr
  assert.match(appSrc, /user\.role === 'hr'/);
  assert.match(appSrc, /path="\/hr"\s*element=\{<HRPanel \/>\}/);
  assert.match(appSrc, /path="\*"\s*element=\{<Navigate to="\/hr" replace \/>\}/);

  // 3. HRPanel: mobile-first + desktop sidebar, exactly Attendance & Points, no member app leaks
  assert.match(hrPanelSrc, /HR MODE/);
  assert.match(hrPanelSrc, /<SessionAttendance \/>/);
  assert.match(hrPanelSrc, /<PointsManager \/>/);
  assert.doesNotMatch(hrPanelSrc, /<MembersRoster/);
  assert.doesNotMatch(hrPanelSrc, /<GoldenQuestionLauncher/);
  assert.doesNotMatch(hrPanelSrc, /<WallDropPublisher/);

  // 4. Coordinator HR Accounts Manager
  assert.match(adminPanelSrc, /label:\s*'HR Accounts'/);
  assert.match(adminPanelSrc, /case 'hr-accounts':\s*return <HRAccountsManager \/>/);
  assert.match(hrManagerSrc, /Create HR Account/);
  assert.match(hrManagerSrc, /deleteDoc\(doc\(db, 'users', account\.id\)\)/);
  assert.match(hrManagerSrc, /role:\s*'hr'/);

  // 5. Firestore security rules allow role 'hr' and deletions for account/attendance management
  assert.match(rulesSrc, /request\.resource\.data\.role == 'hr'/);
  assert.match(rulesSrc, /match \/users\/\{userId\} \{[\s\S]*?allow delete: if true;/);
  assert.match(rulesSrc, /match \/attendance\/\{attId\} \{[\s\S]*?delete: if true;/);
});
