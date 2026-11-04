/* Partition engine: exact arithmetic (BigInt) plus the helpers every scene uses.
   No dependencies. Everything hangs off window.HR. */
(function(){
  var HR = window.HR = window.HR || {};

  /* ---------- p(n) by Euler's pentagonal recurrence ----------
     p(n) = sum_{k>=1} (-1)^(k+1) [ p(n - k(3k-1)/2) + p(n - k(3k+1)/2) ],  p(0) = 1 */
  var P = [1n];

  function computeTo(N){
    for(var n = P.length; n <= N; n++){
      var s = 0n;
      for(var k = 1; ; k++){
        var g1 = k * (3 * k - 1) / 2;
        if(g1 > n) break;
        var plus = (k % 2 === 1);
        var t = P[n - g1];
        var g2 = k * (3 * k + 1) / 2;
        if(g2 <= n) t += P[n - g2];
        s = plus ? s + t : s - t;
      }
      P.push(s);
    }
  }

  /* Fill P up to N without freezing the page: small chunks, yielding between them. */
  var chan = (typeof MessageChannel !== 'undefined') ? new MessageChannel() : null;
  var yieldQueue = [];
  if(chan) chan.port1.onmessage = function(){ var f = yieldQueue.shift(); if(f) f(); };
  function yieldNow(f){ if(chan){ yieldQueue.push(f); chan.port2.postMessage(0); } else setTimeout(f, 0); }

  HR.ensureP = function(N){
    return new Promise(function(resolve){
      (function step(){
        var t0 = Date.now();
        while(P.length <= N && Date.now() - t0 < 12) computeTo(Math.min(N, P.length + 19));
        if(P.length > N) resolve(); else yieldNow(step);
      })();
    });
  };
  HR.have = function(){ return P.length - 1; };
  HR.p = function(n){ return P[n]; };

  /* The pentagonal terms that make up p(n): [{sign:+1|-1, idx}, ...] in the order they are added. */
  HR.pentTerms = function(n){
    var out = [];
    for(var k = 1; ; k++){
      var g1 = k * (3 * k - 1) / 2;
      if(g1 > n) break;
      var sg = (k % 2 === 1) ? 1 : -1;
      out.push({ sign: sg, idx: n - g1 });
      var g2 = k * (3 * k + 1) / 2;
      if(g2 <= n) out.push({ sign: sg, idx: n - g2 });
    }
    return out;
  };

  /* ---------- p(n) by dynamic programming (coin change with coins 1..n) ----------
     dp[k][j] = number of partitions of j into parts of size <= k.
     Returns the whole table, rows k = 0..n, columns j = 0..n (Numbers; fine for n <= 60). */
  HR.dpTable = function(n){
    var dp = [];
    for(var k = 0; k <= n; k++){
      dp.push(new Array(n + 1).fill(0));
    }
    dp[0][0] = 1;
    for(var k2 = 1; k2 <= n; k2++){
      for(var j = 0; j <= n; j++){
        dp[k2][j] = dp[k2 - 1][j] + (j >= k2 ? dp[k2][j - k2] : 0);
      }
    }
    return dp;
  };

  /* ---------- brute force: next partition in reverse lexicographic order ---------- */
  HR.firstPartition = function(n){ return [n]; };
  HR.nextPartition = function(a){
    var i = a.length - 1, ones = 0;
    while(i >= 0 && a[i] === 1){ ones++; i--; }
    if(i < 0) return null;
    var v = a[i] - 1, rest = ones + 1;
    var b = a.slice(0, i);
    b.push(v);
    while(rest > 0){ var t = Math.min(v, rest); b.push(t); rest -= t; }
    return b;
  };
  HR.allPartitions = function(n){
    var out = [], a = HR.firstPartition(n);
    while(a){ out.push(a); a = HR.nextPartition(a); }
    return out;
  };

  /* ---------- Ferrers diagrams ---------- */
  HR.conjugate = function(a){
    var out = [];
    for(var c = 0; c < a[0]; c++){
      var h = 0;
      for(var r = 0; r < a.length; r++) if(a[r] > c) h++;
      out.push(h);
    }
    return out;
  };
  HR.sameParts = function(a, b){
    if(a.length !== b.length) return false;
    for(var i = 0; i < a.length; i++) if(a[i] !== b[i]) return false;
    return true;
  };

  /* Dyson rank of a partition: largest part minus number of parts. */
  HR.rank = function(a){ return a[0] - a.length; };

  /* ---------- number formatting for huge values ---------- */
  HR.fmt = function(b){
    var s = b.toString();
    if(s.length <= 15) return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return s[0] + '.' + s.slice(1, 5) + ' × 10^' + (s.length - 1);
  };
  HR.fmtFull = function(b){ return b.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); };

  /* log10 of a positive BigInt without overflowing a Number. */
  HR.log10Big = function(b){
    var s = b.toString();
    var keep = Math.min(s.length, 15);
    return (s.length - keep) + Math.log10(Number(s.slice(0, keep)));
  };

  /* Hardy-Ramanujan (1918) first-order approximation: exp(pi*sqrt(2n/3)) / (4 n sqrt(3)). */
  HR.log10HR = function(n){
    return (Math.PI * Math.sqrt(2 * n / 3) - Math.log(4 * n * Math.sqrt(3))) / Math.LN10;
  };
  HR.fmtLog10 = function(l){
    var e = Math.floor(l), m = Math.pow(10, l - e);
    return m.toFixed(4) + ' × 10^' + e;
  };

  /* ---------- the "discovery" scan ----------
     For modulus m, show n = m*r + c for rows r = 0..rows-1. A column c is "dark" if p(n) % m == 0
     for every n shown in that column. Needs P up to m*rows + m. */
  HR.residueGrid = function(m, rows){
    var M = BigInt(m), grid = [], dark = [];
    for(var c = 0; c < m; c++) dark.push(true);
    for(var r = 0; r < rows; r++){
      var line = [];
      for(var c2 = 0; c2 < m; c2++){
        var n = m * r + c2;
        var v = Number(P[n] % M);
        line.push(v);
        if(v !== 0) dark[c2] = false;
      }
      grid.push(line);
    }
    var cols = [];
    for(var c3 = 0; c3 < m; c3++) if(dark[c3]) cols.push(c3);
    return { grid: grid, darkCols: cols };
  };

  /* ---------- small helpers ---------- */
  HR.css = function(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); };
  HR.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  HR.fit = function(canvas, w, h){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return g;
  };
  HR.ease = function(t){ return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  HR.lerp = function(a, b, t){ return a + (b - a) * t; };
})();
