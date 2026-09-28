// 校验本轮 MAJOR 批次修正后的文案数值是否与真实计算一致
const fs = require('fs');
const h = fs.readFileSync('/Users/paulshi/Documents/MiniMax/π/mathexperiment/index.html', 'utf-8');
function grab(re) { const m = h.match(re); if (!m) throw new Error('missing ' + re); return m[0]; }
eval([grab(/const CHUD_A = [^;]+;/), grab(/const PI = Math\.PI;/),
      grab(/function chudnovskyPi\(N\) \{[\s\S]*?\n\}/),
      grab(/function buffonP\(L, d\) \{[\s\S]*?\n\}/),
      grab(/function collatzUpTo\(n, stepLimit = 10000\) \{[\s\S]*?\n\}/),
      grab(/function _ntSigma\(n\) \{[^\n]*\}/),
      grab(/function _ntProperDivisors\(n\) \{[\s\S]*?\n\}/),
      grab(/function _nt05Happy\(n\) \{[\s\S]*?\n\}/)].join('\n').replace(/\bconst /g, 'var '));

let fail = 0, pass = 0;
const ck = (n, c, d) => { c ? (pass++, console.log('  ✅ ' + n + (d ? '  ' + d : ''))) : (fail++, console.log('  ❌ ' + n + (d ? '  ' + d : ''))); };
const cnt = (re) => (h.match(re) || []).length;

console.log('=== 文本断言：页面写的数 == 实际算出的数 ===');

// 快乐数 11112 / 11.1%
let h4 = 0, h5 = 0;
for (let n = 1; n <= 10000; n++) if (_nt05Happy(n)) h4++;
for (let n = 1; n <= 100000; n++) if (_nt05Happy(n)) h5++;
ck('快乐数 1..1e4 = 1442', h4 === 1442, '实际 ' + h4);
ck('快乐数 1..1e5 = 14377', h5 === 14377, '实际 ' + h5);
ck('文案写 1442 个（1 万）', cnt(/1442 个快乐数/g) === 1);
ck('文案写 14377 个（10 万）', cnt(/14377 个快乐数/g) === 1);
ck('文案写 14.4%', cnt(/14\.4%/g) === 2, cnt(/14\.4%/g) + ' 处');

// 完美数：1..1000 只有 3 个
let perf = []; for (let n = 2; n <= 1000; n++) if (_ntSigma(n) === n) perf.push(n);
ck('完美数 <1000 = [6,28,496]', JSON.stringify(perf) === '[6,28,496]', perf.join(','));
ck('文案已删掉"扫 1 到 1000…完美数 4 个"', cnt(/完美数 4 个（6、28、496、8128）/) === 0);
ck('文案改为"完美数 3 个"', cnt(/完美数 <strong>3<\/strong> 个/) === 1);

// 亏/过剩 1..1000
let d = 0, a = 0;
for (let n = 2; n <= 1000; n++) { const s = _ntSigma(n); if (s < n) d++; else if (s > n) a++; }
ck('亏数 1..1000 = 750', d === 750, '实际 ' + d);
ck('过剩数 1..1000 = 246', a === 246, '实际 ' + a);
ck('文案写 750 / 246', cnt(/亏数大约 750 个/) === 1 && cnt(/过剩数大约 246 个/) === 1);

// 孪生对 205
function sieve(n) { const s = new Uint8Array(n + 2).fill(1); s[0] = s[1] = 0; for (let i = 2; i * i <= n; i++) if (s[i]) for (let j = i * i; j <= n; j += i) s[j] = 0; return s; }
const sp = sieve(10000); let tw = 0;
for (let i = 2; i <= 10000; i++) if (sp[i] && sp[i + 2]) tw++;
ck('孪生对 1..1e4 = 205', tw === 205, '实际 ' + tw);
ck('全站已无 "122 对"', cnt(/122 对/g) === 0);

// Goldbach 100 = 6 种
const P = sieve(100); let g = 0;
for (let x = 2; x <= 50; x++) if (P[x] && P[100 - x]) g++;
ck('100 的 Goldbach 分法 = 6', g === 6, '实际 ' + g);
ck('全站已无 "8 种分法"', cnt(/8 种分法/g) === 0);

