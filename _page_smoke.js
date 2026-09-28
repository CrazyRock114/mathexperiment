/**
 * 用 jsdom 加载**真实生成页面**并执行，扫描运行时错误。
 * 比"手工搭 DOM"忠实得多：pages/{ID}.html 里有完整 DOM + 全部脚本。
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const WORK = __dirname + '/pages';
const only = process.argv[2];                 // 可选：只跑某个 ID
const files = fs.readdirSync(WORK).filter(f => f.endsWith('.html') && (!only || f === only + '.html'));

const BAD = [
  [/\bNaN\b/,                 'NaN'],
  [/\b-In?finity\b/,          'Infinity'],
  [/\[object Object\]/,       '[object Object]'],
  [/�/,                      '乱码'],
  [/>[^<]*\bundefined\b[^<]*</, '渲染出 undefined'],
  [/>[^<]*\bnull\b[^<]*</,     '渲染出裸 null'],
];

const report = [];
let okPages = 0;

for (const f of files) {
  const id = f.replace('.html', '');
  const vc = new VirtualConsole();
  const consoleErrs = [];
  vc.on('jsdomError', e => consoleErrs.push('jsdomError: ' + (e.message || e).slice(0, 140)));
  vc.on('error', (...a) => consoleErrs.push('console.error: ' + a.map(String).join(' ').slice(0, 140)));

  let dom;
  try {
    dom = new JSDOM(fs.readFileSync(path.join(WORK, f), 'utf-8'), {
      runScripts: 'dangerously', pretendToBeVisual: true,
      url: 'http://127.0.0.1:8899/pages/' + f, virtualConsole: vc,
      beforeParse(w) {
        w.Chart = function (c, cfg) { this.data = (cfg && cfg.data) || { labels: [], datasets: [] }; this.update = () => {}; this.destroy = () => {}; this.resize = () => {}; };
        w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, {
          get: (t, k) => {
            if (k === 'canvas') return null;
            if (k === 'createImageData') return (W, H) => ({ width: W, height: H, data: new Uint8ClampedArray(W * H * 4) });
            if (k === 'getImageData') return (x, y, W, H) => ({ width: W, height: H, data: new Uint8ClampedArray(W * H * 4) });
            if (k === 'measureText') return () => ({ width: 10 });
            return () => ({ addColorStop() {} });
          },
          set: () => true
        });
      }
    });
  } catch (e) {
    report.push({ id, kind: '加载失败', detail: String(e.message).slice(0, 140) });
    continue;
  }

  // 等 initPage 跑完
  const w = dom.window;
  try {
    if (w.document.readyState === 'loading') {
      w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
    }
    // 触发 initPage（页面底部是 DOMContentLoaded 监听）
    if (typeof w.initPage === 'function') w.initPage();
  } catch (e) {
    report.push({ id, kind: 'init 抛异常', detail: String(e.message).slice(0, 140) });
  }

  // 取所有可见文本（必须剔除 <script>/<style>，否则读到的是源码不是渲染结果）
  let text = '';
  try {
    for (const el of w.document.querySelectorAll('script, style, template')) el.remove();
    text = w.document.body.textContent || '';
  } catch (e) {}

  const found = [];
  for (const [re, kind] of BAD) {
    const mm = text.match(re);
    if (mm) {
      const i = text.indexOf(mm[0]);
      found.push({ kind, detail: text.slice(Math.max(0, i - 60), i + 60).replace(/\s+/g, ' ').slice(0, 140) });
    }
  }
  for (const e of consoleErrs) found.push({ kind: '控制台错误', detail: e });

  if (found.length === 0) okPages++;
  else report.push({ id, kind: '多问题', detail: found.map(x => `[${x.kind}] ${x.detail}`).join(' || ') });

  dom.window.close();
}

console.log(`\n扫描 ${files.length} 个页面：干净 ${okPages}，有问题 ${report.length}\n`);
for (const r of report) console.log(`  ${r.id}  ${r.kind}\n      ${r.detail}\n`);
process.exit(0);
