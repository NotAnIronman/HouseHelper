# HouseHelper

A touch-first family dashboard for chores, routines, rewards, schedules, language learning, shared lists, timers, and family artwork.

## Current prototype

- First-run household setup for any number of parents, grandparents, caregivers, children, and dependents
- Privacy-safe blank defaults: no household names, chores, schedules, rewards, habits, notes, lists, or artwork ship with the app
- Family and personal dashboards with role-specific controls and editable names, roles, and profile colors
- Personal visual themes, fast profile switching, and a three-minute return to Family
- Full-screen Chores, Habits, Lists, Rewards, Calendar, Languages, Art, Games, and Settings views
- Per-profile widget ordering, sizing, and visibility controls, including live long-hold drag-and-drop on Home
- A save-and-spend reward shop with persistent point balances, multiple choices, double-confirmation purchases, adult notices, and reward scheduling
- Before/after chore evidence with up to six photos per stage, camera or file upload, available photo timestamps, tap-to-enlarge backchecking, in-place photo editing, written return reasons, and thin photo markup for circling missed areas
- Adult passcodes, approval attribution, and points awarded only after approval
- Adult-created chores assignable to any family member
- Daily, weekday, and weekly repeating chores with adult-controlled removal
- Habit and routine tracking with daily streaks, per-person views, and edits that preserve streak history
- A shared grocery/household/school/ideas list with request attribution, in-place editing, and a pinned family note
- Overdue and repeatedly missed chore warnings
- Dashboard-created family calendar events for adults and children, including edit and adult-gated delete controls
- Full-screen artwork viewing and a touch-first finger-painting canvas
- Core offline language learning with 1,652 cards and B1-preparation material across seven languages, per-person progress, device speech playback, scheduled reviews, daily goals, level filters, and a family retention leaderboard
- Parent-configurable daily language reward bonuses for children, awarded once per day for unique practice rather than repeat tapping
- Long-term vocabulary rules: a card cannot be retained in one session and cannot become mastered until correct recalls on at least five different days spanning multiple weeks
- An offline Games area with reaction and memory-matching games
- Artwork archiving, restoring, and adult-controlled permanent deletion
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
- Adult-gated household controls and browser-data backup/restore
- Live online/offline status with local changes remaining available offline
- An optional local-weather Home widget with device-location or city search and a cached last forecast for offline viewing
- Shared timers that continue running across every dashboard view
- Optional LAN synchronization protocol with a pairing link and QR code, connected-device status, host-authoritative data, and chore-photo transfer

All household content is created and stored by the family using the app. Existing installs without a household profile are offered a one-time migration screen whose suggestions are derived only from data already stored on that device.

## Android kitchen host

The `android-host` folder is the native Android Studio project for the Tab S7 FE. It packages the same tested `dist` dashboard, serves it at `127.0.0.1:4173`, and keeps a foreground household host available to trusted devices on the same Wi-Fi. No Play Store or paid Google Play developer account is required to build, install, or share the APK directly with family devices.

First-time Android Studio setup:

1. On the welcome screen, choose **Clone Repository** and enter `https://github.com/NotAnIronman/HouseHelper.git`.
2. When cloning finishes, use **File → Open** and select the cloned repository's `android-host` folder. Choose **This Window** if Android Studio asks where to open it.
3. Let Gradle sync finish. Accept installation prompts for Android SDK Platform 36, Build Tools 36, or other missing official SDK components.
4. On the Tab S7 FE, keep Developer options and USB debugging enabled, unlock it, and approve **Allow USB debugging** when its RSA fingerprint prompt appears. Selecting **Always allow from this computer** avoids repeated prompts on the same trusted PC.
5. In Android Studio's device selector, choose the tablet. Press the green **Run** triangle with the `app` configuration selected.
6. Accept the notification permission prompt in HouseHelper. The persistent **HouseHelper is hosting** notification means the local household service is running.

The first Gradle sync downloads build tooling and therefore needs internet access. If the tablet is not listed, set its USB mode to **Transferring files**, try a data-capable cable/USB port, and install Samsung's official Android USB driver on Windows. Corporate security software can also block the Gradle or SDK downloads; in that case complete the sync from the home PC/network.

After the APK opens, go to **Settings → Connected devices**. Other family devices on the same non-guest Wi-Fi can open the displayed pairing address in Safari or Chrome; they do not install the host APK. Keep the pairing address private because it contains the household access token. The Android host's data is app-private, and **Settings → Local data & backup** creates a portable backup including photos.

