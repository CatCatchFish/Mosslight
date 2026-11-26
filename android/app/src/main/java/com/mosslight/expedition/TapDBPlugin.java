package com.mosslight.expedition;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.mosslight.expedition.BuildConfig;
import com.taptap.sdk.core.TapTapEvent;
import com.taptap.sdk.core.TapTapEventOptions;
import com.taptap.sdk.core.TapTapRegion;
import com.taptap.sdk.core.TapTapSdk;
import com.taptap.sdk.core.TapTapSdkOptions;
import com.taptap.sdk.initializer.api.TapInitCallback;
import com.taptap.sdk.initializer.api.TapInitErrorCode;
import com.taptap.sdk.initializer.api.model.ScreenOrientation;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "TapDB")
public class TapDBPlugin extends Plugin {
    private static final String PREFERENCES = "mosslight_tapdb";
    private static final String ANONYMOUS_ID_KEY = "anonymous_install_id";
    private static final Set<String> EVENTS = new HashSet<>(Arrays.asList(
        "stage_start", "stage_result", "tower_build", "tower_upgrade",
        "loadout_save", "talent_upgrade", "talent_reset"
    ));
    private static final Set<String> PROPERTIES = new HashSet<>(Arrays.asList(
        "stage_id", "chapter", "biome", "weather", "result", "stars",
        "health", "wave", "duration_seconds", "tower_id", "tier",
        "action", "talent_id", "level", "tower_count"
    ));

    private static volatile boolean sdkInitialized;
    private static volatile boolean consentGranted;

    private volatile boolean consent;
    private volatile String state = "idle";
    private volatile int errorCode;
    private volatile String errorMessage = "";
    private volatile String identifiedId = "";

    static boolean isSdkInitialized() {
        return sdkInitialized;
    }

    static boolean hasConsent() {
        return consentGranted;
    }

    private final TapInitCallback initCallback = new TapInitCallback() {
        @Override
        public void onInitSuccess() {
            sdkInitialized = true;
            state = "ready";
            errorCode = 0;
            errorMessage = "";
            identifyOnUiThread();
        }

        @Override
        public void onInitFail(int code, String message) {
            sdkInitialized = false;
            if (code == TapInitErrorCode.CONFIG_ERROR) state = "configuration_error";
            else state = "failed";
            errorCode = code;
            errorMessage = message == null ? "" : message;
        }
    };

    private String anonymousInstallId() {
        SharedPreferences preferences = getContext()
            .getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
        String existing = preferences.getString(ANONYMOUS_ID_KEY, "");
        if (existing != null && !existing.isEmpty()) return existing;
        String created = "anon_" + UUID.randomUUID();
        preferences.edit().putString(ANONYMOUS_ID_KEY, created).apply();
        return created;
    }

    private void identifyOnUiThread() {
        Activity activity = getActivity();
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            if (!consent || !"ready".equals(state)) return;
            String id;
            try {
                id = anonymousInstallId();
            } catch (RuntimeException error) {
                return;
            }
            if (id.equals(identifiedId)) return;
            try {
                TapTapEvent.setUserId(id, new JSONObject());
                identifiedId = id;
            } catch (RuntimeException ignored) {
                identifiedId = "";
            }
        });
    }

    private void clearIdentityOnUiThread(Activity activity) {
        activity.runOnUiThread(() -> {
            identifiedId = "";
            try {
                getContext()
                    .getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
                    .edit()
                    .remove(ANONYMOUS_ID_KEY)
                    .apply();
            } catch (RuntimeException ignored) {
                // Best-effort cleanup of local anonymous analytics identifier on withdrawal.
            }
            if (sdkInitialized) {
                try {
                    TapTapEvent.clearUser();
                } catch (RuntimeException ignored) {
                    // Best-effort cleanup of SDK identity on withdrawal.
                }
            }
        });
    }

    private boolean configured() {
        return !BuildConfig.TAPDB_CLIENT_ID.trim().isEmpty()
            && !BuildConfig.TAPDB_CLIENT_TOKEN.trim().isEmpty();
    }

    private JSObject status() {
        JSObject result = new JSObject();
        result.put("supported", true);
        result.put("configured", configured());
        result.put("consent", consent);
        result.put("state", consent ? state : "denied");
        if (errorCode != 0) result.put("errorCode", errorCode);
        if (!errorMessage.isEmpty()) result.put("errorMessage", errorMessage);
        return result;
    }

    private void initializeOnUiThread(Activity activity) {
        activity.runOnUiThread(() -> {
            if (!consent) return;
            if ("ready".equals(state)) {
                identifyOnUiThread();
                return;
            }
            if (!configured()) {
                state = "unconfigured";
                return;
            }
            if ("initializing".equals(state)) {
                TapTapSdk.addInitCallback(initCallback);
                return;
            }
            state = "initializing";
            int region = "GLOBAL".equals(BuildConfig.TAPDB_REGION)
                ? TapTapRegion.GLOBAL : TapTapRegion.CN;
            TapTapSdkOptions sdkOptions = new TapTapSdkOptions(
                BuildConfig.TAPDB_CLIENT_ID, BuildConfig.TAPDB_CLIENT_TOKEN, region
            );
            sdkOptions.setScreenOrientation(ScreenOrientation.LANDSCAPE);
            sdkOptions.setEnableLog(BuildConfig.DEBUG);
            TapTapEventOptions eventOptions = TapTapEventOptions.builder()
                .channel("android-direct")
                .autoIAPEventEnabled(false)
                // This game needs no OAID or ad attribution; avoid reflection-based collection.
                .disableReflectionOAID(true)
                .overrideBuiltInParameters(false)
                .build();
            TapTapSdk.addInitCallback(initCallback);
            try {
                TapTapSdk.init(activity.getApplicationContext(), sdkOptions, eventOptions);
            } catch (RuntimeException error) {
                sdkInitialized = false;
                state = "failed";
                errorMessage = error.getMessage() == null ? "" : error.getMessage();
            }
        });
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void setConsent(PluginCall call) {
        consent = call.getBoolean("allowed", false);
        consentGranted = consent;
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable");
            return;
        }
        if (!consent) {
            activity.runOnUiThread(() -> TapTapSdk.removeInitCallback(initCallback));
            clearIdentityOnUiThread(activity);
        } else {
            initializeOnUiThread(activity);
        }
        call.resolve(status());
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        consentGranted = consent;
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable");
            return;
        }
        if (consent) initializeOnUiThread(activity);
        call.resolve(status());
    }

    @PluginMethod
    public void logEvent(PluginCall call) {
        if (!consent || !"ready".equals(state)) {
            call.resolve(new JSObject().put("accepted", false));
            return;
        }
        String event = call.getString("event", "");
        JSObject input = call.getObject("properties");
        if (!EVENTS.contains(event) || input == null) {
            call.resolve(new JSObject().put("accepted", false));
            return;
        }
        JSONObject properties = new JSONObject();
        try {
            for (String key : PROPERTIES) {
                Object value = input.get(key);
                if (value instanceof String && ((String) value).length() <= 256)
                    properties.put(key, value);
                else if (value instanceof Number) {
                    double number = ((Number) value).doubleValue();
                    if (Double.isFinite(number) && Math.abs(number) <= 9E15)
                        properties.put(key, value);
                }
            }
            TapTapEvent.logEvent(event, properties);
            call.resolve(new JSObject().put("accepted", true));
        } catch (JSONException | RuntimeException error) {
            call.resolve(new JSObject().put("accepted", false));
        }
    }
}
