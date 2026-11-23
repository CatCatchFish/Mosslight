# 新增美术资源清单（供精修与美化）

本文档记录第四章「霜脊高地」与第五章「瘴雾毒沼」的怪物、炮塔、拦截建筑及场景资源绘制入口。

## 统一美术与验证规范

1. **像素风格**：延续自然地形 + 低分辨率高辨识度像素精灵；程序化绘制统一使用 `paintSprite(..., 2)`（2× 像素缩放，画布 `64×64`，原点 `(28, 54)`），注重暗部描边与明暗分层。
2. **画质与动效开关**：高画质光影、光晕、粒子与漂浮特效必须遵守 `highQuality()` 与 `reducedMotion` 开关。
3. **四级专精键名校验**：修改 `src/render/tower-specializations.ts` 时，必须保持 `SPECIALIZATION_ART` 中的键名与 `src/content/towers.ts` 的 `TOWERS[id].paths` 一致（`tests/content.test.ts` 会自动校验）。
4. **改动后验证**：每次美术改动后需执行 `npm test` 与 `npm run build`，并在浏览器预览页目视复核无裁切、错位或报错。

---

## A. 第四章「霜脊高地」怪物

| 怪物 | 绘制入口 | 帧与识别特征 |
| --- | --- | --- |
| 冰帆貂（`ice-sail`） | [src/render/frost-creatures.ts](../src/render/frost-creatures.ts) 的 `paintIceSail` | 程序化三视角白貂 + 晶蓝尾帆，奔跑与贴地展帆滑行姿态 |
| 霜刺豪猪（`frost-porcupine`） | [src/render/frost-creatures.ts](../src/render/frost-creatures.ts) 的 `paintFrostPorcupine` | 三层密布背刺，含蓄势射刺与耗刺（`spentQuills`）姿态 |
| 冰脊雪熊 / 霜吼雪怪 | [src/render/frost-creatures.ts](../src/render/frost-creatures.ts) 的 `paintFrostBear` / `paintFrostYeti` | 四向步态与冲锋/怒吼姿态 |
| 雪冠犀（`ram`） | [src/render/late-game.ts](../src/render/late-game.ts) | 放大体型、三段分块犀甲、四尖雪晶背冠与半血低头冲锋形态 |
| 霜角巨犸（`frost-mammoth`） | [src/render/regional-minibosses.ts](../src/render/regional-minibosses.ts) 的 `paintFrostMammoth` | 长毛冰川猛犸，含双足抬起震地（`rear` / `slam` / `recover`）动作 |
| 凛冬麋王（`frost-moose`） | [src/render/frost-boss.ts](../src/render/frost-boss.ts) 的 `paintFrostMoose` | 神圣珠白礼袍麋王 + 镂空金环星光光环，6 套姿态全 4 帧动画 + 寒域冰封/破冰特效 |
| 雪帚狐 / 镜甲岩羊 | [src/render/sunmirror-enemies.ts](../src/render/sunmirror-enemies.ts) | 雪帚狐对角步态与清晰四肢袜爪；镜甲岩羊日光暴露姿态 |
| 雪原冰兔 / 霜翼鳐 | [draw_frost_grunts.py](../design/enemy-candidates/draw_frost_grunts.py) 导出图集，[enemy-atlas.ts](../src/render/enemy-atlas.ts) 加载 | 256×512 四向双动作图集 |

---

## B. 霜脊高地远程炮塔及四级专精

| 区域 | ID / 名称 | 本体与塔顶位置 | 四级专精位置（2 分支） | 待机 / 炮台 / 雪基座与弹道位置 | 视觉构成 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 第四章 霜脊高地 | `hail-mortar` 冰雹迫击塔 | `src/render/regional-tower-art.ts` 的 `paintHailMortar`，由 `tower-art.ts` 注册 | `src/render/tower-specializations.ts`<br>`avalanche` 雪崩重臼 / `glacier` 冰裂速臼 | `src/render/turrets.ts`<br>`src/render/tower-life.ts`<br>`src/render/frost-watch-art.ts`<br>`src/render/animation.ts` | 粗短霜蓝臼炮 + 冰雹弧线弹道与冰霜溅射；重臼加固架、速臼冰筒与冰渣爆裂 |
| 第四章 霜脊高地 | `glaze-lance` 霜枪塔 | `src/render/regional-tower-art.ts` 的 `paintGlazeLance`，由 `tower-art.ts` 注册 | `src/render/tower-specializations.ts`<br>`skewer` 贯冰长枪 / `flurry` 连霜齐射 | `src/render/turrets.ts`<br>`src/render/tower-life.ts`<br>`src/render/frost-watch-art.ts`<br>`src/render/animation.ts` | 细长冰晶矛架 + 冰蓝高速穿刺弹道；单轨长枪与三联发射轨，配冰矛拖尾 |

---

## C. 拦截建筑与守卫

| 区域 | ID / 名称 | 所在文件 | 核心绘制函数 | 视觉构成 |
| :--- | :--- | :--- | :--- | :--- |
| 第四章 霜脊高地 | `frost-kennel` 霜狼犬舍（建筑 + 冰原猎犬） | `src/render/regional-interceptors.ts`<br>`src/render/interceptor-upgrade.ts`<br>`src/render/guards.ts` | `kennelBuilding`（1/2 级 & `pack` / `dire` 分支）<br>`frosthoundSprite`（6 帧待机/奔跑/扑咬/冰爪斩击） | 覆雪原木犬棚 + 冰蓝霜犬（`dire` 分支为二合一巨狼）；全三类拦截建筑均含建造/升级动画 |

---

## D. 第五章「瘴雾毒沼」（`biome === "mire-edge"`）怪物与场景

| 类别 | 资源内容 | 绘制入口 | 视觉构成与机制对应 |
| :--- | :--- | :--- | :--- |
| 沼枝树精（`mire-treant`） | 树精先锋与枝雾驱寒动作 | `src/render/mire-creatures.ts` 的 `paintMireTreant`<br>`src/render/unit-life.ts` | 多层簇状枝叶树冠 + 破冠叉状枯枝 + 摇曳垂苔帘 + 树洞双黄灯眼 + 盘曲根足与爪臂，举臂施法散开沼泽光粉 |
| 蔓骨毒蛇（`vine-viper`） | 棘藤兜帽毒蛇三视角全动作 | `src/render/mire-crawlers.ts` 的 `paintVineViper`<br>`src/render/unit-life.ts` | 深翠毒鳞 + 惨白骨腹 + 暗藤毒刺 + 兜帽 + 荧光毒囊（喷毒后干瘪示警），8 帧爬行 + 6 帧喷毒 + 6 帧撕咬 |
| 泥沼潜鳄 / 腐根菌巨兽 / 浮囊瘴母 | 潜泥、自愈与浮空菌雾毒沼怪物 | `src/render/mire-creatures.ts` 的 `paintMireCroc` / `paintMireMycelid` / `paintBloatSporer` | 潜鳄潜泥压低姿态、菌巨兽厚重紫伞菌甲、浮囊瘴母漂浮孢囊与灼烧引爆特效 |
| 毒沼地貌与场景装饰 | 垂苔树、沼泽芦苇、沼叶、泥炭水岸与沉木拦栅 | `src/render/landforms.ts`（`swampTree`、`bogReed`、`bogPad`）<br>`src/render/terrain.ts` / `src/render/devices.ts`<br>`src/render/postcard.ts` / `src/render/world.ts` | 战场、明信片与主地图共用同一套低饱和毒沼树木、水岸与旧木浮桥美术 |
