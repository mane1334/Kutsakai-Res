package com.interactive.restaurant;

import android.app.Activity;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "KioskPlugin")
public class KioskPlugin extends Plugin {

    @PluginMethod
    public void startKiosk(PluginCall call) {
        Activity activity = getActivity();
        if (activity != null) {
            activity.runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    try {
                        activity.startLockTask();
                        call.resolve();
                    } catch (Exception e) {
                        call.reject("Failed to start LockTask: " + e.getMessage());
                    }
                } else {
                    call.reject("LockTask not supported on this Android version");
                }
            });
        } else {
            call.reject("Activity is null");
        }
    }

    @PluginMethod
    public void stopKiosk(PluginCall call) {
        Activity activity = getActivity();
        if (activity != null) {
            activity.runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    try {
                        activity.stopLockTask();
                        call.resolve();
                    } catch (Exception e) {
                        call.reject("Failed to stop LockTask: " + e.getMessage());
                    }
                } else {
                    call.resolve(); // Not supported, but nothing to stop
                }
            });
        } else {
            call.reject("Activity is null");
        }
    }

    @PluginMethod
    public void exitApp(PluginCall call) {
        Activity activity = getActivity();
        if (activity != null) {
            activity.finishAffinity();
            System.exit(0);
        }
    }
}
