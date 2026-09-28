# AI 数学课堂 · 148 个可交互数学实验

为**小学 / 中学数学竞赛**课堂打造的可交互数学实验集合。覆盖 **11 大分类**、共 **148 个实验**，每个都可点开动手玩、边玩边讲。

## 在线访问

- 🌐 **GitHub Pages（永久）**：https://crazyrock114.github.io/mathexperiment/
- 单个实验直达：https://crazyrock114.github.io/mathexperiment/pages/{ID}.html
- 本地：直接双击打开 `index.html`

> 本地若需加载音频，请用本地服务器（`python3 -m http.server`）而不是 `file://`——浏览器会拦截 `file://` 下的音频请求。

---

## 实验分类与数量

| 分类 | 数量 | 说明 |
|---|---|---|
| 数论 | 24 | 完美数、亲和数、快乐数、Harshad 数、卡普雷卡… |
| 序列 | 15 | 斐波那契、黄金比例、Lucas、Bell、错排、Pascal… |
| 几何 | 11 | 内角和、海伦公式、球体积、柏拉图体、欧拉线… |
| π·e | 11 | 投针算 π、Collatz、勾股、四色、拉姆齐、哥德巴赫、孪生素数、π 多算法 |
| 图论 | 12 | 七桥、MST、欧拉回路、容斥、卷积… |
| 概率 | 10 | 二项分布、几何分布、中心极限定理、大数定律、赌徒破产… |
| 算法 | 10 | 24 点、Nim、汉诺塔、二分、冒泡、快排、筛法… |
| 其他 | 10 | 幻方、螺旋矩阵、阿基米德螺旋、贝叶斯、生命游戏… |
| 分形 | 5 | 曼德博、科赫、谢尔宾斯基、科赫曲线、随机分形… |
| 前沿 | 20 | 莫比乌斯带、克莱因瓶、复数、四元数、椭圆曲线、黎曼 ζ… |
| 已证猜想 | 20 | Poincaré、费马大定理、挂谷猜想 n=3、弱哥德巴赫… |
| **合计** | **148** | |

---

## 核心架构

每个实验页（`pages/{ID}.html`）与主广场统一采用**分区面板**：

| 区域 | 内容 |
|---|---|
| ① 原理讲解 | 详细多段讲解，深入浅出 |
| ② 历史背景 | 数学家 / 定理 / 年代，含轶事 |
| ③ 5 步直观讲解 | 概念卡 → 交互验算 → 大范围扫描 → 进阶观察 → 历史时间线 |
| ④ 互动演示 | 单步、扫描、对比等可玩控件 |
| ⑤ AI 讲解 | 一键复制 prompt，交给豆包 / DeepSeek 讲解 |

---

## 功能特色

- **Mavis 讲解音频**：148 个 mp3 全部独立生成（温润青年音色，0.95x 语速），倍速 0.5x–2x 可调
- **深色模式**：一键切换，localStorage 记住
- **PWA**：可添加到主屏幕
- **下载 PNG**：4 个核心 Tab 可导出当前结果
- **移动端适配**：600px 断点 + 触屏 36px+ 点击区
- 没有后端，所有计算在前端完成

---

## 教学场景用法

1. **投屏演示**：打开主广场 → 点开目标实验 → 展开「互动演示」
2. **学生自玩**：发单页 URL → 学生手机打开 → 触屏自动适配
3. **课堂练习**：四色定理 / Nim / 井字棋 / 24 点让孩子当堂玩
4. **孪生素数扫射**：扫到 10000 约 1 秒，散点图实时出
5. **AI 讲解**：孩子卡住 → 老师复制 prompt → AI 讲解 → 孩子复述

---

## 目录结构与构建

```
index.html              ← 唯一真源（CSS + JS + 全部实验文案）
extract_exps.js         ← index.html → experiments_meta.json
experiments_meta.json   ← 中间产物（文案 + render 源码）
gen_pages.py            ← experiments_meta.json + index.html → pages/*.html
pages/{ID}.html         ← 148 个独立单页（生成物，勿手改）
audio/                  ← 355 个 mp3 + TTS 讲稿 txt
```

**改了 index.html 之后必须按顺序重新生成，否则 pages/ 会停留在旧内容：**

```bash
node extract_exps.js      # 重新抽取文案
python3 gen_pages.py      # 重新生成 148 个页面
```

> ⚠️ `extract_exps.js` 只抽取 `id / cat / title / intro / principle / history / tryit / svgDemo / explain / audioUrl / stages / render` 这 12 个字段。**写在这 12 个字段之外的内容（如 `expPack`、`introIntro`）不会出现在 pages/ 上**——这两个字段目前全站无人读取，等于死字段。

---

## 技术栈

- 单文件 HTML（vanilla JS + CSS），每个页面约 2.1 MB
- 图表用 [Chart.js v4.4.1](https://www.chartjs.org/) 走 jsDelivr CDN
- SVG 用于 Voronoi / Ramsey / 井字棋 / π 算法演示
- Canvas 用于投针 / 分形 / 生命游戏
- SMIL 动画用于 SVG 内嵌动画

---

## 内容准确性

本站面向教学，所有数值断言与史实均经过独立复算与权威来源核对。审计记录见 [`AUDIT_REPORT.md`](./AUDIT_REPORT.md)。

已修复的重大问题（详见审计报告）：

- **Chudnovsky 算法溢出**：原实现 `(6k)!` 浮点溢出，默认参数下界面直接显示 `NaN`；已改为按相邻项比值递推
- **布丰投针 L>d 失效**：原公式 `P = 2L/(πd)` 只在 `L ≤ d` 成立，已补长针闭式解
- **Collatz 排名榜全错**：真第一名 97（118 步）原表未提及
- **未解猜想被表述为已证**：孪生猜想 P(2)、n≥4 维挂谷猜想已明确标注仍未解决

如发现仍有错误，欢迎反馈。

---

## License

MIT
