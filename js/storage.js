/* storage.js — LocalStorage persistence + shared utilities */
window.LAT = window.LAT || {};
LAT.Store = (() => {
  const P = 'LAT-Prep:'; const mem = {};
  const get = (k, d) => { try { const v = localStorage.getItem(P + k); return v == null ? d : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : d; } };
  const set = (k, v) => { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) { mem[k] = v; } };
  const del = k => { try { localStorage.removeItem(P + k); } catch (e) {} delete mem[k]; };
  return { get, set, del };
})();
LAT.U = {
  esc: s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  shuf(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  fmt: s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0'),
  pc: (a, b) => b ? Math.round(a * 100 / b) : 0,
  L: i => 'ABCD'[i]
};
