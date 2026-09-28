#!/usr/bin/env python3
"""
逐页复核 148 个 pages/*.html + experiments_meta.json。

页面结构事实：每个 pages/{ID}.html =
  [共享 JS 母版（含全站 148 个 getStages 函数与共享控件脚本）]
  + [本页专属 const EXPERIMENTS = [{...}] 注入块]
  + [本页 initPage 逻辑]

因此"页面自身文案"= 注入块字段（intro/principle/history/tryit/explain/stages 引用）；
而 stages 的实际文本在共享 JS 里，由 getStagesXXX() 产生 —— 它已随 index.html 一起校验。
"""
import io, os, re, json, glob, sys

WORK = os.path.dirname(os.path.abspath(__file__))
os.chdir(WORK)

pages = sorted(glob.glob('pages/*.html'))
meta_list = json.load(open('experiments_meta.json'))
meta = {e['id']: e for e in meta_list}
audio_files = set()
for root, d, fs in os.walk('audio'):
    audio_files.update(fs)

# 已修复的错误断言——再次出现说明被改回或未同步
BANNED = [
    (r'9 步从 6 蹦到 1',              'Collatz 6→1 步数'),
    (r'要 15 步才到 1',               'Collatz 11 步数'),
    (r'蹦 112 步',                    'Collatz 27 步数'),
    (r'190747',                       'Collatz 871 峰值'),
    (r'27（112 步）',                 'Collatz 排行榜'),
    (r'完美数 4 个（6、28、496、8128）', '1..1000 完美数含越界 8128'),
    (r'8 种分法',                     'Goldbach 100 分法数'),
    (r'122 对',                       '孪生对计数'),
    (r'21 个梅森素数',                '梅森素数个数'),
    (r'525180332305',                 'Bell B_20'),
    (r'B_30 有 23 位数',              'Bell B_30 位数'),
    (r'4\+5\+8\+15\s*=\s*34',         'OT07 加法'),
    (r'圆柱形最省材料',                'GM05 结论（球更省）'),
    (r'渐近密度"约 0\.314',            'Harshad 密度伪说'),
    (r'π/2 等于 sin\(x\) 从 0 到 π/2 的积分', 'Wallis 积分恒等式'),
    (r'算到 10 位精度要 100 亿个点',    '蒙特卡洛数量级'),
    (r'1\.4% 快乐数',                  '快乐数比例'),
    (r'剩 5 号',                      'Josephus 结论'),
    (r'中心是 \(n²\+1\)/2',            '螺旋矩阵中心公式'),
    (r'4 亿亿',                       '中文数位'),
    (r'陶哲轩（Terence 陶）证明了一个惊人的结论：素数间隙', '素数间隙归因'),
    (r'王虹本人 2022 年获菲尔兹奖',     '菲尔兹奖年份'),
    (r'王虹 \(Hong Wang\) 1986 年生',  '王虹出生年'),
    (r'误差减半（O\(1/N）',            '收敛口径'),
    (r'远超双精度',                   'Chudnovsky 描述'),
    (r'Timothy Mullican',              'π 纪录人物'),
    (r'菲尔兹奖特别版',                '怀尔斯奖项'),
    (r'1999 年全情形',                '谷山-志村完成年'),
    (r'2017 年证明弱猜想',             'Helfgott 年份'),
    (r'差距 <strong>趋于 0</strong>',   'GPY 有界 vs 趋于0'),
    (r'孪生素数猜想[：:]\s*(已证明|已证)', '孪生猜想被表述为已证'),
]

REQUIRED = {
    'PR08':  (r'CHUD_A|426880',            'Chudnovsky 重写后常数就位'),
    'PR01':  (r'buffonP',                   '布丰长针闭式解就位'),
    'PR02':  (r'97（118 步）',              'Collatz 排行榜已修正（含在 index.html expPack）'),
    'NT05':  (r'14377',                     '快乐数 10 万计数已修正'),
    'AL05':  (r'8 个皇后行列互不相同',        '八皇后解已修正'),
    'AL03':  (r'剩 <strong>4 号</strong>',   'Josephus 已修正'),
    'OT06':  (r'最后一个数 n² 正好落在正中心', '螺旋中心已修正'),
    'NT03':  (r'完全平方数',                 'NT03 文本在场'),
    'PE01':  (r'sin x 在 0 到 π/2 上积分',   'Wallis 积分已修正'),
    'PE05':  (r'2\.7×10¹⁹',                '蒙特卡洛数量级已修正'),
    'NT06':  (r'密度会越来越稀|趋于 0',       'Harshad 密度已修正'),
    'EX_PROVEN_18': (r'至今没有任何证明',     '孪生猜想未解已标注'),
    'EX_PROVEN_10': (r'n ≥ 4 维的挂谷猜想至今仍未解决', '挂谷 n≥4 未解已标注'),
}

