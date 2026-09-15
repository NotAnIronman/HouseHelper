function readStoredNumber(key, fallback) {
  const value = localStorage.getItem(key);
  return value === null || !Number.isFinite(Number(value)) ? fallback : Number(value);
}

function readStoredObject(key) {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
}

function readStoredArray(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(value) ? value : fallback;
  } catch { return fallback; }
}

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clone = (value) => JSON.parse(JSON.stringify(value));

const PROFILES = {
  family: { name: "Family", shortRole: "Family view", avatar: "⌂", adult: false, rewardOwner: "harper" },
  tyler: { name: "Tyler", shortRole: "Father · Adult", avatar: "T", adult: true, rewardOwner: "harper" },
  rose: { name: "Rose", shortRole: "Mother · Adult", avatar: "R", adult: true, rewardOwner: "harper" },
  harper: { name: "Harper", shortRole: "Daughter · Kid", avatar: "H", adult: false, rewardOwner: "harper" },
  griffin: { name: "Griffin", shortRole: "Son · Kid", avatar: "G", adult: false, rewardOwner: "griffin" },
};

const VIEWS = ["home", "chores", "habits", "lists", "rewards", "calendar", "art", "settings"];
const WIDGETS = [
  { id: "rewards", name: "Reward radar", icon: "★", detail: "Kid reward progress" },
  { id: "chores", name: "Today’s chores", icon: "✓", detail: "Assigned work and approvals" },
  { id: "habits", name: "Daily routines", icon: "↻", detail: "Healthy habits and streaks" },
  { id: "lists", name: "Family list", icon: "☰", detail: "Groceries and shared notes" },
  { id: "attention", name: "Reminders", icon: "!", detail: "Overdue and missed chores" },
  { id: "calendar", name: "Family schedule", icon: "□", detail: "Upcoming calendar items" },
  { id: "timer", name: "Quick timer", icon: "◷", detail: "Shared live timer" },
  { id: "art", name: "Art show", icon: "✦", detail: "Family gallery" },
];

const BASE_LAYOUT = [
  { id: "rewards", size: "half", visible: true },
  { id: "chores", size: "half", visible: true },
  { id: "habits", size: "half", visible: true },
  { id: "lists", size: "half", visible: true },
  { id: "attention", size: "compact", visible: true },
  { id: "calendar", size: "compact", visible: true },
  { id: "timer", size: "compact", visible: true },
  { id: "art", size: "half", visible: true },
];

const DEFAULT_LAYOUTS = {
  family: BASE_LAYOUT,
  tyler: BASE_LAYOUT,
  rose: BASE_LAYOUT,
  harper: [
    { id: "rewards", size: "half", visible: true },
    { id: "art", size: "half", visible: true },
    { id: "chores", size: "half", visible: true },
    { id: "habits", size: "half", visible: true },
    { id: "lists", size: "compact", visible: true },
    { id: "attention", size: "compact", visible: true },
    { id: "timer", size: "compact", visible: true },
    { id: "calendar", size: "compact", visible: true },
  ],
  griffin: BASE_LAYOUT,
};

function dateKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function parseDateKey(value) {
  const parts = value.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function datePlus(days) {
  const value = new Date();
  value.setHours(12, 0, 0, 0);
  value.setDate(value.getDate() + days);
  return dateKey(value);
}

function makeId(prefix) {
  return prefix + "-" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2));
}

const DEFAULT_CHORES = [
  { id: "dishes", person: "harper", title: "Unload dishwasher", area: "Kitchen", points: 10, icon: "🍽️", initialStatus: "done", familyPriority: true, photoRequired: true },
  { id: "room", person: "harper", title: "Tidy your room", area: "Bedroom", points: 20, icon: "🛏️", initialStatus: "ready", photoRequired: true },
  { id: "table", person: "harper", title: "Set the dinner table", area: "Dining room", points: 15, icon: "🍴", initialStatus: "ready", photoRequired: true },
  { id: "dog", person: "griffin", title: "Fill the dog bowls", area: "Pet care", points: 15, icon: "🐕", initialStatus: "ready", familyPriority: true, missedCount: 2, photoRequired: true },
  { id: "schoolbag", person: "griffin", title: "Pack your school bag", area: "Entryway", points: 15, icon: "🎒", initialStatus: "ready", photoRequired: true },
  { id: "toys", person: "griffin", title: "Put away the toys", area: "Play room", points: 20, icon: "🧩", initialStatus: "ready", photoRequired: true },
  { id: "recycling", person: "tyler", title: "Take out recycling", area: "Garage", points: 0, icon: "♻️", initialStatus: "ready", familyPriority: true, overdueDays: 1, photoRequired: true },
  { id: "calendar-check", person: "tyler", title: "Check tomorrow’s schedule", area: "Family", points: 0, icon: "📅", initialStatus: "ready", photoRequired: true },
  { id: "plants", person: "rose", title: "Water the plants", area: "Living room", points: 0, icon: "🪴", initialStatus: "ready", familyPriority: true, photoRequired: true },
  { id: "papers", person: "rose", title: "Sort school papers", area: "Family", points: 0, icon: "📚", initialStatus: "ready", overdueDays: 2, photoRequired: true },
];

const DEFAULT_REWARDS = {
  harper: {
    points: readStoredNumber("hh-points", 80),
    items: [
      { id: "harper-ice-cream", name: localStorage.getItem("hh-reward-name") || "Ice cream trip", cost: readStoredNumber("hh-reward-target", 120), emoji: "🍦" },
      { id: "harper-movie", name: "Pick family movie", cost: 75, emoji: "🎬" },
      { id: "harper-bedtime", name: "30 minutes later bedtime", cost: 60, emoji: "🌙" },
    ],
  },
  griffin: {
    points: 45,
    items: [
      { id: "griffin-dessert", name: "Choose Friday dessert", cost: 100, emoji: "🍰" },
      { id: "griffin-lego", name: "Extra LEGO time", cost: 60, emoji: "🧱" },
    ],
  },
};

function normalizeRewardAccount(id, stored) {
  const base = clone(DEFAULT_REWARDS[id]);
  if (!stored || typeof stored !== "object") return base;
  const account = { points: Number.isFinite(Number(stored.points)) ? Math.max(0, Number(stored.points)) : base.points, items: [] };
  if (Array.isArray(stored.items)) {
    account.items = stored.items.filter((item) => item && item.name).map((item) => ({
      id: item.id || makeId("reward"),
      name: String(item.name),
      cost: Math.max(10, Number(item.cost || item.target) || 10),
      emoji: String(item.emoji || "🎁"),
    }));
  } else if (stored.name) {
    account.items = clone(base.items);
    account.items[0] = { id: account.items[0].id, name: String(stored.name), cost: Math.max(10, Number(stored.target) || 10), emoji: String(stored.emoji || account.items[0].emoji) };
  }
  if (!account.items.length) account.items = base.items;
  return account;
}

const DEFAULT_ARTWORKS = [
  { id: "sample-happy", type: "css", className: "art-one", content: "MY\nHAPPY\nPLACE", title: "My Happy Place", artist: "Harper" },
  { id: "sample-star", type: "css", className: "art-two", content: "★", title: "Bright Star", artist: "Griffin" },
];

const DEFAULT_EVENTS = [
  { id: "event-soccer", title: "Soccer practice", people: "harper", location: "North field", date: datePlus(0), time: "16:00", source: "connected" },
  { id: "event-dinner", title: "Family dinner", people: "family", location: "Home", date: datePlus(0), time: "18:30", source: "local" },
  { id: "event-wind-down", title: "Wind-down time", people: "kids", location: "Calm mode at 9:00", date: datePlus(0), time: "20:30", source: "local" },
  { id: "event-dropoff", title: "School drop-off", people: "kids", location: "School", date: datePlus(1), time: "08:00", source: "connected" },
];

const DEFAULT_HABITS = [
  { id: "habit-harper-teeth", person: "harper", name: "Brush teeth", icon: "🪥", schedule: "daily", time: "19:30" },
  { id: "habit-griffin-read", person: "griffin", name: "Read for 20 minutes", icon: "📚", schedule: "daily", time: "19:00" },
  { id: "habit-rose-water", person: "rose", name: "Drink water", icon: "💧", schedule: "daily", time: "09:00" },
  { id: "habit-tyler-move", person: "tyler", name: "Move for 20 minutes", icon: "🏃", schedule: "weekdays", time: "17:30" },
];

const DEFAULT_LIST_ITEMS = [
  { id: "list-milk", text: "Milk", category: "groceries", completed: false, addedBy: "family", createdAt: new Date().toISOString() },
  { id: "list-dog-food", text: "Dog food", category: "household", completed: false, addedBy: "family", createdAt: new Date().toISOString() },
];

const DEFAULT_PROFILE_THEMES = {
  family: { color: "#14392f", font: "rounded", scale: "normal", decorations: true },
  tyler: { color: "#203e63", font: "clean", scale: "normal", decorations: true },
  rose: { color: "#5b365f", font: "rounded", scale: "normal", decorations: true },
  harper: { color: "#78325c", font: "classic", scale: "large", decorations: true },
  griffin: { color: "#174c69", font: "rounded", scale: "normal", decorations: true },
};

function normalizeSettings(stored, defaults) {
  return Object.assign({}, defaults, stored && typeof stored === "object" ? stored : {});
}

const storedThemeSettings = readStoredObject("hh-profile-themes");
const normalizedThemes = Object.fromEntries(Object.keys(PROFILES).map((id) => [id, normalizeSettings(storedThemeSettings[id], DEFAULT_PROFILE_THEMES[id])]));
const legacyVacationMode = localStorage.getItem("hh-vacation-mode") === "true";
const initialSleepSettings = normalizeSettings(readStoredObject("hh-sleep-settings"), { enabled: true, sleepTime: "21:00", wakeTime: "06:00", display: "art", interval: 20, color: "#102721", includeArchived: false, hasStaticImage: false });
const initialVacationSettings = normalizeSettings(readStoredObject("hh-vacation-settings"), { enabled: legacyVacationMode, startDate: "", endDate: "", pauseChores: true, pauseHabits: false });
const initialGoogleSettings = normalizeSettings(readStoredObject("hh-google-calendar"), { clientId: "", owner: "family", days: 60, connected: false, calendars: [], selectedCalendarIds: [], calendarOwners: {}, selectionInitialized: false, lastSync: null });
const initialReminderSettings = normalizeSettings(readStoredObject("hh-reminder-settings"), { enabled: true, leadMinutes: 15 });

const storedRewards = readStoredObject("hh-rewards");
const initialProfile = localStorage.getItem("hh-profile");
const initialView = location.hash.replace("#", "");

const state = {
  profile: PROFILES[initialProfile] ? initialProfile : "family",
  view: VIEWS.includes(initialView) ? initialView : "home",
  rewardOwner: "harper",
  rewardDraftPoints: 0,
  rewards: {
    harper: normalizeRewardAccount("harper", storedRewards.harper),
    griffin: normalizeRewardAccount("griffin", storedRewards.griffin),
  },
  rewardClaims: readStoredArray("hh-reward-claims", []),
  activeClaim: null,
  schedulingClaimId: null,
  chores: readStoredObject("hh-chores"),
  customChores: readStoredArray("hh-custom-chores", []),
  removedChoreIds: readStoredArray("hh-removed-chores", []),
  layouts: readStoredObject("hh-layouts"),
  layoutDraft: [],
  themes: normalizedThemes,
  themeEditingProfile: "family",
  sleepSettings: initialSleepSettings,
  sleepDraftImage: null,
  vacationSettings: initialVacationSettings,
  choreFilter: "all",
  events: readStoredArray("hh-events", clone(DEFAULT_EVENTS)),
  editingEventId: null,
  selectedCalendarDate: datePlus(0),
  habits: readStoredArray("hh-habits", clone(DEFAULT_HABITS)),
  habitCompletions: readStoredObject("hh-habit-completions"),
  habitFilter: "all",
  listItems: readStoredArray("hh-shared-list", clone(DEFAULT_LIST_ITEMS)),
  listFilter: "all",
  familyNote: localStorage.getItem("hh-family-note") || "Dinner together at 6:30 · Bring school forms to the counter.",
  activity: readStoredArray("hh-activity", []),
  activityFilter: "all",
  vacationMode: legacyVacationMode,
  googleSettings: initialGoogleSettings,
  googleAccessToken: null,
  googleTokenExpiresAt: 0,
  googleTokenClient: null,
  googleSyncing: false,
  reminderSettings: initialReminderSettings,
  remindedEvents: readStoredObject("hh-reminded-events"),
  reminderSnoozes: readStoredObject("hh-reminder-snoozes"),
  activeReminderEventId: null,
  artworks: readStoredArray("hh-artworks", clone(DEFAULT_ARTWORKS)),
  showArchivedArt: false,
  activeArtId: null,
  pendingDelete: null,
  timerSeconds: 15 * 60,
  timerInitial: 15 * 60,
  timerRunning: false,
  timerId: null,
  activeChore: null,
  detailChoreId: null,
  detailUrls: [],
  selectedPhotoFile: null,
  photoUrl: null,
  idleDeadline: null,
  authContext: null,
  authParent: "tyler",
  authConfirming: false,
  pendingPasscodeHash: null,
  passcodes: readStoredObject("hh-parent-passcodes"),
  paintColor: "#ef4444",
  paintErasing: false,
  paintDrawing: false,
  paintLast: null,
};

const elements = {
  todayLabel: $("#todayLabel"),
  pageTitle: $("#pageTitle"),
  profileSwitch: $("#profileSwitch"),
  profileDialog: $("#profileDialog"),
  rewardDialog: $("#rewardDialog"),
  rewardClaimDialog: $("#rewardClaimDialog"),
  calendarEventDialog: $("#calendarEventDialog"),
  photoDialog: $("#photoDialog"),
  passcodeDialog: $("#passcodeDialog"),
  choreDetailDialog: $("#choreDetailDialog"),
  choreFormDialog: $("#choreFormDialog"),
  layoutDialog: $("#layoutDialog"),
  artViewerDialog: $("#artViewerDialog"),
  paintDialog: $("#paintDialog"),
  deleteConfirmDialog: $("#deleteConfirmDialog"),
  themeDialog: $("#themeDialog"),
  sleepDialog: $("#sleepDialog"),
  vacationDialog: $("#vacationDialog"),
  googleCalendarDialog: $("#googleCalendarDialog"),
  eventReminderDialog: $("#eventReminderDialog"),
  habitDialog: $("#habitDialog"),
  activityDialog: $("#activityDialog"),
  backupDialog: $("#backupDialog"),
  timerDisplay: $("#timerDisplay"),
  calmScreen: $("#calmScreen"),
  toast: $("#toast"),
};

let calmSlideTimer = null;
let calmObjectUrls = [];

const IDLE_RETURN_MS = 3 * 60 * 1000;

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

function showToast(message) {
  $("#toastText").textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => elements.toast.classList.remove("show"), 3000);
}

function setDateLabels() {
  const now = new Date();
  const profile = PROFILES[state.profile];
  elements.todayLabel.textContent = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  $("#calmDate").textContent = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  elements.pageTitle.textContent = greeting + ", " + (state.profile === "family" ? "family" : profile.name);
}

