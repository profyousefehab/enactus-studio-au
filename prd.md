# Product Requirements Document (PRD)
## Enactus AU — Social Media & Design Studio App (PWA)

| Metadata | Details |
| :--- | :--- |
| **Product Name** | Enactus AU — Social Media & Design Studio |
| **Document Version** | 2.0 (Final — Ready for Development) |
| **Platform** | Mobile-First Progressive Web App (PWA) |
| **Target Audience** | Enactus AU Social Media & Design Beta Committee (`Design` & `Content` tracks) |
| **Product Owner** | Yousef Ehab (Social Media & Design Coordinator) |
| **Season Timeline** | Last week of November to mid-January |

---

## 1. Executive Summary & Vision

### 1.1 Product Vision
Build an intuitive, zero-confusion, mobile-first studio hub for the **Social Media & Design** beta members at Enactus AU. Designed with the warm, tactile aesthetic of a creative agency sketchbook on cream paper (`SayBriefly` visual language), the app turns the season's learning journey into an engaging studio experience—combining an interactive community wall, clear progress tracking, gaming-inspired tiers, and streamlined coordinator tools.

### 1.2 Core Product Goals
1. **Zero-Confusion Onboarding:** Get members onboarded in under 45 seconds using an English-only name, a binary track choice (`Design` or `Content`), a visual avatar pick (without distracting character names), and an instant auto-generated 4-digit Studio Pass PIN.
2. **Centralized Studio Wall:** Provide an active home feed where coordinators publish highlighted announcements, tasks, and resources while members freely post, react, and comment.
3. **Structured, Readable Profile Cards:** Give every member a well-spaced, card-based profile displaying their Studio ID, `🔥` session attendance streak, gaming-inspired progression tier (`Potato` → `Mythic`), overall Social Media rank, track-specific rank, and bi-weekly Feedback Partner.
4. **Fast Admin Operations:** Equip the coordinator with a clean admin panel to publish wall drops, log attendance and points, pair feedback partners, and run random member picks during sessions.

---

## 2. User Roles & Permissions

| Role | Access & Capabilities |
| :--- | :--- |
| **Member (`Design` or `Content`)** | Self-onboards (Name + Track + Avatar → receives 4-digit PIN); logs in on any device with Name + 4-digit PIN; posts, reacts, and comments on the Studio Wall; views their Profile and the Leaderboard. |
| **Admin (Coordinator)** | All Member capabilities + access to the **Admin Panel**: publish highlighted/pinned Wall Drops (`Announcement`, `Task`, `Resource`), log session attendance (updating streaks), award/deduct points (updating ranks & tiers), assign Feedback Partners, and use the Session Random Picker. |

---

## 3. Design System & Visual Identity (`SayBriefly` Sketchbook Aesthetic)

The interface must strictly adhere to a warm, hand-crafted **creative studio moodboard** aesthetic on cream paper—combining generous spacing, flat pastel sticky-note cards, chunky sticker-like display headlines, and high-contrast forest-green ink.

### 3.1 Color Tokens

| Token Name | Hex Value | CSS Variable | Usage Rules |
| :--- | :--- | :--- | :--- |
| **Cream Paper** | `#fcfaf5` | `--color-cream-paper` | Primary page canvas, default card surfaces, and slide-out sidebar background. Never use pure `#ffffff` as the main background. |
| **Forest Ink** | `#1a3300` | `--color-forest-ink` | Primary text, `1px` structural borders, monoline sketch doodles, and filled primary CTA buttons. Never use pure `#000000` for body text. |
| **Highlighter Yellow** | `#ffe95c` | `--color-highlighter-yellow` | Marker-pen highlight wash behind keywords in display headlines, 4-digit PIN badges, and point pills. **Never use as a primary CTA button background.** |
| **Pencil Gray** | `#b6b6b6` | `--color-pencil-gray` | Subtle hairlines, card dividers, and secondary borders. |
| **Whisper Gray** | `#f1f1f1` | `--color-whisper-gray` | Muted helper backgrounds and subtle empty states. |
| **Sticky Note Mint** | `#d5f5c2` | `--color-sticky-note-mint` | Admin wall drops (`Announcement`/`Task`), positive `🔥` streak card, and podium accents. |
| **Sticky Note Teal** | `#a8e5e5` | `--color-sticky-note-teal` | Active sidebar navigation state, selected track card during onboarding, and Feedback Partner profile card. |
| **Sticky Note Blush** | `#f6d0ff` | `--color-sticky-note-blush` | Tier progression profile card and special spotlight accents. |
| **Terracotta** | `#cb5521` | `--color-terracotta` | Urgent deadlines or missed-streak alerts (use sparingly). |

