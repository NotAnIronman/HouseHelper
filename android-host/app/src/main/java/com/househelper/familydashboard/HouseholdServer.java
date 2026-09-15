package com.househelper.familydashboard;

import android.content.Context;
import android.content.res.AssetManager;
import android.net.Uri;
import android.util.AtomicFile;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class HouseholdServer {
    public static final String APP_VERSION = "0.5.0";
    private static final int MAX_SYNC_BYTES = 12 * 1024 * 1024;
    private static final int MAX_MEDIA_BYTES = 30 * 1024 * 1024;
    private static final long ACTIVE_CLIENT_MS = 30_000L;

    private final Context context;
    private final int port;
    private final Object stateLock = new Object();
    private final ExecutorService workers = Executors.newFixedThreadPool(8);
    private final Map<String, ClientRecord> clients = new ConcurrentHashMap<>();
    private final File dataRoot;
    private final File mediaRoot;
    private final File stateFile;

    private volatile boolean running;
    private volatile ServerSocket serverSocket;
    private JSONObject state;

    public HouseholdServer(Context context, int port) {
        this.context = context.getApplicationContext();
        this.port = port;
        dataRoot = new File(this.context.getFilesDir(), "household");
        mediaRoot = new File(dataRoot, "media");
        stateFile = new File(dataRoot, "lan-state.json");
        if (!mediaRoot.exists() && !mediaRoot.mkdirs()) {
            throw new IllegalStateException("Unable to create HouseHelper storage");
        }
        state = loadState();
        if (!stateFile.exists()) {
            synchronized (stateLock) {
                try {
                    persistStateLocked();
                } catch (IOException error) {
                    throw new IllegalStateException("Unable to initialize HouseHelper storage", error);
                }
            }
        }
    }

    public void start() throws IOException {
        if (running) return;
        ServerSocket socket = new ServerSocket();
        socket.setReuseAddress(true);
        socket.bind(new InetSocketAddress("0.0.0.0", port));
        serverSocket = socket;
        running = true;
        Thread acceptThread = new Thread(this::acceptLoop, "househelper-host");
        acceptThread.setDaemon(true);
        acceptThread.start();
    }

    public void stop() {
        running = false;
        ServerSocket socket = serverSocket;
        serverSocket = null;
        if (socket != null) {
            try {
                socket.close();
            } catch (IOException ignored) {
            }
        }
        workers.shutdownNow();
    }

    public boolean isRunning() {
        return running;
    }

    public int getPort() {
        return port;
    }

    public String getToken() {
        synchronized (stateLock) {
            return state.optString("token");
        }
    }

    public String getHostDashboardUrl() {
        return "http://127.0.0.1:" + port + "/?pair=" + Uri.encode(getToken()) + "&role=host&v=" + APP_VERSION + "#home";
    }

    public String getPairingUrl() {
        return "http://" + bestLanAddress() + ":" + port + "/?pair=" + Uri.encode(getToken()) + "&role=secondary&v=" + APP_VERSION + "#home";
    }

    private void acceptLoop() {
        while (running) {
            try {
                Socket socket = serverSocket.accept();
                socket.setSoTimeout(20_000);
                workers.execute(() -> handleSocket(socket));
            } catch (IOException error) {
                if (running) error.printStackTrace();
            }
        }
    }

    private void handleSocket(Socket socket) {
        try (Socket client = socket;
             InputStream rawInput = new BufferedInputStream(client.getInputStream());
             OutputStream output = new BufferedOutputStream(client.getOutputStream())) {
            Request request = Request.read(rawInput);
            if (request == null) return;
            route(request, rawInput, output);
        } catch (Exception error) {
            try {
                OutputStream output = socket.getOutputStream();
                sendJson(output, 500, new JSONObject().put("error", "HouseHelper host error"));
                output.close();
            } catch (Exception ignored) {
            }
        }
    }

    private void route(Request request, InputStream input, OutputStream output) throws Exception {
        Uri uri = Uri.parse("http://localhost" + request.target);
        String path = uri.getPath() == null ? "/" : uri.getPath();

        if ("/api/health".equals(path)) {
            JSONObject response = new JSONObject();
            synchronized (stateLock) {
                response.put("product", "HouseHelper LAN");
                response.put("revision", state.optLong("revision", 0));
            }
            response.put("version", APP_VERSION);
            response.put("pairedDevices", activeClients().length());
            sendJson(output, 200, response);
            return;
        }

        if (path.startsWith("/api/")) {
            if (!authorize(request, uri, output)) return;
            if ("/api/sync".equals(path) && "GET".equals(request.method)) {
                handleSyncGet(uri, request, output);
                return;
            }
            if ("/api/sync".equals(path) && "POST".equals(request.method)) {
                handleSyncPost(request, input, output);
                return;
            }
            if ("/api/media".equals(path) && "GET".equals(request.method)) {
                handleMediaList(output);
                return;
            }
            if (path.startsWith("/api/media/")) {
                String key = URLDecoder.decode(path.substring("/api/media/".length()), "UTF-8");
                handleMedia(key, request, input, output);
                return;
            }
            sendJson(output, 404, new JSONObject().put("error", "Not found"));
            return;
        }

        if (!"GET".equals(request.method) && !"HEAD".equals(request.method)) {
            sendJson(output, 405, new JSONObject().put("error", "Method not allowed"));
            return;
        }
        serveAsset(path, "HEAD".equals(request.method), output);
    }

    private boolean authorize(Request request, Uri uri, OutputStream output) throws Exception {
        String authorization = request.header("authorization");
        String supplied = authorization.startsWith("Bearer ") ? authorization.substring(7) : uri.getQueryParameter("pair");
        if (supplied == null || !constantTimeEquals(supplied, getToken())) {
            sendJson(output, 401, new JSONObject().put("error", "Pairing code required"));
            return false;
        }

        String id = limit(request.header("x-househelper-device"), 100, "unknown");
        String encodedName = limit(request.header("x-househelper-name"), 300, "HouseHelper device");
        String name;
        try {
            name = URLDecoder.decode(encodedName, "UTF-8");
        } catch (IllegalArgumentException error) {
            name = encodedName;
        }
        clients.put(id, new ClientRecord(id, limit(name, 100, "HouseHelper device"), System.currentTimeMillis()));
        return true;
    }

    private void handleSyncGet(Uri uri, Request request, OutputStream output) throws Exception {
        long since = 0;
        try {
            since = Math.max(0, Long.parseLong(uri.getQueryParameter("since")));
        } catch (Exception ignored) {
        }

        JSONObject response = new JSONObject();
        JSONArray entries = new JSONArray();
        synchronized (stateLock) {
            JSONObject storedEntries = state.optJSONObject("entries");
            if (storedEntries != null) {
                JSONArray names = storedEntries.names();
                for (int index = 0; names != null && index < names.length(); index += 1) {
                    String key = names.optString(index);
                    JSONObject entry = storedEntries.optJSONObject(key);
                    if (entry == null || entry.optLong("revision", 0) <= since) continue;
                    JSONObject copy = new JSONObject(entry.toString());
                    copy.put("key", key);
                    entries.put(copy);
                }
            }
            response.put("revision", state.optLong("revision", 0));
        }
        response.put("entries", entries);
        response.put("clients", activeClients());
        response.put("inviteUrl", inviteUrlFor(request));
        sendJson(output, 200, response);
    }

    private void handleSyncPost(Request request, InputStream input, OutputStream output) throws Exception {
        byte[] body = readBody(input, request, MAX_SYNC_BYTES);
        JSONObject payload;
        try {
            payload = new JSONObject(new String(body, StandardCharsets.UTF_8));
        } catch (Exception error) {
            sendJson(output, 400, new JSONObject().put("error", "Invalid synchronization request"));
            return;
        }

        JSONArray changes = payload.optJSONArray("changes");
        String deviceId = limit(request.header("x-househelper-device"), 100, "unknown");
        int accepted = 0;
        synchronized (stateLock) {
            JSONObject entries = state.optJSONObject("entries");
            if (entries == null) {
                entries = new JSONObject();
                state.put("entries", entries);
            }
            for (int index = 0; changes != null && index < changes.length(); index += 1) {
                JSONObject change = changes.optJSONObject(index);
                if (change == null) continue;
                String key = change.optString("key", "");
                Object rawValue = change.opt("value");
                if (!key.startsWith("hh-") || !(rawValue instanceof String)) continue;
                String value = (String) rawValue;
                if (key.length() > 300 || value.length() > 10 * 1024 * 1024) continue;

                long revision = state.optLong("revision", 0) + 1;
                state.put("revision", revision);
                JSONObject entry = new JSONObject();
                entry.put("value", value);
                entry.put("revision", revision);
                entry.put("deviceId", deviceId);
                entry.put("updatedAt", isoNow());
                entries.put(key, entry);
                accepted += 1;
            }
            if (accepted > 0) persistStateLocked();
        }

        JSONObject response = new JSONObject();
        synchronized (stateLock) {
            response.put("revision", state.optLong("revision", 0));
        }
        response.put("accepted", accepted);
        response.put("clients", activeClients());
        response.put("inviteUrl", inviteUrlFor(request));
        sendJson(output, 200, response);
    }

    private void handleMediaList(OutputStream output) throws Exception {
        JSONObject response = new JSONObject();
        synchronized (stateLock) {
            JSONObject media = state.optJSONObject("media");
            response.put("keys", media == null || media.names() == null ? new JSONArray() : media.names());
            response.put("media", media == null ? new JSONObject() : new JSONObject(media.toString()));
        }
        sendJson(output, 200, response);
    }

    private void handleMedia(String key, Request request, InputStream input, OutputStream output) throws Exception {
        if (key.isEmpty() || key.length() > 300) {
            sendJson(output, 400, new JSONObject().put("error", "Invalid media key"));
            return;
        }
        File file = new File(mediaRoot, sha256(key) + ".bin");

        if ("PUT".equals(request.method)) {
            byte[] body;
            try {
                body = readBody(input, request, MAX_MEDIA_BYTES);
            } catch (IOException error) {
                sendJson(output, 413, new JSONObject().put("error", "Media is too large"));
                return;
            }
            writeAtomically(file, body);
            synchronized (stateLock) {
                JSONObject media = state.optJSONObject("media");
                if (media == null) {
                    media = new JSONObject();
                    state.put("media", media);
                }
                JSONObject metadata = new JSONObject();
                metadata.put("type", limit(request.header("content-type"), 200, "application/octet-stream"));
                metadata.put("size", body.length);
                metadata.put("updatedAt", isoNow());
                media.put(key, metadata);
                persistStateLocked();
            }
            sendJson(output, 200, new JSONObject().put("saved", true).put("size", body.length));
            return;
        }

        if ("GET".equals(request.method)) {
            JSONObject metadata;
            synchronized (stateLock) {
                JSONObject media = state.optJSONObject("media");
                metadata = media == null ? null : media.optJSONObject(key);
                if (metadata != null) metadata = new JSONObject(metadata.toString());
            }
            if (metadata == null || !file.exists()) {
                sendJson(output, 404, new JSONObject().put("error", "Media not found"));
                return;
            }
            Map<String, String> headers = new HashMap<>();
            headers.put("Content-Type", metadata.optString("type", "application/octet-stream"));
            headers.put("Content-Length", String.valueOf(file.length()));
            headers.put("Cache-Control", "private, max-age=3600");
            sendHeaders(output, 200, headers);
            try (InputStream fileInput = new FileInputStream(file)) {
                copy(fileInput, output);
            }
            output.flush();
            return;
        }

        if ("DELETE".equals(request.method)) {
            if (file.exists() && !file.delete()) {
                sendJson(output, 500, new JSONObject().put("error", "Unable to delete media"));
                return;
            }
            synchronized (stateLock) {
                JSONObject media = state.optJSONObject("media");
                if (media != null) media.remove(key);
                persistStateLocked();
            }
            sendJson(output, 200, new JSONObject().put("deleted", true));
            return;
        }

        sendJson(output, 405, new JSONObject().put("error", "Method not allowed"));
    }

    private void serveAsset(String requestPath, boolean headersOnly, OutputStream output) throws IOException {
        String decoded;
        try {
            decoded = URLDecoder.decode(requestPath, "UTF-8");
        } catch (IllegalArgumentException error) {
            decoded = "/";
        }
        String relative = decoded.replace('\\', '/');
        while (relative.startsWith("/")) relative = relative.substring(1);
        if (relative.isEmpty()) relative = "index.html";
        if (relative.contains("..")) relative = "index.html";

        AssetManager assets = context.getAssets();
        InputStream asset;
        try {
            asset = assets.open(relative, AssetManager.ACCESS_STREAMING);
        } catch (IOException missing) {
            relative = "index.html";
            asset = assets.open(relative, AssetManager.ACCESS_STREAMING);
        }

        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", contentType(relative));
        headers.put("Cache-Control", "no-cache");
        sendHeaders(output, 200, headers);
        if (!headersOnly) copy(asset, output);
        asset.close();
        output.flush();
    }

    private JSONArray activeClients() {
        long cutoff = System.currentTimeMillis() - ACTIVE_CLIENT_MS;
        JSONArray active = new JSONArray();
        List<ClientRecord> records = new ArrayList<>(clients.values());
        records.sort(Comparator.comparing(record -> record.name.toLowerCase(Locale.ROOT)));
        for (ClientRecord record : records) {
            if (record.lastSeen < cutoff) {
                clients.remove(record.id);
                continue;
            }
            JSONObject item = new JSONObject();
            try {
                item.put("id", record.id);
                item.put("name", record.name);
                item.put("lastSeen", isoDate(record.lastSeen));
                active.put(item);
            } catch (Exception ignored) {
            }
        }
        return active;
    }

    private JSONObject loadState() {
        JSONObject fresh = freshState();
        if (!stateFile.exists()) return fresh;
        try (InputStream input = new AtomicFile(stateFile).openRead()) {
            byte[] bytes = readAll(input, 32 * 1024 * 1024);
            JSONObject stored = new JSONObject(new String(bytes, StandardCharsets.UTF_8));
            if (!"HouseHelper LAN".equals(stored.optString("product")) || stored.optString("token").isEmpty()) return fresh;
            if (stored.optJSONObject("entries") == null) stored.put("entries", new JSONObject());
            if (stored.optJSONObject("media") == null) stored.put("media", new JSONObject());
            return stored;
        } catch (Exception ignored) {
            return fresh;
        }
    }

    private JSONObject freshState() {
        JSONObject fresh = new JSONObject();
        try {
            byte[] tokenBytes = new byte[18];
            new SecureRandom().nextBytes(tokenBytes);
            fresh.put("product", "HouseHelper LAN");
            fresh.put("version", 1);
            fresh.put("token", Base64.encodeToString(tokenBytes, Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING));
            fresh.put("revision", 0);
            fresh.put("entries", new JSONObject());
            fresh.put("media", new JSONObject());
        } catch (Exception impossible) {
            throw new IllegalStateException(impossible);
        }
        return fresh;
    }

    private void persistStateLocked() throws IOException {
        if (!dataRoot.exists() && !dataRoot.mkdirs()) throw new IOException("Unable to create household storage");
        writeAtomically(stateFile, state.toString().getBytes(StandardCharsets.UTF_8));
    }

    private static void writeAtomically(File destination, byte[] bytes) throws IOException {
        File parent = destination.getParentFile();
        if (parent != null && !parent.exists() && !parent.mkdirs()) throw new IOException("Unable to create storage");
        AtomicFile atomicFile = new AtomicFile(destination);
        FileOutputStream output = null;
        try {
            output = atomicFile.startWrite();
            output.write(bytes);
            output.flush();
            output.getFD().sync();
            atomicFile.finishWrite(output);
        } catch (IOException error) {
            if (output != null) atomicFile.failWrite(output);
            throw error;
        }
    }

    private static byte[] readBody(InputStream input, Request request, int limit) throws IOException {
        String transfer = request.header("transfer-encoding").toLowerCase(Locale.ROOT);
        if (transfer.contains("chunked")) return readChunked(input, limit);
        String lengthValue = request.header("content-length");
        if (lengthValue.isEmpty()) return new byte[0];
        long length;
        try {
            length = Long.parseLong(lengthValue);
        } catch (NumberFormatException error) {
            throw new IOException("Invalid content length");
        }
        if (length < 0 || length > limit) throw new IOException("Request is too large");
        byte[] body = new byte[(int) length];
        int offset = 0;
        while (offset < body.length) {
            int count = input.read(body, offset, body.length - offset);
            if (count < 0) throw new IOException("Unexpected end of request");
            offset += count;
        }
        return body;
    }

    private static byte[] readChunked(InputStream input, int limit) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        while (true) {
            String line = Request.readLine(input);
            if (line == null) throw new IOException("Invalid chunked request");
            int separator = line.indexOf(';');
            String sizeText = (separator >= 0 ? line.substring(0, separator) : line).trim();
            int size;
            try {
                size = Integer.parseInt(sizeText, 16);
            } catch (NumberFormatException error) {
                throw new IOException("Invalid chunk size");
            }
            if (size == 0) {
                while (true) {
                    String trailer = Request.readLine(input);
                    if (trailer == null || trailer.isEmpty()) break;
                }
                break;
            }
            if (size < 0 || output.size() + size > limit) throw new IOException("Request is too large");
            byte[] buffer = new byte[Math.min(8192, size)];
            int remaining = size;
            while (remaining > 0) {
                int count = input.read(buffer, 0, Math.min(buffer.length, remaining));
                if (count < 0) throw new IOException("Unexpected end of request");
                output.write(buffer, 0, count);
                remaining -= count;
            }
            Request.readLine(input);
        }
        return output.toByteArray();
    }

    private static byte[] readAll(InputStream input, int limit) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int count;
        while ((count = input.read(buffer)) >= 0) {
            if (output.size() + count > limit) throw new IOException("Stored data is too large");
            output.write(buffer, 0, count);
        }
        return output.toByteArray();
    }

    private static void sendJson(OutputStream output, int status, JSONObject value) throws IOException {
        byte[] bytes = value.toString().getBytes(StandardCharsets.UTF_8);
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json; charset=utf-8");
        headers.put("Content-Length", String.valueOf(bytes.length));
        headers.put("Cache-Control", "no-store");
        sendHeaders(output, status, headers);
        output.write(bytes);
        output.flush();
    }

    private static void sendHeaders(OutputStream output, int status, Map<String, String> headers) throws IOException {
        String reason;
        switch (status) {
            case 200: reason = "OK"; break;
            case 400: reason = "Bad Request"; break;
            case 401: reason = "Unauthorized"; break;
            case 404: reason = "Not Found"; break;
            case 405: reason = "Method Not Allowed"; break;
            case 413: reason = "Payload Too Large"; break;
            default: reason = "Internal Server Error";
        }
        StringBuilder builder = new StringBuilder("HTTP/1.1 ").append(status).append(' ').append(reason).append("\r\n");
        builder.append("Connection: close\r\n");
        builder.append("X-Content-Type-Options: nosniff\r\n");
        builder.append("X-Frame-Options: DENY\r\n");
        builder.append("Referrer-Policy: no-referrer\r\n");
        builder.append("X-HouseHelper-Version: ").append(APP_VERSION).append("\r\n");
        for (Map.Entry<String, String> header : headers.entrySet()) {
            builder.append(header.getKey()).append(": ").append(header.getValue()).append("\r\n");
        }
        builder.append("\r\n");
        output.write(builder.toString().getBytes(StandardCharsets.US_ASCII));
    }

    private static void copy(InputStream input, OutputStream output) throws IOException {
        byte[] buffer = new byte[16 * 1024];
        int count;
        while ((count = input.read(buffer)) >= 0) output.write(buffer, 0, count);
    }

    private static String contentType(String path) {
        String lower = path.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".html")) return "text/html; charset=utf-8";
        if (lower.endsWith(".css")) return "text/css; charset=utf-8";
        if (lower.endsWith(".js")) return "text/javascript; charset=utf-8";
        if (lower.endsWith(".json")) return "application/json; charset=utf-8";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".webmanifest")) return "application/manifest+json; charset=utf-8";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }

    private static String sha256(String value) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        StringBuilder builder = new StringBuilder();
        for (byte part : digest) builder.append(String.format(Locale.ROOT, "%02x", part & 0xff));
        return builder.toString();
    }

    private static boolean constantTimeEquals(String left, String right) {
        return MessageDigest.isEqual(left.getBytes(StandardCharsets.UTF_8), right.getBytes(StandardCharsets.UTF_8));
    }

    private static String limit(String value, int max, String fallback) {
        if (value == null || value.trim().isEmpty()) return fallback;
        String clean = value.trim();
        return clean.length() > max ? clean.substring(0, max) : clean;
    }

    private static String isoNow() {
        return isoDate(System.currentTimeMillis());
    }

    private static String isoDate(long timestamp) {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        return format.format(new Date(timestamp));
    }

    private String inviteUrlFor(Request request) {
        String requestHost = request.header("host");
        if (requestHost.startsWith("127.0.0.1") || requestHost.startsWith("localhost") || requestHost.isEmpty()) {
            return getPairingUrl();
        }
        return "http://" + requestHost + "/?pair=" + Uri.encode(getToken()) + "&role=secondary&v=" + APP_VERSION + "#home";
    }

    private static String bestLanAddress() {
        List<String> addresses = new ArrayList<>();
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            for (NetworkInterface network : Collections.list(interfaces)) {
                if (!network.isUp() || network.isLoopback()) continue;
                Enumeration<InetAddress> entries = network.getInetAddresses();
                for (InetAddress address : Collections.list(entries)) {
                    if (address instanceof Inet4Address && !address.isLoopbackAddress()) addresses.add(address.getHostAddress());
                }
            }
        } catch (Exception ignored) {
        }
        addresses.sort((left, right) -> Integer.compare(addressPriority(left), addressPriority(right)));
        return addresses.isEmpty() ? "127.0.0.1" : addresses.get(0);
    }

    private static int addressPriority(String address) {
        if (address.startsWith("192.168.")) return 0;
        if (address.startsWith("10.")) return 1;
        if (address.startsWith("172.")) return 2;
        return 3;
    }

    private static final class ClientRecord {
        final String id;
        final String name;
        final long lastSeen;

        ClientRecord(String id, String name, long lastSeen) {
            this.id = id;
            this.name = name;
            this.lastSeen = lastSeen;
        }
    }

    private static final class Request {
        final String method;
        final String target;
        final Map<String, String> headers;

        Request(String method, String target, Map<String, String> headers) {
            this.method = method;
            this.target = target;
            this.headers = headers;
        }

        String header(String name) {
            String value = headers.get(name.toLowerCase(Locale.ROOT));
            return value == null ? "" : value;
        }

        static Request read(InputStream input) throws IOException {
            String firstLine = readLine(input);
            if (firstLine == null || firstLine.isEmpty()) return null;
            String[] parts = firstLine.split(" ", 3);
            if (parts.length < 2) throw new IOException("Invalid request");
            Map<String, String> headers = new HashMap<>();
            int headerCount = 0;
            while (true) {
                String line = readLine(input);
                if (line == null || line.isEmpty()) break;
                headerCount += 1;
                if (headerCount > 100) throw new IOException("Too many HTTP headers");
                int separator = line.indexOf(':');
                if (separator <= 0) continue;
                headers.put(line.substring(0, separator).trim().toLowerCase(Locale.ROOT), line.substring(separator + 1).trim());
            }
            return new Request(parts[0].toUpperCase(Locale.ROOT), parts[1], headers);
        }

        static String readLine(InputStream input) throws IOException {
            ByteArrayOutputStream line = new ByteArrayOutputStream();
            int value;
            boolean carriageReturn = false;
            while ((value = input.read()) >= 0) {
                if (carriageReturn && value == '\n') break;
                if (carriageReturn) line.write('\r');
                carriageReturn = value == '\r';
                if (!carriageReturn) line.write(value);
                if (line.size() > 16 * 1024) throw new IOException("HTTP line is too long");
            }
            if (value < 0 && line.size() == 0 && !carriageReturn) return null;
            if (carriageReturn && value < 0) line.write('\r');
            return line.toString(StandardCharsets.ISO_8859_1.name());
        }
    }
}
