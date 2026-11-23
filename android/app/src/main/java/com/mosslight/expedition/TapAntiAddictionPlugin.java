package com.mosslight.expedition;

import android.app.Activity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.taptap.sdk.compliance.TapTapCompliance;
import com.taptap.sdk.compliance.TapTapComplianceCallback;
import com.taptap.sdk.compliance.option.TapTapComplianceOptions;
import com.taptap.sdk.core.TapTapRegion;
import com.taptap.sdk.core.TapTapSdk;
import com.taptap.sdk.core.TapTapSdkOptions;
import com.taptap.sdk.initializer.api.TapInitCallback;
import com.taptap.sdk.kit.internal.callback.TapTapCallback;
import com.taptap.sdk.kit.internal.exception.TapTapException;
import com.taptap.sdk.login.Scopes;
import com.taptap.sdk.login.TapTapAccount;
import com.taptap.sdk.login.TapTapLogin;
import java.util.Map;

@CapacitorPlugin(name = "TapAntiAddiction")
public class TapAntiAddictionPlugin extends Plugin {
    private static final int RESULT_SUCCESS = 500;

    private boolean initialized;
    private boolean initializing;
    private int lastCode = -1;
    private PluginCall initCall;
    private PluginCall pendingCall;

    @PluginMethod
    public void initialize(PluginCall call) {
        if (BuildConfig.TAPTAP_CLIENT_ID.isEmpty() || BuildConfig.TAPTAP_CLIENT_TOKEN.isEmpty()) {
            call.reject("TapTap Client ID/Token 未配置", "NOT_CONFIGURED");
            return;
        }
        if (initialized) {
            resolveInitialized(call);
            return;
        }
        if (initializing) {
            call.reject("TapTap SDK 正在初始化", "IN_PROGRESS");
            return;
        }
        initializing = true;
        initCall = call;
        try {
            startSdkInitialization();
        } catch (Exception error) {
            initializing = false;
            failInit(messageOf(error), "TAP_SDK_INIT_FAILED");
        }
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (!requireInitialized(call)) return;
        try {
            TapTapAccount account = TapTapLogin.getCurrentTapAccount();
            if (account == null || account.getOpenId() == null || account.getOpenId().isEmpty()) {
                lastCode = 1001;
                call.resolve(result(1001, true, -1, -1, "需要 TapTap 登录"));
                return;
            }
            if (pendingCall != null) {
                call.reject("防沉迷认证正在进行", "IN_PROGRESS");
                return;
            }
            pendingCall = call;
            startup(account.getOpenId());
        } catch (Exception error) {
            failPending(messageOf(error), "TAP_SDK_START_FAILED");
        }
    }

    @PluginMethod
    public void login(PluginCall call) {
        if (!requireInitialized(call)) return;
        try {
            TapTapAccount account = TapTapLogin.getCurrentTapAccount();
            if (account != null && account.getOpenId() != null && !account.getOpenId().isEmpty()) {
                if (pendingCall != null) {
                    call.reject("防沉迷认证正在进行", "IN_PROGRESS");
                    return;
                }
                pendingCall = call;
                startup(account.getOpenId());
                return;
            }
            if (pendingCall != null) {
                call.reject("防沉迷认证正在进行", "IN_PROGRESS");
                return;
            }
            pendingCall = call;
            requestLogin();
        } catch (Exception error) {
            failPending(messageOf(error), "TAP_LOGIN_FAILED");
        }
    }

    @PluginMethod
    public void status(PluginCall call) {
        if (!requireInitialized(call)) return;
        try {
            int remaining = TapTapCompliance.getRemainingTime();
            JSObject result = new JSObject();
            result.put("allowed", lastCode == RESULT_SUCCESS && (remaining < 0 || remaining > 0));
            result.put("ageRange", TapTapCompliance.getAgeRange());
            result.put("remainingSeconds", remaining);
            call.resolve(result);
        } catch (Exception error) {
            call.reject(messageOf(error), "TAP_STATUS_FAILED");
        }
    }

    @PluginMethod
    public void logout(PluginCall call) {
        if (!requireInitialized(call)) return;
        try {
            TapTapCompliance.exit();
            TapTapLogin.logout();
            lastCode = -1;
            call.resolve();
        } catch (Exception error) {
            call.reject(messageOf(error), "TAP_LOGOUT_FAILED");
        }
    }

    private boolean requireInitialized(PluginCall call) {
        if (initialized) return true;
        call.reject("TapTap SDK 尚未初始化", "NOT_INITIALIZED");
        return false;
    }

    private void resolveInitialized(PluginCall call) {
        JSObject result = new JSObject();
        result.put("configured", true);
        result.put("sdk", "taptap");
        call.resolve(result);
    }

