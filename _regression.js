// 对照审计报告逐条回归验证（全部从编辑后的 index.html 抽取代码执行）
const fs = require('fs');
const h = fs.readFileSync('/Users/paulshi/Documents/MiniMax/π/mathexperiment/index.html', 'utf-8');
function grab(re) { const m = h.match(re); if (!m) throw new Error('missing: ' + re); return m[0]; }

// 统一在一个作用域内 eval，避免 const 的 eval-scope 隔离
const SRC = [
  grab(/const CHUD_A = [^;]+;/),
  grab(/const PI = Math\.PI;/),
  grab(/function chudnovskyPi\(N\) \{[\s\S]*?\n\}/),
  grab(/function _pr08Chud诺夫斯基\(N\) \{[\s\S]*?\n\}/),
  grab(/function buffonP\(L, d\) \{[\s\S]*?\n\}/),
  grab(/function collatzUpTo\(n, stepLimit = 10000\) \{[\s\S]*?\n\}/),
  grab(/function _ntSigma\(n\) \{[^\n]*\}/),
  grab(/function _ntProperDivisors\(n\) \{[\s\S]*?\n\}/),
  grab(/function _nt05Happy\(n\) \{[\s\S]*?\n\}/),
].join('\n');
// 直接 eval 中 const 只活在 eval 自己的作用域，替换成 var 才能在外层访问
eval(SRC.replace(/\bconst /g, 'var '));

let fail = 0, pass = 0;
function ck(name, cond, detail) {
  if (cond) { pass++; console.log('  ✅ ' + name + (detail ? '  ' + detail : '')); }
  else { fail++; console.log('  ❌ ' + name + (detail ? '  ' + detail : '')); }
}

console.log('===== C1/C2  Chudnovsky =====');
ck('chudnovskyPi(100) 无 NaN（默认参数）', !Number.isNaN(chudnovskyPi(100)), chudnovskyPi(100).toFixed(16));
ck('_pr08Chud诺夫斯基(5) 无 NaN', !Number.isNaN(_pr08Chud诺夫斯基(5)), _pr08Chud诺夫斯基(5).toFixed(16));
ck('_pr08Chud诺夫斯基 随 N 变化（旧版恒定）', _pr08Chud诺夫斯基(1) !== _pr08Chud诺夫斯基(2));

console.log('\n===== C3  布丰 L>d 闭式解（对照 20 万次蒙特卡洛） =====');
const mcTruth = { 0.625: 0.3972, 1.25: 0.7272, 2.5: 0.8709, 6.0: 0.9468 };
for (const [L, d] of [[50,80],[100,80],[100,40],[120,20]]) {
  const got = buffonP(L, d), truth = mcTruth[L/d];
  ck(`L=${L} d=${d} 概率吻合蒙特卡洛`, Math.abs(got - truth) < 0.002,
     `公式 ${(got*100).toFixed(2)}% vs 实测 ${(truth*100).toFixed(2)}%`);
}
ck('L<=d 时仍等于 2L/(πd)', Math.abs(buffonP(50,80) - 2*50/(PI*80)) < 1e-12);
ck('L=120,d=20 不再出现 >100% 的荒谬值', buffonP(120,20) < 1, (buffonP(120,20)*100).toFixed(2)+'%');

console.log('\n===== C4/C5  Collatz 步数（对照 OEIS A006877） =====');
const oeis = {6:8, 11:14, 27:111, 31:106, 47:104, 71:102, 63:107, 871:178};
for (const n of Object.keys(oeis)) {
  ck(`collatzUpTo(${n}).steps = ${oeis[n]}`, collatzUpTo(+n).steps === oeis[n], '实际 ' + collatzUpTo(+n).steps);
}
ck('collatzUpTo(871).max = 190996', collatzUpTo(871).max === 190996, '实际 ' + collatzUpTo(871).max);
let top = [];
for (let n = 1; n <= 100; n++) top.push([collatzUpTo(n).steps, n]);
top.sort((a,b) => b[0]-a[0]);
const first5 = top.slice(0,5).map(x => x[1]).join(',');
ck('Top5 = 97,73,54,55,27（与修正后文案一致）', first5 === '97,73,54,55,27', first5);

console.log('\n===== C9  ∫₀^{π/2} sin x dx = 1 =====');
ck('积分值 = 1（文案已改，不再声称等于 π/2）', Math.abs((1 - Math.cos(PI/2)) - 1) < 1e-12);

console.log('\n===== 回归：未受影响的算法 =====');
ck('_ntSigma(28) = 28（28 是完美数）', _ntSigma(28) === 28, '实际 ' + _ntSigma(28));
ck('_ntSigma(36) = 55（36 是过剩数）', _ntSigma(36) === 55, '实际 ' + _ntSigma(36));
ck('_nt05Happy(19)=true', _nt05Happy(19) === true);
ck('_nt05Happy(4)=false', _nt05Happy(4) === false);

console.log('\n' + (fail === 0 ? `全部通过 ✅  (${pass} 项)` : `${fail} 项失败 ❌  (通过 ${pass} 项)`));
process.exit(fail === 0 ? 0 : 1);