function updateClock() {
  $("#calmTime").textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function persistRewards() { localStorage.setItem("hh-rewards", JSON.stringify(state.rewards)); }
function persistClaims() { localStorage.setItem("hh-reward-claims", JSON.stringify(state.rewardClaims)); }
function persistChores() { localStorage.setItem("hh-chores", JSON.stringify(state.chores)); }
function persistCustomChores() { localStorage.setItem("hh-custom-chores", JSON.stringify(state.customChores)); }
function persistRemovedChores() { localStorage.setItem("hh-removed-chores", JSON.stringify(state.removedChoreIds)); }
function persistEvents() { localStorage.setItem("hh-events", JSON.stringify(state.events)); }
function persistHabits() { localStorage.setItem("hh-habits", JSON.stringify(state.habits)); }
function persistHabitCompletions() { localStorage.setItem("hh-habit-completions", JSON.stringify(state.habitCompletions)); }
function persistListItems() { localStorage.setItem("hh-shared-list", JSON.stringify(state.listItems)); }
function persistActivity() { localStorage.setItem("hh-activity", JSON.stringify(state.activity)); }
function persistArtworks() { localStorage.setItem("hh-artworks", JSON.stringify(state.artworks)); }
function persistThemes() { localStorage.setItem("hh-profile-themes", JSON.stringify(state.themes)); }
function persistSleepSettings() { localStorage.setItem("hh-sleep-settings", JSON.stringify(state.sleepSettings)); }
function persistVacationSettings() { localStorage.setItem("hh-vacation-settings", JSON.stringify(state.vacationSettings)); }
function persistGoogleSettings() { localStorage.setItem("hh-google-calendar", JSON.stringify(state.googleSettings)); }
function persistReminderSettings() { localStorage.setItem("hh-reminder-settings", JSON.stringify(state.reminderSettings)); }
function allChores() { return DEFAULT_CHORES.concat(state.customChores).filter((chore) => !state.removedChoreIds.includes(chore.id)); }
function currentReward() { return state.rewards[state.rewardOwner]; }
function rewardOwnerName() { return PROFILES[state.rewardOwner].name; }
function choreStatus(chore) {
  const record = state.chores[chore.id] || {};
  if (chore.repeat && chore.repeat !== "none" && record.occurrenceDate !== datePlus(0)) return chore.initialStatus;
  return record.status || chore.initialStatus;
}
function choreById(id) { return allChores().find((chore) => chore.id === id); }
function rewardById(owner, id) { return state.rewards[owner] && state.rewards[owner].items.find((item) => item.id === id); }

function vacationIsActive(dateValue) {
  if (!state.vacationSettings.enabled) return false;
  const key = dateValue || datePlus(0);
  if (state.vacationSettings.startDate && key < state.vacationSettings.startDate) return false;
  if (state.vacationSettings.endDate && key > state.vacationSettings.endDate) return false;
  return true;
}

function refreshVacationState() {
  state.vacationMode = vacationIsActive();
  localStorage.setItem("hh-vacation-mode", String(state.vacationMode));
}

function isChoreScheduledToday(chore) {
  if (vacationIsActive() && state.vacationSettings.pauseChores && chore.repeat && chore.repeat !== "none") return false;
  if (!chore.repeat || chore.repeat === "none" || chore.repeat === "daily") return true;
  const day = new Date().getDay();
  if (chore.repeat === "weekdays") return day >= 1 && day <= 5;
  if (chore.repeat === "weekly" && chore.dueDate) return parseDateKey(chore.dueDate).getDay() === day;
  return true;
}

function inferActivityCategory(message, icon) {
  const text = (message + " " + (icon || "")).toLowerCase();
  if (/chore|approved|photo/.test(text)) return "chores";
  if (/reward|point|★/.test(text)) return "rewards";
  if (/calendar|event|📅/.test(text)) return "calendar";
  if (/list|note|☰|📌/.test(text)) return "lists";
  if (/habit|routine/.test(text)) return "habits";
  if (/theme|sleep|vacation|backup|storage|google/.test(text)) return "settings";
  return "other";
}

function logActivity(message, icon, category) {
  state.activity.unshift({
    id: makeId("activity"),
    message: message,
    icon: icon || "•",
    actor: PROFILES[state.profile].name,
    category: category || inferActivityCategory(message, icon),
    at: new Date().toISOString(),
  });
  state.activity = state.activity.slice(0, 80);
  persistActivity();
}

function repeatLabel(chore) {
  if (chore.repeat === "daily") return "Repeats daily";
  if (chore.repeat === "weekdays") return "Repeats weekdays";
  if (chore.repeat === "weekly") return "Repeats weekly";
  return "";
}

function nextReward(owner) {
  const account = state.rewards[owner];
  if (!account.items.length) return { id: "none", name: "Add a reward", cost: 10, emoji: "🎁" };
  return account.items.slice().sort((a, b) => {
    const aGap = Math.max(0, a.cost - account.points);
    const bGap = Math.max(0, b.cost - account.points);
    return aGap - bGap || a.cost - b.cost;
  })[0];
}

function warningFor(chore) {
  if (choreStatus(chore) === "done") return "";
  if (!isChoreScheduledToday(chore)) return "";
  const record = state.chores[chore.id] || {};
  if (record.status === "pending") return "";
  if (chore.dueDate && (chore.dueDate < datePlus(0) || chore.dueDate === datePlus(0) && chore.dueTime && chore.dueTime < new Date().toTimeString().slice(0, 5))) return "Overdue";
  if (chore.overdueDays) return "Overdue by " + chore.overdueDays + " " + (chore.overdueDays === 1 ? "day" : "days");
  if (chore.missedCount >= 2) return "Missed " + chore.missedCount + " times recently";
  return "";
}

function sortReviewFirst(chores) {
  return chores.slice().sort((a, b) => Number(choreStatus(b) === "pending") - Number(choreStatus(a) === "pending"));
}

function visibleHomeChores() {
  const chores = allChores().filter((chore) => isChoreScheduledToday(chore));
  if (state.profile === "family") return sortReviewFirst(chores.filter((chore) => chore.familyPriority || choreStatus(chore) === "pending"));
  if (PROFILES[state.profile].adult) return sortReviewFirst(chores.filter((chore) => chore.person === state.profile || choreStatus(chore) === "pending"));
  return chores.filter((chore) => chore.person === state.profile);
}

function canReviewFromCurrentView() {
  return state.profile === "family" || PROFILES[state.profile].adult;
}

function choreMarkup(chore, showPerson, fullBoard) {
  const record = state.chores[chore.id] || {};
  const status = choreStatus(chore);
  const isDone = status === "done";
  const warning = warningFor(chore);
  const due = chore.dueDate ? "Due " + parseDateKey(chore.dueDate).toLocaleDateString([], { month: "short", day: "numeric" }) + (chore.dueTime ? " · " + formatTime(chore.dueTime) : "") : null;
  const meta = [showPerson ? PROFILES[chore.person].name : null, chore.area, chore.points ? "+" + chore.points + " points" : null, repeatLabel(chore), due].filter(Boolean).join(" · ");
  let action = "";
  if (status === "ready" || status === "in-progress") {
    const actionName = status === "in-progress" ? "Finish" : "Start";
    action = '<button class="chore-action" type="button" aria-label="' + actionName + " " + escapeHtml(chore.title) + '"><svg><use href="#icon-camera"></use></svg><span>' + actionName + "</span></button>";
  } else if (status === "pending") {
    action = '<span class="status-stack"><span class="status-badge pending">' + (canReviewFromCurrentView() ? "Review photos" : "Waiting for parent") + "</span></span>";
  } else {
    action = '<span class="status-stack"><span class="status-badge approved">' + (record.approvedBy ? "Approved" : "Completed") + "</span>" + (record.approvedBy ? '<span class="approval-by">by ' + escapeHtml(record.approvedBy) + "</span>" : "") + "</span>";
  }
  const removeButton = fullBoard && canReviewFromCurrentView() ? '<button class="chore-delete" data-delete-chore="' + chore.id + '" type="button" aria-label="Remove ' + escapeHtml(chore.title) + '">×</button>' : "";
  const controls = removeButton ? '<span class="chore-action-group">' + action + removeButton + "</span>" : action;
  return '<article class="chore-item' + (isDone ? " done" : "") + '" data-chore-id="' + chore.id + '" data-person="' + chore.person + '" data-state="' + status + '" data-points="' + chore.points + '" tabindex="' + (status === "pending" || status === "done" ? "0" : "-1") + '">' +
    (isDone ? '<span class="chore-check"><svg><use href="#icon-check"></use></svg></span>' : '<span class="chore-icon">' + chore.icon + "</span>") +
    '<div class="chore-copy"><strong>' + escapeHtml(chore.title) + "</strong><span>" + escapeHtml(meta) + "</span>" + (warning ? '<span class="warning-inline">' + escapeHtml(warning) + "</span>" : "") + "</div>" + controls + "</article>";
}

function renderChores() {
  const chores = visibleHomeChores();
  const profileName = state.profile === "family" ? "Everyone" : PROFILES[state.profile].name;
  $("#choreOwnerLabel").textContent = "Today · " + profileName;
  $("#choreList").innerHTML = chores.map((chore) => choreMarkup(chore, state.profile === "family" || PROFILES[state.profile].adult)).join("");
  const done = chores.filter((chore) => choreStatus(chore) === "done").length;
  $("#choreCount").textContent = done;
  $("#choreTotal").textContent = chores.length;
}

function filteredFullChores() {
  const chores = state.choreFilter === "all" ? allChores() : allChores().filter((chore) => chore.person === state.choreFilter);
  if (PROFILES[state.profile].adult && state.choreFilter === state.profile) {
    const ids = new Set(chores.map((chore) => chore.id));
    allChores().filter((chore) => choreStatus(chore) === "pending" && !ids.has(chore.id)).forEach((chore) => chores.push(chore));
  }
  return sortReviewFirst(chores);
}

function renderFullChores() {
  $("#fullChoreList").innerHTML = filteredFullChores().map((chore) => choreMarkup(chore, true, true)).join("");
  $$("[data-chore-filter]").forEach((button) => button.classList.toggle("active", button.dataset.choreFilter === state.choreFilter));
  const warnings = allChores().filter((chore) => warningFor(chore));
  $("#warningTitle").textContent = warnings.length + " " + (warnings.length === 1 ? "chore needs" : "chores need") + " attention";
  $("#warningSummary").textContent = warnings.length ? warnings.map((chore) => PROFILES[chore.person].name + ": " + warningFor(chore).toLowerCase()).join(" · ") : "Everything is currently on track.";
  $("#warningPanel").hidden = warnings.length === 0;
  const pending = allChores().filter((chore) => choreStatus(chore) === "pending");
  $("#reviewQueuePanel").hidden = !canReviewFromCurrentView() || pending.length === 0;
  $("#reviewQueueTitle").textContent = pending.length + " " + (pending.length === 1 ? "chore is" : "chores are") + " ready to review";
  $("#reviewQueueSummary").textContent = pending.map((chore) => PROFILES[chore.person].name + ": " + chore.title).join(" · ");
}

function renderAttention() {
  const visibleWarnings = PROFILES[state.profile].adult || state.profile === "family" ? allChores() : allChores().filter((chore) => chore.person === state.profile);
  const items = visibleWarnings.filter((chore) => warningFor(chore)).slice(0, 3).map((chore) => ({
    icon: "!",
    title: chore.title,
    detail: PROFILES[chore.person].name + " · " + warningFor(chore),
  }));
  if (PROFILES[state.profile].adult) {
    state.rewardClaims.filter((claim) => !claim.acknowledged).slice(0, 2).forEach((claim) => items.unshift({
      icon: "★",
      title: PROFILES[claim.childId].name + " claimed " + claim.rewardName,
      detail: "Open Rewards to acknowledge or schedule it",
    }));
  }
  $("#attentionTitle").textContent = state.profile === "harper" || state.profile === "griffin" ? "Your reminders" : "Household reminders";
  $("#attentionCount").textContent = items.length;
  $("#homeAttentionList").innerHTML = items.slice(0, 3).map((item) => '<div class="attention-item"><span>' + item.icon + '</span><div><strong>' + escapeHtml(item.title) + "</strong><small>" + escapeHtml(item.detail) + "</small></div></div>").join("") || '<div class="attention-item"><span>✓</span><div><strong>Everything is on track</strong><small>No overdue chores or new claims</small></div></div>';
  const alertCount = PROFILES[state.profile].adult ? state.rewardClaims.filter((claim) => !claim.acknowledged).length : 0;
  $$('[data-view="rewards"]').forEach((button) => {
    button.classList.toggle("has-alert", alertCount > 0);
    if (alertCount) button.dataset.count = alertCount;
    else delete button.dataset.count;
  });
}

function renderRewards() {
  const account = currentReward();
  const owner = rewardOwnerName();
  const points = Math.max(0, Number(account.points) || 0);
  const canClaim = state.profile === state.rewardOwner;
  $("#rewardTitle").textContent = owner + "’s reward shop";
  $("#pointCount").textContent = points;
  $("#dialogPoints").textContent = points;
  $("#rewardDialogTitle").textContent = "Manage " + owner + "’s rewards";
  $("#rewardNoteName").textContent = owner;
  $("#homeRewardChoices").innerHTML = account.items.slice(0, 3).map((reward) => {
    const affordable = points >= reward.cost;
    return '<button class="home-reward-choice ' + (affordable ? "affordable" : "") + '" data-claim-owner="' + state.rewardOwner + '" data-claim-reward="' + reward.id + '" type="button" ' + (canClaim ? "" : "disabled") + '><span>' + escapeHtml(reward.emoji) + '</span><span><strong>' + escapeHtml(reward.name) + "</strong><small>" + (affordable ? "Tap to buy" : reward.cost - points + " more needed") + "</small></span><b>" + reward.cost + "</b></button>";
  }).join("");
  $("#encouragement").textContent = canClaim ? "Tap a reward to buy it. Your points only change after the second confirmation." : "Points are saved until they are spent and never expire.";
  $$("[data-reward-owner]").forEach((button) => button.classList.toggle("active", button.dataset.rewardOwner === state.rewardOwner));
  renderRewardOverview();
  renderClaimNotices();
}

function renderRewardOverview() {
  const owners = state.profile === "harper" || state.profile === "griffin" ? [state.profile] : ["harper", "griffin"];
  $("#rewardOverview").innerHTML = owners.map((id) => {
    const account = state.rewards[id];
    const canClaim = state.profile === id;
    const choices = account.items.map((item) => {
      const affordable = account.points >= item.cost;
      return '<button class="reward-choice ' + (affordable ? "affordable" : "") + '" data-claim-owner="' + id + '" data-claim-reward="' + item.id + '" type="button" ' + (canClaim ? "" : "disabled") + '><span>' + escapeHtml(item.emoji) + '</span><span><strong>' + escapeHtml(item.name) + "</strong><small>" + (affordable ? "Ready to claim" : item.cost - account.points + " more points") + "</small></span><b>" + item.cost + " pts</b></button>";
    }).join("");
    return '<article class="reward-person-card ' + id + '"><header><p class="eyebrow">' + PROFILES[id].name + '’s reward shop</p><span>' + PROFILES[id].avatar + '</span></header><div class="reward-card-top"><strong>' + account.points + '</strong><span>available points</span></div><div class="reward-choice-list">' + choices + '</div><footer><span>' + (canClaim ? "Tap a reward to buy it" : account.items.length + " reward choices") + '</span>' + (PROFILES[state.profile].adult ? '<button data-manage-reward="' + id + '" type="button">Manage</button>' : "") + "</footer></article>";
  }).join("");
}

function renderClaimNotices() {
  const panel = $("#claimNoticePanel");
  const claims = state.rewardClaims.filter((claim) => !claim.acknowledged);
  panel.hidden = !PROFILES[state.profile].adult || claims.length === 0;
  if (panel.hidden) {
    panel.innerHTML = "";
    return;
  }
  panel.innerHTML = "<strong>New reward claims</strong><div class=\"claim-notice-list\">" + claims.map((claim) => '<div class="claim-notice"><span><strong>' + PROFILES[claim.childId].name + " claimed " + escapeHtml(claim.rewardName) + "</strong><small>" + new Date(claim.createdAt).toLocaleString() + (claim.scheduledEventId ? " · Scheduled" : "") + '</small></span><div>' + (!claim.scheduledEventId ? '<button data-schedule-claim="' + claim.id + '" type="button">Schedule</button>' : "") + '<button data-ack-claim="' + claim.id + '" type="button">Acknowledge</button></div></div>').join("") + "</div>";
}

function renderDayScore() {
  if (state.profile === "family") {
    const done = allChores().filter((chore) => choreStatus(chore) === "done").length;
    $("#dayScoreValue").textContent = done + " " + (done === 1 ? "chore" : "chores");
    $("#dayScoreLabel").textContent = "done today";
  } else if (state.rewards[state.profile]) {
    $("#dayScoreValue").textContent = state.rewards[state.profile].points + " points";
    $("#dayScoreLabel").textContent = "reward balance";
  } else {
    const chores = allChores().filter((chore) => chore.person === state.profile);
    const done = chores.filter((chore) => choreStatus(chore) === "done").length;
    $("#dayScoreValue").textContent = done + " of " + chores.length;
    $("#dayScoreLabel").textContent = PROFILES[state.profile].name + "’s tasks";
  }
}

function formatTime(value) {
  if (!value) return "";
  const parts = value.split(":").map(Number);
  return new Date(2000, 0, 1, parts[0], parts[1]).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function peopleLabel(value) {
  if (value === "family") return "Everyone";
  if (value === "kids") return "Harper & Griffin";
  return PROFILES[value] ? PROFILES[value].name : value;
}

function eventBarClass(event) {
  if (event.source === "reward") return "orange";
  if (event.source === "connected" || event.source === "google") return "violet";
  return "teal";
}

function eventMarkup(event, compact) {
  const formatted = event.allDay ? "All day" : formatTime(event.time);
  let timeHtml = escapeHtml(formatted);
  if (compact && !event.allDay) {
    const parts = formatted.split(" ");
    timeHtml = "<strong>" + escapeHtml(parts[0] || "") + "</strong><span>" + escapeHtml(parts[1] || "") + "</span>";
  }
  const tag = compact ? "article" : "button";
  const attributes = compact ? "" : ' type="button" data-event-id="' + escapeHtml(event.id) + '" aria-label="' + (event.readOnly ? "View " : "Edit ") + escapeHtml(event.title) + '"';
  return '<' + tag + ' class="event-item' + (compact ? "" : " calendar-event-row") + '"' + attributes + '><time>' + timeHtml + '</time><span class="event-bar ' + eventBarClass(event) + '"></span><div><strong>' + escapeHtml(event.title) + "</strong><span>" + escapeHtml(peopleLabel(event.people) + (event.location ? " · " + event.location : "") + (event.sourceName ? " · " + event.sourceName : "")) + "</span></div>" + (compact ? "" : '<span class="event-edit-hint">' + (event.readOnly ? "View" : "Edit") + ' ›</span>') + '</' + tag + '>';
}

function renderCalendar() {
  const selected = parseDateKey(state.selectedCalendarDate);
  const day = selected.getDay() || 7;
  const monday = new Date(selected);
  monday.setDate(selected.getDate() - day + 1);
  $("#weekStrip").innerHTML = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = dateKey(date);
    return '<button class="' + (key === state.selectedCalendarDate ? "active" : "") + '" data-calendar-date="' + key + '" type="button"><small>' + date.toLocaleDateString([], { weekday: "short" }).toUpperCase() + "</small><strong>" + date.getDate() + "</strong></button>";
  }).join("");
  const selectedEvents = state.events.filter((event) => event.date === state.selectedCalendarDate).sort((a, b) => a.time.localeCompare(b.time));
  $("#calendarAgenda").innerHTML = selectedEvents.length ? selectedEvents.map((event) => eventMarkup(event, false)).join("") : '<div class="empty-state"><strong>Nothing scheduled</strong><span>Tap “Add event” to make a plan for this day.</span></div>';
  const upcoming = state.events.filter((event) => event.date >= datePlus(0)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 3);
  $("#homeEventList").innerHTML = upcoming.length ? upcoming.map((event) => eventMarkup(event, true)).join("") : '<div class="empty-state compact"><strong>No upcoming events</strong><span>The family calendar is clear.</span></div>';
}

