# 微光防线（Glimmer Defense）

离线单机像素塔防。原生 HTML、CSS、TypeScript 与 Canvas 渲染，Vite 构建，Capacitor 封装 Android。主地图共 18 个站点，覆盖林缘、苔岸、矿道、霜脊与毒沼五大区域。

- 当前版本：**v1.1.3**（`versionCode=34`）
- 自动测试：**153 项通过**
- 深度接手文档：[HANDOFF.md](HANDOFF.md)

## 游戏内容

- **18 关完整战役**，按顺序逐步解锁；未解锁站点不显示，清关后探路者沿小径走到下一站并播放解锁动画。第 18 关终波为沉堤泽蛟。
- **11 种射击塔 + 4 种拦截建筑**；每种射击塔有三级基础档与两条四级专精路线。
- **5 槽编队限制**，不同关卡按自身解锁范围筛选。
- **星辉天赋**：用通关星级点亮 6 条成长路线，可自由重置。
- **19 种可点击景物**与 19 类专属交互音，包含木屋、鸟屋、火堆、矿车、冰铃、苔沼石偶等。
- **16 种天气预设**：恶劣天气会实际影响炮塔射速/射程与怪物速度/减伤，可由避风灯罩天赋减免。
- **区域环境音**：每区 24 秒稀疏事件循环，独立“环境音”开关；战斗、命中、状态、Boss、景物均有独立音色。
- **存档兼容**：Web 使用 `localStorage`，Android 使用 Capacitor Preferences，包名固定为 `com.mosslight.expedition`。

## 本地开发

需要 Node.js 22.18 或更高版本（本机使用 Node.js 24）。

```sh
npm ci
npm run dev         # 普通本地开发服务器
npm run dev:unlocked # 全关卡三星调试模式（独立调试存档）
npm test            # 153 项战斗、关卡、闯关解锁、天赋、天气、存档与新塔回归测试
npm run build       # TypeScript 类型检查 + Vite 生产构建
npm run mobile:sync # 构建并同步 Web 资源至 Android 工程
```

## Android 打包

安装 JDK 21 和 Android SDK（Platform 36 + Build-Tools 35），并配置 `JAVA_HOME` 与 `ANDROID_HOME`。

```sh
npm run apk:debug          # 正常逐关解锁包
npm run apk:debug-unlocked # 开发者全解锁包，禁止发布
```

普通产物位于 `android/app/build/outputs/apk/debug/app-debug.apk`，本地归档为 [glimmer-defense-1.1.3-debug.apk](outputs/glimmer-defense-1.1.3-debug.apk)；开发者全解锁包归档为 [glimmer-defense-1.1.3-debug-unlocked.apk](outputs/glimmer-defense-1.1.3-debug-unlocked.apk)。两者均为 Debug 签名，不是商店发布签名包。构建全解锁包后必须再执行一次 `npm run apk:debug`，恢复普通闯关逻辑。

## 隐私政策

- 游戏内入口：首启同意页、系统设置 → 隐私政策；直接显示内置本地正文，不跳转浏览器
- 本地正文：[docs/privacy-policy.html](docs/privacy-policy.html)
- 线上商店/备案地址仍需另行同步：https://www.xieyimao.com/doc/detailzh/token/1795569792_5229
- 游戏无需账号；经玩家单独同意后使用 TapDB 进行设备与游戏事件统计，可在隐私政策页底部撤回。TapTap 评价入口同样需要该授权；未授权前不会初始化统计或评价 SDK。无广告、无内购、无 TapTap 登录。

## 商店文案

**一句话玩法**：离线像素塔防，布置炮塔与拦截小队，在 18 关风雪与毒沼中守住最后一枚微光水晶。

**卖点**：
- 18 关完整战役，林缘、苔岸、矿道、霜脊、毒沼五大区域
- 11 种射击塔 + 4 种拦截建筑，三级基础档与双专精路线
- 16 种天气、19 处可点击景物、完整战斗与环境音效
- 离线单机，无账号、无内购。

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
| `update-notes-v1.1.0.md` | v1.1.0 更新说明（短版/长版） |

## 目录

| 路径 | 说明 |
| --- | --- |
| `src/content/` | 18 关、怪物、炮塔、天气、主线配置 |
| `src/engine/` | 战斗循环、拦截、怪物技能、机关与路线 |
| `src/render/` | Canvas 地形、单位、炮塔、天气与特效 |
| `src/ui/` | 主地图、战斗 HUD、编队、设置与景物交互 |
| `src/platform/` | 音频、存档、生命周期 |
| `public/sounds/` / `public/music/` | 战斗/环境音与区域音乐 |
| `tests/` | 153 项自动回归测试 |
| `docs/previews/` | 关键版本美术与关卡预览 |
| `docs/privacy-policy.html` | 隐私政策页面草稿 |
| `outputs/store/` | 商店文案、图片、宣传片和实机录屏 |

## 已知限制

- TapDB 真机初始化、匿名安装 ID、撤回/重新开启与冷启动复用已验证；TapTap 后台数据到达仍待确认。
- 尚未进行 Android 真机全面回归。
- 当前 APK 为 Debug 签名安装包，不是应用商店正式签名包。
- Vite 仍提示主 JS 包超过 500 kB。
