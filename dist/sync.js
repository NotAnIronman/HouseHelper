(function () {
  "use strict";

  const TOKEN_KEY = "hs-pair-token";
  const ROLE_KEY = "hs-device-role";
  const DEVICE_KEY = "hs-device-id";
  const NAME_KEY = "hs-device-name";
  const LOCAL_ONLY_KEYS = new Set(["hh-profile", "hh-reminded-events", "hh-reminder-snoozes"]);
  const params = new URLSearchParams(location.search);
  const incomingToken = params.get("pair");
  const incomingRole = params.get("role");

  if (incomingToken) localStorage.setItem(TOKEN_KEY, incomingToken);
  if (incomingRole === "host" || incomingRole === "secondary") localStorage.setItem(ROLE_KEY, incomingRole);

  const token = localStorage.getItem(TOKEN_KEY) || "";
  const role = localStorage.getItem(ROLE_KEY) || (incomingRole === "host" ? "host" : "secondary");
  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID ? crypto.randomUUID() : "device-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    localStorage.setItem(DEVICE_KEY, deviceId);
  }
  let deviceName = localStorage.getItem(NAME_KEY) || (role === "host" ? "Kitchen tablet" : navigator.platform || "Family device");
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
    inviteUrl: token ? location.origin + "/?pair=" + encodeURIComponent(token) + "#home" : "",
  };
  let lastLocal = new Map();
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

  function changedEntries() {
    const current = sharedSnapshot();
    const changes = [];
    for (const [key, value] of current) if (lastLocal.get(key) !== value) changes.push({ key, value });
    lastLocal = current;
    return changes;
  }

  function dialogIsOpen() {
    return Boolean(document.querySelector("dialog[open]"));
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

  function applyEntries(entries) {
    let changed = false;
    for (const entry of entries || []) {
      if (!entry || typeof entry.key !== "string" || typeof entry.value !== "string" || LOCAL_ONLY_KEYS.has(entry.key)) continue;
      if (localStorage.getItem(entry.key) === entry.value) continue;
      localStorage.setItem(entry.key, entry.value);
      lastLocal.set(entry.key, entry.value);
      changed = true;
    }
    return changed;
  }

  async function request(path, options) {
    const response = await fetch(path, { ...options, cache: "no-store", headers: headers(options && options.headers) });
    if (!response.ok) throw new Error(response.status === 401 ? "Pairing code was rejected" : "Host returned " + response.status);
    return response;
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
    try {
      const entries = await pull(0);
      if (!entries.length && role === "host") {
        lastLocal = sharedSnapshot();
        await push([...lastLocal].map(([key, value]) => ({ key, value })));
      } else if (entries.length) {
        const remoteChanged = applyEntries(entries);
        if (remoteChanged) scheduleReload();
      }
      lastLocal = sharedSnapshot();
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
      const entries = await pull(status.revision);
      const fromOtherDevices = entries.filter((entry) => entry.deviceId !== deviceId);
      if (applyEntries(fromOtherDevices)) {
        status.connected = true;
        status.lastSync = new Date().toISOString();
        dispatch();
        scheduleReload();
        return;
      }
      const changes = changedEntries();
      if (changes.length) await push(changes);
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
    if (!clean) return;
    deviceName = clean;
    status.deviceName = clean;
    localStorage.setItem(NAME_KEY, clean);
    poll();
  }

  function disconnect() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    location.assign(location.origin + location.pathname + "#home");
  }

  window.HouseHelperSync = { status, bootstrap, poll, putMedia, getMedia, deleteMedia, listMediaKeys, rename, disconnect };
  window.addEventListener("DOMContentLoaded", bootstrap, { once: true });
})();
