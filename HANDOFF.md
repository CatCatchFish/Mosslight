# 微光防线 · 项目交接文档

**最后更新：2026-11-26｜已归档测试包：`v1.1.3`（`versionCode=34`，普通闯关版 + 全解锁开发者版）**

这是一个离线单机像素塔防游戏，使用原生 HTML / CSS / TypeScript / Canvas，Vite 构建 Web 资源，Capacitor 封装 Android。**运行时行为以代码、关卡配置和自动回归测试为准。**

项目源码托管在 GitHub。本地构建环境与安装包存放在开发机。

---

## 1. 接手速览（30 秒了解现状）

- **主线进度**。18 站均可正式通关。第五章「瘴雾毒沼」覆盖第 13–18 关，第 18 关终波为沉堤泽蛟。
- **防御体系**。11 种射击塔与 4 种拦截建筑。全局编队最多编入 5 种，关卡按自身解锁范围筛选。第 14 关开放苇篷哨舍，第 15 关开放盐釉投罐塔。
- **验证状态**。153 项自动测试通过，TypeScript 检查、Web 构建与 Android Debug 双包构建成功。Vite 仍提示主包超过 500 kB。
- **打包状态**：普通闯关版为 `outputs/glimmer-defense-1.1.3-debug.apk`；全解锁开发者版为 `outputs/glimmer-defense-1.1.3-debug-unlocked.apk`。两个包均为 Debug 签名，开发者版禁止发布。
- **正式上线状态**：当前仍是测试包，**不能正式上线/商业变现**：无 ISBN/版号、防沉迷已移除、APK 为 Debug 签名，且隐私政策运营者需与 TapTap 认证主体一致。
- **本机开发入口**：`npm run dev` 启动普通模式，`npm run dev:unlocked` 启动全解锁调试模式；除游戏本体外，还内置了三套像素/动作调试预览页（见第 4 节）。

---

## 2. 最新已完成变更

### v1.1.3 测试包（2026-11-26）

- 普通闯关版：`v1.1.3` / `versionCode=34`，约 35 MB，SHA-256 `27f617d4230d5d8b54c4403570bd64070746ad52d920486ba2d7416b232267b8`。[glimmer-defense-1.1.3-debug.apk](outputs/glimmer-defense-1.1.3-debug.apk)
- 开发者全解锁版：`versionCode=34`，约 35 MB，SHA-256 `a2d66ea1291ca4b8526994f22f8b05f35436ac7f7e8e6fa51de151a489860f53`。[glimmer-defense-1.1.3-debug-unlocked.apk](outputs/glimmer-defense-1.1.3-debug-unlocked.apk)
- 本版包含隐私审核修复、怪物技能音效与描述对齐、暂停/后台切出时等待存档队列落盘；两个包均为 Debug 签名，不是商店 Release 包。
- 验证：153 项测试及 Web/Android Debug 构建通过。

### 隐私审核修复（2026-11-25）

- 首启同意页与隐私政策均已明确列出 OAID，并说明 AndroidID、OAID、GID、TDID 等标识仅用于设备去重、安装和统计，不用于广告定向。
- 首启必须勾选“我已阅读并同意隐私政策，并知悉收集 AndroidID、OAID 与 SDK 设备标识”后，“同意并启用”按钮才可用；弹窗固定从顶部开始显示，焦点落在勾选框，不再自动滚到正文中段。
- TapTap 评价入口不再自行初始化 SDK：只有统计同意生效且 TapSDK 初始化成功后才可打开；评价提示也仅在已授权后出现。
- TapDB 初始化已启用 `disableReflectionOAID(true)`，关闭 OAID 反射读取；同时保留兼容性要求的明示披露。
- 本地隐私政策已参考线上协议的章节结构，补充定义、存储与安全保护、共享/转让/公开披露及法定例外、Cookie/广告、用户权利、未成年人、政策更新和完整联系方式；删除了线上模板中不符合实际的“必须注册账号”“一律视为同意”等条款。
- 真机验证（前序同源构建）：未授权冷启动日志只有 TapDB 插件注册，没有 TapSDK / OpenLog / OAID 读取；勾选确认后按钮才启用，同意后才初始化 SDK。最终 `disableReflectionOAID` 构建在设备断开前未完成安装复核。
- 验证：151 项测试、TypeScript、Web 构建及 Android Debug 双包构建通过。审核重提必须上传本次新 MD5 的普通包，并同步线上隐私政策。

### v1.1.2 测试包（2026-11-25）

- 普通闯关版：`v1.1.2` / `versionCode=33`，约 35 MB，SHA-256 `577aca6a686ffadb4a92808ed758efb9b018028be58f77d76451215d754d3f61`。[glimmer-defense-1.1.2-debug.apk](outputs/glimmer-defense-1.1.2-debug.apk)
- 开发者全解锁版：`versionCode=33`，约 36 MB，SHA-256 `4fcdb480205913c5ebc9e0fbb0eed740a24c7bbd14ff816298dfae869164edea`。[glimmer-defense-1.1.2-debug-unlocked.apk](outputs/glimmer-defense-1.1.2-debug-unlocked.apk)
- 本版包含：TapDB 匿名统计与内置隐私政策；盐釉投罐塔、孢匣塔可对空；孢子可传播给空中目标；沼蛾同批载鱼、缚网或母蛾死亡释放；设置页移除统计开关；水獭待机统一正面。
- 隐私审核修复：首启显式勾选确认 OAID/AndroidID 与隐私政策；TapTap 评价入口仅在数据授权开启且 SDK 初始化完成后可用，不再自行初始化 SDK；TapDB 已关闭 OAID 反射读取。
- 验证：151 项测试及 Web/Android Debug 构建通过；两个 APK 签名 MD5 均为 `fbfb01bc39311e4668366a941762372d`。两个包均为 Debug 签名，不是商店 Release 包；前序同源构建已完成真机未授权/勾选/同意链路验证，最终 OAID 关闭构建待重连复核。

### v1.1.1 测试包（2026-11-25）

- APK：`v1.1.1` / `versionCode=32`，约 17 MB，SHA-256 `a7a9a1ffb1534e26dc42c9d84b769b34caad362ec849c06621f800927962dec3`。[APK](outputs/glimmer-defense-1.1.1-debug.apk)
- 内容：新增孢匣塔及蓄力攻击；第 17 关终波加入腐冠瘴母，可扎根孵化活体孢囊、持续获得治疗，孢囊被击破后毒爆连锁；既有天赋、天气、闯关制与隐私政策入口保留。
- 验证：136 项测试、TypeScript 检查、Web 构建与 Android Debug 打包全部通过；签名证书 MD5 保持 `fbfb01bc39311e4668366a941762372d`。

### 毒沼塔对空调整（2026-11-25，源码）

- 盐釉投罐塔与孢匣塔已移除 `groundOnly`：两者现在可索敌并命中空中单位，盐雨分罐、投罐溅射和孢匣持续伤害均对空生效。
- 孢子传播不再排除飞行目标：地面毒孢宿主倒地后可传播给附近的空中敌人，反之亦然。
- 塔描述同步改为“溅射 / 毒孢”，分罐盐雨改为“两个不同目标”；设计文档已去掉“仅对地”。
- 验证：`mire-expansion.test.ts` 覆盖盐雨命中空中目标、孢匣对空 DoT、地面宿主向空中传播，以及沼蛾入场配对、缚网释放和母蛾死亡放客；全量 151 项测试通过。
- 之前的归档 APK 早于本调整；如需真机验证或分发，需重新执行打包命令。沼蛾运载已简化为：同批弹涂鱼入场即附着，乘客在母蛾存活期间不可被单独攻击；缚网命中会立即释放乘客，否则只有母蛾被击落才放下载客；纯空中波次不带乘客。

### TapDB v4 接入（2026-11-25，源码接入完成）

- Android 使用 `com.taptap.sdk:tap-core:4.11.1` 与自定义 Capacitor 插件 `TapDBPlugin`；仅添加网络、网络状态权限，不接入 TapTap 登录、支付或电话状态权限。
- 首启独立保存统计同意状态；拒绝不初始化 SDK，设置内可撤回。原生层和前端层均对未同意、初始化失败或凭据缺失的事件上报做门禁。
- 统计账号使用本机持久化的随机匿名安装 ID，不要求玩家注册或登录；SDK 就绪且已同意后调用 `TapTapEvent.setUserId`，撤回时调用 `clearUser`，再次同意后复用同一匿名 ID。
- 埋点：`stage_start`、`stage_result`、`tower_build`、`tower_upgrade`、`loadout_save`、`talent_upgrade`、`talent_reset`；原生层按白名单过滤事件和属性。
- Client ID / Token 不写入仓库。构建时通过环境变量 `TAPDB_CLIENT_ID`、`TAPDB_CLIENT_TOKEN`、`TAPDB_REGION=CN`（或 `GLOBAL`）提供，也可写入当前 `GRADLE_USER_HOME/gradle.properties`；留空时插件返回 `unconfigured`，不会初始化或上报。
- 隐私政策正文直接内置并复用 `docs/privacy-policy.html`；首启同意页和系统设置均打开游戏内可滚动弹窗，不再跳转浏览器。正文已补充 TapSDK 运营主体、实际数据字段与用途、存储与保留、用户删除渠道、未满 14 周岁监护人同意及撤回后的停止处理说明。线上地址 `https://www.xieyimao.com/doc/detailzh/token/1795569792_5229` 仅供商店/备案使用，仍需另行同步更新。
- 验证（接入时）：145 项测试、TypeScript 检查、Web 与 Android Debug 构建通过；本地政策弹窗已在 960×540 横屏视口验证可滚动、可关闭且 URL 不发生跳转。正式 Debug APK SHA-256 `31d3158a9d6c0329c67f05e8fd3cc0335e9c6274354d4b17212201f459f7f51d`。
- 真机验证（2026-11-25，vivo V2509A / Android 17）：覆盖安装成功，存档、星级和编队保留；“设置”已无数据统计开关，隐私政策底部可撤回/重新开启。`configured=true`、`state=ready`，匿名安装 ID 重启后复用；撤回时用户标识清空，重新开启后恢复；`stage_start` 已进入原生命令，未发现崩溃。TapTap 后台数据到达仍需登录后台核对。
- **后续 TapDB 联调待办**：
  1. 在 TapTap 后台核对包名 `com.mosslight.expedition` 与证书 MD5 `fbfb01bc39311e4668366a941762372d`；不一致会导致初始化 `1001 CONFIG_ERROR`。
  2. 已真机确认：覆盖安装保留存档，首启同意后 `state=ready`，匿名安装 ID 设置成功并在冷启动后复用。
  3. `stage_start` 已确认从 WebView 进入原生 `logEvent`；仍需在 TapTap 后台确认事件实际到达，并补测建造/升级和结算事件。
  4. TapTap 后台“游戏营收模式”应改为“无”，因为游戏没有广告；否则“上报广告展示事件”会成为无意义的必选未完成项。
  5. 将本地 [隐私政策](docs/privacy-policy.html) 同步到线上地址 `https://www.xieyimao.com/doc/detailzh/token/1795569792_5229` 或新的托管地址，并更新 TapTap 后台；游戏内已不依赖该 URL。
  6. 已真机确认撤回/重新开启：撤回后 `setConsent(false)` 并清空用户标识，重新开启后复用同一安装 ID；完全停止 SDK 自动数据仍需彻底结束进程。
