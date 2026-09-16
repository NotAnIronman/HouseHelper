function readStoredNumber(key, fallback) {
  const value = localStorage.getItem(key);
  return value === null || !Number.isFinite(Number(value)) ? fallback : Number(value);
}

const APP_VERSION = window.HouseHelperCompat && window.HouseHelperCompat.VERSION || "0.6.1";

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

const FAMILY_CONFIG_KEY = "hh-family-config";
const PROFILE_COLORS = ["#2d6a5a", "#315c8a", "#80527f", "#b64f73", "#2d718d", "#9a5b34", "#5e6b42", "#6c57a0"];

function safeMemberId(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

function nameFromId(value) {
  return String(value || "").split(/[-_]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function findExistingMembers() {
  const adults = new Set(Object.keys(readStoredObject("hh-parent-passcodes")));
  const children = new Set(Object.keys(readStoredObject("hh-rewards")));
  const known = new Set([...adults, ...children]);
  const displayNames = new Map();
  const addPerson = (value) => { if (value && value !== "family" && value !== "kids") known.add(String(value)); };
  readStoredArray("hh-custom-chores", []).forEach((item) => { addPerson(item && item.person); addPerson(item && item.createdBy); });
  readStoredArray("hh-habits", []).forEach((item) => addPerson(item && item.person));
  readStoredArray("hh-events", []).forEach((item) => { addPerson(item && item.people); addPerson(item && item.createdBy); });
  Object.values(readStoredObject("hh-chores")).forEach((record) => {
    [record && record.approvedBy, record && record.returnedBy].filter(Boolean).forEach((name) => {
      const id = safeMemberId(name);
      if (!id) return;
      known.add(id);
      adults.add(id);
      displayNames.set(id, String(name));
    });
  });
  Object.keys(readStoredObject("hh-profile-themes")).forEach(addPerson);
  Object.keys(readStoredObject("hh-layouts")).forEach(addPerson);
  addPerson(localStorage.getItem("hh-profile"));
  const members = [...known].map((id, index) => ({
    id,
    name: displayNames.get(id) || nameFromId(id),
    role: adults.has(id) ? "Parent / caregiver" : children.has(id) ? "Child" : "Household member",
    adult: adults.has(id),
    color: PROFILE_COLORS[index % PROFILE_COLORS.length],
  }));
  if (!adults.size && members.length) members.unshift({ id: "adult-1", name: "", role: "Parent / caregiver", adult: true, color: PROFILE_COLORS[0] });
  return members;
}

function normalizeFamilyConfig(value) {
  if (!value || !Array.isArray(value.members)) return null;
  const seen = new Set();
  const members = value.members.filter((member) => member && String(member.name || "").trim()).map((member, index) => {
    let id = safeMemberId(member.id) || "person-" + (index + 1);
    while (seen.has(id) || id === "family" || id === "kids") id += "-member";
    seen.add(id);
    return {
      id,
      name: String(member.name).trim(),
      role: String(member.role || (member.adult ? "Parent / caregiver" : "Child")).trim(),
      adult: Boolean(member.adult),
      color: /^#[0-9a-f]{6}$/i.test(member.color || "") ? member.color : PROFILE_COLORS[index % PROFILE_COLORS.length],
    };
  });
  if (!members.length || !members.some((member) => member.adult)) return null;
  return { familyName: String(value.familyName || "My Family").trim() || "My Family", members };
}

const storedFamilyConfig = normalizeFamilyConfig(readStoredObject(FAMILY_CONFIG_KEY));
const detectedSetupMembers = storedFamilyConfig ? [] : findExistingMembers();
const SETUP_REQUIRED = !storedFamilyConfig;
const familyConfig = storedFamilyConfig || {
  familyName: "My Family",
  members: detectedSetupMembers.length ? detectedSetupMembers : [
    { id: "adult-1", name: "Adult", role: "Parent / caregiver", adult: true, color: PROFILE_COLORS[0] },
    { id: "child-1", name: "Child", role: "Child", adult: false, color: PROFILE_COLORS[1] },
  ],
};

function buildProfiles(config) {
  const children = config.members.filter((member) => !member.adult);
  const firstChild = children[0] && children[0].id;
  const profiles = {
    family: { name: config.familyName, shortRole: "Family view", avatar: "⌂", adult: false, rewardOwner: firstChild || null, color: "#14392f" },
  };
  config.members.forEach((member) => {
    profiles[member.id] = {
      name: member.name,
      shortRole: member.role + (member.adult ? " · Adult" : " · Child"),
      avatar: member.name.charAt(0).toUpperCase(),
      adult: member.adult,
      rewardOwner: member.adult ? firstChild || null : member.id,
      color: member.color,
    };
  });
  return profiles;
}

const PROFILES = buildProfiles(familyConfig);
const adultIds = () => Object.keys(PROFILES).filter((id) => id !== "family" && PROFILES[id].adult);
const childIds = () => Object.keys(PROFILES).filter((id) => id !== "family" && !PROFILES[id].adult);
const isChildProfile = (id) => childIds().includes(id);
const firstAdultId = () => adultIds()[0] || null;
const firstChildId = () => childIds()[0] || null;

const LANGUAGE_PACKS = window.HouseHelperLanguagePacks && Array.isArray(window.HouseHelperLanguagePacks.packs) ? window.HouseHelperLanguagePacks.packs : [];
const languagePackById = (id) => LANGUAGE_PACKS.find((pack) => pack.id === id) || LANGUAGE_PACKS[0];

const VIEWS = ["home", "chores", "habits", "lists", "rewards", "calendar", "art", "learning", "fun", "settings"];
const WIDGETS = [
  { id: "rewards", name: "Reward radar", icon: "★", detail: "Kid reward progress" },
  { id: "chores", name: "Today’s chores", icon: "✓", detail: "Assigned work and approvals" },
  { id: "habits", name: "Daily routines", icon: "↻", detail: "Healthy habits and streaks" },
  { id: "lists", name: "Family list", icon: "☰", detail: "Groceries and shared notes" },
  { id: "attention", name: "Reminders", icon: "!", detail: "Overdue and missed chores" },
  { id: "calendar", name: "Family schedule", icon: "□", detail: "Upcoming calendar items" },
  { id: "weather", name: "Local weather", icon: "☀", detail: "Current conditions and a three-day outlook" },
  { id: "timer", name: "Quick timer", icon: "◷", detail: "Shared live timer" },
  { id: "art", name: "Art show", icon: "✦", detail: "Family gallery" },
  { id: "learning", name: "Language league", icon: "文", detail: "Long-term learning leaderboard" },
];

const BASE_LAYOUT = [
  { id: "rewards", size: "half", visible: true },
  { id: "chores", size: "half", visible: true },
  { id: "habits", size: "half", visible: true },
  { id: "lists", size: "half", visible: true },
  { id: "attention", size: "compact", visible: true },
  { id: "calendar", size: "compact", visible: true },
  { id: "weather", size: "compact", visible: true },
  { id: "timer", size: "compact", visible: true },
  { id: "art", size: "half", visible: true },
  { id: "learning", size: "half", visible: true },
];

const DEFAULT_LAYOUTS = Object.fromEntries(Object.keys(PROFILES).map((id) => [id, clone(BASE_LAYOUT)]));

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
  return prefix + "-" + (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2));
}

const DEFAULT_CHORES = [];
const DEFAULT_REWARDS = Object.fromEntries(childIds().map((id) => [id, { points: 0, items: [] }]));

function normalizeRewardAccount(id, stored) {
  const base = clone(DEFAULT_REWARDS[id] || { points: 0, items: [] });
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
  return account;
}

const DEFAULT_ARTWORKS = [];
const DEFAULT_EVENTS = [];
const DEFAULT_HABITS = [];
const DEFAULT_LIST_ITEMS = [];
const DEFAULT_PROFILE_THEMES = Object.fromEntries(Object.entries(PROFILES).map(([id, profile]) => [id, { color: profile.color || "#14392f", font: "rounded", scale: "normal", decorations: true }]));

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
const initialWeatherSettings = normalizeSettings(readStoredObject("hh-weather-settings"), { location: null, units: "fahrenheit", lastUpdated: null, forecast: null });
const initialTimerSettings = normalizeSettings(readStoredObject("hh-timer"), { initialSeconds: 15 * 60, remainingSeconds: 15 * 60, running: false, endsAt: 0 });
const initialTimerRemaining = initialTimerSettings.running && Number(initialTimerSettings.endsAt) ? Math.max(0, Math.ceil((Number(initialTimerSettings.endsAt) - Date.now()) / 1000)) : Math.max(0, Number(initialTimerSettings.remainingSeconds) || 0);
const storedLearningSettings = readStoredObject("hh-learning-settings");
const storedLanguageView = readStoredObject("hh-language-view");
const initialLearningSettings = normalizeSettings(storedLearningSettings, { dailyGoal: 5, bonusEnabled: true, dailyBonus: 5 });
const initialLearningPack = languagePackById(storedLanguageView.selectedPack || storedLearningSettings.language || storedLearningSettings.selectedPack || "german");

const storedRewards = readStoredObject("hh-rewards");
const initialProfile = localStorage.getItem("hh-profile");
const initialView = location.hash.replace("#", "");

const state = {
  profile: PROFILES[initialProfile] ? initialProfile : "family",
  view: VIEWS.includes(initialView) ? initialView : "home",
  rewardOwner: firstChildId(),
  rewardDraftPoints: 0,
  rewards: Object.fromEntries(childIds().map((id) => [id, normalizeRewardAccount(id, storedRewards[id])])),
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
  pendingListItem: null,
  familyNote: localStorage.getItem("hh-family-note") || "",
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
  timerSeconds: initialTimerRemaining,
  timerInitial: Math.max(60, Number(initialTimerSettings.initialSeconds) || 15 * 60),
  timerRunning: Boolean(initialTimerSettings.running && initialTimerRemaining > 0),
  timerEndsAt: initialTimerSettings.running && initialTimerRemaining > 0 ? Number(initialTimerSettings.endsAt) : 0,
  timerId: null,
  activeChore: null,
  detailChoreId: null,
  detailUrls: [],
  reviewParentId: null,
  reviewColor: "#ef3f37",
  reviewDrawing: false,
  reviewLast: null,
  reviewBaseImage: null,
  reviewImageUrl: null,
  reviewEvidenceItems: [],
  reviewPhotoIndex: 0,
  reviewHasMarks: false,
  selectedPhotoFiles: [],
  idleDeadline: null,
  authContext: null,
  authParent: firstAdultId(),
  authConfirming: false,
  pendingPasscodeHash: null,
  passcodes: readStoredObject("hh-parent-passcodes"),
  paintColor: "#ef4444",
  paintErasing: false,
  paintDrawing: false,
  paintLast: null,
  setupEditing: SETUP_REQUIRED,
  languageSettings: initialLearningSettings,
  languageProgress: readStoredObject("hh-language-progress"),
  languageProfile: PROFILES[storedLanguageView.selectedLearner] && storedLanguageView.selectedLearner !== "family" ? storedLanguageView.selectedLearner : initialProfile && initialProfile !== "family" && PROFILES[initialProfile] ? initialProfile : familyConfig.members[0].id,
  languagePack: initialLearningPack ? initialLearningPack.id : "german",
  languageLevelFilter: ["all", "A1", "A2", "B1"].includes(storedLanguageView.selectedLevel) ? storedLanguageView.selectedLevel : "all",
  languageSession: null,
  weatherSettings: initialWeatherSettings,
  weatherDraft: null,
  weatherSearchResults: [],
  weatherLoading: false,
  layoutDrag: null,
  reactionGame: { status: "idle", startedAt: 0, timeoutId: null, best: readStoredNumber("hh-reaction-best", 0) },
  memoryGame: { cards: [], first: null, lock: false, moves: 0, matches: 0 },
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
  evidenceViewerDialog: $("#evidenceViewerDialog"),
  redoDialog: $("#redoDialog"),
  listIdentityDialog: $("#listIdentityDialog"),
  weatherDialog: $("#weatherDialog"),
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
  connectedDevicesDialog: $("#connectedDevicesDialog"),
  familySetupDialog: $("#familySetupDialog"),
  languageSessionDialog: $("#languageSessionDialog"),
  languageSettingsDialog: $("#languageSettingsDialog"),
  timerDisplay: $("#timerDisplay"),
  calmScreen: $("#calmScreen"),
  toast: $("#toast"),
};

let deviceNameDraftDirty = false;
let authSubmitting = false;

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
function persistTimer() { localStorage.setItem("hh-timer", JSON.stringify({ initialSeconds: state.timerInitial, remainingSeconds: state.timerSeconds, running: state.timerRunning, endsAt: state.timerEndsAt })); }
function profileName(id) { return PROFILES[id] ? PROFILES[id].name : nameFromId(id) || "Former member"; }
function allChores() { return DEFAULT_CHORES.concat(state.customChores).filter((chore) => !state.removedChoreIds.includes(chore.id)); }
function currentReward() { return state.rewards[state.rewardOwner] || { points: 0, items: [] }; }
function rewardOwnerName() { return PROFILES[state.rewardOwner] ? PROFILES[state.rewardOwner].name : "Rewards"; }

function optionMarkup(id, label) {
  return '<option value="' + escapeHtml(id) + '">' + escapeHtml(label) + '</option>';
}

function renderMemberControls() {
  const ids = Object.keys(PROFILES);
  $(".profile-grid").innerHTML = ids.map((id) => {
    const profile = PROFILES[id];
    return '<button class="profile-option ' + (id === "family" ? "family" : "") + '" style="--option-color:' + profile.color + '" data-profile="' + escapeHtml(id) + '" type="button"><span class="profile-option-avatar">' + escapeHtml(profile.avatar) + '</span><span><strong>' + escapeHtml(profile.name) + '</strong><small>' + escapeHtml(id === "family" ? "Shared dashboard" : profile.shortRole) + '</small></span><span class="selected-check">✓</span></button>';
  }).join("");

  $("#parentPicker").innerHTML = adultIds().map((id, index) => '<button class="' + (index === 0 ? "active" : "") + '" data-parent="' + escapeHtml(id) + '" type="button"><span>' + escapeHtml(PROFILES[id].avatar) + '</span>' + escapeHtml(PROFILES[id].name) + '</button>').join("");
  const memberOptions = familyConfig.members.map((member) => optionMarkup(member.id, member.name)).join("");
  const allOptions = optionMarkup("family", "Everyone") + memberOptions;
  $("#choreAssigneeInput").innerHTML = memberOptions;
  $("#habitPersonInput").innerHTML = memberOptions;
  $("#themeProfileInput").innerHTML = ids.map((id) => optionMarkup(id, id === "family" ? familyConfig.familyName + " (family view)" : PROFILES[id].name)).join("");
  $("#googleOwnerInput").innerHTML = allOptions;
  $("#eventPeopleInput").innerHTML = allOptions + (childIds().length > 1 ? optionMarkup("kids", "All children") : "");
  $("#languageLearnerSelect").innerHTML = memberOptions;
  $("#languagePackSelect").innerHTML = LANGUAGE_PACKS.map((pack) => optionMarkup(pack.id, pack.flag + " " + pack.name + " · " + pack.nativeName + " · " + allLanguageCards(pack).length + " cards")).join("");
  $("#choreFilters").innerHTML = '<button class="active" data-chore-filter="all" type="button">Everyone</button>' + familyConfig.members.map((member) => '<button data-chore-filter="' + escapeHtml(member.id) + '" type="button">' + escapeHtml(member.name) + '</button>').join("");
  $("#habitFilters").innerHTML = '<button class="active" data-habit-filter="all" type="button">Everyone</button>' + familyConfig.members.map((member) => '<button data-habit-filter="' + escapeHtml(member.id) + '" type="button">' + escapeHtml(member.name) + '</button>').join("");
  $(".reward-kid-tabs").innerHTML = childIds().map((id, index) => '<button class="' + (index === 0 ? "active" : "") + '" data-reward-owner="' + escapeHtml(id) + '" type="button">' + escapeHtml(PROFILES[id].name) + '</button>').join("");
  $("#familyMembersLabel").textContent = familyConfig.members.length + " member" + (familyConfig.members.length === 1 ? "" : "s") + " · names, roles, and colors";
}

function setupMemberMarkup(member, adult) {
  const color = member && member.color || PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)];
  return '<div class="member-editor" data-member-id="' + escapeHtml(member && member.id || "") + '" data-adult="' + String(adult) + '"><input class="member-name" maxlength="32" placeholder="Name" aria-label="Member name" value="' + escapeHtml(member && member.name || "") + '" required><input class="member-role" maxlength="32" placeholder="' + (adult ? "Parent, grandparent, caregiver…" : "Child, teen…") + '" aria-label="Role" value="' + escapeHtml(member && member.role || (adult ? "Parent / caregiver" : "Child")) + '"><label class="member-color"><span>Color</span><input type="color" value="' + color + '" aria-label="Profile color"></label><button class="member-remove" type="button" aria-label="Remove member">×</button></div>';
}

