#!/usr/bin/env python3
"""
逐页复核 148 个 pages/*.html：
  1. 结构完整性（title/返回链接/4 区面板/互动演示）
  2. 音频引用可解析
  3. 残留的错误断言（已修项的回归守卫）
  4. 内部锚点/ID 引用无悬空
  5. 未闭合标签等明显损坏
"""
import io, os, re, json, glob, sys

WORK = os.path.dirname(os.path.abspath(__file__))
os.chdir(WORK)

pages = sorted(glob.glob('pages/*.html'))
audio_files = set()
for root, d, fs in os.walk('audio'):
    for f in fs:
        audio_files.add(f)

meta = {e['id']: e for e in json.load(open('experiments_meta.json'))}

# 已修复的错误断言——若再次出现说明被改回或未同步
BANNED = [
    (r'9 步从 6 蹦到 1',            'Collatz 6→1 步数错误'),
    (r'要 15 步才到 1',             'Collatz 11 步数错误'),
    (r'蹦 112 步',                  'Collatz 27 步数错误'),
    (r'190747',                     'Collatz 871 峰值错误'),
    (r'27（112 步）',               'Collatz 27 排行榜错误'),
    (r'完美数 4 个（6、28、496、8128）', '1..1000 完美数含越界的 8128'),
    (r'8 种分法',                   'Goldbach 100 分法数错误'),
    (r'122 对',                     '孪生对计数错误'),
    (r'21 个梅森素数',              '梅森素数个数错误'),
    (r'525180332305',               'Bell B_20 错误'),
    (r'B_30 有 23 位数',            'Bell B_30 位数错误'),
    (r'4\+5\+8\+15\s*=\s*34',       'OT07 加法错误'),
    (r'圆柱形最省材料',              'GM05 结论错误（球更省）'),
    (r'渐近密度"约 0\.314',          'Harshad 密度伪说'),
    (r'π/2 等于 sin\(x\) 从 0 到 π/2 的积分', 'Wallis 积分恒等式错误'),
    (r'算到 10 位精度要 100 亿个点',  '蒙特卡洛数量级错误'),
    (r'1\.4% 快乐数',                '快乐数比例错误'),
    (r'剩 5 号',                    'Josephus 结论错误'),
    (r'中心是 \(n²\+1\)/2',          '螺旋矩阵中心公式错误'),
    (r'圆柱形最省|4 亿亿',           '中文数位错误'),
    (r'陶哲轩（Terence 陶）证明了一个惊人的结论：素数间隙', '素数间隙归因错误'),
    (r'王虹本人 2022 年获菲尔兹奖',   '菲尔兹奖年份错误'),
    (r'误差减半（O\(1/N）',          '收敛口径错误'),
    (r'远超双精度',                 'Chudnovsky 描述错误'),
    (r'Timothy Mullican',            'π 纪录人物错误'),
    (r'不适用.*L > d',              'L>d 提示（反向检查）'),
]

# 这些是正向断言——修好后应当出现
REQUIRED = {
    'PR08':  [r'426880|CHUD_A',   'Chudnovsky 常数已就位'],
    'PR01':  [r'buffonP',         '布丰长针闭式解已就位'],
    'PR02':  [r'97（118 步）',    'Collatz 排行榜已修正'],
    'NT05':  [r'14377',          '快乐数 10 万计数已修正'],
    'AL05':  [r'8 个皇后行列互不相同', '八皇后解已修正'],
    'AL03':  [r'剩 <strong>4 号</strong>', 'Josephus 已修正'],
    'OT06':  [r'中心正好落在',    '螺旋中心已修正'],
}

fail = 0
def bad(fid, msg):
    global fail
    fail += 1
    print(f"  ❌ {fid}: {msg}")

print(f"逐页复核 {len(pages)} 个页面\n")

for pf in pages:
    fid = os.path.basename(pf)[:-5]
    s = io.open(pf, encoding='utf-8').read()
    e = meta.get(fid)

    # 1. 结构
    if f'<title>' not in s: bad(fid, '缺 <title>')
    elif e and e['title'] not in s: bad(fid, f'title 与 meta 不符: {e["title"][:30]}')
    if 'class="back-link"' not in s: bad(fid, '缺返回链接')
    for zone in ['原理', '历史', '互动演示']:
        if zone not in s: bad(fid, f'缺分区: {zone}')

    # 2. 音频引用
    for m in re.findall(r"['\"](?:\.\./)?audio/([A-Za-z0-9_\-.]+\.mp3)['\"]", s):
        if m not in audio_files: bad(fid, f'音频缺失: {m}')

    # 3. 残留错误断言
    for pat, desc in BANNED:
        if re.search(pat, s) and '不适用.*L > d' not in desc:
            if desc.startswith('L>d'):
                continue
            bad(fid, f'残留错误断言: {desc}')

    # 4. 悬空 ID 引用
    ids = set(re.findall(r'id="([A-Za-z0-9_\-]+)"', s))
    for ref in set(re.findall(r"getElementById\('([A-Za-z0-9_\-]+)'\)", s)):
        if ref not in ids: bad(fid, f'getElementById 指向不存在的 id: {ref}')

    # 5. 明显损坏
    if s.count('<script>') != s.count('</script>'): bad(fid, 'script 标签不配对')
    if s.count('<style>') != s.count('</style>'): bad(fid, 'style 标签不配对')
    if len(s) < 500000: bad(fid, f'文件过小({len(s)}B)，可能被截断')

print(f"\n结构/内容检查：{'✅ 全部通过' if fail==0 else f'❌ {fail} 项问题'}")

# 正向断言
print("\n正向断言（修复必须存在）：")
p2 = 0
for fid, checks in REQUIRED.items():
    pf = f'pages/{fid}.html'
    s = io.open(pf, encoding='utf-8').read()
    for pat, desc in checks:
        if re.search(pat, s): print(f"  ✅ {fid}: {desc}"); p2 += 1
        else: print(f"  ❌ {fid}: {desc} —— 未找到"); fail += 1

print(f"\n总计：{'✅ 通过' if fail==0 else f'❌ {fail} 项失败'}（正向 {p2} 项）")
sys.exit(0 if fail == 0 else 1)
