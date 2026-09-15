import { createHash, randomBytes } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const APP_VERSION = "0.2.0";
const webRoot = join(projectRoot, "dist");
const dataRoot = join(projectRoot, ".househelper");
const mediaRoot = join(dataRoot, "media");
const statePath = join(dataRoot, "lan-state.json");
const portArgument = process.argv.find((argument) => argument.startsWith("--port="));
const port = Number(portArgument ? portArgument.slice("--port=".length) : process.env.PORT || 4173);
const bindAddress = process.env.HOST || "0.0.0.0";
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};
const responseHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "X-HouseHelper-Version": APP_VERSION,
};

mkdirSync(mediaRoot, { recursive: true });

function freshState() {
  return { product: "HouseHelper LAN", version: 1, token: randomBytes(18).toString("base64url"), revision: 0, entries: {}, media: {} };
}

function loadState() {
  try {
    const stored = JSON.parse(readFileSync(statePath, "utf8"));
    if (stored && stored.product === "HouseHelper LAN" && stored.token) return { ...freshState(), ...stored };
  } catch {}
  return freshState();
}

let household = loadState();
const clients = new Map();
let saveTimer = null;

function persistSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    mkdirSync(dirname(statePath), { recursive: true });
    writeFileSync(statePath, JSON.stringify(household, null, 2));
  }, 80);
}

function json(response, status, value, headers = {}) {
  response.writeHead(status, { ...responseHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  response.end(JSON.stringify(value));
}

function pairingToken(request, url) {
  const header = request.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : url.searchParams.get("pair") || "";
}

function authorize(request, response, url) {
  if (pairingToken(request, url) !== household.token) {
    json(response, 401, { error: "Pairing code required" });
    return false;
  }
  const deviceId = String(request.headers["x-househelper-device"] || "unknown").slice(0, 100);
  let deviceName = String(request.headers["x-househelper-name"] || "HouseHelper device").slice(0, 100);
  try { deviceName = decodeURIComponent(deviceName); } catch {}
  clients.set(deviceId, { id: deviceId, name: deviceName, lastSeen: Date.now() });
  return true;
}

function activeClients() {
  const cutoff = Date.now() - 30_000;
  for (const [id, client] of clients) if (client.lastSeen < cutoff) clients.delete(id);
  return [...clients.values()].map((client) => ({ id: client.id, name: client.name, lastSeen: new Date(client.lastSeen).toISOString() }));
}

function lanAddresses() {
  const addresses = [];
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries || []) if (entry.family === "IPv4" && !entry.internal) addresses.push(entry.address);
  }
  return addresses;
}

function inviteUrlFor(request) {
  const requestHost = String(request.headers.host || "");
  const hostname = requestHost.replace(/^\[/, "").split(/\]:|:/)[0];
  const publicHost = hostname === "127.0.0.1" || hostname === "localhost" ? (lanAddresses()[0] || hostname) + ":" + port : requestHost;
  return "http://" + publicHost + "/?pair=" + encodeURIComponent(household.token) + "&role=secondary&v=" + APP_VERSION + "#home";
}

