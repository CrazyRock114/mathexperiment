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
// 注意：String.match(re) 在 re 没有 /g 时只返回第 1 个匹配（长度恒为 1），
// 原先的 cnt() 因此把 "恰好 1 次" 退化成了 "至少 1 次"。改用 matchAll 精确计数。
const cnt = (re) => {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  return [...h.matchAll(g)].length;
};

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

ck('SQ05 ReferenceError 已修（整个 stage 曾是死的）', cnt(/if \(!runBtn\);/) === 0);
ck('全站已无残缺守卫 if (!x);', cnt(/if \(![A-Za-z_$][\w$]*\);/) === 0);

ck('AL01 5 种括法已补全（不再有 apply(...,p[3]) 误用）', cnt(/apply\(apply\(p\[1\], p\[2\], o2\), p\[3\], o3\), o1\]/) === 1);
ck('全站已无把 p[3] 当运算符下标的写法', cnt(/apply\(apply\(p\[0\], apply\(p\[1\], p\[2\], o2\), o3\), p\[3\]\)/) === 0);
ck('PB10 二项 PMF 已改连乘（阶乘会溢出成 NaN）', cnt(/let comb = 1;\n        for \(let i = 0; i < k; i\+\+\) comb \*= \(n - i\) \/ \(k - i\);/) === 1);
ck('全站已无 PB10 的 factorial(n)/factorial(k) 写法', cnt(/const binom = factorial\(n\) \/ factorial\(k\)/) === 0);

ck('AL01_s2 已补第 4 种括法 (a o1 (b o2 c)) o3 d', cnt(/\/\/ 4\. \(a o1 \(b o2 c\)\) o3 d   ← 原先遗漏/) === 1);
ck('AL01_s2 已补第 5 种括法 a o1 (b o2 (c o3 d))', cnt(/\/\/ 5\. a o1 \(b o2 \(c o3 d\)\)   ← 原先遗漏/) === 1);
ck('AL01 三处求解器均已含第 5 种括法 r34', cnt(/r34 = apply\(p\[2\], p\[3\], o3\)/) >= 3, cnt(/r34 = apply\(p\[2\], p\[3\], o3\)/) + ' 处（s2/s3/s4）');

ck('PR03 已能识别非本原解（isPrim）', cnt(/const isPrim = gcdABC === 1;/) === 1);
ck('PR03 文案已改为「恒等式 + 需另加两个条件」', cnt(/一定满足 a² \+ b² = c²/) === 1);
ck('全站已无「一定是一组本原勾股数」的过度断言（注释里的引述不计）',
   cnt(/<[^>]*>[^<]*一定是一组本原勾股数/) === 0 && !/<p>[^<]*一定是一组本原勾股数/.test(h));

ck('PR07 时间线时序已纠正（梅纳德 600 在前、246 在后）', cnt(/year: '2013\.11', bound: '600'/) === 1 && cnt(/year: '2014\.4', bound: '246'/) === 1);
ck('全站已无「2014 年 梅纳德 600」的时序错误', cnt(/2014 年 梅纳德 用新方法独立做到 600/) === 0);

ck('EX05 垂心法向量已全部修正为 (C0-B0, C1-B1)（s2/s3/s4 三处）',
   cnt(/const a1 = C\[0\]-B\[0\], b1 = C\[1\]-B\[1\]/) >= 3, cnt(/const a1 = C\[0\]-B\[0\], b1 = C\[1\]-B\[1\]/) + ' 处');
ck('EX05 中垂线法向量已全部修正为 (B0-A0, B1-A1)（三处）',
   cnt(/const p1 = B\[0\]-A\[0\], q1 = B\[1\]-A\[1\]/) >= 3, cnt(/const p1 = B\[0\]-A\[0\], q1 = B\[1\]-A\[1\]/) + ' 处');
ck('全站已无 EX05 写反的垂心系数', cnt(/const a1 = B\[1\]-C\[1\], b1 = -\(B\[0\]-C\[0\]\)/) === 0);

