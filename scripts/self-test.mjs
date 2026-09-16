import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import vm from "node:vm";

const root = fileURLToPath(new URL("../", import.meta.url));
await import(new URL("../dist/compat.js", import.meta.url));
await import(new URL("../dist/qr.js", import.meta.url));
await import(new URL("../dist/languages.js", import.meta.url));
await import(new URL("../dist/language-german-b1.js", import.meta.url));
await import(new URL("../dist/language-korean-b1.js", import.meta.url));
await import(new URL("../dist/language-world.js", import.meta.url));
await import(new URL("../dist/language-more.js", import.meta.url));
const compat = globalThis.HouseHelperCompat;
const languagePacks = globalThis.HouseHelperLanguagePacks.packs;

assert.equal(compat.VERSION, "0.7.0");
assert.ok(languagePacks.every((pack) => pack.cefrMax === "B1" && pack.modules.some((module) => module.level === "B1")), "every course must ship with a B1-preparation path");
assert.deepEqual(languagePacks.map((pack) => pack.id), ["german", "korean", "spanish", "french", "japanese", "italian", "mandarin"], "the complete offline course catalog must load in a stable order");
const languageCards = languagePacks.flatMap((pack) => pack.modules.flatMap((module) => module.cards));
assert.equal(languageCards.length, 1652, "offline language library must retain its full curriculum");
assert.equal(new Set(languageCards.map((card) => card.id)).size, languageCards.length, "language card IDs must be globally unique");
assert.ok(languagePacks.every((pack) => Array.isArray(pack.levels) && pack.levels.length && pack.modules.every((module) => pack.levels.includes(module.level))), "every language module must have a supported course level");
assert.ok(languageCards.every((card) => card.level && card.kind && card.prompt && card.answer), "every language card must include level, type, prompt, and answer metadata");
const qr = globalThis.HouseHelperQR.create("http://192.168.1.2:4173/?pair=test-token&role=secondary#home");
assert.ok(Array.isArray(qr) && qr.length >= 21 && qr.every((row) => row.length === qr.length && row.every((cell) => typeof cell === "boolean")), "pairing QR generator must return a square boolean matrix");
assert.deepEqual(globalThis.HouseHelperQR.create("http://192.168.1.2:4173/?pair=test-token&role=secondary#home"), qr, "pairing QR output must be deterministic");
for (const [person, code] of [["adult-a", "1234"], ["caregiver-b", "0000"], ["adult-a", "9876"]]) {
  const source = `HouseHelper:${person}:${code}:local-parent`;
  const expected = createHash("sha256").update(source).digest("hex");
  assert.equal(compat.sha256Hex(new TextEncoder().encode(source)), expected, "insecure-LAN passcode hashing must match SHA-256");
  assert.equal(await compat.hashPasscode(person, code), expected, "Web Crypto and fallback hashes must agree");
}

