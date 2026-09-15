# HouseHelper

A touch-first family dashboard for chores, routines, rewards, schedules, shared lists, timers, and family artwork.

## Current prototype

- Family, Tyler, Rose, Harper, and Griffin dashboards with role-specific controls
- Personal visual themes, fast profile switching, and a three-minute return to Family
- Full-screen Chores, Habits, Lists, Rewards, Calendar, Art, and Settings views
- Per-profile widget ordering, sizing, and visibility controls
- A save-and-spend reward shop with persistent point balances, multiple choices, double-confirmation purchases, parent notices, and reward scheduling
- Before/after chore evidence with completed-chore backchecking
- Parent passcodes, approval attribution, and points awarded only after approval
- Parent-created chores assignable to any family member
- Daily, weekday, and weekly repeating chores with parent-controlled removal
- Habit and routine tracking with daily streaks and per-person views
- A shared grocery/household/school/ideas list plus a pinned family note
- Overdue and repeatedly missed chore warnings
- Dashboard-created family calendar events for adults and kids, including edit and parent-gated delete controls
- Full-screen artwork viewing and a touch-first finger-painting canvas
- Artwork archiving, restoring, and parent-controlled permanent deletion
- Functional quick timer
- Responsive tablet and iPhone layouts
- Installable, offline-capable PWA foundation
- Manual and scheduled calm mode
- Scheduled vacation mode with separate repeating-chore and habit pause controls
- Per-person profile colors, typography, control sizing, and decorations
- Custom sleep/wake schedules with art, static-image, solid-color, and chore before/after displays
- Filterable household activity history with CSV export
- Google Calendar read-only import for primary and shared calendars
- Fifteen-minute in-app event reminders with optional browser notifications
- Parent-gated household controls and browser-data backup/restore
- Live online/offline status with local changes remaining available offline
- Shared timers that continue running across every dashboard view

The current sample household names and content are placeholders that can be replaced during family setup.

## Run locally

```powershell
node scripts/serve.mjs
```

Then open `http://127.0.0.1:4173/`.

If npm is installed, `npm run dev` starts the same preview.

## GitHub Pages

The included Pages workflow publishes the contents of `dist` whenever the default branch is pushed. In GitHub, open **Settings → Pages** and choose **GitHub Actions** as the source. The app uses relative asset paths and hash navigation so it works from a repository subpath.

This proof of concept stores family data in the current browser. GitHub Pages can host and install it as a PWA, but it does not synchronize chores, photos, claims, or events between devices until a shared backend is added.

## Local data and device safety

Every change is stored under the website's origin in the current browser. Chores, points, layouts, settings, locally created events, imported Google event copies, lists, habits, and activity history use local storage. Chore photos and the custom sleep image use IndexedDB. Open **Settings → Local data & backup → Protect storage** on the tablet to ask the browser to reduce automatic storage eviction.

Data on `http://127.0.0.1:4173` is separate from data on a GitHub Pages address because browsers isolate storage by website origin. Export a backup before changing the production URL, clearing site data, or replacing the tablet. JSON backups currently exclude IndexedDB photos.

## Google Calendar setup

The PWA uses Google Identity Services' browser token model and requests read-only Calendar access. Imported events are cached locally; the short-lived access token remains in memory and is never written to local storage or a backup.

1. In Google Cloud, create or select a project and enable the Google Calendar API.
2. Configure the OAuth consent screen. For a family-only test app, add each family Google account as a test user when required.
3. Create an OAuth 2.0 Client ID with application type **Web application**. No client secret belongs in this app.
4. Add each deployed origin under **Authorized JavaScript origins**, such as `https://YOUR-NAME.github.io` and your approved local test origin. Origins do not include the repository path or `#calendar` fragment.
5. In HouseHelper, open **Settings → Google Calendar**, paste the client ID, choose the family member, and connect. After the first sync, select which primary or shared calendars should appear and tap **Sync now**.

Google may reject authentication inside an embedded preview browser. Complete sign-in from Chrome or the installed PWA on the tablet.
