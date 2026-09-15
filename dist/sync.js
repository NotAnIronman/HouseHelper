(function () {
  "use strict";

  const TOKEN_KEY = "hs-pair-token";
  const ROLE_KEY = "hs-device-role";
  const DEVICE_KEY = "hs-device-id";
  const NAME_KEY = "hs-device-name";
  const BASELINE_KEY = "hs-sync-baseline-v1";
  const CLIENT_VERSION = window.HouseHelperCompat && window.HouseHelperCompat.VERSION || "0.5.0";
  const LOCAL_ONLY_KEYS = new Set(["hh-profile", "hh-language-view", "hh-reminded-events", "hh-reminder-snoozes"]);
  const params = new URLSearchParams(location.search);
  const incomingToken = params.get("pair");
  const incomingRole = params.get("role");
  const isLoopback = /^(127\.0\.0\.1|localhost)$/i.test(location.hostname);

  if (incomingToken) localStorage.setItem(TOKEN_KEY, incomingToken);
  if (incomingRole === "host" || incomingRole === "secondary") localStorage.setItem(ROLE_KEY, incomingRole);
  else if (incomingToken && !isLoopback) localStorage.setItem(ROLE_KEY, "secondary");

  const token = localStorage.getItem(TOKEN_KEY) || "";
  const role = localStorage.getItem(ROLE_KEY) || (incomingRole === "host" ? "host" : "secondary");
  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = window.crypto && typeof window.crypto.randomUUID === "function" ? window.crypto.randomUUID() : "device-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    localStorage.setItem(DEVICE_KEY, deviceId);
  }

  function inferredDeviceName() {
    return window.HouseHelperCompat.inferDeviceName({
      role,
      userAgent: navigator.userAgent || "",
      platform: navigator.userAgentData && navigator.userAgentData.platform || navigator.platform || "",
      maxTouchPoints: navigator.maxTouchPoints || 0,
    });
  }

  const storedDeviceName = localStorage.getItem(NAME_KEY) || "";
  const legacyPlatformName = /^(Linux|Android|Win32|MacIntel)(?:\s|$)/i.test(storedDeviceName);
  let deviceName = storedDeviceName && !legacyPlatformName ? storedDeviceName : inferredDeviceName();
  localStorage.setItem(NAME_KEY, deviceName);

  const status = {
    enabled: Boolean(token),
    connected: false,
    role,
    deviceId,
    deviceName,
    revision: 0,
    clients: [],
    lastSync: null,
    error: "",
    clientVersion: CLIENT_VERSION,
    hostVersion: "",
    inviteUrl: token ? location.origin + "/?pair=" + encodeURIComponent(token) + "&role=secondary&v=" + encodeURIComponent(CLIENT_VERSION) + "#home" : "",
  };
  let baseline = {};
  try { baseline = JSON.parse(localStorage.getItem(BASELINE_KEY) || "{}"); } catch { baseline = {}; }
  if (!baseline || Array.isArray(baseline) || typeof baseline !== "object") baseline = {};
  let observed = new Map();
  const dirtyValues = new Map();
  let observationInitialized = false;
  let polling = false;
  let pendingReload = false;
  let pollTimer = null;

  function dispatch() {
    window.dispatchEvent(new CustomEvent("househelper-sync-status", { detail: { ...status } }));
  }

  function headers(extra) {
    return {
      Authorization: "Bearer " + token,
      "X-HouseHelper-Device": deviceId,
      "X-HouseHelper-Name": encodeURIComponent(deviceName),
      ...extra,
    };
  }

  function sharedSnapshot() {
    const values = new Map();
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith("hh-") && !LOCAL_ONLY_KEYS.has(key)) values.set(key, localStorage.getItem(key));
    }
    return values;
  }

  function fingerprint(value) {
    return window.HouseHelperCompat.sha256Hex(new TextEncoder().encode(String(value)));
  }

  function persistBaseline() {
    try { localStorage.setItem(BASELINE_KEY, JSON.stringify(baseline)); } catch {}
  }

  function markEntriesSynced(entries) {
    for (const entry of entries || []) {
      if (!entry || typeof entry.key !== "string" || typeof entry.value !== "string") continue;
      baseline[entry.key] = fingerprint(entry.value);
      const currentValue = localStorage.getItem(entry.key);
      if (currentValue === entry.value) dirtyValues.delete(entry.key);
      else if (typeof currentValue === "string") dirtyValues.set(entry.key, currentValue);
    }
    persistBaseline();
  }

  function markSnapshotSynced(snapshot) {
    for (const [key, value] of snapshot) baseline[key] = fingerprint(value);
    persistBaseline();
  }

  function pendingChanges() {
    const current = sharedSnapshot();
    for (const [key, value] of current) {
      if (!observationInitialized || observed.get(key) !== value) {
        if (baseline[key] !== fingerprint(value)) dirtyValues.set(key, value);
        else dirtyValues.delete(key);
      }
    }
    observed = current;
    observationInitialized = true;
    const changes = [...dirtyValues].map(([key, value]) => ({ key, value }));
    return { changes, snapshot: current };
  }

  function dialogIsOpen() {
    const dialog = document.querySelector("dialog[open]");
    if (dialog && dialog.id === "familySetupDialog" && dialog.dataset.firstRun === "true" && localStorage.getItem("hh-family-config")) return false;
    return Boolean(dialog);
  }

  function scheduleReload() {
    pendingReload = true;
    const waitForSafeMoment = () => {
      if (!pendingReload) return;
      if (dialogIsOpen()) {
        setTimeout(waitForSafeMoment, 500);
        return;
      }
      pendingReload = false;
      location.reload();
    };
    setTimeout(waitForSafeMoment, 120);
  }

  function applyEntries(entries, protectedKeys) {
    let changed = false;
    const accepted = [];
    for (const entry of entries || []) {
      if (!entry || typeof entry.key !== "string" || typeof entry.value !== "string" || LOCAL_ONLY_KEYS.has(entry.key)) continue;
      if (protectedKeys && protectedKeys.has(entry.key)) continue;
      accepted.push(entry);
      if (localStorage.getItem(entry.key) !== entry.value) {
        localStorage.setItem(entry.key, entry.value);
        changed = true;
      }
    }
    markEntriesSynced(accepted);
    return changed;
  }

  async function request(path, options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    try {
      const response = await fetch(path, { ...options, cache: "no-store", signal: controller.signal, headers: headers(options && options.headers) });
      const hostVersion = response.headers.get("X-HouseHelper-Version");
      if (hostVersion) status.hostVersion = hostVersion;
      if (!response.ok) throw new Error(response.status === 401 ? "Pairing code was rejected" : "Host returned " + response.status);
      return response;
    } catch (error) {
      if (error && error.name === "AbortError") throw new Error("The kitchen tablet did not respond");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function pull(since) {
    const response = await request("./api/sync?since=" + Math.max(0, since || 0));
    const payload = await response.json();
    status.revision = Math.max(status.revision, Number(payload.revision) || 0);
    status.clients = Array.isArray(payload.clients) ? payload.clients : [];
    if (payload.inviteUrl) status.inviteUrl = payload.inviteUrl;
    return payload.entries || [];
  }

  async function push(changes) {
    if (!changes.length) return;
    const response = await request("./api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changes }),
    });
    const payload = await response.json();
    status.revision = Math.max(status.revision, Number(payload.revision) || 0);
    status.clients = Array.isArray(payload.clients) ? payload.clients : status.clients;
    if (payload.inviteUrl) status.inviteUrl = payload.inviteUrl;
  }

  async function bootstrap() {
    if (!status.enabled) {
      dispatch();
      return;
    }
    const hadBaseline = Object.keys(baseline).length > 0;
    let pending;
    if (hadBaseline) pending = pendingChanges();
    else {
      observed = sharedSnapshot();
      observationInitialized = true;
      pending = { changes: [], snapshot: observed };
    }
    const protectedKeys = new Set(pending.changes.map((entry) => entry.key));
    try {
      const entries = await pull(0);
      if (!entries.length && role === "host") {
        const initial = [...pending.snapshot].map(([key, value]) => ({ key, value }));
        await push(initial);
        markEntriesSynced(initial);
      } else {
        const remoteChanged = applyEntries(entries, protectedKeys);
        if (pending.changes.length) {
          await push(pending.changes);
          markEntriesSynced(pending.changes);
        } else if (!hadBaseline) {
          markSnapshotSynced(sharedSnapshot());
        }
        if (remoteChanged) scheduleReload();
      }
      status.connected = true;
      status.error = "";
      status.lastSync = new Date().toISOString();
    } catch (error) {
      status.connected = false;
      status.error = error.message || "Unable to reach the household host";
    }
    dispatch();
    startPolling();
  }

  async function poll() {
    if (polling || !status.enabled || pendingReload) return;
    polling = true;
    try {
      const startingRevision = status.revision;
      const pending = pendingChanges();
      if (pending.changes.length) {
        await push(pending.changes);
        markEntriesSynced(pending.changes);
      }
      const entries = await pull(startingRevision);
      const fromOtherDevices = entries.filter((entry) => entry.deviceId !== deviceId);
      if (applyEntries(fromOtherDevices)) {
        status.connected = true;
        status.lastSync = new Date().toISOString();
        dispatch();
        scheduleReload();
        return;
      }
      status.connected = true;
      status.error = "";
      status.lastSync = new Date().toISOString();
    } catch (error) {
      status.connected = false;
      status.error = error.message || "Household host is unavailable";
    } finally {
      polling = false;
      dispatch();
    }
  }

  function startPolling() {
    clearInterval(pollTimer);
    pollTimer = setInterval(poll, 1200);
  }

  async function putMedia(key, blob) {
    if (!status.enabled || !blob) return false;
    try {
      await request("./api/media/" + encodeURIComponent(key), { method: "PUT", headers: { "Content-Type": blob.type || "application/octet-stream" }, body: blob });
      return true;
    } catch {
      return false;
    }
  }

  async function getMedia(key) {
    if (!status.enabled) return null;
    try {
      const response = await request("./api/media/" + encodeURIComponent(key));
      return await response.blob();
    } catch {
      return null;
    }
  }

  async function deleteMedia(key) {
    if (!status.enabled) return false;
    try {
      await request("./api/media/" + encodeURIComponent(key), { method: "DELETE" });
      return true;
    } catch {
      return false;
    }
  }

  async function listMediaKeys() {
    if (!status.enabled) return [];
    try {
      const response = await request("./api/media");
      const payload = await response.json();
      return Array.isArray(payload.keys) ? payload.keys : [];
    } catch {
      return [];
    }
  }

  function rename(name) {
    const clean = String(name || "").trim().slice(0, 50);
    if (!clean) return false;
    deviceName = clean;
    status.deviceName = clean;
    localStorage.setItem(NAME_KEY, clean);
    dispatch();
    poll();
    return true;
  }

  function disconnect() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    location.assign(location.origin + location.pathname + "#home");
  }

  window.HouseHelperSync = { CLIENT_VERSION, status, bootstrap, poll, putMedia, getMedia, deleteMedia, listMediaKeys, rename, disconnect };
  window.addEventListener("online", poll);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) poll(); });
  window.addEventListener("DOMContentLoaded", bootstrap, { once: true });
})();