- 主要入口：[TapDBPlugin.java](android/app/src/main/java/com/mosslight/expedition/TapDBPlugin.java)、[analytics.ts](src/platform/analytics.ts)、[analytics-consent.ts](src/platform/analytics-consent.ts)、[build.gradle](android/app/build.gradle)、[隐私政策](docs/privacy-policy.html)。

### 开发者全解锁调试包（2026-11-25）

- 用 `npm run apk:debug-unlocked` 生成；只使用 Vite 的 `debug-unlocks` 模式。正常 `npm run build`、`npm run apk:debug` 和发布包不会启用。
- 调试存档使用独立键 `mosslight-expedition.debug-save.v1`：首次读取时复制现有正式存档并注入当前全部 18 关三星，之后调试写入也只落在调试键；正式存档键 `mosslight-expedition.save` 不会被修改或覆盖。
- 全三星提供 54 颗星，足够点亮全部营地加护；地图显示“调试版 · 全关卡三星”徽标，页面标题以“【调试·全解锁】”开头，便于区分。
- 新增回归：`tests/debug-build.test.ts` 覆盖全关三星、营地加护预算及正式存档隔离。浏览器验证解锁模式为 18/18 关、54 星，普通模式仍只开放首关。
- 调试 APK：[glimmer-defense-1.1.1-debug-unlocked.apk](outputs/glimmer-defense-1.1.1-debug-unlocked.apk)，SHA-256 `e6a212b36ec625ed7d59791ff344b45e64a2b88755c0c1cce54bef8078f19c79`。调试包不能用于发布；正式构建已随后恢复。

### v1.1.0 测试包（2026-11-24）

- APK：`v1.1.0` / `versionCode=31`，约 16 MB，SHA-256 `f5b38df0be80b401de360af11a4a7301dd40b4f14bf2daa3452734366aac5de6`。[APK](outputs/glimmer-defense-1.1.0-debug.apk)
- 内容：新增星辉天赋（6 条路线、可重置、存档兼容）；恶劣天气实际影响射速/射程/怪速/减伤；14–18 关数量与基础/强化怪血量分层；闯关制与隐私政策入口保留。
- 验证：125 项测试通过，包含天赋、天气、存档与第 14 关三星回归；重新打包纳入本轮 bug 修复。

### v1.0.5 测试包（2026-11-24）

- APK：`v1.0.5` / `versionCode=30`，约 16 MB，SHA-256 `5db994857b69a8f85f29a22479a0c8d3c913b3afb65f36958f571fb00fbcac3e`。[APK](outputs/glimmer-defense-1.0.5-debug.apk)
- 内容：隐私政策链接改为 `https://www.xieyimao.com/doc/detailzh/token/1795486541_9267`；14–18 关第 3 波起普通怪数量约 +10%，基础怪血量 ×1.15、强化怪 ×1.22，毒沼三种小 Boss 生命与减速抗性上调。
- 验证：122 项测试通过；第 13、14 关三星计划仍通过；安装包不含 TapSDK/网络权限。

### v1.0.4 测试包（2026-11-23）

- APK：`v1.0.4` / `versionCode=29`，约 16 MB，SHA-256 `a1b740f8156fe4727d5bfe3f859b01599da0735616e8adc02ad9b6fe83076f83`。[APK](outputs/glimmer-defense-1.0.4-debug.apk)
- 内容：系统设置新增“隐私政策”，点击后用系统浏览器打开 `https://tapgame-glimmer-privacy.animatedrobin4.chatgpt.site`；移除未使用的网络权限；无防沉迷、无账号，闯关制与解锁动画保留。
- 验证：122 项测试通过；真机点击隐私政策成功打开 Chrome 并加载政策页面。

### v1.0.3 测试包（2026-11-23）

- APK：`v1.0.3` / `versionCode=28`，约 16 MB，SHA-256 `d238e79e5179acdf166f547b64804718a572f8cfdd3d659d8fdab17fd10b9396`。[APK](outputs/glimmer-defense-1.0.3-debug.apk)
- 内容：移除 TapTap SDK、原生插件、启动门禁、防沉迷截图/凭据依赖；保留闯关制地图与解锁动画。启动直接进入地图，无登录/实名流程。
- 验证：122 项测试通过；真机覆盖安装后旧存档与当前进度保留。

### v1.0.2 审核测试包（2026-11-23）

- APK：`v1.0.2` / `versionCode=27`，约 35 MB，SHA-256 `f6fba1513d2ee750da6fa9e83c8f844e3c4709668392953185a432f317ecbdd8`。[APK](outputs/glimmer-defense-1.0.2-debug.apk)
- 内容：在 v1.0.1 的 TapSDK 接入基础上加入闯关制地图：只显示当前进度及下一站，清关后探路者沿小径走到新站点并播放节点/区域解锁动画；125 项测试通过。
- 防沉迷材料已随 v1.0.3 退场，原视频/截图归档在 `TapGame-backups/anti-addiction-assets-20261123/`。
- **风险**：首次启动隐私政策同意页仍未实现，提交审核可能被驳回。

### v1.0.1 审核测试包（2026-11-23）

- APK：`v1.0.1` / `versionCode=26`，约 35 MB，SHA-256 `9ab5c15c053c6f61095043f96747554ee8f77f72579b1c83d4289f41ed76dc96`。[APK](outputs/glimmer-defense-1.0.1-debug.apk)
- 内容：接入 TapSDK 4.11.1，真机验证 TapTap 登录、`500` 放行与冷启动复用登录态；125 项测试通过。
- **风险**：首次启动隐私政策同意页尚未实现，当前启动即初始化 TapSDK；提交审核可能被驳回。

### v1.0.0 正式版

- APK：`v1.0.0` / `versionCode=25`，约 16 MB，SHA-256 `a2f6396464d1414287dc59ea26c4f0e22561c74a564031f0029913fc1809dd90`，签名证书与 v0.7.1 一致。本地归档为 `outputs/glimmer-defense-1.0.0-debug.apk`。
- 汇总纳入：18 关完整战役、11 种射击塔 + 4 种拦截建筑、雪天景物积雪与纯射速减益、全塔伤害/间隔调整、普通怪物 50% 减速上限、完整战斗/环境/景物/Boss 音效、路线引导保留与毒沼显示修复、当前源码 125 项自动测试。
- 商店素材：`outputs/store/` 已准备图标 512/1024、1920×1080 封面、1024×500 横幅、六张实机截图、宣传片和实机录屏。

### 星辉天赋与天气实战效果（v1.1.0）

- **星辉天赋**：用通关获得的星星点亮 6 条路线（行军补给、急行赏金、巧工机括、卫队鼓舞、整备回收、避风灯罩），可随时重置并返还星星；天赋与已见炮塔写入本地存档，旧存档自动兼容。[天赋数据](src/content/talents.ts) · [天赋 UI](src/ui/talents.ts) · [天赋美术](src/render/talent-art.ts) · [存档](src/platform/save.ts)
- **天气实战效果**：强风/大雨/雷暴/沙暴/熔烬/暴风雪/毒暴现在会实际影响炮塔射速或射程、怪物移速或减伤，天气徽章显示效果摘要；避风灯罩可减轻恶劣天气对炮塔的削弱。[天气参数](src/content/weather.ts) · [战斗应用](src/engine/defense.ts) · [HUD 接入](src/ui/battle.ts)
- **音频/表现**：小 Boss/Boss 技能音效分层，天赋、天气和毒沼相关美术同步更新。
- 验证：`tests/talents-weather.test.ts` 覆盖天赋、存档、天气效果；全套 125 项测试通过。

### 闯关制地图与解锁动画（v1.1.0）

