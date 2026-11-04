/* Scenes: hero, partition builder, three-way race, mod-m wall, asymptotics, self-check. */
(function(){
  var HR = window.HR;
  var $ = function(id){ return document.getElementById(id); };
  var redraws = [];                       // functions to call on resize / theme change
  function onRedraw(fn){ redraws.push(fn); }
  function redrawAll(){ redraws.forEach(function(f){ f(); }); }
  var resizeTimer;
  window.addEventListener('resize', function(){ clearTimeout(resizeTimer); resizeTimer = setTimeout(redrawAll, 120); });
  document.addEventListener('hr-theme', redrawAll);

  function visible(el, cb){
    if(!('IntersectionObserver' in window)){ cb(true); return; }
    new IntersectionObserver(function(es){ cb(es[0].isIntersecting); }, { rootMargin: '120px' }).observe(el);
  }
  function rowColor(i, n, a){
    var t = n <= 1 ? 0 : i / (n - 1);
    var h = 285 - 260 * t;
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return 'hsla(' + h.toFixed(0) + ',68%,' + (dark ? 60 : 52) + '%,' + (a === undefined ? 1 : a) + ')';
  }

  /* =====================================================================
     HERO: dots of a Ferrers diagram morphing between random partitions of 21
     ===================================================================== */
  (function hero(){
    var cv = $('heroCanvas'), N = 21;
    var parts = HR.allPartitions(N);
    var W = 0, H = 0, g;
    var cur = [6, 5, 4, 3, 2, 1], from = [], to = [], t = 1, nextAt = 0, running = true, last = 0;

    function layout(p){
      var rows = p.length, cols = p[0];
      var s = Math.min(W / (cols + 1.2), H / (rows + 1.2), 34);
      var x0 = (W - (cols - 1) * s) / 2, y0 = (H - 18 - (rows - 1) * s) / 2, out = [];
      for(var r = 0; r < rows; r++) for(var c = 0; c < p[r]; c++) out.push({ x: x0 + c * s, y: y0 + r * s, s: s });
      return out;
    }
    function size(){
      W = Math.max(240, cv.parentElement.clientWidth);
      H = Math.max(240, Math.min(340, Math.round(W * 0.78)));
      g = HR.fit(cv, W, H);
      to = layout(cur);
      from = to.map(function(d){ return { x: d.x, y: d.y, s: d.s }; });
      t = 1;
      draw();
    }
    function draw(){
      g.clearRect(0, 0, W, H);
      for(var i = 0; i < to.length; i++){
        var e = HR.ease(Math.min(1, t));
        var x = HR.lerp(from[i].x, to[i].x, e), y = HR.lerp(from[i].y, to[i].y, e), s = HR.lerp(from[i].s, to[i].s, e);
        g.beginPath();
        g.fillStyle = rowColor(i, to.length);
        g.shadowColor = rowColor(i, to.length, 0.7);
        g.shadowBlur = 12;
        g.arc(x, y, Math.max(3, s * 0.3), 0, Math.PI * 2);
        g.fill();
      }
      g.shadowBlur = 0;
      g.font = '12px ui-monospace, Menlo, Consolas, monospace';
      g.fillStyle = 'rgba(255,250,245,0.85)';
      g.textAlign = 'center';
      var label = N + ' = ' + cur.join(' + ');
      g.fillText(label.length > 44 ? label.slice(0, 41) + '…' : label, W / 2, H - 6);
    }
    function pick(){
      var nxt;
      do { nxt = parts[Math.floor(Math.random() * parts.length)]; } while(HR.sameParts(nxt, cur));
      from = to.map(function(d){ return { x: d.x, y: d.y, s: d.s }; });
      cur = nxt;
      var nt = layout(cur);
      // dots keep their identity: reuse positions for the first 21, all partitions of 21 have 21 dots
      to = nt; t = 0;
    }
    function frame(now){
      if(running){
        var dt = last ? Math.min(60, now - last) : 16;
        last = now;
        if(t < 1){ t += dt / 1000; if(t > 1) t = 1; draw(); }
        else if(now > nextAt){ pick(); nextAt = now + 2600; }
      } else last = 0;
      requestAnimationFrame(frame);
    }
    size();
    onRedraw(size);
    visible(cv, function(v){ running = v; });
    if(!HR.reduced) requestAnimationFrame(frame);

    // ticker: exact values straight from the engine
    var list = [10, 50, 100, 200, 500, 1000], ti = 2;
    HR.ensureP(1000).then(function(){
      function show(){
        var n = list[ti % list.length];
        $('tickK').textContent = 'p(' + n + ')';
        $('tickV').textContent = HR.fmtFull(HR.p(n));
      }
      show();
      if(!HR.reduced) setInterval(function(){ ti++; show(); }, 2400);
    });
  })();

  /* =====================================================================
     CHAPTER 1: partition builder with animated conjugation
     ===================================================================== */
  (function builder(){
    var cv = $('bCanvas'), nEl = $('bN'), nVal = $('bNval'), chips = $('bChips'), read = $('bRead'), btn = $('bConj');
    var n = +nEl.value, list = [], cur = [], g, W = 0, H = 300, anim = null;

    function geom(p){
      var L = Math.max(p[0], p.length);
      var s = Math.min(30, (H - 40) / L, (W - 40) / L);
      return { s: s, x0: 28, y0: 24 };
    }
    function drawGuide(gm, L){
      g.strokeStyle = HR.css('--line-strong');
      g.setLineDash([4, 5]);
      g.beginPath();
      g.moveTo(gm.x0 - gm.s * 0.5, gm.y0 - gm.s * 0.5);
      g.lineTo(gm.x0 + gm.s * (L - 0.5), gm.y0 + gm.s * (L - 0.5));
      g.stroke();
      g.setLineDash([]);
    }
    function draw(tt){
      g.clearRect(0, 0, W, H);
      var gm = geom(cur), L = Math.max(cur[0], cur.length);
      drawGuide(gm, L);
      var e = tt === undefined ? 0 : HR.ease(tt);
      for(var r = 0; r < cur.length; r++){
        for(var c = 0; c < cur[r]; c++){
          // a dot at (row r, col c) flies to (row c, col r)
          var rr = HR.lerp(r, c, e), cc = HR.lerp(c, r, e);
          g.beginPath();
          g.fillStyle = rowColor(r, cur.length);
          g.shadowColor = rowColor(r, cur.length, 0.6);
          g.shadowBlur = 8;
          g.arc(gm.x0 + cc * gm.s, gm.y0 + rr * gm.s, gm.s * 0.34, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.shadowBlur = 0;
    }
    function text(){
      var cj = HR.conjugate(cur);
      var s = HR.t('b-count', { n: n, c: HR.p(n).toString() }) + ' ' +
              HR.t('b-read', { a: '(' + cur.join(', ') + ')', b: '(' + cj.join(', ') + ')' });
      if(HR.sameParts(cur, cj)) s += ' ' + HR.t('b-self');
      read.innerHTML = s;
    }
    function build(){
      n = +nEl.value; nVal.textContent = n;
      list = HR.allPartitions(n);
      cur = list[Math.min(Math.floor(list.length / 3), list.length - 1)];
      chips.innerHTML = '';
      list.forEach(function(p, i){
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'chip'; b.textContent = p.join('+');
        b.addEventListener('click', function(){ select(p); });
        chips.appendChild(b);
      });
      mark(); draw(); text();
    }
    function mark(){
      var kids = chips.children;
      for(var i = 0; i < list.length; i++) kids[i].classList.toggle('on', HR.sameParts(list[i], cur));
      var on = chips.querySelector('.on');
      if(on && on.scrollIntoView) { var top = on.offsetTop - chips.offsetTop; chips.scrollTop = Math.max(0, top - 40); }
    }
    function select(p){ if(anim) return; cur = p; mark(); draw(); text(); }
    function size(){
      W = Math.max(240, cv.parentElement.clientWidth - 36);
      H = 300;
      g = HR.fit(cv, W, H);
      draw();
    }
    btn.addEventListener('click', function(){
      if(anim) return;
      var target = HR.conjugate(cur);
      if(HR.reduced){ select(target); return; }
      var start = performance.now();
      anim = true; btn.disabled = true;
      (function step(now){
        var tt = Math.min(1, (now - start) / 900);
        draw(tt);
        if(tt < 1) requestAnimationFrame(step);
        else { anim = null; btn.disabled = false; cur = target; mark(); draw(); text(); }
      })(start);
    });
    nEl.addEventListener('input', build);
    onRedraw(size);
    document.addEventListener('hr-lang', function(){ if(cur.length) text(); });
    HR.ensureP(14).then(function(){ size(); build(); });
  })();

  /* =====================================================================
     CHAPTER 2: three algorithms, same answer
     ===================================================================== */
  (function race(){
    var nEl = $('rN'), nVal = $('rNval'), runBtn = $('rRun'), read = $('rRead');
    var bC = $('rBruteCanvas'), dC = $('rDpCanvas'), termsEl = $('rTerms');
    var bS = $('rBruteStat'), dS = $('rDpStat'), pS = $('rPentStat');
    var n = 20, dp, total, terms, cellOrder, W = 240, H = 168, bg, dg;
    var st = null;   // animation state

    function setup(){
      n = +nEl.value; nVal.textContent = n;
      dp = HR.dpTable(n);
      total = Number(HR.p(n));
      terms = HR.pentTerms(n);
      st = { brute: 0, cells: 0, term: 0, part: HR.firstPartition(n), acc: [0, 0, 0], running: false, t0: 0, last: 0, done: [false, false, false] };
      termsEl.innerHTML = '';
      draw();
      stats();
      read.innerHTML = HR.t('r-idle');
    }
    function size(){
      var w = Math.max(200, bC.parentElement.clientWidth);
      W = w; H = 168;
      bg = HR.fit(bC, W, H);
      dg = HR.fit(dC, W, H);
      if(st) draw();
    }
    function drawBrute(){
      bg.clearRect(0, 0, W, H);
      var p = st.part, rows = p.length, cols = p[0];
      var s = Math.min((W - 16) / Math.max(cols, 1), (H - 16) / Math.max(rows, 1), 22);
      var x0 = (W - cols * s) / 2 + s / 2, y0 = (H - rows * s) / 2 + s / 2;
      for(var r = 0; r < rows; r++) for(var c = 0; c < p[r]; c++){
        bg.beginPath(); bg.fillStyle = rowColor(r, rows); bg.arc(x0 + c * s, y0 + r * s, s * 0.32, 0, 6.2832); bg.fill();
      }
    }
    function drawDp(){
      dg.clearRect(0, 0, W, H);
      var cw = (W - 4) / (n + 1), ch = (H - 4) / n;
      var maxv = Math.log(1 + total);
      for(var k = 1; k <= n; k++){
        for(var j = 0; j <= n; j++){
          var idx = (k - 1) * (n + 1) + j;
          var x = 2 + j * cw, y = 2 + (k - 1) * ch;
          if(idx < st.cells){
            var v = Math.log(1 + dp[k][j]) / maxv;
            dg.fillStyle = 'hsla(' + (285 - 260 * v).toFixed(0) + ',66%,56%,' + (0.25 + 0.75 * v).toFixed(2) + ')';
          } else dg.fillStyle = HR.css('--line');
          dg.fillRect(x, y, Math.max(1, cw - 1), Math.max(1, ch - 1));
        }
      }
    }
    function draw(){ drawBrute(); drawDp(); }
    function stats(){
      var cellsTotal = n * (n + 1);
      bS.innerHTML = HR.t('r-brute', { a: st.brute.toLocaleString(), b: total.toLocaleString() }) + (st.done[0] ? ' <span class="done">✓</span>' : '');
      dS.innerHTML = HR.t('r-dp', { a: st.cells.toLocaleString(), b: cellsTotal.toLocaleString() }) + (st.done[1] ? ' <span class="done">✓</span>' : '');
      pS.innerHTML = HR.t('r-pent', { a: st.term, b: terms.length }) + (st.done[2] ? ' <span class="done">✓</span>' : '');
    }
    function addTerm(i){
      var tm = terms[i];
      var d = document.createElement('div');
      d.className = tm.sign > 0 ? 'plus' : 'minus';
      d.innerHTML = '<b>' + (tm.sign > 0 ? '+' : '−') + '</b> p(' + tm.idx + ') = ' + HR.p(tm.idx).toString();
      termsEl.appendChild(d);
      while(termsEl.children.length > 10) termsEl.removeChild(termsEl.firstChild);
    }
    function finish(){
      st.running = false; runBtn.disabled = false;
      var sum = 0n;
      terms.forEach(function(tm){ sum += tm.sign > 0 ? HR.p(tm.idx) : -HR.p(tm.idx); });
      var a = total, b = dp[n][n], c = Number(sum);
      var ok = (a === b && b === c && BigInt(a) === HR.p(n));
      read.innerHTML = ok
        ? HR.t('r-all', { n: n, v: HR.fmtFull(HR.p(n)), a: total.toLocaleString(), b: (n * (n + 1)).toLocaleString(), c: terms.length })
        : 'MISMATCH ' + a + ' ' + b + ' ' + c;
      if(!ok) console.error('race mismatch', a, b, c);
    }
    function run(){
      if(st && st.running) return;
      setup();
      st.running = true; runBtn.disabled = true;
      var cellsTotal = n * (n + 1);
      if(HR.reduced){
        st.brute = total; st.cells = cellsTotal; st.term = terms.length; st.done = [true, true, true];
        terms.forEach(function(_, i){ addTerm(i); });
        draw(); stats(); finish(); return;
      }
      var rate = Math.max(60, total / 4);          // one common speed: steps per second
      read.innerHTML = '';
      st.last = performance.now();
      (function frame(now){
        var dt = Math.min(0.4, (now - st.last) / 1000); st.last = now;
        var step = rate * dt;
        // brute force: walk the partitions in reverse-lexicographic order
        st.acc[0] += step;
        while(!st.done[0] && st.acc[0] >= 1){
          st.acc[0] -= 1; st.brute++;
          var nx = HR.nextPartition(st.part);
          if(nx) st.part = nx; else { st.done[0] = true; }
          if(st.brute >= total) st.done[0] = true;
        }
        st.acc[1] += step;
        var wholeC = Math.floor(st.acc[1]); st.acc[1] -= wholeC;
        st.cells = Math.min(cellsTotal, st.cells + wholeC); if(st.cells >= cellsTotal) st.done[1] = true;
        st.acc[2] += step;
        var wholeT = Math.floor(st.acc[2]); st.acc[2] -= wholeT;
        while(wholeT-- > 0 && st.term < terms.length){ addTerm(st.term); st.term++; }
        if(st.term >= terms.length) st.done[2] = true;
        draw(); stats();
        if(st.done[0] && st.done[1] && st.done[2]) finish();
        else requestAnimationFrame(frame);
      })(st.last);
    }
    nEl.addEventListener('input', function(){ if(st && st.running) return; setup(); });
    runBtn.addEventListener('click', run);
    HR.ensureP(40).then(function(){ size(); setup(); });
    onRedraw(size);
    document.addEventListener('hr-lang', function(){ if(st) stats(); });
  })();

  /* =====================================================================
     CHAPTER 3: the wall of p(n) mod m
     ===================================================================== */
  (function wall(){
    var cv = $('wCanvas'), mEl = $('wM'), mVal = $('wMval'), read = $('wRead'), hunt = $('wHunt'), tip = $('wTip');
    var ROWS = 56, CELLH = 7, TOP = 24, MMIN = 2, MMAX = 36;
    var m = 5, W = 0, Hh = TOP + ROWS * CELLH, g, ready = false, res = null, geom = null;

    function colorFor(r, mm){
      var t = mm <= 2 ? 0 : (r - 1) / (mm - 2);
      return 'hsl(' + (285 - 260 * t).toFixed(0) + ',64%,56%)';
    }
    function draw(){
      if(!ready) return;
      res = HR.residueGrid(m, ROWS);
      var cw = Math.min(72, (W - 8) / m), x0 = (W - cw * m) / 2;
      geom = { cw: cw, x0: x0 };
      g.clearRect(0, 0, W, Hh);
      var zero = HR.css('--bg');
      for(var r = 0; r < ROWS; r++) for(var c = 0; c < m; c++){
        var v = res.grid[r][c];
        g.fillStyle = v === 0 ? zero : colorFor(v, m);
        g.fillRect(x0 + c * cw, TOP + r * CELLH, Math.max(1, cw - 1), CELLH - 1);
      }
      var acc = HR.css('--accent');
      g.font = '600 11px ui-monospace, Menlo, Consolas, monospace';
      g.textAlign = 'center';
      res.darkCols.forEach(function(c){
        g.strokeStyle = acc; g.lineWidth = 2;
        g.strokeRect(x0 + c * cw - 1, TOP - 2, cw + 1, ROWS * CELLH + 3);
        g.fillStyle = acc;
        g.fillText('n≡' + c, x0 + c * cw + cw / 2, TOP - 8);
      });
      var s;
      if(res.darkCols.length){
        s = res.darkCols.map(function(c){ return HR.t('w-dark', { m: m, c: c, rows: ROWS }); }).join('<br>');
        if(m === 25) s += HR.t('w-25');
        if(m === 35) s += HR.t('w-35');
      } else s = HR.t('w-none', { m: m });
      read.innerHTML = s;
    }
    function size(){
      W = Math.max(240, cv.parentElement.clientWidth);
      g = HR.fit(cv, W, Hh);
      draw();
    }
    function setM(v){
      m = Math.max(MMIN, Math.min(MMAX, v)); mEl.value = m; mVal.textContent = m;
      Array.prototype.forEach.call(hunt.children, function(ch){ ch.classList.toggle('on', +ch.dataset.m === m); });
      draw();
    }
    mEl.addEventListener('input', function(){ setM(+mEl.value); });

    cv.addEventListener('mousemove', function(ev){
      if(!ready || !geom) return;
      var rect = cv.getBoundingClientRect();
      var x = ev.clientX - rect.left, y = ev.clientY - rect.top;
      var c = Math.floor((x - geom.x0) / geom.cw), r = Math.floor((y - TOP) / CELLH);
      if(c < 0 || c >= m || r < 0 || r >= ROWS){ tip.classList.remove('show'); return; }
      var n = m * r + c;
      tip.textContent = HR.t('w-tip', { n: n, v: HR.fmt(HR.p(n)), r: res.grid[r][c] });
      tip.style.left = (x + cv.offsetLeft) + 'px'; tip.style.top = (y + cv.offsetTop) + 'px';
      tip.classList.add('show');
    });
    cv.addEventListener('mouseleave', function(){ tip.classList.remove('show'); });

    read.textContent = HR.t('w-loading');
    HR.ensureP(MMAX * ROWS + MMAX + 5).then(function(){
      ready = true;
      for(var k = MMIN; k <= MMAX; k++){
        var b = document.createElement('button');
        b.type = 'button'; b.dataset.m = k; b.textContent = k;
        var hit = HR.residueGrid(k, ROWS).darkCols.length > 0;
        b.className = 'chip' + (hit ? ' hit' : '');
        (function(kk){ b.addEventListener('click', function(){ setM(kk); }); })(k);
        hunt.appendChild(b);
      }
      size(); setM(m);
    });
    onRedraw(size);
    document.addEventListener('hr-lang', draw);
  })();

  /* =====================================================================
     CHAPTER 4: exact p(n) vs Hardy-Ramanujan
     ===================================================================== */
  (function asym(){
    var cv = $('aCanvas'), sl = $('aN'), nVal = $('aNval'), read = $('aRead');
    var NMAX = 10000, W = 0, H = 350, g, L = null, LH = null, RR = null, loading = false;

    function curN(){ return Math.round(Math.pow(10, 1 + 3 * (+sl.value) / 1000)); }
    function ensure(){
      if(L || loading) return;
      loading = true;
      read.textContent = HR.t('w-loading');
      HR.ensureP(NMAX).then(function(){
        L = [0]; LH = [0]; RR = [1];
        for(var n = 1; n <= NMAX; n++){
          var l = HR.log10Big(HR.p(n)), lh = HR.log10HR(n);
          L.push(l); LH.push(lh); RR.push(Math.pow(10, lh - l));
        }
        draw();
      });
    }
    function draw(){
      var N = curN(); nVal.textContent = N.toLocaleString();
      if(!g) return;
      g.clearRect(0, 0, W, H);
      if(!L){ return; }
      var padL = 44, padR = 14, topH = 190, gap = 34, botH = H - topH - gap - 26;
      var xs = function(n){ return padL + (Math.log10(n) / Math.log10(N)) * (W - padL - padR); };
      var acc = HR.css('--accent'), pur = HR.css('--purple'), dim = HR.css('--ink-faint'), line = HR.css('--line-strong');
      g.font = '11px Inter, sans-serif'; g.fillStyle = dim; g.strokeStyle = line; g.lineWidth = 1;

      // top: log10 p(n)
      var ymaxL = Math.ceil(L[N]);
      var yt = function(v){ return 14 + topH - 14 - (v / ymaxL) * (topH - 28); };
      g.textAlign = 'right';
      for(var k = 0; k <= 4; k++){
        var v = ymaxL * k / 4, y = yt(v);
        g.beginPath(); g.moveTo(padL, y); g.lineTo(W - padR, y); g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1;
        g.fillText(Math.round(v), padL - 6, y + 4);
      }
      var curve = function(arr, col, dash, lw){
        g.beginPath(); g.setLineDash(dash || []); g.strokeStyle = col; g.lineWidth = lw;
        for(var n = 1; n <= N; n++){
          var x = xs(n), y = yt(arr[n]);
          if(n === 1) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke(); g.setLineDash([]);
      };
      curve(L, acc, null, 2.4);
      curve(LH, pur, [5, 4], 1.8);
      g.textAlign = 'left'; g.fillStyle = dim;
      g.fillText(HR.t('a-log'), padL, 10);
      // legend
      g.fillStyle = acc; g.fillRect(W - padR - 190, 4, 14, 3); g.fillStyle = dim; g.fillText(HR.t('a-exact'), W - padR - 172, 9);
      g.fillStyle = pur; g.fillRect(W - padR - 98, 4, 14, 3); g.fillStyle = dim; g.fillText(HR.t('a-hr'), W - padR - 80, 9);

      // bottom: ratio
      var y0 = topH + gap, rmax = 1;
      for(var n2 = 10; n2 <= N; n2++) if(RR[n2] > rmax) rmax = RR[n2];
      rmax = Math.max(1.01, Math.ceil(rmax * 100) / 100);
      var yr = function(v){ return y0 + botH - ((v - 1) / (rmax - 1)) * (botH - 6); };
      g.textAlign = 'right'; g.fillStyle = dim;
      [1, (1 + rmax) / 2, rmax].forEach(function(v){
        var y = yr(v); g.beginPath(); g.moveTo(padL, y); g.lineTo(W - padR, y); g.globalAlpha = 0.5; g.strokeStyle = line; g.stroke(); g.globalAlpha = 1;
        g.fillText(v.toFixed(3), padL - 6, y + 4);
      });
      g.beginPath(); g.strokeStyle = acc; g.lineWidth = 2;
      var started = false;
      for(var n3 = 10; n3 <= N; n3++){
        var x = xs(n3) , y2 = yr(RR[n3]);
        if(!started){ g.moveTo(x, y2); started = true; } else g.lineTo(x, y2);
      }
      g.stroke();
      g.textAlign = 'left'; g.fillStyle = dim;
      g.fillText(HR.t('a-ratio'), padL, y0 - 8);
      // x ticks
      g.textAlign = 'center';
      [1, 10, 100, 1000, 10000].forEach(function(t){ if(t <= N && t >= 10 || t === 1){ g.fillText(t >= 1000 ? (t / 1000) + 'k' : t, xs(t), H - 4); } });
      // marker at N
      g.strokeStyle = dim; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(xs(N), 14); g.lineTo(xs(N), y0 + botH); g.stroke(); g.setLineDash([]);

      read.innerHTML = HR.t('a-read', {
        n: N.toLocaleString(), d: HR.p(N).toString().length,
        ex: HR.fmt(HR.p(N)), hr: HR.fmtLog10(LH[N]), r: RR[N].toFixed(5)
      });
    }
    function size(){
      W = Math.max(240, cv.parentElement.clientWidth - 36);
      g = HR.fit(cv, W, H);
      draw();
    }
    sl.addEventListener('input', function(){ if(!L){ ensure(); nVal.textContent = curN().toLocaleString(); } else draw(); });
    size();
    nVal.textContent = curN().toLocaleString();
    onRedraw(size);
    document.addEventListener('hr-lang', draw);
    visible(cv, function(v){ if(v) ensure(); });
  })();

  /* =====================================================================
     SELF-CHECK: JavaScript against the table exported by the C++ programs
     ===================================================================== */
  (function selfcheck(){
    var badge = $('vBadge'), txt = $('vText'), state = 'wait';
    function paint(){
      badge.className = 'badge' + (state === 'ok' ? ' ok' : state === 'bad' ? ' bad' : '');
      if(state === 'ok') txt.textContent = HR.t('vb-ok');
      else if(state === 'bad') txt.textContent = HR.t('vb-bad');
      else if(state === 'none') txt.textContent = HR.t('vb-none');
    }
    HR.ensureP(2100).then(function(){
      return fetch('data/verified.json').then(function(r){ if(!r.ok) throw new Error('http ' + r.status); return r.json(); });
    }).then(function(ref){
      var bad = 0;
      for(var n = 0; n <= 1000; n++) if(HR.p(n).toString() !== ref.p[n]){ bad++; console.error('p(' + n + ') differs from C++ table'); }
      var mine = [];
      for(var m = 2; m <= 30; m++) HR.residueGrid(m, 56).darkCols.forEach(function(b){ mine.push(m + ':' + b); });
      var theirs = ref.congruence_scan.pairs.map(function(p){ return p.m + ':' + p.b; });
      if(mine.sort().join() !== theirs.sort().join()){ bad++; console.error('congruence pairs differ', mine, theirs); }
      state = bad === 0 ? 'ok' : 'bad'; paint();
    }).catch(function(e){ console.warn('self-check unavailable:', e); state = 'none'; paint(); });
    document.addEventListener('hr-lang', paint);
  })();

  /* =====================================================================
     Typeset the displayed equations with KaTeX (falls back to the plain-text version if it cannot load)
     ===================================================================== */
  HR.renderMath = function(){
    if(!window.katex) return;
    document.querySelectorAll('.tex').forEach(function(el){
      try {
        window.katex.render(el.getAttribute('data-tex'), el, { throwOnError: false, displayMode: el.getAttribute('data-display') === '1' });
        el.classList.add('done');
      } catch(e) { /* keep the plain-text fallback */ }
    });
  };
  if(window.katex) HR.renderMath();

  /* =====================================================================
     Reading progress bar + reveal-on-scroll
     ===================================================================== */
  (function chrome(){
    var bar = $('progress');
    function upd(){
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, window.scrollY / h * 100) : 0) + '%';
    }
    window.addEventListener('scroll', upd, { passive: true }); upd();
    var els = document.querySelectorAll('.reveal');
    if(!('IntersectionObserver' in window) || HR.reduced){ els.forEach(function(e){ e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function(e){ io.observe(e); });
  })();
})();
