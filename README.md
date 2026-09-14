# HouseHelper

A touch-first family dashboard for chores, kid rewards, schedules, timers, and family artwork.

## Current prototype

- Family, Tyler, Rose, Harper, and Griffin dashboards with role-specific controls
- Personal visual themes, fast profile switching, and a three-minute return to Family
- Full-screen Chores, Rewards, Calendar, Art, and Settings views
- Per-profile widget ordering, sizing, and visibility controls
- Multiple reward choices per child with double-confirmation claiming, parent notices, and reward scheduling
- Before/after chore evidence with completed-chore backchecking
- Parent passcodes, approval attribution, and points awarded only after approval
- Parent-created chores assignable to any family member
- Overdue and repeatedly missed chore warnings
- Dashboard-created family calendar events for adults and kids
- Full-screen artwork viewing and a touch-first finger-painting canvas
- Functional quick timer
- Responsive tablet and iPhone layouts
- Installable, offline-capable PWA foundation
- Manual and scheduled calm mode
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
