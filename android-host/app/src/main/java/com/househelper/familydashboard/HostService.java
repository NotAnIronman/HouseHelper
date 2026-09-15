package com.househelper.familydashboard;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.IBinder;

public final class HostService extends Service {
    public static final int PORT = 4173;
    private static final String CHANNEL_ID = "househelper-host";
    private static final int NOTIFICATION_ID = 4173;

    private static volatile HouseholdServer server;
    private static volatile String startupError = "";

    private NsdManager nsdManager;
    private NsdManager.RegistrationListener registrationListener;
    private WifiManager.MulticastLock multicastLock;

    public static HouseholdServer getServer() {
        return server;
    }

    public static String getStartupError() {
        return startupError;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        beginForeground(buildNotification(getString(R.string.host_notification_text)));
        startHouseholdServer();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (server == null || !server.isRunning()) startHouseholdServer();
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        unregisterDiscovery();
        HouseholdServer active = server;
        server = null;
        if (active != null) active.stop();
        super.onDestroy();
    }

    private synchronized void startHouseholdServer() {
        if (server != null && server.isRunning()) return;
        try {
            HouseholdServer created = new HouseholdServer(this, PORT);
            created.start();
            server = created;
            startupError = "";
            registerDiscovery(created.getPort());
            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            manager.notify(NOTIFICATION_ID, buildNotification(getString(R.string.host_notification_text)));
        } catch (Exception error) {
            startupError = error.getMessage() == null ? "Unable to start the household host" : error.getMessage();
            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            manager.notify(NOTIFICATION_ID, buildNotification("Host could not start. Open HouseHelper to retry."));
        }
    }

    private void registerDiscovery(int port) {
        try {
            WifiManager wifiManager = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wifiManager != null) {
                multicastLock = wifiManager.createMulticastLock("househelper-discovery");
                multicastLock.setReferenceCounted(false);
                multicastLock.acquire();
            }

            nsdManager = (NsdManager) getSystemService(Context.NSD_SERVICE);
            if (nsdManager == null) return;
            NsdServiceInfo serviceInfo = new NsdServiceInfo();
            serviceInfo.setServiceName("HouseHelper Kitchen");
            serviceInfo.setServiceType("_househelper._tcp.");
            serviceInfo.setPort(port);

            registrationListener = new NsdManager.RegistrationListener() {
                @Override public void onServiceRegistered(NsdServiceInfo info) { }
                @Override public void onRegistrationFailed(NsdServiceInfo info, int errorCode) { }
                @Override public void onServiceUnregistered(NsdServiceInfo info) { }
                @Override public void onUnregistrationFailed(NsdServiceInfo info, int errorCode) { }
            };
            nsdManager.registerService(serviceInfo, NsdManager.PROTOCOL_DNS_SD, registrationListener);
        } catch (Exception ignored) {
            unregisterDiscovery();
        }
    }

    private void unregisterDiscovery() {
        if (nsdManager != null && registrationListener != null) {
            try {
                nsdManager.unregisterService(registrationListener);
            } catch (Exception ignored) {
            }
        }
        registrationListener = null;
        nsdManager = null;
        if (multicastLock != null && multicastLock.isHeld()) multicastLock.release();
        multicastLock = null;
    }

    private void createNotificationChannel() {
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                getString(R.string.host_channel_name),
                NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription(getString(R.string.host_channel_description));
        channel.setShowBadge(false);
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        manager.createNotificationChannel(channel);
    }

    private Notification buildNotification(String text) {
        Intent openApp = new Intent(this, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                openApp,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        return new Notification.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_househelper)
                .setContentTitle(getString(R.string.host_notification_title))
                .setContentText(text)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setCategory(Notification.CATEGORY_SERVICE)
                .setOnlyAlertOnce(true)
                .build();
    }

    private void beginForeground(Notification notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }
}