- 解锁规则：以已通关最远关卡为边界，只显示该关卡及下一站；旧存档按最高已通关关卡保留进度。区域标签、地区页签和地区关卡按钮同步隐藏未解锁内容。
- 清关返回地图后，新节点以缩放/发光动画出现，区域标签与页签同步入场；探路者沿真实小径曲线走到新站点，完成后自动选中新关并显示“新站点已解锁”。
- 主要改动：[campaign.ts](src/ui/campaign.ts) 的可见性/推进逻辑、[world.ts](src/render/world.ts) 导出的 `trailPoint()`、[scene.css](src/ui/scene.css) 的节点/区域/光环动画、[campaign.ts](src/content/campaign.ts) 的 `unlockedThroughIndex()`。
- 验证：桌面端用受控存档验证了普通下一站与跨区域解锁；Android 真机确认现有进度只显示到第 11 关。当前测试 125 项。
- 已包含在 `outputs/glimmer-defense-1.1.0-debug.apk`。

### 炮塔整体平衡（v1.0.0）

- 仅通过单发伤害与攻击间隔调整，保留溅射、破甲、连锁、减速等机制差异。
- 先对弱路线做中等幅度补强、收敛霜枪两系，再对所有满级专精伤害统一下调约 2%；1–3 级基础档基本保持，避免前期三星计划失稳。
- 最终关键专精：震地炮 63/1.5、寒潮晶柱 18/0.68、岔雷针 53/1.08、破甲弩 106/1.45、散网 32/0.65、聚束 37/0.66、折光 32/0.65、冰裂速臼 61/1.2、厚釉破甲 82/1.45、分罐盐雨 64/1.55、贯冰长枪 90/1.24、连霜齐射 42/0.70。
- 盐釉投罐塔重做：基础档 36/1.85、50/1.7、64/1.55；厚釉破甲改为 82/1.45；分罐盐雨每罐 64/1.55。分罐仍最多两罐，每个敌人每轮最多承受一次冲击；单地面目标时只投一罐。
- 雪天仅降低炮塔射速，不再补偿伤害。
- 高频专精间隔拉长约 6%：碎晶尖塔 0.60→0.64、散网 0.61→0.65、聚束 0.62→0.66、折光 0.61→0.65、散火炉 0.66→0.70、连霜齐射 0.66→0.70；弩箭连发保持 0.26。
- 普通怪物减速上限从 45% 提高到 50%（`MIN_ENEMY_PACE 0.55→0.50`），大小 Boss 仍为 25%；当前 125 项测试通过。[塔数值](src/content/towers.ts) · [慢速上限](src/engine/enemy-abilities.ts)

### 霜脊雪天重做（v1.0.0）

- 雪天不再是整屏白雾：减少雪粒数量、放大单片雪花、提高不透明度并取消闪烁衰减；阵雪/暴雪改用清晰雪片而非冰霰，暴雪暗角降到 0.1。[雪天预设](src/content/weather.ts) · [粒绘制](src/render/weather.ts)
- 大雪会为木屋、遗迹、冰铃、雪灯、浮冰、桥梁等地图景物逐步覆盖积雪；积雪厚度随 `accumulation` 增长并带飘落雪屑动画。[景物积雪](src/render/battle-details.ts) · [接入位置](src/render/battlefield.ts)
- 天气新增炮塔射速倍率：小雪 0.95、阵雪 0.82、暴雪 0.7；只降低射速，不补偿单发伤害，战斗中按当前天气自动生效。[天气参数](src/content/weather.ts) · [炮塔冷却](src/engine/defense.ts) · [战斗接入](src/ui/battle.ts)
- 已包含在 v1.0.0。

### 天气变化提示移除（v1.0.0）

- 删除天气变化横幅、天气图标缩放脉冲及对应 DOM/CSS；天气切换只更新静态天气标签并保留天气音效，不再弹出任何提示。该改动在 v0.7.1 APK 构建之后完成，当前 APK 尚未包含。

### 毒沼显示与底噪清理（v1.0.0）

- 路线引导保留：第 13–18 关继续显示部署期与悬停入口的路线提示。
- 第 16–18 关原本使用 `stones` 风格的桥面改为湿木板桥，保留通行与拦阻判定，只移除发白透明的石桥外观。
- 修复第 13 关荧光孢囊绘制中的错误坐标 `[-2, y]`；该点缺少 `x` 偏移，会把孢囊内层多边形拉成横跨地图的绿色直线。同时限制点击反应在 1.4 秒后停止。[孢囊绘制](src/render/battle-details.ts)
- 毒瘴孢子粒子移除横向拖尾，只保留清晰孢子本体。[天气粒子](src/render/weather.ts)
- 五条区域环境底噪全部移除模拟风声的连续噪音层与低频持续音，只保留鸟鸣、水声点、蛙鸣、气泡、滴水与冰铃；循环延长到 24 秒并大幅降低事件密度，每条仅保留少量离散声音，毒沼气泡除外，保留较密的 12 次气泡。蛙鸣单独增强并降低基频，使蛙声更清楚。[底噪资源](public/sounds)
- 霜脊底噪删除“雪谷木铃”短句，24 秒循环内只保留一次低中频冰面开裂声，由带限碎裂噪声与 255/410Hz 短共鸣组成，避免尖锐脆响；无风声、无低频持续音、无连续噪音底床。[霜脊底噪](public/sounds/ambience-frost.wav)
- 霜脊背景音乐 `frost.m4a` 做 160Hz 双重低切，移除持续低频垫音；原文件备份在 `TapGame-backups/frost-music-original-20261123.m4a`。[音乐资源](public/music/frost.m4a)

### 区域环境底噪、景物互动音与 Boss 低频主题（v1.0.0）

- 五个区域各有一条 24 秒稀疏事件底噪：林缘鸟鸣、苔岸水声与蛙鸣、矿道滴水、霜脊冰裂、毒沼气泡与蛙鸣。进入关卡时按 `biome` 切换，暂停、退出、切后台时随音频上下文停止，恢复后重新淡入。[环境音](src/platform/audio.ts) · [区域映射](src/main.ts)
- 设置新增独立“环境音”开关，默认开启并写入存档；关闭后立即停止环境循环，重新开启时按当前区域恢复。关闭“游戏音效”仍会同时静音环境音。[设置界面](index.html) · [设置逻辑](src/ui/settings.ts) · [存档字段](src/platform/save.ts)
- 19 种可点击景物全部改为专属互动音，从木屋灯火、鸟屋、火堆、鱼篓到矿轨风灯、冰棱风铃、苔沼石偶均不再共用 `interact`。点击时按景物类型播放对应短音，并保留原有动画与提示。[景物映射](src/ui/scenery.ts) · [战斗接入](src/ui/battle.ts)
- 新增低频率 Boss 出场主题音，在 Boss 实体首次出现时触发一次；避免重复播放。[Boss 触发](src/ui/battle.ts)
- 5 条 24 秒环境循环、19 条景物互动音与 1 条 Boss 主题已全部打包进 v0.7.1；浏览器开启音效后资源返回 200，控制台无错误。

### 第二优先级战斗音效（v1.0.0）

- 新塔专属音色：冰雹迫击、盐釉投罐、霜枪塔分别拥有独立开火/命中音，不再复用火炮或重弩；苇篷哨舍接战与立桨抗位移使用木桨/绳索音色，霜狼犬舍使用独立扑咬声。
- 命中材质层：新增护甲、甲壳、血肉、木质、黏液、翼膜、水面 7 类轻量材质音，按敌人 `soundFamily` 与是否飞行叠加到主命中音上，并设置独立音量与最短间隔避免连射叠音。
- 状态与击破反馈：补入盐釉碎陶、冻结/解冻、缚网、点燃、毒囊爆裂、卵囊孵化，以及普通/小 Boss/Boss 三级击杀音。普通击杀音量较低，Boss 死亡使用长尾收束。
- 音频架构新增 `MIX` 元数据统一控制新 cue 的音量与节流；新增 `burn-ignite` 战斗特效与拦截攻击的 `post` 来源标记。[音频系统](src/platform/audio.ts) · [战斗映射](src/ui/battle.ts) · [音效资源](public/sounds)
- 36 个战斗音效 WAV 已随 v0.7.1 打包；浏览器开启音效后资源均返回 200，控制台无资源或运行时错误。

### 盐釉投罐塔与苇篷哨舍数值补强（v1.0.0）

- 盐釉投罐塔三个基础档伤害上调为 34 / 46 / 60，溅射半径提高到 1.0 / 1.05 / 1.1；厚釉破甲改为 80 伤害、降低 18 个护甲减伤百分点、持续 4 秒、溅射 1.2；分罐盐雨改为每罐 40 伤害、盐釉持续 3.6 秒、溅射 1.1。造价不变，强化其地面群伤与破甲定位。[塔数值](src/content/towers.ts) · [破甲规则](src/engine/mire-rules.ts)
- 苇篷哨舍筏卫基础生命/伤害提高到 105/11，二级为 135/15；固堤班为 160/17，系缆阵为 205/24；探滩队为 150/19，双桨巡卫为 195/28，并缩短重生时间、提高拦截半径。造价不变，使其在保留立桨抗位移的同时具备与兔卫岗哨竞争的基础战力。[拦截数值](src/engine/guards.ts)
- 第 13 关三星测试仍通过；盐雨测试的伤害与护甲断言同步更新，已包含在 v0.7.1。

### v0.6.9 → v0.7.0 · 毒沼完整战役与美术动作升级

