/* app.js — router, pages, event handling */
LAT.App = (() => {
  const { esc, fmt, pc, L } = LAT.U, Q = LAT.Q, E = LAT.Engine, P = LAT.Progress, S = LAT.Store;
  const NAV = [['dashboard', 'Dashboard'], ['new', 'New Mock Test'], ['practice', 'Subject & Quick Practice'], ['past', 'Past Papers'], ['weak', 'Weak Questions'], ['history', 'Test History'], ['progress', 'Progress Analytics'], ['bank', 'Question Bank']];
  let timer = null, notice = '', confirmSubmit = false, bank = { s: '', src: '', q: '' }, importMsg = '', pending = '';
  const $ = s => document.querySelector(s), view = () => $('#view');
  const setNotice = m => { notice = m; render(); };

  function render() {
    const h = location.hash.slice(1) || 'dashboard', page = h.split('-')[0], arg = h.slice(page.length + 1), t = E.active();
    $('#nav').innerHTML = '<div class="brand"><img src="assets/logo.svg" alt="" width="34" height="34"><span>LAT Prep</span></div>' +
      (t ? `<div class="locked">Test in progress</div>` : NAV.map(([k, l]) => `<a href="#${k}" class="${page === k || (page === 'result' && k === 'history') ? 'on' : ''}">${l}</a>`).join(''));
    document.body.classList.toggle('testing', !!t);
    clearInterval(timer);
    if (t) { view().innerHTML = testView(t); timer = setInterval(tick, 1000); return; }
    const err = Q.error();
    const pages = { dashboard, new: newTest, practice, past, weak, history, progress, bank: bankPage, result: () => resultPage(arg) };
    view().innerHTML = (err ? `<div class="card alert">${esc(err)}</div>` : '') + (notice ? `<div class="card alert">${esc(notice)}</div>` : '') + (pages[page] || dashboard)();
    notice = '';
  }
  function tick() { const r = E.remaining(), el = $('#timer'); if (el) el.textContent = fmt(r); if (r <= 0) finish(); }
  function finish() { const rec = E.submit(); confirmSubmit = false; if (rec) location.hash = 'result-' + rec.id; render(); }

  // ---------- Pages ----------
  function dashboard() {
    const s = P.stats(), l = s.last;
    return `<h1>LAT Preparation</h1>
<div class="card hero"><div><h2>Start New Mock Test</h2><p>75 MCQs | 100 Minutes | 75 Marks</p></div><button class="btn light" data-a="start-full">Start New Mock Test</button></div>
<div class="grid stats"><div class="card stat"><b>${s.best ?? '—'}</b><span>Highest Score</span></div><div class="card stat"><b>${s.avg ?? '—'}</b><span>Average Score</span></div><div class="card stat"><b>${l ? l.correct + '/' + l.total : '—'}</b><span>Latest Score</span></div><div class="card stat"><b>${s.n}</b><span>Tests Completed</span></div><div class="card stat"><b>${s.n ? s.acc + '%' : '—'}</b><span>Overall Accuracy</span></div></div>
<div class="grid two"><div class="card"><h2>Subject-wise Accuracy</h2>${P.subjectBars(s.sb)}</div><div class="card"><h2>Quick Access</h2><div class="quick">${NAV.slice(2).map(([k, l]) => `<a class="btn ghost" href="#${k}">${l}</a>`).join('')}</div><h2 style="margin-top:16px">Weak Areas</h2>${P.topics('weak')}</div></div>
<div class="card"><h2>Recent Tests</h2>${histTable(s.h.slice(-5).reverse())}</div>`;
  }
  const histTable = h => h.length ? `<div class="scroll"><table><tr><th>Date</th><th>Test</th><th>Score</th><th>%</th><th>Time</th><th></th></tr>${h.map(x => `<tr><td>${new Date(x.date).toLocaleString()}</td><td>${esc(x.title)}</td><td>${x.correct}/${x.total}</td><td>${pc(x.correct, x.total)}%</td><td>${fmt(x.time)}</td><td><a href="#result-${x.id}">Review</a></td></tr>`).join('')}</table></div>` : '<p class="muted">No tests completed yet.</p>';
  function newTest() {
    const c = Q.coverage(), ok = Q.ready();
    return `<h1>New Mock Test</h1><div class="card"><p>Exactly <b>75 questions</b>: ${Q.SUBJECTS.map(s => s + ' ' + Q.QUOTA[s]).join(' · ')}. Time: 100 minutes. 1 mark each, no negative marking. Question and option order are shuffled; questions you previously got wrong are mixed in.</p>
<div class="scroll"><table><tr><th>Subject</th><th>Needed</th><th>Usable in bank</th></tr>${Q.SUBJECTS.map(s => `<tr><td>${s}</td><td>${Q.QUOTA[s]}</td><td class="${c[s] >= Q.QUOTA[s] ? 'good' : 'bad'}">${c[s]}</td></tr>`).join('')}</table></div>
${ok ? '' : '<p class="bad">The bank does not yet meet the quota for every subject. Import more questions in the Question Bank.</p>'}
<button class="btn" data-a="start-full" ${ok ? '' : 'disabled'}>Generate &amp; Start Mock Test</button></div>`;
  }
  const practice = () => `<h1>Practice</h1><div class="card"><h2>Subject Practice</h2><p class="muted">Up to 20 random questions from one subject.</p>${Q.SUBJECTS.map(s => `<button class="btn ghost" data-a="prac-subject" data-v="${esc(s)}">${esc(s)}</button>`).join(' ')}</div>
<div class="card"><h2>Quick Practice</h2><button class="btn ghost" data-a="prac-quick" data-v="10">10 Questions</button> <button class="btn ghost" data-a="prac-quick" data-v="20">20 Questions</button> <button class="btn ghost" data-a="prac-quick" data-v="30">Mixed (30)</button></div>
<div class="card"><h2>Weak Questions</h2><button class="btn ghost" data-a="prac-weak">Practice Wrong Questions (${P.weakList().length})</button></div>`;
  function past() {
    const by = {}; Q.all().filter(q => q.source === 'Verified Past Paper' && q.year && Q.usable(q)).forEach(q => (by[q.year] = by[q.year] || []).push(q));
    const ys = Object.keys(by).sort().reverse();
    return `<h1>Past Papers</h1>${ys.length ? ys.map(y => `<div class="card row"><div><b>LAT ${esc(y)}</b><div class="muted">${by[y].length} verified questions</div></div><button class="btn" data-a="prac-year" data-v="${esc(y)}">Practice</button></div>`).join('') : '<div class="card alert">No verified past-paper questions have been added yet. The built-in bank contains only <b>LAT-Style Practice</b> items, which are never labelled as past papers. Import verified questions (CSV/JSON with source “Verified Past Paper” and a year, 2021–2026) in the Question Bank.</div>'}`;
  }
  function weak() {
    const l = P.weakList(), st = S.get('qstats', {});
    return `<h1>Weak Questions</h1><div class="card row"><span>${l.length} question(s) need practice. Wrong → High priority; correct once → Medium; correct repeatedly → Normal.</span><button class="btn" data-a="prac-weak" ${l.length ? '' : 'disabled'}>Practice Wrong Questions</button></div>
${l.map(q => { const s = st[q.id]; return `<div class="card"><div class="row"><span class="tag ${s.pri >= 3 ? 'bad' : 'warn'}">${P.priLabel(s.pri)} priority</span><span class="muted">${esc(q.subject)} · wrong ${s.bad}× · correct ${s.ok}×</span></div><p class="${q.subject === 'Urdu' ? 'urdu' : ''}">${esc(q.question)}</p><p class="muted">Correct answer: ${esc(q.options[q.correct])}</p></div>`; }).join('') || '<p class="muted">No weak questions yet — they appear here after you answer incorrectly.</p>'}`;
  }
  const history = () => `<h1>Test History</h1><div class="card">${histTable(S.get('history', []).slice().reverse())}</div>`;
  function progress() {
    const s = P.stats(); const stat = (b, l) => `<div class="card stat"><b>${b}</b><span>${l}</span></div>`;
    return `<h1>Progress Analytics</h1><div class="grid stats">${stat(s.n, 'Tests completed')}${stat(s.avg ?? '—', 'Average score')}${stat(s.best ?? '—', 'Highest score')}${stat(s.last ? s.last.correct : '—', 'Latest score')}${stat(s.acc + '%', 'Accuracy')}${stat(s.attempted, 'Questions attempted')}${stat(s.c, 'Correct')}${stat(s.w, 'Wrong')}</div>
<div class="card"><h2>Score trend</h2>${P.trend(s.h)}</div><div class="card"><h2>Subject accuracy</h2>${P.subjectBars(s.sb)}</div><div class="card"><h2>Weak topics</h2>${P.topics('weak')}<h2 style="margin-top:14px">Strong topics</h2>${P.topics('strong')}</div>
<div class="card"><h2>Reset</h2><button class="btn danger" data-a="reset">${pending === 'reset' ? 'Click again to confirm' : 'Reset all progress & history'}</button></div>`;
  }
  const resultPage = id => { const r = S.get('history', []).find(x => String(x.id) === id); return r ? LAT.Results.render(r) : '<p>Result not found.</p>'; };
  function bankPage() {
    const all = Q.all(), l = all.filter(q => (!bank.s || q.subject === bank.s) && (!bank.src || q.source === bank.src) && (!bank.q || q.question.toLowerCase().includes(bank.q.toLowerCase()))), c = Q.coverage();
    const sc = {}; Q.SOURCES.forEach(s => sc[s] = all.filter(q => q.source === s).length);
    return `<h1>Question Bank <span class="muted">(${all.length} questions)</span></h1>
<div class="card"><div class="scroll"><table><tr><th>Subject</th><th>Usable</th><th>Needed per mock</th></tr>${Q.SUBJECTS.map(s => `<tr><td>${s}</td><td>${c[s]}</td><td>${Q.QUOTA[s]}</td></tr>`).join('')}</table></div><p class="muted">${Q.SOURCES.map(s => s + ': ' + sc[s]).join(' · ')}</p></div>
<div class="card"><h2>Import questions (CSV or JSON)</h2><p class="muted">CSV columns: id, question, option_a, option_b, option_c, option_d, correct_answer (A–D), subject, topic, difficulty, source, year, explanation. Source: Verified Past Paper, Instagram or LAT-Style Practice. Year is kept only for verified past papers. Duplicates and invalid rows are skipped. Instagram content cannot be fetched automatically — paste your own export here.</p>
<input type="file" id="file" accept=".csv,.json,.txt"><textarea id="paste" rows="5" placeholder="Or paste CSV (with header) / JSON array here"></textarea><button class="btn" data-a="import">Import</button> <span class="muted">${esc(importMsg)}</span></div>
<div class="card"><div class="grid three"><select id="fs"><option value="">All subjects</option>${Q.SUBJECTS.map(s => `<option ${bank.s === s ? 'selected' : ''}>${s}</option>`).join('')}</select><select id="fsrc"><option value="">All sources</option>${Q.SOURCES.map(s => `<option ${bank.src === s ? 'selected' : ''}>${s}</option>`).join('')}</select><input id="fq" placeholder="Search questions" value="${esc(bank.q)}"></div>
<p class="muted">Showing ${Math.min(60, l.length)} of ${l.length}. Flagged questions are excluded from tests.</p>${l.slice(0, 60).map(q => `<div class="brow"><div><span class="tag">${esc(q.id)}</span><span class="tag">${esc(q.subject)}</span><span class="tag">${esc(q.source)}${q.year ? ' ' + esc(q.year) : ''}</span>${q.flag ? '<span class="tag bad">Flagged</span>' : ''}${Q.validate(q).length ? '<span class="tag bad">Invalid</span>' : ''}<div class="${q.subject === 'Urdu' ? 'urdu' : ''}">${esc(q.question)}</div><div class="muted">✔ ${esc(q.options[q.correct])}</div></div><div class="acts"><button class="btn small ghost" data-a="flag" data-v="${esc(q.id)}">${q.flag ? 'Unflag' : 'Flag'}</button> <button class="btn small danger" data-a="del" data-v="${esc(q.id)}">${pending === 'del' + q.id ? 'Confirm?' : 'Delete'}</button></div></div>`).join('')}</div>`;
  }
  function testView(t) {
    const q = t.qs[t.i], n = t.qs.length, urdu = q.subject === 'Urdu' ? 'urdu' : '', answered = t.ans.filter(x => x >= 0).length;
    return `<div class="examtop card"><b>Question ${t.i + 1} / ${n}</b><span class="muted">${esc(q.subject)}</span><span>Time Remaining <b class="timer" id="timer">${fmt(E.remaining())}</b></span></div>
<div class="exam"><div class="card qcard"><p class="qtext ${urdu}">${esc(q.question)}</p>${q.options.map((o, i) => `<button class="opt ${t.ans[t.i] === i ? 'sel' : ''} ${urdu}" data-a="ans" data-v="${i}"><b>${L(i)}</b><span>${esc(o)}</span></button>`).join('')}
<div class="row ctl"><span><button class="btn ghost" data-a="prev" ${t.i ? '' : 'disabled'}>Previous</button> <button class="btn ghost" data-a="next" ${t.i < n - 1 ? '' : 'disabled'}>Next</button></span><button class="btn ghost ${t.mk[t.i] ? 'marked' : ''}" data-a="mark">${t.mk[t.i] ? 'Unmark Review' : 'Mark for Review'}</button></div></div>
<div class="card navcard"><h2>Question Navigator</h2><div class="navgrid">${t.qs.map((x, i) => `<button class="${t.ans[i] >= 0 ? 'ans' : ''} ${t.mk[i] ? 'mk' : ''} ${i === t.i ? 'cur' : ''}" data-a="jump" data-v="${i}">${i + 1}</button>`).join('')}</div>
<p class="legend"><i class="ans"></i>Answered <i class="mk"></i>Marked <i class="cur"></i>Current <i></i>Unanswered</p><p class="muted">Answered ${answered} · Marked ${t.mk.filter(x => x).length} · Unanswered ${n - answered}</p>
${confirmSubmit ? `<p><b>Submit with ${n - answered} unanswered?</b></p><button class="btn danger" data-a="submit-yes">Yes, submit</button> <button class="btn ghost" data-a="submit-no">Cancel</button>` : '<button class="btn danger" data-a="submit-ask">Submit Test</button>'}</div></div>`;
  }

  // ---------- Events ----------
  const startRes = r => { if (r.error) setNotice(r.error); else { location.hash = 'test'; render(); } };
  const usable = () => Q.all().filter(Q.usable);
  const actions = {
    'start-full': () => startRes(E.startFull()),
    'prac-subject': v => startRes(E.practice(v + ' Practice', LAT.U.shuf(usable().filter(q => q.subject === v)).slice(0, 20))),
    'prac-quick': v => startRes(E.practice(v === '30' ? 'Mixed Practice' : 'Quick Practice (' + v + ')', LAT.U.shuf(usable()).slice(0, +v))),
    'prac-weak': () => { const l = P.weakList().filter(Q.usable).slice(0, 30); startRes(l.length ? E.practice('Weak Questions Practice', l) : { error: 'You have no weak questions yet.' }); },
    'prac-year': v => startRes(E.practice('LAT ' + v + ' Practice', LAT.U.shuf(usable().filter(q => q.source === 'Verified Past Paper' && q.year === v)))),
    ans: v => { E.answer(+v); render(); }, prev: () => { E.go(E.active().i - 1); render(); }, next: () => { E.go(E.active().i + 1); render(); },
    jump: v => { E.go(+v); render(); }, mark: () => { E.mark(); render(); },
    'submit-ask': () => { confirmSubmit = true; render(); }, 'submit-no': () => { confirmSubmit = false; render(); }, 'submit-yes': finish,
    import: () => { const r = Q.importText($('#paste').value || ''); importMsg = r.error || `Added ${r.added}, duplicates skipped ${r.duplicates}, invalid skipped ${r.invalid}.`; render(); },
    flag: v => { Q.setFlag(v); render(); },
    del: v => { if (pending !== 'del' + v) { pending = 'del' + v; return render(); } pending = ''; Q.hide(v); render(); },
    reset: () => { if (pending !== 'reset') { pending = 'reset'; return render(); } pending = ''; P.reset(); render(); }
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const a = b.dataset.a; if (!a.startsWith('del') && a !== 'reset') pending = ''; if (actions[a]) actions[a](b.dataset.v); });
  document.addEventListener('change', e => {
    if (e.target.id === 'fs') { bank.s = e.target.value; render(); } else if (e.target.id === 'fsrc') { bank.src = e.target.value; render(); } else if (e.target.id === 'fq') { bank.q = e.target.value; render(); }
    else if (e.target.id === 'file' && e.target.files[0]) { const r = new FileReader(); r.onload = () => { $('#paste').value = r.result; }; r.readAsText(e.target.files[0]); }
  });
  window.addEventListener('hashchange', () => { if (!E.active()) render(); });
  async function init() { await Q.load(); if (E.active() && E.remaining() <= 0) { const r = E.submit(); if (r) location.hash = 'result-' + r.id; } render(); }
  return { init, render };
})();