function profileLayout(profileId) {
  const saved = state.layouts[profileId];
  const fallback = clone(DEFAULT_LAYOUTS[profileId] || BASE_LAYOUT);
  if (!Array.isArray(saved)) return fallback;
  const merged = saved.filter((item) => WIDGETS.some((widget) => widget.id === item.id));
  WIDGETS.forEach((widget) => {
    if (!merged.some((item) => item.id === widget.id)) merged.push(fallback.find((item) => item.id === widget.id));
  });
  return clone(merged);
}

function applyHomeLayout() {
  profileLayout(state.profile).forEach((item, index) => {
    const card = $('[data-widget="' + item.id + '"]');
    if (!card) return;
    card.style.order = index + 1;
    card.dataset.layoutSize = item.size;
    card.hidden = !item.visible;
  });
}

function renderLayoutEditor() {
  $("#layoutList").innerHTML = state.layoutDraft.map((item, index) => {
    const widget = WIDGETS.find((entry) => entry.id === item.id);
    return '<div class="layout-row' + (item.visible ? "" : " is-hidden") + '" data-layout-id="' + item.id + '"><span>' + widget.icon + '</span><span class="layout-row-copy"><strong>' + widget.name + "</strong><small>" + widget.detail + '</small></span><span class="move-buttons"><button data-move="-1" type="button" aria-label="Move ' + widget.name + ' up" ' + (index === 0 ? "disabled" : "") + '>↑</button><button data-move="1" type="button" aria-label="Move ' + widget.name + ' down" ' + (index === state.layoutDraft.length - 1 ? "disabled" : "") + '>↓</button></span><button class="visibility-button" data-toggle-visibility type="button" aria-label="' + (item.visible ? "Hide" : "Show") + " " + widget.name + '">' + (item.visible ? "◉" : "○") + '</button><select class="size-select" aria-label="' + widget.name + ' size"><option value="compact" ' + (item.size === "compact" ? "selected" : "") + '>Compact</option><option value="half" ' + (item.size === "half" ? "selected" : "") + '>Half</option><option value="wide" ' + (item.size === "wide" ? "selected" : "") + '>Wide</option><option value="full" ' + (item.size === "full" ? "selected" : "") + ">Full width</option></select></div>";
  }).join("");
}

function openLayoutEditor() {
  state.layoutDraft = profileLayout(state.profile);
  renderLayoutEditor();
  elements.layoutDialog.showModal();
}

function artworkMarkup(piece, full) {
  const className = (full ? "gallery-piece " : "art-piece ") + (piece.className || "");
  const content = piece.type === "image" ? '<img alt="' + escapeHtml(piece.title) + '" src="' + piece.data + '">' : "<span>" + escapeHtml(piece.content).replace(/\n/g, "<br>") + "</span>";
  return '<button class="' + className + '" data-art-id="' + piece.id + '" type="button" aria-label="View ' + escapeHtml(piece.title) + '">' + content + (full ? "<small>" + escapeHtml(piece.artist) + "</small>" : "") + "</button>";
}

function renderArt() {
  const showcase = state.artworks.filter((piece) => !piece.archived);
  const archived = state.artworks.filter((piece) => piece.archived);
  const gallery = state.showArchivedArt ? archived : showcase;
  $("#artWall").innerHTML = showcase.slice(-2).map((piece) => artworkMarkup(piece, false)).join("") + '<label class="add-art"><input class="sharedArtUpload" type="file" accept="image/*" capture="environment"><svg><use href="#icon-camera"></use></svg><span>Add art</span></label>';
  $("#fullArtWall").innerHTML = gallery.length ? gallery.map((piece) => artworkMarkup(piece, true)).join("") : '<div class="empty-gallery"><strong>' + (state.showArchivedArt ? "The archive is empty" : "The showcase is empty") + '</strong><span>' + (state.showArchivedArt ? "Archived artwork stays safely stored here." : "Upload a picture or make a finger painting.") + "</span></div>";
  $("#artCount").textContent = showcase.length + " " + (showcase.length === 1 ? "piece" : "pieces");
  $("#showArchiveButton").textContent = state.showArchivedArt ? "Back to showcase" : "View archive (" + archived.length + ")";
  $("#showArchiveButton").classList.toggle("active", state.showArchivedArt);
}

function isHabitScheduledOn(habit, date) {
  const day = date.getDay();
  if (habit.schedule === "weekdays") return day >= 1 && day <= 5;
  if (habit.schedule === "weekends") return day === 0 || day === 6;
  return true;
}

function habitDates(habitId) {
  return Array.isArray(state.habitCompletions[habitId]) ? state.habitCompletions[habitId] : [];
}

function habitDoneToday(habit) {
  return habitDates(habit.id).includes(datePlus(0));
}

