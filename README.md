# 微光防线（Glimmer Defense）

离线单机像素塔防。原生 HTML、CSS、TypeScript 与 Canvas 渲染，Vite 构建，Capacitor 封装 Android。主地图共 18 个站点，覆盖林缘、苔岸、矿道、霜脊与毒沼五大区域。

- 当前版本：**v1.0.0**（`versionCode=25`）
- 自动测试：**123 项通过**
- 深度接手文档：[HANDOFF.md](HANDOFF.md)

## 游戏内容

- **18 关完整战役**，第 18 关终波为沉堤泽蛟。
- **11 种射击塔 + 4 种拦截建筑**；每种射击塔有三级基础档与两条四级专精路线。
- **5 槽编队限制**，不同关卡按自身解锁范围筛选。
- **19 种可点击景物**与 19 类专属交互音，包含木屋、鸟屋、火堆、矿车、冰铃、苔沼石偶等。
- **16 种天气预设**；雪天具有清晰雪片、景物积雪与纯射速减益，不改变单发伤害。
- **区域环境音**：每区 24 秒稀疏事件循环，独立“环境音”开关；战斗、命中、状态、Boss、景物均有独立音色。
- **存档兼容**：Web 使用 `localStorage`，Android 使用 Capacitor Preferences，包名固定为 `com.mosslight.expedition`。

## 本地开发

需要 Node.js 22.18 或更高版本（本机使用 Node.js 24）。

```sh
npm ci
npm run dev         # 本地开发服务器
npm test            # 123 项战斗、关卡、区域纯度、存档、防沉迷门禁与新塔回归测试
npm run build       # TypeScript 类型检查 + Vite 生产构建
npm run mobile:sync # 构建并同步 Web 资源至 Android 工程
```

## Android 打包

安装 JDK 21 和 Android SDK（Platform 36 + Build-Tools 35），并配置 `JAVA_HOME` 与 `ANDROID_HOME`。

```sh
npm run apk:debug
```

产物位于 `android/app/build/outputs/apk/debug/app-debug.apk`。安装包和签名文件保存在构建机本地。

## TapTap 防沉迷适配层

Android 端已加入统一的防沉迷适配层，Web 端不启用：

- TS 桥接：[`src/platform/anti-addiction.ts`](src/platform/anti-addiction.ts)
- 启动门禁与登录/限制提示：[`src/ui/anti-addiction.ts`](src/ui/anti-addiction.ts)
- 原生 TapSDK 适配器：[`TapAntiAddictionPlugin.java`](android/app/src/main/java/com/mosslight/expedition/TapAntiAddictionPlugin.java)

配置方式（二选一）：

```properties
# android/local.properties
taptap.clientId=你的 Client ID
taptap.clientToken=你的 Client Token
```

或构建时传入 `-PTAPTAP_CLIENT_ID=... -PTAPTAP_CLIENT_TOKEN=...`。本机配置文件由 Git 忽略。

TapSDK 依赖已在 `android/app/build.gradle` 中启用，首次构建需联网从 Maven Central 解析 `tap-core`、`tap-login`、`tap-compliance:4.11.1` 及其传递依赖。Gradle 会缓存下载的依赖：

```gradle
implementation 'com.taptap.sdk:tap-core:4.11.1'
implementation 'com.taptap.sdk:tap-login:4.11.1'
implementation 'com.taptap.sdk:tap-compliance:4.11.1'
```

行为约定：未配置 Client ID/Token 时跳过门禁；SDK 异步初始化成功后才进入登录/合规流程；认证通过（`500`）后进入游戏；`1001` 走 TapTap 登录；`1030`、`1050`、`1100` 阻止进入；`9002` 与 `1200` 可重试。当前 `android/app/build/outputs/apk/debug/app-debug.apk` 已包含 TapSDK，但正式 `v1.0.0` 产物与商店素材尚未替换。上线前还需在 TapTap 开发者中心配置包名与签名 MD5、开通 TapTap 登录和合规认证，并补隐私政策/SDK 清单与真机回归。

## 商店文案

**一句话玩法**：离线像素塔防，布置炮塔与拦截小队，在 18 关风雪与毒沼中守住最后一枚微光水晶。

**卖点**：
- 18 关完整战役，林缘、苔岸、矿道、霜脊、毒沼五大区域
- 11 种射击塔 + 4 种拦截建筑，三级基础档与双专精路线
- 16 种天气、19 处可点击景物、完整战斗与环境音效
- 离线单机，无内购；TapTap 渠道版按合规要求接入实名与防沉迷，首次认证需联网

## 商店素材

已准备在 [`outputs/store/`](outputs/store/)：

| 文件 | 用途 |
| --- | --- |
| `icon-512.png` / `icon-1024.png` | 应用图标 |
| `cover-1920x1080.png` | 商店主视觉 / 封面 |
| `feature-1024x500.png` | 商店横幅 |
| `screenshot-01-world-map.png` 至 `screenshot-06-frost-boss.png` | 主地图、毒沼、霜脊、矿道、编队与 Boss 战截图 |
| `trailer-v1.0.0.mp4` | 宣传片 |
| `gameplay-v1.0.0.mp4` | 实机录屏 |
| `taptap-copy.md` | 上架文案与完整素材清单 |

## 目录

| 路径 | 说明 |
| --- | --- |
| `src/content/` | 18 关、怪物、炮塔、天气、主线配置 |
| `src/engine/` | 战斗循环、拦截、怪物技能、机关与路线 |
| `src/render/` | Canvas 地形、单位、炮塔、天气与特效 |
| `src/ui/` | 主地图、战斗 HUD、编队、设置与景物交互 |
| `src/platform/` | 音频、存档、生命周期 |
| `public/sounds/` / `public/music/` | 战斗/环境音与区域音乐 |
| `tests/` | 123 项自动回归测试 |
| `docs/previews/` | 关键版本美术与关卡预览 |
| `outputs/store/` | 商店文案、图片、宣传片和实机录屏 |

## 已知限制

- 第 15–18 关尚无脚本化三星通关计划；第 14 关已覆盖苇篷哨舍 + 冰雹迫击塔三星路线。
- 尚未进行 Android 真机全面回归。
- 当前 APK 为 Debug 签名安装包，不是应用商店正式签名包。
- Vite 仍提示主 JS 包超过 500 kB。