### 3.2 Typography System

* **Display Headlines Only — `Bricolage Grotesque` (Weight `800`):**
  * Color: `#1a3300`, `line-height: 1.0`, positive letter-spacing (`0.04em` to `0.05em`) for a chunky sticker-book feel.
  * **Strict Rule:** Use ONLY for large display titles (`>= 32px`). Never use for body text, navigation, or small labels.
* **UI, Body, Buttons & Cards — `Inter` (Weights `400`, `500`, `600`, `700`):**
  * `400` for body copy (`16px–18px`, `line-height: 1.5`), `500–600` for buttons and labels, `700` for card/section headings.
* **Codes, Ranks, Points & Metadata — `Roboto Mono` (Weight `400`):**
  * Used for 4-digit Studio PINs (`#4920`), leaderboard ranks (`#01`), point badges (`+20 PTS`), and streak counts.

### 3.3 Shapes, Elevation & Layout Rules
* **Mobile-First Frame:** Portrait-first (`360px+` width), centered inside a `max-width: 480px` phone container on desktop viewports (Admin Panel may expand up to `768px` on desktop for comfortable table/checklist management).
* **Corner Radii:** `6px` for buttons and tags, `12px` for cards, `16px` for floating containers, `9999px` for circular avatars and filter pills.
* **Flat Tactile Hierarchy:** Separate layers with pastel sticky-note fills and `1px` solid `#1a3300` or `#b6b6b6` borders—no heavy drop shadows. Primary CTA buttons are filled `#1a3300` with `#fcfaf5` text, `6px` radius, and an inline `→` glyph (`Continue →`).
* **Atmospheric Doodles:** Subtle, unfilled `1px–2px` monoline hand-drawn SVG sketches in `#1a3300` (`~20%` opacity) placed delicately in onboarding headers and empty states.
* **Accessibility & Motion:** Respect `prefers-reduced-motion` across all transitions.

---

## 4. Detailed User Journey & Functional Specifications

### 4.1 Step 1: Onboarding — Name & Track Selection
* **Layout:** Single-focus screen on Cream Paper (`#fcfaf5`) with a bold `Bricolage Grotesque` headline (highlighting a keyword in `#ffe95c`).
* **Full Name Input (English Only):**
  * Text input enforcing English letters and spaces only (`^[A-Za-z\s]+$`).
  * Real-time validation: If Arabic or invalid characters are typed, display a gentle inline helper note: *"Please enter your name in English letters only."*
  * Requires at least 2 characters.
* **Track Selection (Binary Visual Choice):**
  * Two large, side-by-side tappable cards:
    1. **Design** (minimal icon + title + short subtitle e.g., *"Visuals, branding & layouts"*)
    2. **Content** (minimal icon + title + short subtitle e.g., *"Copy, ideas & storytelling"*)
  * Unselected state: Cream Paper (`#fcfaf5`) with `1px` `#b6b6b6` border.
  * Selected state: Sticky Note Teal (`#a8e5e5`) fill with `2px` Forest Ink (`#1a3300`) border.
* **Primary Action:** Full-width Forest Ink button (`Continue →`), disabled until a valid English name and track are provided.
* **Returning Member Login:** Subtle link below the CTA: *"Already have a PIN? Log in →"* opening a clean modal/screen where returning members enter their **Name** + **4-digit PIN** to restore their session on a new device.

### 4.2 Step 2: Onboarding — Visual Avatar Picker
* **Personalized Header:** Large `Bricolage Grotesque` greeting at the top:
  * **`Hi [First Name], pick your avatar!`** (with `[First Name]` highlighted on a `#ffe95c` marker wash).
* **Simple Visual Grid:**
  * Displays 12–16 distinct, illustrated studio avatars in a clean 3-column or 4-column grid.
  * **Strict Rule:** Display **only the visual avatar artwork**—no confusing character names, lore, or stats so members can pick effortlessly in seconds.
  * Tapping an avatar highlights its card with Sticky Note Mint (`#d5f5c2`) and a `2px` Forest Ink (`#1a3300`) border.
* **Primary Action:** `Confirm Avatar →` (enabled once an avatar is selected).

### 4.3 Step 3: 2-Second Reveal & Studio Pass Card
* **Transition State (~2.0 seconds):**
  * Smooth, playful loading state with a subtle sketch animation and copy: *"Generating your Studio Pass..."*.
  * During this step, the backend creates the user record and assigns a **unique, random 4-digit PIN** (e.g., `4829`, zero-padded `0000–9999`, checked for uniqueness).
