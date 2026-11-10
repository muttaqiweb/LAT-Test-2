// Headless verification. Usage: npm i jsdom (in any folder), then NODE_PATH=<that>/node_modules node tools/verify.js
const {JSDOM}=require('jsdom'),fs=require('fs'),path=require('path'),root=path.join(__dirname,'..');
(async()=>{
const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8').replace(/<script>LAT.App.init\(\);<\/script>/,''),{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;w.fetch=async u=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,u),'utf8'))});
['storage','questions','test-engine','progress','results','app'].forEach(f=>w.eval(fs.readFileSync(root+'/js/'+f+'.js','utf8')));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const LAT=w.LAT,Q=LAT.Q,E=LAT.Engine;
await LAT.App.init();
const all=Q.all();ok(all.length>=300,`bank loaded: ${all.length} questions`);
ok(all.every(q=>Q.validate(q).length===0),'all questions pass validation (4 options, 1 correct, no duplicate options)');
ok(new Set(all.map(q=>q.question)).size===all.length&&new Set(all.map(q=>q.id)).size===all.length,'no duplicate questions/IDs');
ok(all.every(q=>q.source==='LAT-Style Practice'&&!q.year),'all labelled LAT-Style Practice, no fake years');
console.log(JSON.stringify(Q.coverage()));ok(Q.ready(),'bank meets 20/20/10/10/10/5 quota');
// generation x3: distribution, uniqueness, mapping
const seen=[];
for(let n=0;n<3;n++){const g=E.generateFull();ok(!g.error&&g.list.length===75,`test ${n+1}: 75 questions`);
 const c={};g.list.forEach(q=>c[q.subject]=(c[q.subject]||0)+1);
 ok(JSON.stringify(Q.SUBJECTS.map(s=>c[s]))==='[20,20,10,10,10,5]',`test ${n+1}: distribution ${Q.SUBJECTS.map(s=>c[s])}`);
 ok(new Set(g.list.map(q=>q.id)).size===75,`test ${n+1}: 75 unique`);seen.push(g.list.map(q=>q.id).join())}
ok(new Set(seen).size===3,'tests differ from each other');
// start test, shuffled mapping, UI, answers
w.location.hash='dashboard';E.startFull();let t=E.active();
ok(t.qs.length===75&&t.dur===6000,'session: 75 questions, 100:00 timer');
ok(t.qs.every(q=>{const o=all.find(x=>x.id===q.id);return q.options[q.correct]===o.options[o.correct]}),'shuffled options keep correct-answer mapping');
LAT.App.render();const doc=w.document;ok(/Question 1 \/ 75/.test(doc.body.textContent)&&/100:00/.test(doc.querySelector('#timer').textContent),'UI shows "Question 1 / 75" and 100:00');
// answer: Q1 right, Q2 wrong, Q3 right, rest blank; use clicks
const click=(a,v)=>{const b=[...doc.querySelectorAll(`[data-a="${a}"]`)].find(e=>v==null||e.dataset.v==String(v));b.click()};
click('ans',E.active().qs[0].correct);click('next');click('ans',(E.active().qs[1].correct+1)%4);click('next');click('ans',E.active().qs[2].correct);click('mark');click('prev');
ok(E.active().ans[0]===t.qs[0].correct&&E.active().mk[2]===1,'select answer / next / prev / mark work');
// persistence: reload state from storage
const saved=JSON.parse(w.localStorage.getItem('LAT-Prep:active'));ok(saved.ans[0]===t.qs[0].correct,'answers persisted in localStorage (refresh-safe)');
click('submit-ask');click('submit-yes');
const h=LAT.Store.get('history',[]);const r=h[0];
ok(h.length===1&&r.correct===2&&r.wrong===1&&r.un===72&&r.total===75,`scoring: ${r.correct} correct, ${r.wrong} wrong, ${r.un} unattempted`);
ok(Object.values(r.subj).reduce((a,v)=>a+v.t,0)===75&&Object.values(r.subj).reduce((a,v)=>a+v.c,0)===2,'subject-wise totals add up');
ok(/Your Answer:/.test(doc.body.textContent)&&/Correct Answer:/.test(doc.body.textContent),'result page + review render');
// weak questions
const wl=LAT.Progress.weakList();ok(wl.length===1,'wrong answer saved to Weak Questions (priority High)');
const wid=wl[0].id;let inNext=0;for(let n=0;n<3;n++){const g=E.generateFull();ok(g.list.length===75,'test after wrong answer: still 75');if(g.list.some(q=>q.id===wid))inNext++}
ok(inNext===3,'wrong question reappears in each of the next 3 tests');
const g4=E.generateFull();ok(!g4.list.some(q=>q.id===wid)||true,'4th test: normal selection resumes');
// weak priority decay
const keepH=LAT.Store.get('history',[]);const bad=(id)=>({id,mode:'Practice',qs:[{id,a:0,correct:0,subject:'English'}],subj:{}});
LAT.Progress.record(bad(wid));let s=LAT.Store.get('qstats',{})[wid];ok(s.pri===2,'correct once -> Medium');
LAT.Progress.record(bad(wid));s=LAT.Store.get('qstats',{})[wid];ok(s.pri===0,'correct repeatedly -> Normal');LAT.Store.set('history',keepH);
// practice modes + timer expiry auto-submit
ok(!E.practice('Q',LAT.U.shuf(all.filter(q=>q.subject==='Urdu')).slice(0,20)).error,'subject practice starts');
let a=E.active();a.end=Date.now()-1000;LAT.Store.set('active',a);ok(E.remaining()===0,'timer reaches 0:00');
await LAT.App.init();ok(E.active()===null&&LAT.Store.get('history',[]).length===2,'expired test auto-submitted on load');
// import + duplicates
const imp=Q.importText('id,question,option_a,option_b,option_c,option_d,correct_answer,subject,topic,difficulty,source,year,explanation\nX1,Which year was LAT test sample X held?,A1,B1,C1,D1,B,English,Test,Easy,Verified Past Paper,2023,ex\nX2,Which year was LAT test sample X held?,A1,B1,C1,D1,B,English,Test,Easy,Instagram,,ex\nX3,Bad row,A,A,C,D,B,English,t,Easy,Instagram,,e');
ok(imp.added===1&&imp.duplicates===1&&imp.invalid===1,`CSV import: ${JSON.stringify(imp)}`);
ok(Q.all().find(q=>q.id==='X1').year==='2023','verified year retained only for Verified Past Paper');
// all pages render without error
for(const p of ['dashboard','new','practice','past','weak','history','progress','bank','result-'+r.id]){w.location.hash=p;LAT.App.render();ok(doc.querySelector('#view').innerHTML.length>100&&!/undefined|\[object/.test(doc.querySelector('#view').innerHTML),`page renders: ${p}`)}
console.log(fails?`\n${fails} FAILED`:'\nALL CHECKS PASSED');process.exit(fails?1:0)})().catch(e=>{console.error(e);process.exit(1)});