function habitStreak(habit) {
  const completed = new Set(habitDates(habit.id));
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  if (isHabitScheduledOn(habit, cursor) && !completed.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  for (let guard = 0; guard < 366; guard += 1) {
    if (!isHabitScheduledOn(habit, cursor)) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (!completed.has(dateKey(cursor))) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function visibleHabits(fullBoard) {
  let habits = state.habits.filter((habit) => {
    if (fullBoard) return true;
    if (vacationIsActive() && state.vacationSettings.pauseHabits) return false;
    return isHabitScheduledOn(habit, new Date());
  });
  if (state.profile === "harper" || state.profile === "griffin") habits = habits.filter((habit) => habit.person === state.profile);
  else if (!fullBoard && state.profile !== "family") habits = habits.filter((habit) => habit.person === state.profile);
  if (fullBoard && state.habitFilter !== "all") habits = habits.filter((habit) => habit.person === state.habitFilter);
  return habits;
}

function habitMarkup(habit, fullBoard) {
  const done = habitDoneToday(habit);
  const streak = habitStreak(habit);
  const canDelete = fullBoard && (PROFILES[state.profile].adult || state.profile === "family");
  return '<article class="habit-row' + (done ? " done" : "") + '" data-habit-id="' + habit.id + '"><button class="habit-check" data-toggle-habit="' + habit.id + '" type="button" aria-label="' + (done ? "Undo " : "Complete ") + escapeHtml(habit.name) + '">' + (done ? '<svg><use href="#icon-check"></use></svg>' : "") + '</button><span class="habit-icon">' + escapeHtml(habit.icon) + '</span><span class="habit-copy"><strong>' + escapeHtml(habit.name) + '</strong><small>' + escapeHtml(PROFILES[habit.person].name + " · " + (habit.schedule === "daily" ? "Every day" : habit.schedule === "weekdays" ? "Weekdays" : "Weekends") + (habit.time ? " · " + formatTime(habit.time) : "")) + '</small></span><span class="habit-streak"><b>' + streak + '</b><small>day streak</small></span>' + (canDelete ? '<button class="row-delete" data-delete-habit="' + habit.id + '" type="button" aria-label="Delete ' + escapeHtml(habit.name) + '">×</button>' : "") + '</article>';
}

function renderHabits() {
  const homeHabits = visibleHabits(false);
  const completed = homeHabits.filter(habitDoneToday).length;
  $("#habitSummary").textContent = completed + " / " + homeHabits.length;
  $("#homeHabitList").innerHTML = homeHabits.length ? homeHabits.slice(0, 4).map((habit) => habitMarkup(habit, false)).join("") : '<div class="empty-state compact"><strong>No routines due today</strong><span>Enjoy the breathing room.</span></div>';
  const fullHabits = visibleHabits(true);
  $("#habitBoard").innerHTML = fullHabits.length ? fullHabits.map((habit) => habitMarkup(habit, true)).join("") : '<div class="empty-state"><strong>No habits here yet</strong><span>Tap “Add habit” to build a gentle family routine.</span></div>';
  $$('[data-habit-filter]').forEach((button) => {
    button.classList.toggle("active", button.dataset.habitFilter === state.habitFilter);
    button.hidden = (state.profile === "harper" || state.profile === "griffin") && button.dataset.habitFilter !== state.profile;
  });
  $("#vacationBanner").hidden = !state.vacationMode;
  $("#vacationBanner small").textContent = state.vacationSettings.pauseHabits ? "Repeating chores and Home habit expectations are paused." : "Repeating chores are paused. Habits can still be checked voluntarily.";
}

function listCategoryLabel(category) {
  return { groceries: "Groceries", household: "Household", school: "School", ideas: "Ideas" }[category] || "Family";
}

function listItemMarkup(item, compact) {
  return '<article class="shared-list-row' + (item.completed ? " done" : "") + '" data-list-id="' + item.id + '"><button class="list-check" data-toggle-list="' + item.id + '" type="button" aria-label="' + (item.completed ? "Mark active " : "Complete ") + escapeHtml(item.text) + '">' + (item.completed ? '<svg><use href="#icon-check"></use></svg>' : "") + '</button><span class="list-copy"><strong>' + escapeHtml(item.text) + '</strong><small>' + escapeHtml(listCategoryLabel(item.category) + " · added by " + (PROFILES[item.addedBy] ? PROFILES[item.addedBy].name : "Family")) + '</small></span>' + (!compact && (PROFILES[state.profile].adult || state.profile === "family") ? '<button class="row-delete" data-delete-list="' + item.id + '" type="button" aria-label="Delete ' + escapeHtml(item.text) + '">×</button>' : "") + '</article>';
}

function filteredListItems() {
  if (state.listFilter === "done") return state.listItems.filter((item) => item.completed);
  if (state.listFilter === "all") return state.listItems;
  return state.listItems.filter((item) => item.category === state.listFilter && !item.completed);
}

function renderLists() {
  const openItems = state.listItems.filter((item) => !item.completed);
  $("#listCount").textContent = openItems.length + " left";
  $("#homeListItems").innerHTML = openItems.length ? openItems.slice(0, 3).map((item) => listItemMarkup(item, true)).join("") : '<div class="empty-state compact"><strong>List cleared</strong><span>Nothing else to remember.</span></div>';
  const filtered = filteredListItems();
  $("#sharedList").innerHTML = filtered.length ? filtered.map((item) => listItemMarkup(item, false)).join("") : '<div class="empty-state"><strong>No list items here</strong><span>Add something the family should remember.</span></div>';
  $("#familyNoteInput").value = state.familyNote;
  $$('[data-list-filter]').forEach((button) => button.classList.toggle("active", button.dataset.listFilter === state.listFilter));
}

function renderVacationMode() {
  refreshVacationState();
  const settings = state.vacationSettings;
  let label = "Repeating chores are running normally";
  if (state.vacationMode) label = "Active" + (settings.endDate ? " through " + parseDateKey(settings.endDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "") + (settings.pauseChores ? " · chores paused" : "");
  else if (settings.enabled && settings.startDate && settings.startDate > datePlus(0)) label = "Scheduled for " + parseDateKey(settings.startDate).toLocaleDateString([], { month: "short", day: "numeric" });
  $("#vacationModeLabel").textContent = label;
  $("#vacationModeButton").classList.toggle("active", state.vacationMode);
}

function renderConnection() {
  const online = navigator.onLine;
  $("#connectionLabel").textContent = online ? "Online" : "Offline · changes saved";
  $("#connectionStatus").classList.toggle("offline", !online);
}

function mixHex(color, target, weight) {
  const parse = (value) => value.replace("#", "").match(/.{2}/g).map((part) => parseInt(part, 16));
  const from = parse(color);
  const to = parse(target);
  return "#" + from.map((channel, index) => Math.round(channel + (to[index] - channel) * weight).toString(16).padStart(2, "0")).join("");
}

function applyProfileTheme(profileId) {
  const theme = state.themes[profileId] || DEFAULT_PROFILE_THEMES[profileId];
  const color = /^#[0-9a-f]{6}$/i.test(theme.color || "") ? theme.color : DEFAULT_PROFILE_THEMES[profileId].color;
  const root = document.body.style;
  root.setProperty("--profile-dark", color);
  root.setProperty("--profile-dark-2", mixHex(color, "#ffffff", .13));
  root.setProperty("--forest", color);
  root.setProperty("--forest-2", mixHex(color, "#ffffff", .13));
  root.setProperty("--profile-soft", mixHex(color, "#ffffff", .86));
  root.setProperty("--profile-bright", mixHex(color, "#ffffff", .38));
  root.setProperty("--reward-accent", mixHex(color, "#f4ef83", .74));
  document.body.dataset.themeFont = theme.font;
  document.body.dataset.controlScale = theme.scale;
  document.body.dataset.decorations = String(theme.decorations !== false);
}

function loadThemeForm(profileId) {
  state.themeEditingProfile = profileId;
  const theme = state.themes[profileId] || DEFAULT_PROFILE_THEMES[profileId];
  $("#themeProfileInput").value = profileId;
  $("#themeColorInput").value = theme.color;
  $("#themeFontInput").value = theme.font;
  $("#themeScaleInput").value = theme.scale;
  $("#themeDecorationsInput").checked = theme.decorations !== false;
  $$('[data-theme-color]').forEach((button) => button.classList.toggle("active", button.dataset.themeColor.toLowerCase() === theme.color.toLowerCase()));
  updateThemePreview();
}

function updateThemePreview() {
  const color = $("#themeColorInput").value;
  const preview = $("#themePreview");
  preview.style.setProperty("--preview-color", color);
  preview.dataset.previewFont = $("#themeFontInput").value;
  preview.dataset.previewScale = $("#themeScaleInput").value;
}

function openThemeSettings() {
  const canChooseAnyone = PROFILES[state.profile].adult;
  $("#themeProfileInput").disabled = !canChooseAnyone;
  loadThemeForm(state.profile);
  elements.themeDialog.showModal();
}

function renderSettingsSummary() {
  const activeTheme = state.themes[state.profile] || DEFAULT_PROFILE_THEMES[state.profile];
  $("#profileThemeLabel").textContent = activeTheme.font === "classic" ? "Storybook type · " + activeTheme.scale + " controls" : (activeTheme.font === "clean" ? "Clean type" : "Rounded type") + " · " + activeTheme.scale + " controls";
  $("#sleepWakeLabel").textContent = state.sleepSettings.enabled ? "Sleeps " + formatTime(state.sleepSettings.sleepTime) + " · wakes " + formatTime(state.sleepSettings.wakeTime) : "Automatic sleep is off";
  $("#googleCalendarLabel").textContent = state.googleSettings.connected ? "Last synced " + (state.googleSettings.lastSync ? new Date(state.googleSettings.lastSync).toLocaleString() : "this session") : "Connect shared family schedules";
}

function toggleHabit(habitId) {
  const habit = state.habits.find((item) => item.id === habitId);
  if (!habit) return;
  if ((state.profile === "harper" || state.profile === "griffin") && habit.person !== state.profile) return;
  const today = datePlus(0);
  const dates = habitDates(habitId).slice();
  const index = dates.indexOf(today);
  if (index >= 0) dates.splice(index, 1);
  else dates.push(today);
  state.habitCompletions[habitId] = dates.slice(-400);
  persistHabitCompletions();
  logActivity((index >= 0 ? "Unchecked " : "Completed ") + habit.name + " for " + PROFILES[habit.person].name, habit.icon);
  renderHabits();
  showToast(index >= 0 ? "Habit reopened" : "Nice work — habit complete!");
}

function addListItem(text, category) {
  const cleanText = text.trim();
  if (!cleanText) return;
  state.listItems.unshift({ id: makeId("list"), text: cleanText, category: category || "groceries", completed: false, addedBy: state.profile, createdAt: new Date().toISOString() });
  persistListItems();
  logActivity("Added “" + cleanText + "” to the family list", "☰");
  renderLists();
  showToast("Added to the family list");
}

function toggleListItem(listId) {
  const item = state.listItems.find((entry) => entry.id === listId);
  if (!item) return;
  item.completed = !item.completed;
  item.completedAt = item.completed ? new Date().toISOString() : null;
  item.completedBy = item.completed ? state.profile : null;
  persistListItems();
  logActivity((item.completed ? "Completed " : "Reopened ") + "list item “" + item.text + "”", item.completed ? "✓" : "↻");
  renderLists();
}

function renderVacationDialogStatus() {
  const enabled = $("#vacationEnabledInput").checked;
  const start = $("#vacationStartInput").value;
  const end = $("#vacationEndInput").value;
  const today = datePlus(0);
  const active = enabled && (!start || today >= start) && (!end || today <= end);
  $("#vacationDialogStatus").innerHTML = '<span>' + (active ? "☀" : "○") + '</span><div><strong>' + (active ? "Vacation mode is active" : enabled ? "Vacation is scheduled" : "Vacation mode is off") + '</strong><small>' + (enabled && (start || end) ? escapeHtml((start ? "Starts " + parseDateKey(start).toLocaleDateString() : "Starts now") + " · " + (end ? "ends " + parseDateKey(end).toLocaleDateString() : "no end date")) : "Turn it on now or choose a future date range.") + '</small></div>';
}

function openVacationSettings(parentId) {
  state.vacationAuthorizedBy = parentId;
  const settings = state.vacationSettings;
  $("#vacationEnabledInput").checked = settings.enabled;
  $("#vacationStartInput").value = settings.startDate;
  $("#vacationEndInput").value = settings.endDate;
  $("#vacationPauseChoresInput").checked = settings.pauseChores;
  $("#vacationPauseHabitsInput").checked = settings.pauseHabits;
  $("#endVacationButton").hidden = !settings.enabled;
  renderVacationDialogStatus();
  elements.vacationDialog.showModal();
}

function renderActivity() {
  const items = state.activity.filter((item) => state.activityFilter === "all" || (item.category || inferActivityCategory(item.message, item.icon)) === state.activityFilter);
  $("#activitySummary").textContent = state.activity.length + " saved household updates · newest first";
  $("#activityList").innerHTML = items.length ? items.map((item) => '<article class="activity-row"><span>' + escapeHtml(item.icon) + '</span><div><strong>' + escapeHtml(item.message) + '</strong><small>' + escapeHtml((item.actor || "Family") + " · " + new Date(item.at).toLocaleString()) + '</small></div><b>' + escapeHtml((item.category || inferActivityCategory(item.message, item.icon)).toUpperCase()) + '</b></article>').join("") : '<div class="empty-state"><strong>No activity in this category</strong><span>Approvals, rewards, calendar changes, and household updates will appear here.</span></div>';
  $$('[data-activity-filter]').forEach((button) => button.classList.toggle("active", button.dataset.activityFilter === state.activityFilter));
}

function openActivity(parentId) {
  state.activityAuthorizedBy = parentId || (PROFILES[state.profile].adult ? state.profile : null);
  renderActivity();
  elements.activityDialog.showModal();
}

async function renderStorageStatus() {
  let copy = "This browser is storing HouseHelper locally.";
  let persisted = false;
  try {
    if (navigator.storage && navigator.storage.persisted) persisted = await navigator.storage.persisted();
  } catch {}
  if (persisted) copy = "Protected local storage is active on this device.";
  $("#storageStatusText").textContent = copy;
  $("#storageStatusCard").classList.toggle("protected", persisted);
  $("#persistStorageButton").textContent = persisted ? "Storage protected" : "Protect storage";
  $("#persistStorageButton").disabled = persisted;
  $("#storageTileLabel").textContent = persisted ? "Protected local storage is active" : "Saved privately in this browser";
}

function openBackup() {
  renderStorageStatus();
  elements.backupDialog.showModal();
}

async function requestPersistentStorage() {
  if (!navigator.storage || !navigator.storage.persist) {
    showToast("This browser does not offer persistent-storage controls");
    return;
  }
  let granted = false;
  try { granted = await navigator.storage.persist(); } catch {}
  await renderStorageStatus();
  logActivity(granted ? "Protected HouseHelper local storage" : "Requested local storage protection", "▣", "settings");
  showToast(granted ? "Local storage protection is active" : "The browser kept its normal storage policy");
}

function exportActivityCsv() {
  const quote = (value) => '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
  const rows = [["Time", "Person", "Category", "Activity"]].concat(state.activity.map((item) => [item.at, item.actor, item.category || inferActivityCategory(item.message, item.icon), item.message]));
  const blob = new Blob([rows.map((row) => row.map(quote).join(",")).join("\r\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "househelper-activity-" + datePlus(0) + ".csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function clearActivityHistory() {
  state.activity = [];
  persistActivity();
  renderActivity();
  showToast("Household activity history cleared");
}

function updateNotificationPermission() {
  const supported = "Notification" in window;
  const permission = supported ? Notification.permission : "unsupported";
  $("#enableNotificationsButton").disabled = !supported || permission === "granted";
  $("#enableNotificationsButton").textContent = permission === "granted" ? "Device alerts enabled" : permission === "denied" ? "Blocked in browser settings" : supported ? "Enable device alerts" : "Not supported here";
  $("#notificationPermissionLabel").textContent = permission === "granted" ? "HouseHelper can show device alerts while the browser allows it." : "In-app reminders work whenever HouseHelper is open.";
}

function renderGoogleCalendarList() {
  const calendars = Array.isArray(state.googleSettings.calendars) ? state.googleSettings.calendars : [];
  const selected = new Set(state.googleSettings.selectedCalendarIds || []);
  const owners = state.googleSettings.calendarOwners || {};
  const ownerOptions = (selectedOwner) => Object.keys(PROFILES).map((id) => '<option value="' + id + '" ' + (selectedOwner === id ? "selected" : "") + '>' + escapeHtml(PROFILES[id].name) + '</option>').join("");
  $("#googleCalendarList").innerHTML = calendars.length ? '<p class="field-label">Calendars to show</p>' + calendars.map((calendar) => '<div class="google-calendar-row"><input type="checkbox" data-google-calendar-id="' + escapeHtml(calendar.id) + '" ' + (selected.has(calendar.id) ? "checked" : "") + ' aria-label="Show ' + escapeHtml(calendar.name) + '" /><span style="--calendar-color:' + escapeHtml(calendar.color || "#8978d8") + '"></span><span><strong>' + escapeHtml(calendar.name) + '</strong><small>' + escapeHtml(calendar.primary ? "Primary calendar" : "Shared calendar") + '</small></span><select data-google-calendar-owner="' + escapeHtml(calendar.id) + '" aria-label="Assign ' + escapeHtml(calendar.name) + ' to">' + ownerOptions(owners[calendar.id] || state.googleSettings.owner || "family") + '</select></div>').join("") : '<div class="integration-empty"><strong>No calendars loaded yet</strong><span>Connect once, then choose which shared calendars appear.</span></div>';
}

function renderGoogleConnectionStatus(message, error) {
  const status = $("#googleConnectionStatus");
  const connected = state.googleSettings.connected && !error;
  status.classList.toggle("connected", connected);
  status.classList.toggle("error", Boolean(error));
  const title = error ? "Calendar connection needs attention" : connected ? "Google Calendar connected" : "Not connected";
  const detail = message || (connected ? (state.googleSettings.lastSync ? "Last synced " + new Date(state.googleSettings.lastSync).toLocaleString() : "Ready to sync") : "Local calendar events are still available.");
  status.innerHTML = '<span></span><div><strong>' + escapeHtml(title) + '</strong><small>' + escapeHtml(detail) + '</small></div>';
  $("#disconnectGoogleButton").hidden = !state.googleSettings.connected;
  $("#syncGoogleButton").hidden = !state.googleSettings.connected;
  $("#connectGoogleButton").textContent = state.googleSettings.connected ? "Reconnect account" : "Save & connect";
}

function loadGoogleIdentityScript() {
  if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
  if (loadGoogleIdentityScript.promise) return loadGoogleIdentityScript.promise;
  loadGoogleIdentityScript.promise = new Promise((resolve, reject) => {
    const existing = $("#googleIdentityScript");
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = "googleIdentityScript";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      script.remove();
      loadGoogleIdentityScript.promise = null;
      reject(new Error("Google Identity Services could not load"));
    };
    document.head.appendChild(script);
  });
  return loadGoogleIdentityScript.promise;
}

function saveGoogleDialogSettings() {
  state.googleSettings.clientId = $("#googleClientIdInput").value.trim();
  state.googleSettings.owner = $("#googleOwnerInput").value;
  state.googleSettings.days = Number($("#googleDaysInput").value) || 60;
  state.reminderSettings.enabled = $("#remindersEnabledInput").checked;
  state.reminderSettings.leadMinutes = Number($("#reminderLeadInput").value) || 15;
  persistGoogleSettings();
  persistReminderSettings();
}

function openGoogleCalendarSettings(parentId) {
  state.googleAuthorizedBy = parentId;
  $("#googleClientIdInput").value = state.googleSettings.clientId || "";
  $("#googleOwnerInput").value = state.googleSettings.owner || "family";
  $("#googleDaysInput").value = String(state.googleSettings.days || 60);
  $("#remindersEnabledInput").checked = state.reminderSettings.enabled;
  $("#reminderLeadInput").value = String(state.reminderSettings.leadMinutes || 15);
  renderGoogleCalendarList();
  renderGoogleConnectionStatus();
  updateNotificationPermission();
  elements.googleCalendarDialog.showModal();
  if (navigator.onLine) loadGoogleIdentityScript().catch(() => {});
}

async function requestGoogleAccessToken(prompt) {
  if (!state.googleSettings.clientId || !/\.apps\.googleusercontent\.com$/.test(state.googleSettings.clientId)) throw new Error("Enter a valid Google OAuth web client ID first.");
  if (!navigator.onLine) throw new Error("Go online to connect Google Calendar. Cached events remain available offline.");
  await loadGoogleIdentityScript();
  return new Promise((resolve, reject) => {
    state.googleTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: state.googleSettings.clientId,
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      callback: (response) => {
        if (!response || response.error || !response.access_token) return reject(new Error(response && response.error_description || response && response.error || "Google authorization was not completed."));
        state.googleAccessToken = response.access_token;
        state.googleTokenExpiresAt = Date.now() + Math.max(60, Number(response.expires_in) || 3600) * 1000 - 60000;
        resolve(response.access_token);
      },
      error_callback: () => reject(new Error("The Google sign-in window was closed or blocked.")),
    });
    state.googleTokenClient.requestAccessToken({ prompt: prompt || "" });
  });
}

async function googleApi(path, token) {
  const response = await fetch("https://www.googleapis.com/calendar/v3" + path, { headers: { Authorization: "Bearer " + token } });
  if (!response.ok) {
    let detail = "Google Calendar returned " + response.status;
    try { detail = (await response.json()).error.message || detail; } catch {}
    throw new Error(detail);
  }
  return response.json();
}

function googleEventToLocal(item, calendar, owner) {
  const hasTime = Boolean(item.start && item.start.dateTime);
  const start = hasTime ? new Date(item.start.dateTime) : parseDateKey(item.start.date);
  return {
    id: "google:" + encodeURIComponent(calendar.id) + ":" + item.id,
    googleEventId: item.id,
    googleCalendarId: calendar.id,
    title: item.summary || "Busy",
    people: owner,
    location: item.location || "",
    date: dateKey(start),
    time: hasTime ? String(start.getHours()).padStart(2, "0") + ":" + String(start.getMinutes()).padStart(2, "0") : "00:00",
    allDay: !hasTime,
    source: "google",
    sourceName: calendar.name,
    htmlLink: item.htmlLink || "",
    readOnly: true,
    updated: item.updated,
  };
}

async function syncGoogleCalendar(options) {
  options = options || {};
  if (state.googleSyncing) return;
  saveGoogleDialogSettings();
  state.googleSyncing = true;
  $("#syncGoogleButton").disabled = true;
  $("#connectGoogleButton").disabled = true;
  renderGoogleConnectionStatus("Connecting securely…");
  try {
    const requestedPrompt = Object.prototype.hasOwnProperty.call(options, "prompt") ? options.prompt : "consent";
    const token = state.googleAccessToken && Date.now() < state.googleTokenExpiresAt ? state.googleAccessToken : await requestGoogleAccessToken(requestedPrompt);
    const calendarResult = await googleApi("/users/me/calendarList?minAccessRole=reader&showHidden=true&maxResults=100", token);
    const calendars = (calendarResult.items || []).map((item) => ({ id: item.id, name: item.summaryOverride || item.summary || item.id, primary: Boolean(item.primary), hidden: Boolean(item.hidden), color: item.backgroundColor || "#8978d8" }));
    let selectedIds = state.googleSettings.selectedCalendarIds || [];
    if (!state.googleSettings.selectionInitialized) selectedIds = calendars.filter((item) => !item.hidden).map((item) => item.id);
    const selectedSet = new Set(selectedIds);
    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + state.googleSettings.days);
    const importedGroups = await Promise.all(calendars.filter((calendar) => selectedSet.has(calendar.id)).map(async (calendar) => {
      const query = new URLSearchParams({ timeMin: now.toISOString(), timeMax: until.toISOString(), singleEvents: "true", orderBy: "startTime", showDeleted: "false", maxResults: "100" });
      const result = await googleApi("/calendars/" + encodeURIComponent(calendar.id) + "/events?" + query, token);
      const owner = (state.googleSettings.calendarOwners || {})[calendar.id] || state.googleSettings.owner;
      return (result.items || []).filter((item) => item.status !== "cancelled" && item.start).map((item) => googleEventToLocal(item, calendar, owner));
    }));
    state.events = state.events.filter((item) => item.source !== "google").concat(importedGroups.flat());
    state.googleSettings.connected = true;
    state.googleSettings.calendars = calendars;
    state.googleSettings.selectedCalendarIds = selectedIds;
    state.googleSettings.selectionInitialized = true;
    state.googleSettings.lastSync = new Date().toISOString();
    persistEvents();
    persistGoogleSettings();
    renderGoogleCalendarList();
    renderGoogleConnectionStatus(importedGroups.flat().length + " upcoming events cached on this device");
    renderAll();
    logActivity("Synced " + importedGroups.flat().length + " Google Calendar events", "📅", "calendar");
    showToast("Google Calendar is up to date");
  } catch (error) {
    if (/401|token|credential/i.test(error.message)) {
      state.googleAccessToken = null;
      state.googleTokenExpiresAt = 0;
    }
    renderGoogleConnectionStatus(error.message, true);
    showToast(error.message);
  } finally {
    state.googleSyncing = false;
    $("#syncGoogleButton").disabled = false;
    $("#connectGoogleButton").disabled = false;
  }
}

function disconnectGoogleCalendar() {
  if (state.googleAccessToken && window.google && google.accounts && google.accounts.oauth2) google.accounts.oauth2.revoke(state.googleAccessToken, () => {});
  state.googleAccessToken = null;
  state.googleTokenExpiresAt = 0;
  state.events = state.events.filter((item) => item.source !== "google");
  state.googleSettings.connected = false;
  state.googleSettings.calendars = [];
  state.googleSettings.selectedCalendarIds = [];
  state.googleSettings.calendarOwners = {};
  state.googleSettings.selectionInitialized = false;
  state.googleSettings.lastSync = null;
  persistEvents();
  persistGoogleSettings();
  renderGoogleCalendarList();
  renderGoogleConnectionStatus();
  renderAll();
  logActivity("Disconnected Google Calendar and removed its cached events", "📅", "calendar");
  showToast("Google Calendar disconnected");
}

async function enableDeviceNotifications() {
  if (!("Notification" in window)) return updateNotificationPermission();
  try { await Notification.requestPermission(); } catch {}
  updateNotificationPermission();
}

function eventStartDate(calendarEvent) {
  const date = parseDateKey(calendarEvent.date);
  const parts = String(calendarEvent.time || "00:00").split(":").map(Number);
  date.setHours(parts[0], parts[1], 0, 0);
  return date;
}

function reminderKey(calendarEvent) {
  return calendarEvent.id + "@" + calendarEvent.date + "T" + calendarEvent.time;
}

function dismissEventReminder() {
  state.activeReminderEventId = null;
  if (elements.eventReminderDialog.open) elements.eventReminderDialog.close();
}

function showEventReminder(calendarEvent, minutes) {
  const key = reminderKey(calendarEvent);
  state.remindedEvents[key] = new Date().toISOString();
  delete state.reminderSnoozes[key];
  localStorage.setItem("hh-reminded-events", JSON.stringify(state.remindedEvents));
  localStorage.setItem("hh-reminder-snoozes", JSON.stringify(state.reminderSnoozes));
  state.activeReminderEventId = calendarEvent.id;
  $("#reminderTitle").textContent = calendarEvent.title;
  $("#reminderDetails").textContent = (calendarEvent.allDay ? "Happening today" : "Starts in about " + Math.max(1, minutes) + " minutes") + " · " + peopleLabel(calendarEvent.people) + (calendarEvent.location ? " · " + calendarEvent.location : "");
  if (!elements.eventReminderDialog.open) elements.eventReminderDialog.showModal();
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification(calendarEvent.title, { body: $("#reminderDetails").textContent, icon: "./favicon.svg", tag: key }); } catch {}
  }
  if (navigator.vibrate) navigator.vibrate([120, 70, 120]);
}

function checkEventReminders() {
  if (!state.reminderSettings.enabled || elements.eventReminderDialog.open) return;
  const now = Date.now();
  const lead = Math.max(1, Number(state.reminderSettings.leadMinutes) || 15);
  const candidate = state.events.filter((item) => !item.allDay).map((item) => ({ item: item, minutes: Math.ceil((eventStartDate(item).getTime() - now) / 60000) })).filter((entry) => entry.minutes >= 0 && entry.minutes <= lead).sort((a, b) => a.minutes - b.minutes)[0];
  if (!candidate) return;
  const key = reminderKey(candidate.item);
  const snoozedUntil = Number(state.reminderSnoozes[key] || 0);
  if (state.remindedEvents[key] || snoozedUntil > now) return;
  showEventReminder(candidate.item, candidate.minutes);
}

function downloadBackup() {
  const data = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith("hh-")) data[key] = localStorage.getItem(key);
  }
  const payload = { product: "HouseHelper", version: 1, exportedAt: new Date().toISOString(), data: data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "househelper-backup-" + datePlus(0) + ".json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  logActivity("Downloaded a HouseHelper backup", "⇩");
  showToast("Backup downloaded · chore photos are not included");
}

async function restoreBackup(file) {
  try {
    const payload = JSON.parse(await file.text());
    if (!payload || payload.product !== "HouseHelper" || !payload.data || typeof payload.data !== "object") throw new Error("Invalid backup");
    Object.entries(payload.data).forEach(([key, value]) => {
      if (key.startsWith("hh-") && typeof value === "string") localStorage.setItem(key, value);
    });
    showToast("Backup restored · reloading HouseHelper");
    setTimeout(() => location.reload(), 600);
  } catch {
    showToast("That file is not a valid HouseHelper backup");
  }
}

function renderAll() {
  refreshVacationState();
  setDateLabels();
  renderChores();
  renderFullChores();
  renderAttention();
  renderRewards();
  renderDayScore();
  renderCalendar();
  renderArt();
  renderHabits();
  renderLists();
  renderVacationMode();
  renderConnection();
  renderSettingsSummary();
  applyHomeLayout();
}

function resetIdleDeadline() {
  if (state.profile === "family" && state.view === "home") {
    state.idleDeadline = null;
    return;
  }
  state.idleDeadline = Date.now() + IDLE_RETURN_MS;
}

function updateIdleCountdown() {
  const idleStatus = $("#idleStatus");
  if (!state.idleDeadline) {
    idleStatus.hidden = true;
    return;
  }
  const remaining = Math.max(0, Math.ceil((state.idleDeadline - Date.now()) / 1000));
  if (remaining === 0) {
    $$("dialog[open]").forEach((dialog) => dialog.close());
    selectProfile("family", { quiet: true });
    navigateTo("home", { quiet: true });
    showToast("Returned to Family Home. Shared timers stayed active.");
    return;
  }
  const label = Math.floor(remaining / 60) + ":" + String(remaining % 60).padStart(2, "0");
  $("#idleCountdown").textContent = label;
  idleStatus.dataset.shortLabel = label;
  idleStatus.hidden = state.view !== "home";
}

function selectProfile(profileId, options) {
  options = options || {};
  if (!PROFILES[profileId]) return;
  state.profile = profileId;
  state.rewardOwner = PROFILES[profileId].rewardOwner;
  state.choreFilter = profileId === "family" ? "all" : profileId;
  state.habitFilter = profileId === "family" ? "all" : profileId;
  localStorage.setItem("hh-profile", profileId);
  const profile = PROFILES[profileId];
  document.body.dataset.profile = profileId;
  document.body.classList.toggle("kid-view", !profile.adult);
  applyProfileTheme(profileId);
  $(".profile-switch .avatar").textContent = profile.avatar;
  $(".profile-copy strong").textContent = profile.name;
  $(".profile-copy small").textContent = profile.shortRole;
  $$(".profile-option").forEach((button) => button.classList.toggle("selected", button.dataset.profile === profileId));
  renderAll();
  resetIdleDeadline();
  updateIdleCountdown();
  if (!options.quiet) showToast(profile.name + " dashboard is ready");
}

function navigateTo(viewId, options) {
  options = options || {};
  if (!VIEWS.includes(viewId)) viewId = "home";
  state.view = viewId;
  $$("[data-app-view]").forEach((view) => {
    const active = view.dataset.appView === viewId;
    view.hidden = !active;
    view.classList.toggle("active", active);
  });
  $$("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === viewId));
  history.replaceState(null, "", "#" + viewId);
  window.scrollTo({ top: 0, behavior: "auto" });
  if (viewId === "chores") renderFullChores();
  if (viewId === "habits") renderHabits();
  if (viewId === "lists") renderLists();
  if (viewId === "rewards") {
    renderRewardOverview();
    renderClaimNotices();
  }
  if (viewId === "calendar") renderCalendar();
  if (viewId === "art") renderArt();
  resetIdleDeadline();
  updateIdleCountdown();
  if (!options.quiet && viewId !== "home") showToast(viewId[0].toUpperCase() + viewId.slice(1) + " opened");
}

function openEvidenceDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("househelper-evidence", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveEvidence(key, file) {
  const db = await openEvidenceDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    tx.objectStore("photos").put(file, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getEvidence(key) {
  const db = await openEvidenceDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readonly");
    const request = tx.objectStore("photos").get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function deleteEvidence(key) {
  const db = await openEvidenceDb();
  return new Promise((resolve) => {
    const tx = db.transaction("photos", "readwrite");
    tx.objectStore("photos").delete(key);
    tx.oncomplete = resolve;
    tx.onerror = resolve;
  });
}

function openPhotoDialog(item) {
  state.activeChore = item;
  state.selectedPhotoFile = null;
  const finishing = item.dataset.state === "in-progress";
  const name = $(".chore-copy strong", item).textContent;
  $("#photoTitle").textContent = (finishing ? "Add an after" : "Add a before") + " photo";
  $("#photoHelp").textContent = finishing ? "Show the finished result for “" + name + ".” Points stay pending until a parent reviews both photos." : "Take a quick picture before starting “" + name + ".” A parent will compare it with the finished result.";
  $("#chorePhoto").value = "";
  $("#photoPreview").removeAttribute("src");
  $("#photoDrop").classList.remove("has-image");
  $("#savePhotoButton").disabled = true;
  if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
  state.photoUrl = null;
  elements.photoDialog.showModal();
}

async function completePhotoStep(withPhoto) {
  const item = state.activeChore;
  if (!item) return;
  const id = item.dataset.choreId;
  const wasFinishing = item.dataset.state === "in-progress";
  const record = state.chores[id] || {};
  record.occurrenceDate = datePlus(0);
  const phase = wasFinishing ? "after" : "before";
  if (withPhoto && state.selectedPhotoFile) {
    await saveEvidence(id + ":" + phase, state.selectedPhotoFile);
    record[phase + "Photo"] = true;
  } else {
    record[phase + "Photo"] = false;
  }
  if (wasFinishing) {
    record.status = "pending";
    record.submittedAt = new Date().toISOString();
    record.pointsAwarded = false;
    showToast("Submitted for parent approval — points are pending");
  } else {
    record.status = "in-progress";
    showToast("Before photo saved — you’ve got this!");
  }
  state.chores[id] = record;
  persistChores();
  const chore = choreById(id);
  if (chore) logActivity((wasFinishing ? "Submitted " : "Started ") + "chore “" + chore.title + "”" + (withPhoto ? " with a photo" : ""), "📷", "chores");
  state.activeChore = null;
  state.selectedPhotoFile = null;
  renderAll();
}

function displayEvidence(img, empty, blob) {
  if (blob) {
    const url = URL.createObjectURL(blob);
    state.detailUrls.push(url);
    img.src = url;
    img.classList.add("visible");
    empty.hidden = true;
  } else {
    img.removeAttribute("src");
    img.classList.remove("visible");
    empty.hidden = false;
  }
}

async function openChoreDetail(choreId) {
  const chore = choreById(choreId);
  if (!chore) return;
  const record = state.chores[choreId] || {};
  const status = choreStatus(chore);
  state.detailChoreId = choreId;
  state.detailUrls.forEach((url) => URL.revokeObjectURL(url));
  state.detailUrls = [];
  $("#detailPerson").textContent = PROFILES[chore.person].name + " · " + chore.area;
  $("#detailTitle").textContent = chore.title;
  const statusText = status === "pending" ? "Waiting for parent approval · " + (chore.points ? "+" + chore.points + " points pending" : "review needed") : record.approvedBy ? "Approved by " + record.approvedBy : "Completed before photo approvals were enabled";
  $("#detailStatus").innerHTML = '<span class="status-badge ' + (status === "pending" ? "pending" : "approved") + '">' + escapeHtml(statusText) + "</span>";
  const evidenceRequired = chore.photoRequired !== false || chore.points > 0;
  $("#approvalRecord").innerHTML = record.approvedBy ? "<strong>Checked by " + escapeHtml(record.approvedBy) + "</strong><br>" + new Date(record.approvedAt).toLocaleString() : status === "pending" ? evidenceRequired ? "Both photos must be present before points can be approved." : "This chore does not require photo evidence, but a parent still confirms completion." : "No parent verification record is available for this earlier sample chore.";
  const canReview = status === "pending" && canReviewFromCurrentView();
  $("#detailActions").hidden = !canReview;
  const evidenceReady = !evidenceRequired || record.beforePhoto && record.afterPhoto;
  $("#approveChoreButton").disabled = !evidenceReady;
  $("#approveChoreButton").textContent = evidenceReady ? PROFILES[state.profile].adult ? "Approve as " + PROFILES[state.profile].name : "Verify parent & approve" : "Both photos required";
  elements.choreDetailDialog.showModal();
  try {
    const evidence = await Promise.all([getEvidence(choreId + ":before"), getEvidence(choreId + ":after")]);
    displayEvidence($("#beforeEvidence"), $("#beforeEmpty"), evidence[0]);
    displayEvidence($("#afterEvidence"), $("#afterEmpty"), evidence[1]);
  } catch {
    showToast("Photo evidence could not be loaded on this device");
  }
}

async function hashPasscode(parentId, passcode) {
  const data = new TextEncoder().encode("HouseHelper:" + parentId + ":" + passcode + ":local-parent");
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function refreshPasscodeCopy() {
  const parent = PROFILES[state.authParent];
  const creating = !state.passcodes[state.authParent];
  $("#passcodeTitle").textContent = state.authConfirming ? "Confirm " + parent.name + "’s passcode" : creating ? "Create " + parent.name + "’s passcode" : "Enter " + parent.name + "’s passcode";
  $("#passcodeHelp").textContent = state.authConfirming ? "Enter the same four digits again to confirm." : creating ? "This is the first parent login on this device. Choose four digits, then confirm them." : "Verify " + parent.name + " before continuing.";
  $$("[data-parent]").forEach((button) => button.classList.toggle("active", button.dataset.parent === state.authParent));
}

function requestParentAuth(context) {
  state.authContext = context;
  state.authParent = context.parentId || (PROFILES[state.profile].adult ? state.profile : "tyler");
  state.authConfirming = false;
  state.pendingPasscodeHash = null;
  $("#parentPicker").hidden = context.action === "switch" || PROFILES[state.profile].adult;
  $("#passcodeInput").value = "";
  $("#passcodeError").textContent = "";
  refreshPasscodeCopy();
  elements.passcodeDialog.showModal();
  setTimeout(() => $("#passcodeInput").focus(), 0);
}

async function approveChore(parentId) {
  const chore = choreById(state.detailChoreId);
  if (!chore) return;
  const record = state.chores[chore.id] || {};
  const evidenceRequired = chore.photoRequired !== false || chore.points > 0;
  if (record.status !== "pending" || evidenceRequired && (!record.beforePhoto || !record.afterPhoto)) {
    showToast("Both photos are required before approval");
    return;
  }
  record.status = "done";
  record.occurrenceDate = datePlus(0);
  record.approvedBy = PROFILES[parentId].name;
  record.approvedAt = new Date().toISOString();
  if (!record.pointsAwarded && chore.points && state.rewards[chore.person]) {
    state.rewards[chore.person].points += chore.points;
    record.pointsAwarded = true;
    persistRewards();
  }
  state.chores[chore.id] = record;
  persistChores();
  logActivity(PROFILES[parentId].name + " approved “" + chore.title + "” for " + PROFILES[chore.person].name + (chore.points ? " (+" + chore.points + " points)" : ""), "✓");
  renderAll();
  await openChoreDetail(chore.id);
  showToast("Approved by " + record.approvedBy + (chore.points ? " · +" + chore.points + " points" : ""));
}

async function requestNewPhotos(parentId) {
  const chore = choreById(state.detailChoreId);
  if (!chore) return;
  const record = state.chores[chore.id] || {};
  record.status = "in-progress";
  record.afterPhoto = false;
  record.returnedBy = PROFILES[parentId].name;
  state.chores[chore.id] = record;
  await deleteEvidence(chore.id + ":after");
  persistChores();
  logActivity(PROFILES[parentId].name + " requested a new photo for “" + chore.title + "”", "📷", "chores");
  elements.choreDetailDialog.close();
  renderAll();
  showToast(PROFILES[parentId].name + " requested a new after photo");
}

async function removeChore(choreId, parentId) {
  const chore = choreById(choreId);
  if (!chore) return;
  if (state.customChores.some((item) => item.id === choreId)) {
    state.customChores = state.customChores.filter((item) => item.id !== choreId);
    persistCustomChores();
  } else if (!state.removedChoreIds.includes(choreId)) {
    state.removedChoreIds.push(choreId);
    persistRemovedChores();
  }
  delete state.chores[choreId];
  persistChores();
  await Promise.all([deleteEvidence(choreId + ":before"), deleteEvidence(choreId + ":after")]);
  logActivity(PROFILES[parentId].name + " removed chore “" + chore.title + "”", "×");
  renderAll();
  showToast(chore.title + " removed by " + PROFILES[parentId].name);
}

function removeHabit(habitId, parentId) {
  const habit = state.habits.find((item) => item.id === habitId);
  if (!habit) return;
  state.habits = state.habits.filter((item) => item.id !== habitId);
  delete state.habitCompletions[habitId];
  persistHabits();
  persistHabitCompletions();
  logActivity(PROFILES[parentId].name + " deleted habit “" + habit.name + "”", "×");
  renderHabits();
  showToast(habit.name + " deleted");
}

function removeListItem(listId, parentId) {
  const item = state.listItems.find((entry) => entry.id === listId);
  if (!item) return;
  state.listItems = state.listItems.filter((entry) => entry.id !== listId);
  persistListItems();
  logActivity(PROFILES[parentId].name + " removed list item “" + item.text + "”", "×");
  renderLists();
  showToast("List item removed");
}

function removeCalendarEvent(eventId, parentId) {
  const calendarEvent = state.events.find((item) => item.id === eventId);
  if (!calendarEvent) return;
  state.events = state.events.filter((item) => item.id !== eventId);
  state.rewardClaims.forEach((claim) => {
    if (claim.scheduledEventId === eventId) claim.scheduledEventId = null;
  });
  persistEvents();
  persistClaims();
  logActivity(PROFILES[parentId].name + " deleted calendar event “" + calendarEvent.title + "”", "📅");
  renderAll();
  showToast("Calendar event deleted");
}

function openDeleteConfirm(type, id) {
  state.pendingDelete = { type: type, id: id };
  if (type === "chore") {
    const chore = choreById(id);
    $("#deleteConfirmTitle").textContent = "Remove " + chore.title + "?";
    $("#deleteConfirmCopy").textContent = "This removes the chore and its stored photo evidence. Repeating occurrences will stop too.";
    $("#confirmDeleteButton").textContent = "Remove chore";
  } else if (type === "art") {
    const piece = state.artworks.find((item) => item.id === id);
    $("#deleteConfirmTitle").textContent = "Delete " + piece.title + " permanently?";
    $("#deleteConfirmCopy").textContent = "Deleting is permanent on this device. Use Archive instead if you may want the artwork later.";
    $("#confirmDeleteButton").textContent = "Delete permanently";
  } else if (type === "habit") {
    const habit = state.habits.find((item) => item.id === id);
    if (!habit) return;
    $("#deleteConfirmTitle").textContent = "Delete " + habit.name + "?";
    $("#deleteConfirmCopy").textContent = "This removes the routine and its streak history from this device.";
    $("#confirmDeleteButton").textContent = "Delete habit";
  } else if (type === "list") {
    const item = state.listItems.find((entry) => entry.id === id);
    if (!item) return;
    $("#deleteConfirmTitle").textContent = "Remove “" + item.text + "”?";
    $("#deleteConfirmCopy").textContent = "This item will be removed from the shared family list.";
    $("#confirmDeleteButton").textContent = "Remove item";
  } else if (type === "event") {
    const calendarEvent = state.events.find((item) => item.id === id);
    if (!calendarEvent) return;
    $("#deleteConfirmTitle").textContent = "Delete “" + calendarEvent.title + "”?";
    $("#deleteConfirmCopy").textContent = "This removes the event from the family calendar on this device.";
    $("#confirmDeleteButton").textContent = "Delete event";
  } else if (type === "activity") {
    $("#deleteConfirmTitle").textContent = "Clear household activity?";
    $("#deleteConfirmCopy").textContent = "This permanently removes the local history. Chores, points, calendar events, and other household data will not be changed.";
    $("#confirmDeleteButton").textContent = "Clear history";
  }
  elements.deleteConfirmDialog.showModal();
}

function removeArtwork(artId) {
  const piece = state.artworks.find((item) => item.id === artId);
  if (!piece) return;
  state.artworks = state.artworks.filter((item) => item.id !== artId);
  persistArtworks();
  logActivity("Deleted artwork “" + piece.title + "”", "🖼");
  renderArt();
  if (elements.artViewerDialog.open) elements.artViewerDialog.close();
  showToast(piece.title + " deleted");
}

function toggleArtworkArchive() {
  const piece = state.artworks.find((item) => item.id === state.activeArtId);
  if (!piece) return;
  piece.archived = !piece.archived;
  persistArtworks();
  logActivity((piece.archived ? "Archived " : "Restored ") + "artwork “" + piece.title + "”", "🖼");
  elements.artViewerDialog.close();
  renderArt();
  showToast(piece.archived ? "Artwork moved to the archive" : "Artwork restored to the show");
}

function openChoreForm() {
  if (!PROFILES[state.profile].adult) return;
  $("#choreForm").reset();
  $("#choreAssigneeInput").value = state.profile;
  $("#choreDueDateInput").value = datePlus(0);
  $("#choreDueTimeInput").value = "18:00";
  $("#chorePointsInput").value = "10";
  $("#chorePhotoRequiredInput").checked = true;
  $("#choreRepeatInput").value = "none";
  elements.choreFormDialog.showModal();
  setTimeout(() => $("#choreTitleInput").focus(), 0);
}

function openRewardManager(owner) {
  if (!PROFILES[state.profile].adult) return;
  state.rewardOwner = owner;
  state.rewardDraftPoints = currentReward().points;
  $("#dialogPoints").textContent = state.rewardDraftPoints;
  $("#rewardNameInput").value = "";
  $("#rewardTargetInput").value = "";
  $("#rewardEmojiInput").value = "🎁";
  renderManagedRewardList();
  renderRewards();
  elements.rewardDialog.showModal();
}

function renderManagedRewardList() {
  $("#managedRewardList").innerHTML = currentReward().items.map((item) => '<div class="managed-reward-row" data-managed-reward="' + item.id + '"><span>' + escapeHtml(item.emoji) + '</span><span><strong>' + escapeHtml(item.name) + "</strong><small>Reward choice</small></span><b>" + item.cost + ' pts</b><button data-delete-reward="' + item.id + '" type="button" aria-label="Remove ' + escapeHtml(item.name) + '">×</button></div>').join("") || '<div class="empty-state compact"><strong>No rewards yet</strong><span>Add one below.</span></div>';
}

function openRewardClaim(owner, rewardId) {
  if (state.profile !== owner) return;
  const item = rewardById(owner, rewardId);
  if (!item) return;
  state.activeClaim = { owner: owner, rewardId: rewardId, step: 1, claimId: null };
  renderRewardClaim();
  elements.rewardClaimDialog.showModal();
}

function renderRewardClaim() {
  const active = state.activeClaim;
  if (!active) return;
  const account = state.rewards[active.owner];
  const item = rewardById(active.owner, active.rewardId);
  const enough = account.points >= item.cost;
  $("#scheduleClaimButton").hidden = active.step !== 3;
  $("#confirmClaimButton").hidden = active.step === 3;
  $("#cancelClaimButton").textContent = active.step === 3 ? "Done" : "Not yet";
  if (active.step === 1) {
    $("#claimEyebrow").textContent = "Reward shop";
    $("#claimTitle").textContent = "Claim " + item.name + "?";
    $("#claimBody").innerHTML = '<div class="claim-hero"><span>' + escapeHtml(item.emoji) + "</span><strong>" + escapeHtml(item.name) + "</strong><p>" + (enough ? "This reward costs " + item.cost + " points. Tap continue, then confirm once more before any points are used." : "You need " + (item.cost - account.points) + " more points before this reward can be claimed.") + '</p><span class="claim-balance">Balance: ' + account.points + " points</span></div>";
    $("#confirmClaimButton").disabled = !enough;
    $("#confirmClaimButton").textContent = enough ? "Yes, continue" : "Keep earning";
  } else if (active.step === 2) {
    $("#claimEyebrow").textContent = "Final confirmation";
    $("#claimTitle").textContent = "Use " + item.cost + " points?";
    $("#claimBody").innerHTML = '<div class="claim-hero"><span>' + escapeHtml(item.emoji) + "</span><strong>One more tap</strong><p>Your balance will change from " + account.points + " to " + (account.points - item.cost) + " points. A parent will be notified.</p></div>";
    $("#confirmClaimButton").disabled = false;
    $("#confirmClaimButton").textContent = "Buy for " + item.cost + " points";
  } else {
    $("#claimEyebrow").textContent = "Reward claimed";
    $("#claimTitle").textContent = "Nice work!";
    $("#claimBody").innerHTML = '<div class="claim-hero success"><span>🎉</span><strong>' + escapeHtml(item.name) + "</strong><p>Tyler and Rose will see this claim. You can also put it on the family calendar now.</p></div>";
  }
}

function finishRewardClaim() {
  const active = state.activeClaim;
  const item = rewardById(active.owner, active.rewardId);
  const account = state.rewards[active.owner];
  if (!item || account.points < item.cost) return;
  account.points -= item.cost;
  const claim = { id: makeId("claim"), childId: active.owner, rewardId: item.id, rewardName: item.name, rewardEmoji: item.emoji, cost: item.cost, createdAt: new Date().toISOString(), acknowledged: false, scheduledEventId: null };
  state.rewardClaims.unshift(claim);
  active.claimId = claim.id;
  active.step = 3;
  persistRewards();
  persistClaims();
  logActivity(PROFILES[active.owner].name + " claimed “" + item.name + "” for " + item.cost + " points", "★");
  renderAll();
  renderRewardClaim();
  showToast(item.name + " claimed · " + item.cost + " points used");
}

function openEventDialog(prefill) {
  prefill = prefill || {};
  const existing = prefill.eventId ? state.events.find((item) => item.id === prefill.eventId) : null;
  const values = existing || prefill;
  const readOnly = Boolean(existing && existing.readOnly);
  $("#calendarEventForm").reset();
  $("#eventNameInput").value = values.title || "";
  $("#eventPeopleInput").value = values.people || (state.profile === "family" ? "family" : state.profile);
  $("#eventLocationInput").value = values.location || "";
  $("#eventDateInput").value = values.date || state.selectedCalendarDate || datePlus(0);
  $("#eventTimeInput").value = values.time || "18:00";
  $("#calendarEventTitle").textContent = readOnly ? "Google Calendar event" : existing ? "Edit event" : prefill.claimId ? "Schedule a reward" : "Add an event";
  $("#saveEventButton").textContent = existing ? "Save changes" : "Add to calendar";
  $("#saveEventButton").hidden = readOnly;
  $("#deleteEventButton").hidden = !existing || readOnly;
  ["#eventNameInput", "#eventPeopleInput", "#eventLocationInput", "#eventDateInput", "#eventTimeInput"].forEach((selector) => $(selector).disabled = readOnly);
  $("#eventSourceNote").textContent = readOnly ? "This event is a read-only copy from " + (existing.sourceName || "Google Calendar") + ". Sync again after changing it in Google." : "Everyone—including Harper and Griffin—can add family calendar items. Connected calendars appear beside these dashboard-created events.";
  $("#openGoogleEventLink").hidden = !readOnly || !existing.htmlLink;
  $("#openGoogleEventLink").href = readOnly && existing.htmlLink ? existing.htmlLink : "";
  state.editingEventId = existing ? existing.id : null;
  state.schedulingClaimId = prefill.claimId || null;
  elements.calendarEventDialog.showModal();
  setTimeout(() => $("#eventNameInput").focus(), 0);
}

function scheduleClaim(claimId) {
  const claim = state.rewardClaims.find((item) => item.id === claimId);
  if (!claim) return;
  openEventDialog({ title: PROFILES[claim.childId].name + ": " + claim.rewardName, people: claim.childId, claimId: claim.id });
}

function acknowledgeClaim(claimId) {
  const claim = state.rewardClaims.find((item) => item.id === claimId);
  if (!claim) return;
  claim.acknowledged = true;
  persistClaims();
  logActivity("Acknowledged " + PROFILES[claim.childId].name + "’s reward claim", "★");
  renderAll();
  showToast("Reward claim acknowledged");
}

function fileToArtworkData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const scale = Math.min(1, 1200 / image.width, 900 / image.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function addArtwork(file) {
  if (!file) return;
  try {
    const data = await fileToArtworkData(file);
    state.artworks.push({ id: makeId("art"), type: "image", data: data, title: "New family artwork", artist: PROFILES[state.profile].name });
    persistArtworks();
    logActivity("Added artwork to the family show", "🖼", "other");
    renderArt();
    showToast("Artwork added to the family show");
  } catch {
    showToast("That artwork could not be added");
  }
}

function openArtViewer(artId) {
  const piece = state.artworks.find((item) => item.id === artId);
  if (!piece) return;
  state.activeArtId = artId;
  $("#artViewerStage").innerHTML = piece.type === "image" ? '<img src="' + piece.data + '" alt="' + escapeHtml(piece.title) + '">' : '<div class="viewer-css-art ' + piece.className + '"><span>' + escapeHtml(piece.content).replace(/\n/g, "<br>") + "</span></div>";
  $("#artViewerTitle").textContent = piece.title;
  $("#artViewerArtist").textContent = "By " + piece.artist;
  $("#archiveArtworkButton").textContent = piece.archived ? "Restore to showcase" : "Archive piece";
  elements.artViewerDialog.showModal();
}

function clearPainting() {
  const canvas = $("#paintCanvas");
  const context = canvas.getContext("2d");
  context.save();
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();
}

function sizePaintCanvas() {
  const canvas = $("#paintCanvas");
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(320, Math.round(rect.width * scale));
  canvas.height = Math.max(320, Math.round(rect.height * scale));
}

function openPainter() {
  state.paintColor = "#ef4444";
  state.paintErasing = false;
  $$("#paintColors button").forEach((button) => button.classList.toggle("active", button.dataset.color === state.paintColor));
  $("#paintEraser").classList.remove("active");
  elements.paintDialog.showModal();
  requestAnimationFrame(() => {
    sizePaintCanvas();
    clearPainting();
  });
}

function paintPoint(event) {
  const canvas = $("#paintCanvas");
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
}

function beginPaint(event) {
  state.paintDrawing = true;
  state.paintLast = paintPoint(event);
  const context = event.currentTarget.getContext("2d");
  context.beginPath();
  context.arc(state.paintLast.x, state.paintLast.y, state.paintErasing ? 26 : 12, 0, Math.PI * 2);
  context.fillStyle = state.paintErasing ? "#ffffff" : state.paintColor;
  context.fill();
  event.currentTarget.setPointerCapture(event.pointerId);
}

function continuePaint(event) {
  if (!state.paintDrawing) return;
  const canvas = $("#paintCanvas");
  const context = canvas.getContext("2d");
  const next = paintPoint(event);
  context.beginPath();
  context.moveTo(state.paintLast.x, state.paintLast.y);
  context.lineTo(next.x, next.y);
  context.strokeStyle = state.paintErasing ? "#ffffff" : state.paintColor;
  context.lineWidth = state.paintErasing ? 52 : 24;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.stroke();
  state.paintLast = next;
}

function endPaint() {
  state.paintDrawing = false;
  state.paintLast = null;
}

function savePainting() {
  const canvas = $("#paintCanvas");
  state.artworks.push({ id: makeId("art"), type: "image", data: canvas.toDataURL("image/jpeg", 0.88), title: PROFILES[state.profile].name + "’s finger painting", artist: PROFILES[state.profile].name });
  try {
    persistArtworks();
    logActivity("Saved a new finger painting", "🎨", "other");
    renderArt();
    elements.paintDialog.close();
    showToast("Painting saved to the art show");
  } catch {
    state.artworks.pop();
    showToast("This painting is too large for local storage");
  }
}

function formatTimer(seconds) {
  return Math.floor(seconds / 60).toString().padStart(2, "0") + ":" + (seconds % 60).toString().padStart(2, "0");
}

function renderTimer() {
  elements.timerDisplay.textContent = formatTimer(state.timerSeconds);
  $("#timerToggle").textContent = state.timerRunning ? "Pause timer" : state.timerSeconds === 0 ? "Start again" : "Start timer";
}

function stopTimer() {
  state.timerRunning = false;
  clearInterval(state.timerId);
  state.timerId = null;
  renderTimer();
}

function toggleTimer() {
  if (state.timerRunning) return stopTimer();
  if (state.timerSeconds === 0) state.timerSeconds = state.timerInitial;
  state.timerRunning = true;
  renderTimer();
  state.timerId = setInterval(() => {
    state.timerSeconds -= 1;
    renderTimer();
    if (state.timerSeconds <= 0) {
      stopTimer();
      showToast("Family timer finished — check the timer tile!");
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  }, 1000);
}

function clearCalmSlideshow() {
  clearInterval(calmSlideTimer);
  calmSlideTimer = null;
  calmObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  calmObjectUrls = [];
}

function calmArtSlide(piece) {
  if (piece.type === "image") return '<span class="calm-slide"><img src="' + piece.data + '" alt=""><span class="calm-caption">' + escapeHtml(piece.title) + " · " + escapeHtml(piece.artist) + "</span></span>";
  return '<span class="calm-slide calm-css-art ' + escapeHtml(piece.className || "") + '"><strong>' + escapeHtml(piece.content).replace(/\n/g, "<br>") + '</strong><span class="calm-caption">' + escapeHtml(piece.title) + " · " + escapeHtml(piece.artist) + "</span></span>";
}

async function calmBeforeAfterSlides() {
  const eligible = allChores().filter((chore) => {
    const record = state.chores[chore.id] || {};
    return record.beforePhoto && record.afterPhoto;
  }).sort((a, b) => String((state.chores[b.id] || {}).approvedAt || "").localeCompare(String((state.chores[a.id] || {}).approvedAt || ""))).slice(0, 8);
  const slides = [];
  for (const chore of eligible) {
    const blobs = await Promise.all([getEvidence(chore.id + ":before"), getEvidence(chore.id + ":after")]);
    if (!blobs[0] || !blobs[1]) continue;
    const beforeUrl = URL.createObjectURL(blobs[0]);
    const afterUrl = URL.createObjectURL(blobs[1]);
    calmObjectUrls.push(beforeUrl, afterUrl);
    slides.push('<span class="calm-slide calm-before-after"><span><img src="' + beforeUrl + '" alt=""><b>Before</b></span><span><img src="' + afterUrl + '" alt=""><b>After</b></span><span class="calm-caption">' + escapeHtml(PROFILES[chore.person].name + " · " + chore.title) + "</span></span>");
  }
  return slides;
}

function startCalmSlides(slides, seconds) {
  const visual = $("#calmVisual");
  if (!slides.length) {
    visual.innerHTML = '<span class="calm-slide calm-empty"><strong>Good night</strong></span>';
    return;
  }
  let index = 0;
  const show = () => {
    visual.innerHTML = slides[index];
    index = (index + 1) % slides.length;
  };
  show();
  if (slides.length > 1) calmSlideTimer = setInterval(show, Math.max(5, Number(seconds) || 20) * 1000);
}

async function renderCalmVisual(settings) {
  clearCalmSlideshow();
  const visual = $("#calmVisual");
  elements.calmScreen.style.setProperty("--calm-color", settings.color || "#102721");
  if (settings.display === "solid") return startCalmSlides(['<span class="calm-slide calm-empty"></span>'], settings.interval);
  if (settings.display === "static") {
    let blob = state.calmPreview ? state.sleepDraftImage : null;
    if (!blob) {
      try { blob = await getEvidence("sleep:static"); } catch {}
    }
    if (blob) {
      const url = URL.createObjectURL(blob);
      calmObjectUrls.push(url);
      return startCalmSlides(['<span class="calm-slide"><img src="' + url + '" alt=""></span>'], settings.interval);
    }
  }
  if (settings.display === "before-after") {
    try {
      const slides = await calmBeforeAfterSlides();
      if (slides.length) return startCalmSlides(slides, settings.interval);
    } catch {}
  }
  const artwork = state.artworks.filter((piece) => settings.includeArchived || !piece.archived);
  startCalmSlides(artwork.map(calmArtSlide), settings.interval);
  visual.dataset.mode = settings.display;
}

function timeMinutes(value) {
  const parts = String(value || "00:00").split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

function currentSleepWindowKey(now) {
  if (!state.sleepSettings.enabled) return "";
  const minute = now.getHours() * 60 + now.getMinutes();
  const sleep = timeMinutes(state.sleepSettings.sleepTime);
  const wake = timeMinutes(state.sleepSettings.wakeTime);
  const start = new Date(now);
  if (sleep === wake) return "";
  if (sleep > wake) {
    if (minute >= sleep) return dateKey(start) + "@" + state.sleepSettings.sleepTime;
    if (minute < wake) {
      start.setDate(start.getDate() - 1);
      return dateKey(start) + "@" + state.sleepSettings.sleepTime;
    }
    return "";
  }
  return minute >= sleep && minute < wake ? dateKey(start) + "@" + state.sleepSettings.sleepTime : "";
}

function buildSleepDraft() {
  return {
    enabled: $("#sleepEnabledInput").checked,
    sleepTime: $("#sleepTimeInput").value || "21:00",
    wakeTime: $("#wakeTimeInput").value || "06:00",
    display: $('input[name="sleepDisplay"]:checked').value,
    interval: Number($("#sleepIntervalInput").value),
    color: $("#sleepColorInput").value,
    includeArchived: $("#sleepArchivedArtInput").checked,
    hasStaticImage: Boolean(state.sleepDraftImage || state.sleepSettings.hasStaticImage),
  };
}

function openSleepSettings(parentId) {
  state.sleepAuthorizedBy = parentId;
  state.sleepDraftImage = null;
  const settings = state.sleepSettings;
  $("#sleepEnabledInput").checked = settings.enabled;
  $("#sleepTimeInput").value = settings.sleepTime;
  $("#wakeTimeInput").value = settings.wakeTime;
  const mode = $('input[name="sleepDisplay"][value="' + settings.display + '"]') || $('input[name="sleepDisplay"][value="art"]');
  mode.checked = true;
  $("#sleepIntervalInput").value = String(settings.interval);
  $("#sleepColorInput").value = settings.color;
  $("#sleepArchivedArtInput").checked = settings.includeArchived;
  $("#sleepImageStatus").textContent = settings.hasStaticImage ? "A custom sleep image is stored on this device" : "No custom image selected";
  elements.sleepDialog.showModal();
}

function enterCalmMode(options) {
  options = options || {};
  state.calmAutomatic = Boolean(options.automatic);
  state.calmPreview = Boolean(options.settings);
  updateClock();
  renderCalmVisual(options.settings || state.sleepSettings);
  elements.calmScreen.classList.add("active");
  elements.calmScreen.setAttribute("aria-hidden", "false");
  $("#wakeButton").focus();
}

function leaveCalmMode(options) {
  options = options || {};
  elements.calmScreen.classList.remove("active");
  elements.calmScreen.setAttribute("aria-hidden", "true");
  clearCalmSlideshow();
  if (state.calmPreview) state.sleepDraftImage = null;
  if (!options.automatic) {
    const windowKey = currentSleepWindowKey(new Date());
    if (windowKey) sessionStorage.setItem("hh-calm-wake-window", windowKey);
  }
  state.calmAutomatic = false;
  state.calmPreview = false;
  $("#sleepButton").focus();
}

function checkSleepSchedule() {
  const windowKey = currentSleepWindowKey(new Date());
  const manuallyWoken = windowKey && sessionStorage.getItem("hh-calm-wake-window") === windowKey;
  if (windowKey && !manuallyWoken && !elements.calmScreen.classList.contains("active")) enterCalmMode({ automatic: true });
  if (!windowKey && state.calmAutomatic && elements.calmScreen.classList.contains("active")) leaveCalmMode({ automatic: true });
}

elements.profileSwitch.addEventListener("click", () => elements.profileDialog.showModal());
$(".profile-grid").addEventListener("click", (event) => {
  const option = event.target.closest(".profile-option");
  if (!option) return;
  elements.profileDialog.close();
  if (PROFILES[option.dataset.profile].adult) requestParentAuth({ action: "switch", parentId: option.dataset.profile });
  else selectProfile(option.dataset.profile);
});

$(".parent-picker").addEventListener("click", (event) => {
  const button = event.target.closest("[data-parent]");
  if (!button) return;
  state.authParent = button.dataset.parent;
  state.authConfirming = false;
  state.pendingPasscodeHash = null;
  $("#passcodeInput").value = "";
  $("#passcodeError").textContent = "";
  refreshPasscodeCopy();
});

$("#passcodeInput").addEventListener("input", (event) => {
  event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
  $("#passcodeError").textContent = "";
});

$("#passcodeForm").addEventListener("submit", async (event) => {
  if (event.submitter && event.submitter.value !== "unlock") return;
  event.preventDefault();
  const code = $("#passcodeInput").value;
  if (!/^\d{4}$/.test(code)) {
    $("#passcodeError").textContent = "Enter exactly four numbers.";
    return;
  }
  const hash = await hashPasscode(state.authParent, code);
  const existing = state.passcodes[state.authParent];
  if (!existing && !state.authConfirming) {
    state.pendingPasscodeHash = hash;
    state.authConfirming = true;
    $("#passcodeInput").value = "";
    refreshPasscodeCopy();
    return;
  }
  if (!existing && hash !== state.pendingPasscodeHash || existing && hash !== existing) {
    $("#passcodeError").textContent = "That passcode did not match. Try again.";
    state.authConfirming = false;
    state.pendingPasscodeHash = null;
    $("#passcodeInput").value = "";
    refreshPasscodeCopy();
    return;
  }
  if (!existing) {
    state.passcodes[state.authParent] = hash;
    localStorage.setItem("hh-parent-passcodes", JSON.stringify(state.passcodes));
  }
  const context = state.authContext;
  const parentId = state.authParent;
  elements.passcodeDialog.close();
  state.authContext = null;
  if (context.action === "switch") selectProfile(parentId);
  if (context.action === "approve") await approveChore(parentId);
  if (context.action === "redo") await requestNewPhotos(parentId);
  if (context.action === "deleteChore") await removeChore(context.choreId, parentId);
  if (context.action === "deleteItem") {
    if (context.itemType === "chore") await removeChore(context.itemId, parentId);
    if (context.itemType === "habit") removeHabit(context.itemId, parentId);
    if (context.itemType === "list") removeListItem(context.itemId, parentId);
    if (context.itemType === "event") removeCalendarEvent(context.itemId, parentId);
  }
  if (context.action === "vacation") openVacationSettings(parentId);
  if (context.action === "sleep") openSleepSettings(parentId);
  if (context.action === "google") openGoogleCalendarSettings(parentId);
  if (context.action === "activity") openActivity(parentId);
  if (context.action === "backup") openBackup();
});

$("#manageRewardsButton").addEventListener("click", () => openRewardManager(state.rewardOwner));
$(".reward-kid-tabs").addEventListener("click", (event) => {
  const button = event.target.closest("[data-reward-owner]");
  if (!button) return;
  state.rewardOwner = button.dataset.rewardOwner;
  renderRewards();
});

$("#rewardOverview").addEventListener("click", (event) => {
  const manage = event.target.closest("[data-manage-reward]");
  if (manage) {
    openRewardManager(manage.dataset.manageReward);
    return;
  }
  const reward = event.target.closest("[data-claim-reward]");
  if (reward) openRewardClaim(reward.dataset.claimOwner, reward.dataset.claimReward);
});
$("#homeRewardChoices").addEventListener("click", (event) => {
  const reward = event.target.closest("[data-claim-reward]");
  if (reward) openRewardClaim(reward.dataset.claimOwner, reward.dataset.claimReward);
});

$$("[data-points]").forEach((button) => button.addEventListener("click", () => {
  state.rewardDraftPoints = Math.max(0, state.rewardDraftPoints + Number(button.dataset.points));
  $("#dialogPoints").textContent = state.rewardDraftPoints;
}));

$("#managedRewardList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-reward]");
  if (!button) return;
  currentReward().items = currentReward().items.filter((item) => item.id !== button.dataset.deleteReward);
  persistRewards();
  renderManagedRewardList();
  renderRewards();
});

$("#rewardForm").addEventListener("submit", (event) => {
  if (!event.submitter || event.submitter.value !== "default") return;
  event.preventDefault();
  const name = $("#rewardNameInput").value.trim();
  const costText = $("#rewardTargetInput").value;
  const cost = Number(costText);
  if (name && (!Number.isFinite(cost) || cost < 10) || !name && costText) {
    showToast("Add a reward name and a cost of at least 10 points");
    return;
  }
  currentReward().points = state.rewardDraftPoints;
  if (name) currentReward().items.push({ id: makeId("reward"), name: name, cost: cost, emoji: $("#rewardEmojiInput").value.trim() || "🎁" });
  persistRewards();
  logActivity("Updated " + rewardOwnerName() + "’s reward shop" + (name ? " and added “" + name + "”" : ""), "★", "rewards");
  elements.rewardDialog.close();
  renderAll();
  showToast(rewardOwnerName() + "’s reward choices updated");
});

$("#closeClaimDialog").addEventListener("click", () => elements.rewardClaimDialog.close());
$("#cancelClaimButton").addEventListener("click", () => elements.rewardClaimDialog.close());
$("#confirmClaimButton").addEventListener("click", () => {
  if (!state.activeClaim) return;
  if (state.activeClaim.step === 1) {
    state.activeClaim.step = 2;
    renderRewardClaim();
  } else if (state.activeClaim.step === 2) finishRewardClaim();
});
$("#scheduleClaimButton").addEventListener("click", () => {
  const claimId = state.activeClaim && state.activeClaim.claimId;
  elements.rewardClaimDialog.close();
  if (claimId) scheduleClaim(claimId);
});

$("#claimNoticePanel").addEventListener("click", (event) => {
  const schedule = event.target.closest("[data-schedule-claim]");
  if (schedule) {
    scheduleClaim(schedule.dataset.scheduleClaim);
    return;
  }
  const acknowledge = event.target.closest("[data-ack-claim]");
  if (acknowledge) acknowledgeClaim(acknowledge.dataset.ackClaim);
});

function handleChoreListClick(event) {
  const remove = event.target.closest("[data-delete-chore]");
  if (remove) {
    openDeleteConfirm("chore", remove.dataset.deleteChore);
    return;
  }
  const action = event.target.closest(".chore-action");
  if (action) {
    openPhotoDialog(action.closest(".chore-item"));
    return;
  }
  const item = event.target.closest(".chore-item");
  if (item && ["pending", "done"].includes(item.dataset.state)) openChoreDetail(item.dataset.choreId);
}

$("#choreList").addEventListener("click", handleChoreListClick);
$("#fullChoreList").addEventListener("click", handleChoreListClick);
["#fullChoreList", "#choreList"].forEach((selector) => $(selector).addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches(".chore-item")) openChoreDetail(event.target.dataset.choreId);
}));

$(".filter-row").addEventListener("click", (event) => {
  const button = event.target.closest("[data-chore-filter]");
  if (!button) return;
  state.choreFilter = button.dataset.choreFilter;
  renderFullChores();
});

$("#chorePhoto").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  state.selectedPhotoFile = file;
  if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
  state.photoUrl = URL.createObjectURL(file);
  $("#photoPreview").src = state.photoUrl;
  $("#photoDrop").classList.add("has-image");
  $("#savePhotoButton").disabled = false;
});

$("#photoForm").addEventListener("submit", async (event) => {
  const value = event.submitter && event.submitter.value;
  if (!["save", "skip"].includes(value)) return;
  event.preventDefault();
  await completePhotoStep(value === "save");
  elements.photoDialog.close();
});

$("#closeChoreDetail").addEventListener("click", () => elements.choreDetailDialog.close());
$("#approveChoreButton").addEventListener("click", () => {
  if (PROFILES[state.profile].adult) approveChore(state.profile);
  else requestParentAuth({ action: "approve", choreId: state.detailChoreId });
});
$("#requestRedoButton").addEventListener("click", () => {
  if (PROFILES[state.profile].adult) requestNewPhotos(state.profile);
  else requestParentAuth({ action: "redo", choreId: state.detailChoreId });
});

$("#addChoreButton").addEventListener("click", openChoreForm);
$("#fullAddChoreButton").addEventListener("click", openChoreForm);
$("#choreForm").addEventListener("submit", (event) => {
  if (!event.submitter || event.submitter.value !== "save") return;
  event.preventDefault();
  const assignee = $("#choreAssigneeInput").value;
  const points = Math.max(0, Number($("#chorePointsInput").value) || 0);
  const chore = {
    id: makeId("chore"),
    person: assignee,
    title: $("#choreTitleInput").value.trim(),
    area: $("#choreAreaInput").value.trim(),
    points: points,
    icon: "✨",
    initialStatus: "ready",
    dueDate: $("#choreDueDateInput").value,
    dueTime: $("#choreDueTimeInput").value,
    repeat: $("#choreRepeatInput").value,
    photoRequired: $("#chorePhotoRequiredInput").checked || points > 0 && (assignee === "harper" || assignee === "griffin"),
    familyPriority: true,
    createdBy: state.profile,
  };
  if (!chore.title || !chore.area) {
    showToast("Add a chore name and room");
    return;
  }
  state.customChores.push(chore);
  persistCustomChores();
  logActivity("Assigned chore “" + chore.title + "” to " + PROFILES[assignee].name, "✓", "chores");
  elements.choreFormDialog.close();
  renderAll();
  showToast(chore.title + " assigned to " + PROFILES[assignee].name);
});

$("#closeDeleteConfirm").addEventListener("click", () => elements.deleteConfirmDialog.close());
$("#cancelDeleteConfirm").addEventListener("click", () => elements.deleteConfirmDialog.close());
$("#confirmDeleteButton").addEventListener("click", async () => {
  const pending = state.pendingDelete;
  if (!pending) return;
  elements.deleteConfirmDialog.close();
  state.pendingDelete = null;
  if (pending.type === "art") {
    removeArtwork(pending.id);
    return;
  }
  if (pending.type === "activity" && state.activityAuthorizedBy) {
    clearActivityHistory();
    return;
  }
  if (!PROFILES[state.profile].adult) {
    requestParentAuth({ action: "deleteItem", itemType: pending.type, itemId: pending.id });
    return;
  }
  if (pending.type === "chore") await removeChore(pending.id, state.profile);
  if (pending.type === "habit") removeHabit(pending.id, state.profile);
  if (pending.type === "list") removeListItem(pending.id, state.profile);
  if (pending.type === "event") removeCalendarEvent(pending.id, state.profile);
});

$("#customizeLayoutButton").addEventListener("click", openLayoutEditor);
$("#settingsLayoutButton").addEventListener("click", openLayoutEditor);
$("#layoutList").addEventListener("click", (event) => {
  const row = event.target.closest(".layout-row");
  if (!row) return;
  const index = state.layoutDraft.findIndex((item) => item.id === row.dataset.layoutId);
  const move = event.target.closest("[data-move]");
  if (move) {
    const next = index + Number(move.dataset.move);
    if (next >= 0 && next < state.layoutDraft.length) [state.layoutDraft[index], state.layoutDraft[next]] = [state.layoutDraft[next], state.layoutDraft[index]];
    renderLayoutEditor();
    return;
  }
  if (event.target.closest("[data-toggle-visibility]")) {
    state.layoutDraft[index].visible = !state.layoutDraft[index].visible;
    renderLayoutEditor();
  }
});
$("#layoutList").addEventListener("change", (event) => {
  if (!event.target.matches(".size-select")) return;
  const row = event.target.closest(".layout-row");
  state.layoutDraft.find((entry) => entry.id === row.dataset.layoutId).size = event.target.value;
});
$("#resetLayoutButton").addEventListener("click", () => {
  state.layoutDraft = clone(DEFAULT_LAYOUTS[state.profile] || BASE_LAYOUT);
  renderLayoutEditor();
});
$("#layoutForm").addEventListener("submit", (event) => {
  if (!event.submitter || event.submitter.value !== "save") return;
  state.layouts[state.profile] = clone(state.layoutDraft);
  localStorage.setItem("hh-layouts", JSON.stringify(state.layouts));
  applyHomeLayout();
  logActivity("Updated " + PROFILES[state.profile].name + "’s Home layout", "▦", "settings");
  showToast(PROFILES[state.profile].name + " Home layout saved");
});

$("#profileThemesButton").addEventListener("click", openThemeSettings);
$("#themeProfileInput").addEventListener("change", (event) => loadThemeForm(event.target.value));
$("#themeSwatches").addEventListener("click", (event) => {
  const swatch = event.target.closest("[data-theme-color]");
  if (!swatch) return;
  $("#themeColorInput").value = swatch.dataset.themeColor;
  $$('[data-theme-color]').forEach((button) => button.classList.toggle("active", button === swatch));
  updateThemePreview();
});
["#themeColorInput", "#themeFontInput", "#themeScaleInput"].forEach((selector) => $(selector).addEventListener("input", updateThemePreview));
$("#resetThemeButton").addEventListener("click", () => {
  const theme = DEFAULT_PROFILE_THEMES[state.themeEditingProfile];
  $("#themeColorInput").value = theme.color;
  $("#themeFontInput").value = theme.font;
  $("#themeScaleInput").value = theme.scale;
  $("#themeDecorationsInput").checked = theme.decorations;
  $$('[data-theme-color]').forEach((button) => button.classList.toggle("active", button.dataset.themeColor.toLowerCase() === theme.color.toLowerCase()));
  updateThemePreview();
});
$("#themeForm").addEventListener("submit", (event) => {
  if (!event.submitter || event.submitter.value !== "save") return;
  event.preventDefault();
  state.themes[state.themeEditingProfile] = { color: $("#themeColorInput").value, font: $("#themeFontInput").value, scale: $("#themeScaleInput").value, decorations: $("#themeDecorationsInput").checked };
  persistThemes();
  if (state.themeEditingProfile === state.profile) applyProfileTheme(state.profile);
  elements.themeDialog.close();
  renderAll();
  logActivity("Updated " + PROFILES[state.themeEditingProfile].name + "’s profile theme", "★", "settings");
  showToast(PROFILES[state.themeEditingProfile].name + "’s theme saved on this device");
});

$("#sleepImageInput").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  state.sleepDraftImage = file;
  $("#sleepImageStatus").textContent = file.name + " · ready to save";
});
$("#previewSleepButton").addEventListener("click", () => {
  const settings = buildSleepDraft();
  elements.sleepDialog.close();
  enterCalmMode({ settings: settings });
});
$("#sleepForm").addEventListener("submit", async (event) => {
  if (!event.submitter || event.submitter.value !== "save") return;
  event.preventDefault();
  const settings = buildSleepDraft();
  if (state.sleepDraftImage) {
    try {
      await saveEvidence("sleep:static", state.sleepDraftImage);
      settings.hasStaticImage = true;
    } catch {
      showToast("The sleep image could not be stored on this device");
      return;
    }
  }
  state.sleepSettings = settings;
  persistSleepSettings();
  elements.sleepDialog.close();
  renderAll();
  checkSleepSchedule();
  logActivity("Updated the household sleep and wake schedule", "☾", "settings");
  showToast("Sleep and wake settings saved");
});

[$("#vacationEnabledInput"), $("#vacationStartInput"), $("#vacationEndInput")].forEach((input) => input.addEventListener("change", renderVacationDialogStatus));
$("#vacationForm").addEventListener("submit", (event) => {
  if (!event.submitter || event.submitter.value !== "save") return;
  event.preventDefault();
  const startDate = $("#vacationStartInput").value;
  const endDate = $("#vacationEndInput").value;
  if (startDate && endDate && endDate < startDate) return showToast("Vacation must end after it starts");
  state.vacationSettings = { enabled: $("#vacationEnabledInput").checked, startDate: startDate, endDate: endDate, pauseChores: $("#vacationPauseChoresInput").checked, pauseHabits: $("#vacationPauseHabitsInput").checked };
  persistVacationSettings();
  refreshVacationState();
  elements.vacationDialog.close();
  renderAll();
  logActivity("Updated vacation mode" + (state.vacationMode ? " · now active" : ""), "☀", "settings");
  showToast(state.vacationMode ? "Vacation mode is active" : state.vacationSettings.enabled ? "Vacation mode scheduled" : "Vacation mode is off");
});
$("#endVacationButton").addEventListener("click", () => {
  state.vacationSettings.enabled = false;
  persistVacationSettings();
  refreshVacationState();
  elements.vacationDialog.close();
  renderAll();
  logActivity("Ended vacation mode", "☀", "settings");
  showToast("Vacation mode ended · repeating chores restored");
});

$("#addEventButton").addEventListener("click", () => openEventDialog());
$("#weekStrip").addEventListener("click", (event) => {
  const button = event.target.closest("[data-calendar-date]");
  if (!button) return;
  state.selectedCalendarDate = button.dataset.calendarDate;
  renderCalendar();
});
$("#calendarAgenda").addEventListener("click", (event) => {
  const row = event.target.closest("[data-event-id]");
  if (row) openEventDialog({ eventId: row.dataset.eventId });
});
$("#deleteEventButton").addEventListener("click", () => {
  const eventId = state.editingEventId;
  elements.calendarEventDialog.close();
  if (eventId) openDeleteConfirm("event", eventId);
});
$("#calendarEventForm").addEventListener("submit", (event) => {
  if (!event.submitter || event.submitter.value !== "save") return;
  event.preventDefault();
  const calendarEvent = {
    id: state.editingEventId || makeId("event"),
    title: $("#eventNameInput").value.trim(),
    people: $("#eventPeopleInput").value,
    location: $("#eventLocationInput").value.trim(),
    date: $("#eventDateInput").value,
    time: $("#eventTimeInput").value,
    source: state.schedulingClaimId ? "reward" : "local",
    createdBy: state.profile,
  };
  if (!calendarEvent.title || !calendarEvent.date || !calendarEvent.time) {
    showToast("Add an event name, date, and time");
    return;
  }
  const existingIndex = state.events.findIndex((item) => item.id === state.editingEventId);
  if (existingIndex >= 0) {
    calendarEvent.source = state.events[existingIndex].source;
    calendarEvent.createdBy = state.events[existingIndex].createdBy;
    state.events[existingIndex] = calendarEvent;
    logActivity("Updated calendar event “" + calendarEvent.title + "”", "📅");
  } else {
    state.events.push(calendarEvent);
    logActivity("Added calendar event “" + calendarEvent.title + "”", "📅");
  }
  if (state.schedulingClaimId) {
    const claim = state.rewardClaims.find((item) => item.id === state.schedulingClaimId);
    if (claim) claim.scheduledEventId = calendarEvent.id;
    persistClaims();
  }
  state.selectedCalendarDate = calendarEvent.date;
  state.schedulingClaimId = null;
  state.editingEventId = null;
  persistEvents();
  elements.calendarEventDialog.close();
  renderAll();
  navigateTo("calendar", { quiet: true });
  showToast(existingIndex >= 0 ? "Calendar event updated" : "Added to the family calendar");
});

function openHabitDialog() {
  $("#habitForm").reset();
  const isKid = state.profile === "harper" || state.profile === "griffin";
  $("#habitPersonInput").value = isKid ? state.profile : state.profile === "family" ? "harper" : state.profile;
  $("#habitPersonInput").disabled = isKid;
  $("#habitTimeInput").value = "19:00";
  elements.habitDialog.showModal();
  setTimeout(() => $("#habitNameInput").focus(), 0);
}

$("#addHabitButton").addEventListener("click", openHabitDialog);
$("#habitForm").addEventListener("submit", (event) => {
  if (!event.submitter || event.submitter.value !== "save") return;
  event.preventDefault();
  const name = $("#habitNameInput").value.trim();
  if (!name) return;
  const habit = { id: makeId("habit"), person: $("#habitPersonInput").value, name: name, icon: $("#habitIconInput").value, schedule: $("#habitScheduleInput").value, time: $("#habitTimeInput").value };
  state.habits.push(habit);
  persistHabits();
  logActivity("Added habit “" + habit.name + "” for " + PROFILES[habit.person].name, habit.icon);
  elements.habitDialog.close();
  renderHabits();
  showToast("New habit added for " + PROFILES[habit.person].name);
});

function handleHabitClick(event) {
  const remove = event.target.closest("[data-delete-habit]");
  if (remove) return openDeleteConfirm("habit", remove.dataset.deleteHabit);
  const toggle = event.target.closest("[data-toggle-habit]");
  if (toggle) toggleHabit(toggle.dataset.toggleHabit);
}
$("#homeHabitList").addEventListener("click", handleHabitClick);
$("#habitBoard").addEventListener("click", handleHabitClick);
$("#habitFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-habit-filter]");
  if (!button) return;
  state.habitFilter = button.dataset.habitFilter;
  renderHabits();
});