- 第 14–18 关分别为芦湾折汊、泥炭孤岛、雾脊双岸、沉篱芦荡和苔礁哨堡。战场路标沿主线节点相对方位布置。地图用双路绕湾、双桥登岛、双岸折返、三路换岸和三路攻堡区分地形与火力点位。[关卡配置](src/content/levels/mire-expansion.ts) · [地形与机关参考](docs/previews/mire-maps-14-18.png)
- 倒潮闸沿标线推退普通地面敌人 2.4 格，冷却 17 秒。引灯信标点亮范围 5.5 秒，炮塔优先攻击自身射程内被照亮的敌人，冷却 16 秒。首次点击预览，交战中再次点击触发。部分关卡的同类机关共享冷却。[机关规则](src/engine/devices.ts)
- 第 14–18 关分别有 9、9、10、10、11 波，沿用主线星级、下一站与存档流程。三种普通怪物、三个小领主及织蛛衍生物按波次首次登场。第 18 关的泽蛟出场于最终波，半血后两路泥潮依次冲出。[正式波次](src/content/levels/mire-waves.ts) · [毒沼战斗机制](src/engine/mire-rules.ts)
- 苇篷哨舍带两条拦截专精，筏卫可立桨抗位移。盐釉投罐塔带前置装填、飞罐、碎陶和盐釉破甲。两座塔及新怪使用同一套最终稿像素画稿。[毒沼设计](design/mire-expansion/README.md)

### v0.6.8 → v0.6.9

### 天气系统反馈升级与恶劣天气扩充

- 新增 6 种区域恶劣天气预设（[src/content/weather.ts](src/content/weather.ts)）：`gale`（林涛疾风）、`thunderstorm`（雷暴倾盆）、`sandstorm`（风沙蔽日）、`emberStorm`（熔烬风暴）、`blizzard`（暴风雪）、`toxicStorm`（剧毒瘴暴），共 16 种天气预设，均配置分级（`severity`）、定性描述、主题强调色、暗角（`vignette`）、风切线（`windStreaks`）与参数化闪电。
- 全主线第 01–13 关高压波次、小 Boss 与大 Boss 终波均接入动态天气升级（[src/content/campaign.ts](src/content/campaign.ts) 及各关卡配置）；Canvas 渲染（[src/render/weather.ts](src/render/weather.ts)）新增火星余烬（`ember`）、冰霰（`sleet`）、风切线、分叉双闪闪电与更强的植被风摆。
- HUD 与音效反馈升级（[index.html](index.html)、[src/ui/battle.ts](src/ui/battle.ts)、[src/ui/scene.css](src/ui/scene.css)、[src/platform/audio.ts](src/platform/audio.ts)）：`#battle-weather` 升级为分级主题徽章，天气切换时弹出非遮挡 `#weather-banner` 突变横幅，波次进度条标记恶劣天气波次，并新增 Web Audio 程序化天气过渡音效（`playWeather`）。

### 怪物特殊攻击特效图层重构与形象适配

- 渲染管线拆分地面层与前景层（[src/render/battlefield.ts](src/render/battlefield.ts)、[src/render/sprites.ts](src/render/sprites.ts)、[src/render/animation.ts](src/render/animation.ts)）：新增 `drawEnemyWarningGround` 与 `drawGroundEffect`，在 `units` 之前绘制地裂、弹坑、水浪潮线、寒域法阵、排压焦圈、毒液滩及浮囊瘴母引爆预警圈（并改用 `pixelOval` 2.5D 透视）；前景层仅绘制升空碎块/冰刺/水花、横扫斩痕、下落锤柱、蒸汽毒液与半空爆裂。
- 贴合怪物形象细化三类特殊攻击视觉：裂谷领主改为苔石/铜甲/翠玉琥珀配色；凛冬麋王寒角横扫升级冰蓝+皇家金双弧；闸背鼋新增地面潮线预警与河湾水浪；霜角巨犸强化双前蹄落点凹坑与锯齿冰柱；熔心钻机与炉渣矿车区分双高位喷管与紧凑炉膛；蔓骨毒蛇改为朝向毒牙扇与腐蚀毒滩；浮囊瘴母 `mire-blast` 抬升至半空爆裂并与地面酸蚀圈联动。

### 历史版本：v0.6.8 内容（已纳入历史 APK）

### 小 Boss 数值与攻击力增强

- 8 只区域小 Boss 的生命、护甲、抗减速、技能冷却与悬赏整体上调；霜角巨犸、霜吼雪怪、霜冕寒鹿等后续章节小 Boss 增幅更大，松鬃巨豕保持教学强度。
- 小 Boss 普攻提升至 62–68，闸背鼋浪击 60，巨犸震地 92，熔心钻机排压 38；拦截单位基础兵种现在约 2 下倒地，需要炮塔补足输出。
- 第 3 关巨豕、第 4 关闸背鼋保留较低攻击/数量作为首次小 Boss 教学，第 8/11/12 关分别增加绞链矿傀、霜角巨犸、霜吼雪怪数量。

### 炮塔平衡与机制修正

- 破甲弩穿甲 2.0→1.75；贯冰长枪穿甲 1.85→1.65、受寒 1.75→1.55；聚束棱镜满蓄 1.86→1.72、穿甲 1.5→1.35。
- 灼烧伤害现在受怪物护甲因子影响；重爆炮溅射半径 2.05→1.85，雪崩重臼 2.2→2.0；连发弩射速 0.24→0.26。
- **浮囊瘴母爆炸现在会对范围内的拦截单位造成伤害**，沿用反击减伤系数、受击特效与阵亡重生逻辑；范围内外已由回归测试覆盖。

### 毒沼美术统一与波次节奏

- 沼枝树精压缩为矮胖树墩体型并补回藤条；蔓骨毒蛇改为更长、多段 S 形盘旋爬行，加粗深色描边并放大战场/图鉴尺寸。参考图 `docs/previews/mire-roster-poses.png`、`vine-viper-poses.png`、`mire-and-fox.png` 已同步。
- 13 个可玩关卡各新增 1 个终波前增援波，波数变为 `[5,6,7,7,8,10,9,9,11,9,10,10,9]`；新波只使用本区怪物。
- 第 10–12 关首波改为本区冰兔/霜鳐，第 8 关第二波改回矿屑基础怪；基础怪击杀奖励曾各 +1，后续前期关卡改为击杀收益倍率（见下）。
- `npm test` 107 项通过，`npm run build` 成功。以下体验/美术/天气/空战与前期经济调整均已纳入 v0.6.8 APK。

### 信息、预警、天气与美术更新（v0.6.8）

- 已移除新增的数量/威胁标签波次预览，恢复原来的简单“下一波 · 怪物名”提示。
- 移除了拦截单位重生倒计时提示；燃烧中的浮囊瘴母仍显示真实爆炸半径与引信。
- 技能预警按机制区分：鼓舞用上升箭头、护盾用半圆罩、缩壳用甲片支架、树精花粉、鳄鱼泥裂、蟾蜍水纹、雪狐尾雾、雪怪寒气；寒鹿用极光带、矿车/钻机用地裂蒸汽、毒蛇/豪猪用针刺扇、巨犸用地面裂纹、领主用落锤柱与坑、霜冕寒鹿横扫用扇区、闸背鼋用潮线。仅凛冬麋王「冰封炮塔」保留圆环。
- 重绘芦溪蝾螈、雾翅蛾、矿屑爬虫：统一矮胖体型、粗深描边、低饱和区域配色与单一暖色记忆点；进一步补充蝾螈尾鳍/斑纹/鳃肋、雾翅蛾翅脉/眼斑/绒毛腹节、矿屑爬虫甲缝/铆钉/第二簇矿晶与头灯镜圈；芦溪蝾螈/矿屑爬虫放大战场与图标尺寸。
- 第 12 关 W2–W9 补入霜脊本区雪原冰兔/霜翼鳐作为基础怪承接；第 11 关 W5 补入雪原冰兔。
- 天气表现增强：新增「大雨」预设（第 2 章第 4 波切换），细雨/大雨使用不同落点数量、水圈频率与尺寸；小雪最大积雪约 16%、阵雪约 42%，暴风雪可到 68%；霜脊/毒沼移除大面积雾层与全屏色调，改以清晰雪线、风痕、孢子、沼气泡和积雪表现；恶劣天气切换不再弹横幅或触发标签脉冲（音效保留）。该清晰化改动发生在 v0.6.9 APK 打包之后，当前 APK 尚未包含。
- 飞行单位空中对打动画：俯冲蓄势显示方向性气流与羽屑，冲刺阶段带残影和速度羽毛，命中时在拦截单位处绘制爪痕与羽毛爆散；雾翅蛾增加收翼俯冲与足爪前伸姿态。
- 可点击景物扩充：新增松木鸟屋、守林火堆、浅滩鱼篓、漂流水灯、莲铃浮叶、矿轨风灯、旧手压泵、冰棱风铃、雪灯、苔沼石偶、荧光孢囊；各关重复景物已替换为区域专属元素，单关内不再重复同类景物。
- 前期经济重调：第 01–04 关起始金币为 220 / 250 / 300 / 335，并新增关卡击杀收益倍率 0.25 / 0.45 / 0.67 / 0.85。

### 历史版本：v0.6.6 内容（已纳入历史 APK）

### 第五章毒沼怪物迭代：重绘毒蛇、删除水蛭、新增树精

- **删除「腐沼水蛭」（`bog-leech`）**：已从类型、怪物表、编队、近战风格、渲染器、足迹、粒子、第 13 关波次、动作预览及测试中彻底移除。
- **新增树精原型「沼枝树精」（`mire-treant`）**（[src/content/enemies.ts](src/content/enemies.ts)、[src/render/mire-creatures.ts](src/render/mire-creatures.ts)、[src/render/unit-life.ts](src/render/unit-life.ts)）：
  - 承接第 13 关「瘴缘渡桥」先锋地面怪职责（[src/content/levels/mire-boardwalk.ts](src/content/levels/mire-boardwalk.ts)），自带部分抗减速，并具备主动技能**枝雾驱寒（`ward`）**：摇动垂苔枝冠释放翠绿花粉环，为近处同批同伴提供短暂抗减速庇护；近战为树枝爪击（`claw`）。
  - 美术为高挑瘦劲的多层簇状枝叶树精，破冠枯枝角 + 摇曳垂苔帘 + 树洞双黄灯眼与苔须 + 盘曲分叉根足与爪臂，与「腐根菌巨兽」轮廓彻底区分，支持四向步态与举臂施法动作。