fail, warn = 0, 0
def bad(m): 
    global fail; fail += 1; print('  ❌ ' + m)
def wrn(m):
    global warn; warn += 1; print('  ⚠️  ' + m)

print(f'逐页复核 {len(pages)} 个页面 + {len(meta_list)} 条 meta\n')

# ---------- A. experiments_meta.json 全文：错误断言守卫 ----------
print('A. 全站文案错误断言守卫（experiments_meta.json，含 stages 全量）：')
allmeta = json.dumps(meta_list, ensure_ascii=False)
for pat, desc in BANNED:
    if re.search(pat, allmeta): bad(f'元数据仍含错误断言：{desc}')
    else: print(f'  ✅ 已无：{desc}')

# ---------- B. index.html 全文 ----------
print('\nB. index.html 错误断言守卫：')
idx = io.open('index.html', encoding='utf-8').read()
for pat, desc in BANNED:
    if re.search(pat, idx): bad(f'index.html 仍含：{desc}')

# ---------- C. 逐页结构 ----------
print('\nC. 逐页结构检查：')
for pf in pages:
    fid = os.path.basename(pf)[:-5]
    s = io.open(pf, encoding='utf-8').read()
    e = meta.get(fid)
    if not e: bad(f'{fid}: meta 中无此实验'); continue
    m = re.search(r'const EXPERIMENTS = \[\{', s)
    if not m: bad(f'{fid}: 缺本页专属 EXPERIMENTS 注入块'); continue
    own = s[m.start():]
    # 注入块字段
    if json.dumps(e['id'], ensure_ascii=False) not in own: bad(f'{fid}: 注入块 id 不符')
    if json.dumps(e['title'], ensure_ascii=False) not in own: bad(f'{fid}: 注入块 title 不符')
    if f"plazaOpen({json.dumps(fid)}, false)" not in s: bad(f'{fid}: 缺 plazaOpen 入口')
    if 'class="back-link"' not in s: bad(f'{fid}: 缺返回链接')
    for z in ('原理', '历史', '互动演示'):
        if z not in own: bad(f'{fid}: 注入块缺分区「{z}」')
    # 音频路径改写为 ../
    if "../audio/" not in s: bad(f'{fid}: 音频路径未改写为 ../audio/')
    # 标签配对
    if s.count('<script>') != s.count('</script>'): bad(f'{fid}: script 不配对')
    if s.count('<style>') != s.count('</style>'): bad(f'{fid}: style 不配对')
    if len(s) < 1_000_000: bad(f'{fid}: 文件过小({len(s)}B) 疑似截断')
    # 音频引用可解析
    for a in set(re.findall(r"['\"](?:\.\./)?audio/([A-Za-z0-9_\-.]+\.mp3)['\"]", s)):
        if a not in audio_files: bad(f'{fid}: 音频缺失 {a}')
print(f'  （{len(pages)} 页结构检查完成）')

# ---------- D. 正向断言 ----------
print('\nD. 修复必须存在（正向断言）：')
for fid, (pat, desc) in REQUIRED.items():
    pf = f'pages/{fid}.html'
    if not os.path.exists(pf): bad(f'{fid}: 页面不存在'); continue
    s = io.open(pf, encoding='utf-8').read()
    if re.search(pat, s) or re.search(pat, allmeta) or re.search(pat, idx): print(f'  ✅ {fid}: {desc}')
    else: bad(f'{fid}: {desc} —— 未找到')

# ---------- E. meta 与 index 同步 ----------
print('\nE. meta ↔ index.html 同步性：')
drift = 0
for e in meta_list:
    for k in ('title', 'intro', 'explain', 'history', 'tryit', 'principle'):
        v = e.get(k) or ''
        # meta 的字段值就是 index.html 里的原文（JSON 转义后取出），直接用原文比对。
        # 不可先剥标签再比：<[^>]+> 会在 JS 里的 `x < y ... z >` 上跨行误匹配，吞掉正文。
        probe = v[:60]
        if probe and probe not in idx:
            drift += 1
            if drift <= 5: wrn(f"{e['id']}.{k} 在 index.html 中找不到：{probe!r}")
print(f'  漂移字段数：{drift}' + ('（0 = 同步）' if drift == 0 else ''))

print(f"\n{'='*46}\n总计：{'✅ 全部通过' if fail==0 else f'❌ {fail} 项失败'}"
      + (f'，{warn} 项提示' if warn else ''))
sys.exit(0 if fail == 0 else 1)
