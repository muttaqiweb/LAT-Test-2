/* questions.js — question bank loading, validation, import */
LAT.Q = (() => {
  const SUBJECTS = ['English', 'General Knowledge', 'Pakistan Studies', 'Islamic Studies', 'Urdu', 'Mathematics'];
  const QUOTA = { 'English': 20, 'General Knowledge': 20, 'Pakistan Studies': 10, 'Islamic Studies': 10, 'Urdu': 10, 'Mathematics': 5 };
  const SOURCES = ['Verified Past Paper', 'Instagram', 'LAT-Style Practice'];
  const S = LAT.Store, norm = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
  let base = [], loadError = null, cache = null;
  const imported = () => S.get('imported', []), meta = () => S.get('qmeta', { flag: [], hide: [] });
  function validate(q) {
    const p = [];
    if (!q || !q.question || q.question.trim().length < 8) p.push('question too short');
    if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some(o => !String(o).trim())) p.push('needs exactly 4 non-empty options');
    else if (new Set(q.options.map(norm)).size !== 4) p.push('duplicate options');
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) p.push('exactly one correct answer (A–D) required');
    if (!SUBJECTS.includes(q.subject)) p.push('unknown subject');
    if (!SOURCES.includes(q.source)) p.push('unknown source');
    if (q.source === 'Verified Past Paper' && !q.year) p.push('verified paper needs a year');
    return p;
  }
  const all = () => cache || (cache = (() => { const m = meta(); return base.concat(imported()).filter(q => !m.hide.includes(q.id)).map(q => Object.assign({}, q, { flag: m.flag.includes(q.id) })); })());
  const usable = q => !q.flag && validate(q).length === 0;
  const coverage = () => { const c = {}; SUBJECTS.forEach(s => c[s] = all().filter(q => q.subject === s && usable(q)).length); return c; };
  const ready = () => { const c = coverage(); return SUBJECTS.every(s => c[s] >= QUOTA[s]); };
  const refresh = () => { cache = null; };
  async function load() {
    try { const r = await fetch('data/questions.json'); if (!r.ok) throw new Error('HTTP ' + r.status); base = await r.json(); loadError = null; }
    catch (e) { base = []; loadError = 'Could not load data/questions.json (' + e.message + '). Open the project with VS Code Live Server — opening index.html directly via file:// blocks loading.'; }
    refresh(); return !loadError;
  }
  function parseCSV(t) {
    const r = []; let row = [], f = '', q = false;
    for (let i = 0; i < t.length; i++) { const c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); f = ''; if (row.some(x => x.trim())) r.push(row); row = []; }
      else f += c; }
    row.push(f); if (row.some(x => x.trim())) r.push(row); return r;
  }
  function toQ(r) {
    const opts = r.options || [r.option_a, r.option_b, r.option_c, r.option_d];
    let c = typeof r.correct === 'number' ? r.correct : 'ABCD'.indexOf(String(r.correct_answer || r.answer || '').trim().toUpperCase().charAt(0));
    const src = SOURCES.find(x => norm(x) === norm(r.source || '')) || 'LAT-Style Practice';
    const sub = SUBJECTS.find(x => norm(x) === norm(r.subject || '')) || r.subject;
    return { id: String(r.id || '').trim() || 'IMP-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), subject: sub, topic: r.topic || 'General', difficulty: r.difficulty || 'Medium',
      question: String(r.question || '').trim(), options: opts.map(o => String(o == null ? '' : o).trim()), correct: c, explanation: r.explanation || '', source: src, year: src === 'Verified Past Paper' ? (String(r.year || '').trim() || null) : null };
  }
  function importText(text) {
    text = text.trim(); const n = { added: 0, duplicates: 0, invalid: 0 }; let recs;
    try {
      if (text[0] === '[' || text[0] === '{') { recs = JSON.parse(text); if (!Array.isArray(recs)) recs = [recs]; }
      else { const rows = parseCSV(text), h = rows[0].map(x => x.trim().toLowerCase()); recs = rows.slice(1).map(r => Object.fromEntries(h.map((k, i) => [k, r[i]]))); }
    } catch (e) { return { error: 'Could not parse input as JSON or CSV.' }; }
    const list = imported(), seen = new Set(base.concat(list).map(q => norm(q.question))), ids = new Set(base.concat(list).map(q => q.id));
    recs.forEach(r => { const q = toQ(r);
      if (validate(q).length) { n.invalid++; return; }
      if (seen.has(norm(q.question)) || ids.has(q.id)) { n.duplicates++; return; }
      seen.add(norm(q.question)); ids.add(q.id); list.push(q); n.added++; });
    S.set('imported', list); refresh(); return n;
  }
  function setFlag(id) { const m = meta(); m.flag = m.flag.includes(id) ? m.flag.filter(x => x !== id) : m.flag.concat(id); S.set('qmeta', m); refresh(); }
  function hide(id) { const m = meta(); if (!m.hide.includes(id)) m.hide.push(id); S.set('qmeta', m); refresh(); }
  function restoreAll() { S.set('qmeta', { flag: [], hide: [] }); refresh(); }
  return { SUBJECTS, QUOTA, SOURCES, load, all, usable, validate, coverage, ready, importText, setFlag, hide, restoreAll, refresh, setBase: b => { base = b; refresh(); }, error: () => loadError };
})();
