/* progress.js — attempts, weak-question priority, statistics, charts */
LAT.Progress = (() => {
  const S = LAT.Store, { pc, esc } = LAT.U, SUB = () => LAT.Q.SUBJECTS;
  // Priority: wrong -> 3 (High, forced into next 3 tests); right once -> 2 (Medium); right twice in a row -> 0 (Normal)
  function record(rec) {
    const st = S.get('qstats', {});
    rec.qs.forEach(q => { if (q.a < 0) return; const s = st[q.id] = st[q.id] || { pri: 0, ok: 0, bad: 0, sk: 0, need: 0 };
      if (q.a === q.correct) { s.ok++; s.sk++; if (s.pri > 0) { s.pri = s.sk >= 2 ? 0 : 2; if (s.pri === 0) s.need = 0; } }
      else { s.bad++; s.sk = 0; s.pri = 3; s.need = 3; } });
    S.set('qstats', st);
    const h = S.get('history', []); h.push(rec); S.set('history', h.slice(-100));
  }
  function stats() {
    const h = S.get('history', []), sb = {}; let c = 0, w = 0, u = 0;
    h.forEach(x => { c += x.correct; w += x.wrong; u += x.un; Object.entries(x.subj).forEach(([k, v]) => { const a = sb[k] = sb[k] || { c: 0, t: 0 }; a.c += v.c; a.t += v.t; }); });
    const full = h.filter(x => x.mode === 'Full Mock');
    return { h, n: h.length, last: h.length ? h[h.length - 1] : null, best: h.length ? Math.max(...h.map(x => x.correct)) : null, avg: h.length ? Math.round(h.reduce((a, x) => a + x.correct, 0) / h.length * 10) / 10 : null, acc: pc(c, c + w), attempted: c + w, c, w, u, sb, full };
  }
  const weakList = () => { const st = S.get('qstats', {}); return LAT.Q.all().filter(q => st[q.id] && st[q.id].pri > 0).sort((a, b) => st[b.id].pri - st[a.id].pri); };
  const priLabel = p => p >= 3 ? 'High' : p === 2 ? 'Medium' : 'Normal';
  function subjectBars(sb) { return SUB().map(s => { const v = sb[s] || { c: 0, t: 0 }, p = pc(v.c, v.t); return `<div class="sbar"><div class="row"><span>${s}</span><span class="muted">${v.t ? p + '%' : 'no data'}</span></div><div class="bar"><i style="width:${p}%"></i></div></div>`; }).join(''); }
  function trend(h) {
    if (!h.length) return '<p class="muted">Complete a test to see your score trend.</p>';
    const d = h.slice(-12), w = Math.max(320, d.length * 56), all = S.get('history', []);
    return `<div class="scroll"><svg class="chart" viewBox="0 0 ${w} 180" style="min-width:${w}px">${d.map((x, i) => { const p = pc(x.correct, x.total), y = 20 + 120 * (1 - p / 100);
      return `<rect x="${i * 56 + 10}" y="${y}" width="36" height="${140 - y}" rx="4" class="barfill"/><text x="${i * 56 + 28}" y="${y - 4}" text-anchor="middle" class="ct">${x.correct}/${x.total}</text><text x="${i * 56 + 28}" y="158" text-anchor="middle" class="cm">Test ${all.indexOf(x) + 1}</text>`; }).join('')}<line x1="0" y1="140" x2="${w}" y2="140" class="axis"/></svg></div>`;
  }
  function topics(sel) {
    const st = S.get('qstats', {}), t = {};
    LAT.Q.all().forEach(q => { const s = st[q.id]; if (s && s.ok + s.bad) { const k = q.subject + ' › ' + q.topic; t[k] = t[k] || [0, 0]; t[k][0] += s.ok; t[k][1] += s.ok + s.bad; } });
    const e = Object.entries(t).filter(([k, v]) => sel === 'strong' ? pc(v[0], v[1]) >= 70 : pc(v[0], v[1]) < 60);
    return e.length ? e.map(([k, v]) => `<span class="tag ${sel === 'strong' ? 'ok' : 'warn'}">${esc(k)} ${pc(v[0], v[1])}%</span>`).join(' ') : '<span class="muted">Not enough data yet.</span>';
  }
  const reset = () => { S.del('history'); S.del('qstats'); S.del('active'); };
  return { record, stats, weakList, priLabel, subjectBars, trend, topics, reset };
})();
