import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import vm from "node:vm";

const root = fileURLToPath(new URL("../", import.meta.url));
await import(new URL("../dist/compat.js", import.meta.url));
const compat = globalThis.HouseHelperCompat;

assert.equal(compat.VERSION, "0.3.0");
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
const sync = await readFile(join(root, "dist", "sync.js"), "utf8");
const worker = await readFile(join(root, "dist", "service-worker.js"), "utf8");
const gradle = await readFile(join(root, "android-host", "app", "build.gradle"), "utf8");
const server = await readFile(join(root, "android-host", "app", "src", "main", "java", "com", "househelper", "familydashboard", "HouseholdServer.java"), "utf8");

assert.match(html, /id="passcodeForm" novalidate/);
assert.match(html, /id="unlockButton" type="button"/);
assert.match(html, /id="saveDeviceNameButton" type="button"/);
assert.match(html, /id="familySetupDialog"/);
assert.match(html, /id="adultMemberEditors"/);
assert.match(html, /id="childMemberEditors"/);
assert.match(html, /data-app-view="fun"/);
assert.match(html, /compat\.js\?v=0\.3\.0/);
assert.match(worker, /compat\.js\?v=0\.3\.0/);
assert.match(worker, /url\.pathname\.startsWith\("\/api\/"\)/, "service worker must never cache household API responses");
assert.match(app, /updateViaCache:\s*"none"/, "service worker updates must bypass stale HTTP caches");
assert.match(sync, /hs-sync-baseline-v1/, "sync baseline must survive reloads so offline edits can retry");
assert.match(sync, /markEntriesSynced\(pending\.changes\)/, "local edits must be marked synced only after a successful push");
assert.match(sync, /familySetupDialog[\s\S]*hh-family-config/, "a new secondary must reload after receiving household setup from its host");
assert.match(gradle, /versionName = "0\.3\.0"/);
assert.match(server, /APP_VERSION = "0\.3\.0"/);
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
    return { ok: true, status: 200, headers: { get: (name) => name === "X-HouseHelper-Version" ? "0.3.0" : null }, json: async () => payload };
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

console.log(`HouseHelper self-test passed: ${referencedIds.length} UI references, passcodes, device identity, offline retry, and build versions.`);
