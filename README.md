# LAT Preparation – Mock Tests & MCQ Practice

A complete LAT (Law Admission Test) preparation website in plain HTML, CSS and JavaScript. No build step, no API keys, no paid services.

## Run in VS Code (Windows 11)
1. Install the **Live Server** extension (Ritwick Dey) in VS Code.
2. File → Open Folder → select `LAT-Preparation`.
3. Right-click `index.html` → **Open with Live Server**.

> Use Live Server (or any local web server). Opening `index.html` by double-click (`file://`) blocks `fetch()` of `data/questions.json`, and the app will show a message saying so.
> Alternative: in a terminal inside the folder run `python -m http.server 8000` and open http://localhost:8000.

## Exam format
75 MCQs · 100 minutes · 1 mark each · no negative marking.
English 20 · General Knowledge 20 · Pakistan Studies 10 · Islamic Studies 10 · Urdu 10 · Mathematics 5.

## Project structure
```
index.html            page shell
css/                  style, dashboard, test, responsive
js/storage.js         LocalStorage layer + helpers
js/questions.js       loading, validation, CSV/JSON import, duplicate detection
js/test-engine.js     75-question generator, sessions, timer, scoring
js/progress.js        weak-question priority, statistics, charts
js/results.js         result page and answer review
js/app.js             routing, pages, events
data/questions.json   question bank (300 questions)
tools/build-questions.js   regenerates data/questions.json
tools/verify.js            headless test suite (needs `npm i jsdom`)
```

## Question bank and sources
`data/questions.json` holds 300 questions (English 80, General Knowledge 80, Pakistan Studies 40, Islamic Studies 40, Urdu 40, Mathematics 20). **All are labelled "LAT-Style Practice"** — none is claimed to be a real past-paper question. Please review them for your own standards; questions can be flagged (excluded from tests) or deleted in the Question Bank page.

Sources: `Verified Past Paper` · `Instagram` · `LAT-Style Practice`. A year is stored only for Verified Past Paper items. Instagram cannot be fetched automatically, so paste/upload exports in **Question Bank → Import** (CSV or JSON).

CSV header:
`id,question,option_a,option_b,option_c,option_d,correct_answer,subject,topic,difficulty,source,year,explanation`
(`correct_answer` is A–D; `subject` must be one of the six subjects.) JSON may use the same field names or `options` (array of 4) + `correct` (0–3).

## Weak-question repetition
Wrong → High priority and forced into your next 3 full mocks (up to half of each subject's quota, so the 20/20/10/10/10/5 split is never broken). Correct once → Medium. Correct twice in a row → Normal.

## Data storage
Progress, history, in-progress test (answers + deadline), weak-question stats and imported questions live in browser LocalStorage under keys prefixed `LAT-Prep:`. A refresh or browser restart resumes an unfinished test; if time ran out meanwhile, it is submitted automatically.

## Tests
```
npm i jsdom
node tools/verify.js
```