ck('OT08_s4 已改用 minimax 返回值判定胜负', cnt(/const label = best > 0 \? 'O 胜'/) === 1);
ck('全站已无 OT08_s4 用 checkWin 判首步结果', cnt(/const w = checkWin\(b\);\n        const label/) === 0);

ck('AL02_s2 胜负判定已修正（奇数步=先手赢）', cnt(/const winner = turn === 0 \? '对手' : '先手';/) === 1);
ck('全站已无 AL02_s2 反向的 winner 判定', cnt(/const winner = turn === 0 \? '先手' : '对手';/) === 0);

ck('AL01_s4 可解判定已与直方图分档解耦', cnt(/const solvableThis = numSol > 0;/) === 1);
ck('全站已无 floor(numSol/6) 兼作可解判定', cnt(/numSol = Math\.min\(10, Math\.floor\(numSol \/ 6\)\);\n        buckets/) === 0);
ck('OT05_s4 铺法数初值已修正为 [1,1]', cnt(/const T = \[1, 1\];\n      for \(let i = 2; i <= N; i\+\+\) T\.push/) === 1);
ck('OT01_s3 不再把同一镜像推 4 次', cnt(/for \(let k = 0; k < 4; k\+\+\) all\.push\(m\)/) === 0);

ck('SQ07_s4 已改为真斜线（i−j=k）', cnt(/斜线 \$\{k\} 之和（i−j=\$\{k\}）/) === 1);
ck('全站已无「i+j=k 恒等于 k」的旧循环', cnt(/const j = k - i;\n        if \(i \+ j <= n\) sum/) === 0);
ck('NT19_s2 已改用 BigInt Miller-Rabin', cnt(/const is普里姆eBig = \(n\) =>/) === 1);
ck('全站已无 d<=100 的试除上限', cnt(/Number\(m > 1000000n \? 10000 : Number\(m\)\)/) === 0);
ck('NT09_s2 已加 gcd(b,n) 前提判定', cnt(/费马小定理不适用/) === 1);
ck('全站已无从未生效的 is普里姆eToN', cnt(/const is普里姆eToN =/) === 0);
ck('NT14_s3 数字根分桶已用 ((n-1)%9)+1', cnt(/counts\[\(\(n - 1\) % 9\) \+ 1\]\+\+/) === 1);
ck('NT14_s3 已改取 slice(1,10)', cnt(/data: counts\.slice\(1, 10\)/) === 1);

ck('NT07_s2 跳过分支不再谎报「1 步到 6174」',
   cnt(/永远到不了 6174<\/strong>（这类数的下一步恒为 0/) === 1);