function addSetupMember(adult, member) {
  const target = adult ? $("#adultMemberEditors") : $("#childMemberEditors");
  target.insertAdjacentHTML("beforeend", setupMemberMarkup(member || null, adult));
  const input = target.lastElementChild && $(".member-name", target.lastElementChild);
  if (input && state.setupEditing && !SETUP_REQUIRED) input.focus();
}

function openFamilySetup() {
  state.setupEditing = true;
  elements.familySetupDialog.dataset.firstRun = String(SETUP_REQUIRED);
  $("#familySetupTitle").textContent = SETUP_REQUIRED ? "Set up your household" : "Edit household members";
  $("#familySetupIntro").textContent = SETUP_REQUIRED && detectedSetupMembers.some((member) => member.name) ? "We found profiles from an earlier version on this device. Review these suggestions and add anyone missing; existing saved household content will be kept." : SETUP_REQUIRED ? "Create an adult profile for each parent, grandparent, or caregiver and a child profile for every child. Your dashboard will begin completely blank." : "Update names, roles, colors, or add new household members. Saved history remains on this device.";
  $("#closeFamilySetupButton").hidden = SETUP_REQUIRED;
  $("#familySetupError").textContent = "";
  $("#familyNameInput").value = storedFamilyConfig ? familyConfig.familyName : "";
  $("#adultMemberEditors").innerHTML = "";
  $("#childMemberEditors").innerHTML = "";
  const seed = storedFamilyConfig ? familyConfig.members : detectedSetupMembers;
  const adults = seed.filter((member) => member.adult);
  const children = seed.filter((member) => !member.adult);
  (adults.length ? adults : [null]).forEach((member) => addSetupMember(true, member));
  (children.length ? children : [null]).forEach((member) => addSetupMember(false, member));
  if (!elements.familySetupDialog.open) elements.familySetupDialog.showModal();
  setTimeout(() => $("#familyNameInput").focus(), 0);
}

function saveFamilySetup() {
  const rows = $$(".member-editor", elements.familySetupDialog);
  const usedIds = new Set(["family", "kids"]);
  const members = rows.map((row, index) => {
    const name = $(".member-name", row).value.trim();
    if (!name) return null;
    let id = safeMemberId(row.dataset.memberId) || safeMemberId(name) || "person-" + (index + 1);
    while (usedIds.has(id)) id += "-" + (index + 1);
    usedIds.add(id);
    return {
      id,
      name,
      role: $(".member-role", row).value.trim() || (row.dataset.adult === "true" ? "Parent / caregiver" : "Child"),
      adult: row.dataset.adult === "true",
      color: $('input[type="color"]', row).value,
    };
  }).filter(Boolean);
  if (!members.some((member) => member.adult)) {
    $("#familySetupError").textContent = "Add at least one adult or caregiver profile.";
    return;
  }
  const config = normalizeFamilyConfig({ familyName: $("#familyNameInput").value.trim(), members });
  if (!config) {
    $("#familySetupError").textContent = "Add a household name and at least one adult.";
    return;
  }
  localStorage.setItem(FAMILY_CONFIG_KEY, JSON.stringify(config));
  showToast("Household saved");
  setTimeout(() => location.reload(), 400);
}
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
  const meta = [showPerson ? profileName(chore.person) : null, chore.area, chore.points ? "+" + chore.points + " points" : null, repeatLabel(chore), due].filter(Boolean).join(" · ");
  let action = "";
  if (status === "ready" || status === "in-progress") {
    const actionName = status === "in-progress" ? "Finish" : "Start";
    action = '<button class="chore-action" type="button" aria-label="' + actionName + " " + escapeHtml(chore.title) + '"><svg><use href="#icon-camera"></use></svg><span>' + actionName + "</span></button>";
  } else if (status === "pending") {
    action = '<span class="status-stack"><span class="status-badge pending">' + (canReviewFromCurrentView() ? "Review photos" : "Waiting for an adult") + "</span></span>";
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
  $("#choreList").innerHTML = chores.length ? chores.map((chore) => choreMarkup(chore, state.profile === "family" || PROFILES[state.profile].adult)).join("") : '<div class="empty-state compact"><strong>No chores for today</strong><span>An adult can add the first chore from the Chores page.</span></div>';
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
  const filtered = filteredFullChores();
  $("#fullChoreList").innerHTML = filtered.length ? filtered.map((chore) => choreMarkup(chore, true, true)).join("") : '<div class="empty-state"><strong>No chores yet</strong><span>Use “Add chore” to create the first one.</span></div>';
  $$("[data-chore-filter]").forEach((button) => button.classList.toggle("active", button.dataset.choreFilter === state.choreFilter));
  const warnings = allChores().filter((chore) => warningFor(chore));
  $("#warningTitle").textContent = warnings.length + " " + (warnings.length === 1 ? "chore needs" : "chores need") + " attention";
  $("#warningSummary").textContent = warnings.length ? warnings.map((chore) => profileName(chore.person) + ": " + warningFor(chore).toLowerCase()).join(" · ") : "Everything is currently on track.";
  $("#warningPanel").hidden = warnings.length === 0;
  const pending = allChores().filter((chore) => choreStatus(chore) === "pending");
  $("#reviewQueuePanel").hidden = !canReviewFromCurrentView() || pending.length === 0;
  $("#reviewQueueTitle").textContent = pending.length + " " + (pending.length === 1 ? "chore is" : "chores are") + " ready to review";
  $("#reviewQueueSummary").textContent = pending.map((chore) => profileName(chore.person) + ": " + chore.title).join(" · ");
}

function renderAttention() {
  const visibleWarnings = PROFILES[state.profile].adult || state.profile === "family" ? allChores() : allChores().filter((chore) => chore.person === state.profile);
  const items = visibleWarnings.filter((chore) => warningFor(chore)).slice(0, 3).map((chore) => ({
    icon: "!",
    title: chore.title,
    detail: profileName(chore.person) + " · " + warningFor(chore),
  }));
  if (PROFILES[state.profile].adult) {
    state.rewardClaims.filter((claim) => !claim.acknowledged).slice(0, 2).forEach((claim) => items.unshift({
      icon: "★",
      title: profileName(claim.childId) + " claimed " + claim.rewardName,
      detail: "Open Rewards to acknowledge or schedule it",
    }));
  }
  $("#attentionTitle").textContent = isChildProfile(state.profile) ? "Your reminders" : "Household reminders";
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
  if (!state.rewardOwner || !state.rewards[state.rewardOwner]) {
    $("#rewardTitle").textContent = "Reward shop";
    $("#pointCount").textContent = "0";
    $("#dialogPoints").textContent = "0";
    $("#homeRewardChoices").innerHTML = '<div class="empty-state compact"><strong>No child profiles yet</strong><span>Add a child in Household members to create a reward wallet.</span></div>';
    $("#encouragement").textContent = "Each child gets a private, non-expiring points wallet.";
    $("#manageRewardsButton").disabled = true;
    renderRewardOverview();
    renderClaimNotices();
    return;
  }
  $("#manageRewardsButton").disabled = false;
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
  }).join("") || '<div class="empty-state compact"><strong>No rewards yet</strong><span>An adult can add this child’s first reward.</span></div>';
  $("#encouragement").textContent = canClaim ? "Tap a reward to buy it. Your points only change after the second confirmation." : "Points are saved until they are spent and never expire.";
  $$("[data-reward-owner]").forEach((button) => button.classList.toggle("active", button.dataset.rewardOwner === state.rewardOwner));
  renderRewardOverview();
  renderClaimNotices();
}

