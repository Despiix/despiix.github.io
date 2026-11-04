/* Theme + language, using the same localStorage keys and mechanism as the rest of the site
   ('site-theme', 'site-lang'). Static text uses data-i18n; text built by scripts uses HR.t(). */
(function(){
  var HR = window.HR = window.HR || {};

  function store(k, v){ try { localStorage.setItem(k, v); } catch(e) {} }
  function load(k){ try { return localStorage.getItem(k); } catch(e) { return null; } }

  /* ---------- theme ---------- */
  function setTheme(theme){
    if(theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
    store('site-theme', theme);
    document.dispatchEvent(new Event('hr-theme'));
  }
  function currentTheme(){ return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }

  /* ---------- static strings (Chinese); English lives in the markup ---------- */
  var zh = {
    'back-link': '← 返回项目',
    'eyebrow': '\u4EA4\u4E92\u5F0F\u8BB2\u89E3 \u00B7 \u7EC4\u5408\u6570\u5B66\u4E0E\u6570\u8BBA',
    'title': '分拆数中的隐藏节奏',
    'sub': '把一个数写成若干正整数之和，有多少种写法？答案增长得极快，但 1919 年拉马努金却在其中发现了一种无人注意过的节奏。这一页让你自己把它找出来。',
    'cta-start': '开始滚动 ↓',
    'cta-skip': '直接看发现',

    'ch1-no': '第 1 章',
    'ch1-h': '什么是整数分拆？',
    'ch1-p1': 'n 的一个<strong>分拆</strong>是把 n 写成若干正整数之和，不计顺序。数字 4 共有五种分拆：4、3+1、2+2、2+1+1 和 1+1+1+1。',
    'ch1-p2': '把每个加数画成一行点，就得到 <strong>Ferrers 图</strong>。沿对角线翻转一下，行变成列，得到 n 的另一个分拆，称为<strong>共轭分拆</strong>。',
    'ch1-p3': '\u8FD9\u4E2A\u7FFB\u8F6C\u662F\u4E00\u4E2A\u53CC\u5C04\uFF0C\u4E5F\u5C31\u662F\u7EC4\u5408\u6570\u5B66\u7684\u7B2C\u4E00\u4E2A\u8BA1\u6570\u6280\u5DE7\uFF1A\u8981\u6570\u4E00\u7C7B\u5BF9\u8C61\uFF0C\u5C31\u53BB\u6570\u4E0E\u5B83\u4E00\u4E00\u5BF9\u5E94\u7684\u53E6\u4E00\u7C7B\u3002',
    'ch1-note': '试试：选一个分拆，点击“共轭”，看每个点如何互换它的行和列。有些分拆的共轭就是它自己。',
    'lbl-n': 'n',
    'btn-conj': '共轭',

    'ch2-no': '第 2 章',
    'ch2-h': '三种计数方法',
    'ch2-p1': '同一个问题，三种算法。<strong>暴力枚举</strong>把每个分拆都写出来再计数。<strong>动态规划</strong>填一张子问题表，它就是生成函数 ∏ 1/(1−x<sup>k</sup>) 的另一种写法。<strong>欧拉五边形数递推</strong>每个值只需要大约 √n 个更早的值。',
    'ch2-p2': '选一个 n 并点击运行。三者必须得到同一个数，但它们做的工作量差别很大。',
    'btn-run': '运行',
    'e1-h': '暴力枚举',
    'e1-cx': '遍历全部 p(n) 个分拆',
    'e2-h': '动态规划',
    'e2-cx': '填约 n² 个格子',
    'e3-h': '五边形数递推',
    'e3-cx': '约 √n 项',

    'ch4-no': '第 3 章',
    'ch4-h': '拉马努金的节奏',
    'ch4-p1': '把每个 p(n) 按除以 m 的余数着色，并每行排 m 个。对大多数 m，这面墙看起来像噪声。',
    'ch4-p2': '把滑块拉到 <strong>5</strong>：整整一列变黑，p(5k+4) 每一次都能被 5 整除。接着 <strong>7</strong>（第 5 列）和 <strong>11</strong>（第 6 列）也一样。1919 年拉马努金在阅读麦克马法的 p(n) 表时发现了这一点。',
    'ch4-p3': '下面的“模式搜寻”实时对 2 到 36 的每个 m 做这样的扫描。除了 5、7、11，它还标出 25 和 35。二者都不是新的系列：25 是更强的素数幂同余式（p(25k+24) ≡ 0 mod 25，由 Watson 证明），而 35 由 5 和 7 的结果经中国剩余定理得到。',
    'ch4-note': '你看到的是有限范围内的计算机验证，不是证明。这些同余式本身是定理，证明见报告。',
    'lbl-m': '模数 m',
    'hunt': '模式搜寻：m = 2 … 36',

    'ch6-no': '第 4 章',
    'ch6-h': 'p(n) 能大到什么程度？',
    'ch6-p1': '非常大，而且增长很快。p(100) 有 9 位，p(1000) 有 32 位，p(10000) 有 107 位。1918 年哈代和拉马努金证明了一个能预测它大小的公式：',
    'ch6-p2': '把 n 拉到 10,000，看公式值与精确值的比值如何趋近 1。这里的精确值是用欧拉递推在你的浏览器里算出的大整数，没有任何近似。',
    'ch6-note': '在这里计算的所有情形中，公式值都略微偏高。它是 Rademacher 精确级数第一项的首项形式；保留整个第一项就能消除大部分误差。',

    'out-no': '如何验证',
    'out-h': '这里没有任何硬编码的数据',
    'out-p': '\u4E0A\u9762\u6240\u6709\u6570\u503C\u90FD\u662F\u5B9E\u65F6\u8BA1\u7B97\u7684\u3002\u5B83\u4EEC\u8FD8\u4F1A\u548C\u4E00\u4EFD\u72EC\u7ACB\u7684 C++ \u5B9E\u73B0\u4EA4\u53C9\u6838\u5BF9\uFF0C\u56E0\u4E3A\u8FD9\u662F\u503C\u5F97\u517B\u6210\u7684\u4E60\u60EF\uFF1A\u628A\u8BA1\u6570\u8BBA\u8BC1\u53D8\u6210\u7B97\u6CD5\uFF0C\u518D\u7528\u53E6\u4E00\u79CD\u65B9\u6CD5\u9A8C\u8BC1\u5B83\u3002',
    'v1-h': '三种算法一致',
    'v1-p': '暴力生成、动态规划和欧拉递推在重叠范围内得到完全相同的 p(n)。',
    'v2-h': 'JavaScript 与 C++ 一致',
    'v2-p': '本页把自己算出的 p(n)（n ≤ 1000）与 C++ 程序导出的表逐项比对。',
    'v3-h': '已知数值',
    'v3-p': 'p(100) = 190,569,292 和 p(200) = 3,972,999,029,388 与 OEIS A000041 一致。',
    'vb-wait': '正在自检…',
    'out-report': '阅读报告（PDF） ↗',
    'out-back': '← 返回项目',
    'footer-back': '← 返回所有项目'
  };

  /* ---------- dynamic strings built by the scenes: {en, zh} with {placeholders} ---------- */
  var dyn = {
    'b-count':   { en: '{n} has {c} partitions.', zh: '{n} 共有 {c} 个分拆。' },
    'b-read':    { en: 'This partition: <b>{a}</b>. Its conjugate: <b>{b}</b>.', zh: '当前分拆：<b>{a}</b>。它的共轭：<b>{b}</b>。' },
    'b-self':    { en: 'It is its own conjugate.', zh: '它的共轭就是它自己。' },
    'r-brute':   { en: 'visited <b>{a}</b> / {b}', zh: '已遍历 <b>{a}</b> / {b}' },
    'r-dp':      { en: 'cells <b>{a}</b> / {b}', zh: '单元格 <b>{a}</b> / {b}' },
    'r-pent':    { en: 'terms <b>{a}</b> / {b}', zh: '项数 <b>{a}</b> / {b}' },
    'r-done':    { en: 'done: {v}', zh: '完成：{v}' },
    'r-idle':    { en: 'Press Run.', zh: '点击运行。' },
    'r-all':     { en: 'All three agree: <span class="good">p({n}) = {v}</span>. Work done: <b>{a}</b> partitions, <b>{b}</b> cells, <b>{c}</b> terms.', zh: '三者一致：<span class="good">p({n}) = {v}</span>。工作量：<b>{a}</b> 个分拆、<b>{b}</b> 个单元格、<b>{c}</b> 项。' },
    'w-loading': { en: 'Computing exact values…', zh: '正在计算精确值…' },
    'w-dark':    { en: 'Always divisible by {m} in every one of the {rows} rows: <span class="good">n ≡ {c} (mod {m})</span>.', zh: '在全部 {rows} 行中都能被 {m} 整除：<span class="good">n ≡ {c} (mod {m})</span>。' },
    'w-none':    { en: 'No column is always divisible by {m}: the wall looks like noise.', zh: '没有任何一列总能被 {m} 整除：这面墙看起来像噪声。' },
    'w-25':      { en: ' 25 = 5²: the mod 5 miracle strengthens to mod 25.', zh: ' 25 = 5²：模 5 的奇迹升级成了模 25。' },
    'w-35':      { en: ' 35 = 5 × 7: both miracles at once, by the Chinese remainder theorem.', zh: ' 35 = 5 × 7：由中国剩余定理，两个奇迹同时成立。' },
    'w-tip':     { en: 'n = {n} · p(n) = {v} · remainder {r}', zh: 'n = {n} · p(n) = {v} · 余数 {r}' },
    'a-exact':   { en: 'exact p(n)', zh: '精确值 p(n)' },
    'a-hr':      { en: 'Hardy–Ramanujan', zh: '哈代–拉马努金' },
    'a-ratio':   { en: 'formula / exact', zh: '公式 / 精确值' },
    'a-log':     { en: 'log₁₀ p(n), log scale in n', zh: 'log₁₀ p(n)，n 取对数坐标' },
    'a-read':    { en: 'n = <b>{n}</b>: exact p(n) has <b>{d}</b> digits, ≈ {ex}. The formula gives ≈ {hr}. Ratio = <span class="good">{r}</span>.', zh: 'n = <b>{n}</b>：精确的 p(n) 有 <b>{d}</b> 位，约 {ex}。公式给出约 {hr}。比值 = <span class="good">{r}</span>。' },
    'vb-ok':     { en: 'Self-check passed: JavaScript p(n) equals the C++ table for every n ≤ 1000, and the congruence scan finds the same pairs.', zh: '自检通过：n ≤ 1000 时 JavaScript 的 p(n) 与 C++ 表完全一致，同余扫描得到的数对也相同。' },
    'vb-bad':    { en: 'Self-check mismatch: see the console.', zh: '自检不一致：请查看控制台。' },
    'vb-none':   { en: 'The C++ reference table could not be loaded (the page must be served over http).', zh: '无法加载 C++ 参考表（页面需通过 http 访问）。' }
  };

  HR.lang = 'en';
  HR.t = function(key, vars){
    var d = dyn[key];
    var s = d ? (d[HR.lang] || d.en) : key;
    if(vars) s = s.replace(/\{(\w+)\}/g, function(_, k){ return vars[k] !== undefined ? vars[k] : ''; });
    return s;
  };

  var enCache = {};
  function setLang(lang){
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var key = el.getAttribute('data-i18n');
      if(lang === 'zh'){
        if(!(key in enCache)) enCache[key] = el.innerHTML;
        if(zh[key] !== undefined) el.innerHTML = zh[key];
      } else if(key in enCache){
        el.innerHTML = enCache[key];
      }
    });
    HR.lang = lang;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.getElementById('langToggle').textContent = lang === 'zh' ? 'EN' : '中文';
    store('site-lang', lang);
    document.dispatchEvent(new Event('hr-lang'));
  }

  document.getElementById('themeToggle').addEventListener('click', function(){
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });
  document.getElementById('langToggle').addEventListener('click', function(){
    setLang(HR.lang === 'zh' ? 'en' : 'zh');
  });

  setTheme(load('site-theme') || 'dark');
  var saved = load('site-lang');
  if(saved === 'zh' || (!saved && navigator.language && navigator.language.toLowerCase().indexOf('zh') === 0)){
    setLang('zh');
  }
})();