assert.equal(compat.inferDeviceName({ role: "host" }), "Kitchen tablet");
assert.equal(compat.inferDeviceName({ userAgent: "Mozilla/5.0 (Linux; Android 16; SM-S938U Build/X) AppleWebKit Mobile", platform: "Linux armv8l", maxTouchPoints: 5 }), "Galaxy S25 Ultra");
assert.equal(compat.inferDeviceName({ userAgent: "Mozilla/5.0 (Linux; Android 16; SM-F966B Build/X) AppleWebKit Mobile", platform: "Linux armv8l", maxTouchPoints: 5 }), "Galaxy Z Fold7");
assert.equal(compat.inferDeviceName({ userAgent: "Mozilla/5.0", platform: "Linux armv8l", maxTouchPoints: 5 }), "Android device");
assert.equal(compat.inferDeviceName({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS)", platform: "iPhone", maxTouchPoints: 5 }), "iPhone");

const html = await readFile(join(root, "dist", "index.html"), "utf8");
const app = await readFile(join(root, "dist", "app.js"), "utf8");
const readme = await readFile(join(root, "README.md"), "utf8");
const sync = await readFile(join(root, "dist", "sync.js"), "utf8");
const worker = await readFile(join(root, "dist", "service-worker.js"), "utf8");
const gradle = await readFile(join(root, "android-host", "app", "build.gradle"), "utf8");
const server = await readFile(join(root, "android-host", "app", "src", "main", "java", "com", "househelper", "familydashboard", "HouseholdServer.java"), "utf8");
const manifest = await readFile(join(root, "android-host", "app", "src", "main", "AndroidManifest.xml"), "utf8");
const filePaths = await readFile(join(root, "android-host", "app", "src", "main", "res", "xml", "file_paths.xml"), "utf8");
const mainActivity = await readFile(join(root, "android-host", "app", "src", "main", "java", "com", "househelper", "familydashboard", "MainActivity.java"), "utf8");

assert.match(html, /id="passcodeForm" novalidate/);
assert.match(html, /id="unlockButton" type="button"/);
assert.match(html, /id="saveDeviceNameButton" type="button"/);
assert.match(html, /id="familySetupDialog"/);
assert.match(html, /id="adultMemberEditors"/);
assert.match(html, /id="childMemberEditors"/);
assert.match(html, /data-app-view="fun"/);
assert.match(html, /data-app-view="learning"/);
assert.match(html, /id="languageSessionDialog"/);
assert.match(html, /id="continueLanguageButton"/);
assert.match(html, /id="redoDialog"/);
assert.match(html, /id="evidenceViewerDialog"/);
assert.match(html, /id="listIdentityDialog"/);
assert.match(html, /id="weatherDialog"/);
assert.match(html, /id="pairingQrCode"/);
assert.match(html, /id="chorePhoto"[^>]*multiple/);
assert.doesNotMatch(html, /id="chorePhoto"[^>]*capture=/, "chore photos must offer both the camera and the file picker");
for (const id of ["choreFormTitle", "saveChoreButton", "habitFormTitle", "saveHabitButton", "listEditDialog", "artEditDialog", "editBeforeEvidenceButton", "editAfterEvidenceButton", "alarmDialog", "householdAlertsDialog", "calendarViewSwitcher", "quickPointTabs", "calmTaskWarning"]) assert.match(html, new RegExp('id="' + id + '"'));
assert.doesNotMatch(html + app + readme, new RegExp("[\\u2014\\u2013\\u2011]"), "user-facing copy must not contain long dash characters");
assert.doesNotMatch(html, /\bAI\b/, "the interface must use direct product language");
for (const asset of ["qr", "languages", "language-german-b1", "language-korean-b1", "language-world", "language-more", "app", "sync"]) {
  assert.match(html, new RegExp(asset + "\\.js\\?v=0\\.7\\.0"), asset + " must be loaded by the dashboard");
  assert.match(worker, new RegExp(asset + "\\.js\\?v=0\\.7\\.0"), asset + " must be available offline");
}
assert.match(worker, /url\.pathname\.startsWith\("\/api\/"\)/, "service worker must never cache household API responses");
assert.match(app, /updateViaCache:\s*"none"/, "service worker updates must bypass stale HTTP caches");
assert.match(sync, /hs-sync-baseline-v1/, "sync baseline must survive reloads so offline edits can retry");
assert.match(sync, /markEntriesSynced\(pending\.changes\)/, "local edits must be marked synced only after a successful push");
assert.match(sync, /familySetupDialog[\s\S]*hh-family-config/, "a new secondary must reload after receiving household setup from its host");
assert.match(sync, /LOCAL_ONLY_KEYS[\s\S]*hh-language-view/, "the learner currently using a screen must stay device-specific");
assert.match(app, /RETENTION_INTERVALS = \[0, 1, 3, 7, 14, 30, 60\]/, "language reviews must use spaced intervals across different days");
assert.match(app, /record\.lastReviewDate !== today/, "same-day repetition must not advance a language card more than once");
assert.match(app, /record\.correctDays\.length >= 5[\s\S]*daysBetween/, "mastery must require recall across at least five days and a multi-week span");
assert.match(app, /sameKind[\s\S]*sameLevel[\s\S]*ranked/, "quiz distractors must prefer the same card type and course level");
assert.match(app, /existingLanguageCardProgress/, "viewing the expanded catalog must not create empty progress records");
assert.match(app, /retained >= 1 \|\| introduced >= Math\.min\(3/, "a learner must unlock the next module after trying three cards in the previous one");
assert.match(app, /reviewReason/);
assert.match(app, /chore\.id \+ ":feedback"/);
assert.match(app, /const MAX_CHORE_PHOTOS = 6/);
assert.match(app, /record\[phase \+ "Photos"\]/, "multi-photo metadata must be stored with each chore phase");
assert.match(app, /jpegTakenAt/, "JPEG camera timestamps must be read when available");
assert.match(app, /file\.arrayBuffer\(\)/, "selected Android content must be copied before the temporary picker URI is released");
assert.match(app, /optimizeEvidencePhoto\(selected\.blob\)/, "photo saving must use the app-owned copy");
assert.match(app, /withTimeout\(saveEvidence\(key, blob\)/, "photo storage must never leave the interface saving forever");
assert.match(app, /data-edit-chore/);
assert.match(app, /data-edit-habit/);
assert.match(app, /data-edit-list/);
assert.match(app, /data-edit-reward/);
assert.match(app, /saveEditedEvidence/, "saved chore photos must be editable without recreating the chore");
assert.match(app, /data-list-identity/);
assert.match(app, /api\.open-meteo\.com\/v1\/forecast/);
assert.match(app, /geocoding-api\.open-meteo\.com\/v1\/search/);
assert.match(app, /beginWidgetHold/);
assert.match(app, /HouseHelperQR\.toCanvas/);
assert.match(app, /assignmentMode === "everyone"/);
assert.match(app, /chore\.repeat === "alternate"/);
assert.match(app, /chore\.repeat === "custom"/);
assert.match(app, /canAdultApproveChore/);
assert.match(app, /data-quick-points/);
assert.match(app, /calendarMode/);
assert.match(app, /refundClaim/);
assert.match(app, /hs-device-alerts/, "alerts must be tracked independently on every connected device");
assert.match(gradle, /versionName = "0\.7\.0"/);
assert.match(gradle, /androidx\.core:core/, "Android FileProvider support must be packaged");
assert.match(server, /APP_VERSION = "0\.7\.0"/);
assert.match(manifest, /android\.permission\.ACCESS_COARSE_LOCATION/);
assert.match(manifest, /androidx\.core\.content\.FileProvider/);
assert.match(filePaths, /cache-path name="camera" path="camera\/"/);
assert.match(mainActivity, /onGeolocationPermissionsShowPrompt/);
assert.match(mainActivity, /setGeolocationEnabled\(true\)/);
assert.match(mainActivity, /MODE_OPEN_MULTIPLE/);
assert.match(mainActivity, /getClipData\(\)/, "Android multi-file results must retain every selected URI");
assert.match(mainActivity, /pendingCameraFile\.length\(\) > 0/, "empty camera results must never be returned to the WebView");
assert.match(mainActivity, /TextToSpeech/, "Android must provide a native language speech fallback");
assert.match(mainActivity, /public boolean speakText/, "the native speech bridge must be callable from the dashboard");
assert.match(mainActivity, /public void notify/, "the native notification bridge must alert the host tablet");
assert.match(app, /const DEFAULT_CHORES = \[\];/);
assert.match(app, /const DEFAULT_ARTWORKS = \[\];/);
assert.match(app, /const DEFAULT_EVENTS = \[\];/);
assert.match(app, /const DEFAULT_HABITS = \[\];/);
assert.match(app, /const DEFAULT_LIST_ITEMS = \[\];/);

const referencedIds = [...app.matchAll(/\$\("#([A-Za-z][\w:-]*)"\)/g)].map((match) => match[1]);
const dynamicIds = new Set([...app.matchAll(/\.id\s*=\s*["']([A-Za-z][\w:-]*)["']/g)].map((match) => match[1]));
const missingIds = [...new Set(referencedIds)].filter((id) => !dynamicIds.has(id) && !new RegExp(`id=["']${id}["']`).test(html));
assert.deepEqual(missingIds, [], "every direct element lookup must exist in index.html");

function memoryStorage(initial) {
  const values = new Map(Object.entries(initial));
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

const oldValue = '{"message":"before going offline"}';
const offlineValue = '{"message":"saved while the host was away"}';
const storage = memoryStorage({
  "hs-pair-token": "test-token",
  "hs-device-role": "secondary",
  "hs-device-id": "test-phone",
  "hs-device-name": "Linux armv8l",
  "hs-sync-baseline-v1": JSON.stringify({ "hh-offline-test": compat.sha256Hex(new TextEncoder().encode(oldValue)) }),
  "hh-offline-test": offlineValue,
});
let online = false;
let pushedChanges = [];
const context = {
  AbortController,
  CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options && options.detail; } },
  Map,
  Set,
  TextEncoder,
  URLSearchParams,
  clearInterval() {},
  clearTimeout,
  console,
  crypto: { randomUUID: () => "test-device" },
  document: { hidden: false, addEventListener() {}, querySelector: () => null },
  fetch: async (path, options = {}) => {
    if (!online) throw new TypeError("host offline");
    if (options.method === "POST") pushedChanges.push(...JSON.parse(options.body).changes);
    const payload = options.method === "POST"
      ? { revision: 1, clients: [], inviteUrl: "http://192.168.1.2:4173/?pair=test-token&role=secondary#home" }
      : { revision: 1, entries: [], clients: [], inviteUrl: "http://192.168.1.2:4173/?pair=test-token&role=secondary#home" };
    return { ok: true, status: 200, headers: { get: (name) => name === "X-HouseHelper-Version" ? "0.7.0" : null }, json: async () => payload };
  },
  localStorage: storage,
  location: { hostname: "192.168.1.2", origin: "http://192.168.1.2:4173", pathname: "/", search: "?pair=test-token", reload() {}, assign() {} },
  navigator: { userAgent: "Mozilla/5.0", platform: "Linux armv8l", maxTouchPoints: 5 },
  setInterval: () => 1,
  setTimeout,
};
context.window = context;
context.HouseHelperCompat = compat;
context.addEventListener = () => {};
context.dispatchEvent = () => {};
vm.runInNewContext(sync, context, { filename: "dist/sync.js" });
await context.HouseHelperSync.bootstrap();
assert.equal(context.HouseHelperSync.status.connected, false, "offline bootstrap should remain usable");
online = true;
await context.HouseHelperSync.poll();
assert.deepEqual(JSON.parse(JSON.stringify(pushedChanges)), [{ key: "hh-offline-test", value: offlineValue }], "an offline edit must retry after a page reload");
assert.equal(context.HouseHelperSync.status.connected, true);
assert.equal(context.HouseHelperSync.status.deviceName, "Android device", "legacy Linux platform labels must migrate");
assert.equal(context.HouseHelperSync.status.role, "secondary");

console.log(`HouseHelper self-test passed: ${referencedIds.length} UI references, ${languageCards.length} offline language cards, spaced retention rules, passcodes, device identity, offline retry, and build versions.`);