function renderRewardOverview() {
  const owners = isChildProfile(state.profile) ? [state.profile] : childIds();
  if (!owners.length) {
    $("#rewardOverview").innerHTML = '<div class="empty-state"><strong>No reward wallets yet</strong><span>Add a child profile in Settings to begin.</span></div>';
    return;
  }
  $("#rewardOverview").innerHTML = owners.map((id) => {
    const account = state.rewards[id];
    const canClaim = state.profile === id;
    const choices = account.items.map((item) => {
      const affordable = account.points >= item.cost;
      return '<button class="reward-choice ' + (affordable ? "affordable" : "") + '" data-claim-owner="' + id + '" data-claim-reward="' + item.id + '" type="button" ' + (canClaim ? "" : "disabled") + '><span>' + escapeHtml(item.emoji) + '</span><span><strong>' + escapeHtml(item.name) + "</strong><small>" + (affordable ? "Ready to claim" : item.cost - account.points + " more points") + "</small></span><b>" + item.cost + " pts</b></button>";
    }).join("");
    return '<article class="reward-person-card" style="--person-color:' + PROFILES[id].color + ';--person-accent:' + PROFILES[id].color + '44"><header><p class="eyebrow">' + escapeHtml(PROFILES[id].name) + '’s reward shop</p><span>' + PROFILES[id].avatar + '</span></header><div class="reward-card-top"><strong>' + account.points + '</strong><span>available points</span></div><div class="reward-choice-list">' + (choices || '<div class="empty-state compact"><strong>No rewards yet</strong><span>An adult can add reward choices here.</span></div>') + '</div><footer><span>' + (canClaim ? "Tap a reward to buy it" : account.items.length + " reward choices") + '</span>' + (PROFILES[state.profile].adult ? '<button data-manage-reward="' + id + '" type="button">Manage</button>' : "") + "</footer></article>";
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
  panel.innerHTML = "<strong>New reward claims</strong><div class=\"claim-notice-list\">" + claims.map((claim) => '<div class="claim-notice"><span><strong>' + escapeHtml(profileName(claim.childId)) + " claimed " + escapeHtml(claim.rewardName) + "</strong><small>" + new Date(claim.createdAt).toLocaleString() + (claim.scheduledEventId ? " · Scheduled" : "") + '</small></span><div>' + (!claim.scheduledEventId ? '<button data-schedule-claim="' + claim.id + '" type="button">Schedule</button>' : "") + '<button data-ack-claim="' + claim.id + '" type="button">Acknowledge</button></div></div>').join("") + "</div>";
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
  if (value === "kids") return childIds().length ? childIds().map(profileName).join(" & ") : "Children";
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

function widgetDragCandidate(target) {
  if (state.view !== "home" || target.closest("button,input,select,textarea,a,label,[contenteditable='true']")) return null;
  return target.closest('.dashboard-grid .card[data-widget]');
}

function beginWidgetHold(card, x, y, inputType) {
  if (!card) return;
  clearTimeout(state.layoutDrag?.timer);
  const drag = { card, id: card.dataset.widget, startX: x, startY: y, x, y, inputType, active: false, layout: profileLayout(state.profile), timer: null };
  drag.timer = setTimeout(() => {
    if (state.layoutDrag !== drag) return;
    drag.active = true;
    card.classList.add("widget-dragging");
    document.body.classList.add("widget-drag-active");
    try { if (navigator.vibrate) navigator.vibrate(35); } catch {}
    showToast("Move the widget, then let go to save its position");
  }, 480);
  card.classList.add("widget-holding");
  state.layoutDrag = drag;
}

function moveWidgetDrag(x, y) {
  const drag = state.layoutDrag;
  if (!drag) return;
  drag.x = x;
  drag.y = y;
  if (!drag.active) {
    if (Math.hypot(x - drag.startX, y - drag.startY) > 12) {
      clearTimeout(drag.timer);
      drag.card.classList.remove("widget-holding");
      state.layoutDrag = null;
    }
    return;
  }
  drag.card.style.pointerEvents = "none";
  const target = document.elementFromPoint(x, y)?.closest('.dashboard-grid .card[data-widget]');
  drag.card.style.pointerEvents = "";
  if (!target || target === drag.card) return;
  const from = drag.layout.findIndex((item) => item.id === drag.id);
  const to = drag.layout.findIndex((item) => item.id === target.dataset.widget);
  if (from < 0 || to < 0 || from === to) return;
  const [moved] = drag.layout.splice(from, 1);
  drag.layout.splice(to, 0, moved);
  drag.layout.forEach((item, index) => {
    const widget = $('[data-widget="' + item.id + '"]');
    if (widget) widget.style.order = index + 1;
  });
  target.classList.add("widget-drop-target");
  setTimeout(() => target.classList.remove("widget-drop-target"), 180);
}

function finishWidgetDrag(save) {
  const drag = state.layoutDrag;
  if (!drag) return;
  clearTimeout(drag.timer);
  drag.card.classList.remove("widget-holding", "widget-dragging");
  document.body.classList.remove("widget-drag-active");
  state.layoutDrag = null;
  if (drag.active && save) {
    state.layouts[state.profile] = clone(drag.layout);
    localStorage.setItem("hh-layouts", JSON.stringify(state.layouts));
    state.suppressWidgetClickUntil = Date.now() + 350;
    applyHomeLayout();
    logActivity("Moved the " + (WIDGETS.find((widget) => widget.id === drag.id)?.name || "Home") + " widget", "↕", "settings");
    showToast("Widget position saved for " + PROFILES[state.profile].name);
  } else {
    applyHomeLayout();
  }
}

function setupWidgetDragging() {
  const grid = $(".dashboard-grid");
  grid.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) return;
    const card = widgetDragCandidate(event.target);
    if (!card) return;
    const touch = event.touches[0];
    beginWidgetHold(card, touch.clientX, touch.clientY, "touch");
  }, { passive: true });
  grid.addEventListener("touchmove", (event) => {
    if (!state.layoutDrag || state.layoutDrag.inputType !== "touch" || !event.touches.length) return;
    const touch = event.touches[0];
    moveWidgetDrag(touch.clientX, touch.clientY);
    if (state.layoutDrag?.active) event.preventDefault();
  }, { passive: false });
  grid.addEventListener("touchend", () => finishWidgetDrag(true), { passive: true });
  grid.addEventListener("touchcancel", () => finishWidgetDrag(false), { passive: true });
  grid.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch" || event.button !== 0) return;
    const card = widgetDragCandidate(event.target);
    if (card) beginWidgetHold(card, event.clientX, event.clientY, "pointer");
  });
  document.addEventListener("pointermove", (event) => {
    if (state.layoutDrag?.inputType === "pointer") moveWidgetDrag(event.clientX, event.clientY);
  });
  document.addEventListener("pointerup", () => {
    if (state.layoutDrag?.inputType === "pointer") finishWidgetDrag(true);
  });
  grid.addEventListener("click", (event) => {
    if (Date.now() < Number(state.suppressWidgetClickUntil || 0)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
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
  if (isChildProfile(state.profile)) habits = habits.filter((habit) => habit.person === state.profile);
  else if (!fullBoard && state.profile !== "family") habits = habits.filter((habit) => habit.person === state.profile);
  if (fullBoard && state.habitFilter !== "all") habits = habits.filter((habit) => habit.person === state.habitFilter);
  return habits;
}

function habitMarkup(habit, fullBoard) {
  const done = habitDoneToday(habit);
  const streak = habitStreak(habit);
  const canDelete = fullBoard && (PROFILES[state.profile].adult || state.profile === "family");
  return '<article class="habit-row' + (done ? " done" : "") + '" data-habit-id="' + habit.id + '"><button class="habit-check" data-toggle-habit="' + habit.id + '" type="button" aria-label="' + (done ? "Undo " : "Complete ") + escapeHtml(habit.name) + '">' + (done ? '<svg><use href="#icon-check"></use></svg>' : "") + '</button><span class="habit-icon">' + escapeHtml(habit.icon) + '</span><span class="habit-copy"><strong>' + escapeHtml(habit.name) + '</strong><small>' + escapeHtml(profileName(habit.person) + " · " + (habit.schedule === "daily" ? "Every day" : habit.schedule === "weekdays" ? "Weekdays" : "Weekends") + (habit.time ? " · " + formatTime(habit.time) : "")) + '</small></span><span class="habit-streak"><b>' + streak + '</b><small>day streak</small></span>' + (canDelete ? '<button class="row-delete" data-delete-habit="' + habit.id + '" type="button" aria-label="Delete ' + escapeHtml(habit.name) + '">×</button>' : "") + '</article>';
}

function renderHabits() {
  const homeHabits = visibleHabits(false);
  const completed = homeHabits.filter(habitDoneToday).length;
  $("#habitSummary").textContent = completed + " / " + homeHabits.length;
  $("#homeHabitList").innerHTML = homeHabits.length ? homeHabits.slice(0, 4).map((habit) => habitMarkup(habit, false)).join("") : '<div class="empty-state compact"><strong>No routines due today</strong><span>Nothing is scheduled.</span></div>';
  const fullHabits = visibleHabits(true);
  $("#habitBoard").innerHTML = fullHabits.length ? fullHabits.map((habit) => habitMarkup(habit, true)).join("") : '<div class="empty-state"><strong>No habits here yet</strong><span>Tap “Add habit” to create one.</span></div>';
  $$('[data-habit-filter]').forEach((button) => {
    button.classList.toggle("active", button.dataset.habitFilter === state.habitFilter);
    button.hidden = isChildProfile(state.profile) && button.dataset.habitFilter !== state.profile;
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
  const sync = window.HouseHelperSync && window.HouseHelperSync.status;
  let label = online ? "Online" : "Offline · changes saved";
  let offline = !online;
  if (sync && sync.enabled) {
    label = sync.connected ? "Household connected · " + Math.max(1, sync.clients.length) + " device" + (sync.clients.length === 1 ? "" : "s") : "Host unavailable · changes saved";
    offline = !sync.connected;
  }
  $("#connectionLabel").textContent = label;
  $("#connectionStatus").classList.toggle("offline", offline);
}

function persistWeatherSettings() {
  localStorage.setItem("hh-weather-settings", JSON.stringify(state.weatherSettings));
}

function weatherDescription(code) {
  if (code === 0) return "Clear sky";
  if ([1, 2].includes(code)) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorms";
  return "Changing conditions";
}

function weatherIcon(code, isDay) {
  if (code === 0) return isDay === 0 ? "🌙" : "☀️";
  if ([1, 2].includes(code)) return isDay === 0 ? "☁️" : "🌤️";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌦️";
}

function renderWeather() {
  const settings = state.weatherSettings;
  const location = settings.location;
  const forecast = settings.forecast;
  if (!location) {
    $("#weatherContent").innerHTML = '<button class="weather-empty" data-open-weather type="button"><span>🌤️</span><strong>Add your town</strong><small>Use device location or search by city.</small></button>';
    $("#weatherAttribution").textContent = "Weather data appears when connected.";
    return;
  }
  if (!forecast) {
    $("#weatherContent").innerHTML = '<button class="weather-empty" data-refresh-weather type="button"><span>' + (state.weatherLoading ? "↻" : "🌦️") + '</span><strong>' + (state.weatherLoading ? "Loading forecast…" : escapeHtml(location.name)) + '</strong><small>' + (state.weatherLoading ? "Contacting the weather service" : "Tap to try the forecast again") + '</small></button>';
    $("#weatherAttribution").textContent = "Weather by Open-Meteo";
    return;
  }
  const unit = forecast.unit || (settings.units === "celsius" ? "°C" : "°F");
  const days = Array.isArray(forecast.days) ? forecast.days.slice(0, 3) : [];
  $("#weatherContent").innerHTML = '<div class="weather-now"><span>' + weatherIcon(forecast.code, forecast.isDay) + '</span><div><strong>' + Math.round(forecast.temperature) + unit + '</strong><small>' + escapeHtml(weatherDescription(forecast.code)) + ' · feels ' + Math.round(forecast.apparent) + unit + '</small></div></div><div class="weather-place"><strong>' + escapeHtml(location.name) + '</strong><button data-refresh-weather type="button">' + (state.weatherLoading ? "Refreshing…" : "Refresh") + '</button></div><div class="weather-days">' + days.map((day, index) => '<div><span>' + (index === 0 ? "Today" : new Date(day.date + "T12:00:00").toLocaleDateString([], { weekday: "short" })) + '</span><b>' + weatherIcon(day.code, 1) + '</b><small>' + Math.round(day.high) + '° / ' + Math.round(day.low) + '°</small><em>' + Math.round(day.rain || 0) + '% rain</em></div>').join("") + '</div>';
  const updated = settings.lastUpdated ? new Date(settings.lastUpdated).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "recently";
  $("#weatherAttribution").textContent = "Weather by Open-Meteo. Updated " + updated + (navigator.onLine ? "" : ". Offline copy");
}

async function fetchWeather(options) {
  options = options || {};
  const settings = state.weatherSettings;
  if (!settings.location || state.weatherLoading) return;
  state.weatherLoading = true;
  renderWeather();
  const location = settings.location;
  const query = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    temperature_unit: settings.units === "celsius" ? "celsius" : "fahrenheit",
    wind_speed_unit: settings.units === "celsius" ? "kmh" : "mph",
    timezone: "auto",
    forecast_days: "3",
  });
  try {
    const response = await fetch("https://api.open-meteo.com/v1/forecast?" + query);
    if (!response.ok) throw new Error("Forecast service returned " + response.status);
    const payload = await response.json();
    settings.forecast = {
      temperature: Number(payload.current.temperature_2m),
      apparent: Number(payload.current.apparent_temperature),
      code: Number(payload.current.weather_code),
      isDay: Number(payload.current.is_day),
      wind: Number(payload.current.wind_speed_10m),
      unit: payload.current_units.temperature_2m,
      days: (payload.daily.time || []).map((date, index) => ({ date, code: Number(payload.daily.weather_code[index]), high: Number(payload.daily.temperature_2m_max[index]), low: Number(payload.daily.temperature_2m_min[index]), rain: Number(payload.daily.precipitation_probability_max[index] || 0) })),
    };
    settings.lastUpdated = new Date().toISOString();
    persistWeatherSettings();
    if (!options.silent) showToast("Local weather updated");
  } catch {
    if (!options.silent) showToast(settings.forecast ? "Could not refresh. Showing the saved forecast." : "Weather is unavailable right now");
  } finally {
    state.weatherLoading = false;
    renderWeather();
  }
}

function openWeatherSettings() {
  state.weatherDraft = state.weatherSettings.location ? { ...state.weatherSettings.location } : null;
  $("#weatherLocationInput").value = state.weatherSettings.location?.name || "";
  $("#weatherUnitInput").value = state.weatherSettings.units === "celsius" ? "celsius" : "fahrenheit";
  $("#weatherSearchResults").innerHTML = state.weatherDraft ? '<button class="selected" data-weather-result="current" type="button"><strong>' + escapeHtml(state.weatherDraft.name) + '</strong><small>Current household location</small></button>' : "";
  $("#saveWeatherLocationButton").disabled = !state.weatherDraft;
  $("#removeWeatherLocationButton").hidden = !state.weatherSettings.location;
  elements.weatherDialog.showModal();
}

async function searchWeatherLocations(term) {
  const clean = term.trim();
  if (clean.length < 2) return showToast("Enter at least two letters or a postal code");
  $("#weatherSearchResults").innerHTML = '<div class="weather-search-status">Searching…</div>';
  try {
    const response = await fetch("https://geocoding-api.open-meteo.com/v1/search?" + new URLSearchParams({ name: clean, count: "6", language: "en", format: "json" }));
    if (!response.ok) throw new Error("Search failed");
    const payload = await response.json();
    const results = (Array.isArray(payload.results) ? payload.results : []).filter((result) => Number.isFinite(Number(result.latitude)) && Number.isFinite(Number(result.longitude))).slice(0, 6);
    state.weatherSearchResults = results.map((result) => ({ name: [result.name, result.admin1, result.country_code].filter(Boolean).join(", "), latitude: Number(result.latitude), longitude: Number(result.longitude) }));
    $("#weatherSearchResults").innerHTML = results.length ? results.map((result, index) => '<button data-weather-result="' + index + '" type="button"><strong>' + escapeHtml(result.name) + '</strong><small>' + escapeHtml([result.admin1, result.country].filter(Boolean).join(", ")) + '</small></button>').join("") : '<div class="weather-search-status">No matching places found.</div>';
  } catch {
    state.weatherSearchResults = [];
    $("#weatherSearchResults").innerHTML = '<div class="weather-search-status">Location search is unavailable. Check the connection and try again.</div>';
  }
}

function chooseDeviceWeatherLocation() {
  if (!navigator.geolocation) return showToast("Location is not available on this device");
  const button = $("#useDeviceLocationButton");
  button.disabled = true;
  button.querySelector("strong").textContent = "Finding this device…";
  navigator.geolocation.getCurrentPosition((position) => {
    state.weatherDraft = { name: "Current location", latitude: Number(position.coords.latitude.toFixed(3)), longitude: Number(position.coords.longitude.toFixed(3)) };
    $("#weatherSearchResults").innerHTML = '<button class="selected" data-weather-result="current" type="button"><strong>Current location</strong><small>Coordinates received from this device</small></button>';
    $("#saveWeatherLocationButton").disabled = false;
    button.disabled = false;
    button.querySelector("strong").textContent = "Use this device’s location";
  }, () => {
    button.disabled = false;
    button.querySelector("strong").textContent = "Use this device’s location";
    showToast("Location permission was not available. Search by city instead.");
  }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 3600000 });
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
  $("#languageSettingsLabel").textContent = (Number(state.languageSettings.dailyGoal) || 5) + " unique cards daily · " + (state.languageSettings.bonusEnabled && Number(state.languageSettings.dailyBonus) > 0 ? "+" + Number(state.languageSettings.dailyBonus) + " child points" : "reward bonus off");
  renderConnectedDevices();
}

function localBuildVersion() {
  let localVersion = APP_VERSION;
  try { localVersion = window.HouseHelperNative && window.HouseHelperNative.getVersion ? window.HouseHelperNative.getVersion() : APP_VERSION; } catch {}
  return localVersion;
}

function renderConnectedDevices(providedStatus) {
  const sync = providedStatus || window.HouseHelperSync && window.HouseHelperSync.status;
  const label = $("#connectedDevicesLabel");
  const localVersion = localBuildVersion();
  $("#deviceBuildLabel").textContent = sync && sync.hostVersion && sync.hostVersion !== APP_VERSION ? localVersion + " · host " + sync.hostVersion : localVersion;
  $("#deviceRoleLabel").textContent = !sync || !sync.enabled ? "Standalone" : sync.role === "host" ? "Kitchen host" : "Secondary";
  $("#deviceSyncLabel").textContent = !sync || !sync.connected ? "Not connected" : sync.lastSync ? new Date(sync.lastSync).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }) : "Connecting…";
  const nameInput = $("#connectedDeviceName");
  if (document.activeElement !== nameInput && !deviceNameDraftDirty) nameInput.value = sync && sync.deviceName || localStorage.getItem("hs-device-name") || "Family device";
  if (!sync || !sync.enabled) {
    label.textContent = "Standalone on this device";
    $("#deviceHostTitle").textContent = "Standalone on this device";
    $("#deviceHostCopy").textContent = "This browser is using its own private copy of the household data.";
    $("#deviceHostStatus").classList.remove("connected", "offline");
    $("#pairingCard").hidden = true;
    $("#disconnectDeviceButton").hidden = true;
    $("#connectedDeviceList").innerHTML = "";
    $("#deviceConnectionHelp").textContent = "The website cannot become a Wi-Fi host by itself. The kitchen tablet’s Android app runs the household service.";
    return;
  }
  const count = Math.max(1, sync.clients.length);
  label.textContent = sync.connected ? (sync.role === "host" ? "Kitchen tablet hosting · " : "Connected to kitchen tablet · ") + count + " online" : "Kitchen tablet is unavailable";
  $("#deviceHostTitle").textContent = sync.connected ? (sync.role === "host" ? "This is the household host" : "Connected to the kitchen tablet") : "Waiting for the kitchen tablet";
  $("#deviceHostCopy").textContent = sync.connected ? "Household changes are saved by the host and shared with connected devices." : (sync.error || "Changes remain on this device until the host returns.");
  $("#deviceHostStatus").classList.toggle("connected", sync.connected);
  $("#deviceHostStatus").classList.toggle("offline", !sync.connected);
  $("#pairingCard").hidden = sync.role !== "host" || !sync.inviteUrl;
  $("#pairingAddress").textContent = sync.inviteUrl || "";
  if (sync.role === "host" && sync.inviteUrl && window.HouseHelperQR) {
    try {
      window.HouseHelperQR.toCanvas($("#pairingQrCode"), sync.inviteUrl);
      $("#pairingQrCode").hidden = false;
    } catch {
      $("#pairingQrCode").hidden = true;
    }
  }
  $("#disconnectDeviceButton").hidden = sync.role === "host";
  const versionMismatch = sync.hostVersion && sync.hostVersion !== APP_VERSION;
  $("#deviceConnectionHelp").textContent = versionMismatch ? "This device has an older dashboard open. Close this tab, reopen the tablet’s pairing address, then check that both build numbers match." : sync.role === "host" ? "Keep the kitchen tablet connected to your private home Wi-Fi. Secondary devices can reconnect with the same pairing address." : "If the tablet sleeps, restarts, or leaves Wi-Fi, edits stay cached here and resume syncing when it returns.";
  $("#connectedDeviceList").innerHTML = sync.clients.length ? '<p class="device-list-title">Online now</p>' + sync.clients.map((device) => '<article><span>●</span><div><strong>' + escapeHtml(device.name || "Family device") + '</strong><small>' + (device.id === sync.deviceId ? "This device" : "Synced moments ago") + '</small></div></article>').join("") : '<div class="empty-state compact"><strong>No secondary devices online</strong><span>Open the pairing address on another device.</span></div>';
}

function openConnectedDevices() {
  deviceNameDraftDirty = false;
  renderConnectedDevices();
  elements.connectedDevicesDialog.showModal();
}

function saveConnectedDeviceName() {
  const input = $("#connectedDeviceName");
  const clean = input.value.trim().slice(0, 50);
  if (!clean) {
    showToast("Enter a name for this device");
    input.focus();
    return false;
  }
  if (window.HouseHelperSync) window.HouseHelperSync.rename(clean);
  input.value = clean;
  deviceNameDraftDirty = false;
  renderConnectedDevices();
  showToast("Device name saved as " + clean);
  return true;
}

function toggleHabit(habitId) {
  const habit = state.habits.find((item) => item.id === habitId);
  if (!habit) return;
  if (isChildProfile(state.profile) && habit.person !== state.profile) return;
  const today = datePlus(0);
  const dates = habitDates(habitId).slice();
  const index = dates.indexOf(today);
  if (index >= 0) dates.splice(index, 1);
  else dates.push(today);
  state.habitCompletions[habitId] = dates.slice(-400);
  persistHabitCompletions();
  logActivity((index >= 0 ? "Unchecked " : "Completed ") + habit.name + " for " + profileName(habit.person), habit.icon);
  renderHabits();
  showToast(index >= 0 ? "Habit reopened" : "Habit complete");
}

function addListItem(text, category, addedBy) {
  const cleanText = text.trim();
  if (!cleanText) return;
  const personId = PROFILES[addedBy] && addedBy !== "family" ? addedBy : state.profile;
  if (!PROFILES[personId] || personId === "family") return;
  state.listItems.unshift({ id: makeId("list"), text: cleanText, category: category || "groceries", completed: false, addedBy: personId, createdAt: new Date().toISOString() });
  persistListItems();
  logActivity(profileName(personId) + " added “" + cleanText + "” to the family list", "☰", "lists");
  renderLists();
  showToast("Added by " + profileName(personId));
}

function resetPendingListForm() {
  if (!state.pendingListItem) return;
  const form = $("#" + state.pendingListItem.formId);
  if (form) form.reset();
}

function finishPendingListItem(personId) {
  const pending = state.pendingListItem;
  if (!pending) return;
  addListItem(pending.text, pending.category, personId);
  resetPendingListForm();
  state.pendingListItem = null;
}

