package com.househelper.familydashboard;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public final class MainActivity extends Activity {
    private static final int REQUEST_FILE_CHOOSER = 7101;
    private static final int REQUEST_SAVE_BACKUP = 7102;
    private static final int REQUEST_NOTIFICATIONS = 7103;
    private static final int REQUEST_LOCATION = 7104;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private WebView webView;
    private ValueCallback<Uri[]> fileChooserCallback;
    private Uri pendingCameraUri;
    private File pendingCameraFile;
    private byte[] pendingDownloadBytes;
    private String pendingDownloadMime = "application/json";
    private boolean loaded;
    private GeolocationPermissions.Callback pendingGeolocationCallback;
    private String pendingGeolocationOrigin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        pruneCameraCache();
        configureWebView();
        startHostService();
        requestNotificationPermission();
        waitForHost();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
        startHostService();
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        deletePendingCameraImage();
        if (pendingGeolocationCallback != null) {
            pendingGeolocationCallback.invoke(pendingGeolocationOrigin, false, false);
            pendingGeolocationCallback = null;
            pendingGeolocationOrigin = null;
        }
        if (webView != null) {
            ViewGroup parent = (ViewGroup) webView.getParent();
            if (parent != null) parent.removeView(webView);
            webView.removeJavascriptInterface("HouseHelperNative");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView != null) {
            String url = webView.getUrl();
            if (url != null && !url.endsWith("#home")) {
                webView.evaluateJavascript("location.hash='#home'", null);
                return;
            }
            if (webView.canGoBack()) {
                webView.goBack();
                return;
            }
        }
        super.onBackPressed();
    }

    private void configureWebView() {
        webView = new WebView(this);
        webView.clearCache(true);
        webView.setBackgroundColor(Color.rgb(255, 249, 237));
        setContentView(webView, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        if (BuildConfig.DEBUG) WebView.setWebContentsDebuggingEnabled(true);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        webView.addJavascriptInterface(new NativeBridge(), "HouseHelperNative");
        webView.setWebViewClient(new LocalOnlyWebViewClient());
        webView.setWebChromeClient(new HouseHelperChromeClient());
    }

    private void startHostService() {
        Intent intent = new Intent(this, HostService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(intent);
        else startService(intent);
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQUEST_NOTIFICATIONS);
        }
    }

    private void waitForHost() {
        if (isFinishing() || isDestroyed()) return;
        HouseholdServer server = HostService.getServer();
        if (server != null && server.isRunning()) {
            if (!loaded) {
                loaded = true;
                webView.loadUrl(server.getHostDashboardUrl());
            }
            return;
        }
        String error = HostService.getStartupError();
        if (!error.isEmpty()) {
            Toast.makeText(this, "HouseHelper host: " + error, Toast.LENGTH_LONG).show();
            return;
        }
        handler.postDelayed(this::waitForHost, 120);
    }

    private boolean isLocal(Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme();
        String host = uri.getHost();
        return ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))
                && ("127.0.0.1".equals(host) || "localhost".equalsIgnoreCase(host));
    }

    private boolean openExternal(Uri uri) {
        if (uri == null) return false;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
            return true;
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, "No app can open that link.", Toast.LENGTH_SHORT).show();
            return true;
        }
    }

    private Intent filePickerIntent(WebChromeClient.FileChooserParams params) {
        Intent picker;
        try {
            picker = params.createIntent();
        } catch (Exception error) {
            picker = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
        }

        String[] accept = params.getAcceptTypes();
        boolean acceptsImages = accept == null || accept.length == 0;
        if (accept != null) {
            for (String type : accept) {
                if (type == null || type.isEmpty() || type.startsWith("image/") || "*/*".equals(type)) acceptsImages = true;
            }
        }
        if (!acceptsImages) {
            if (params.getMode() == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE) picker.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            return Intent.createChooser(picker, "Choose a file");
        }

        picker.setType("image/*");
        if (params.getMode() == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE) picker.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        Intent camera = createCameraIntent();
        if (camera == null) return Intent.createChooser(picker, "Choose a file");
        Intent chooser = Intent.createChooser(picker, "Choose or take a photo");
        chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{camera});
        return chooser;
    }

    private Intent createCameraIntent() {
        try {
            deletePendingCameraImage();
            File cameraDirectory = new File(getCacheDir(), "camera");
            if (!cameraDirectory.exists() && !cameraDirectory.mkdirs()) return null;
            pendingCameraFile = File.createTempFile("HouseHelper-", ".jpg", cameraDirectory);
            pendingCameraUri = FileProvider.getUriForFile(this, BuildConfig.APPLICATION_ID + ".fileprovider", pendingCameraFile);
            Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            camera.putExtra(MediaStore.EXTRA_OUTPUT, pendingCameraUri);
            camera.setClipData(ClipData.newRawUri("HouseHelper photo", pendingCameraUri));
            camera.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            if (camera.resolveActivity(getPackageManager()) == null) {
                deletePendingCameraImage();
                return null;
            }
            List<ResolveInfo> handlers = getPackageManager().queryIntentActivities(camera, PackageManager.MATCH_DEFAULT_ONLY);
            for (ResolveInfo handler : handlers) {
                grantUriPermission(handler.activityInfo.packageName, pendingCameraUri, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            }
            return camera;
        } catch (Exception error) {
            deletePendingCameraImage();
            return null;
        }
    }

    private void releaseCameraGrant() {
        if (pendingCameraUri == null) return;
        try {
            revokeUriPermission(pendingCameraUri, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        } catch (Exception ignored) {
        }
    }

    private void deletePendingCameraImage() {
        releaseCameraGrant();
        if (pendingCameraFile != null && pendingCameraFile.exists()) pendingCameraFile.delete();
        pendingCameraUri = null;
        pendingCameraFile = null;
    }

    private void pruneCameraCache() {
        File directory = new File(getCacheDir(), "camera");
        File[] files = directory.listFiles();
        if (files == null) return;
        long cutoff = System.currentTimeMillis() - 24L * 60L * 60L * 1000L;
        for (File file : files) {
            if (file.isFile() && file.lastModified() < cutoff) file.delete();
        }
    }

    private Uri[] selectedFileUris(Intent data) {
        if (data == null) return null;
        Set<Uri> selected = new LinkedHashSet<>();
        ClipData clipData = data.getClipData();
        if (clipData != null) {
            for (int index = 0; index < clipData.getItemCount(); index += 1) {
                Uri uri = clipData.getItemAt(index).getUri();
                if (uri != null && "content".equalsIgnoreCase(uri.getScheme())) selected.add(uri);
            }
        }
        Uri single = data.getData();
        if (single != null && "content".equalsIgnoreCase(single.getScheme())) selected.add(single);
        if (selected.isEmpty()) {
            Uri[] parsed = WebChromeClient.FileChooserParams.parseResult(RESULT_OK, data);
            if (parsed != null) for (Uri uri : parsed) if (uri != null && "content".equalsIgnoreCase(uri.getScheme())) selected.add(uri);
        }
        return selected.isEmpty() ? null : selected.toArray(new Uri[0]);
    }

    private boolean resultContainsPendingCamera(Intent data) {
        if (data == null || pendingCameraUri == null) return false;
        if (pendingCameraUri.equals(data.getData())) return true;
        ClipData clipData = data.getClipData();
        if (clipData == null) return false;
        for (int index = 0; index < clipData.getItemCount(); index += 1) {
            if (pendingCameraUri.equals(clipData.getItemAt(index).getUri())) return true;
        }
        return false;
    }

    private void beginSave(String content, String filename, String mimeType) {
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
        if (bytes.length > 40 * 1024 * 1024) {
            Toast.makeText(this, "That backup is too large to save.", Toast.LENGTH_LONG).show();
            return;
        }
        pendingDownloadBytes = bytes;
        pendingDownloadMime = mimeType == null || mimeType.isEmpty() ? "application/json" : mimeType;
        String safeFilename = filename == null ? "HouseHelper-backup.json" : filename.replaceAll("[^a-zA-Z0-9._-]", "-");
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(pendingDownloadMime);
        intent.putExtra(Intent.EXTRA_TITLE, safeFilename);
        try {
            startActivityForResult(intent, REQUEST_SAVE_BACKUP);
        } catch (ActivityNotFoundException error) {
            pendingDownloadBytes = null;
            Toast.makeText(this, "No file app is available to save the backup.", Toast.LENGTH_LONG).show();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQUEST_LOCATION || pendingGeolocationCallback == null) return;
        boolean granted = false;
        for (int result : grantResults) if (result == PackageManager.PERMISSION_GRANTED) granted = true;
        pendingGeolocationCallback.invoke(pendingGeolocationOrigin, granted, false);
        pendingGeolocationCallback = null;
        pendingGeolocationOrigin = null;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_FILE_CHOOSER) {
            if (fileChooserCallback == null) {
                deletePendingCameraImage();
                return;
            }
            Uri[] result = null;
            boolean pickerReturnedFiles = data != null && (data.getData() != null || data.getClipData() != null);
            boolean cameraFileReady = pendingCameraFile != null && pendingCameraFile.isFile() && pendingCameraFile.length() > 0;
            boolean cameraReturned = pendingCameraUri != null && cameraFileReady && (!pickerReturnedFiles || resultContainsPendingCamera(data));
            if (resultCode == RESULT_OK && cameraReturned) {
                result = new Uri[]{pendingCameraUri};
                releaseCameraGrant();
                pendingCameraUri = null;
                pendingCameraFile = null;
            } else if (resultCode == RESULT_OK) {
                result = selectedFileUris(data);
                deletePendingCameraImage();
            } else {
                deletePendingCameraImage();
            }
            fileChooserCallback.onReceiveValue(result);
            fileChooserCallback = null;
            return;
        }

        if (requestCode == REQUEST_SAVE_BACKUP) {
            byte[] bytes = pendingDownloadBytes;
            pendingDownloadBytes = null;
            if (resultCode != RESULT_OK || data == null || data.getData() == null || bytes == null) return;
            try (OutputStream output = getContentResolver().openOutputStream(data.getData(), "w")) {
                if (output == null) throw new IllegalStateException("No destination was selected");
                output.write(bytes);
                output.flush();
                Toast.makeText(this, "HouseHelper backup saved.", Toast.LENGTH_SHORT).show();
            } catch (Exception error) {
                Toast.makeText(this, "The backup could not be saved.", Toast.LENGTH_LONG).show();
            }
        }
    }

    private final class LocalOnlyWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (request.isForMainFrame() && !isLocal(uri)) return openExternal(uri);
            return false;
        }

        @Override
        @SuppressWarnings("deprecation")
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            Uri uri = Uri.parse(url);
            return !isLocal(uri) && openExternal(uri);
        }
    }

    private final class HouseHelperChromeClient extends WebChromeClient {
        @Override
        public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
            if (!isLocal(Uri.parse(origin))) {
                callback.invoke(origin, false, false);
                return;
            }
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M
                    || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                    || checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                callback.invoke(origin, true, false);
                return;
            }
            if (pendingGeolocationCallback != null) pendingGeolocationCallback.invoke(pendingGeolocationOrigin, false, false);
            pendingGeolocationCallback = callback;
            pendingGeolocationOrigin = origin;
            requestPermissions(new String[]{Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION}, REQUEST_LOCATION);
        }

        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (fileChooserCallback != null) fileChooserCallback.onReceiveValue(null);
            fileChooserCallback = callback;
            deletePendingCameraImage();
            try {
                startActivityForResult(filePickerIntent(params), REQUEST_FILE_CHOOSER);
                return true;
            } catch (ActivityNotFoundException error) {
                fileChooserCallback = null;
                callback.onReceiveValue(null);
                Toast.makeText(MainActivity.this, "No file or camera app is available.", Toast.LENGTH_LONG).show();
                return false;
            }
        }

        @Override
        public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, android.os.Message resultMsg) {
            WebView popup = new WebView(MainActivity.this);
            popup.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView popupView, WebResourceRequest request) {
                    openExternal(request.getUrl());
                    popupView.destroy();
                    return true;
                }

                @Override
                @SuppressWarnings("deprecation")
                public boolean shouldOverrideUrlLoading(WebView popupView, String url) {
                    openExternal(Uri.parse(url));
                    popupView.destroy();
                    return true;
                }
            });
            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
            transport.setWebView(popup);
            resultMsg.sendToTarget();
            return true;
        }

        @Override
        public void onPermissionRequest(PermissionRequest request) {
            request.deny();
        }
    }

    private final class NativeBridge {
        @JavascriptInterface
        public String getVersion() {
            return BuildConfig.VERSION_NAME;
        }

        @JavascriptInterface
        public void saveTextFile(String content, String filename, String mimeType) {
            runOnUiThread(() -> beginSave(
                    content == null ? "" : content,
                    filename == null || filename.isEmpty()
                            ? "HouseHelper-" + new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date()) + ".json"
                            : filename,
                    mimeType
            ));
        }
    }
}
