/* test-engine.js — test generation, session handling, scoring */
LAT.Engine = (() => {
  const S = LAT.Store, Q = LAT.Q, { shuf, pc } = LAT.U;
  function pick(subject, n, stats) {
    const pool = Q.all().filter(q => q.subject === subject && Q.usable(q));
    const st = id => stats[id] || { pri: 0, need: 0 };
    const forced = shuf(pool.filter(q => st(q.id).need > 0)).sort((a, b) => st(b.id).pri - st(a.id).pri).slice(0, Math.ceil(n * 0.5));
    const fid = new Set(forced.map(q => q.id));
    const rest = pool.filter(q => !fid.has(q.id)).map(q => [q, (stats[q.id] ? 1 : 0) + Math.random() * 0.8 - (st(q.id).pri > 0 ? 0.6 : 0)]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
    return forced.concat(rest).slice(0, n);
  }
  function generateFull() {
    const stats = S.get('qstats', {}); let list = [];
    for (const s of Q.SUBJECTS) { const r = pick(s, Q.QUOTA[s], stats); if (r.length < Q.QUOTA[s]) return { error: `Not enough usable ${s} questions (${r.length}/${Q.QUOTA[s]}).` }; list = list.concat(r); }
    if (new Set(list.map(q => q.id)).size !== 75) return { error: 'Duplicate questions selected.' };
    list.forEach(q => { const t = stats[q.id]; if (t && t.need > 0) t.need--; }); S.set('qstats', stats);
    return { list: shuf(list) };
  }
  const snap = q => { const ix = shuf([0, 1, 2, 3]); return { id: q.id, subject: q.subject, topic: q.topic, question: q.question, options: ix.map(i => q.options[i]), correct: ix.indexOf(q.correct), explanation: q.explanation, source: q.source, year: q.source === 'Verified Past Paper' ? q.year : null }; };
  function start(mode, title, list, minutes) {
    if (!list.length) return { error: 'No usable questions available for this mode.' };
    const dur = Math.ceil(minutes * 60), qs = list.map(snap);
    S.set('active', { id: Date.now(), mode, title, qs, ans: qs.map(() => -1), mk: qs.map(() => 0), i: 0, st: Date.now(), end: Date.now() + dur * 1000, dur });
    return { ok: true };
  }
  const startFull = () => { const g = generateFull(); return g.error ? g : start('Full Mock', 'Full Mock Test', g.list, 100); };
  const practice = (title, list) => start('Practice', title, list, Math.max(1, Math.ceil(list.length * 100 / 75)));
  const active = () => S.get('active', null);
  const patch = f => { const t = active(); if (t) { f(t); S.set('active', t); } return t; };
  const answer = i => patch(t => { t.ans[t.i] = t.ans[t.i] === i ? -1 : i; });
  const mark = () => patch(t => { t.mk[t.i] ^= 1; });
  const go = i => patch(t => { t.i = Math.max(0, Math.min(t.qs.length - 1, i)); });
  const remaining = () => { const t = active(); return t ? Math.max(0, Math.round((t.end - Date.now()) / 1000)) : 0; };
  function submit() {
    const t = active(); if (!t) return null;
    const rec = { id: t.id, mode: t.mode, title: t.title, date: Date.now(), time: Math.min(t.dur, Math.round((Date.now() - t.st) / 1000)), total: t.qs.length, correct: 0, wrong: 0, un: 0, subj: {}, qs: [] };
    t.qs.forEach((q, i) => { const a = t.ans[i], x = rec.subj[q.subject] = rec.subj[q.subject] || { c: 0, w: 0, u: 0, t: 0 }; x.t++;
      if (a < 0) { rec.un++; x.u++; } else if (a === q.correct) { rec.correct++; x.c++; } else { rec.wrong++; x.w++; }
      rec.qs.push(Object.assign({}, q, { a, marked: !!t.mk[i] })); });
    LAT.Progress.record(rec); S.del('active'); return rec;
  }
  return { generateFull, startFull, practice, active, answer, mark, go, remaining, submit, pick };
})();
