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
  vacationMode: localStorage.getItem("hh-vacation-mode") === "true",
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
  habitDialog: $("#habitDialog"),
  activityDialog: $("#activityDialog"),
  backupDialog: $("#backupDialog"),
  timerDisplay: $("#timerDisplay"),
  calmScreen: $("#calmScreen"),
  toast: $("#toast"),
};

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

function isChoreScheduledToday(chore) {
  if (state.vacationMode && chore.repeat && chore.repeat !== "none") return false;
  if (!chore.repeat || chore.repeat === "none" || chore.repeat === "daily") return true;
  const day = new Date().getDay();
  if (chore.repeat === "weekdays") return day >= 1 && day <= 5;
  if (chore.repeat === "weekly" && chore.dueDate) return parseDateKey(chore.dueDate).getDay() === day;
  return true;
}

function logActivity(message, icon) {
  state.activity.unshift({
    id: makeId("activity"),
    message: message,
    icon: icon || "•",
    actor: PROFILES[state.profile].name,
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
  if (event.source === "connected") return "violet";
  return "teal";
}

function eventMarkup(event, compact) {
  const formatted = formatTime(event.time);
  let timeHtml = escapeHtml(formatted);
  if (compact) {
    const parts = formatted.split(" ");
    timeHtml = "<strong>" + escapeHtml(parts[0] || "") + "</strong><span>" + escapeHtml(parts[1] || "") + "</span>";
  }
  const tag = compact ? "article" : "button";
  const attributes = compact ? "" : ' type="button" data-event-id="' + event.id + '" aria-label="Edit ' + escapeHtml(event.title) + '"';
  return '<' + tag + ' class="event-item' + (compact ? "" : " calendar-event-row") + '"' + attributes + '><time>' + timeHtml + '</time><span class="event-bar ' + eventBarClass(event) + '"></span><div><strong>' + escapeHtml(event.title) + "</strong><span>" + escapeHtml(peopleLabel(event.people) + (event.location ? " · " + event.location : "")) + "</span></div>" + (compact ? "" : '<span class="event-edit-hint">Edit ›</span>') + '</' + tag + '>';
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
  let habits = state.habits.filter((habit) => fullBoard || isHabitScheduledOn(habit, new Date()));
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
  $("#vacationModeLabel").textContent = state.vacationMode ? "On · repeating chores are paused" : "Repeating chores are running normally";
  $("#vacationModeButton").classList.toggle("active", state.vacationMode);
}

function renderConnection() {
  const online = navigator.onLine;
  $("#connectionLabel").textContent = online ? "Online" : "Offline · changes saved";
  $("#connectionStatus").classList.toggle("offline", !online);
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

function toggleVacationMode(parentId) {
  state.vacationMode = !state.vacationMode;
  localStorage.setItem("hh-vacation-mode", String(state.vacationMode));
  logActivity((state.vacationMode ? "Turned on" : "Turned off") + " vacation mode as " + PROFILES[parentId].name, "☀");
  renderAll();
  showToast(state.vacationMode ? "Vacation mode on · repeating chores paused" : "Vacation mode off · routines restored");
}

function renderActivity() {
  $("#activityList").innerHTML = state.activity.length ? state.activity.map((item) => '<article class="activity-row"><span>' + escapeHtml(item.icon) + '</span><div><strong>' + escapeHtml(item.message) + '</strong><small>' + escapeHtml(item.actor) + " · " + new Date(item.at).toLocaleString() + '</small></div></article>').join("") : '<div class="empty-state"><strong>No activity yet</strong><span>Approvals, rewards, calendar changes, and household updates will appear here.</span></div>';
}

function openActivity() {
  renderActivity();
  elements.activityDialog.showModal();
}

function openBackup() {
  elements.backupDialog.showModal();
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
  $("#calendarEventForm").reset();
  $("#eventNameInput").value = values.title || "";
  $("#eventPeopleInput").value = values.people || (state.profile === "family" ? "family" : state.profile);
  $("#eventLocationInput").value = values.location || "";
  $("#eventDateInput").value = values.date || state.selectedCalendarDate || datePlus(0);
  $("#eventTimeInput").value = values.time || "18:00";
  $("#calendarEventTitle").textContent = existing ? "Edit event" : prefill.claimId ? "Schedule a reward" : "Add an event";
  $("#saveEventButton").textContent = existing ? "Save changes" : "Add to calendar";
  $("#deleteEventButton").hidden = !existing;
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

function enterCalmMode() {
  updateClock();
  elements.calmScreen.classList.add("active");
  elements.calmScreen.setAttribute("aria-hidden", "false");
  $("#wakeButton").focus();
}

function leaveCalmMode() {
  elements.calmScreen.classList.remove("active");
  elements.calmScreen.setAttribute("aria-hidden", "true");
  sessionStorage.setItem("hh-calm-wake-override", "true");
  $("#sleepButton").focus();
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
  if (context.action === "vacation") toggleVacationMode(parentId);
  if (context.action === "activity") openActivity();
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
  showToast(PROFILES[state.profile].name + " Home layout saved");
});

$("#addEventButton").addEventListener("click", () => openEventDialog());
$("#connectCalendarButton").addEventListener("click", () => showToast("Google Calendar connection comes with the shared account backend"));
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
$("#vacationModeButton").addEventListener("click", () => {
  if (PROFILES[state.profile].adult) toggleVacationMode(state.profile);
  else requestParentAuth({ action: "vacation" });
});
$("#activityButton").addEventListener("click", () => {
  if (PROFILES[state.profile].adult) openActivity();
  else requestParentAuth({ action: "activity" });
});
$("#backupButton").addEventListener("click", () => {
  if (PROFILES[state.profile].adult) openBackup();
  else requestParentAuth({ action: "backup" });
});
$("#closeActivityButton").addEventListener("click", () => elements.activityDialog.close());
$("#closeBackupButton").addEventListener("click", () => elements.backupDialog.close());
$("#downloadBackupButton").addEventListener("click", downloadBackup);
$("#restoreBackupInput").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (file) restoreBackup(file);
  event.target.value = "";
});
window.addEventListener("online", renderConnection);
window.addEventListener("offline", renderConnection);
setInterval(updateClock, 30000);
setInterval(updateIdleCountdown, 1000);
["pointerdown", "keydown", "touchstart"].forEach((eventName) => document.addEventListener(eventName, resetIdleDeadline, { passive: true }));
document.addEventListener("scroll", resetIdleDeadline, { passive: true });
document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-view]");
  if (nav) {
    if (nav.matches("a")) event.preventDefault();
    navigateTo(nav.dataset.view);
  }
});
$$(".settings-tile:not(#settingsLayoutButton):not(#vacationModeButton):not(#activityButton):not(#backupButton)").forEach((button) => button.addEventListener("click", () => showToast("This settings panel is ready for the next detail pass")));

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));

selectProfile(state.profile, { quiet: true });
navigateTo(state.view, { quiet: true });
renderTimer();
updateClock();
const currentHour = new Date().getHours();
if ((currentHour >= 21 || currentHour < 6) && !sessionStorage.getItem("hh-calm-wake-override")) enterCalmMode();