function readBody(request, limit = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("Request is too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function mediaFile(key) {
  return join(mediaRoot, createHash("sha256").update(key).digest("hex") + ".bin");
}

async function handleApi(request, response, url) {
  if (url.pathname === "/api/health") {
    json(response, 200, { product: "HouseHelper LAN", version: APP_VERSION, revision: household.revision, pairedDevices: activeClients().length });
    return true;
  }
  if (!url.pathname.startsWith("/api/")) return false;
  if (!authorize(request, response, url)) return true;

  if (url.pathname === "/api/sync" && request.method === "GET") {
    const since = Math.max(0, Number(url.searchParams.get("since")) || 0);
    const entries = Object.entries(household.entries)
      .map(([key, entry]) => ({ key, ...entry }))
      .filter((entry) => entry.revision > since);
    json(response, 200, { revision: household.revision, entries, clients: activeClients(), inviteUrl: inviteUrlFor(request) });
    return true;
  }

  if (url.pathname === "/api/sync" && request.method === "POST") {
    try {
      const payload = JSON.parse((await readBody(request)).toString("utf8"));
      const deviceId = String(request.headers["x-househelper-device"] || "unknown").slice(0, 100);
      const changes = Array.isArray(payload.changes) ? payload.changes : [];
      let accepted = 0;
      for (const change of changes) {
        if (!change || typeof change.key !== "string" || !change.key.startsWith("hh-") || typeof change.value !== "string") continue;
        if (change.value.length > 10 * 1024 * 1024) continue;
        household.revision += 1;
        household.entries[change.key] = { value: change.value, revision: household.revision, deviceId, updatedAt: new Date().toISOString() };
        accepted += 1;
      }
      persistSoon();
      json(response, 200, { revision: household.revision, accepted, clients: activeClients(), inviteUrl: inviteUrlFor(request) });
    } catch (error) {
      json(response, 400, { error: error.message || "Invalid synchronization request" });
    }
    return true;
  }

  if (url.pathname === "/api/media" && request.method === "GET") {
    json(response, 200, { keys: Object.keys(household.media), media: household.media });
    return true;
  }

  if (url.pathname.startsWith("/api/media/")) {
    const key = decodeURIComponent(url.pathname.slice("/api/media/".length));
    if (!key || key.length > 300) {
      json(response, 400, { error: "Invalid media key" });
      return true;
    }
    const path = mediaFile(key);
    if (request.method === "PUT") {
      try {
        const body = await readBody(request, 30 * 1024 * 1024);
        await writeFile(path, body);
        household.media[key] = { type: String(request.headers["content-type"] || "application/octet-stream"), size: body.length, updatedAt: new Date().toISOString() };
        persistSoon();
        json(response, 200, { saved: true, size: body.length });
      } catch (error) {
        json(response, 400, { error: error.message || "Unable to save media" });
      }
      return true;
    }
    if (request.method === "GET") {
      const metadata = household.media[key];
      if (!metadata || !existsSync(path)) {
        json(response, 404, { error: "Media not found" });
        return true;
      }
      response.writeHead(200, { ...responseHeaders, "Content-Type": metadata.type || "application/octet-stream", "Content-Length": statSync(path).size, "Cache-Control": "private, max-age=3600" });
      createReadStream(path).pipe(response);
      return true;
    }
    if (request.method === "DELETE") {
      try { await unlink(path); } catch {}
      delete household.media[key];
      persistSoon();
      json(response, 200, { deleted: true });
      return true;
    }
  }

  json(response, 404, { error: "Not found" });
  return true;
}

function serveStatic(request, response, url) {
  const safePath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(webRoot, safePath === "/" ? "index.html" : safePath);
  if (!filePath.startsWith(webRoot) || !existsSync(filePath) || statSync(filePath).isDirectory()) filePath = join(webRoot, "index.html");
  response.writeHead(200, {
    ...responseHeaders,
    "Content-Type": types[extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  const stream = createReadStream(filePath);
  stream.on("error", () => response.end("Unable to load HouseHelper."));
  stream.pipe(response);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  try {
    if (await handleApi(request, response, url)) return;
    serveStatic(request, response, url);
  } catch (error) {
    if (!response.headersSent) json(response, 500, { error: error.message || "Host error" });
    else response.end();
  }
});

server.listen(port, bindAddress, () => {
  const addresses = lanAddresses();
  console.log("HouseHelper LAN host is ready.");
  console.log(`Host dashboard: http://127.0.0.1:${port}/?pair=${household.token}&role=host&v=${APP_VERSION}#home`);
  for (const address of addresses) console.log(`Pair another device: http://${address}:${port}/?pair=${household.token}&role=secondary&v=${APP_VERSION}#home`);
  console.log("Keep this window open while secondary devices are connected.");
});

process.on("SIGINT", () => {
  if (saveTimer) clearTimeout(saveTimer);
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, JSON.stringify(household, null, 2));
  server.close(() => process.exit(0));
});