For dependable overnight hosting, open Android **Settings → Apps → HouseHelper → Battery** and choose **Unrestricted**. Keep Wi-Fi enabled and leave the persistent hosting notification allowed. HouseHelper 0.7.0 also holds a high-performance Wi-Fi lock while its foreground host service is running, which makes reconnecting after the screen sleeps substantially more reliable.

### Updating the tablet after a new commit

1. In Android Studio's **Terminal**, run `git pull` from the repository root.
2. Wait for Gradle sync if Android Studio starts one. Confirm the run configuration still says `app` and the tablet is selected.
3. Press **Run**. Android Studio rebuilds the bundled dashboard and installs it over the current debug app; household app data remains in place.
4. In HouseHelper, open **Settings → Connected devices** and check **App build**. This release shows `0.7.0-debug` on the tablet and `0.7.0` in phone browsers.
5. On each secondary device, close the old HouseHelper tab and scan the QR code or reopen the pairing address shown by the tablet. The connection details should say **Secondary**, and the phone's build and host build should both be 0.7.0.

If the screen still looks unchanged after step 3, uninstalling is not the first choice because it removes the debug app's private household data. First run the app again from Android Studio and use the build label above to verify which APK is actually installed. Make a complete backup before any uninstall or switch between debug and release builds.

To create an installable file later, use **Build → Generate App Bundles or APKs → Generate APKs** for a debug APK, or **Build → Generate Signed App Bundle or APK → APK** for a long-lived release APK. Keep the release keystore and its passwords backed up somewhere private: Android requires the same signing key for future upgrades.

Every relevant push to `main` also runs the free **Build HouseHelper Android APK** GitHub Actions workflow. Its `HouseHelper-debug-apk` artifact is a convenient test installer and expires after 14 days; the repository source does not expire. A personally signed release APK is still the correct long-term family install.

Important when moving existing family data: browser/PWA storage and Android WebView storage are intentionally separate. Before the first APK test, download a complete backup from the currently used website on the tablet. After installing the APK, restore that JSON file from **Settings → Local data & backup** and verify chores, points, events, artwork, and photos. Debug and release builds are also separate installations, so repeat the backup/restore step when moving from the test build to the signed release.

## Run locally

```powershell
node scripts/serve.mjs
```

Then open `http://127.0.0.1:4173/`.

If npm is installed, `npm run dev` starts the same preview.

## Shared household mode

HouseHelper now has an opt-in local-network synchronization layer. The ordinary website remains standalone and behaves exactly as before unless it is opened with a host-generated pairing address.

For temporary testing from a computer on the home Wi-Fi:

```powershell
node scripts/lan-host.mjs
```

The command prints two addresses. Open the **Host dashboard** address first on the device whose current browser data should seed the household. Open the **Pair another device** address on phones or other tablets connected to the same private Wi-Fi. The host process stores its authoritative state and uploaded chore evidence in the ignored `.househelper` directory. Keep the terminal running while devices are connected.

The production topology is the same protocol embedded in the Android tablet APK: the Tab S7 FE runs the service and owns the household database/photos, while secondary devices receive a pairing address or QR code. A normal PWA cannot listen for incoming Wi-Fi connections, so the tablet-host service must be supplied by the native Android wrapper. The current work-PC environment does not include Java, Gradle, Android Studio, or ADB, so the native wrapper must be built and device-tested from the Android Studio machine.

Important LAN behavior:

- Shared `hh-*` household records synchronize approximately every 1.2 seconds. Current profile and reminder-dismissal state remain device-specific.
- Chore evidence and the custom sleep image upload to the host and download on demand.
- Secondary edits remain in browser storage if the host becomes unavailable, then retry after it returns.
- Device names are local to each browser. Type the new name and tap **Save name**; incoming sync status cannot overwrite an active edit.
- **Connected devices** shows the local build, host build, role, and last successful sync. A version mismatch means the secondary browser needs the current pairing address reopened.
- The pairing address contains a random household token. Use it only on a trusted WPA2/WPA3 home network; do not expose the host port to the internet.
- Guest Wi-Fi/client isolation can prevent devices from reaching one another.
- Download a complete backup before seeding a new host.

## Offline language learning

The 1,652-card curriculum is bundled as static text in `dist/languages.js` and the `dist/language-*.js` course files. It adds about 153 KB of source text and works without an account or network request. The catalog currently contains:

- German: 504 cards across 45 modules, organized from A1 through B1 preparation
- Korean: 488 cards across 44 modules, with Hangul-first foundations through B1 preparation
- Spanish, French, and Japanese: 140 cards each across 12 modules, from A1 foundations through B1 preparation
- Italian and Mandarin Chinese: 120 cards each across 10 modules, from A1 foundations through B1 preparation

Level filters keep the larger paths approachable, while quizzes prefer plausible distractors from the same level and card type. The B1 label deliberately means **B1 preparation**, not a fluency certificate: card recall cannot by itself demonstrate spontaneous conversation, listening comprehension, pronunciation, or extended writing. Before presenting the curriculum as formal instruction, translations and cultural notes should receive a native or professionally fluent speaker review.

Every household member has separate progress. The daily session shows overdue reviews before new material. Learners can keep studying for as long as they like. The next module opens after they try three cards in the previous module or retain one card there. A correct first attempt advances the card to a later review interval of 1, 3, 7, 14, 30, and 60 days. Repeating the same card on the same day can provide practice but cannot advance retention, increase daily progress, or inflate XP. “Retained” requires recall on at least two different days. “Mastered” requires at least five correct days spanning 14 or more days and the later review stage. The family leaderboard ranks retained vocabulary first, followed by mastered vocabulary and XP.

The weather widget uses Open-Meteo for city lookup and forecast data. A selected location and its latest successful forecast are stored with the household so the card remains useful when the internet is unavailable; live refreshes require an internet connection. On Android, choosing **Use this device's location** asks for location permission only at that moment and saves only rounded coordinates suitable for a neighborhood-level forecast.

Adults can set the unique-card daily target and a once-per-day reward point bonus. The active learner and course selection stay local to each screen, while progress, goals, and child point awards synchronize through the kitchen host. Speech playback uses the voices installed on the device; for dependable offline German or Korean audio, install the matching text-to-speech voice in Android system settings before going offline.

## Verification

Run the built-in compatibility and UI integrity checks with:

```powershell
node scripts/self-test.mjs
```

With npm installed, `npm run check` additionally syntax-checks every browser and host script. The self-test verifies that passcodes hash identically on secure pages and plain local-network HTTP, known Samsung/Apple device identities are normalized, every directly referenced UI control exists, and the web/Android build versions agree.

## GitHub Pages

The included Pages workflow publishes the contents of `dist` whenever the default branch is pushed. In GitHub, open **Settings → Pages** and choose **GitHub Actions** as the source. The app uses relative asset paths and hash navigation so it works from a repository subpath.

GitHub Pages stores family data in the current browser and works as the standalone PWA. Live household synchronization begins only when a device opens the private pairing address served by the Android kitchen host; the public Pages site does not expose the tablet or its family data.

## Local data and device safety

Every change is stored under the website's origin in the current browser. Chores, points, layouts, settings, locally created events, imported Google event copies, lists, habits, and activity history use local storage. Chore photos and the custom sleep image use IndexedDB. Open **Settings → Local data & backup → Protect storage** on the tablet to ask the browser to reduce automatic storage eviction.

Data on `http://127.0.0.1:4173` is separate from data on a GitHub Pages address because browsers isolate storage by website origin. Export a backup before changing the production URL, clearing site data, or replacing the tablet. Version 2 backups include IndexedDB chore photos and the custom sleep-screen image so a household can migrate safely to its kitchen host.

## Google Calendar setup

The PWA uses Google Identity Services' browser token model and requests read-only Calendar access. Imported events are cached locally; the short-lived access token remains in memory and is never written to local storage or a backup.

1. In Google Cloud, create or select a project and enable the Google Calendar API.
2. Configure the OAuth consent screen. For a family-only test app, add each family Google account as a test user when required.
3. Create an OAuth 2.0 Client ID with application type **Web application**. No client secret belongs in this app.
4. Add each deployed origin under **Authorized JavaScript origins**, such as `https://YOUR-NAME.github.io` and your approved local test origin. Origins do not include the repository path or `#calendar` fragment.
5. In HouseHelper, open **Settings → Google Calendar**, paste the client ID, choose the family member, and connect. After the first sync, select which primary or shared calendars should appear and tap **Sync now**.

Google may reject authentication inside an embedded preview browser. Complete sign-in from Chrome or the installed PWA on the tablet.
