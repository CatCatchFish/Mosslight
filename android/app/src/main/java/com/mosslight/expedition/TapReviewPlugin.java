package com.mosslight.expedition;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.taptap.sdk.initializer.api.service.InitializerService;
import com.taptap.sdk.servicemanager.ServiceManager;

@CapacitorPlugin(name = "TapReview")
public class TapReviewPlugin extends Plugin {
    private boolean configured() {
        return !BuildConfig.TAPDB_CLIENT_ID.trim().isEmpty()
            && !BuildConfig.TAPDB_CLIENT_TOKEN.trim().isEmpty();
    }

    private String tapPackageName() {
        return "GLOBAL".equals(BuildConfig.TAPDB_REGION)
            ? "com.taptap.global" : "com.taptap";
    }

    private boolean isTapClientInstalled(Context context) {
        try {
            return context.getPackageManager().getPackageInfo(tapPackageName(), 0) != null;
        } catch (PackageManager.NameNotFoundException ignored) {
            return false;
        }
    }

    private String getReviewUrl(String type) {
        try {
            InitializerService service = ServiceManager.Companion.getService(InitializerService.class);
            String url = service == null ? null : service.getReviewUrl(type);
            return url == null ? "" : url.trim();
        } catch (Throwable ignored) {
            return "";
        }
    }

    private boolean startView(String url, String packageName) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (packageName != null) intent.setPackage(packageName);
        ResolveInfo resolved = getContext().getPackageManager().resolveActivity(intent, 0);
        if (resolved == null) return false;
        getContext().startActivity(intent);
        return true;
    }

    private boolean launchReview(String url, String packageName) {
        Uri uri = Uri.parse(url);
        if (uri.getQueryParameter("sdk_identifier") == null) {
            uri = uri.buildUpon()
                .appendQueryParameter("sdk_identifier", getContext().getPackageName())
                .build();
        }
        return startView(uri.toString(), packageName);
    }

    @PluginMethod
    public void openReview(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.resolve(new JSObject().put("opened", false).put("reason", "unavailable"));
            return;
        }
        if (!configured()) {
            call.resolve(new JSObject().put("opened", false).put("reason", "unconfigured"));
            return;
        }
        if (!TapDBPlugin.hasConsent()) {
            call.resolve(new JSObject().put("opened", false).put("reason", "consent"));
            return;
        }
        if (!TapDBPlugin.isSdkInitialized()) {
            call.resolve(new JSObject().put("opened", false).put("reason", "not-ready"));
            return;
        }
        boolean tapInstalled = isTapClientInstalled(activity);
        activity.runOnUiThread(() -> {
            try {
                // tap-review 4.11.1 expects a LoginService even though it only declares tap-login-api.
                // This game does not enable TapTap login, so open the server-provided URI directly.
                String reviewUrl = getReviewUrl(tapInstalled ? "uri" : "browser");
                if (reviewUrl.isEmpty()) {
                    call.resolve(new JSObject()
                        .put("opened", false)
                        .put("tapInstalled", tapInstalled)
                        .put("reason", "review-url-missing"));
                    return;
                }
                boolean started = launchReview(reviewUrl, tapInstalled ? tapPackageName() : null);
                if (!started && tapInstalled) {
                    String browserUrl = getReviewUrl("browser");
                    started = !browserUrl.isEmpty() && launchReview(browserUrl, null);
                }
                if (!started) {
                    call.resolve(new JSObject()
                        .put("opened", false)
                        .put("tapInstalled", tapInstalled)
                        .put("reason", "failed"));
                    return;
                }
                call.resolve(new JSObject()
                    .put("invoked", true)
                    .put("tapInstalled", tapInstalled));
            } catch (Throwable error) {
                JSObject result = new JSObject()
                    .put("opened", false)
                    .put("tapInstalled", tapInstalled)
                    .put("reason", "failed");
                if (error.getMessage() != null && !error.getMessage().isEmpty()) {
                    result.put("message", error.getMessage());
                }
                call.resolve(result);
            }
        });
    }
}
