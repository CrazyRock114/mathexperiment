#!/usr/bin/env python3
"""
交互输出高风险模式扫描器。

不逐个通读 550 个 stage，而是按「本轮真实挖到 bug 的共性」定向扫描：

  P1 阶乘 / 幂 / exp 参数过大 → 溢出成 Infinity，进而 Infinity/Infinity = NaN
     （真 bug：PB10 的 C(n,k) 用阶乘，171! 就超 double 上限）
  P2 硬编码"理论值 / 理论：" 却不由模拟算出（自说自话，数字恒定）
     （真 bug：EX01 宽度直接打印常数 s）
  P3 分母可能为 0 未防护
  P4 Math.log / sqrt 的参数可能为负
  P5 累乘循环无收敛上界（可能死循环）
  P6 枚举不完整：声称 N 种却只写 M 种
"""
import io, re, sys, os

WORK = os.path.dirname(os.path.abspath(__file__))
os.chdir(WORK)
s = io.open('index.html', encoding='utf-8').read()
lines = s.split('\n')

def lineno(idx):  return s[:idx].count('\n') + 1
def ctx(idx, n=110):
    a = max(0, idx - n); b = min(len(s), idx + n)
    return re.sub(r'\s+', ' ', s[a:b]).strip()

def enclosing_fn(idx):
    """找包含该偏移的最近的 function 定义"""
    pre = s[:idx]
    ms = list(re.finditer(r'^function (\w+)\s*\(', pre, re.M))
    return ms[-1].group(1) if ms else '(顶层)'

findings = []

def add(pat, label, why, extra_check=None):
    for m in re.finditer(pat, s):
        ln, fn = lineno(m.start()), enclosing_fn(m.start())
        seg_start = s.rfind('function ', 0, m.start())
        seg_end = s.find('\nfunction ', m.start())
        seg = s[seg_start: seg_end if seg_end > 0 else len(s)]
        # 只在该函数体内出现（避免同一 pattern 在别处也命中）
        if seg.count(m.group(0)) < 1: continue
        if extra_check and not extra_check(seg): continue
        findings.append((ln, fn, label, why, ctx(m.start(), 90)))
        break   # 每种模式只报首个，后面人工跟进

# ---- P1 阶乘 / 大幂 ----
def big_factorial(seg):
    return bool(re.search(r'factorial\(([a-zA-Z_]\w*)\)', seg)) and \
           not re.search(r'factorial\((k|n2|kk|m)\)', seg)
add(r'factorial\(', 'P1 阶乘', '阶乘参数可能超 double 上限（171!）→ Infinity，组合后成 NaN', big_factorial)

add(r'Math\.pow\(\s*Math\.E\s*,|Math\.exp\(\s*[a-zA-Z_]\w*\s*\*\s*[0-9]{2,}',
    'P1 大指数/幂', 'Math.exp/pow 参数可能溢出成 Infinity')

# ---- P2 硬编码"理论值" ----
for m in re.finditer(r'(理论值|理论：)[^<`\n]{0,40}', s):
    ln, fn = lineno(m.start()), enclosing_fn(m.start())
    findings.append((ln, fn, 'P2 硬编码理论值', '数字不由模拟算出，可能与实测矛盾', ctx(m.start(), 100)))
    break

# ---- P3 除零 ----
add(r'/[a-zA-Z_]\w*\s*;', 'P3 可疑除法', '除数可能是 0')

# ---- P4 log/sqrt 负数 ----
add(r'Math\.(log|sqrt)\(\s*[a-zA-Z_]\w*\s*[-+]', 'P4 log/sqrt 参数', '参数可能为负 → NaN')
add(r'Math\.log\(', 'P4 log', 'log(0) = -Infinity，log(负) = NaN')

# ---- P6 声称 N 种但枚举少 ----
for m in re.finditer(r'(\d)\s*种(?:括法|解法|排列|方式|情况|分法)', s):
    ln = lineno(m.start())
    n = int(m.group(1))
    seg = s[max(0, m.start()-3000): m.start()]
    # 粗略数一下该函数里实际写了几个分支
    fn = enclosing_fn(m.start())
    fstart = s.rfind('function ' + fn, 0, m.start())
    fend = s.find('\nfunction ', m.start())
    body = s[fstart: fend if fend > 0 else len(s)]
    branches = len(re.findall(r'//\s*\d+\.', body))
    if n >= 3 and branches and branches < n:
        findings.append((ln, fn, f'P6 枚举不全', f'声称 {n} 种，但代码里只标了 {branches} 种', ctx(m.start(), 110)))

seen = set()
out = []
for ln, fn, label, why, c in sorted(findings):
    k = (label, fn)
    if k in seen: continue
    seen.add(k); out.append((ln, fn, label, why, c))

print(f'高风险模式扫描：{len(out)} 处（每种模式每函数只报首次）\n')
for label in sorted(set(x[2] for x in out)):
    print(f'── {label} ──')
    for ln, fn, l2, why, c in [x for x in out if x[2] == label][:12]:
        print(f'  line {ln:>6}  {fn:<34} {why}')
        print(f'          {c[:150]}')
    print()