$("#homeListForm").addEventListener("submit", (event) => {
  event.preventDefault();
  addListItem($("#homeListInput").value, "groceries");
  event.currentTarget.reset();
});
$("#fullListForm").addEventListener("submit", (event) => {
  event.preventDefault();
  addListItem($("#fullListInput").value, $("#listCategoryInput").value);
  event.currentTarget.reset();
});
function handleListClick(event) {
  const remove = event.target.closest("[data-delete-list]");
  if (remove) return openDeleteConfirm("list", remove.dataset.deleteList);
  const toggle = event.target.closest("[data-toggle-list]");
  if (toggle) toggleListItem(toggle.dataset.toggleList);
}
$("#homeListItems").addEventListener("click", handleListClick);
$("#sharedList").addEventListener("click", handleListClick);
$("#listFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-list-filter]");
  if (!button) return;
  state.listFilter = button.dataset.listFilter;
  renderLists();
});
$("#saveFamilyNoteButton").addEventListener("click", () => {
  state.familyNote = $("#familyNoteInput").value.trim();
  localStorage.setItem("hh-family-note", state.familyNote);
  logActivity("Updated the pinned family note", "📌");
  showToast("Family note saved");
});

document.addEventListener("change", (event) => {
  if (event.target.matches(".sharedArtUpload")) {
    const file = event.target.files && event.target.files[0];
    addArtwork(file);
    event.target.value = "";
  }
});