function requestListItem(text, category, formId) {
  const cleanText = text.trim();
  if (!cleanText) return;
  if (state.profile !== "family") {
    addListItem(cleanText, category, state.profile);
    const form = $("#" + formId);
    if (form) form.reset();
    return;
  }
  state.pendingListItem = { text: cleanText, category: category || "groceries", formId };
  $("#listIdentityPicker").innerHTML = familyConfig.members.map((member) => '<button data-list-identity="' + escapeHtml(member.id) + '" type="button" style="--identity-color:' + member.color + '"><span>' + escapeHtml(member.name.charAt(0).toUpperCase()) + '</span><span><strong>' + escapeHtml(member.name) + '</strong><small>' + escapeHtml(member.role) + (member.adult ? " · passcode required" : "") + '</small></span></button>').join("");
  elements.listIdentityDialog.showModal();
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

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function exportEvidenceMedia() {
  const db = await openEvidenceDb();
  const records = await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readonly");
    const store = tx.objectStore("photos");
    const keysRequest = store.getAllKeys();
    const valuesRequest = store.getAll();
    tx.oncomplete = () => resolve((keysRequest.result || []).map((key, index) => ({ key: String(key), blob: valuesRequest.result[index] })));
    tx.onerror = () => reject(tx.error);
  });
  const byKey = new Map(records.filter((record) => record.blob).map((record) => [record.key, record.blob]));
  if (window.HouseHelperSync && window.HouseHelperSync.listMediaKeys) {
    const remoteKeys = await window.HouseHelperSync.listMediaKeys();
    for (const key of remoteKeys) if (!byKey.has(key)) {
      const remote = await window.HouseHelperSync.getMedia(key);
      if (remote) byKey.set(key, remote);
    }
  }
  return Promise.all([...byKey].map(async ([key, blob]) => ({ key, dataUrl: await blobToDataUrl(blob) })));
}

async function downloadBackup() {
  const data = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith("hh-")) data[key] = localStorage.getItem(key);
  }
  showToast("Preparing household data and photos…");
  let media = [];
  try { media = await exportEvidenceMedia(); } catch {}
  const payload = { product: "HouseHelper", version: 2, exportedAt: new Date().toISOString(), data: data, media: media };
  const serialized = JSON.stringify(payload, null, 2);
  const filename = "househelper-backup-" + datePlus(0) + ".json";
  if (window.HouseHelperNative && typeof window.HouseHelperNative.saveTextFile === "function") {
    window.HouseHelperNative.saveTextFile(serialized, filename, "application/json");
    logActivity("Downloaded a HouseHelper backup", "⇩");
    showToast("Choose where to save the complete backup");
    return;
  }
  const blob = new Blob([serialized], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  logActivity("Downloaded a HouseHelper backup", "⇩");
  showToast("Complete backup downloaded · " + media.length + " saved photo" + (media.length === 1 ? "" : "s"));
}

async function restoreBackup(file) {
  try {
    const payload = JSON.parse(await file.text());
    if (!payload || payload.product !== "HouseHelper" || !payload.data || typeof payload.data !== "object") throw new Error("Invalid backup");
    Object.entries(payload.data).forEach(([key, value]) => {
      if (key.startsWith("hh-") && typeof value === "string") localStorage.setItem(key, value);
    });
    if (Array.isArray(payload.media)) {
      for (const record of payload.media) {
        if (!record || typeof record.key !== "string" || typeof record.dataUrl !== "string" || !record.dataUrl.startsWith("data:")) continue;
        const blob = await (await fetch(record.dataUrl)).blob();
        await saveEvidence(record.key, blob);
      }
    }
    showToast("Backup restored · reloading HouseHelper");
    setTimeout(() => location.reload(), 600);
  } catch {
    showToast("That file is not a valid HouseHelper backup");
  }
}

const RETENTION_INTERVALS = [0, 1, 3, 7, 14, 30, 60];

function addDaysToKey(key, days) {
  const value = parseDateKey(key);
  value.setDate(value.getDate() + days);
  return dateKey(value);
}

function daysBetween(first, second) {
  return Math.floor((parseDateKey(second) - parseDateKey(first)) / 86400000);
}

function allLanguageCards(pack) {
  return pack.modules.flatMap((module) => module.cards.map((card) => ({
    ...card,
    moduleId: module.id,
    moduleTitle: module.title,
    level: card.level || module.level || "A1",
    kind: card.kind || module.kind || "foundations",
  })));
}

function languagePersonProgress(personId) {
  if (!state.languageProgress[personId] || typeof state.languageProgress[personId] !== "object") state.languageProgress[personId] = {};
  const person = state.languageProgress[personId];
  if (!Number.isFinite(Number(person.xp))) person.xp = 0;
  if (!person.languages || typeof person.languages !== "object") person.languages = {};
  if (!person.daily || typeof person.daily !== "object") person.daily = {};
  return person;
}

function languageCourseProgress(personId, packId) {
  const person = languagePersonProgress(personId);
  if (!person.languages[packId] || typeof person.languages[packId] !== "object") person.languages[packId] = { cards: {} };
  if (!person.languages[packId].cards || typeof person.languages[packId].cards !== "object") person.languages[packId].cards = {};
  return person.languages[packId];
}

function languageCardProgress(personId, packId, cardId) {
  const course = languageCourseProgress(personId, packId);
  if (!course.cards[cardId] || typeof course.cards[cardId] !== "object") course.cards[cardId] = { stage: 0, correctDays: [], reviews: 0, lapses: 0, dueDate: datePlus(0) };
  const record = course.cards[cardId];
  record.stage = Math.max(0, Math.min(RETENTION_INTERVALS.length - 1, Number(record.stage) || 0));
  record.correctDays = Array.isArray(record.correctDays) ? [...new Set(record.correctDays)].sort() : [];
  return record;
}

function existingLanguageCardProgress(personId, packId, cardId) {
  const person = state.languageProgress && state.languageProgress[personId];
  const course = person && person.languages && person.languages[packId];
  const record = course && course.cards && course.cards[cardId];
  return record && typeof record === "object" ? record : null;
}

function cardIsRetained(record) {
  return Boolean(record) && Number(record.stage) >= 2 && Array.isArray(record.correctDays) && record.correctDays.length >= 2;
}

function cardIsMastered(record) {
  return Boolean(record) && Number(record.stage) >= 5 && Array.isArray(record.correctDays) && record.correctDays.length >= 5 && daysBetween(record.correctDays[0], record.correctDays[record.correctDays.length - 1]) >= 14;
}

function languageStats(personId, pack) {
  const cards = allLanguageCards(pack);
  const records = cards.map((card) => existingLanguageCardProgress(personId, pack.id, card.id)).filter(Boolean);
  return {
    total: cards.length,
    started: records.filter((record) => record.stage > 0 || record.reviews > 0).length,
    retained: records.filter(cardIsRetained).length,
    mastered: records.filter(cardIsMastered).length,
    due: records.filter((record) => record.stage > 0 && (record.dueDate || datePlus(0)) <= datePlus(0)).length,
  };
}

function languageLevelStats(personId, pack, level) {
  const cards = allLanguageCards(pack).filter((card) => level === "all" || card.level === level);
  const records = cards.map((card) => existingLanguageCardProgress(personId, pack.id, card.id)).filter(Boolean);
  return {
    total: cards.length,
    retained: records.filter(cardIsRetained).length,
    mastered: records.filter(cardIsMastered).length,
  };
}

function combinedLanguageStats(personId) {
  const stats = LANGUAGE_PACKS.map((pack) => languageStats(personId, pack));
  return {
    retained: stats.reduce((sum, item) => sum + item.retained, 0),
    mastered: stats.reduce((sum, item) => sum + item.mastered, 0),
    xp: languagePersonProgress(personId).xp,
  };
}

function dailyLanguageRecord(personId) {
  const person = languagePersonProgress(personId);
  const today = datePlus(0);
  if (!person.daily[today] || typeof person.daily[today] !== "object") person.daily[today] = { reviewedIds: [], correctIds: [], completed: false, bonusAwarded: false };
  const daily = person.daily[today];
  daily.reviewedIds = Array.isArray(daily.reviewedIds) ? [...new Set(daily.reviewedIds)] : [];
  daily.correctIds = Array.isArray(daily.correctIds) ? [...new Set(daily.correctIds)] : [];
  return daily;
}