* **Studio Pass Card Reveal:**
  * Displays a scrapbook-style ID card on Cream Paper with a `2px` Forest Ink border containing:
    * Selected Avatar
    * Full English Name
    * Track Badge (`Design` or `Content`)
    * **4-Digit Studio PIN:** Displayed large in `Roboto Mono` inside a Highlighter Yellow (`#ffe95c`) block (e.g., `PIN: 4829`).
    * Reassurance microcopy: *"Save this 4-digit code—you'll need it if you log in from another device."*
* **Primary Action:** `Enter the Studio →` persists the user session in `localStorage` and navigates directly to the **Studio Wall**.

---

### 4.4 Navigation — Top Header & Slide-Out Sidebar
* **Top Header Bar:**
  * Sticky top bar on Cream Paper (`#fcfaf5`) with a `1px` `#b6b6b6` bottom border.
  * **Left:** Hamburger menu button (`☰`) to open the Sidebar.
  * **Center:** Studio title (`Enactus Studio`).
  * **Right:** Member's circular avatar thumbnail (tapping navigates directly to **My Profile**).
* **Slide-Out Sidebar Drawer:**
  * Slides in smoothly from the left over a soft backdrop overlay.
  * Cream Paper (`#fcfaf5`) surface with a `1px` `#1a3300` right border.
  * **Header Mini-Card:** Shows the member's Avatar, Name, Track tag, and `#PIN` (`Roboto Mono`).
  * **Navigation Links (Initial Core Scope):**
    1. **Studio Wall** (Home)
    2. **My Profile**
    3. **Leaderboard**
    4. **Admin Panel** *(conditionally rendered only when `user.role === 'admin'`)*
  * Active link is highlighted with a Sticky Note Teal (`#a8e5e5`) fill and `1px` `#1a3300` border (`6px` radius).
  * **Footer:** `Log Out` button (clears local session and returns to Step 1).

---

### 4.5 Home Screen — The Studio Wall
The central hub where coordinator updates and open team conversations live cleanly together without getting mixed up.

* **Top Filter Pills:**
  * `All` | `Admin Drops` | `Community Wall`
* **Open Post Composer (Top of Feed):**
  * Clean Cream Paper card with `1px` `#1a3300` border.
  * Placeholder: *"Share an idea, question, resource, or thought with the studio..."*
  * Optional link input field (`Add a link...`) + `Post →` button (`#1a3300`).
  * Any member can post freely to the Wall.
* **Coordinator Drops (Pinned & Highlighted):**
  * Posts created by an Admin with type `Announcement`, `Task`, or `Resource` are visually distinguished so they never get lost:
    * Styled as **Sticky Note Mint (`#d5f5c2`)** or **Highlighter Yellow (`#ffe95c`)** cards with a `1px` `#1a3300` border.
    * Top pill badge (`📌 ANNOUNCEMENT`, `⚡ TASK`, or `🔗 RESOURCE`) in `Roboto Mono`.
    * Bold title, description body, clickable external link button (if provided), and timestamp.
    * Pinned drops stay anchored at the top of the `All` and `Admin Drops` feeds.
* **Member Wall Cards:**
  * Cream Paper cards (`12px` radius, `1px` `#b6b6b6` border) displaying:
    * Author Avatar, Name, Track badge (`Design` / `Content`), and relative timestamp.
    * Post body text and optional clickable link preview.
    * **Lightweight Interactions:** Toggleable reaction pills (`🔥`, `💡`, `❤️` with live counts) and an expandable comment thread so members can reply to each other.

---

### 4.6 Member Profile (Structured, Breathable Card Grid)
Every metric and detail on the Profile screen is isolated into its own clean card with generous vertical spacing (`16px` gaps) so nothing feels cramped:

1. **Card 1 — Identity Card (Cream Paper + `1px` `#1a3300` border):**
   * Large circular Avatar (`72px–80px`).
   * Full English Name (`Inter 700`, `22px`).
   * Track Pill (`Design` or `Content`).
   * **4-Digit ID Badge:** Displayed in `Roboto Mono` on a Highlighter Yellow (`#ffe95c`) wash (e.g., `ID #4829`).
2. **Card Row 2 — Attendance Streak & Tier (2 Equal-Width Cards Side-by-Side):**
   * **Left Card — Session Streak (Sticky Note Mint `#d5f5c2`):**
     * Large flame icon `🔥` + Streak count in `Roboto Mono` (e.g., `4 Sessions`).
     * Sub-label: *"Attendance Streak"* + small best-streak note (e.g., `Best: 5`).
   * **Right Card — Current Tier (Sticky Note Blush `#f6d0ff`):**
     * Displays current Tier emoji & title + a sleek progress bar showing points needed for the next tier.
     * **Tier Progression Ladder (Admin-configurable point thresholds):**
       * 🥔 **Potato** (`0 – 49 pts`) — Just getting started
       * 🐣 **Rookie** (`50 – 149 pts`) — Moving & earning points
       * ⚡ **Pro** (`150 – 299 pts`) — Steady & crushing it
       * 🚀 **Legend** (`300 – 499 pts`) — Major impact on the team
       * 💎 **Mythic** (`500+ pts`) — Overpowered / Top of the studio
