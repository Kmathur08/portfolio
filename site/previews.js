/* Shared animated preview canvases. Usage: Previews.mount({ pauseButton }) */
(function () {
const W = '#f5f5f5', WARM = '#ffa582', COOL = '#5e80f0', PEARL = '#feeae1', SIL = '#bcc0ca';
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
function bgGrid(ctx, w, h) {
  ctx.fillStyle = '#121212'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#ffffff08'; ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}
function glow(ctx, x, y, r, c) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }

const fib = []; for (let i = 0; i < 520; i++) { const y = 1 - (i / 519) * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996; fib.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
const CODE = [
  [['const ', SIL], ['scene', WARM], [' = new ', SIL], ['THREE.Scene', COOL], ['()', SIL]],
  [['const ', SIL], ['orb', WARM], [' = await ', SIL], ['createOrb', COOL], ['({ glow: ', SIL], ['true', PEARL], [' })', SIL]],
  [['', SIL]],
  [['export default function ', SIL], ['Hero', COOL], ['() {', SIL]],
  [['  return ', SIL], ['<Canvas', WARM], [' dpr={[1, 2]}>', SIL]],
  [['    <Orb', WARM], [' mouse={mouse} />', SIL]],
  [['  </Canvas>', WARM]],
  [['}', SIL]],
  [['', SIL]],
  [['// ', '#666'], ['shipped ✓ 98 perf · 100 a11y', '#5ee69a']],
];

let _ctImg = null;
function ctImg() { if (!_ctImg) { _ctImg = new Image(); _ctImg.decoding = 'async'; _ctImg.src = 'img/constitut-home.jpg'; } return _ctImg; }
const drawers = {
  dash(ctx, w, h, t) {
    bgGrid(ctx, w, h);
    const p = w * .07;
    ctx.fillStyle = '#1a1a1a'; rr(ctx, p, p, w - p * 2, h - p * 2, 12); ctx.fill();
    ctx.strokeStyle = '#ffffff12'; ctx.stroke();
    // KPIs
    const kw = (w - p * 2 - 40) / 3;
    ['Revenue', 'Users', 'Churn'].forEach((k, i) => {
      const x = p + 12 + i * (kw + 8), y = p + 12;
      ctx.fillStyle = '#222'; rr(ctx, x, y, kw, h * .16, 8); ctx.fill();
      ctx.fillStyle = '#868686'; ctx.font = `${Math.max(9, w * .022)}px Geist Mono, monospace`; ctx.fillText(k, x + 10, y + h * .06);
      ctx.fillStyle = i === 2 ? WARM : W; ctx.font = `600 ${Math.max(12, w * .04)}px Onest, sans-serif`;
      const v = [128 + Math.sin(t * .8) * 4, 24.6 + Math.sin(t + 1) * .3, 2.1 + Math.sin(t * 1.3) * .1][i];
      ctx.fillText(i === 0 ? '$' + v.toFixed(1) + 'k' : i === 1 ? v.toFixed(1) + 'k' : v.toFixed(2) + '%', x + 10, y + h * .125);
    });
    // chart
    const cx = p + 16, cy = p + h * .26, cw = w - p * 2 - 32, ch = h - p * 2 - h * .3;
    const pts = []; for (let i = 0; i <= 40; i++) { const x = cx + cw * i / 40; const y = cy + ch * (.55 - .3 * Math.sin(i * .35 + t * 1.2) * .6 - .15 * Math.sin(i * .9 + t * .7) - i / 40 * .25); pts.push([x, y]); }
    const g = ctx.createLinearGradient(0, cy, 0, cy + ch); g.addColorStop(0, '#ffa58255'); g.addColorStop(1, '#ffa58200');
    ctx.beginPath(); ctx.moveTo(pts[0][0], cy + ch); pts.forEach(q => ctx.lineTo(q[0], q[1])); ctx.lineTo(cx + cw, cy + ch); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.strokeStyle = WARM; ctx.lineWidth = 2; ctx.stroke();
    const sweep = (t * .25 % 1), si = Math.floor(sweep * 40), sp = pts[si];
    ctx.strokeStyle = '#ffffff30'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(sp[0], cy); ctx.lineTo(sp[0], cy + ch); ctx.stroke(); ctx.setLineDash([]);
    glow(ctx, sp[0], sp[1], 18, '#ffa58299'); ctx.fillStyle = W; ctx.beginPath(); ctx.arc(sp[0], sp[1], 3.5, 0, 7); ctx.fill();
  },
  sphere(ctx, w, h, t) {
    ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0, 0, w, h);
    glow(ctx, w / 2, h / 2, Math.min(w, h) * .55, '#5e80f033');
    const R = Math.min(w, h) * .32, ry = t * .4, rx = .4 + Math.sin(t * .3) * .2;
    const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    for (const [x0, y0, z0] of fib) {
      const wob = 1 + .08 * Math.sin(y0 * 5 + t * 2) * Math.cos(x0 * 4 + t);
      let x = x0 * cy - z0 * sy, z = x0 * sy + z0 * cy, y = y0;
      const y2 = y * cx - z * sx; z = y * sx + z * cx; y = y2;
      const s = (z + 1.6) / 2.6;
      ctx.fillStyle = z > 0 ? `rgba(255,${165 + z * 60 | 0},${130 + z * 100 | 0},${.25 + s * .75})` : `rgba(94,128,240,${.15 + s * .4})`;
      ctx.beginPath(); ctx.arc(w / 2 + x * R * wob, h / 2 + y * R * wob, .6 + s * 1.8, 0, 7); ctx.fill();
    }
  },
  gradient(ctx, w, h, t) {
    ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.filter = `blur(${Math.max(w, h) * .06}px)`;
    const blobs = [[WARM, .3, .4, .9], [COOL, .7, .6, .7], [PEARL, .5, .3, 1.1], ['#ff7a4e', .6, .8, .8]];
    blobs.forEach(([c, bx, by, sp], i) => {
      ctx.fillStyle = c; ctx.globalAlpha = .75;
      ctx.beginPath(); ctx.arc(w * (bx + .2 * Math.sin(t * sp * .5 + i)), h * (by + .2 * Math.cos(t * sp * .4 + i * 2)), Math.min(w, h) * (.28 + .05 * Math.sin(t + i)), 0, 7); ctx.fill();
    });
    ctx.restore(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#00000040'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff'; ctx.font = `500 ${w * .085}px "General Sans", Onest, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('komorebi', w / 2, h / 2); ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  },
  kinetic(ctx, w, h, t) {
    ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0, 0, w, h);
    const words = ['Design', 'Motion', 'Systems', 'Vesper'];
    const fs = w * .13; ctx.font = `600 ${fs}px "General Sans", Onest, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const cyc = t * .55, i = Math.floor(cyc) % words.length, f = cyc % 1;
    const e = f < .75 ? 0 : (f - .75) / .25, ease = 1 - Math.pow(1 - e, 3);
    const rows = 7;
    for (let r = -3; r <= 3; r++) {
      const y = h / 2 + r * fs * .95 - ease * fs * .95;
      const a = r === 0 ? 1 - ease * .8 : r === 1 ? .2 + ease * .8 : .08;
      ctx.fillStyle = r === 0 || r === 1 ? `rgba(245,245,245,${a})` : `rgba(245,245,245,${a})`;
      const word = words[(i + r + words.length * 3) % words.length];
      if (r === 1 && ease > 0) { const g = ctx.createLinearGradient(w * .2, 0, w * .8, 0); g.addColorStop(0, SIL); g.addColorStop(.5, PEARL); g.addColorStop(1, WARM); ctx.fillStyle = g; ctx.globalAlpha = a; }
      if (r === 0) { const g = ctx.createLinearGradient(w * .2, 0, w * .8, 0); g.addColorStop(0, SIL); g.addColorStop(.5, PEARL); g.addColorStop(1, WARM); ctx.fillStyle = g; ctx.globalAlpha = a; }
      ctx.fillText(word, w / 2, y); ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    const fade = ctx.createLinearGradient(0, 0, 0, h); fade.addColorStop(0, '#0d0d0d'); fade.addColorStop(.3, '#0d0d0d00'); fade.addColorStop(.7, '#0d0d0d00'); fade.addColorStop(1, '#0d0d0d');
    ctx.fillStyle = fade; ctx.fillRect(0, 0, w, h);
  },
  chat(ctx, w, h, t) {
    bgGrid(ctx, w, h);
    const msgs = [
      { me: true, text: 'Automate our weekly ops report' },
      { me: false, text: 'Connected 3 data sources ✓' },
      { me: false, text: 'Report drafted, sent to #ops' },
      { me: true, text: 'Ship it 🚀' },
    ];
    const cycle = 9, lt = t % cycle, fs = Math.max(10, w * .028);
    ctx.font = `${fs}px Onest, sans-serif`;
    let y = h * .14;
    msgs.forEach((m, i) => {
      const start = i * 1.6 + .3; if (lt < start) return;
      const k = Math.min(1, (lt - start) / .5), e = 1 - Math.pow(1 - k, 3);
      const fadeOut = lt > cycle - .8 ? 1 - (lt - (cycle - .8)) / .8 : 1;
      const tw = ctx.measureText(m.text).width, bw = tw + fs * 2, bh = fs * 2.4;
      const x = m.me ? w - w * .08 - bw : w * .08;
      ctx.globalAlpha = e * fadeOut;
      ctx.save(); ctx.translate(0, (1 - e) * 12);
      if (!m.me) { ctx.fillStyle = WARM; ctx.beginPath(); ctx.arc(x + fs * .6, y + bh / 2, fs * .55, 0, 7); ctx.fill(); }
      const bx = m.me ? x : x + fs * 1.6;
      ctx.fillStyle = m.me ? '#f2f2f2' : '#222'; rr(ctx, bx, y, bw, bh, bh / 2); ctx.fill();
      if (!m.me) { ctx.strokeStyle = '#ffffff14'; ctx.stroke(); }
      ctx.fillStyle = m.me ? '#000' : W; ctx.fillText(m.text, bx + fs, y + bh * .64);
      ctx.restore(); ctx.globalAlpha = 1;
      y += bh + fs * 1.1;
    });
    // typing indicator
    const typing = msgs.findIndex((m, i) => lt < i * 1.6 + .3);
    if (typing > 0 && !msgs[typing].me) {
      const bx = w * .08 + 0, bh = fs * 2.4;
      ctx.fillStyle = '#222'; rr(ctx, bx + fs * 1.6, y, fs * 4, bh, bh / 2); ctx.fill();
      for (let d = 0; d < 3; d++) { ctx.fillStyle = `rgba(245,245,245,${.3 + .7 * Math.max(0, Math.sin(t * 6 - d))})`; ctx.beginPath(); ctx.arc(bx + fs * 2.8 + d * fs * .8, y + bh / 2, fs * .2, 0, 7); ctx.fill(); }
    }
    // input bar
    const ih = fs * 3; ctx.fillStyle = '#1b1b1b'; rr(ctx, w * .08, h - ih - h * .07, w * .84, ih, ih / 2); ctx.fill(); ctx.strokeStyle = '#ffffff14'; ctx.stroke();
    ctx.fillStyle = '#868686'; ctx.fillText('Ask anything…', w * .08 + fs * 1.2, h - h * .07 - ih * .38);
    ctx.fillStyle = WARM; ctx.beginPath(); ctx.arc(w * .92 - ih / 2, h - h * .07 - ih / 2, ih * .34, 0, 7); ctx.fill();
  },
  phone(ctx, w, h, t) {
    ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0, 0, w, h);
    glow(ctx, w / 2, h * .6, w * .45, '#ffa58226');
    const ph = h * .92, pw = ph * .5, px = w / 2 - pw / 2, py = h * .1 + Math.sin(t) * 4;
    ctx.fillStyle = '#1c1c1c'; rr(ctx, px, py, pw, ph + 40, pw * .16); ctx.fill(); ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); rr(ctx, px + 6, py + 6, pw - 12, ph + 28, pw * .13); ctx.clip();
    ctx.fillStyle = '#0f0f0f'; ctx.fillRect(px, py, pw, ph + 40);
    const off = (t * 22) % (ph * .3);
    for (let i = -1; i < 7; i++) {
      const cy = py + pw * .35 + i * ph * .3 - off, ch = ph * .25;
      const g = ctx.createLinearGradient(px, cy, px + pw, cy + ch);
      const cols = [[WARM, '#ff7a4e'], [COOL, '#9db0ff'], [PEARL, SIL]][(i + 9) % 3];
      g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]);
      ctx.fillStyle = g; ctx.globalAlpha = .9; rr(ctx, px + 14, cy, pw - 28, ch, 12); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#00000066'; rr(ctx, px + 24, cy + ch - 22, pw * .4, 8, 4); ctx.fill();
    }
    ctx.fillStyle = '#0f0f0f'; ctx.fillRect(px, py, pw, pw * .3);
    ctx.fillStyle = W; ctx.font = `600 ${pw * .09}px "General Sans", Onest, sans-serif`; ctx.fillText('Today', px + 18, py + pw * .24);
    ctx.fillStyle = '#000'; rr(ctx, px + pw / 2 - pw * .15, py + 12, pw * .3, 10, 5); ctx.fill();
    ctx.restore();
  },
  code(ctx, w, h, t, codeLines = CODE, file = 'hero.tsx') {
    ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#161616'; ctx.fillRect(0, 0, w, h * .09);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(20 + i * 18, h * .045, 5, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#868686'; ctx.font = `${Math.max(10, w * .022)}px Geist Mono, monospace`; ctx.textAlign = 'center'; ctx.fillText(file, w / 2, h * .055); ctx.textAlign = 'left';
    const fs = Math.max(11, w * .026); ctx.font = `${fs}px Geist Mono, monospace`;
    const total = codeLines.reduce((n, l) => n + l.reduce((m, s) => m + s[0].length, 0) + 1, 0);
    const shown = Math.floor(((t * 22) % (total + 60)));
    let c = 0, y = h * .09 + fs * 2.2;
    codeLines.forEach((line, li) => {
      ctx.fillStyle = '#444'; ctx.fillText(String(li + 1).padStart(2, ' '), 18, y);
      let x = 18 + fs * 2.2;
      for (const [txt, col] of line) {
        const vis = Math.max(0, Math.min(txt.length, shown - c)); c += txt.length;
        ctx.fillStyle = col; const s = txt.slice(0, vis); ctx.fillText(s, x, y); x += ctx.measureText(s).width;
        if (vis < txt.length && shown >= c - txt.length) { if (Math.sin(t * 8) > 0) { ctx.fillStyle = WARM; ctx.fillRect(x + 1, y - fs * .85, 2, fs); } }
      }
      c += 1; y += fs * 1.7;
    });
    if (shown >= total) { ctx.fillStyle = WARM; if (Math.sin(t * 8) > 0) ctx.fillRect(18 + fs * 2.2, y - fs * 1.7 - fs * .85 + fs * 1.7, 2, fs); }
  },
  /* Meetly: six-person call with a game tile */
  meet(ctx, w, h, t) {
    ctx.fillStyle = '#0c0d10'; ctx.fillRect(0, 0, w, h);
    const p = w * .045, barH = h * .14, gw = (w - p * 2 - 16) / 3, gh = (h - p * 2 - barH - 16) / 2;
    const people = [['Aarav', '#7fd1ff'], ['Kshitij', WARM], ['Isha', '#c7b3ff'], ['Rohan', '#9fe3c4'], ['Game', null], ['Meera', '#ffd27a']];
    const speaker = Math.floor(t / 2.2) % 6 === 4 ? 1 : Math.floor(t / 2.2) % 6;
    people.forEach(([name, col], i) => {
      const x = p + (i % 3) * (gw + 8), y = p + Math.floor(i / 3) * (gh + 8);
      ctx.fillStyle = '#17191e'; rr(ctx, x, y, gw, gh, 10); ctx.fill();
      if (!col) { // Zero & Cross board
        ctx.save(); rr(ctx, x, y, gw, gh, 10); ctx.clip();
        const s = Math.min(gw, gh) * .62, bx = x + gw / 2 - s / 2, by = y + gh / 2 - s / 2 - gh * .04;
        ctx.strokeStyle = '#ffffff40'; ctx.lineWidth = 2;
        for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(bx + s * k / 3, by); ctx.lineTo(bx + s * k / 3, by + s); ctx.moveTo(bx, by + s * k / 3); ctx.lineTo(bx + s, by + s * k / 3); ctx.stroke(); }
        const moves = [4, 0, 8, 2, 6, 1], n = Math.floor(t * .9) % (moves.length + 2);
        moves.slice(0, n).forEach((m, k) => {
          const cx = bx + s * ((m % 3) + .5) / 3, cy = by + s * (Math.floor(m / 3) + .5) / 3, r = s * .1;
          ctx.lineWidth = 2.5; ctx.strokeStyle = k % 2 ? '#7fd1ff' : WARM; ctx.beginPath();
          if (k % 2) ctx.arc(cx, cy, r, 0, 7); else { ctx.moveTo(cx - r, cy - r); ctx.lineTo(cx + r, cy + r); ctx.moveTo(cx + r, cy - r); ctx.lineTo(cx - r, cy + r); }
          ctx.stroke();
        });
        ctx.fillStyle = '#ffffffb0'; ctx.font = `${Math.max(9, w * .02)}px Geist Mono, monospace`; ctx.fillText('Zero & Cross', x + 10, y + gh - 10);
        ctx.restore(); return;
      }
      glow(ctx, x + gw / 2, y + gh * .45, gh * .7, col + '22');
      const r = Math.min(gw, gh) * .2;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + gw / 2, y + gh * .45, r, 0, 7); ctx.fill();
      ctx.fillStyle = '#14100c'; ctx.font = `600 ${r * .9}px Onest, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(name[0], x + gw / 2, y + gh * .45 + r * .32); ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffffc0'; ctx.font = `${Math.max(9, w * .021)}px Onest, sans-serif`; ctx.fillText(name, x + 10, y + gh - 10);
      if (i === speaker) { ctx.strokeStyle = '#5ee69a'; ctx.lineWidth = 2 + Math.sin(t * 9) * .8; rr(ctx, x + 1, y + 1, gw - 2, gh - 2, 10); ctx.stroke(); }
      if (i === 3) { ctx.fillStyle = '#ff5f57'; ctx.beginPath(); ctx.arc(x + gw - 14, y + 14, 5, 0, 7); ctx.fill(); }
    });
    const by = h - barH + barH * .2, bs = barH * .55, names = ['mic', 'cam', 'share', 'games'];
    names.forEach((n, i) => { const x = w / 2 - (bs * 2.5 + 10) + i * (bs + 10); ctx.fillStyle = i === 3 ? WARM + '33' : '#22252c'; ctx.beginPath(); ctx.arc(x + bs / 2, by + bs / 2, bs / 2, 0, 7); ctx.fill();
      ctx.fillStyle = i === 3 ? WARM : '#cfd3da'; ctx.beginPath(); ctx.arc(x + bs / 2, by + bs / 2, bs * .14, 0, 7); ctx.fill(); });
    const lx = w / 2 + (bs * 2.5 - bs * 1 + 10) + 10; ctx.fillStyle = '#ff5f57'; rr(ctx, lx, by + bs * .12, bs * 1.6, bs * .76, bs * .38); ctx.fill();
  },
  /* Thandak: district heat map and today's card */
  heat(ctx, w, h, t) {
    ctx.fillStyle = '#100a08'; ctx.fillRect(0, 0, w, h);
    const cols = 26, rows = 16, cw = w * .62 / cols, ch = h * .86 / rows, ox = w * .04, oy = h * .07;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const nx = i / cols, ny = j / rows;
      const inside = Math.hypot((nx - .5) * 1.3, (ny - .45) * 1.1) < .52 - .08 * Math.sin(nx * 7 + ny * 3);
      if (!inside) continue;
      const v = .5 + .5 * Math.sin(nx * 5 + t * .6) * Math.cos(ny * 4 - t * .4) + .25 * Math.sin((nx + ny) * 9 + t);
      const c = Math.max(0, Math.min(1, v));
      const col = c < .33 ? '#ffd27a' : c < .58 ? '#ffa04d' : c < .8 ? '#ff6a3d' : '#d8283a';
      ctx.globalAlpha = .35 + c * .65; ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(ox + i * cw + cw / 2, oy + j * ch + ch / 2, Math.min(cw, ch) * .36, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const px = ox + cw * 11.5, py = oy + ch * 6.5; glow(ctx, px, py, 26 + Math.sin(t * 3) * 6, '#ffffff55');
    ctx.fillStyle = W; ctx.beginPath(); ctx.arc(px, py, 4, 0, 7); ctx.fill();
    const cx = w * .67, cy = h * .12, cwid = w * .29, chgt = h * .76;
    ctx.fillStyle = '#1d1411'; rr(ctx, cx, cy, cwid, chgt, 12); ctx.fill(); ctx.strokeStyle = '#ffffff14'; ctx.stroke();
    const fs = Math.max(9, w * .02);
    ctx.fillStyle = '#a8968e'; ctx.font = `${fs}px Geist Mono, monospace`; ctx.fillText('Today · Jaipur', cx + 12, cy + 22);
    ctx.fillStyle = '#ff6a3d'; ctx.font = `600 ${fs * 1.9}px Onest, sans-serif`; ctx.fillText('High', cx + 12, cy + 22 + fs * 2.4);
    ctx.fillStyle = W; ctx.font = `${fs * 1.05}px Onest, sans-serif`; ctx.fillText(`${(43 + Math.sin(t * .5) * .4).toFixed(1)} °C`, cx + 12, cy + 22 + fs * 4);
    const gy = cy + 22 + fs * 5.2, gw2 = cwid - 24;
    const gg = ctx.createLinearGradient(cx + 12, 0, cx + 12 + gw2, 0); gg.addColorStop(0, '#ffd27a'); gg.addColorStop(.6, '#ff6a3d'); gg.addColorStop(1, '#d8283a');
    ctx.fillStyle = gg; rr(ctx, cx + 12, gy, gw2, 6, 3); ctx.fill();
    ctx.fillStyle = W; ctx.beginPath(); ctx.arc(cx + 12 + gw2 * .72, gy + 3, 5, 0, 7); ctx.fill();
    ['Water every 30 min', 'Avoid 12–4 pm outdoors', 'Check on Dadi at 2 pm'].forEach((s, i) => {
      const yy = gy + 22 + i * (fs * 2.6); ctx.fillStyle = '#2a1d18'; rr(ctx, cx + 12, yy, gw2, fs * 2, 8); ctx.fill();
      ctx.fillStyle = '#e9ddd6'; ctx.font = `${fs * .95}px Onest, sans-serif`; ctx.fillText(s, cx + 20, yy + fs * 1.35);
    });
    ctx.fillStyle = '#7d6b63'; ctx.font = `${fs * .9}px Geist Mono, monospace`; ctx.fillText('हिन्दी · EN', cx + 12, cy + chgt - 12);
  },
  /* NOVA: Kanban board with a card moving across */
  kanban(ctx, w, h, t) {
    bgGrid(ctx, w, h);
    const p = w * .05, colW = (w - p * 2 - 20) / 3, fs = Math.max(9, w * .021);
    const heads = [['To do', '#868686'], ['In progress', '#9a8bff'], ['Done', '#5ee69a']];
    const cardH = h * .14;
    heads.forEach(([n, c], i) => {
      const x = p + i * (colW + 10);
      ctx.fillStyle = '#18181c'; rr(ctx, x, p, colW, h - p * 2, 10); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 14, p + 18, 4, 0, 7); ctx.fill();
      ctx.fillStyle = '#d6d6dc'; ctx.font = `500 ${fs}px Onest, sans-serif`; ctx.fillText(n, x + 24, p + 22);
    });
    const cards = [[0, 'Design login page', 'HIGH'], [0, 'Seed demo users', 'LOW'], [1, 'Board drag & drop', 'MED'], [2, 'Prisma schema', 'MED'], [2, 'NextAuth setup', 'HIGH']];
    const cardAt = (col, k) => [p + col * (colW + 10) + 8, p + 38 + k * (cardH + 8)];
    const pri = { HIGH: '#ff6a6a', MED: '#ffb35c', LOW: '#7fd1ff' };
    const drawCard = (x, y, title, pr, lift) => {
      ctx.save(); if (lift) { ctx.shadowColor = '#000a'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8; }
      ctx.fillStyle = lift ? '#2c2a3a' : '#222228'; rr(ctx, x, y, colW - 16, cardH, 8); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#ececf1'; ctx.font = `${fs}px Onest, sans-serif`; ctx.fillText(title, x + 10, y + cardH * .42);
      ctx.fillStyle = pri[pr] + '33'; rr(ctx, x + 10, y + cardH * .58, fs * 3.4, fs * 1.4, 4); ctx.fill();
      ctx.fillStyle = pri[pr]; ctx.font = `${fs * .8}px Geist Mono, monospace`; ctx.fillText(pr, x + 15, y + cardH * .58 + fs);
    };
    const counts = [0, 0, 0];
    cards.forEach(([c, ti, pr]) => { const [x, y] = cardAt(c, counts[c]++); drawCard(x, y, ti, pr, false); });
    const cyc = (t * .35) % 3, from = Math.floor(cyc), f = cyc - from, e = f < .5 ? 0 : (f - .5) * 2, ee = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
    const to = (from + 1) % 3, a = cardAt(from, counts[from]), b = cardAt(to, counts[to]);
    const mx = a[0] + (b[0] - a[0]) * ee, my = a[1] + (b[1] - a[1]) * ee - Math.sin(ee * Math.PI) * 18;
    drawCard(mx, my, 'Invite teammates', 'HIGH', ee > 0 && ee < 1);
  },
  /* Thandak: the app's Today screen beside a WhatsApp alert chat */
  thandak(ctx, w, h, t) {
    const bg = ctx.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#1d0d07'); bg.addColorStop(1, '#2b1209');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    glow(ctx, w * .26, h * .45, w * .32, '#ff7a4e33'); glow(ctx, w * .78, h * .7, w * .28, '#25d36614');
    // ---------- phone (design units: 300 x 600)
    const ph = h * .9, pw = ph * .5, px = Math.max(w * .06, w * .3 - pw / 2), py = (h - ph) / 2 + Math.sin(t * .8) * 3;
    ctx.fillStyle = '#0a0706'; rr(ctx, px, py, pw, ph, pw * .13); ctx.fill(); ctx.strokeStyle = '#ffffff2e'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); rr(ctx, px + 5, py + 5, pw - 10, ph - 10, pw * .11); ctx.clip();
    const s = (pw - 10) / 300, X = v => px + 5 + v * s, Y = v => py + 5 + v * s, F = (wt, sz, fam = 'Onest, sans-serif') => `${wt} ${sz * s}px ${fam}`;
    const sg = ctx.createLinearGradient(0, py, 0, py + ph); sg.addColorStop(0, '#2a120a'); sg.addColorStop(1, '#130906');
    ctx.fillStyle = sg; ctx.fillRect(px, py, pw, ph);
    // status bar + header
    ctx.fillStyle = '#f3e5dc'; ctx.font = F(600, 11); ctx.fillText('2:14', X(22), Y(24));
    ctx.fillStyle = '#000'; rr(ctx, X(120), Y(12), 60 * s, 16 * s, 8 * s); ctx.fill();
    ctx.fillStyle = '#ff9a5c'; ctx.beginPath(); ctx.arc(X(30), Y(56), 9 * s, 0, 7); ctx.fill();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + t * .5; ctx.strokeStyle = '#ff9a5c'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(X(30) + Math.cos(a) * 12 * s, Y(56) + Math.sin(a) * 12 * s); ctx.lineTo(X(30) + Math.cos(a) * 15 * s, Y(56) + Math.sin(a) * 15 * s); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.font = F(700, 17); ctx.fillText('ठंडक', X(52), Y(55));
    ctx.fillStyle = '#c9a99a'; ctx.font = F(500, 10.5); ctx.fillText('Thandak · हिन्दी / EN', X(52), Y(70));
    ctx.fillStyle = '#ffffff12'; rr(ctx, X(196), Y(44), 84 * s, 24 * s, 12 * s); ctx.fill();
    ctx.fillStyle = '#ff7a4e'; ctx.beginPath(); ctx.arc(X(208), Y(56), 3.5 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#f3e5dc'; ctx.font = F(500, 10.5); ctx.fillText('Jaipur', X(216), Y(60));
    // today card
    const cg = ctx.createLinearGradient(X(16), Y(90), X(284), Y(250)); cg.addColorStop(0, '#ff7a4e'); cg.addColorStop(1, '#b9283a');
    ctx.fillStyle = cg; rr(ctx, X(16), Y(90), 268 * s, 158 * s, 20 * s); ctx.fill();
    glow(ctx, X(240), Y(110), 90 * s, '#ffd27a55');
    ctx.fillStyle = '#ffe9dd'; ctx.font = F(600, 11); ctx.fillText("TODAY'S HEAT LEVEL", X(32), Y(116));
    const temp = 44 + Math.round(Math.sin(t * .5));
    ctx.fillStyle = '#fff'; ctx.font = F(700, 58); ctx.fillText(temp + '°', X(30), Y(178));
    ctx.fillStyle = '#ffffff2e'; rr(ctx, X(170), Y(132), 98 * s, 26 * s, 13 * s); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = F(700, 12); ctx.textAlign = 'center'; ctx.fillText('Very high', X(219), Y(149)); ctx.textAlign = 'left';
    ctx.fillStyle = '#ffe9dd'; ctx.font = F(500, 11); ctx.fillText('Feels like 47°', X(172), Y(178));
    const gx = X(32), gw = 236 * s, gy = Y(214);
    const gg = ctx.createLinearGradient(gx, 0, gx + gw, 0); gg.addColorStop(0, '#ffe08a'); gg.addColorStop(.5, '#ffb15c'); gg.addColorStop(1, '#5a0f1a');
    ctx.fillStyle = gg; rr(ctx, gx, gy, gw, 8 * s, 4 * s); ctx.fill();
    ['Low', 'High', 'Severe'].forEach((l, k) => { ctx.fillStyle = '#ffe9dd'; ctx.font = F(500, 9); ctx.fillText(l, gx + [0, .45, .84][k] * gw, gy + 22 * s); });
    const mk = gx + gw * (.74 + Math.sin(t * .5) * .02);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mk, gy + 4 * s, 7 * s, 0, 7); ctx.fill(); ctx.strokeStyle = '#b9283a'; ctx.lineWidth = 2.5 * s; ctx.stroke();
    // hourly strip
    ctx.fillStyle = '#f3e5dc'; ctx.font = F(600, 12); ctx.fillText('Outdoor work · hourly', X(18), Y(282));
    const hrs = ['9', '10', '11', '12', '1', '2', '3', '4', '5'], lv = [.35, .5, .65, .82, .95, 1, .9, .7, .5];
    const now = Math.floor(t * .8) % hrs.length;
    hrs.forEach((hr, k) => {
      const bx = X(18) + k * 30 * s, bh = 52 * s * lv[k], by = Y(350) - bh;
      ctx.fillStyle = lv[k] > .85 ? '#e0283a' : lv[k] > .6 ? '#ff7a4e' : '#ffc06a';
      ctx.globalAlpha = k === now ? 1 : .55; rr(ctx, bx, by, 22 * s, bh, 6 * s); ctx.fill(); ctx.globalAlpha = 1;
      if (k === now) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 * s; rr(ctx, bx - 2 * s, by - 2 * s, 26 * s, bh + 4 * s, 7 * s); ctx.stroke(); }
      ctx.fillStyle = k === now ? '#fff' : '#a88b7e'; ctx.font = F(500, 9.5); ctx.textAlign = 'center'; ctx.fillText(hr, bx + 11 * s, Y(366)); ctx.textAlign = 'left';
    });
    // people at home
    ctx.fillStyle = '#f3e5dc'; ctx.font = F(600, 12); ctx.fillText('For your family', X(18), Y(396));
    [['D', 'Dadi, 72', 'Stay in the coolest room, 12–4 pm', '#ffd27a', 'Fan alone not safe'], ['B', 'Baby, 8 months', 'Light cotton, feed more often', '#9fe3c4', ''], ['Y', 'You', 'Outdoor work: 15 min rest every hour', '#7fd1ff', '']].forEach(([ini, who, tip, c, warn], k) => {
      const y = Y(408 + k * 60);
      ctx.fillStyle = '#ffffff10'; rr(ctx, X(16), y, 268 * s, 52 * s, 14 * s); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X(40), y + 26 * s, 13 * s, 0, 7); ctx.fill();
      ctx.fillStyle = '#1a0d08'; ctx.font = F(700, 12); ctx.textAlign = 'center'; ctx.fillText(ini, X(40), y + 30 * s); ctx.textAlign = 'left';
      ctx.fillStyle = '#fff'; ctx.font = F(600, 12); ctx.fillText(who, X(62), y + 22 * s);
      ctx.fillStyle = '#c9a99a'; ctx.font = F(400, 10.5); ctx.fillText(tip, X(62), y + 39 * s);
      if (warn) { ctx.fillStyle = '#e0283a33'; rr(ctx, X(170), y + 9 * s, 104 * s, 18 * s, 9 * s); ctx.fill(); ctx.fillStyle = '#ff8a8a'; ctx.font = F(600, 9); ctx.fillText(warn, X(178), y + 21.5 * s); }
    });
    ctx.restore();
    // ---------- WhatsApp chat
    const cx = px + pw + w * .06, cw = Math.min(w - cx - w * .05, w * .42), cy = h * .08, ch = h * .84;
    const fs = Math.max(9, Math.min(13, cw * .042));
    ctx.save(); ctx.shadowColor = '#000a'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#0b141a'; rr(ctx, cx, cy, cw, ch, 16); ctx.fill(); ctx.restore();
    ctx.save(); rr(ctx, cx, cy, cw, ch, 16); ctx.clip();
    ctx.strokeStyle = '#ffffff06'; ctx.lineWidth = 1; for (let i = -ch; i < cw; i += 18) { ctx.beginPath(); ctx.moveTo(cx + i, cy + ch); ctx.lineTo(cx + i + ch, cy); ctx.stroke(); }
    const hh = fs * 4.2;
    ctx.fillStyle = '#1f2c33'; ctx.fillRect(cx, cy, cw, hh);
    ctx.fillStyle = '#25d366'; ctx.beginPath(); ctx.arc(cx + hh * .5, cy + hh / 2, hh * .3, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `700 ${fs}px Onest, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('ठं', cx + hh * .5, cy + hh / 2 + fs * .35); ctx.textAlign = 'left';
    ctx.fillStyle = '#e9edef'; ctx.font = `600 ${fs}px Onest, sans-serif`; ctx.fillText('Thandak alerts', cx + hh * .95, cy + hh * .45);
    ctx.fillStyle = '#25d366'; ctx.font = `${fs * .8}px Onest, sans-serif`; ctx.fillText('online', cx + hh * .95, cy + hh * .45 + fs * 1.1);
    const msgs = [[1, ['302017']], [0, ['नमस्ते! जयपुर में आज गर्मी', 'बहुत ज़्यादा है: 44°']], [0, ['Dadi: coolest room 12–4 pm.', 'Water every 30 minutes.']], [1, ['YES, daily alerts']], [0, ['Done. 6 am alert every day.', 'Reply STOP to unsubscribe.']]];
    const cycle = (t * .7) % (msgs.length + 1.5), shown = Math.min(msgs.length, 2 + Math.floor(cycle));
    let my = cy + hh + fs * 1.4;
    ctx.font = `${fs * .9}px Onest, sans-serif`;
    // on short panels (phones) keep only the newest messages that fit above the input bar
    const typing = shown < msgs.length && msgs[shown][0] === 0, room = cy + ch - fs * 3.6 - my - (typing ? fs * 2.6 : 0);
    let first = 0; const bhOf = m => m[1].length * fs * 1.25 + fs * 2;
    while (first < shown - 1 && msgs.slice(first, shown).reduce((a, m) => a + bhOf(m), 0) > room) first++;
    msgs.slice(0, shown).forEach(([me, lines], i) => {
      if (i < first) return;
      const lw = Math.max(...lines.map(l => ctx.measureText(l).width)), bw = Math.min(lw + fs * 1.6, cw * .82), bh = lines.length * fs * 1.25 + fs * 1.3;
      const bx = me ? cx + cw - bw - fs : cx + fs;
      const pop = i === shown - 1 && shown > 2 ? Math.min(1, (cycle % 1) * 4) : 1;
      ctx.globalAlpha = pop; ctx.fillStyle = me ? '#005c4b' : '#202c33'; rr(ctx, bx, my + (1 - pop) * 8, bw, bh, 9); ctx.fill();
      ctx.fillStyle = '#e9edef'; lines.forEach((l, k) => ctx.fillText(l, bx + fs * .8, my + (1 - pop) * 8 + fs * 1.45 + k * fs * 1.25));
      ctx.fillStyle = me ? '#53bdeb' : '#8696a0'; ctx.font = `${fs * .62}px Onest, sans-serif`; ctx.textAlign = 'right';
      ctx.fillText(me ? '6:0' + i + ' ✓✓' : '6:0' + i, bx + bw - fs * .5, my + bh - fs * .35); ctx.textAlign = 'left'; ctx.font = `${fs * .9}px Onest, sans-serif`;
      ctx.globalAlpha = 1; my += bh + fs * .7;
    });
    if (typing) { // typing dots
      ctx.fillStyle = '#202c33'; rr(ctx, cx + fs, my, fs * 3.6, fs * 1.9, 9); ctx.fill();
      for (let d = 0; d < 3; d++) { ctx.fillStyle = '#8696a0'; ctx.globalAlpha = .4 + .6 * Math.max(0, Math.sin(t * 7 - d)); ctx.beginPath(); ctx.arc(cx + fs * (1.9 + d * .9), my + fs * .95, fs * .2, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#1f2c33'; rr(ctx, cx + fs * .7, cy + ch - fs * 3.1, cw - fs * 4.4, fs * 2.3, fs * 1.15); ctx.fill();
    ctx.fillStyle = '#8696a0'; ctx.font = `${fs * .85}px Onest, sans-serif`; ctx.fillText('Message', cx + fs * 1.6, cy + ch - fs * 1.65);
    ctx.fillStyle = '#00a884'; ctx.beginPath(); ctx.arc(cx + cw - fs * 1.9, cy + ch - fs * 1.95, fs * 1.1, 0, 7); ctx.fill();
    ctx.restore();
  },
  /* PaperSetu: the app's sign-in screen (colours, logo and copy from the app) beside a finished paper */
  paper(ctx, w, h, t) {
    const INK = '#1B2559', INK2 = '#34438A', SAF = '#EE7F22', CREAM = '#FBF7EE', LINE = '#D4CDBD', MUTED = '#5E6475';
    const bg = ctx.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#1a1508'); bg.addColorStop(1, '#0f0c06');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    glow(ctx, w * .3, h * .5, w * .38, '#ee7f2226');
    // ---- phone with the sign-in screen
    const ph = h * .92, pw = ph * .5, px = w * .08, py = h * .04 + Math.sin(t * .8) * 3;
    ctx.fillStyle = '#0b0b0d'; rr(ctx, px, py, pw, ph, pw * .13); ctx.fill(); ctx.strokeStyle = '#ffffff26'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); rr(ctx, px + 5, py + 5, pw - 10, ph - 10, pw * .11); ctx.clip();
    ctx.fillStyle = CREAM; ctx.fillRect(px, py, pw, ph);
    const s = pw / 300; // design units: the phone screen is 300 wide
    const X = v => px + 5 + v * s, Y = v => py + 5 + v * s;
    // logo tile + name
    ctx.fillStyle = INK; rr(ctx, X(24), Y(40), 40 * s, 40 * s, 10 * s); ctx.fill();
    ctx.fillStyle = '#fff'; rr(ctx, X(32), Y(45), 21 * s, 28 * s, 3 * s); ctx.fill();
    ctx.fillStyle = '#C4CAE8'; rr(ctx, X(36), Y(51), 12 * s, 2.4 * s, 1.2 * s); ctx.fill(); rr(ctx, X(36), Y(56), 9 * s, 2.4 * s, 1.2 * s); ctx.fill();
    ctx.fillStyle = SAF; ctx.beginPath(); ctx.arc(X(54), Y(69), 8 * s, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(X(50.5), Y(69)); ctx.lineTo(X(53), Y(71.5)); ctx.lineTo(X(57.5), Y(66.5)); ctx.stroke();
    ctx.fillStyle = INK; ctx.font = `800 ${19 * s}px Onest, sans-serif`; ctx.fillText('PaperSetu', X(74), Y(67));
    // heading + sub
    ctx.font = `700 ${24 * s}px Onest, sans-serif`; ctx.fillText('Sign in', X(24), Y(118));
    ctx.fillStyle = MUTED; ctx.font = `${12.5 * s}px Onest, sans-serif`;
    ['Your papers, questions and school details', 'are saved to your account and stay the', 'same on every phone.'].forEach((l, i) => ctx.fillText(l, X(24), Y(140 + i * 17)));
    // Google button
    const bw = 252;
    ctx.fillStyle = '#fff'; rr(ctx, X(24), Y(200), bw * s, 46 * s, 12 * s); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 1.5 * s; ctx.stroke();
    [['#4285F4', 0], ['#34A853', 1.6], ['#FBBC05', 3.2], ['#EA4335', 4.7]].forEach(([c, a]) => { ctx.strokeStyle = c; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.arc(X(70), Y(223), 7 * s, a, a + 1.5); ctx.stroke(); });
    ctx.fillStyle = INK; ctx.font = `700 ${13.5 * s}px Onest, sans-serif`; ctx.fillText('Continue with Google', X(88), Y(228));
    // "or" divider
    ctx.strokeStyle = LINE; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(X(24), Y(270)); ctx.lineTo(X(136), Y(270)); ctx.moveTo(X(164), Y(270)); ctx.lineTo(X(276), Y(270)); ctx.stroke();
    ctx.fillStyle = MUTED; ctx.font = `${12 * s}px Onest, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('or', X(150), Y(274)); ctx.textAlign = 'left';
    // fields, typed in a loop
    const cyc = t % 9, email = 'teacher@school.in', typed = email.slice(0, Math.max(0, Math.min(email.length, Math.floor((cyc - .4) * 9)))), dots = Math.max(0, Math.min(8, Math.floor((cyc - 2.6) * 8)));
    const field = (label, y, val, active) => {
      ctx.fillStyle = INK; ctx.font = `700 ${13 * s}px Onest, sans-serif`; ctx.fillText(label, X(24), Y(y));
      ctx.fillStyle = '#fff'; rr(ctx, X(24), Y(y + 8), bw * s, 44 * s, 11 * s); ctx.fill();
      ctx.strokeStyle = active ? INK2 : LINE; ctx.lineWidth = (active ? 2 : 1.5) * s; ctx.stroke();
      ctx.fillStyle = '#1F2433'; ctx.font = `${14 * s}px Onest, sans-serif`; ctx.fillText(val, X(38), Y(y + 35));
      if (active && Math.sin(t * 8) > 0) { const cw = ctx.measureText(val).width; ctx.fillStyle = INK2; ctx.fillRect(X(39) + cw, Y(y + 22), 1.5 * s, 17 * s); }
    };
    field('Email', 302, typed, cyc < 2.6);
    field('Password', 376, '•'.repeat(dots), cyc >= 2.6 && cyc < 3.8);
    ctx.fillStyle = INK2; ctx.font = `700 ${12.5 * s}px Onest, sans-serif`; ctx.textAlign = 'right'; ctx.fillText('Forgot password?', X(276), Y(452)); ctx.textAlign = 'left';
    // primary button, pressed around 4.2s
    const press = cyc > 4 && cyc < 4.5;
    ctx.save(); if (!press) { ctx.shadowColor = '#ee7f224d'; ctx.shadowBlur = 12 * s; ctx.shadowOffsetY = 4 * s; }
    ctx.fillStyle = press ? '#C9620F' : SAF; rr(ctx, X(24), Y(470), bw * s, 48 * s, 12 * s); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = `700 ${15 * s}px Onest, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(cyc > 4.5 ? 'Signed in ✓' : 'Sign in', X(150), Y(499));
    ctx.textAlign = 'left';
    ctx.font = `${12.5 * s}px Onest, sans-serif`; const a1 = ctx.measureText('New to PaperSetu? ').width;
    ctx.font = `700 ${12.5 * s}px Onest, sans-serif`; const a2 = ctx.measureText('Create account').width;
    const ax = X(150) - (a1 + a2) / 2;
    ctx.fillStyle = MUTED; ctx.font = `${12.5 * s}px Onest, sans-serif`; ctx.fillText('New to PaperSetu? ', ax, Y(550));
    ctx.fillStyle = INK2; ctx.font = `700 ${12.5 * s}px Onest, sans-serif`; ctx.fillText('Create account', ax + a1, Y(550));
    ctx.restore();
    // ---- a finished paper on the right
    const qw = Math.min(w * .44, h * .78 / 1.3), qh = qw * 1.3, qx = px + pw + (w - px - pw - qw) / 2, qy = (h - qh) / 2 + Math.sin(t * .6 + 1) * 3;
    ctx.save(); ctx.translate(qx + qw / 2, qy + qh / 2); ctx.rotate(.035); ctx.translate(-qx - qw / 2, -qy - qh / 2);
    ctx.shadowColor = '#000a'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#fffdf8'; rr(ctx, qx, qy, qw, qh, 4); ctx.fill(); ctx.shadowColor = 'transparent';
    const pf = Math.max(7, qw * .038);
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.font = `700 ${pf * 1.1}px Onest, sans-serif`; ctx.fillText('Half-Yearly Examination', qx + qw / 2, qy + qh * .08);
    ctx.font = `${pf * .82}px Onest, sans-serif`; ctx.fillStyle = MUTED; ctx.fillText('Class 8 · Science · Set A', qx + qw / 2, qy + qh * .08 + pf * 1.5); ctx.textAlign = 'left';
    ctx.strokeStyle = '#1B255933'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(qx + qw * .08, qy + qh * .16); ctx.lineTo(qx + qw * .92, qy + qh * .16); ctx.stroke();
    let y = qy + qh * .22;
    for (let q = 0; q < 7; q++) {
      if (q === 0 || q === 4) { ctx.fillStyle = INK; ctx.font = `700 ${pf * .8}px Onest, sans-serif`; ctx.fillText(q ? 'Section B' : 'Section A', qx + qw * .08, y); y += pf * 1.5; }
      ctx.fillStyle = INK; ctx.font = `${pf * .78}px Onest, sans-serif`; ctx.fillText(`Q${q + 1}.`, qx + qw * .08, y);
      ctx.fillStyle = '#1B255940'; rr(ctx, qx + qw * .19, y - pf * .58, qw * (.5 + ((q * 37) % 25) / 100), pf * .5, 2); ctx.fill();
      y += pf * 1.55;
    }
    ctx.fillStyle = SAF; rr(ctx, qx + qw * .62, qy + qh - pf * 3, qw * .3, pf * 1.9, pf); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `700 ${pf * .8}px Onest, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('PDF · 3 sets', qx + qw * .77, qy + qh - pf * 1.75); ctx.textAlign = 'left';
    ctx.restore();
  },
  /* PrepWise: live voice interview with an AI agent */
  interview(ctx, w, h, t) {
    ctx.fillStyle = '#0e0b16'; ctx.fillRect(0, 0, w, h);
    const fs = Math.max(9, w * .021), tw = w * .42, th = h * .5, ty = h * .1;
    [[w * .05, 'AI Interviewer', '#c7b3ff', true], [w * .53, 'You', WARM, false]].forEach(([x, name, c, ai], k) => {
      ctx.fillStyle = '#1a1626'; rr(ctx, x, ty, tw, th, 16); ctx.fill(); ctx.strokeStyle = '#ffffff12'; ctx.stroke();
      const cx = x + tw / 2, cy = ty + th * .45, r = th * .18;
      const speaking = (Math.floor(t / 2.5) % 2) === k;
      if (speaking) for (let i = 0; i < 3; i++) { const p = ((t * .9 + i / 3) % 1); ctx.strokeStyle = c; ctx.globalAlpha = (1 - p) * .6; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r + p * r * 1.2, 0, 7); ctx.stroke(); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
      ctx.fillStyle = '#120e1c'; ctx.font = `600 ${r * .8}px Onest, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(ai ? 'AI' : 'K', cx, cy + r * .28);
      ctx.fillStyle = '#e8e3f5'; ctx.font = `500 ${fs}px Onest, sans-serif`; ctx.fillText(name, cx, ty + th - fs * 1.4); ctx.textAlign = 'left';
    });
    // waveform
    const wy = h * .7, bars = 48;
    for (let i = 0; i < bars; i++) {
      const x = w * .05 + i * (w * .9 / bars), a = Math.abs(Math.sin(i * .5 + t * 6) * Math.sin(i * .13 + t * 1.3));
      ctx.fillStyle = i / bars < ((t * .2) % 1) ? '#c7b3ff' : '#c7b3ff44'; rr(ctx, x, wy - a * h * .05, w * .9 / bars - 3, a * h * .1 + 2, 2); ctx.fill();
    }
    // transcript line
    const qs = ['Tell me about a project you are proud of.', 'How did you keep game moves fair in Meetly?', 'What would you improve with more time?'];
    const q = qs[Math.floor(t / 5) % qs.length], chars = Math.min(q.length, Math.floor((t % 5) * 22));
    ctx.fillStyle = '#1a1626'; rr(ctx, w * .05, h * .8, w * .9, h * .12, 10); ctx.fill();
    ctx.fillStyle = '#a99fc2'; ctx.font = `${fs * .8}px Geist Mono, monospace`; ctx.fillText('AI ›', w * .05 + 14, h * .8 + h * .075);
    ctx.fillStyle = '#f2eefc'; ctx.font = `${fs * .95}px Onest, sans-serif`; ctx.fillText(q.slice(0, chars), w * .05 + 14 + fs * 2.6, h * .8 + h * .075);
  },
  /* ConstiTUT: the real home page in a browser window, scrolling top to bottom */
  constitut(ctx, w, h, t) {
    ctx.fillStyle = '#10131c'; ctx.fillRect(0, 0, w, h);
    glow(ctx, w * .8, h * .1, w * .45, '#ff9a3c22'); glow(ctx, w * .15, h * .9, w * .4, '#5e80f01c');
    const m = Math.max(10, w * .045), bx = m, by = m * .9, bw = w - m * 2, bh = h - m * 1.8, bar = Math.max(22, h * .075);
    ctx.save(); ctx.shadowColor = '#00000080'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#1d212c'; rr(ctx, bx, by, bw, bh, 12); ctx.fill(); ctx.restore();
    // window bar: traffic lights + address
    [['#ff5f57', 0], ['#febc2e', 1], ['#28c840', 2]].forEach(([c, i]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bx + 14 + i * 13, by + bar / 2, 4, 0, 7); ctx.fill(); });
    const ux = bx + 62, uw = Math.min(bw - 80, 300);
    ctx.fillStyle = '#2a2f3c'; rr(ctx, ux, by + bar * .22, uw, bar * .56, bar * .28); ctx.fill();
    ctx.fillStyle = '#9aa1b5'; ctx.font = `${Math.max(9, bar * .36)}px Geist Mono, monospace`; ctx.textBaseline = 'middle';
    ctx.fillText('constitut · home', ux + 12, by + bar / 2 + 1); ctx.textBaseline = 'alphabetic';
    // page
    const px = bx + 1, py = by + bar, pw = bw - 2, ph = bh - bar - 1;
    ctx.save(); rr(ctx, px, py, pw, ph, 0); ctx.clip();
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(px, py, pw, ph);
    const img = ctImg();
    if (img.complete && img.naturalWidth) {
      const ih = img.naturalHeight * pw / img.naturalWidth, travel = Math.max(0, ih - ph);
      // top to bottom only: hold at the top, scroll down slowly, hold at the bottom, then fade back to the top
      const cyc = 12.2, k = (((t - 9) % cyc) + cyc) % cyc, // mount() adds the name length (9) to t; start at the top
        ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
      const f = k < 2.5 ? 0 : k < 9 ? ease((k - 2.5) / 6.5) : 1;
      const fade = k > 11 ? (k - 11) / 1.2 : 0;
      ctx.drawImage(img, px, py - travel * f, pw, ih);
      if (fade > 0) { ctx.globalAlpha = fade; ctx.drawImage(img, px, py, pw, ih); ctx.globalAlpha = 1; }
      // scrollbar
      const sh = Math.max(20, ph * ph / ih);
      ctx.fillStyle = '#00000033'; rr(ctx, px + pw - 6, py + 3 + (ph - sh - 6) * f * (1 - fade), 3, sh, 2); ctx.fill();
    }
    ctx.restore();
  },
  /* RDIS LMS: API code */
  api(ctx, w, h, t) { drawers.code(ctx, w, h, t, apiLines, 'gamification.ts'); },
};
const apiLines = [
  [['quiz', COOL], ['.post', SIL], ['(', SIL], ["'/:id/submit'", '#5ee69a'], [', ', SIL], ['auth', WARM], [', ', SIL], ['async', SIL], [' (req, res) => {', SIL]],
  [['  const ', SIL], ['score', WARM], [' = await ', SIL], ['grade', COOL], ['(req.body)', SIL]],
  [['  const ', SIL], ['xp', WARM], [' = ', SIL], ['score', WARM], [' * ', SIL], ['10', PEARL]],
  [['  await ', SIL], ['awardXP', COOL], ['(req.user.id, ', SIL], ['xp', WARM], [')', SIL]],
  [['  await ', SIL], ['updateStreak', COOL], ['(req.user.id)', SIL]],
  [['  const ', SIL], ['badges', WARM], [' = await ', SIL], ['checkBadges', COOL], ['(req.user.id)', SIL]],
  [['  res', SIL], ['.json', COOL], ['({ score, xp, badges })', SIL]],
  [['})', SIL]],
  [['', SIL]],
  [['// ', '#666'], ['200 OK · +80 XP · streak 12 🔥', '#5ee69a']],
];


function mount(opts = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const list = [...document.querySelectorAll('canvas[data-draw]')].map(cv => ({ cv, ctx: cv.getContext('2d'), fn: drawers[cv.dataset.draw], vis: false }));
  function size() { const d = Math.min(devicePixelRatio, document.documentElement.classList.contains('lite') ? 1.5 : 2); list.forEach(p => { const r = p.cv.getBoundingClientRect(); if (!r.width) return; p.w = r.width; p.h = r.height; p.cv.width = r.width * d; p.cv.height = r.height * d; p.ctx.setTransform(d, 0, 0, d, 0, 0); }); }
  addEventListener('resize', size); size();
  const io = new IntersectionObserver(es => es.forEach(e => { const p = list.find(p => p.cv === e.target); if (p) { p.vis = e.isIntersecting; if (p.vis && !p.w) size(); } }), { rootMargin: '100px' });
  list.forEach(p => io.observe(p.cv));
  const state = { paused: reduce, time: 0, size };
  let last = performance.now();
  // Lite (phones): draw at 30 fps and hold the current frame while the page is being scrolled,
  // so scrolling gets the whole frame budget. Drawing resumes ~150 ms after scrolling stops.
  const lite = document.documentElement.classList.contains('lite');
  let scrolling = 0;
  if (lite) addEventListener('scroll', () => { scrolling = performance.now(); }, { passive: true });
  (function loop(now) {
    requestAnimationFrame(loop);
    if (lite && (now - last < 30 || now - scrolling < 150)) return;
    const dt = Math.min((now - last) / 1000, .05) || 0; last = now;
    if (!state.paused) state.time += dt;
    for (const p of list) {
      if (!p.vis || !p.w || !p.fn) continue;
      if (p.cv.offsetParent === null) continue;
      if (opts.skip && opts.skip(p.cv)) continue;
      p.fn(p.ctx, p.w, p.h, state.time + p.cv.dataset.draw.length);
    }
  })(last);
  if (opts.pauseButton) {
    opts.pauseButton.setAttribute('aria-pressed', state.paused);
    opts.pauseButton.addEventListener('click', () => { state.paused = !state.paused; opts.pauseButton.setAttribute('aria-pressed', state.paused); });
  }
  return state;
}
window.Previews = { drawers, mount };
})();
