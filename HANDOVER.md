# Project Handover Document: Focus Game

## 1. Project Overview & Context
**Product**: "Focus" - A mobile-web concentration training game.
**Goal**: Viral growth through competitive mini-games, ranking systems, and social sharing.

### Tech Stack
- **Frontend**: Vanilla JavaScript (ES Modules), Vite.
- **Backend / Auth**: Supabase (Auth, Database, Realtime).
- **Styling**: CSS Variables, Mobile-first centralized layout.
- **Hosting**: Vercel.

### Critical URLs
- **Production**: [https://focus-seven.vercel.app/](https://focus-seven.vercel.app/)
- **Supabase Project**: `utaueussdjvunpbkusbl` (Check your Dashboard)
- **Repo**: (Local Git initialized)

### Development Environment
- **Node Version**: v20+ / v22+
- **Command**: `npm run dev` (Localhost: 5173/5174/5175)
- **Build**: `npm run build` -> `dist/`

---

## 2. Current Development Status
- **Auth**: Google Login implemented. Manual user creation fallback added for robustness. Session persistence fixed.
- **Core Loop**: Game Engine works. 5 Mini-games implemented. Coins deducted per play.
- **Database**: `users` and `game_records` tables active. RLS policies adjusted.
- **UI**: Mobile layout constrained on desktop. Dark theme. Splash, Main, Game, Result views operational.

---

## 3. Prioritized To-Do List (Roadmap)
The following tasks are prioritized for the next phase of development. **Developers should check off items as they complete them.**

### 🚨 Priority 1: Critical Core & Economy
*These features define the "value" of the coin and the fairness of the game.*
- [x] **Credit System Refactor (Daily vs. Viral)**
    - [x] Create separation in `users` table: `daily_coins` (resets daily) vs `viral_coins` (permanent/carry-over).
    - [x] Logic: Consume `daily_coins` first, then `viral_coins`.
    - [x] Implement Cron Job or "First Login of Day" logic to reset `daily_coins` to 3.
- [x] **Weekly Ranking Logic Update**
    - [x] **DB Query**: Change from "All Records" to "Max Round per User". (Currently shows duplicate users).
    - [x] **My Rank**: Add a pinned section above the list showing "My Rank" and "My Best Round".

### 🚀 Priority 2: Viral Growth Engines
*These features are essential for the "1 Coin per Share" loop.*
- [x] **Sharing Functionality**
    - [x] Implement `Web Share API` (Native Mobile Share) on Result/Main screens.
    - [x] Generate Referral Links (e.g., `?ref=USER_ID`).
    - [x] **Reward Logic**: When a new user joins via `?ref=USER_ID`, grant +1 `viral_coin` to the referrer.
- [x] **SEO & Metadata (OG Tags)**
    - [x] Add `og:image`, `og:title`, `og:description` in `index.html`.
    - [x] Design and add a compelling `og-image.png` (Game screenshot + "Can you beat level 5?").
    - [x] Add custom Favicon.

### ✨ Priority 3: Engagement & UI Polish
*Enhancing the feeling of progression and competition.*
- [x] **Result Screen Upgrade**
    - [x] **XP Contribution**: Show visual bar: `Current Level [====--] Next Level`. Highlight "+XP" filling the bar with animation.
    - [x] **Rank Movement**: Display rank changes like "📈 3위 상승!" or "🏆 TOP 3!" with color-coded badges.
- [x] **Announcement Banner**
    - [x] Add "Weekly 1st Place = Starbucks Coupon" banner at top of Main view with pulsing animation.
- [x] **Game Polish**
    - [x] **Visuals**: Added confetti particles and green flash effect for correct answers with checkmark icon.

### 📝 Priority 4: Backlog / Optimization
- [ ] **Admin Dashboard** (Optional): View to see total users, total plays.
- [ ] **Security Hardening (Important)**:
    - [ ] **Vulnerability**: Game logic and Coin deduction currently happen on the Client (Browser). A savvy user could manipulate the JavaScript to play for free or submit fake high scores.
    - [ ] **Fix**: Move critical logic (Coin deduction, Score verification) to Supabase Edge Functions (Server-side) to prevent cheating.

---

## 4. How to Work
1. **Pick a Task**: Select an unchecked item from Section 3.
2. **Implement**: Code the solution.
3. **Verify**: Test locally and on the Vercel preview.
4. **Check Off**: Mark the task as `[x]` in this document.
