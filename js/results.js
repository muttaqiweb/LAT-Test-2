/* results.js — result summary and answer review */
LAT.Results = (() => {
  const { esc, fmt, pc, L } = LAT.U;
  function render(r) {
    const att = r.correct + r.wrong, S = Object.entries(r.subj), strong = S.filter(([k, v]) => pc(v.c, v.t) >= 70).map(x => x[0]), weak = S.filter(([k, v]) => pc(v.c, v.t) < 60).map(x => x[0]);
    return `<h1>${esc(r.title)} — Result</h1>
<div class="grid stats"><div class="card stat"><b>${r.correct} / ${r.total}</b><span>Score</span></div><div class="card stat"><b>${pc(r.correct, r.total)}%</b><span>Percentage</span></div><div class="card stat"><b>${r.correct}</b><span>Correct</span></div><div class="card stat"><b>${r.wrong}</b><span>Wrong</span></div><div class="card stat"><b>${r.un}</b><span>Unattempted</span></div><div class="card stat"><b>${fmt(r.time)}</b><span>Time Taken</span></div></div>
<div class="card"><h2>Subject-wise Results</h2><div class="scroll"><table><tr><th>Subject</th><th>Score</th><th>Percentage</th><th></th></tr>${S.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v.c}/${v.t}</td><td>${pc(v.c, v.t)}%</td><td style="width:40%"><div class="bar"><i style="width:${pc(v.c, v.t)}%"></i></div></td></tr>`).join('')}</table></div></div>
<div class="card"><p><b>Accuracy:</b> ${pc(r.correct, att)}% of attempted questions</p><p><b>Strong subjects (≥70%):</b> ${strong.map(esc).join(', ') || '—'}</p><p><b>Weak subjects (&lt;60%):</b> ${weak.map(esc).join(', ') || '—'}</p>
<p><b>Recommended practice:</b> ${weak.length ? weak.map(w => `<button class="btn small" data-a="prac-subject" data-v="${esc(w)}">${esc(w)}</button>`).join(' ') : 'Keep practising mixed questions to maintain your level.'} ${r.wrong ? '<button class="btn small" data-a="prac-weak">Practise wrong questions</button>' : ''}</p></div>
<h2>Answer Review</h2>${r.qs.map((q, i) => { const ok = q.a === q.correct;
  return `<div class="card review ${q.a < 0 ? 'un' : ok ? 'right' : 'wrong'}"><div class="muted">Q${i + 1} · ${esc(q.subject)} · ${esc(q.source)}${q.year ? ' · LAT ' + esc(q.year) : ''}</div><p class="qtext ${q.subject === 'Urdu' ? 'urdu' : ''}">${esc(q.question)}</p>
${q.options.map((o, k) => `<div class="opt static ${k === q.correct ? 'ok' : k === q.a ? 'no' : ''} ${q.subject === 'Urdu' ? 'urdu' : ''}"><b>${L(k)}.</b> ${esc(o)}</div>`).join('')}
<p><b>Your Answer:</b> ${q.a < 0 ? 'Not attempted' : L(q.a)} &nbsp; <b>Correct Answer:</b> ${L(q.correct)}</p><p class="muted">Explanation: ${esc(q.explanation || 'Not available.')}</p></div>`; }).join('')}`;
  }
  return { render };
})();