// Bell B_20
// Bell 数：Touchard 递推（BigInt 精确），已对照已知值 B_5/B_10/B_15/B_19
function Cm(n,k){let r=1n;for(let i=0n;i<BigInt(k);i++)r=r*(BigInt(n)-i)/(i+1n);return r;}
const B=[1n];
for(let n=0n;n<=40n;n++){let t=0n;for(let k=0n;k<=n;k++)t+=Cm(n,k)*B[Number(k)];B.push(t);}
ck('Bell 自检 B_5 = 52', B[5]===52n, String(B[5]));
ck('Bell 自检 B_15 = 1382958545', B[15]===1382958545n, String(B[15]));
ck('B_20 = 51724158235372', B[20] === 51724158235372n, B[20].toString());
ck('B_30 有 24 位', B[30].toString().length === 24, B[30].toString().length + ' 位');
ck('文案已改 B_20', cnt(/B_20 = 51724158235372/) === 1);

// Collatz Top5
let top = []; for (let n = 1; n <= 100; n++) top.push([collatzUpTo(n).steps, n]);
top.sort((x, y) => y[0] - x[0]);
ck('Top5 = 97,73,54,55,27', top.slice(0, 5).map(x => x[1]).join(',') === '97,73,54,55,27',
   top.slice(0, 5).map(x => x[1]).join(','));