function languageStreak(personId) {
  const daily = languagePersonProgress(personId).daily;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  if (!daily[dateKey(cursor)] || !daily[dateKey(cursor)].completed) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  for (let guard = 0; guard < 730; guard += 1) {
    const record = daily[dateKey(cursor)];
    if (!record || !record.completed) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function moduleIsUnlocked(personId, pack, moduleIndex) {
  if (moduleIndex === 0) return true;
  const module = pack.modules[moduleIndex];
  if (module.cards.some((card) => Number(existingLanguageCardProgress(personId, pack.id, card.id)?.reviews) > 0)) return true;
  const previous = pack.modules[moduleIndex - 1];
  const introduced = previous.cards.filter((card) => Number(existingLanguageCardProgress(personId, pack.id, card.id)?.reviews) > 0).length;
  const retained = previous.cards.filter((card) => cardIsRetained(existingLanguageCardProgress(personId, pack.id, card.id))).length;
  return retained >= 1 || introduced >= Math.min(3, Math.ceil(previous.cards.length * .25));
}

function persistLanguageProgress() { localStorage.setItem("hh-language-progress", JSON.stringify(state.languageProgress)); }
function persistLanguageSettings() { localStorage.setItem("hh-learning-settings", JSON.stringify(state.languageSettings)); }
function persistLanguageView() { localStorage.setItem("hh-language-view", JSON.stringify({ selectedPack: state.languagePack, selectedLearner: state.languageProfile, selectedLevel: state.languageLevelFilter })); }

function openLanguageSettings() {
  $("#languageDailyGoalInput").value = String(Math.max(1, Number(state.languageSettings.dailyGoal) || 5));
  $("#languageBonusEnabledInput").checked = Boolean(state.languageSettings.bonusEnabled);
  $("#languageDailyBonusInput").value = String(Math.max(0, Number(state.languageSettings.dailyBonus) || 0));
  elements.languageSettingsDialog.showModal();
}

function renderLanguageLeaderboard(targetId, compact) {
  const rows = familyConfig.members.map((member) => ({ id: member.id, name: member.name, avatar: member.name.charAt(0).toUpperCase(), color: member.color, ...combinedLanguageStats(member.id) }))
    .sort((a, b) => b.retained - a.retained || b.mastered - a.mastered || b.xp - a.xp || a.name.localeCompare(b.name));
  const target = $(targetId);
  if (!target) return;
  target.innerHTML = rows.slice(0, compact ? 5 : rows.length).map((row, index) => '<article class="league-row' + (row.id === state.languageProfile ? " current" : "") + '"><b>' + (index + 1) + '</b><span class="league-avatar" style="--league-color:' + row.color + '">' + escapeHtml(row.avatar) + '</span><span class="league-name"><strong>' + escapeHtml(row.name) + '</strong><small>' + row.mastered + ' mastered · ' + row.xp + ' XP</small></span><span class="league-score"><strong>' + row.retained + '</strong><small>retained</small></span></article>').join("");
}

function renderLearning() {
  const pack = languagePackById(state.languagePack);
  if (!pack) return;
  if (isChildProfile(state.profile)) state.languageProfile = state.profile;
  if (!PROFILES[state.languageProfile] || state.languageProfile === "family") state.languageProfile = familyConfig.members[0].id;
  $("#languageLearnerSelect").disabled = isChildProfile(state.profile);
  $("#languageLearnerSelect").value = state.languageProfile;
  $("#languagePackSelect").value = pack.id;
  const stats = languageStats(state.languageProfile, pack);
  const daily = dailyLanguageRecord(state.languageProfile);
  const goal = Math.max(1, Number(state.languageSettings.dailyGoal) || 5);
  const completed = Math.min(goal, daily.reviewedIds.length);
  $("#learningCourseTitle").textContent = pack.flag + " " + pack.name + " · " + pack.nativeName;
  $("#learningForLabel").textContent = profileName(state.languageProfile) + "’s course";
  const courseLabel = pack.cefrMax === "B1" ? "B1 preparation" : pack.cefrMax === "A2" ? "A1 to A2 foundations" : "A1 introduction";
  $("#learningCatalogMeta").textContent = stats.total + " offline cards · " + (pack.levels || ["A1"]).join(" → ") + " · " + courseLabel;
  $("#learningRetainedCount").textContent = stats.retained;
  $("#learningMasteredCount").textContent = stats.mastered;
  $("#learningDueCount").textContent = stats.due;
  $("#learningStreakCount").textContent = languageStreak(state.languageProfile);
  $("#dailyLearningProgress").textContent = completed + " / " + goal + " unique reviews";
  $("#dailyLearningBar").style.width = Math.round(completed / goal * 100) + "%";
  $("#dailyLearningCopy").textContent = daily.completed ? daily.bonusAwarded ? "Daily practice complete · reward bonus earned" : "Daily practice complete · keep the streak alive tomorrow" : "Short, spaced reviews build stronger memory than cramming.";
  $("#startDailyLearningButton").textContent = stats.due ? "Review " + stats.due + " due card" + (stats.due === 1 ? "" : "s") : daily.completed ? "Optional practice" : "Start daily practice";
  const levels = pack.levels || ["A1"];
  if (state.languageLevelFilter !== "all" && !levels.includes(state.languageLevelFilter)) state.languageLevelFilter = "all";
  $("#learningPathTitle").textContent = state.languageLevelFilter === "all" ? "Complete course path" : state.languageLevelFilter + " pathway";
  $("#languageLevelFilters").innerHTML = ["all", ...levels].map((level) => {
    const levelStats = languageLevelStats(state.languageProfile, pack, level);
    const label = level === "all" ? "All levels" : level;
    return '<button class="' + (state.languageLevelFilter === level ? "active" : "") + '" data-language-level="' + level + '" type="button"><strong>' + label + '</strong><span>' + levelStats.retained + '/' + levelStats.total + ' retained</span></button>';
  }).join("");
  const visibleModules = pack.modules.map((module, index) => ({ module, index })).filter(({ module }) => state.languageLevelFilter === "all" || (module.level || "A1") === state.languageLevelFilter);
  $("#languageModuleGrid").innerHTML = visibleModules.map(({ module, index }) => {
    const unlocked = moduleIsUnlocked(state.languageProfile, pack, index);
    const retained = module.cards.filter((card) => cardIsRetained(existingLanguageCardProgress(state.languageProfile, pack.id, card.id))).length;
    const mastered = module.cards.filter((card) => cardIsMastered(existingLanguageCardProgress(state.languageProfile, pack.id, card.id))).length;
    const started = module.cards.filter((card) => Number(existingLanguageCardProgress(state.languageProfile, pack.id, card.id)?.reviews) > 0).length;
    const percent = Math.round(retained / module.cards.length * 100);
    const kind = String(module.kind || "foundations").replace(/-/g, " ");
    return '<article class="language-module' + (unlocked ? "" : " locked") + '"><header><span>' + escapeHtml(module.icon) + '</span><div><small>' + escapeHtml(module.level || "A1") + ' · ' + escapeHtml(kind) + ' · Module ' + (index + 1) + '</small><strong>' + escapeHtml(module.title) + '</strong></div><b>' + (unlocked ? retained + "/" + module.cards.length : "🔒") + '</b></header><p class="module-description">' + escapeHtml(module.description || "Practice useful words and phrases.") + '</p><div class="module-progress"><span style="width:' + percent + '%"></span></div><p class="module-status">' + (unlocked ? mastered + " mastered · " + started + " introduced" : "Try at least 3 cards in the previous module to unlock") + '</p><button data-start-language-module="' + module.id + '" type="button" ' + (unlocked ? "" : "disabled") + '>' + (started ? "Study & review" : "Begin module") + "</button></article>";
  }).join("");
  renderLanguageLeaderboard("#languageLeaderboard", false);
  renderLanguageLeaderboard("#homeLanguageLeaderboard", true);
  const combined = combinedLanguageStats(state.languageProfile);
  $("#languageWidgetSummary").textContent = profileName(state.languageProfile) + " has retained " + combined.retained + " word" + (combined.retained === 1 ? "" : "s");
}

function shuffled(values) {
  return values.slice().sort(() => Math.random() - .5);
}

function sessionQuestion(card, pack) {
  const record = languageCardProgress(state.languageProfile, pack.id, card.id);
  const reverse = record.reviews % 2 === 1;
  const all = allLanguageCards(pack).filter((item) => item.id !== card.id);
  const correct = reverse ? card.prompt : card.answer;
  const sameKind = shuffled(all.filter((item) => item.level === card.level && item.kind === card.kind));
  const sameLevel = shuffled(all.filter((item) => item.level === card.level && item.kind !== card.kind));
  const ranked = [...sameKind, ...sameLevel, ...shuffled(all)];
  const seen = new Set();
  const distractors = [];
  for (const item of ranked) {
    const value = reverse ? item.prompt : item.answer;
    if (value === correct || seen.has(value)) continue;
    seen.add(value);
    distractors.push(value);
    if (distractors.length === 3) break;
  }
  return {
    reverse,
    prompt: reverse ? card.answer : card.prompt,
    label: reverse ? "Choose the English meaning" : "Choose the " + pack.name + " answer",
    correct,
    options: shuffled([correct, ...distractors]),
  };
}

function beginLanguageSession(moduleId) {
  const pack = languagePackById(state.languagePack);
  const all = allLanguageCards(pack);
  let candidates;
  if (moduleId) {
    const module = pack.modules.find((item) => item.id === moduleId);
    candidates = module ? module.cards.map((card) => ({ ...card, moduleId: module.id, moduleTitle: module.title, level: card.level || module.level || "A1", kind: card.kind || module.kind || "foundations" })) : [];
  } else {
    const unlockedIds = new Set(pack.modules.filter((module, index) => moduleIsUnlocked(state.languageProfile, pack, index)).map((module) => module.id));
    const available = all.filter((card) => unlockedIds.has(card.moduleId));
    const reviewedToday = new Set(dailyLanguageRecord(state.languageProfile).reviewedIds);
    const due = available.filter((card) => {
      const record = existingLanguageCardProgress(state.languageProfile, pack.id, card.id);
      return !reviewedToday.has(card.id) && Number(record?.stage) > 0 && (record.dueDate || datePlus(0)) <= datePlus(0);
    }).sort((a, b) => String(existingLanguageCardProgress(state.languageProfile, pack.id, a.id)?.dueDate || "").localeCompare(String(existingLanguageCardProgress(state.languageProfile, pack.id, b.id)?.dueDate || "")));
    const fresh = available.filter((card) => {
      const record = existingLanguageCardProgress(state.languageProfile, pack.id, card.id);
      return !reviewedToday.has(card.id) && (!record || Number(record.stage) === 0 && Number(record.reviews) === 0);
    });
    const goal = Math.max(1, Number(state.languageSettings.dailyGoal) || 5);
    candidates = due.slice(0, 12);
    if (candidates.length < goal) candidates = candidates.concat(fresh.slice(0, goal - candidates.length));
    if (!candidates.length) candidates = available.slice(0, Math.min(goal, available.length));
  }
  if (!candidates.length) return showToast("This module has no cards yet");
  state.languageSession = { packId: pack.id, moduleId: moduleId || null, cards: candidates, index: 0, phase: "", correct: 0, answered: 0, selected: null, question: null };
  prepareLanguageSessionCard();
  elements.languageSessionDialog.showModal();
}

function prepareLanguageSessionCard() {
  const session = state.languageSession;
  if (!session || session.index >= session.cards.length) {
    if (session) session.phase = "complete";
    renderLanguageSession();
    return;
  }
  const pack = languagePackById(session.packId);
  const card = session.cards[session.index];
  const record = languageCardProgress(state.languageProfile, pack.id, card.id);
  session.phase = record.stage === 0 && record.reviews === 0 ? "teach" : "question";
  session.selected = null;
  session.question = sessionQuestion(card, pack);
  renderLanguageSession();
}

function renderLanguageSession() {
  const session = state.languageSession;
  if (!session) return;
  const complete = session.phase === "complete";
  $("#languageSessionProgress").textContent = complete ? "Complete" : session.index + 1 + " of " + session.cards.length;
  $("#languageSessionBar").style.width = (complete ? 100 : session.index / session.cards.length * 100) + "%";
  $("#languagePracticeButton").hidden = session.phase !== "teach";
  $("#languageNextButton").hidden = !["answered", "complete"].includes(session.phase);
  $("#languageNextButton").textContent = complete ? "Done" : session.index === session.cards.length - 1 ? "Finish" : "Next card";
  const pack = languagePackById(session.packId);
  const moduleIndex = session.moduleId ? pack.modules.findIndex((module) => module.id === session.moduleId) : -1;
  const nextModule = moduleIndex >= 0 ? pack.modules[moduleIndex + 1] : null;
  $("#continueLanguageButton").hidden = !complete || !nextModule || !moduleIsUnlocked(state.languageProfile, pack, moduleIndex + 1);
  if (nextModule) {
    $("#continueLanguageButton").dataset.nextLanguageModule = nextModule.id;
    $("#continueLanguageButton").textContent = "Continue: " + nextModule.title;
  } else {
    delete $("#continueLanguageButton").dataset.nextLanguageModule;
  }
  $("#hearLanguageButton").hidden = !["teach", "answered"].includes(session.phase);
  $("#languageAnswerBlock").hidden = !["teach", "answered"].includes(session.phase);
  $("#languageChoices").hidden = session.phase !== "question" && session.phase !== "answered";
  if (complete) {
    $("#languageSessionEyebrow").textContent = "Practice complete";
    $("#languageSessionTitle").textContent = "Practice complete";
    $("#languageQuestionLabel").textContent = "Long-term learning";
    $("#languageQuestion").textContent = session.correct + " of " + session.answered + " answered correctly";
    $("#languageChoices").innerHTML = "";
    $("#languageFeedback").textContent = "Today’s first attempts are saved. Cards return on spaced review days before they can count as retained or mastered.";
    return;
  }
  const card = session.cards[session.index];
  $("#languageSessionEyebrow").textContent = (card.level || "A1") + " · " + String(card.kind || "foundations").replace(/-/g, " ") + " · " + (card.moduleTitle || pack.name);
  $("#languageSessionTitle").textContent = session.phase === "teach" ? "Meet a new card" : "Recall from memory";
  $("#languageQuestionLabel").textContent = session.phase === "teach" ? "English" : session.question.label;
  $("#languageQuestion").textContent = session.phase === "teach" ? card.prompt : session.question.prompt;
  $("#languageAnswer").textContent = card.answer;
  $("#languagePronunciation").textContent = card.pronunciation || "";
  $("#languageNote").textContent = card.note || "";
  $("#languageFeedback").textContent = session.phase === "answered" ? session.selected === session.question.correct ? "Correct. This card has been scheduled for a later day." : "Incorrect. The correct answer is shown above, and the card will return." : session.phase === "teach" ? "Read and listen first. Then practice recalling it without the answer visible." : "Choose once. Only the first attempt today affects retention progress.";
  $("#languageFeedback").className = "language-feedback " + (session.phase === "answered" ? session.selected === session.question.correct ? "correct" : "incorrect" : "");
  $("#languageChoices").innerHTML = session.question.options.map((option) => '<button class="' + (session.phase === "answered" && option === session.question.correct ? "correct" : session.phase === "answered" && option === session.selected ? "incorrect" : "") + '" data-language-choice="' + escapeHtml(option) + '" type="button" ' + (session.phase === "answered" ? "disabled" : "") + '>' + escapeHtml(option) + "</button>").join("");
}

function awardDailyLanguageBonus(personId) {
  const daily = dailyLanguageRecord(personId);
  const goal = Math.max(1, Number(state.languageSettings.dailyGoal) || 5);
  if (daily.reviewedIds.length < goal || daily.completed) return;
  daily.completed = true;
  const bonus = Math.max(0, Number(state.languageSettings.dailyBonus) || 0);
  if (state.languageSettings.bonusEnabled && bonus > 0 && state.rewards[personId]) {
    state.rewards[personId].points += bonus;
    daily.bonusAwarded = true;
    persistRewards();
    logActivity(profileName(personId) + " completed daily language practice (+" + bonus + " reward points)", "文", "rewards");
    showToast("Daily language goal complete · +" + bonus + " reward points!");
  } else {
    logActivity(profileName(personId) + " completed daily language practice", "文", "habits");
    showToast("Daily language goal complete · streak saved!");
  }
}

function recordLanguageAnswer(option) {
  const session = state.languageSession;
  if (!session || session.phase !== "question") return;
  const pack = languagePackById(session.packId);
  const card = session.cards[session.index];
  const record = languageCardProgress(state.languageProfile, pack.id, card.id);
  const correct = option === session.question.correct;
  const today = datePlus(0);
  record.reviews = (Number(record.reviews) || 0) + 1;
  if (!record.firstSeenDate) record.firstSeenDate = today;
  if (record.lastReviewDate !== today) {
    record.lastReviewDate = today;
    if (correct) {
      record.correctDays = [...new Set(record.correctDays.concat(today))].sort();
      record.stage = Math.min(RETENTION_INTERVALS.length - 1, record.stage + 1);
      record.dueDate = addDaysToKey(today, RETENTION_INTERVALS[record.stage]);
    } else {
      record.lapses = (Number(record.lapses) || 0) + 1;
      record.stage = Math.max(0, record.stage - 1);
      record.dueDate = today;
    }
  }
  const daily = dailyLanguageRecord(state.languageProfile);
  if (!daily.reviewedIds.includes(card.id)) {
    daily.reviewedIds.push(card.id);
    if (correct) daily.correctIds.push(card.id);
    if (correct) languagePersonProgress(state.languageProfile).xp += 10;
  }
  session.selected = option;
  session.phase = "answered";
  session.answered += 1;
  if (correct) session.correct += 1;
  awardDailyLanguageBonus(state.languageProfile);
  persistLanguageProgress();
  renderLanguageSession();
  renderLearning();
  renderRewards();
}

function speakCurrentLanguageCard() {
  const session = state.languageSession;
  if (!session || session.index >= session.cards.length) return;
  if (!("speechSynthesis" in window)) return showToast("Speech playback is not available on this device");
  const pack = languagePackById(session.packId);
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(session.cards[session.index].answer.replace(/…/g, ""));
  utterance.lang = pack.voice;
  utterance.rate = .82;
  speechSynthesis.speak(utterance);
}

function createMemoryGame() {
  const icons = ["🌟", "🌈", "🍉", "🚀", "🐳", "🎨"];
  state.memoryGame = {
    cards: icons.concat(icons).map((icon, index) => ({ id: index + "-" + icon, icon, open: false, matched: false })).sort(() => Math.random() - 0.5),
    first: null,
    lock: false,
    moves: 0,
    matches: 0,
  };
  renderMemoryGame();
}

function renderMemoryGame() {
  if (!state.memoryGame.cards.length) return createMemoryGame();
  $("#memoryBoard").innerHTML = state.memoryGame.cards.map((card, index) => '<button class="memory-tile ' + (card.open || card.matched ? "open" : "") + (card.matched ? " matched" : "") + '" data-memory-index="' + index + '" type="button" aria-label="' + (card.open || card.matched ? card.icon : "Hidden card") + '"><span>' + (card.open || card.matched ? card.icon : "?") + '</span></button>').join("");
  $("#memoryStatus").textContent = state.memoryGame.matches === 6 ? "All matched in " + state.memoryGame.moves + " moves!" : state.memoryGame.moves + " move" + (state.memoryGame.moves === 1 ? "" : "s") + " · " + state.memoryGame.matches + " of 6 pairs";
}

function renderReactionGame() {
  const game = state.reactionGame;
  $("#reactionPad").className = "reaction-pad " + game.status;
  const copy = game.status === "waiting" ? ["Wait…", "Tap only when it turns green"] : game.status === "ready" ? ["TAP!", "Go, go, go!"] : game.status === "result" ? [game.last + " ms", "Tap to play again"] : ["Start", "Tap to play"];
  $("#reactionPad strong").textContent = copy[0];
  $("#reactionMessage").textContent = copy[1];
  $("#reactionBest").textContent = game.best ? "Best time: " + game.best + " ms" : "No best time yet";
}

function renderFun() {
  renderReactionGame();
  renderMemoryGame();
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
  renderWeather();
  renderVacationMode();
  renderConnection();
  renderSettingsSummary();
  renderLearning();
  renderFun();
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
  state.rewardOwner = PROFILES[profileId].rewardOwner || firstChildId();
  state.choreFilter = profileId === "family" ? "all" : profileId;
  state.habitFilter = profileId === "family" ? "all" : profileId;
  if (profileId !== "family") {
    state.languageProfile = profileId;
    persistLanguageView();
  }
  localStorage.setItem("hh-profile", profileId);
  const profile = PROFILES[profileId];
  document.body.dataset.profile = profileId;
  document.body.classList.toggle("kid-view", profileId !== "family" && !profile.adult);
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
  if (viewId === "learning") renderLearning();
  if (viewId === "fun") renderFun();
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

async function saveEvidenceLocal(key, file) {
  const db = await openEvidenceDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    tx.objectStore("photos").put(file, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function saveEvidence(key, file) {
  await saveEvidenceLocal(key, file);
  if (window.HouseHelperSync) await window.HouseHelperSync.putMedia(key, file);
}

async function getEvidence(key) {
  const db = await openEvidenceDb();
  const local = await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readonly");
    const request = tx.objectStore("photos").get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  if (local || !window.HouseHelperSync) return local;
  const remote = await window.HouseHelperSync.getMedia(key);
  if (remote) await saveEvidenceLocal(key, remote);
  return remote;
}

async function deleteEvidence(key) {
  const db = await openEvidenceDb();
  await new Promise((resolve) => {
    const tx = db.transaction("photos", "readwrite");
    tx.objectStore("photos").delete(key);
    tx.oncomplete = resolve;
    tx.onerror = resolve;
  });
  if (window.HouseHelperSync) await window.HouseHelperSync.deleteMedia(key);
}

const MAX_CHORE_PHOTOS = 6;

function photoDateLabel(photo) {
  if (!photo || !photo.takenAt) return "Date unavailable";
  const date = new Date(photo.takenAt);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  const prefix = photo.dateSource === "taken" ? "Taken" : photo.dateSource === "file" ? "File date" : "Added";
  return prefix + " " + date.toLocaleString();
}

function parseExifDate(value) {
  const match = String(value || "").trim().match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6]));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function exifIfdEntry(view, tiffOffset, ifdOffset, littleEndian, tag) {
  if (ifdOffset < 0 || ifdOffset + 2 > view.byteLength) return null;
  const count = view.getUint16(ifdOffset, littleEndian);
  for (let index = 0; index < count; index += 1) {
    const entry = ifdOffset + 2 + index * 12;
    if (entry + 12 > view.byteLength) return null;
    if (view.getUint16(entry, littleEndian) === tag) return entry;
  }
  return null;
}

function exifAscii(view, tiffOffset, entry, littleEndian) {
  if (entry == null || entry + 12 > view.byteLength || view.getUint16(entry + 2, littleEndian) !== 2) return "";
  const length = view.getUint32(entry + 4, littleEndian);
  const start = length <= 4 ? entry + 8 : tiffOffset + view.getUint32(entry + 8, littleEndian);
  if (!length || start < 0 || start + length > view.byteLength) return "";
  let value = "";
  for (let index = 0; index < length - 1; index += 1) value += String.fromCharCode(view.getUint8(start + index));
  return value;
}

async function jpegTakenAt(file) {
  if (!file || !(/jpe?g/i.test(file.type || "") || /\.jpe?g$/i.test(file.name || ""))) return null;
  try {
    const header = typeof file.slice === "function" ? file.slice(0, Math.min(file.size || 0, 512 * 1024)) : file;
    const view = new DataView(await header.arrayBuffer());
    if (view.byteLength < 12 || view.getUint16(0, false) !== 0xffd8) return null;
    let offset = 2;
    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset) !== 0xff) break;
      const marker = view.getUint8(offset + 1);
      const segmentLength = view.getUint16(offset + 2, false);
      if (segmentLength < 2 || offset + 2 + segmentLength > view.byteLength) break;
      if (marker === 0xe1 && segmentLength >= 14 && view.getUint32(offset + 4, false) === 0x45786966) {
        const tiffOffset = offset + 10;
        const byteOrder = view.getUint16(tiffOffset, false);
        const littleEndian = byteOrder === 0x4949;
        if (!littleEndian && byteOrder !== 0x4d4d || view.getUint16(tiffOffset + 2, littleEndian) !== 42) return null;
        const firstIfd = tiffOffset + view.getUint32(tiffOffset + 4, littleEndian);
        const exifPointer = exifIfdEntry(view, tiffOffset, firstIfd, littleEndian, 0x8769);
        if (exifPointer != null) {
          const exifIfd = tiffOffset + view.getUint32(exifPointer + 8, littleEndian);
          const original = exifAscii(view, tiffOffset, exifIfdEntry(view, tiffOffset, exifIfd, littleEndian, 0x9003), littleEndian);
          const digitized = exifAscii(view, tiffOffset, exifIfdEntry(view, tiffOffset, exifIfd, littleEndian, 0x9004), littleEndian);
          const parsed = parseExifDate(original || digitized);
          if (parsed) return parsed;
        }
        return parseExifDate(exifAscii(view, tiffOffset, exifIfdEntry(view, tiffOffset, firstIfd, littleEndian, 0x0132), littleEndian));
      }
      offset += 2 + segmentLength;
    }
  } catch {
    return null;
  }
  return null;
}