function handleArtClick(event) {
  const piece = event.target.closest("[data-art-id]");
  if (piece) openArtViewer(piece.dataset.artId);
}
$("#artWall").addEventListener("click", handleArtClick);
$("#fullArtWall").addEventListener("click", handleArtClick);
$("#closeArtViewer").addEventListener("click", () => elements.artViewerDialog.close());
$("#archiveArtworkButton").addEventListener("click", toggleArtworkArchive);
$("#deleteArtworkButton").addEventListener("click", () => {
  const artId = state.activeArtId;
  elements.artViewerDialog.close();
  if (artId) openDeleteConfirm("art", artId);
});
$("#showArchiveButton").addEventListener("click", () => {
  state.showArchivedArt = !state.showArchivedArt;
  renderArt();
});
$("#openPaintButton").addEventListener("click", openPainter);
$("#closePaintButton").addEventListener("click", () => elements.paintDialog.close());
$("#paintColors").addEventListener("click", (event) => {
  const button = event.target.closest("[data-color]");
  if (!button) return;
  state.paintColor = button.dataset.color;
  state.paintErasing = false;
  $$("#paintColors button").forEach((item) => item.classList.toggle("active", item === button));
  $("#paintEraser").classList.remove("active");
});
$("#paintEraser").addEventListener("click", () => {
  state.paintErasing = true;
  $$("#paintColors button").forEach((button) => button.classList.remove("active"));
  $("#paintEraser").classList.add("active");
});
$("#clearPaint").addEventListener("click", clearPainting);
$("#savePainting").addEventListener("click", savePainting);
$("#paintCanvas").addEventListener("pointerdown", beginPaint);
$("#paintCanvas").addEventListener("pointermove", continuePaint);
$("#paintCanvas").addEventListener("pointerup", endPaint);
$("#paintCanvas").addEventListener("pointercancel", endPaint);
$("#paintCanvas").addEventListener("pointerleave", endPaint);