    private void startSdkInitialization() {
        Activity activity = getActivity();
        if (activity == null) {
            failInit("Activity 不可用", "NO_ACTIVITY");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                TapTapSdkOptions sdkOptions = new TapTapSdkOptions(
                    BuildConfig.TAPTAP_CLIENT_ID,
                    BuildConfig.TAPTAP_CLIENT_TOKEN,
                    TapTapRegion.CN
                );
                sdkOptions.setScreenOrientation(1);
                sdkOptions.setEnableLog(BuildConfig.DEBUG);
                TapTapComplianceOptions complianceOptions = new TapTapComplianceOptions(true, true);
                TapTapSdk.addInitCallback(new TapInitCallback() {
                    @Override
                    public void onInitSuccess() {
                        try {
                            TapTapCompliance.registerComplianceCallback(new TapTapComplianceCallback() {
                                @Override
                                public void onComplianceResult(int code, Map<String, ?> extra) {
                                    TapAntiAddictionPlugin.this.onComplianceResult(code, extra);
                                }
                            });
                            initialized = true;
                            initializing = false;
                            PluginCall call = initCall;
                            initCall = null;
                            if (call != null) resolveInitialized(call);
                        } catch (Exception error) {
                            failInit(messageOf(error), "TAP_SDK_INIT_FAILED");
                        }
                    }

                    @Override
                    public void onInitFail(int errorCode, String errorMsg) {
                        failInit(errorMsg + " (" + errorCode + ")", "TAP_SDK_INIT_FAILED");
                    }
                });
                TapTapSdk.init(getContext(), sdkOptions, complianceOptions);
            } catch (Exception error) {
                failInit(messageOf(error), "TAP_SDK_INIT_FAILED");
            }
        });
    }

    private void failInit(String message, String code) {
        initializing = false;
        PluginCall call = initCall;
        initCall = null;
        if (call != null) call.reject(message, code);
    }

    private void requestLogin() {
        Activity activity = getActivity();
        if (activity == null) {
            failPending("Activity 不可用", "NO_ACTIVITY");
            return;
        }
        activity.runOnUiThread(() -> TapTapLogin.loginWithScopes(
            activity,
            new String[] { Scopes.SCOPE_PUBLIC_PROFILE },
            new TapTapCallback<TapTapAccount>() {
                @Override
                public void onSuccess(TapTapAccount account) {
                    String openId = account == null ? null : account.getOpenId();
                    if (openId == null || openId.isEmpty()) {
                        failPending("TapTap 登录未返回 openId", "TAP_LOGIN_NO_OPEN_ID");
                    } else {
                        startup(openId);
                    }
                }

                @Override
                public void onFail(TapTapException exception) {
                    failPending(exception == null ? "TapTap 登录失败" : exception.getMessage(), "TAP_LOGIN_FAILED");
                }

                @Override
                public void onCancel() {
                    failPending("已取消 TapTap 登录", "TAP_LOGIN_CANCELLED");
                }
            }
        ));
    }

    private void startup(String openId) {
        Activity activity = getActivity();
        if (activity == null) {
            failPending("Activity 不可用", "NO_ACTIVITY");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                TapTapCompliance.startup(activity, openId);
            } catch (Exception error) {
                failPending(messageOf(error), "TAP_STARTUP_FAILED");
            }
        });
    }

    private void onComplianceResult(int code, Map<String, ?> extra) {
        if (code == 1000 || code == 1001) TapTapLogin.logout();
        lastCode = code;
        JSObject result = result(
            code,
            code == 1001,
            TapTapCompliance.getAgeRange(),
            TapTapCompliance.getRemainingTime(),
            messageOf(extra)
        );
        PluginCall call = pendingCall;
        pendingCall = null;
        if (call != null) call.resolve(result);
        notifyListeners("compliance", result);
    }

    private JSObject result(int code, boolean needsLogin, int ageRange, int remainingSeconds, String message) {
        JSObject result = new JSObject();
        result.put("code", code);
        result.put("allowed", code == RESULT_SUCCESS);
        result.put("needsLogin", needsLogin || code == 1000 || code == 1001);
        result.put("ageRange", ageRange);
        result.put("remainingSeconds", remainingSeconds);
        if (message != null) result.put("message", message);
        return result;
    }

    private void failPending(String message, String code) {
        PluginCall call = pendingCall;
        pendingCall = null;
        if (call != null) call.reject(message, code);
    }

    private static String messageOf(Map<String, ?> extra) {
        if (extra == null) return null;
        Object message = extra.get("message");
        return message == null ? null : String.valueOf(message);
    }

    private static String messageOf(Exception error) {
        Throwable cause = error.getCause();
        return cause != null && cause.getMessage() != null ? cause.getMessage() : String.valueOf(error);
    }
}