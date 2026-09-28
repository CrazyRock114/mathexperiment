/**
 * 交互层体检：对每个页面，把页面上所有 button 点一遍、所有 range/number/text
 * 输入框改值并派发事件，然后扫描"交互之后"的 DOM 有没有 NaN / Infinity /
 * undefined / 乱码 / 控制台异常。
 *
 * 动机：PR01 Stage3（理论值与实算差 5 个点）、EX01（滑块是假装在算）、
 *       PB07（残留死循环）都是"只有动手操作才暴露"的问题。
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const WORK = __dirname + '/pages';
const only = process.argv[2];
const files = fs.readdirSync(WORK).filter(f => f.endsWith('.html') && (!only || f === only + '.html'));

const BAD = [
  [/\bNaN\b/, 'NaN'],
  [/\b-In?finity\b/, 'Infinity'],
  [/\[object Object\]/, '[object Object]'],
  [/�/, '乱码'],
  [/>[^<]*\bundefined\b[^<]*</, '渲染出 undefined'],
  [/>[^<]*\bnull\b[^<]*</, '渲染出裸 null'],
];

let totalClicks = 0, totalInputs = 0, totalStageTabs = 0;
const problems = [];
const report = [];
let clean = 0;

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
for (const f of files) {
  const id = f.replace('.html', '');
  const vc = new VirtualConsole();
  const errs = [];
  // 记录源码行：整包跑时偶发的时序类报错，单页复现不了，必须能从输出直接定位
  const srcOf = (stack) => {
    const m = String(stack || '').match(/<anonymous>:(\d+):(\d+)/);
    if (!m) return '';
    const n = +m[1];
    const line = (fs.readFileSync(path.join(WORK, f), 'utf-8').split('\n')[n - 1] || '').trim();
    return line ? `  >> 行${n}: ${line.slice(0, 110)}` : `  >> 行${n}`;
  };
  vc.on('jsdomError', e => errs.push('jsdomError: ' + (e.message || e).slice(0, 120) + srcOf(e.detail && e.detail.stack)));
  vc.on('error', (...a) => errs.push(String(a.map(x => (x && x.stack) || x).join(' ')).slice(0, 160) + srcOf(a.find(x => x && x.stack))));

  let dom;
  try {
    dom = new JSDOM(fs.readFileSync(path.join(WORK, f), 'utf-8'), {
      runScripts: 'dangerously', pretendToBeVisual: true,
      url: 'http://127.0.0.1:8899/pages/' + f, virtualConsole: vc,
      beforeParse(w) {
        // jsdom 未实现 scrollIntoView（页面会调用），补上——这是检测器缺口，不是页面 bug
        w.Element.prototype.scrollIntoView = function () {};
        w.Element.prototype.scrollTo = function () {};
        // jsdom 未实现 canvas.toDataURL（页面"下载 PNG"按钮会调用）
        w.HTMLCanvasElement.prototype.toDataURL = function () { return 'data:image/png;base64,'; };
        w.URL.createObjectURL = () => 'blob:mock';
        w.URL.revokeObjectURL = () => {};
        w.Chart = function (c, cfg) {
          this.data = (cfg && cfg.data) || { labels: [], datasets: [] };
          this.update = () => {}; this.destroy = () => {}; this.resize = () => {};
        };
        w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, {
          get: (t, k) => {
            if (k === 'canvas') return null;
            if (k === 'createImageData' || k === 'getImageData') return (x, y, W, H) => ({ width: W, height: H, data: new Uint8ClampedArray(W * H * 4) });
            if (k === 'measureText') return () => ({ width: 10 });
            return () => ({ addColorStop() {} });
          }, set: () => true
        });
      }
    });
  } catch (e) { report.push({ id, kind: '加载失败', detail: String(e.message).slice(0, 120) }); continue; }

  const w = dom.window, d = w.document;
  try {
    if (typeof w.initPage === 'function') w.initPage();
  } catch (e) { errs.push('init: ' + String(e.message).slice(0, 120)); }
  // plazaOpen 是异步渲染（setTimeout），等它把面板与 stage 控件注入 DOM
  await sleep(400);

  // 展开所有 <details>，让内容进入 DOM
  try { d.querySelectorAll('details').forEach(x => { x.open = true; }); } catch (e) {}

  const scan = () => {
    const clone = d.body.cloneNode(true);
    clone.querySelectorAll('script, style, template').forEach(e => e.remove());
    return clone.textContent || '';
  };
  // 某个 stage 面板是否"渲染出了东西"（防 SQ05 那类整块空白的回归）
  const panelText = () => {
    const p = d.querySelector('.stage-panel.active') || d.querySelector('.stage-panel');
    if (!p) return '';
    const c = p.cloneNode(true);
    c.querySelectorAll('script, style, template').forEach(e => e.remove());
    return (c.textContent || '').replace(/\s+/g, ' ').trim();
  };

  const before = errs.length;
  const seen = new Set();

  // 1) 点所有 button
  const buttons = [...d.querySelectorAll('button')];
  for (const b of buttons) {
    const key = b.id || (b.textContent || '').trim().slice(0, 24);
    if (seen.has(key)) continue;
    seen.add(key);
    try { b.click(); totalClicks++; } catch (e) { errs.push('click ' + key + ': ' + String(e.message).slice(0, 100)); }
  }

  // 1.5) 逐个点开 5 个 stage 标签，检查每个 stage 面板都真的渲染出了内容
  const stageTabs = [...d.querySelectorAll('.stage-tab[data-step]')];
  for (const tab of stageTabs) {
    const step = tab.getAttribute('data-step');
    try {
      tab.click();
      await sleep(120);
      const txt = panelText();
      if (txt.length < 40) {
        problems.push({ id, kind: 'stage 空白', detail: `step=${step} 面板文本仅 ${txt.length} 字符：${JSON.stringify(txt.slice(0, 60))}` });
      }
    } catch (e) { errs.push('stageTab ' + step + ': ' + String(e.message).slice(0, 90)); }
  }
  totalStageTabs += stageTabs.length;

  // 2) 拨动所有 range / number / text 输入
  const inputs = [...d.querySelectorAll('input[type=range], input[type=number], input:not([type]), textarea')];
  for (const inp of inputs) {
    const key = inp.id || inp.name || 'anon';
    if (seen.has(key)) continue;
    seen.add(key);
    const type = (inp.getAttribute('type') || 'text').toLowerCase();
    const probes = type === 'range'
      ? [inp.min || 0, inp.max || 100]
      : type === 'number'
        ? [1, 2, 5]
        : [inp.value || 'x'];
    for (const v of probes) {
      try {
        inp.value = String(v);
        inp.dispatchEvent(new w.Event('input', { bubbles: true }));
        inp.dispatchEvent(new w.Event('change', { bubbles: true }));
        totalInputs++;
      } catch (e) { errs.push('input ' + key + ': ' + String(e.message).slice(0, 100)); }
    }
  }

  const text = scan();
  const found = [];
  for (const [re, kind] of BAD) {
    const mm = text.match(re);
    if (mm) { const i = text.indexOf(mm[0]); found.push({ kind, detail: text.slice(Math.max(0, i - 60), i + 60).replace(/\s+/g, ' ').slice(0, 130) }); }
  }
  for (const e of errs.slice(before)) {
    // 以下都是 jsdom 自身未实现的能力（真实浏览器里正常），不是页面缺陷
    if (/Not implemented/.test(e) && /HTMLMediaElement|HTMLAudioElement|toDataURL|CSS|scroll|IntersectionObserver|ResizeObserver|matchMedia|alert|confirm|prompt|getUserMedia|print/.test(e)) continue;
    found.push({ kind: '交互异常', detail: e });
  }

  if (!found.length) clean++;
  else report.push({ id, kind: '多问题', detail: found.slice(0, 3).map(x => `[${x.kind}] ${x.detail}`).join(' || ') });
  dom.window.close();
}

console.log(`\n交互体检：${files.length} 页 —— 干净 ${clean}，有问题 ${report.length}`);
console.log(`共点击 ${totalClicks} 次按钮，改写 ${totalInputs} 次输入框，逐个打开 ${totalStageTabs} 个 stage 标签\n`);
for (const r of report) console.log(`  ${r.id}  ${r.kind}\n      ${r.detail}\n`);
})();