async function photoDateInfo(file) {
  const embedded = await jpegTakenAt(file);
  if (embedded) return { takenAt: embedded, dateSource: "taken" };
  if (file && Number(file.lastModified) > 0) return { takenAt: new Date(file.lastModified).toISOString(), dateSource: "file" };
  return { takenAt: new Date().toISOString(), dateSource: "added" };
}

async function optimizeEvidencePhoto(file) {
  if (!file || !/^image\/(jpeg|png|webp)$/i.test(file.type || "")) return file;
  const source = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = source;
    });
    const maxSide = Math.max(image.naturalWidth, image.naturalHeight);
    if (maxSide <= 2048 && file.size <= 2.5 * 1024 * 1024) return file;
    const scale = Math.min(1, 2048 / maxSide);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", .86));
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(source);
  }
}

function clearSelectedPhotoFiles() {
  state.selectedPhotoFiles.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  state.selectedPhotoFiles = [];
}

function renderSelectedPhotoFiles() {
  const grid = $("#photoPreviewGrid");
  grid.innerHTML = state.selectedPhotoFiles.map((photo, index) => '<article class="photo-preview-card">' +
    (photo.canPreview ? '<img src="' + photo.previewUrl + '" alt="Selected chore photo ' + (index + 1) + '">' : '<span class="photo-file-fallback">' + escapeHtml(photo.file.name || "Photo file") + "</span>") +
    '<small>' + escapeHtml(photoDateLabel(photo)) + '</small><button type="button" data-remove-selected-photo="' + index + '" aria-label="Remove photo ' + (index + 1) + '">×</button></article>').join("");
  const count = state.selectedPhotoFiles.length;
  $("#photoSelectionSummary").textContent = count ? count + " of " + MAX_CHORE_PHOTOS + " photos ready. Tap above to add more." : "No photos selected yet.";
  $("#savePhotoButton").disabled = count === 0;
  $("#savePhotoButton").textContent = count ? "Save " + count + (count === 1 ? " photo" : " photos") : "Save photos";
}

async function addSelectedPhotoFiles(files) {
  const candidates = Array.from(files || []);
  if (!candidates.length) return;
  const known = new Set(state.selectedPhotoFiles.map((photo) => [photo.file.name, photo.file.size, photo.file.lastModified].join(":")));
  const available = MAX_CHORE_PHOTOS - state.selectedPhotoFiles.length;
  const accepted = candidates.filter((file) => /^image\//i.test(file.type || "") || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || "")).filter((file) => {
    const signature = [file.name, file.size, file.lastModified].join(":");
    if (known.has(signature)) return false;
    known.add(signature);
    return true;
  }).slice(0, available);
  if (!accepted.length) {
    showToast(available ? "Choose an image file" : "You can attach up to " + MAX_CHORE_PHOTOS + " photos");
    return;
  }
  $("#savePhotoButton").disabled = true;
  $("#photoSelectionSummary").textContent = "Reading photo dates...";
  for (const file of accepted) {
    const date = await photoDateInfo(file);
    state.selectedPhotoFiles.push({ file, previewUrl: URL.createObjectURL(file), canPreview: /^image\/(jpeg|png|webp|gif)$/i.test(file.type || ""), ...date });
  }
  renderSelectedPhotoFiles();
  if (candidates.length > accepted.length && state.selectedPhotoFiles.length >= MAX_CHORE_PHOTOS) showToast("Added the first " + MAX_CHORE_PHOTOS + " photos");
}

function phasePhotoMetadata(record, phase, choreId) {
  const photos = record && record[phase + "Photos"];
  if (Array.isArray(photos) && photos.length) return photos.filter((photo) => photo && photo.key);
  return record && record[phase + "Photo"] ? [{ key: choreId + ":" + phase, legacy: true }] : [];
}

function recordHasPhoto(record, phase) {
  return Boolean(record && (record[phase + "Photo"] || Array.isArray(record[phase + "Photos"]) && record[phase + "Photos"].length));
}

async function loadPhaseEvidence(choreId, record, phase) {
  const metadata = phasePhotoMetadata(record, phase, choreId);
  const evidence = await Promise.all(metadata.map(async (photo) => ({ photo, blob: await getEvidence(photo.key) })));
  return evidence.filter((item) => item.blob);
}

async function clearPhaseEvidence(choreId, record, phase) {
  const keys = new Set(phasePhotoMetadata(record, phase, choreId).map((photo) => photo.key));
  keys.add(choreId + ":" + phase);
  await Promise.allSettled(Array.from(keys).map(deleteEvidence));
  record[phase + "Photos"] = [];
  record[phase + "Photo"] = false;
}

function openPhotoDialog(item) {
  state.activeChore = item;
  clearSelectedPhotoFiles();
  const finishing = item.dataset.state === "in-progress";
  const name = $(".chore-copy strong", item).textContent;
  $("#photoTitle").textContent = (finishing ? "Add after" : "Add before") + " photos";
  $("#photoHelp").textContent = finishing ? "Show the finished result for “" + name + ".” Add up to six views. Points stay pending until an adult reviews the before and after photos." : "Show the starting condition for “" + name + ".” Add up to six views so an adult can make a fair comparison.";
  $("#chorePhoto").value = "";
  renderSelectedPhotoFiles();
  elements.photoDialog.showModal();
}

async function completePhotoStep(withPhoto) {
  const item = state.activeChore;
  if (!item) return false;
  if (withPhoto && !state.selectedPhotoFiles.length) return false;
  const id = item.dataset.choreId;
  const wasFinishing = item.dataset.state === "in-progress";
  const currentRecord = state.chores[id] || {};
  const record = { ...currentRecord };
  if (Array.isArray(currentRecord.beforePhotos)) record.beforePhotos = currentRecord.beforePhotos.map((photo) => ({ ...photo }));
  if (Array.isArray(currentRecord.afterPhotos)) record.afterPhotos = currentRecord.afterPhotos.map((photo) => ({ ...photo }));
  const phase = wasFinishing ? "after" : "before";
  const savedKeys = [];
  const button = $("#savePhotoButton");
  button.disabled = true;
  button.textContent = "Saving...";
  try {
    const metadata = [];
    if (withPhoto) {
      for (const selected of state.selectedPhotoFiles) {
        const blob = await optimizeEvidencePhoto(selected.file);
        const key = id + ":" + phase + ":" + makeId("photo");
        await saveEvidence(key, blob);
        savedKeys.push(key);
        metadata.push({
          key,
          name: selected.file.name || phase + " photo",
          type: blob.type || selected.file.type || "image/jpeg",
          size: blob.size || selected.file.size || 0,
          takenAt: selected.takenAt,
          dateSource: selected.dateSource,
          addedAt: new Date().toISOString(),
        });
      }
    }
    if (!wasFinishing) {
      await clearPhaseEvidence(id, record, "before");
      await clearPhaseEvidence(id, record, "after");
      await deleteEvidence(id + ":feedback");
      record.reviewReason = "";
      record.returnedBy = "";
      record.returnedAt = null;
      record.reviewMarkup = false;
      record.approvedBy = "";
      record.approvedAt = null;
    } else {
      await clearPhaseEvidence(id, record, phase);
    }
    record[phase + "Photos"] = metadata;
    record[phase + "Photo"] = metadata.length > 0;
    record.occurrenceDate = datePlus(0);
    if (wasFinishing) {
      record.status = "pending";
      record.submittedAt = new Date().toISOString();
      record.pointsAwarded = false;
      record.reviewReason = "";
      record.returnedBy = "";
      record.returnedAt = null;
      record.reviewMarkup = false;
      await deleteEvidence(id + ":feedback");
      showToast("Submitted for adult approval. Points are pending.");
    } else {
      record.status = "in-progress";
      showToast(metadata.length === 1 ? "Before photo saved. Add after photos when the chore is finished." : "Before photos saved. Add after photos when the chore is finished.");
    }
    state.chores[id] = record;
    persistChores();
    const chore = choreById(id);
    if (chore) logActivity((wasFinishing ? "Submitted " : "Started ") + "chore “" + chore.title + "”" + (metadata.length ? " with " + metadata.length + (metadata.length === 1 ? " photo" : " photos") : ""), "📷", "chores");
    state.activeChore = null;
    clearSelectedPhotoFiles();
    renderAll();
    return true;
  } catch {
    await Promise.all(savedKeys.map(deleteEvidence));
    renderSelectedPhotoFiles();
    showToast("The photos could not be saved. Please try again.");
    return false;
  }
}

function renderEvidenceList(container, empty, evidence, phase) {
  container.innerHTML = "";
  empty.hidden = evidence.length > 0;
  evidence.forEach((item, index) => {
    const url = URL.createObjectURL(item.blob);
    state.detailUrls.push(url);
    const button = document.createElement("button");
    button.className = "evidence-frame";
    button.type = "button";
    button.dataset.evidenceUrl = url;
    button.dataset.evidenceCaption = (phase === "before" ? "Before" : "After") + " photo " + (index + 1) + " of " + evidence.length + " · " + photoDateLabel(item.photo);
    button.innerHTML = '<img src="' + url + '" alt="' + (phase === "before" ? "Before" : "After") + ' chore photo ' + (index + 1) + '"><span>' + escapeHtml(photoDateLabel(item.photo)) + "</span>";
    container.appendChild(button);
  });
}

function openEvidenceViewer(source, caption) {
  if (!source) return;
  $("#evidenceViewerImage").src = source;
  $("#evidenceViewerCaption").textContent = caption || "Chore evidence";
  elements.evidenceViewerDialog.showModal();
}

async function openChoreDetail(choreId) {
  const chore = choreById(choreId);
  if (!chore) return;
  const record = state.chores[choreId] || {};
  const status = choreStatus(chore);
  state.detailChoreId = choreId;
  state.detailUrls.forEach((url) => URL.revokeObjectURL(url));
  state.detailUrls = [];
  $("#detailPerson").textContent = profileName(chore.person) + " · " + chore.area;
  $("#detailTitle").textContent = chore.title;
  const returned = status === "in-progress" && record.reviewReason;
  const statusText = status === "pending" ? "Waiting for adult approval · " + (chore.points ? "+" + chore.points + " points pending" : "review needed") : returned ? "Returned by " + (record.returnedBy || "an adult") + " · another try requested" : record.approvedBy ? "Approved by " + record.approvedBy : "Completed before photo approvals were enabled";
  $("#detailStatus").innerHTML = '<span class="status-badge ' + (status === "pending" ? "pending" : returned ? "returned" : "approved") + '">' + escapeHtml(statusText) + "</span>";
  const evidenceRequired = chore.photoRequired !== false || chore.points > 0;
  $("#approvalRecord").innerHTML = record.approvedBy ? "<strong>Checked by " + escapeHtml(record.approvedBy) + "</strong><br>" + new Date(record.approvedAt).toLocaleString() : status === "pending" ? evidenceRequired ? "Both photos must be present before points can be approved." : "This chore does not require photo evidence, but an adult still confirms completion." : "No adult verification record is available for this completed chore.";
  const canReview = status === "pending" && canReviewFromCurrentView();
  $("#detailActions").hidden = !canReview;
  const evidenceReady = !evidenceRequired || recordHasPhoto(record, "before") && recordHasPhoto(record, "after");
  $("#approveChoreButton").disabled = !evidenceReady;
  $("#approveChoreButton").textContent = evidenceReady ? PROFILES[state.profile].adult ? "Approve as " + PROFILES[state.profile].name : "Verify adult & approve" : "Before and after photos required";
  $("#choreReviewFeedback").hidden = !returned;
  $("#reviewFeedbackReason").textContent = returned ? record.reviewReason : "";
  $("#reviewFeedbackTitle").textContent = returned ? "Returned by " + (record.returnedBy || "an adult") : "Returned for another try";
  $("#reviewFeedbackImageButton").hidden = true;
  elements.choreDetailDialog.showModal();
  try {
    const evidence = await Promise.all([loadPhaseEvidence(choreId, record, "before"), loadPhaseEvidence(choreId, record, "after"), returned && record.reviewMarkup ? getEvidence(choreId + ":feedback") : null]);
    renderEvidenceList($("#beforeEvidenceList"), $("#beforeEmpty"), evidence[0], "before");
    renderEvidenceList($("#afterEvidenceList"), $("#afterEmpty"), evidence[1], "after");
    if (evidence[2]) {
      const feedbackUrl = URL.createObjectURL(evidence[2]);
      state.detailUrls.push(feedbackUrl);
      $("#reviewFeedbackImage").src = feedbackUrl;
      $("#reviewFeedbackImageButton").hidden = false;
    } else {
      $("#reviewFeedbackImage").removeAttribute("src");
    }
  } catch {
    showToast("Photo evidence could not be loaded on this device");
  }
}

function sha256HexFallback(bytes) {
  const constants = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  const hash = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const bitLength = bytes.length * 8;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);
  const rotateRight = (value, count) => value >>> count | value << (32 - count);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    const words = new Uint32Array(64);
    for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(offset + index * 4);
    for (let index = 16; index < 64; index += 1) {
      const left = words[index - 15];
      const right = words[index - 2];
      const sigma0 = rotateRight(left, 7) ^ rotateRight(left, 18) ^ left >>> 3;
      const sigma1 = rotateRight(right, 17) ^ rotateRight(right, 19) ^ right >>> 10;
      words[index] = (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const bigSigma1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = e & f ^ ~e & g;
      const first = (h + bigSigma1 + choice + constants[index] + words[index]) >>> 0;
      const bigSigma0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = a & b ^ a & c ^ b & c;
      const second = (bigSigma0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + first) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (first + second) >>> 0;
    }
    [a, b, c, d, e, f, g, h].forEach((value, index) => { hash[index] = (hash[index] + value) >>> 0; });
  }
  return [...hash].map((value) => value.toString(16).padStart(8, "0")).join("");
}

async function hashPasscode(parentId, passcode) {
  return window.HouseHelperCompat.hashPasscode(parentId, passcode);
}

function refreshPasscodeCopy() {
  const parent = PROFILES[state.authParent];
  const creating = !state.passcodes[state.authParent];
  $("#passcodeTitle").textContent = state.authConfirming ? "Confirm " + parent.name + "’s passcode" : creating ? "Create " + parent.name + "’s passcode" : "Enter " + parent.name + "’s passcode";
  $("#passcodeHelp").textContent = state.authConfirming ? "Enter the same four digits again to confirm." : creating ? "This adult does not have a household passcode yet. Choose four digits, then confirm them." : "Verify " + parent.name + " before continuing.";
  $("#unlockButton").textContent = authSubmitting ? "Checking…" : state.authConfirming ? "Confirm & continue" : "Continue";
  $("#unlockButton").disabled = authSubmitting;
  $("#passcodeBuildLabel").textContent = "HouseHelper " + localBuildVersion();
  $$("[data-parent]").forEach((button) => {
    button.classList.toggle("active", button.dataset.parent === state.authParent);
    button.disabled = authSubmitting;
  });
}

function requestParentAuth(context) {
  state.authContext = context;
  state.authParent = context.parentId || (PROFILES[state.profile].adult ? state.profile : firstAdultId());
  if (!state.authParent) return showToast("Add an adult profile before using adult controls");
  state.authConfirming = false;
  state.pendingPasscodeHash = null;
  authSubmitting = false;
  $("#parentPicker").hidden = context.action === "switch" || PROFILES[state.profile].adult;
  $("#passcodeInput").value = "";
  $("#passcodeError").textContent = "";
  refreshPasscodeCopy();
  elements.passcodeDialog.showModal();
  setTimeout(() => $("#passcodeInput").focus(), 0);
}