// Josephus
ck('collatzUpTo(27).steps = 111（文案已用 111）', collatzUpTo(27).steps === 111);
ck('Collatz 文案不含 27（112 步）', !/27[（(]112 步/.test(h));

// 布丰
ck('buffonP(100,80) = 72.8%（L>d 已修正）', Math.abs(buffonP(100, 80) - 0.7280) < 0.001, (buffonP(100,80) * 100).toFixed(2) + '%');

// 事实性文本
ck('全站已无 "0.314" 作为密度（仅剩"常见误解"说明 1 处 + π 数字串）',
   cnt(/渐近密度"约 0\.314/g) === 0);
ck('Harshad 密度改为趋于 0', cnt(/密度会越来越稀|趋于 0/g) >= 1);
ck('全站已无 "菲尔兹奖特别版"', cnt(/菲尔兹奖特别版/g) === 0);
ck('全站已无 "1999 年全情形"', cnt(/1999 年全情形/g) === 0);
ck('全站已无 "2017 年证明弱猜想"', cnt(/2017 年证明弱猜想/g) === 0);
ck('全站已无 "21 个梅森素数"', cnt(/21 个梅森素数/g) === 0);
ck('全站已无 "4 亿亿"', cnt(/4 亿亿/g) === 0);
ck('全站已无 "圆柱形最省材料"', cnt(/圆柱形最省材料/g) === 0);
ck('全站已无 "(n²+1)/2 = 2k²+2k+1" 中心公式', cnt(/中心是 \(n²\+1\)\/2/) === 0);

// ---- 第二轮新增守卫 ----
ck('PE02 Nilakantha 7 项已订正为 3.140881', cnt(/7 项：3\.140881/) === 1);
ck('PE02 Nilakantha 10 项已订正为 3.141840', cnt(/10 项：3\.141840/) === 1);
ck('PE02 Nilakantha 20 项已订正为 3.141624', cnt(/20 项：3\.141624/) === 1);
ck('PE02 已无旧值 3.1424', cnt(/- 10 项：3\.1424/) === 0);
ck('PR08 阿基米德 3.1408/3.141033 歧义已加说明', cnt(/3\.140845（内接）/) === 1 && cnt(/3\.141033/) >= 1);
ck('PB07 赌徒破产死代码已清理', cnt(/fairData|上面 fairData 被推了/) === 0);
ck('EX14 Wigner 区分厄米半圆律 vs Ginibre 圆盘', cnt(/Ginibre 圆盘/) >= 1);
ck('GM05 球比圆柱省材料已说明', cnt(/球面只要 4\.84/) === 1);
ck('OT07 已用四个 2×2 象限表述', cnt(/右下 7\+12\+14\+1/) === 1);
ck('全站已无 "4\+5\+8\+15 = 34"', cnt(/4\+5\+8\+15\s*=\s*34/) === 0);
ck('素数间隙归因已改韦斯津修斯 1931', cnt(/韦斯津修斯/) >= 1 && cnt(/陶哲轩证明素数间隙/) === 0);
ck('王虹出生年 1991', cnt(/1991 年生于广西桂林/) === 1 && cnt(/1986 年生于/) === 0);
ck('王虹菲尔兹奖 2026', cnt(/王虹本人 2026 年 7 月获菲尔兹奖/) === 1);

ck('EX_PROVEN_10 挂谷归因已改 Wang+Zahl 两人 / 仅 n=3', cnt(/王虹与 Joshua Zahl 两人证明了三维（n=3）挂谷猜想/) === 1);
ck('全站已无 "王虹 \+ Guth \+ Zahl 2025 完整证明挂谷"', cnt(/王虹 \+ Guth \+ Zahl 2025 完整证明挂谷/) === 0);
ck('EX_PROVEN_02 已加 2D 挂谷术语辨析', cnt(/二维不存在面积为 0 的挂谷集/) === 1);
ck('全站单引号字符串内无裸换行', !/intro: '[^']*\n/.test(h));

ck('首页分类数已订正为 11 类', cnt(/共 11 类/) === 1);
ck('首页 type 计数已订正 119/9/20', cnt(/基础公理\/定理 \(119\)/) === 1 && cnt(/尚未证明的猜想 \(9\)/) === 1);
ck('全站已无 "基础公理/定理 (120)"', cnt(/基础公理\/定理 \(120\)/) === 0);
ck('全站已无 "9 大类数学实验"', cnt(/9 大类数学实验/) === 0);
ck('AL01 24点计数已订正 566/715', cnt(/566\/715 组（数字 1~10）/) === 1);
ck('FR03 科赫「包络是圆」已订正', cnt(/包络是圆/) === 0);
ck('FR04 分形树不再冒用科赫属性', cnt(/这就是科赫曲线的"无穷长度"/) === 0);
ck('全站已无 "包络是圆"', cnt(/包络是圆/) === 0);

ck('Mavis 介绍卡计数已订正 119/9', cnt(/基础公理\/定理<\/strong>（119 个）/) === 1 && cnt(/尚未证明的猜想<\/strong>（9 个）/) === 1);
ck('Mavis 卡已删虚构例 BSD', cnt(/BSD，数学家/) === 0);

ck('PR01 Stage3 理论值已订正 71.5%', cnt(/id="pr01s3-Pt">71\.5%/) === 1);
ck('PR01 Stage3 已改用 buffonP 长针解', cnt(/PtEl\.textContent = \(buffonP\(L, d\) \* 100\)/) === 1);
ck('Stage3 元素已非 63.7%（63.7% 在 L=80,d=80 处是正确的，勿全站禁用）', cnt(/id="pr01s3-Pt">63\.7%/) === 0);
ck('L=80,d=80 的 63.7% 仍保留（2/π=63.66% 正确）', cnt(/理论跨线率升到 <strong>63\.7%<\/strong>/) === 1);
ck('PR01 Stage3 已加 L>d 教学说明', cnt(/本演示用 <strong>针长 L=60 &gt; 线距 d=50<\/strong>/) === 1);

ck('EX17 波函数已归一化（含 _psiNorm）', cnt(/function _psiNorm\(n\)/) === 1);
ck('EX17 _psiN 已乘归一化常数', cnt(/Math\.exp\(-x \* x \/ 2\) \* _psiNorm\(n\)/) === 1);
ck('全站已无未归一化的 _psiN 写法', cnt(/return _hermite\(n, x\) \* Math\.exp\(-x \* x \/ 2\);/) === 0);

ck('EX10 保角标签已订正 z=1 保角 / z=0 不保角', cnt(/在 <strong>z = 0<\/strong> 处：f′\(0\) = 0 → <strong>不保角<\/strong>/) === 1);
ck('全站已无错误的"z=1 处 45°→90°"标签', cnt(/在 z=1 处<br>原 45° 曲线 → 90° 曲线/) === 0);
ck('EX01 宽度改为真实测量（含 arcPts）', cnt(/const arcPts = \(P, Q, R, N\) =>/) === 1);
ck('EX01 已无硬编码宽度打印', cnt(/宽度 = <strong style="color:#7c3aed;">\$\{s\}<\/strong><br>\(恒等于 s！\)/) === 0);

console.log('\n' + (fail === 0 ? `全部通过 ✅  (${pass} 项)` : `${fail} 项失败 ❌  (通过 ${pass})`));
process.exit(fail === 0 ? 0 : 1);