ck('全站已无「1 步到 6174」的不成立断言', cnt(/🎉 1 步到 6174/) === 0);
ck('NT10_s2 clamp 已放宽到 9999999', cnt(/Math\.min\(9999999, parseInt\(nInput\.value\) \|\| 22\)/) === 1);
ck('SQ10_s3 理论值标签已对调（0↔1/φ）', cnt(/理论 1\/φ ≈ \$\{\(phi1\*100\)/) === 1 && cnt(/理论 1\/φ² ≈ \$\{\(phi2\*100\)/) === 1);
ck('NT18_s2 欧拉公式已按不同质因子去重', cnt(/p 取不同质因子/) === 1);
ck('NT04_s4 硬编码表 9 位数已订正为 4', cnt(/9: 4, 10: 1, 11: 8, 12: 0/) === 1);
ck('全站已无 NT04_s4 旧错误表', cnt(/8: 3, 9: 0, 10: 1, 11: 8, 12: 1/) === 0);

ck('AL02_s4 标题不再谎报「搜 1000 步」', cnt(/用博弈树（搜 1000 步）验证/) === 0);
ck('AL02_s4 已如实写「递归深度 6」', cnt(/递归深度 <strong>6<\/strong>/) === 1);
ck('OT09_s4 random_ok 标签已改为 2/3', cnt(/换杯 1\/2/) === 0);
ck('OT04_s2 已移除 parseInt||12345 吞 0', cnt(/parseInt\(nIn\.value\) \|\| 12345/) === 0);
ck('OT04_s2 负数已显式拒绝', cnt(/负数没有数字根（数字根是对非负整数按 9 取模定义的）/) === 1);
ck('FR03 Koch 峰点公式已含 dx/2（两处）', cnt(/peakX = \w+\[\d\] \+ dx \/ 2 - dy \* Math\.sqrt\(3\) \/ 2/) === 1 && cnt(/const peakX = bx \+ dx \/ 2 - dy \* Math\.sqrt\(3\) \/ 2/) === 1);
ck('全站已无缺 dx/2 的 Koch 峰点公式', cnt(/dx - dy \* Math\.sqrt\(3\) \/ 2/) === 0);
ck('FR04_s2 已区分「第 n 代」与「整棵总长」', cnt(/整棵树（0~' \+ n \+ ' 代全部枝条）总长/) === 1);
ck('FR04_s2 r=0.5 边界已处理', cnt(/每代等长，总长恒为 n\+1 = ' \+ \(n \+ 1\)/) === 1);
ck('OT07_s3 变体 A 已换成合法幻方', cnt(/变体 A（丢勒旋转 90°）/) === 1);
ck('全站已非幻方的变体 A', cnt(/g: \[1, 14, 12, 7, 6, 11, 9, 8, 10, 5, 13, 16, 15, 2, 4, 3\]/) === 0);

ck('GR01_s3 奇度顶点数据已订正', cnt(/const data = \[0, 2, 0, 4, 4\];/) === 1);
ck('全站已无 GR01_s3 旧错误数据', cnt(/const data = \[0, 2, 5, 2, 4\];/) === 0);
ck('GR01 规律文案已按 K_n 度数= n-1 改写', cnt(/每个顶点度 = n−1/) === 1);
ck('toPoly/polyStr 常数项修复已落地（GR08 + GR02 两处）',
   cnt(/if \(v === 1\) return term === '' \? '1' : term;/) >= 2, cnt(/if \(v === 1\) return term === '' \? '1' : term;/) + ' 处');
ck('全站已无 toPoly 丢常数项的旧写法（注释里的引述不计）',
   !/[^/*]\(v === 1 \? '' : v\)/.test(h.replace(/\/\/.*$/gm, '')));
ck('EX14 Ginibre 圆盘半径已订正为 1', cnt(/const Rbound = Rdisk \* 1\.0;/) === 1);
ck('全站已无把 2√N 画成 Ginibre 半径', cnt(/Rbound = 2 \* Math\.sqrt\(N\)/) === 0);
ck('EX08_s3 格子按取值个数分配', cnt(/cellH = H \/ aVals\.length/) === 1);
ck('全站已无 EX08_s3 的 H/3 硬编码', cnt(/const cellW = W \/ 3, cellH = H \/ 3;/) === 0);

// ---- v18.15：EX/GR/GM + AL/FR/OT 复核项 ----
ck('EX18 _matMul 已改为「行向量 × 矩阵」（马尔可夫更新方向）',
   cnt(/for \(let j = 0; j < 3; j\+\+\) for \(let i = 0; i < 3; i\+\+\) C\[j\] \+= B\[i\] \* A\[i\]\[j\];/) === 1);
ck('全站已无把行随机 P 当列向量乘的旧 _matMul',
   cnt(/for \(let i = 0; i < 3; i\+\+\) for \(let j = 0; j < 3; j\+\+\) C\[i\] \+= A\[i\]\[j\] \* B\[j\];/) === 0);
ck('EX18 已删除死函数 _matPowMulVec', cnt(/_matPowMulVec/) === 0);
ck('EX18_s3 「第 30 步后」不再多乘一步', cnt(/if \(k < steps\) cur = _matMul\(P, cur\);/) === 1);
ck('EX18_s4 PageRank 已改为幂迭代实算', cnt(/for \(let it = 0; it < 3000; it\+\+\)/) === 1);
ck('全站已无 EX18_s4 硬编码 PR 值', cnt(/PR = 0\.220, PR\(B\) = 0\.330/) === 0 && !/pr: 0\.220/.test(h));
ck('GR07_s3 生日悖论只取一次随机数（避免集合内自碰撞）',
   cnt(/const v = Math\.floor\(Math\.random\(\) \* N\);\n        if \(bins\.has\(v\)\) \{ hit\+\+; break; \}\n        bins\.add\(v\);/) === 1);
ck('全站已无 has()/add() 各取一次随机数的写法',
   cnt(/if \(bins\.has\(Math\.floor\(Math\.random\(\) \* N\)\)\)/) === 0);
ck('GR07_s3 文案 k=20 已由 90% 订正为约 87%', cnt(/k=20 时约 87%/) === 1);
ck('GM08_s2 面积夹角已改为底角 72°（原 sin36° 少算 φ 倍）',
   cnt(/0\.5 \* b \* len \* Math\.sin\(72 \* Math\.PI \/ 180\)/) === 1);
ck('全站已无 GM08_s2 用 sin\(36°\) 配「底·腰」的错式', cnt(/0\.5 \* b \* len \* Math\.sin\(36 \* Math\.PI \/ 180\)/) === 0);
ck('GM08_s3 已改画真正的 5 个尖顶黄金三角形', cnt(/5 个黄金三角形（顶角 36°）围成五角星/) === 1);
ck('GM08_s5 Golden Ratio 命名归因已订正为 Mark Oliver 1835',
   cnt(/英国教师 Mark Oliver 首次提出命名 "golden ratio"/) === 1);
ck('全站已无「德国数学家命名 Golden Ratio」', cnt(/德国数学家正式命名/) === 0);
ck('OT10_s4 已换回 Gosper 滑翔机枪真图形（36 格 / 36×9）',
   h.indexOf("'XX........X.....X...XX..............',") >= 0);
ck('全站已无伪造的「高斯帕滑翔机枪」图形',
   cnt(/\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.XX\.\.\.\.\.\.\.XX\.\.\.\.\.\.\.\.\.\.\.\.\./) === 0);
ck('OT10_s4 已改用稀疏无限平面（滑翔机不再被环面边界撞回）',
   cnt(/稀疏无限平面：滑翔机飞出视野后继续飞/) === 1);
ck('全站已无 OT10_s4 的环面取模', cnt(/grid\[\(r \+ dr \+ N\) % N\]/) === 0);
ck('全站已无「高斯帕」这个错译名（含 OT10_s5 时间线与教案正文）', cnt(/高斯帕/) === 0);
ck('FR01_s2 结论改为基于已显示的 z₀..z₅（不再拿未显示的 z₆ 判定）',
   cnt(/显示的 n=0\.\.5 各步 \|z\| 均 ≤ 2/) === 1);
ck('全站已无 FR01_s2 用循环后 mag2 判定的写法', cnt(/if \(zx \* zx \+ zy \* zy < 4\) lines\.push/) === 0);
ck('FR05_s2 已补判最后一次迭代后的 z₈（避免 |z|>2 却标「未逃」）',
   cnt(/if \(!escaped && finalMag > 2\) \{ escaped = true; lastMag = finalMag; \}/) === 1);
ck('OT08_s2 非法输入校验已改为查原始字符串',
   cnt(/if \(raw\.length && \/\[\^XO\.\]\/\.test\(raw\)\)/) === 1);
ck('全站已无 OT08_s2 永远为假的 b.some\(x => x === undefined\)', cnt(/b\.some\(x => x === undefined\)/) === 0);
ck('AL08_s2 非数字输入不再渲染 NaN', cnt(/请输入逗号分隔的整数，例如 5,2,8,1,9,3<\/span>/) === 1);
ck('AL09_s2 非数字输入不再渲染 NaN', cnt(/请输入逗号分隔的整数，例如 5,2,8,1,9,3,7,4,6<\/span>/) === 1);

// ---- v18.16：历史事实联网双源核实（7 项「待核」）----
ck('Dobiński 公式年份已由 1938 订正为 1877（1938 是 Bell 撰文年，非公式发现年）',
   cnt(/1877<\/strong> Dobiński 给出求和公式/) === 1);
ck('全站已无「1938 年 Dobinski 发现公式」', cnt(/1938 年 Dobinski 发现公式/) === 0);
ck('Bell numbers 的命名权已订正为 Becker & Riordan 1948（原写「1934 Bell 命名」）',
   cnt(/1948<\/strong> Becker &amp; Riordan 才正式命名为 Bell numbers/) === 1);
ck('全站已无「1934 Eric Temple Bell 命名」', cnt(/1934<\/strong> Eric Temple Bell 命名/) === 0);
ck('BBP 论文已订正为 1997 年发在 Mathematical Intelligencer（原文 1995 / Mathematical Intelligence）',
   cnt(/1997', text: '四人合著《The quest for pi》发表在《Mathematical Intelligencer》引发轰动/) === 1);
// 注意：'Mathematical Intelligencer' 本身就以 'Mathematical Intelligence' 为前缀，必须用负向断言
ck('全站已无刊名残缺的「Mathematical Intelligence》（-cer 后缀除外）', cnt(/Mathematical Intelligence(?!r)/) === 0);
ck('完美数「近 5000 万位」经高精度复算确认正确，守卫其不被误改',
   cnt(/近 5000 万位/) === 3);

// ---- v18.18：EX18_s4 PageRank 必须真算 + 出度累加下标自校验 ----
// v18.15 那次只验了「硬编码值没了」，没验算出来的值，结果放过了
// edges.forEach(([, j]) => outdeg[j]++) —— edges 是 [from, to]，
// 按 to 累加会让 outdeg[A]=0，除零后 PR(B)/PR(C) 变成 Infinity。
// 这里直接把源码里的那一段抽出来在 node 里真跑一遍。
(function () {
  const blk = h.match(/const edges = \[\[0,1\],\[0,2\],\[1,2\],\[2,1\],\[3,2\]\];[\s\S]*?pr = nx;\n  \}/);
  if (!blk) { ck('EX18_s4 PageRank 幂迭代代码块可被提取', false); return; }
  const expect = [0.0375, 0.4539, 0.4711, 0.0375];
  const got = eval(blk[0].replace(/const /g, 'var ') + '\npr');
  const ok = got.every((v, i) => Number.isFinite(v) && Math.abs(v - expect[i]) < 5e-4);
  ck('EX18_s4 PageRank 实算 = ' + got.map(v => v.toFixed(4)).join(', '), ok);
  ck('EX18_s4 PageRank 和为 1', Math.abs(got.reduce((a, b) => a + b, 0) - 1) < 1e-6);
  // 结构性：出度累加必须用 edges 的 **第一个** 分量（from），不能是第二个（to）
  ck('EX18_s4 outdegree 按 [from,to] 的 from 累加（不是 to）',
     /edges\.forEach\(\(\[(\w+)\]\) => outdeg\[\1\]\+\+\);/.test(h));
  ck('全站已无按 to 累加出度的错误写法', !/edges\.forEach\(\(\[, *(\w+)\]\) => outdeg\[\1\]\+\+\);/.test(h));
  ck('EX18_s4 已删除未使用的 inDeg 死变量', cnt(/const inDeg = new Array\(n\)\.fill\(0\);/) === 0);
})();

console.log('\n' + (fail === 0 ? `全部通过 ✅  (${pass} 项)` : `${fail} 项失败 ❌  (通过 ${pass})`));
process.exit(fail === 0 ? 0 : 1);