function closeParentAuth() {
  if (state.authContext && state.authContext.action === "addListItem") state.pendingListItem = null;
  state.authContext = null;
  state.authConfirming = false;
  state.pendingPasscodeHash = null;
  authSubmitting = false;
  $("#passcodeInput").value = "";
  $("#passcodeError").textContent = "";
  if (elements.passcodeDialog.open) elements.passcodeDialog.close();
}

async function submitParentAuth() {
  if (authSubmitting || !state.authContext) return;
  const input = $("#passcodeInput");
  const code = input.value.replace(/\D/g, "").slice(0, 4);
  input.value = code;
  if (!/^\d{4}$/.test(code)) {
    $("#passcodeError").textContent = "Enter exactly four numbers.";
    input.focus();
    return;
  }

  authSubmitting = true;
  $("#passcodeError").textContent = "";
  refreshPasscodeCopy();
  const parentId = state.authParent;
  try {
    const hash = await hashPasscode(parentId, code);
    const existing = state.passcodes[parentId];
    if (!existing && !state.authConfirming) {
      state.pendingPasscodeHash = hash;
      state.authConfirming = true;
      input.value = "";
      setTimeout(() => input.focus(), 0);
      return;
    }
    if (!existing && hash !== state.pendingPasscodeHash || existing && hash !== existing) {
      $("#passcodeError").textContent = "That passcode did not match. Try again.";
      state.authConfirming = false;
      state.pendingPasscodeHash = null;
      input.value = "";
      setTimeout(() => input.focus(), 0);
      return;
    }
    if (!existing) {
      state.passcodes[parentId] = hash;
      localStorage.setItem("hh-parent-passcodes", JSON.stringify(state.passcodes));
    }

    const context = state.authContext;
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
      if (context.itemType === "art") removeArtwork(context.itemId);
    }
    if (context.action === "vacation") openVacationSettings(parentId);
    if (context.action === "sleep") openSleepSettings(parentId);
    if (context.action === "google") openGoogleCalendarSettings(parentId);
    if (context.action === "activity") openActivity(parentId);
    if (context.action === "backup") openBackup();
    if (context.action === "devices") openConnectedDevices();
    if (context.action === "familySetup") openFamilySetup();
    if (context.action === "addChore") openChoreForm(true);
    if (context.action === "manageRewards") openRewardManager(context.rewardOwner, true);
    if (context.action === "languageSettings") openLanguageSettings();
    if (context.action === "addListItem") finishPendingListItem(parentId);
  } catch (error) {
    $("#passcodeError").textContent = "Passcode verification could not finish. Please try again.";
    input.focus();
  } finally {
    authSubmitting = false;
    if (elements.passcodeDialog.open) refreshPasscodeCopy();
  }
}

async function approveChore(parentId) {
  const chore = choreById(state.detailChoreId);
  if (!chore) return;
  const record = state.chores[chore.id] || {};
  const evidenceRequired = chore.photoRequired !== false || chore.points > 0;
  if (record.status !== "pending" || evidenceRequired && (!recordHasPhoto(record, "before") || !recordHasPhoto(record, "after"))) {
    showToast("Before and after photos are required before approval");
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
  logActivity(PROFILES[parentId].name + " approved “" + chore.title + "” for " + profileName(chore.person) + (chore.points ? " (+" + chore.points + " points)" : ""), "✓");
  renderAll();
  await openChoreDetail(chore.id);
  showToast("Approved by " + record.approvedBy + (chore.points ? " · +" + chore.points + " points" : ""));
}

function reviewCanvasPoint(event) {
  const canvas = $("#reviewMarkupCanvas");
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
}

function redrawReviewBase() {
  const canvas = $("#reviewMarkupCanvas");
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (state.reviewBaseImage) context.drawImage(state.reviewBaseImage, 0, 0, canvas.width, canvas.height);
  state.reviewHasMarks = false;
}

async function openRedoEditor(parentId) {
  const chore = choreById(state.detailChoreId);
  if (!chore) return;
  const record = state.chores[chore.id] || {};
  state.reviewEvidenceItems = await loadPhaseEvidence(chore.id, record, "after");
  if (!state.reviewEvidenceItems.length) return showToast("An after photo is needed before feedback can be marked up");
  const picker = $("#reviewPhotoInput");
  picker.innerHTML = state.reviewEvidenceItems.map((item, index) => '<option value="' + index + '">After photo ' + (index + 1) + " · " + escapeHtml(photoDateLabel(item.photo)) + "</option>").join("");
  $("#reviewPhotoField").hidden = state.reviewEvidenceItems.length < 2;
  state.reviewParentId = parentId;
  state.reviewColor = "#ef3f37";
  state.reviewDrawing = false;
  $("#redoReasonInput").value = "";
  $$('[data-review-color]').forEach((button) => button.classList.toggle("active", button.dataset.reviewColor === state.reviewColor));
  if (!await loadReviewPhoto(0)) return;
  elements.redoDialog.showModal();
}

async function loadReviewPhoto(index) {
  const selected = state.reviewEvidenceItems[Number(index) || 0];
  if (!selected) return false;
  const imageUrl = URL.createObjectURL(selected.blob);
  const image = new Image();
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = imageUrl;
    });
  } catch {
    URL.revokeObjectURL(imageUrl);
    $("#reviewPhotoInput").value = String(state.reviewPhotoIndex);
    showToast("This photo format cannot be opened for markup on this device");
    return false;
  }
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = $("#reviewMarkupCanvas");
  canvas.width = Math.max(320, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(240, Math.round(image.naturalHeight * scale));
  if (state.reviewImageUrl) URL.revokeObjectURL(state.reviewImageUrl);
  state.reviewPhotoIndex = Number(index) || 0;
  state.reviewBaseImage = image;
  state.reviewImageUrl = imageUrl;
  state.reviewDrawing = false;
  redrawReviewBase();
  return true;
}

async function requestNewPhotos(parentId) {
  await openRedoEditor(parentId);
}

async function submitRedoFeedback() {
  const chore = choreById(state.detailChoreId);
  const parentId = state.reviewParentId;
  const reason = $("#redoReasonInput").value.trim();
  if (!chore || !parentId) return;
  if (!reason) {
    showToast("Add a short reason so the learner knows what to fix");
    $("#redoReasonInput").focus();
    return;
  }
  const record = state.chores[chore.id] || {};
  if (state.reviewHasMarks) {
    const markup = await new Promise((resolve) => $("#reviewMarkupCanvas").toBlob(resolve, "image/jpeg", .9));
    if (markup) await saveEvidence(chore.id + ":feedback", markup);
    record.reviewMarkup = Boolean(markup);
    record.reviewMarkupPhotoNumber = state.reviewPhotoIndex + 1;
  } else {
    await deleteEvidence(chore.id + ":feedback");
    record.reviewMarkup = false;
    record.reviewMarkupPhotoNumber = null;
  }
  record.status = "in-progress";
  record.returnedBy = PROFILES[parentId].name;
  record.returnedAt = new Date().toISOString();
  record.reviewReason = reason;
  state.chores[chore.id] = record;
  await clearPhaseEvidence(chore.id, record, "after");
  persistChores();
  logActivity(PROFILES[parentId].name + " returned “" + chore.title + "” with written feedback" + (record.reviewMarkup ? " and photo markup" : ""), "↩", "chores");
  elements.redoDialog.close();
  elements.choreDetailDialog.close();
  if (state.reviewImageUrl) URL.revokeObjectURL(state.reviewImageUrl);
  state.reviewImageUrl = null;
  state.reviewBaseImage = null;
  state.reviewEvidenceItems = [];
  state.reviewParentId = null;
  renderAll();
  showToast("Feedback sent · a new after photo was requested");
}

async function removeChore(choreId, parentId) {
  const chore = choreById(choreId);
  if (!chore) return;
  const record = state.chores[choreId] || {};
  if (state.customChores.some((item) => item.id === choreId)) {
    state.customChores = state.customChores.filter((item) => item.id !== choreId);
    persistCustomChores();
  } else if (!state.removedChoreIds.includes(choreId)) {
    state.removedChoreIds.push(choreId);
    persistRemovedChores();
  }
  delete state.chores[choreId];
  persistChores();
  await Promise.all([clearPhaseEvidence(choreId, record, "before"), clearPhaseEvidence(choreId, record, "after"), deleteEvidence(choreId + ":feedback")]);
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

function openChoreForm(authorized) {
  if (!PROFILES[state.profile].adult && !authorized) return;
  $("#choreForm").reset();
  $("#choreAssigneeInput").value = state.profile === "family" ? firstChildId() || firstAdultId() : state.profile;
  $("#choreDueDateInput").value = datePlus(0);
  $("#choreDueTimeInput").value = "18:00";
  $("#chorePointsInput").value = "10";
  $("#chorePhotoRequiredInput").checked = true;
  $("#choreRepeatInput").value = "none";
  elements.choreFormDialog.showModal();
  setTimeout(() => $("#choreTitleInput").focus(), 0);
}

function openRewardManager(owner, authorized) {
  if (!PROFILES[state.profile].adult && !authorized) return;
  if (!owner || !state.rewards[owner]) return showToast("Add a child profile before creating rewards");
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
    $("#claimBody").innerHTML = '<div class="claim-hero"><span>' + escapeHtml(item.emoji) + "</span><strong>One more tap</strong><p>Your balance will change from " + account.points + " to " + (account.points - item.cost) + " points. The household adults will be notified.</p></div>";
    $("#confirmClaimButton").disabled = false;
    $("#confirmClaimButton").textContent = "Buy for " + item.cost + " points";
  } else {
    $("#claimEyebrow").textContent = "Reward claimed";
    $("#claimTitle").textContent = "Reward purchased";
    $("#claimBody").innerHTML = '<div class="claim-hero success"><span>🎉</span><strong>' + escapeHtml(item.name) + "</strong><p>The household adults will see this claim. You can also put it on the family calendar now.</p></div>";
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
  logActivity(profileName(active.owner) + " claimed “" + item.name + "” for " + item.cost + " points", "★");
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
  $("#eventSourceNote").textContent = readOnly ? "This event is a read-only copy from " + (existing.sourceName || "Google Calendar") + ". Sync again after changing it in Google." : "Everyone can add family calendar items. Connected calendars appear beside dashboard-created events.";
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
  openEventDialog({ title: profileName(claim.childId) + ": " + claim.rewardName, people: PROFILES[claim.childId] ? claim.childId : "family", claimId: claim.id });
}

function acknowledgeClaim(claimId) {
  const claim = state.rewardClaims.find((item) => item.id === claimId);
  if (!claim) return;
  claim.acknowledged = true;
  persistClaims();
  logActivity("Acknowledged " + profileName(claim.childId) + "’s reward claim", "★");
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
  if (state.timerRunning && state.timerEndsAt) state.timerSeconds = Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000));
  state.timerRunning = false;
  state.timerEndsAt = 0;
  clearInterval(state.timerId);
  state.timerId = null;
  persistTimer();
  renderTimer();
}

function timerTick() {
  state.timerSeconds = Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000));
  renderTimer();
  if (state.timerSeconds > 0) return;
  stopTimer();
  showToast("Family timer finished. Check the timer tile.");
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

function startTimerTicker() {
  clearInterval(state.timerId);
  timerTick();
  if (state.timerRunning) state.timerId = setInterval(timerTick, 1000);
}

function toggleTimer() {
  if (state.timerRunning) return stopTimer();
  if (state.timerSeconds === 0) state.timerSeconds = state.timerInitial;
  state.timerRunning = true;
  state.timerEndsAt = Date.now() + state.timerSeconds * 1000;
  persistTimer();
  startTimerTicker();
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
    return recordHasPhoto(record, "before") && recordHasPhoto(record, "after");
  }).sort((a, b) => String((state.chores[b.id] || {}).approvedAt || "").localeCompare(String((state.chores[a.id] || {}).approvedAt || ""))).slice(0, 8);
  const slides = [];
  for (const chore of eligible) {
    const record = state.chores[chore.id] || {};
    const evidence = await Promise.all([loadPhaseEvidence(chore.id, record, "before"), loadPhaseEvidence(chore.id, record, "after")]);
    if (!evidence[0].length || !evidence[1].length) continue;
    const beforeUrl = URL.createObjectURL(evidence[0][0].blob);
    const afterUrl = URL.createObjectURL(evidence[1][evidence[1].length - 1].blob);
    calmObjectUrls.push(beforeUrl, afterUrl);
    slides.push('<span class="calm-slide calm-before-after"><span><img src="' + beforeUrl + '" alt=""><b>Before</b></span><span><img src="' + afterUrl + '" alt=""><b>After</b></span><span class="calm-caption">' + escapeHtml(profileName(chore.person) + " · " + chore.title) + "</span></span>");
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

$("#addAdultMemberButton").addEventListener("click", () => addSetupMember(true));
$("#addChildMemberButton").addEventListener("click", () => addSetupMember(false));
elements.familySetupDialog.addEventListener("click", (event) => {
  const remove = event.target.closest(".member-remove");
  if (!remove) return;
  const row = remove.closest(".member-editor");
  const adultRows = $$('.member-editor[data-adult="true"]', elements.familySetupDialog);
  if (row.dataset.adult === "true" && adultRows.length === 1) return showToast("Every household needs at least one adult profile");
  row.remove();
});
elements.familySetupDialog.addEventListener("cancel", (event) => {
  if (SETUP_REQUIRED) event.preventDefault();
});
$("#familySetupForm").addEventListener("submit", (event) => {
  event.preventDefault();
  saveFamilySetup();
});
$("#closeFamilySetupButton").addEventListener("click", () => {
  if (!SETUP_REQUIRED) elements.familySetupDialog.close();
});

$("#languageLearnerSelect").addEventListener("change", (event) => {
  if (!PROFILES[event.target.value] || event.target.value === "family") return;
  state.languageProfile = event.target.value;
  persistLanguageView();
  renderLearning();
});
$("#languagePackSelect").addEventListener("change", (event) => {
  if (!languagePackById(event.target.value)) return;
  state.languagePack = event.target.value;
  state.languageLevelFilter = "all";
  persistLanguageView();
  renderLearning();
});
$("#languageLevelFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-language-level]");
  if (!button) return;
  state.languageLevelFilter = button.dataset.languageLevel;
  persistLanguageView();
  renderLearning();
});
$("#startDailyLearningButton").addEventListener("click", () => beginLanguageSession());
$("#languageModuleGrid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-start-language-module]");
  if (button && !button.disabled) beginLanguageSession(button.dataset.startLanguageModule);
});
$("#languageChoices").addEventListener("click", (event) => {
  const button = event.target.closest("[data-language-choice]");
  if (button && !button.disabled) recordLanguageAnswer(button.dataset.languageChoice);
});
$("#languagePracticeButton").addEventListener("click", () => {
  if (!state.languageSession || state.languageSession.phase !== "teach") return;
  state.languageSession.phase = "question";
  renderLanguageSession();
});
$("#languageNextButton").addEventListener("click", () => {
  if (!state.languageSession) return;
  if (state.languageSession.phase === "complete") {
    elements.languageSessionDialog.close();
    state.languageSession = null;
    return;
  }
  if (state.languageSession.phase !== "answered") return;
  state.languageSession.index += 1;
  prepareLanguageSessionCard();
});
$("#continueLanguageButton").addEventListener("click", (event) => {
  const moduleId = event.currentTarget.dataset.nextLanguageModule;
  if (!moduleId) return;
  elements.languageSessionDialog.close();
  state.languageSession = null;
  beginLanguageSession(moduleId);
});
$("#hearLanguageButton").addEventListener("click", speakCurrentLanguageCard);
$("#closeLanguageSessionButton").addEventListener("click", () => {
  elements.languageSessionDialog.close();
  state.languageSession = null;
});
elements.languageSessionDialog.addEventListener("cancel", () => { state.languageSession = null; });
$("#reactionPad").addEventListener("click", () => {
  const game = state.reactionGame;
  if (game.status === "waiting") {
    clearTimeout(game.timeoutId);
    game.status = "idle";
    renderReactionGame();
    showToast("Too soon. Wait for green.");
    return;
  }
  if (game.status === "ready") {
    game.last = Math.max(1, Date.now() - game.startedAt);
    game.best = game.best ? Math.min(game.best, game.last) : game.last;
    localStorage.setItem("hh-reaction-best", String(game.best));
    game.status = "result";
    renderReactionGame();
    return;
  }
  game.status = "waiting";
  renderReactionGame();
  game.timeoutId = setTimeout(() => {
    game.status = "ready";
    game.startedAt = Date.now();
    renderReactionGame();
  }, 1000 + Math.random() * 2200);
});
$("#resetMemoryButton").addEventListener("click", createMemoryGame);
$("#memoryBoard").addEventListener("click", (event) => {
  const button = event.target.closest("[data-memory-index]");
  if (!button || state.memoryGame.lock) return;
  const index = Number(button.dataset.memoryIndex);
  const card = state.memoryGame.cards[index];
  if (!card || card.open || card.matched) return;
  card.open = true;
  if (state.memoryGame.first === null) {
    state.memoryGame.first = index;
    renderMemoryGame();
    return;
  }
  const firstIndex = state.memoryGame.first;
  const first = state.memoryGame.cards[firstIndex];
  state.memoryGame.first = null;
  state.memoryGame.moves += 1;
  if (first.icon === card.icon) {
    first.matched = true;
    card.matched = true;
    state.memoryGame.matches += 1;
    renderMemoryGame();
    if (state.memoryGame.matches === 6) showToast("You matched every pair!");
    return;
  }
  state.memoryGame.lock = true;
  renderMemoryGame();
  setTimeout(() => {
    first.open = false;
    card.open = false;
    state.memoryGame.lock = false;
    renderMemoryGame();
  }, 700);
});

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