- **重绘「蔓骨毒蛇」（`vine-viper`）**（[src/render/mire-crawlers.ts](src/render/mire-crawlers.ts)、[src/render/unit-life.ts](src/render/unit-life.ts)）：
  - 改为深翠毒鳞 + 惨白骨腹 + 暗藤缠节 + 荧光毒刺的**棘藤眼镜蛇兜帽**造型，配备琥珀立瞳、双毒牙与分叉蛇信；侧/正/背三视角均重绘 8 帧 S 形爬行、6 帧昂首喷毒与 6 帧近战撕咬。
  - 喷毒蓄力时颈下荧光毒囊鼓胀，吐尽毒液进入易伤空窗期（`spent`）时喉囊干瘪灰暗，战场辨识度清晰。[毒沼全阵容动作图](docs/previews/mire-roster-poses.png) · [蔓骨毒蛇动作图](docs/previews/vine-viper-poses.png)

### 霜脊高地最终 Boss「凛冬麋王」神圣化与冰封技能重做

- **神圣形象与全姿态 4 帧动画**（[src/render/frost-boss.ts](src/render/frost-boss.ts)、[src/render/sprites.ts](src/render/sprites.ts)、[src/render/unit-life.ts](src/render/unit-life.ts)）：
  - 重绘为珠白银蓝圣兽王外观，配冰蓝金边礼袍披风、金额冠与蹄甲、巍峨晶角及镂空金环星光光环；`walk` / `cast` / `release` / `brace` / `sweep` / `recover` 全部 6 套姿态均按 4 帧流畅驱动，并附带专属星芒寒符 Boss 气场。
- **非激光冰封重做与冰冻/破冰动画升级**（[src/engine/defense.ts](src/engine/defense.ts)、[src/render/frost-boss.ts](src/render/frost-boss.ts)、[src/render/animation.ts](src/render/animation.ts)、[src/render/battlefield.ts](src/render/battlefield.ts)）：
  - 移除旧版激光连线（`arcs`），改为 Boss 蓄力展开**神圣寒域地面法阵 + 目标炮塔旋转六芒寒符与脚底蔓延冰刺**；释放时以 Boss 为中心扩散双环寒潮冲击波，并在附近目标炮塔处自下而上凝结冰晶（`frozenAt` 驱动 0.34s 凝冰与高光扫过）。
  - 玩家连点 4 次破冰（两次点击间隔超 1.35 秒重置进度）：每次点击触发横向震颤、闪白与飞溅冰屑（第 3 次带暖光预碎脉动），彻底解冻时播放 0.62s 12 块翻滚冰晶碎片与金白复原星尘爆发。麋王倒下时同步解除剩余冰封。动态预览使用 `?mode=frost-moose`。[四向动作图](docs/previews/frost-moose-poses.png) · [实战冰封截图](docs/previews/frost-moose-battle.png)

### 霜脊高地常规怪与小 Boss 精修

- **霜角巨犸（`frost-mammoth`）**（[src/render/regional-minibosses.ts](src/render/regional-minibosses.ts)、[src/engine/melee.ts](src/engine/melee.ts)、[src/engine/guards.ts](src/engine/guards.ts)、[src/content/enemies.ts](src/content/enemies.ts)）：重绘为凶猛长毛冰川猛犸，放大战场体型（`scale: 1.30`）并增强属性（`hp: 1080`、更高重甲与抗减速）；新增**双足抬起震地范围技能（`quake`）**，仅与拦截单位交战时触发，主目标承受 100% 伤害、范围内其余地面拦截单位承受 80% 溅射伤害，不伤及空中狮鹫。
- **雪冠犀（`ram`）**（[src/render/late-game.ts](src/render/late-game.ts)、[src/render/sprites.ts](src/render/sprites.ts)）：放大体型（`scale: 1.08`）并接入高画质斜角光影，重绘侧/正/背及半血低头冲锋形态（三段分块犀甲、四尖雪晶背冠、双弯冰角、四肢关节护蹄、冲锋烈焰目与寒息）。
- **冰帆貂（`ice-sail`）与霜刺豪猪（`frost-porcupine`）**（[src/render/frost-creatures.ts](src/render/frost-creatures.ts)）：冰帆貂改用程序化三视角白貂 + 冰晶尾帆绘制（已清理废弃静态图集 `enemy-art/ice-sail.png`），正/背/侧一致；霜刺豪猪加满三层背部冰刺及蓄刺/耗刺姿态。
- **雪帚狐（`snowbrush-fox`）**（[src/render/sunmirror-enemies.ts](src/render/sunmirror-enemies.ts)）：统一中细轮廓线粗细，保持清晰的深色袜爪与四肢辨识度。[雪帚狐四向动作图](docs/previews/snowbrush-fox-poses.png)

### 拦截建筑与拦截单位机制优化

- **三类拦截建筑建造与升级动画**（[src/render/interceptor-upgrade.ts](src/render/interceptor-upgrade.ts)、[src/render/guards.ts](src/render/guards.ts)、[src/render/griffin.ts](src/render/griffin.ts)、[src/render/regional-interceptors.ts](src/render/regional-interceptors.ts)）：兔卫岗哨、狮鹫巢塔与霜狼犬舍均接入建造落地与升级过渡动效（记录 `builtAt`）。
- **单位独立寻敌与脱战回血**（[src/engine/guards.ts](src/engine/guards.ts)、[src/content/towers.ts](src/content/towers.ts)）：重写拦截单位索敌逻辑，改由拦截单位自身的警戒半径（`aggro`）与牵引上限（`leash`）驱动，并以独立 `seekSpeed` 控制接敌移动速度；选定拦截建筑时显示双层范围圈；新增脱战回血机制（`GUARD_REGEN`：脱战 3.0 秒后每秒回复 10% 最大生命，受击立即中断）。

### 第五章扩展至 18 关、第 13 关「瘴缘渡桥」与机关/波次系统

- **主线地图扩展至 18 关**：[WAYPOINTS](src/content/world.ts) 与 [STAGES](src/content/campaign.ts) 扩展为 18 站（Ch5「瘴雾毒沼」承接第 13–18 关），在西北毒沼绘入 S 型路线、泥炭孤岛（Stage 15）与苔礁哨堡（Stage 18）；右栏 `.region-stops` 以 2×3 网格排布并适配短高横屏（[src/ui/scene.css](src/ui/scene.css)、[src/render/world.ts](src/render/world.ts)）。
- **第 13 关「瘴缘渡桥」**（[src/content/levels/mire-boardwalk.ts](src/content/levels/mire-boardwalk.ts)）：30×19 格毒沼边界，北岸湿地长栈道与南侧泥炭浅滩旧木浮桥在界河木桥前合流；起始金币 760，共 8 波；沿用大地图统一的垂苔树（`swampTree`）、沼泽芦苇（`bogReed`）与沼叶（`bogPad`）。[战场预览](docs/previews/stage-13-boardwalk.png)
- **桥头机关「沉木拦栅」与两步确认交互**（[src/engine/devices.ts](src/engine/devices.ts)、[src/render/devices.ts](src/render/devices.ts)、[src/ui/devices.ts](src/ui/devices.ts)）：升起后 3.4 秒内扣住标线内前 4 个地面敌人，落栅时一并放行（飞行怪与潜泥鳄鱼可穿过），冷却 14 秒；所有战场机关均支持“首次点击预览范围/路线，二次点击执行”。[拦栅范围预览](docs/previews/device-preview.png)
- **全主线波次与经济重平衡**：第 01–13 关合计 97 波；击杀金币整体下调，炮塔与拦截建筑三级升级 +10 金币、四级专精 +20 金币，前两波各额外发放 20 金币。

> 注：以上变更已纳入 v0.6.6 APK。下列小节记录历史里程碑。

### 历史里程碑摘要（v0.6.1 → v0.6.5）

- **v0.6.4 → v0.6.5**：选关界面右侧简介支持溢出自折叠/展开；霜狼全套 6 帧待机/跑扑/冰爪斩击动画重做；狮鹫与兔卫待机动画精修。
- **v0.6.3 → v0.6.4**：横屏手机炮塔编队界面重排（`#loadout-grid` 独立可滚动，满编 `5/5` 支持点击查看详情并轻提示替换）。
- **v0.6.2 → v0.6.3**：主地图第五章由旧裂谷重塑为「瘴雾毒沼」（`miasma` 天气、明信片与图标统一低饱和手绘像素风格）；第 01–12 关初始金币严格单调递增（`220 → 720`）与波次血量重平衡。
- **v0.6.1 → v0.6.2**：彻底清理旧裂谷专属炮塔与怪物（旧存档由 `validTowerSelection` 兼容过滤）；确立严格区域不跨区怪物谱系并在 `tests/content.test.ts` 强制断言；图鉴改为展示本局全部已遇怪物且描述全面定性化（去具体数值）；右侧指挥栏扩宽并新增高伤塔索敌优先级三段切换（`最前` / `高血` / `低血`）。

---

## 3. 待完成事项（按优先级）