3. **Card 3 — Rankings Overview (Cream Paper + `1px` `#1a3300` border):**
   * Divided cleanly into two equal columns separated by a `1px` Pencil Gray (`#b6b6b6`) vertical divider:
     * **Left Column — Social Media Overall:** Rank in large `Roboto Mono` (e.g., `#4`) + subtitle *"Overall Rank"* (out of total members).
     * **Right Column — Track Rank:** Rank in large `Roboto Mono` (e.g., `#2`) + subtitle *"In Design"* or *"In Content"*.
4. **Card 4 — Feedback Partner Card (Sticky Note Teal `#a8e5e5` + `1px` `#1a3300` border):**
   * Section label: `FEEDBACK PARTNER` (`Roboto Mono`).
   * Displays the assigned partner's Avatar, Name, and Track badge (`Design` or `Content`).
   * If no partner is assigned yet, displays a friendly empty state: *"Your feedback partner will be paired soon!"*

---

### 4.7 Leaderboard Screen
* **Filter Tabs (Top):**
  * `All Social Media` | `Design` | `Content`
* **Top 3 Podium Cards:**
  * Displays the top 3 members in the selected filter as distinct sticky-note cards (Mint, Teal, Blush) showing `#1`, `#2`, `#3` (`Roboto Mono`), Avatar, Name, Tier emoji, and Points.
* **Ranked Member List:**
  * Clean list of remaining members showing: Rank (`Roboto Mono`), Avatar, Name, Track pill, Tier emoji, and Total Points on a Highlighter Yellow (`#ffe95c`) wash.
  * The logged-in member's row is highlighted with a `2px` `#1a3300` border and subtle tint so they can immediately spot their position.

---

## 5. Admin Panel Specifications (Coordinator Tools)

Accessible from the Sidebar (`Admin Panel`) only for users with `role === 'admin'`:

1. **Publish Wall Drop:**
   * Form to create a highlighted post on the Studio Wall:
     * Type selector: `Announcement` | `Task` | `Resource`
     * Title, Body text, optional Link URL, and `Pin to top` toggle.
2. **Attendance & Points Logger:**
   * **Session Attendance:** Checklist of all members to mark `Present` (automatically increments `session_streak` and updates `best_streak`) or `Absent` (resets `session_streak` to `0`, with an `Excused` option to protect streak).
   * **Quick Points:** Select one or multiple members, pick a preset reason (e.g., `+20 Task Submitted`, `+10 Session Attended`, `+15 Initiative`, `-10 Missed Deadline`) or enter a custom amount, and apply immediately (updates total points, Leaderboard ranks, and Tiers automatically).
3. **Feedback Partner Pairing:**
   * Manual dropdown pairing or a **"Auto-Pair All Members"** button (with an option to prefer cross-track pairs: `Design` + `Content`) that updates `feedback_partner_id` across user profiles.
4. **Session Random Picker:**
   * Interactive roulette/randomizer that picks one random member from the team (with optional filter for `All` / `Design` / `Content`) with a playful reveal animation.

---

## 6. Database Schema (Supabase / PostgreSQL)

```sql
-- Users Table
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin_code varchar(4) unique not null,
  track text not null check (track in ('Design', 'Content')),
  avatar_id text not null,
  role text not null default 'member' check (role in ('member', 'admin')),
  points integer not null default 0,
  session_streak integer not null default 0,
  best_streak integer not null default 0,
  feedback_partner_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Studio Wall Posts (Admin Drops & Member Posts)
create table wall_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users(id) on delete cascade,
  post_type text not null default 'member_post' check (post_type in ('member_post', 'announcement', 'task', 'resource')),
  title text,
  content text not null,
  link_url text,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- Post Reactions
create table post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references wall_posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  emoji text not null,
  unique(post_id, user_id, emoji)
);

-- Post Comments
create table post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references wall_posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Point Events (Audit Log)
create table point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Attendance Records
create table attendance (
  id uuid primary key default gen_random_uuid(),
  session_title text not null,
  user_id uuid not null references users(id) on delete cascade,
  status text not null check (status in ('present', 'absent', 'excused')),
  session_date date not null default current_date
);