$("#passcodeInput").addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  submitParentAuth();
});
$("#passcodeForm").addEventListener("submit", (event) => { event.preventDefault(); submitParentAuth(); });
$("#unlockButton").addEventListener("click", submitParentAuth);
$("#closePasscodeButton").addEventListener("click", closeParentAuth);
$("#cancelPasscodeButton").addEventListener("click", closeParentAuth);

$("#manageRewardsButton").addEventListener("click", () => {
  if (PROFILES[state.profile].adult) openRewardManager(state.rewardOwner);
  else requestParentAuth({ action: "manageRewards", rewardOwner: state.rewardOwner });
});
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
  const record = item && state.chores[item.dataset.choreId];
  if (item && (["pending", "done"].includes(item.dataset.state) || record && record.reviewReason)) openChoreDetail(item.dataset.choreId);
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

$("#chorePhoto").addEventListener("change", async (event) => {
  await addSelectedPhotoFiles(event.target.files);
  event.target.value = "";
});

$("#photoPreviewGrid").addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove-selected-photo]");
  if (!remove) return;
  const index = Number(remove.dataset.removeSelectedPhoto);
  const selected = state.selectedPhotoFiles[index];
  if (selected) URL.revokeObjectURL(selected.previewUrl);
  state.selectedPhotoFiles.splice(index, 1);
  renderSelectedPhotoFiles();
});

$("#photoForm").addEventListener("submit", async (event) => {
  const value = event.submitter && event.submitter.value;
  if (!["save", "skip"].includes(value)) return;
  event.preventDefault();
  if (await completePhotoStep(value === "save")) elements.photoDialog.close();
});
elements.photoDialog.addEventListener("close", () => {
  clearSelectedPhotoFiles();
  state.activeChore = null;
});

$("#closeChoreDetail").addEventListener("click", () => elements.choreDetailDialog.close());
$("#choreDetailDialog").addEventListener("click", (event) => {
  const evidenceButton = event.target.closest("[data-evidence-url]");
  if (evidenceButton) openEvidenceViewer(evidenceButton.dataset.evidenceUrl, evidenceButton.dataset.evidenceCaption + " · " + $("#detailTitle").textContent);
});
$("#reviewFeedbackImageButton").addEventListener("click", () => openEvidenceViewer($("#reviewFeedbackImage").src, "Adult feedback · " + $("#detailTitle").textContent));
$("#closeEvidenceViewer").addEventListener("click", () => elements.evidenceViewerDialog.close());
$("#approveChoreButton").addEventListener("click", () => {
  if (PROFILES[state.profile].adult) approveChore(state.profile);
  else requestParentAuth({ action: "approve", choreId: state.detailChoreId });
});
$("#requestRedoButton").addEventListener("click", () => {
  if (PROFILES[state.profile].adult) requestNewPhotos(state.profile);
  else requestParentAuth({ action: "redo", choreId: state.detailChoreId });
});
$$('[data-review-color]').forEach((button) => button.addEventListener("click", () => {
  state.reviewColor = button.dataset.reviewColor;
  $$('[data-review-color]').forEach((item) => item.classList.toggle("active", item === button));
}));
$("#reviewMarkupCanvas").addEventListener("pointerdown", (event) => {
  state.reviewDrawing = true;
  state.reviewLast = reviewCanvasPoint(event);
  const context = event.currentTarget.getContext("2d");
  const width = Math.max(4, event.currentTarget.width / 220);
  context.beginPath();
  context.arc(state.reviewLast.x, state.reviewLast.y, width / 2, 0, Math.PI * 2);
  context.fillStyle = state.reviewColor;
  context.fill();
  state.reviewHasMarks = true;
  event.currentTarget.setPointerCapture(event.pointerId);
});
$("#reviewMarkupCanvas").addEventListener("pointermove", (event) => {
  if (!state.reviewDrawing) return;
  const next = reviewCanvasPoint(event);
  const context = event.currentTarget.getContext("2d");
  context.beginPath();
  context.moveTo(state.reviewLast.x, state.reviewLast.y);
  context.lineTo(next.x, next.y);
  context.strokeStyle = state.reviewColor;
  context.lineWidth = Math.max(4, event.currentTarget.width / 220);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.stroke();
  state.reviewLast = next;
  state.reviewHasMarks = true;
});
const finishReviewStroke = () => { state.reviewDrawing = false; state.reviewLast = null; };
$("#reviewMarkupCanvas").addEventListener("pointerup", finishReviewStroke);
$("#reviewMarkupCanvas").addEventListener("pointercancel", finishReviewStroke);
$("#clearReviewMarkup").addEventListener("click", redrawReviewBase);
$("#reviewPhotoInput").addEventListener("change", async (event) => {
  await loadReviewPhoto(event.target.value);
});
function closeRedoEditor() {
  if (elements.redoDialog.open) elements.redoDialog.close();
  if (state.reviewImageUrl) URL.revokeObjectURL(state.reviewImageUrl);
  state.reviewImageUrl = null;
  state.reviewBaseImage = null;
  state.reviewEvidenceItems = [];
  state.reviewPhotoIndex = 0;
  state.reviewParentId = null;
}
elements.redoDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeRedoEditor();
});
$("#closeRedoDialog").addEventListener("click", closeRedoEditor);
$("#cancelRedoButton").addEventListener("click", closeRedoEditor);
$("#sendRedoButton").addEventListener("click", submitRedoFeedback);

function requestOpenChoreForm() {
  if (PROFILES[state.profile].adult) openChoreForm();
  else requestParentAuth({ action: "addChore" });
}
$("#addChoreButton").addEventListener("click", requestOpenChoreForm);
$("#fullAddChoreButton").addEventListener("click", requestOpenChoreForm);
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
    photoRequired: $("#chorePhotoRequiredInput").checked || points > 0 && isChildProfile(assignee),
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
  if (pending.type === "art" && PROFILES[state.profile].adult) return removeArtwork(pending.id);
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
  const isKid = isChildProfile(state.profile);
  $("#habitPersonInput").value = isKid ? state.profile : state.profile === "family" ? firstChildId() || firstAdultId() : state.profile;
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
  requestListItem($("#homeListInput").value, "groceries", "homeListForm");
});
$("#fullListForm").addEventListener("submit", (event) => {
  event.preventDefault();
  requestListItem($("#fullListInput").value, $("#listCategoryInput").value, "fullListForm");
});
$("#listIdentityPicker").addEventListener("click", (event) => {
  const button = event.target.closest("[data-list-identity]");
  if (!button || !state.pendingListItem) return;
  const personId = button.dataset.listIdentity;
  elements.listIdentityDialog.close();
  if (PROFILES[personId].adult) requestParentAuth({ action: "addListItem", parentId: personId });
  else finishPendingListItem(personId);
});
$("#closeListIdentity").addEventListener("click", () => {
  elements.listIdentityDialog.close();
  state.pendingListItem = null;
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
  persistTimer();
  $$("[data-minutes]").forEach((item) => item.classList.toggle("active", item === button));
  renderTimer();
}));
$("#timerToggle").addEventListener("click", toggleTimer);
$("#timerReset").addEventListener("click", () => {
  stopTimer();
  state.timerSeconds = state.timerInitial;
  persistTimer();
  renderTimer();
});

$("#sleepButton").addEventListener("click", enterCalmMode);
$("#wakeButton").addEventListener("click", leaveCalmMode);
$("#familyMembersButton").addEventListener("click", () => {
  if (PROFILES[state.profile].adult) openFamilySetup();
  else requestParentAuth({ action: "familySetup" });
});
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
function requestLanguageSettingsAccess() {
  if (PROFILES[state.profile].adult) openLanguageSettings();
  else requestParentAuth({ action: "languageSettings" });
}
$("#languageSettingsButton").addEventListener("click", requestLanguageSettingsAccess);
$("#languageSettingsTile").addEventListener("click", requestLanguageSettingsAccess);
$("#languageSettingsForm").addEventListener("submit", (event) => {
  if (!event.submitter || event.submitter.value !== "save") return;
  event.preventDefault();
  const dailyGoal = Math.max(1, Math.min(20, Number($("#languageDailyGoalInput").value) || 5));
  const dailyBonus = Math.max(0, Math.min(50, Number($("#languageDailyBonusInput").value) || 0));
  state.languageSettings.dailyGoal = dailyGoal;
  state.languageSettings.bonusEnabled = $("#languageBonusEnabledInput").checked;
  state.languageSettings.dailyBonus = dailyBonus;
  persistLanguageSettings();
  elements.languageSettingsDialog.close();
  logActivity("Updated language practice to " + dailyGoal + " cards daily" + (state.languageSettings.bonusEnabled && dailyBonus ? " with a +" + dailyBonus + " child point bonus" : " with no point bonus"), "文", "settings");
  renderAll();
  showToast("Language learning settings saved");
});
$("#backupButton").addEventListener("click", () => {
  if (PROFILES[state.profile].adult) openBackup();
  else requestParentAuth({ action: "backup" });
});
$("#connectedDevicesButton").addEventListener("click", () => {
  if (PROFILES[state.profile].adult) openConnectedDevices();
  else requestParentAuth({ action: "devices" });
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
$("#closeConnectedDevicesButton").addEventListener("click", () => {
  deviceNameDraftDirty = false;
  elements.connectedDevicesDialog.close();
});
$("#doneConnectedDevicesButton").addEventListener("click", () => {
  if (deviceNameDraftDirty && !saveConnectedDeviceName()) return;
  elements.connectedDevicesDialog.close();
});
$("#connectedDeviceName").addEventListener("input", () => {
  deviceNameDraftDirty = true;
});
$("#connectedDeviceName").addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  saveConnectedDeviceName();
});
$("#saveDeviceNameButton").addEventListener("click", saveConnectedDeviceName);
$("#refreshDeviceConnectionButton").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "Checking…";
  try {
    if (window.HouseHelperSync) await window.HouseHelperSync.poll();
    renderConnectedDevices();
    showToast(window.HouseHelperSync && window.HouseHelperSync.status.connected ? "Kitchen host is connected" : "Kitchen host is not reachable");
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
});
$("#copyPairingAddressButton").addEventListener("click", async () => {
  const address = $("#pairingAddress").textContent;
  if (!address) return;
  try {
    await navigator.clipboard.writeText(address);
    showToast("Pairing address copied");
  } catch {
    showToast("Press and hold the address to copy it");
  }
});
$("#disconnectDeviceButton").addEventListener("click", () => {
  if (window.HouseHelperSync) window.HouseHelperSync.disconnect();
});
$("#weatherSettingsButton").addEventListener("click", openWeatherSettings);
$("#weatherContent").addEventListener("click", (event) => {
  if (event.target.closest("[data-open-weather]")) openWeatherSettings();
  if (event.target.closest("[data-refresh-weather]")) fetchWeather();
});
$("#closeWeatherDialog").addEventListener("click", () => elements.weatherDialog.close());
$("#weatherSearchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  searchWeatherLocations($("#weatherLocationInput").value);
});
$("#weatherSearchResults").addEventListener("click", (event) => {
  const result = event.target.closest("[data-weather-result]");
  if (!result || result.dataset.weatherResult === "current") return;
  const selected = state.weatherSearchResults[Number(result.dataset.weatherResult)];
  if (!selected) return;
  state.weatherDraft = { ...selected };
  $$("[data-weather-result]", $("#weatherSearchResults")).forEach((button) => button.classList.toggle("selected", button === result));
  $("#saveWeatherLocationButton").disabled = false;
});
$("#useDeviceLocationButton").addEventListener("click", chooseDeviceWeatherLocation);
$("#saveWeatherLocationButton").addEventListener("click", () => {
  if (!state.weatherDraft) return;
  const units = $("#weatherUnitInput").value === "celsius" ? "celsius" : "fahrenheit";
  const previous = state.weatherSettings.location;
  const changed = !previous || previous.latitude !== state.weatherDraft.latitude || previous.longitude !== state.weatherDraft.longitude || state.weatherSettings.units !== units;
  state.weatherSettings.location = { ...state.weatherDraft };
  state.weatherSettings.units = units;
  if (changed) {
    state.weatherSettings.forecast = null;
    state.weatherSettings.lastUpdated = null;
  }
  persistWeatherSettings();
  elements.weatherDialog.close();
  renderWeather();
  fetchWeather();
  logActivity("Set the household weather location to " + state.weatherDraft.name, "☀", "settings");
});
$("#removeWeatherLocationButton").addEventListener("click", () => {
  state.weatherSettings = { location: null, units: state.weatherSettings.units || "fahrenheit", lastUpdated: null, forecast: null };
  state.weatherDraft = null;
  persistWeatherSettings();
  elements.weatherDialog.close();
  renderAll();
  logActivity("Removed the household weather location", "☀", "settings");
  showToast("Weather location removed");
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
window.addEventListener("online", () => {
  renderConnection();
  if (state.weatherSettings.location) fetchWeather({ silent: true });
});
window.addEventListener("offline", renderConnection);
window.addEventListener("househelper-sync-status", (event) => {
  renderConnectedDevices(event.detail);
  renderConnection();
});
setInterval(updateClock, 30000);
setInterval(updateIdleCountdown, 1000);
setInterval(checkSleepSchedule, 30000);
setInterval(checkEventReminders, 30000);
setInterval(() => fetchWeather({ silent: true }), 30 * 60 * 1000);
["pointerdown", "keydown", "touchstart"].forEach((eventName) => document.addEventListener(eventName, resetIdleDeadline, { passive: true }));
document.addEventListener("scroll", resetIdleDeadline, { passive: true });
document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-view]");
  if (nav) {
    if (nav.matches("a")) event.preventDefault();
    navigateTo(nav.dataset.view);
  }
});
$$(".settings-tile:not(#settingsLayoutButton):not(#familyMembersButton):not(#profileThemesButton):not(#sleepWakeButton):not(#vacationModeButton):not(#activityButton):not(#googleCalendarButton):not(#languageSettingsTile):not(#connectedDevicesButton):not(#backupButton)").forEach((button) => button.addEventListener("click", () => showToast("This settings panel is not available yet")));

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js?v=" + encodeURIComponent(APP_VERSION), { updateViaCache: "none" }).catch(() => {}));

setupWidgetDragging();
renderMemberControls();
selectProfile(state.profile, { quiet: true });
navigateTo(state.view, { quiet: true });
renderTimer();
if (state.timerRunning) startTimerTicker();
else if (initialTimerSettings.running) persistTimer();
updateClock();
renderStorageStatus();
setTimeout(checkSleepSchedule, 400);
setTimeout(checkEventReminders, 900);
if (state.weatherSettings.location && (!state.weatherSettings.lastUpdated || Date.now() - new Date(state.weatherSettings.lastUpdated).getTime() > 30 * 60 * 1000)) setTimeout(() => fetchWeather({ silent: true }), 1200);
if (SETUP_REQUIRED) setTimeout(openFamilySetup, 0);