| 优先级 | 状态 | 事项 | 接手入口 |
| --- | --- | --- | --- |
| P1 | 待真机验证 | **v1.1.1 真机回归**：覆盖安装校验旧存档/星级/编队/音量/天赋无损迁移；检查横屏刘海安全区、双指 1–3 倍缩放、天赋面板、天气效果提示、第 12 关连点破冰及第 9/12/13 关大波次帧率。 | [src/platform/save.ts](src/platform/save.ts)、[src/ui/talents.ts](src/ui/talents.ts)、[src/ui/battle.ts](src/ui/battle.ts)、[src/ui/battle-viewport.ts](src/ui/battle-viewport.ts) |
| P1 | 部分完成 | **TapDB 真机与后台联调**：真机已确认初始化、匿名安装 ID、撤回/重开、冷启动复用及 `stage_start` 进入原生层；仍需在 TapTap 后台确认数据到达、补测其余事件，并将营收模式改为“无”。 | [TapDBPlugin.java](android/app/src/main/java/com/mosslight/expedition/TapDBPlugin.java)、[analytics.ts](src/platform/analytics.ts)、[HANDOFF 第 2 节](#tapdb-v4-接入2026-11-25源码接入完成) |
| P1 | 待同步 | **线上隐私政策**：游戏内已改为本地弹窗，但商店/备案地址仍是旧通用模板，必须发布当前 [privacy-policy.html](docs/privacy-policy.html)。运营者名称需与 TapTap 认证主体一致。 | [隐私政策](docs/privacy-policy.html) |
| P1 | 阻塞 | **正式上线资质**：无 ISBN/版号时只能开放试玩；防沉迷已移除；当前 APK 为 Debug 签名；`MobCat的工作室` 需与 TapTap 认证主体一致。正式发行需恢复防沉迷、补版号/资质、改用 Release 签名并同步后台签名 MD5。 | [AndroidManifest.xml](android/app/src/main/AndroidManifest.xml)、[build.gradle](android/app/build.gradle)、[隐私政策](docs/privacy-policy.html) |
| P3 | 待选型 | **新炮塔候选**：铺钉塔、回旋叶塔、导灯塔、孢匣塔仍处于设计候选阶段，需用户拍板后再实现。 | [design/tower-candidates.md](design/tower-candidates.md) |

---

## 4. 美术风格与动效规范

新窗口修改或新增任何美术资源时，请严格遵循以下既有风格与工程约束：

- **视觉基调**：自然手绘感像素地形 + 低分辨率高辨识度像素精灵。强轮廓（深色描边）、成块明暗、克制的材质细节（木、石、金属、绒毛、冰晶、苔藤），优先保证在**战场默认 1× 缩放**下瞬间可辨认。
- **绘制管线**：
  - 炮塔、兔卫、霜银狮鹫、霜狼与绝大多数区域怪物均采用 [src/render/pixel-sprite.ts](src/render/pixel-sprite.ts) 的 `paintSprite(..., 2)` 程序化 Canvas 像素画稿并做离屏缓存（逻辑画布 `SIZE = 64, ORIGIN_X = 28, ORIGIN_Y = 54`，安全坐标范围约 `x ∈ [-27, +35], y ∈ [-52, +8]`），用 `stamp` 贴到战场或 UI 图标。
  - 方向图集位于 `src/render/enemy-art/*.png`（当前 12 张，由 [src/render/enemy-atlas.ts](src/render/enemy-atlas.ts) 加载）；其中霜脊的 `frost-hare`、`frost-ray` 使用 [draw_frost_grunts.py](design/enemy-candidates/draw_frost_grunts.py) 生成的 256×512 图集，而 `ice-sail` 已升级为 [src/render/frost-creatures.ts](src/render/frost-creatures.ts) 中的程序化三视角绘制。
  - **画质与减动效开关**：高画质斜角光影（`shadeSprite`）与怪物战场光环/粒子（[src/render/unit-life.ts](src/render/unit-life.ts)）必须尊重 `highQuality()`（[src/render/quality.ts](src/render/quality.ts)）和 `reducedMotion`，确保低画质模式或移动端流畅运行且缓存键区分画质档位。
- **炮塔与拦截单位**：
  - 11 种射击塔以塔身比例、底座、顶部发射机构与主色区分。22 个四级专精配有独立战场画稿与升级图标（[src/render/tower-art.ts](src/render/tower-art.ts)、[src/render/tower-specializations.ts](src/render/tower-specializations.ts)），改动发射部件时需同步核对 [src/render/turrets.ts](src/render/turrets.ts) 炮口偏移。
  - **霜银狮鹫**（[src/render/griffin.ts](src/render/griffin.ts)）：银白鹰首、深蓝长翼、冰蓝羽尖与银灰巢塔；分空中巡守、俯冲扑击、降落收翼、地面爪击四套姿态。
  - **兔卫**（[src/render/guards.ts](src/render/guards.ts)）与 **霜狼**（[src/render/regional-interceptors.ts](src/render/regional-interceptors.ts)）：具备 1–4 级与双专精造型及完整待机/跑扑/受击动画。
- **内置美术预览页**（`npm run dev` 启动后在浏览器直接打开）：
  - 怪物/Boss 动作与特效总览：`/design/unit-motion/preview.html`（支持 `?mode=mire-roster`、`?mode=mire-crawlers`、`?mode=mire-and-fox`、`?mode=frost-moose`、`?mode=frost-roster`、`?mode=frost-bear`、`?mode=minibosses`、`?mode=regional-new` 等模式）
  - 炮塔与专精动画预览：`/design/tower-motion/preview.html`
  - PNG 候选怪物四向预览：`/design/enemy-candidates/preview.html`
- **仓库内静态视觉参考**：
  - [第 7 关横屏战场](docs/previews/stage-07-landscape.png) · [第 13 关毒沼战场](docs/previews/stage-13-boardwalk.png) · [机关范围预览](docs/previews/device-preview.png)
  - [基础塔与专精对照](docs/previews/tower-art-v050.png) · [霜银狮鹫动作对照](docs/previews/griffin-art-v050.png) · [兔卫各级造型](docs/previews/rabbit-guard.png) · [Boss 体型对比](docs/previews/chief-size-comparison.png)
  - [霜脊四向与动作参考](docs/previews/frost-roster-poses.png) · [冰脊雪熊与霜吼雪怪](docs/previews/frost-bear-yeti.png) · [凛冬麋王四向](docs/previews/frost-moose-poses.png) · [凛冬麋王实战冰封](docs/previews/frost-moose-battle.png)
  - [毒沼全阵容动作图](docs/previews/mire-roster-poses.png) · [蔓骨毒蛇三向动作图](docs/previews/vine-viper-poses.png) · [雪帚狐四向动作图](docs/previews/snowbrush-fox-poses.png)

---

## 5. 关卡进度与区域专属怪物谱系

### 5.1 严格不跨区怪物谱系（已由 `tests/content.test.ts` 强制校验）

| 章节 | 区域名称 | 关卡 | 专属怪物阵容（绝不在其他区域出现） |
| --- | --- | --- | --- |
| Ch1 | 林缘岗哨 | 01–03 | 苔泥怪(`slime`)、疾行虫(`runner`)、松针跳鼠(`pine-hopper`)、年轮树灵(`stump-spirit`)、苔背獾(`moss-badger`)、松鬃巨豕(`pine-boar` · 小 Boss) |
| Ch2 | 苔岸河湾 | 04–06 | 桥苔蛙(`weir-frog`)、芦溪蝾螈(`reed-newt`)、渡灯蜗(`ferry-snail`)、苇哨蟹(`reed-crab`)、浮叶水黾(`lily-skater`)、水镜虾(`mirror-shrimp`)、雾翅蛾(`moth` · 飞行)、岩壳兽(`guard`)、闸背鼋(`weir-turtle` · 小 Boss)、莲冠巨蟾(`lotus-toad` · 小 Boss)、裂谷领主(`chief` · 大 Boss) |
| Ch3 | 弃采矿道 | 07–09 | 矿灯鼹(`lamp-mole`)、矿屑爬虫(`ore-crawler`)、煤翎蝠(`cinder-bat` · 飞行)、炉渣矿车(`slag-cart`)、铆钉螨(`rivet-mite`)、磁壳甲虫(`magnet-beetle` · 间歇飞行)、熔心钻机(`slag-driller` · 小 Boss)、绞链矿傀(`cable-overseer` · 小 Boss)、熔轨巨擘(`slag-colossus` · 大 Boss) |
| Ch4 | 霜脊高地 | 10–12 | 霜灯灵(`wisp`)、霜翼鳐(`frost-ray` · 飞行)、雪原冰兔(`frost-hare`)、雪冠犀(`ram`)、冰帆貂(`ice-sail`)、霜刺豪猪(`frost-porcupine`)、镜甲岩羊(`mirror-ibex`)、雪帚狐(`snowbrush-fox`)、冰脊雪熊(`frost-bear`)、寒岩雪傀(`rime-golem`)、霜铃鸮(`frost-owl` · 飞行)、霜角巨犸(`frost-mammoth` · 小 Boss)、霜冕寒鹿(`blizzard-elk` · 小 Boss)、霜吼雪怪(`frost-yeti` · 小 Boss)、凛冬麋王(`frost-moose` · 区域最终 Boss) |
| Ch5 | 瘴雾毒沼 | 13–18 | 沼枝树精(`mire-treant`)、泥沼潜鳄(`mire-croc`)、蔓骨毒蛇(`vine-viper`)、腐根菌巨兽(`mire-mycelid`)、浮囊瘴母(`bloat-sporer` · 飞行)。扩展阵容有藻褶弹涂鱼、泥盾蝲蛄、灯囊沼蛾、鞭须泥鲶、瓮背石蚌、芦影织蛛及卵囊与幼体，最终 Boss 为沉堤泽蛟 |

### 5.2 主线全表（18 个正式关卡）

| 关卡 | 入口 / 波次 | 炮塔 / 拦截上限 | 核心内容与解锁 |
| --- | --- | --- | --- |
| 01 林场初哨 | 1 / 5 | 1 级 / 无 | 弩箭、火炮、冰晶入门塔，建塔教学 |
| 02 松溪营地 | 1 / 6 | 2 级 / 无 | 滚木机关，开放 2 级升级 |
| 03 苇桥渡口 | 2 / 7 | 2 级 / 2 级 | 26×17 格双路浅滩长桥，开放**兔卫岗哨** |
| 04 灯闸长桥 | 2 / 7 | 3 级 / 2 级 | 桥闸机关与下游折返栈道，小 Boss 闸背鼋 |
| 05 睡莲浅滩 | 3 / 8 | 3 级 / 2 级 | 32×20 格三路湖岛，东西水闸共享冷却 |
| 06 翡翠林地 | 2 / 10 | 4 级 / 4 级 | 开放**燧火塔**、四级炮塔与兔卫专精，大 Boss 裂谷领主 |
| 07 赭岩旧矿 | 2 / 9 | 4 级 / 4 级 | 旧矿轨与可点击矿脉，开放**重弩塔**、**缚网塔** |
| 08 绞盘矿廊 | 1→2 / 9 | 4 级 / 4 级 | 三层折返矿轨、迎面矿车绞盘，开放**狮鹫巢塔** |
| 09 分岔矿站 | 3 / 11 | 4 级 / 4 级 | 30×22 格，南侧运渣口换轨 + 7 格矿洞避战 + 大 Boss 熔轨巨擘，开放**蓄光棱镜** |
| 10 霜脊渡口 | 2 / 9 | 4 级 / 4 级 | 冰河渡口，开放**雷鸣塔** |
| 11 照雪双桥 | 2 / 10 | 4 级 / 4 级 | 27×17 格双坡，南北**日轮镜阵**（共享冷却、易伤并压制镜甲岩羊冰甲），平衡敏感（见测试） |
| 12 冰脊哨台 | 3 / 10 | 4 级 / 4 级 | 第 3 波开启寒风崖口，开放霜脊新塔与霜狼犬舍，末波凛冬麋王寒域冰封炮塔 |
| 13 瘴缘渡桥 | 2 / 9 | 4 级 / 4 级 | 30×19 格毒沼边界，北岸栈道和南侧旧木浮桥汇入界桥，新增**沉木拦栅**，760 初始金币 |
| 14 芦湾折汊 | 2 / 9 | 4 级 / 4 级 | 两路绕湾，双倒潮闸共享冷却。开放苇篷哨舍，首遇弹涂鱼与泥鲶 |
| 15 泥炭孤岛 | 2 / 9 | 4 级 / 4 级 | 双桥登岛。开放盐釉投罐塔，首遇蝲蛄与石蚌 |
| 16 雾脊双岸 | 2 / 10 | 4 级 / 4 级 | 双岸折返，引灯共用冷却，首遇吊渡沼蛾 |
| 17 沉篱芦荡 | 3 / 10 | 4 级 / 4 级 | 三路换岸，首遇织蛛及可摧毁卵囊 |
| 18 苔礁哨堡 | 3 / 11 | 4 级 / 4 级 | 三路攻堡，东堤与南桥倒潮闸共用冷却，终波为沉堤泽蛟 |

---

## 6. 核心战斗规则与交互要点

- **波次与经济**：第 1 波手动开启；后续各入口独立倒计时，提前开启仅领取该入口奖励。炮塔出售返还累计投入的 `60%`（向下取整）。大小 Boss 突破核心立即判负。
- **高伤炮塔索敌**：支持右侧面板一键切换 `最前` / `高血` / `低血`（`setTowerPriority`）。
- **拦截建筑与单位**：
  - **独立寻敌与脱战回血**：拦截单位按自身警戒范围（`aggro`）与牵引上限（`leash`）主动寻敌并以 `seekSpeed` 接敌；脱战满 3.0 秒后每秒回复 10% 最大生命，受击即中断。三类拦截建筑均含建造与升级动效。
  - **兔卫岗哨**：可调集结点。三级堤盾班（4 人，减反击伤）/ 苇枪队（3 人，近刺优先、空闲投枪可打飞行）；四级延续三级专精并强化。
  - **狮鹫巢塔**：初始 2 只，常态空中巡守拦截飞行怪，遇地面目标落地爪击。三级**合翼锐爪**合并为 1 只重型狮鹫（可同时拦截 3 敌）；**霜翼编队**增派幼年狮鹫（经历 2 轮完整波次后成长强化）。
  - **霜狼犬舍**：霜原猎犬近战附带寒冷减速；三级分支为群狼（`pack`）或二合一巨狼（`dire`，可同时多目标拦截）。
- **减速上限**：炮塔与地形减速合计最多降低普通怪物 `50%` 移速，大小 Boss 最多 `25%`；不同来源减速独立计时取最强档。
- **图鉴与文案规范**：战斗内图鉴显示本局已遇到的所有怪物，本关首遇置顶并带「新遇」角标；**所有图鉴描述保持定性简洁，不堆砌具体秒数、百分比或伤害阈值**。
- **视口与触控**：双指 1–3 倍连续缩放并保持倍率、拖动画布、右上「还原」/「放大」（快捷键 `Z`），右侧面板与手机端防遮挡快捷机关栏固定不随缩放漂移。
- **存档兼容**：Web 用 `localStorage`，Android 用 Capacitor Preferences，存档键固定为 `mosslight-expedition.save`。请勿随意更改已上线关卡 ID 或包名 `com.mosslight.expedition`。

---

## 7. 项目目录与代码入口

### 7.1 目录索引

| 路径 | 用途 |
| --- | --- |
| [`src/content/`](src/content/) | 18 关正式配置（`levels/`）、18 站主线与首次出场（`campaign.ts`）、炮塔与拦截（`towers.ts`）、怪物（`enemies.ts`、`regional-enemies.ts`）、天气（`weather.ts`）、星辉天赋（`talents.ts`） |
| [`src/engine/`](src/engine/) | 战斗主循环（`defense.ts`）、拦截单位与脱战回血（`guards.ts`）、怪物技能（`enemy-abilities.ts`）、编队与路线（`formation.ts`、`route.ts`）、近战与震地/扫击（`melee.ts`）、机关（`devices.ts`） |
| [`src/render/`](src/render/) | 画布与地形（`battlefield.ts`、`terrain.ts`、`landforms.ts`）、炮塔与专精（`tower-art.ts`、`tower-specializations.ts`、`turrets.ts`、`tower-life.ts`）、拦截建筑与单位（`guards.ts`、`griffin.ts`、`regional-interceptors.ts`、`interceptor-upgrade.ts`）、怪物与特效（`sprites.ts`、`enemy-atlas.ts`、`region-grunts.ts`、`regional-minibosses.ts`、`sunmirror-enemies.ts`、`frost-creatures.ts`、`frost-boss.ts`、`mire-creatures.ts`、`mire-crawlers.ts`、`late-game.ts`、`animation.ts`、`combat-details.ts`、`unit-life.ts`、`quality.ts`） |
| [`src/ui/`](src/ui/) | 战斗交互（`battle.ts`）、缩放视口（`battle-viewport.ts`）、主地图（`campaign.ts`）、编队（`loadout.ts`）、机关按钮（`devices.ts`）、星辉天赋（`talents.ts`）、样式（`scene.css`、`styles.css`） |
| [`src/platform/`](src/platform/) | 存档与迁移（`save.ts`、`storage.ts`）、音效与 BGM（`audio.ts`）、前后台生命周期（`lifecycle.ts`） |
| [`tests/`](tests/) | 11 组共 153 项自动回归测试，含毒沼、天赋/天气、分析同意、评价授权与全解锁存档隔离；闯关推进位于 `progression.test.ts`，全解锁位于 `debug-build.test.ts` |
| [`design/`](design/) | 可编辑的音频脚本、怪物素材生成脚本、炮塔候选说明，以及 `unit-motion/`、`tower-motion/`、`enemy-candidates/` 预览工具 |
| [`docs/`](docs/) | 美术资源清单（`new-art-assets.md`）、隐私政策草稿（`privacy-policy.html`）与 `previews/` 关键版本静态参考图 |
| [`android/`](android/) | Capacitor Android 工程 |
| [`outputs/store/`](outputs/store/) | 商店文案、素材与 v1.1.0 更新说明（`update-notes-v1.1.0.md`） |
| `work/`（开发机本地） | 本机 Android SDK、Gradle 缓存、调试签名（`work/android-user/debug.keystore`）及历史归档（`work/archive/`） |

### 7.2 常见改动速查

- **新增怪物**：同步修改 `EnemyId`（[types.ts](src/engine/types.ts)）→ `ENEMIES`（[enemies.ts](src/content/enemies.ts)）→ 编队默认人数（[formation.ts](src/engine/formation.ts)）→ 近战风格（[melee.ts](src/engine/melee.ts)）→ 绘制、缩放与特效（对应区域渲染文件 + [sprites.ts](src/render/sprites.ts) + [unit-life.ts](src/render/unit-life.ts)）。
- **正式关卡接入**。第 14–18 关地形和机关配置在 [mire-expansion.ts](src/content/levels/mire-expansion.ts)。正式波次在 [mire-waves.ts](src/content/levels/mire-waves.ts)，主线入口与首发怪物图鉴登记在 [campaign.ts](src/content/campaign.ts)。
- **平衡测试注意点**：`tests/new-stages.test.ts` 对第 11 关「照雪双桥」（不用镜阵 3 星且至少漏 1 血，双镜阵满血 `16/16`）、第 12 关「冰脊哨台」破冰通关及第 13 关「瘴缘渡桥」沉木拦栅与 3 星通关均有严格断言；`tests/mire-expansion.test.ts` 新增盐釉双专精、冰雹溅射减速、霜枪破甲/受寒增伤与第 14 关苇篷哨舍+冰雹三星计划。调整数值后务必跑完 `npm test`。

---

## 8. Android 打包与版本管理

- **应用标识**：包名 `com.mosslight.expedition`，SDK `compile/target 36`、`min 24`，横屏 + 沉浸式刘海适配（[AndroidManifest.xml](android/app/src/main/AndroidManifest.xml)、[MainActivity.java](android/app/src/main/java/com/mosslight/expedition/MainActivity.java)）。
- **签名保留**：所有测试包统一使用 `work/android-user/debug.keystore`，确保覆盖安装不丢存档。当前证书 MD5 为 `fbfb01bc39311e4668366a941762372d`。
- **当前普通 Debug 包**：`outputs/glimmer-defense-1.1.3-debug.apk`，约 35 MB，`versionCode=34`，SHA-256 `27f617d4230d5d8b54c4403570bd64070746ad52d920486ba2d7416b232267b8`；与当前 `android/app/build/outputs/apk/debug/app-debug.apk` 一致。
- **开发者全解锁包**：`outputs/glimmer-defense-1.1.3-debug-unlocked.apk`，约 35 MB，SHA-256 `a2d66ea1291ca4b8526994f22f8b05f35436ac7f7e8e6fa51de151a489860f53`。只用于开发调试，不能发布。
- **隐私政策**：游戏内“首启同意页”和“系统设置 → 隐私政策”均读取内置本地正文，不跳转浏览器；线上地址 `https://www.xieyimao.com/doc/detailzh/token/1795569792_5229` 仍需同步发布最新 [privacy-policy.html](docs/privacy-policy.html)。
- **TapDB 状态**：已接入 `com.taptap.sdk:tap-core:4.11.1` 与自定义 `TapDBPlugin`，仅网络/网络状态权限；不含 TapTap 登录、支付、电话状态权限或广告。真机已验证初始化、匿名安装 ID、撤回/重开与冷启动复用；TapTap 后台数据到达仍待核对。
- **正式上线阻塞**：无 ISBN/版号只能开放试玩；防沉迷需恢复；Debug 签名需换 Release 并与 TapTap 后台一致；隐私政策运营者需与认证主体一致。
- **开发机 APK 归档清单**（均在本地 `outputs/`）：
  - `v1.1.3` 普通闯关版 SHA-256 `27f617d4230d5d8b54c4403570bd64070746ad52d920486ba2d7416b232267b8`。[glimmer-defense-1.1.3-debug.apk](outputs/glimmer-defense-1.1.3-debug.apk)
  - `v1.1.3` 开发者全解锁版 SHA-256 `a2d66ea1291ca4b8526994f22f8b05f35436ac7f7e8e6fa51de151a489860f53`，禁止发布。[glimmer-defense-1.1.3-debug-unlocked.apk](outputs/glimmer-defense-1.1.3-debug-unlocked.apk)
  - `v1.1.2` 普通闯关版 SHA-256 `577aca6a686ffadb4a92808ed758efb9b018028be58f77d76451215d754d3f61`。[glimmer-defense-1.1.2-debug.apk](outputs/glimmer-defense-1.1.2-debug.apk)
  - `v1.1.1` 真机已验证普通包（TapDB + 本地隐私政策）SHA-256 `31d3158a9d6c0329c67f05e8fd3cc0335e9c6274354d4b17212201f459f7f51d`。[glimmer-defense-1.1.1-tapdb-debug.apk](outputs/glimmer-defense-1.1.1-tapdb-debug.apk)
  - `v1.1.1` TapDB 接入前旧基线，SHA-256 为 `a7a9a1ffb1534e26dc42c9d84b769b34caad362ec849c06621f800927962dec3`。[glimmer-defense-1.1.1-debug.apk](outputs/glimmer-defense-1.1.1-debug.apk)
  - `v1.1.0`（`versionCode=31`），SHA-256 为 `f5b38df0be80b401de360af11a4a7301dd40b4f14bf2daa3452734366aac5de6`。[glimmer-defense-1.1.0-debug.apk](outputs/glimmer-defense-1.1.0-debug.apk)
  - `v1.0.5`（`versionCode=30`），SHA-256 为 `5db994857b69a8f85f29a22479a0c8d3c913b3afb65f36958f571fb00fbcac3e`。[glimmer-defense-1.0.5-debug.apk](outputs/glimmer-defense-1.0.5-debug.apk)
  - `v1.0.4`（`versionCode=29`，旧隐私政策包），SHA-256 为 `a1b740f8156fe4727d5bfe3f859b01599da0735616e8adc02ad9b6fe83076f83`。[glimmer-defense-1.0.4-debug.apk](outputs/glimmer-defense-1.0.4-debug.apk)
  - `v1.0.3`（`versionCode=28`，无防沉迷），SHA-256 为 `d238e79e5179acdf166f547b64804718a572f8cfdd3d659d8fdab17fd10b9396`。[glimmer-defense-1.0.3-debug.apk](outputs/glimmer-defense-1.0.3-debug.apk)
  - `v1.0.2`（`versionCode=27`，旧审核测试包，含防沉迷），SHA-256 为 `f6fba1513d2ee750da6fa9e83c8f844e3c4709668392953185a432f317ecbdd8`。[glimmer-defense-1.0.2-debug.apk](outputs/glimmer-defense-1.0.2-debug.apk)
  - `v1.0.1`（`versionCode=26`），SHA-256 为 `9ab5c15c053c6f61095043f96747554ee8f77f72579b1c83d4289f41ed76dc96`。[glimmer-defense-1.0.1-debug.apk](outputs/glimmer-defense-1.0.1-debug.apk)
  - `v1.0.0`（`versionCode=25`），SHA-256 为 `a2f6396464d1414287dc59ea26c4f0e22561c74a564031f0029913fc1809dd90`。本地归档为 `outputs/glimmer-defense-1.0.0-debug.apk`。
  - `v0.7.1`（`versionCode=24`），SHA-256 为 `28b9807e84cbe62d4ec2a23e8011bd077333c878536e378d00dd0fe5ecd10be6`。本地归档为 `outputs/glimmer-defense-0.7.1-debug.apk`。
  - `v0.7.0`（`versionCode=23`），SHA-256 为 `cbfe0563edc3c476954b3397a3f0931161c82161c710cef796b220247ea860e5`。本地归档为 `outputs/glimmer-defense-0.7.0-debug.apk`。
  - `v0.6.9`（`versionCode=22`），SHA-256 为 `86d5280305838e77618d55f3651010ede883ff9b8dfbb82a1c87772524049432`。本地归档为 `outputs/glimmer-defense-0.6.9-debug.apk`。
  - `v0.6.8`（`versionCode=21`），SHA-256 为 `9cea8c2af01025a2ab6cbe7997b776d3fc8cd16ae15ce09fd45f5524703eb976`。本地归档为 `outputs/glimmer-defense-0.6.8-debug.apk`。
  - `v0.6.7`（`versionCode=20`），SHA-256 为 `5a0b8218980ad717182371851bccebe03b5fd2ac374675ab869b8b3dbe6f9200`。本地归档为 `outputs/glimmer-defense-0.6.7-debug.apk`。
  - `v0.6.6`（`versionCode=19`），SHA-256 为 `79bbdd654b908c5060bc44944cc308ba15c564570547879ed571d2c52d54e1a1`。本地归档为 `outputs/glimmer-defense-0.6.6-debug.apk`。
  - `v0.6.5`（`versionCode=18`），SHA-256 为 `95a27bfe89b3d7f6332bb42f9995dc6d1c15c44c00dc86e56d25371b3904f048`。本地归档为 `outputs/glimmer-defense-0.6.5-debug.apk`。
  - 历史归档包：`v0.6.4`（17）、`v0.6.3`（16）、`v0.6.2`（15）、`v0.6.1`（14）、`v0.6.0`（13）、`v0.5.0-specializations`（12）、`v0.5.0`（11）、`v0.4.3`（10）、`v0.4.2-ui-fix`（9）、`v0.4.2`（8）、`v0.4.1`。
- **打包新版本标准流程**：
  1. 递增 `package.json`、`package-lock.json` 版本号与 `android/app/build.gradle` 中 `versionCode` / `versionName`。
  2. 运行全量校验：`npm test && npm run typecheck`。
  3. 构建普通包（TapDB 凭据放在 `work/gradle/gradle.properties`，不要提交）：`npm run apk:debug`。开发机建议使用：
     ```sh
     env JAVA_HOME="$(/usr/libexec/java_home -v 21)" \
       ANDROID_HOME="$PWD/work/android-sdk" \
       ANDROID_USER_HOME="$PWD/work/android-user" \
       GRADLE_USER_HOME="$PWD/work/gradle" \
       npm run apk:debug
     ```
  4. 需要全关卡三星调试包时，运行同一环境下的 `npm run apk:debug-unlocked`，复制产物为 `glimmer-defense-<version>-debug-unlocked.apk` 后，必须再运行普通 `npm run apk:debug`，恢复 `app-debug.apk` 为正式闯关逻辑。
  5. 复制正常包到 `outputs/glimmer-defense-<version>-debug.apk` 或带用途后缀的文件名，用 `apksigner verify --print-certs` 与 `shasum -a 256` 校验后停止 Gradle Daemon（`./android/gradlew -p android --stop`），更新本节记录。不要把全解锁包当作正式包归档。