$$("[data-minutes]").forEach((button) => button.addEventListener("click", () => {
  stopTimer();
  state.timerInitial = Number(button.dataset.minutes) * 60;
  state.timerSeconds = state.timerInitial;
  $$("[data-minutes]").forEach((item) => item.classList.toggle("active", item === button));
  renderTimer();
}));
$("#timerToggle").addEventListener("click", toggleTimer);
$("#timerReset").addEventListener("click", () => {
  stopTimer();
  state.timerSeconds = state.timerInitial;
  renderTimer();
});

$("#sleepButton").addEventListener("click", enterCalmMode);
$("#wakeButton").addEventListener("click", leaveCalmMode);
$("#sleepWakeButton").addEventListener("click", () => {
  if (PROFILES[state.profile].adult) openSleepSettings(state.profile);
  else requestParentAuth({ action: "sleep" });
});
$("#vacationModeButton").addEventListener("click", () => {
  if (PROFILES[state.profile].adult) openVacationSettings(state.profile);
  else requestParentAuth({ action: "vacation" });
});
$("#activityButton").addEventListener("click", () => {
  if (PROFILES[state.profile].adult) openActivity(state.profile);
  else requestParentAuth({ action: "activity" });
});
function requestGoogleSettingsAccess() {
  if (PROFILES[state.profile].adult) openGoogleCalendarSettings(state.profile);
  else requestParentAuth({ action: "google" });
}
$("#googleCalendarButton").addEventListener("click", requestGoogleSettingsAccess);
$("#connectCalendarButton").addEventListener("click", requestGoogleSettingsAccess);
$("#backupButton").addEventListener("click", () => {
  if (PROFILES[state.profile].adult) openBackup();
  else requestParentAuth({ action: "backup" });
});
$("#closeActivityButton").addEventListener("click", () => elements.activityDialog.close());
$("#doneActivityButton").addEventListener("click", () => elements.activityDialog.close());
$("#activityFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-activity-filter]");
  if (!button) return;
  state.activityFilter = button.dataset.activityFilter;
  renderActivity();
});
$("#exportActivityButton").addEventListener("click", exportActivityCsv);
$("#clearActivityButton").addEventListener("click", () => {
  elements.activityDialog.close();
  openDeleteConfirm("activity", "all");
});
$("#closeBackupButton").addEventListener("click", () => elements.backupDialog.close());
$("#persistStorageButton").addEventListener("click", requestPersistentStorage);
$("#downloadBackupButton").addEventListener("click", downloadBackup);
$("#restoreBackupInput").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (file) restoreBackup(file);
  event.target.value = "";
});
$("#closeGoogleCalendarButton").addEventListener("click", () => elements.googleCalendarDialog.close());
$("#connectGoogleButton").addEventListener("click", () => {
  saveGoogleDialogSettings();
  if (!state.googleSettings.clientId) {
    renderGoogleConnectionStatus("Reminder settings saved. Add a web client ID when you are ready to connect.");
    renderAll();
    showToast("Calendar reminder settings saved");
    return;
  }
  syncGoogleCalendar({ prompt: "consent" });
});
$("#syncGoogleButton").addEventListener("click", () => syncGoogleCalendar({ prompt: "" }));
$("#disconnectGoogleButton").addEventListener("click", disconnectGoogleCalendar);
$("#googleCalendarList").addEventListener("change", (event) => {
  if (event.target.matches("[data-google-calendar-owner]")) {
    state.googleSettings.calendarOwners = state.googleSettings.calendarOwners || {};
    state.googleSettings.calendarOwners[event.target.dataset.googleCalendarOwner] = event.target.value;
  } else if (event.target.matches("[data-google-calendar-id]")) {
    state.googleSettings.selectedCalendarIds = $$('[data-google-calendar-id]:checked', $("#googleCalendarList")).map((input) => input.dataset.googleCalendarId);
  } else return;
  state.googleSettings.selectionInitialized = true;
  persistGoogleSettings();
  showToast("Calendar selection saved · tap Sync now to refresh");
});
$("#enableNotificationsButton").addEventListener("click", enableDeviceNotifications);
$("#dismissReminderButton").addEventListener("click", dismissEventReminder);
$("#snoozeReminderButton").addEventListener("click", () => {
  const calendarEvent = state.events.find((item) => item.id === state.activeReminderEventId);
  if (calendarEvent) {
    const key = reminderKey(calendarEvent);
    delete state.remindedEvents[key];
    state.reminderSnoozes[key] = Date.now() + 5 * 60 * 1000;
    localStorage.setItem("hh-reminded-events", JSON.stringify(state.remindedEvents));
    localStorage.setItem("hh-reminder-snoozes", JSON.stringify(state.reminderSnoozes));
  }
  dismissEventReminder();
  showToast("Reminder snoozed for 5 minutes");
});
$("#openReminderEventButton").addEventListener("click", () => {
  const calendarEvent = state.events.find((item) => item.id === state.activeReminderEventId);
  if (calendarEvent) state.selectedCalendarDate = calendarEvent.date;
  dismissEventReminder();
  navigateTo("calendar");
});
window.addEventListener("online", renderConnection);
window.addEventListener("offline", renderConnection);
setInterval(updateClock, 30000);
setInterval(updateIdleCountdown, 1000);
setInterval(checkSleepSchedule, 30000);
setInterval(checkEventReminders, 30000);
["pointerdown", "keydown", "touchstart"].forEach((eventName) => document.addEventListener(eventName, resetIdleDeadline, { passive: true }));
document.addEventListener("scroll", resetIdleDeadline, { passive: true });
document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-view]");
  if (nav) {
    if (nav.matches("a")) event.preventDefault();
    navigateTo(nav.dataset.view);
  }
});
$$(".settings-tile:not(#settingsLayoutButton):not(#profileThemesButton):not(#sleepWakeButton):not(#vacationModeButton):not(#activityButton):not(#googleCalendarButton):not(#backupButton)").forEach((button) => button.addEventListener("click", () => showToast("This settings panel is ready for the next detail pass")));

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));

selectProfile(state.profile, { quiet: true });
navigateTo(state.view, { quiet: true });
renderTimer();
updateClock();
renderStorageStatus();
setTimeout(checkSleepSchedule, 400);
setTimeout(checkEventReminders, 900);
