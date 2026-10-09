/* 安安的數字城堡與守護怪獸大冒險 — 遊戲引擎（加法路線 1–20、減法路線 101–116） */
(function(){
"use strict";
const D = window.GAME_DATA, CFG = window.GAME_CONFIG || {}, MON = window.MONSTERS;
const KEY = "am_annie_v1", KID = "annie", NAME = "安安";
const app = document.getElementById("app");
const LV = {}; D.levels.forEach(l => LV[l.n] = l);
const ADD = D.levels.filter(l => l.n < 100).map(l => l.n), SUB = D.levels.filter(l => l.n > 100).map(l => l.n), ALL = ADD.concat(SUB);
const TRL = { add:ADD, sub:SUB };
const TR = n => n > 100 ? "sub" : "add";
const dn = n => n > 100 ? n - 100 : n;                       // 畫面上的關卡號碼
const trName = n => n > 100 ? "減法" : "加法";
const lvLabel = n => `${trName(n)}第 ${dn(n)} 關`;
const GUARD = n => D.monsters[n > 100 ? 30 + n - 101 : n - 1].id;   // 加法 1–20 → 第 1–20 隻；減法 101–116 → 第 31–46 隻
const STAR_MONS = D.monsters.slice(20, 30).map(m => m.id);
const MON_LV = {}; ALL.forEach(n => MON_LV[GUARD(n)] = n);
const EGG_COST = 15, ROUND_N = 6, WARM_SEC = window.__WARM_SEC || 60, CHAL_N = 5, DAY = 864e5, SLEEPY_DAYS = 3, VERIFY_FROM = 109;
const PL = ["個位", "十位", "百位", "千位"], PL1 = ["個", "十", "百", "千"];
const ERR = {
  forgot:  { name: "忘記進位",         tip: "個位（或十位）滿 10 時，請她先說出「滿十進一」再寫小 1。可以拿 10 個 1 元換 1 個 10 元，實際換一次給她看。" },
  notadd:  { name: "進位了但沒加進去",  tip: "算下一位時，請她用手指指著小 1 說「還要再加 1」。養成「寫了小 1 就一定要加」的習慣。" },
  fact:    { name: "基本加法算錯",     tip: "每天 3 分鐘口算 20 以內加法，練習湊十法（8＋7＝8＋2＋5）。基本加法熟了，直式就會又快又準。" },
  reverse: { name: "大減小（不夠減倒過來減）", tip: "先問她「上面夠不夠減？」不夠就要向左邊借 1。可以拿 3 個 1 元問「能不能拿走 7 元？」，讓她體會不夠減。" },
  nodec:   { name: "借了沒扣",         tip: "借給右邊以後，請她先把左邊的數字劃掉、寫上少 1 的數，再算那一位。" },
  sfact:   { name: "基本減法算錯",     tip: "每天口算 20 以內減法，練習破十法（13－8＝10－8＋3）。" },
  zero:    { name: "有 0 的退位錯",    tip: "0 借不到，要先向更左邊借：百位借 1 給十位變 10，十位再借 1 給個位變 9。用 1 個 100 元換 10 個 10 元，再拿 1 個 10 元換 10 個 1 元示範。" },
  align:   { name: "位數沒對齊",       tip: "列直式前先說「個位對個位」。可以在格子紙上寫，或用不同顏色把個位圈起來。" },
  hint:    { name: "靠提示才答對",     tip: "觀念還在建立中。陪她用積木、花片或錢幣把題目擺出來，再對照直式一步一步寫。" },
};

/* ---------- state ---------- */
function blank(){ return { v:1, created:Date.now(), stars:0, totalStars:0, starBank:0, lv:{}, sm:{}, partner:null,
  warm:{ last:null, best:0 }, errs:{}, settings:{ voice:true, zy:true }, parent:{ cap:ADD.length, capS:SUB.length, force:0, forceS:0 }, queue:[], rounds:0, today:{ d:"", sec:0 } }; }
let S;
try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "null") || {}); } catch(e){ S = blank(); }
S.settings = Object.assign({ voice:true, zy:true }, S.settings || {});
S.parent = Object.assign({ cap:ADD.length, capS:SUB.length, force:0, forceS:0 }, S.parent || {});
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} }
function L(n){ return S.lv[n] || (S.lv[n] = { unlocked:n === ADD[0] || n === SUB[0], passed:false, hist:[], streak:0, wrong:0, help:0, sc:1, xp:0,
  stage:-1, last:0, demo:false, cnt:0, ok:0, err:{}, chal:0 }); }
L(ADD[0]).unlocked = true; L(SUB[0]).unlocked = true;
function applyForce(){ ADD.slice(0, S.parent.force || 0).forEach(n => L(n).unlocked = true); SUB.slice(0, S.parent.forceS || 0).forEach(n => L(n).unlocked = true); }
applyForce();

/* ---------- utils ---------- */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const dg = (x, k) => Math.floor(x / Math.pow(10, k)) % 10;
const len = x => String(x).length;
const range = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };
const pad2 = n => String(n).padStart(2, "0");
const ymd = d => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
const stamp = () => { const d = new Date(); return ymd(d) + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds()); };
function $(sel, root){ return (root || app).querySelector(sel); }
function $$(sel, root){ return [...(root || app).querySelectorAll(sel)]; }
function on(sel, fn, root){ $$(sel, root).forEach(el => el.addEventListener("click", e => fn(el, e))); }
function toast(msg){ const t = document.createElement("div"); t.className = "toast"; t.innerHTML = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
let timers = [];
function later(fn, ms){ const t = setTimeout(() => { timers = timers.filter(x => x !== t); fn(); }, ms / (window.__SPEED || 1)); timers.push(t); return t; }   // __SPEED：自動測試用快轉
function clearTimers(){ timers.forEach(clearTimeout); timers = []; }
function applySettings(){ document.body.classList.toggle("zy-off", !S.settings.zy); }

/* ---------- 文字（注音） ---------- */
function segsHTML(segs, vars){
  return (segs || []).map(s => typeof s === "string" ? varHTML(s.slice(1, -1), vars)
    : s[1] ? `<ruby>${esc(s[0])}<rt>${esc(s[1])}</rt></ruby>` : numWrap(esc(s[0]))).join("");
}
const numWrap = h => h.replace(/\d+/g, m => `<b class="num">${m}</b>`);
function varHTML(name, vars){
  const v = vars && vars[name]; if (v == null) return "";
  if (Array.isArray(v)) return segsHTML(v);
  if (typeof v === "string" && v[0] === "@") return segsHTML(D.str[v.slice(1)]);
  return `<b class="num">${esc(v)}</b>`;
}
function T(id, vars){ return `<span class="t">${segsHTML(D.str[id] || [[id, ""]], vars)}</span>`; }   // 包一層 span，放進按鈕時才不會被拆成直排
function segsPlain(segs, vars){ return (segs || []).map(s => typeof s === "string" ? varPlain(s.slice(1, -1), vars) : s[0]).join(""); }
function varPlain(name, vars){ const v = vars && vars[name]; if (v == null) return ""; if (Array.isArray(v)) return segsPlain(v);
  if (typeof v === "string" && v[0] === "@") return P(v.slice(1)); return String(v); }
function P(id, vars){ return segsPlain(D.str[id] || [[id, ""]], vars); }
const monName = id => MON.get(id).zname;
const plv = k => "@pl" + k;   // 「個位／十位／百位」（有注音）

/* ---------- 語音與音效 ---------- */
const hasTTS = "speechSynthesis" in window;
let voice = null;
function pickVoice(){ if (!hasTTS) return; const vs = speechSynthesis.getVoices();
  voice = vs.find(v => /zh[-_]TW/i.test(v.lang)) || vs.find(v => /zh[-_](HK|Hant)/i.test(v.lang)) || vs.find(v => /^zh/i.test(v.lang)) || null; }
if (hasTTS) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(text){ if (!hasTTS || !S.settings.voice || !text) return; speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/＋|\+/g, "加").replace(/－|−/g, "減").replace(/Lv\./g, "等級")); u.lang = "zh-TW"; if (voice) u.voice = voice; u.rate = 0.95; speechSynthesis.speak(u); }
const sayId = (id, vars) => say(P(id, vars));
let actx = null;
function beep(notes, dur){ try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const t0 = actx.currentTime;
  notes.forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = "triangle"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0 + i * dur); g.gain.exponentialRampToValueAtTime(0.22, t0 + i * dur + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + (i + 1) * dur);
    o.connect(g); g.connect(actx.destination); o.start(t0 + i * dur); o.stop(t0 + (i + 1) * dur + 0.05); }); } catch(e){} }
const sfx = { good: () => beep([660, 880], 0.11), tick: () => beep([740], 0.07), soft: () => beep([330, 262], 0.14),
  hatch: () => beep([523, 659, 784, 1047], 0.13), whoosh: () => beep([440, 554, 659], 0.08) };

/* ---------- 怪獸等級 ---------- */
const XPN = [0, 0]; (() => { let c = 0; for (let l = 1; l < 30; l++) { c += 2 + Math.floor(l / 3); XPN[l + 1] = c; } })();
function mlv(xp){ let l = 1; while (l < 30 && xp >= XPN[l + 1]) l++; return l; }
const stageByLv = l => l >= 30 ? 3 : l >= 15 ? 2 : l >= 5 ? 1 : 0;
function gStage(n){ const s = L(n); return s.unlocked ? stageByLv(mlv(s.xp)) : -1; }
function sleepy(n){ const s = L(n); return s.passed && gStage(n) >= 1 && s.last && Date.now() - s.last > SLEEPY_DAYS * DAY; }
function xpBar(n){ const s = L(n), l = mlv(s.xp); if (l >= 30) return 100; return Math.round((s.xp - XPN[l]) / (XPN[l + 1] - XPN[l]) * 100); }
function drawGuard(n, opt){ const st = gStage(n); opt = opt || {};
  if (st < 0) return MON.draw(GUARD(n), 1, { silhouette:true });
  return MON.draw(GUARD(n), st, { sleepy: !opt.awake && sleepy(n), crack: st === 0 && mlv(L(n).xp) >= 4 }); }
function partnerInfo(){
  const id = S.partner;
  if (id && STAR_MONS.includes(id) && S.sm[id]) return { id, st:S.sm[id].stage, star:true };
  if (id && MON_LV[id] && gStage(MON_LV[id]) >= 1) return { id, n:MON_LV[id], st:gStage(MON_LV[id]) };
  return null;
}
function addXp(n, g){ if (!g || !LV[n]) return; const s = L(n); if (!s.unlocked) return; s.xp += g; if (R) R.xp[n] = (R.xp[n] || 0) + g; }

/* ---------- 關卡狀態 ---------- */
const capOf = tr => tr === "add" ? ADD[Math.max(1, Math.min(ADD.length, S.parent.cap || ADD.length)) - 1] : SUB[Math.max(1, Math.min(SUB.length, S.parent.capS || SUB.length)) - 1];
const inCap = n => n <= capOf(TR(n));
function curLevel(tr){ for (const n of TRL[tr]) { const s = L(n); if (inCap(n) && s.unlocked && !s.passed) return n; } return 0; }
const unlocked = tr => (tr ? TRL[tr] : ALL).filter(n => inCap(n) && L(n).unlocked);
const passedList = tr => unlocked(tr).filter(n => L(n).passed);
const last10 = n => L(n).hist.slice(-10);
const selfCount = n => last10(n).filter(x => x === 2).length;
const canChallenge = n => L(n).unlocked && inCap(n) && (L(n).passed || (L(n).hist.length >= 8 && selfCount(n) >= 8));
const nextLv = n => LV[n + 1] && TR(n + 1) === TR(n) ? n + 1 : 0;
const prevLv = n => LV[n - 1] && TR(n - 1) === TR(n) ? n - 1 : n;
const startedSub = () => L(SUB[0]).cnt > 0 || L(SUB[0]).passed;

/* ---------- 出題：加法 ---------- */
function vprob(a, b){
  const n = Math.max(len(a), len(b)), cols = []; let cin = 0;
  for (let k = 0; k < n; k++) { const ha = k < len(a), hb = k < len(b), da = ha ? dg(a, k) : 0, db = hb ? dg(b, k) : 0, s = da + db + cin;
    cols.push({ k, da, db, ha, hb, cin, s, out:s % 10, cout:s >= 10 ? 1 : 0 }); cin = s >= 10 ? 1 : 0; }
  if (cin) cols.push({ k:n, da:0, db:0, ha:false, hb:false, cin:1, s:1, out:1, cout:0, extra:true });
  return { type:"v", a, b, sum:a + b, cols, text:a + " + " + b };
}
const nd = d => d === 1 ? ri(1, 9) : d === 2 ? ri(10, 99) : ri(100, 999);
const dd = d => typeof d === "function" ? d() : d;
function genV(da, db, pred){
  for (let i = 0; i < 4000; i++) { const p = vprob(nd(dd(da)), nd(dd(db))); if (pred(p)) return p; }
  return vprob(23, 45);
}
const C = (p, k) => p.cols[k] ? p.cols[k].cout : 0;
const anyCarry = p => p.cols.some(c => c.cout);
const VGEN = {
  6:  () => genV(2, 1, p => !anyCarry(p) && dg(p.a, 0) > 0),
  7:  () => genV(2, 2, p => !anyCarry(p) && dg(p.a, 0) > 0 && dg(p.b, 0) > 0),
  8:  () => genV(2, 1, p => C(p, 0) && !C(p, 1)),
  9:  () => genV(2, 2, p => C(p, 0) && p.cols[0].s >= 11 && !C(p, 1)),
  10: () => genV(2, 2, p => p.cols[0].s === 10 && !C(p, 1)),
  11: () => genV(2, 2, p => !C(p, 0) && C(p, 1) && dg(p.a, 0) + dg(p.b, 0) > 0),
  12: () => genV(2, 2, p => C(p, 0) && C(p, 1)),
  13: () => genV(3, 3, p => !anyCarry(p) && p.sum < 1000),
  14: () => genV(3, 3, p => C(p, 0) && !C(p, 1) && !C(p, 2)),
  15: () => genV(3, 3, p => !C(p, 0) && C(p, 1) && !C(p, 2)),
  16: () => genV(3, 3, p => C(p, 0) && C(p, 1) && !C(p, 2)),
  17: () => genV(3, () => Math.random() < 0.7 ? 2 : 1, p => anyCarry(p) && p.sum < 1000),
  18: () => genV(3, () => Math.random() < 0.5 ? 3 : 2, p => p.sum < 1000 && p.cols.some(c => c.cin && ((c.ha && c.da === 0) || (c.hb && c.db === 0)))),
  19: () => Math.random() < 0.75 ? genV(2, 2, p => C(p, 0) && p.sum < 200) : genV(3, 2, p => anyCarry(p) && p.sum < 1000),
  20: () => genV(3, () => Math.random() < 0.6 ? 3 : 2, p => anyCarry(p) && p.sum < 1000),
};

/* ---------- 出題：減法 ---------- */
// 每一位：lent＝這一位借給右邊 1；borrow＝這一位向左邊借 1（多 10）；eff＝實際被減的數；lead＝答案最前面的 0（不用寫）
function sprob(a, b){
  const n = len(a), cols = []; let owe = 0;
  for (let k = 0; k < n; k++) { const hb = k < len(b), da = dg(a, k), db = hb ? dg(b, k) : 0, top = da - owe, bor = top < db ? 1 : 0;
    cols.push({ k, da, db, ha:true, hb, lent:owe, borrow:bor, top, eff:top + 10 * bor, out:top + 10 * bor - db }); owe = bor; }
  const diff = a - b; cols.forEach(c => c.lead = c.k > 0 && c.k >= len(diff));
  return { type:"s", a, b, diff, cols, text:a + " − " + b };
}
const B = (p, k) => p.cols[k] ? p.cols[k].borrow : 0;
const anyBorrow = p => p.cols.some(c => c.borrow);
function genS(da, db, pred){
  for (let i = 0; i < 4000; i++) { const a = typeof da === "number" ? nd(da) : da(), b = nd(dd(db)); if (a <= b) continue; const p = sprob(a, b); if (pred(p)) return p; }
  return sprob(63, 28);
}
const SGEN = {
  104: () => genS(2, 1, p => !anyBorrow(p) && dg(p.a, 0) > 0),
  105: () => genS(2, 2, p => !anyBorrow(p) && dg(p.b, 0) > 0),
  106: () => genS(2, 1, p => B(p, 0) && p.a >= 20),
  107: () => genS(2, 2, p => B(p, 0) && dg(p.a, 0) > 0),
  108: () => genS(() => ri(2, 9) * 10, 2, p => B(p, 0) && dg(p.b, 0) > 0),
  109: () => genS(3, 3, p => !anyBorrow(p) && dg(p.b, 0) > 0),
  110: () => genS(3, 3, p => B(p, 0) && !B(p, 1) && dg(p.a, 1) > 0),
  111: () => genS(3, 3, p => !B(p, 0) && B(p, 1)),
  112: () => genS(3, 3, p => B(p, 0) && B(p, 1) && dg(p.a, 1) > 0),
  113: () => genS(3, () => Math.random() < 0.6 ? 3 : 2, p => dg(p.a, 1) === 0 && B(p, 0)),
  114: () => genS(3, () => Math.random() < 0.7 ? 2 : 1, p => anyBorrow(p)),
  115: () => Math.random() < 0.7 ? genS(2, 2, p => B(p, 0)) : genS(3, 2, p => anyBorrow(p)),
  116: () => Math.random() < 0.5 ? (Math.random() < 0.7 ? genV(2, 2, p => C(p, 0) && p.sum < 200) : genV(3, 2, p => anyCarry(p) && p.sum < 1000))
                                 : (Math.random() < 0.7 ? genS(2, 2, p => B(p, 0)) : genS(3, 2, p => anyBorrow(p))),
};

function genProblem(n){
  const k = LV[n].kind;
  if (k === "make10") { const a = ri(1, 9); return { type:"make10", a, ans:10 - a, text:a + " + ? = 10" }; }
  if (k === "fact10") { const a = ri(1, 9), b = ri(1, 10 - a); return { type:"fact", a, b, ans:a + b, text:a + " + " + b }; }
  if (k === "make10add") { const a = ri(6, 9), b = ri(11 - a, 9); return { type:"fact", a, b, ans:a + b, text:a + " + " + b, bridge:true }; }
  if (k === "fact20") { let a = ri(2, 9), b = ri(2, 9); while (a + b <= 10) { a = ri(2, 9); b = ri(2, 9); } return { type:"fact", a, b, ans:a + b, text:a + " + " + b, bridge:true }; }
  if (k === "tens") { const p = ri(1, 8), q = ri(1, 9 - p); return { type:"tens", a:p * 10, b:q * 10, p, q, ans:(p + q) * 10, text:p * 10 + " + " + q * 10 }; }
  if (k === "sfact10") { const a = ri(2, 10), b = ri(1, a - 1); return { type:"sfact", a, b, ans:a - b, text:a + " − " + b }; }
  if (k === "sbridge") { const a = ri(11, 18); let b = ri(a % 10 + 1, 9); if (a - b > 9) b = a - 9; return { type:"sfact", a, b, ans:a - b, text:a + " − " + b, bridge:true }; }
  if (k === "stens") { const p = ri(2, 9), q = ri(1, p - 1); return { type:"stens", a:p * 10, b:q * 10, p, q, ans:(p - q) * 10, text:p * 10 + " − " + q * 10 }; }
  if (n > 100) { const pr = SGEN[n]();
    if (k === "word") pr.word = pick((n === 115 ? D.word15 : D.word16).filter(w => w.op === (pr.type === "s" ? "sub" : "add")));
    return pr; }
  const v = VGEN[n]();
  if (k === "word") v.word = pick(n === 19 ? D.word19 : D.word20);
  return v;
}
function genDetect(maxLv){
  const lvls = range(8, Math.min(16, maxLv)).filter(n => LV[n].kind === "v" && n !== 13);   // 第 13 關沒有進位，不適合找錯
  const n = pick(lvls.length ? lvls : [9]);
  let p = VGEN[n](); for (let i = 0; i < 50 && !p.cols.some(c => c.cin); i++) p = VGEN[n]();
  if (!p.cols.some(c => c.cin)) p = vprob(38, 47);
  const carryCols = p.cols.filter(c => c.cin).map(c => c.k);
  const r = Math.random(); let type = r < 0.6 ? "forgot" : r < 0.8 ? "notadd" : "fact";
  let col, digits = p.cols.map(c => c.out), marks = p.cols.map(c => c.cin);
  if (type === "fact") { col = pick(p.cols.filter(c => !c.extra).map(c => c.k)); const c = p.cols[col];
    let w = c.out; const bad = [(c.da + c.db) % 10]; while (w === c.out || bad.includes(w)) w = (c.out + pick([1, 2, 9, 8])) % 10; digits[col] = w; }
  else { col = pick(carryCols); const c = p.cols[col]; digits[col] = (c.da + c.db) % 10; if (type === "forgot") marks[col] = 0; }
  if (p.cols[col].extra) { digits[col] = null; if (type !== "fact") type = "forgot"; marks[col] = type === "notadd" ? 1 : 0; }
  return { p, lv:n, bad:{ col, type }, digits, marks };
}
function genDetectS(maxLv){
  const lvls = [106, 107, 108, 110, 111, 112, 113].filter(n => n <= maxLv);
  const n = pick(lvls.length ? lvls : [107]);
  let p = SGEN[n](); for (let i = 0; i < 50 && !anyBorrow(p); i++) p = SGEN[n]();
  if (!anyBorrow(p)) p = sprob(63, 28);
  const rev = p.cols.filter(c => c.borrow && c.top >= 0 && c.db - c.top !== 5).map(c => c.k);              // 倒過來減的結果要跟正確答案不同才看得出來
  const revOK = k => { const c1 = p.cols[k + 1]; return c1 && !c1.lead && !c1.borrow && c1.out < 9; };   // 左邊那一位也跟著「沒借位」改寫，畫面才前後一致
  const nod = p.cols.filter(c => c.lent && !c.borrow && !c.lead && c.out < 9).map(c => c.k);
  const r = Math.random(); let type = r < 0.5 && rev.length ? "reverse" : r < 0.8 && nod.length ? "nodec" : "sfact";
  const digits = p.cols.map(c => c.lead ? null : c.out), lend = p.cols.map(c => c.lent).concat([0]);
  let col;
  let also = -1;
  if (type === "reverse") { const good = rev.filter(revOK); col = pick(good.length ? good : rev); const c = p.cols[col]; digits[col] = Math.abs(c.top - c.db); lend[col + 1] = 0;
    if (revOK(col)) { also = col + 1; digits[also] = p.cols[also].out + 1; } }
  else if (type === "nodec") { col = pick(nod); digits[col] = p.cols[col].out + 1; }
  else { col = pick(p.cols.filter(c => !c.lead).map(c => c.k)); const c = p.cols[col]; let w = c.out;
    while (w === c.out || w === Math.abs(c.top - c.db)) w = (c.out + pick([1, 2, 8, 9])) % 10; digits[col] = w; }
  return { p, lv:n, bad:{ col, type }, digits, lend, nodecCol:type === "nodec" ? col : -1, also };
}

/* ---------- 回合 ---------- */
let R = null;
function newRound(mode, extra){ R = Object.assign({ mode, items:[], i:0, res:[], errs:[], xp:{}, t0:Date.now(), starsWon:0, warm:null, lvBefore:{} }, extra || {});
  ALL.forEach(n => R.lvBefore[n] = mlv(L(n).xp)); }
function pickReview(k){
  const ps = passedList(); if (!ps.length) return [];
  const now = Date.now();
  const w = n => { const s = L(n); return 1 + Math.min(10, (now - (s.last || 0)) / DAY) + (sleepy(n) ? 6 : 0) + ((s.err.forgot || 0) + (s.err.reverse || 0)) * 0.3 + (10 - selfCount(n)) * 0.3; };
  const out = [], pool = ps.slice();
  while (out.length < k && pool.length) { const tot = pool.reduce((a, n) => a + w(n), 0); let r = Math.random() * tot;
    for (let i = 0; i < pool.length; i++) { r -= w(pool[i]); if (r <= 0 || i === pool.length - 1) { out.push(pool[i]); pool.splice(i, 1); break; } } }
  return out;
}
const detectOK = n => n && (TR(n) === "add" ? n >= 9 : n >= 107);
function startAdventure(){
  clearTimers(); newRound("adv"); S.rounds++;
  const cA = curLevel("add"), cS = curLevel("sub"), items = [];
  if (!cA && !cS) { // 兩條路線都過關了：綜合複習
    pickReview(4).forEach(n => items.push({ lv:n, kind:"p" }));
    while (items.length < 4) items.push({ lv:pick(unlocked()), kind:"p" });
    const dl = [capOf("add"), capOf("sub")].filter(detectOK);
    if (dl.length) items.splice(2, 0, { lv:pick(dl), kind:"detect" });
    while (items.length < ROUND_N) items.push({ lv:pick(unlocked()), kind:"p" });
  } else {
    const nRev = Math.min(passedList().length >= 3 ? 2 : passedList().length, 2);
    pickReview(nRev).forEach(n => items.push({ lv:n, kind:"p" }));
    const curs = [cA, cS].filter(Boolean), curItems = [];
    for (let i = items.length, j = S.rounds; i < ROUND_N; i++, j++) curItems.push({ lv:curs[j % curs.length], kind:"p" });   // 加減輪流
    const dl = curs.filter(detectOK);
    if (dl.length && curItems.length >= 3) { const dLv = dl[S.rounds % dl.length]; curItems.splice(2, 1, { lv:dLv, kind:"detect" }); }
    items.push(...curItems);
  }
  R.items = items;
  pushScreen();
  renderWarm(() => renderItem());
}
function startPractice(n){ clearTimers(); newRound("practice", { lvT:n }); R.items = range(1, ROUND_N).map(() => ({ lv:n, kind:"p" }));
  if ((n >= 9 && n <= 18) || (n >= 107 && n <= 113 && n !== 109)) R.items.splice(3, 1, { lv:n, kind:"detect" }); pushScreen(); renderItem(); }
function startChallenge(n){ clearTimers(); newRound("challenge", { lvT:n }); R.items = range(1, CHAL_N).map(() => ({ lv:n, kind:"p" })); pushScreen(); renderChalIntro(); }

/* ---------- 共用畫面 ---------- */
function settingsBtns(){
  return `<button class="btn toggle ${S.settings.voice ? "on" : ""}" data-set="voice" aria-label="語音">${S.settings.voice ? "🔊" : "🔇"}<span class="lbl">${S.settings.voice ? "語音開" : "語音關"}</span></button>
    <button class="btn toggle ${S.settings.zy ? "on" : ""}" data-set="zy" aria-label="注音">ㄅ<span class="lbl">${S.settings.zy ? "注音開" : "注音關"}</span></button>`;
}
function bindSettings(){ on("[data-set]", el => { const k = el.dataset.set; S.settings[k] = !S.settings[k]; save(); applySettings();
  el.classList.toggle("on", S.settings[k]);
  el.innerHTML = k === "voice" ? `${S.settings.voice ? "🔊" : "🔇"}<span class="lbl">${S.settings.voice ? "語音開" : "語音關"}</span>` : `ㄅ<span class="lbl">${S.settings.zy ? "注音開" : "注音關"}</span>`;
  if (k === "voice" && S.settings.voice) say("語音打開了"); }); }
function qbar(tag){
  const dots = R.items.map((it, k) => `<i class="${k < R.i ? (it.result === 2 ? "ok" : it.result === 1 ? "mid" : "no") : (k === R.i ? "cur" : "")}"></i>`).join("");
  return `<div class="qbar"><button class="btn small" data-home aria-label="回首頁">🏠</button>${tag ? `<span class="pill">${tag}</span>` : ""}<div class="dots">${dots}</div>${settingsBtns()}</div>`;
}
const demoBar = () => `<div class="qbar"><span class="pill">🎬 ${T("demo")}</span><div class="dots"></div>${settingsBtns()}</div>`;
function bindQbar(){ on("[data-home]", () => { hasTTS && speechSynthesis.cancel(); finishRound(true); }); bindSettings(); }
function padHTML(fact){
  return `<div class="pad">${[1,2,3,4,5,6,7,8,9,0].map(d => `<button class="btn key" data-d="${d}">${d}</button>`).join("")}
    ${fact ? `<button class="btn key wide back" data-back>⌫</button><button class="btn key wide okk" data-ok>✔ 確定</button>` : ""}</div>`;
}
function tagOf(it){ if (R.mode === "challenge") return "⚔️ 道館挑戰"; if (it.kind === "detect") return "🔍 " + P("detect_title"); if (it.kind === "easy") return "🌱 暖身題";
  return lvLabel(it.lv); }

/* ---------- 暖身：快問快答 ---------- */
function renderWarm(next){
  let ok = 0, n = 0, q = null, typed = "", lock = false, ended = false; const t0 = Date.now();
  const sub = startedSub(), title = sub ? "warm_title2" : "warm_title";
  const newQ = () => { const r = Math.random();
    if (sub && r < 0.35) { if (Math.random() < 0.4) { const b = ri(1, 9); q = { show:`10 − ${b} = <span class="qm">?</span>`, ans:10 - b, lv:SUB[0] }; }
      else { const a = ri(11, 18); let b = ri(a % 10 + 1, 9); if (a - b > 9) b = a - 9; q = { show:`${a} − ${b} = <span class="qm">?</span>`, ans:a - b, lv:L(102).unlocked ? 102 : SUB[0] }; } }
    else if (r < 0.65) { const a = ri(1, 9); q = { show:`${a} + <span class="qm">?</span> = 10`, ans:10 - a, lv:1 }; }
    else { let a = ri(2, 9), b = ri(2, 9); if (Math.random() < 0.75) while (a + b <= 10) { a = ri(2, 9); b = ri(2, 9); }
      q = { show:`${a} + ${b} = <span class="qm">?</span>`, ans:a + b, lv:L(4).unlocked ? 4 : L(3).unlocked ? 3 : 1 }; } typed = ""; };
  const paint = () => {
    app.innerHTML = `<div class="qbar"><button class="btn small" data-home aria-label="回首頁">🏠</button><span class="pill">⚡ ${T(title)}</span><div class="dots"></div>${settingsBtns()}</div>
      <div class="qcard warm"><div class="timer"><i style="animation-duration:${WARM_SEC}s;animation-delay:-${(Date.now() - t0) / 1000}s"></i></div>
      <div class="ask">${T("warm_intro")}</div><div class="wscore">✅ ${ok}</div>
      <div class="expr" id="wq">${q.show}</div><div class="ansbox" id="wa">${typed || "&nbsp;"}</div>${padHTML(false)}</div>`;
    bindQbar();
    on("[data-d]", el => { if (lock) return; typed += el.dataset.d; $("#wa").textContent = typed;
      if (typed.length >= String(q.ans).length) { lock = true; n++;
        if (+typed === q.ans) { ok++; sfx.tick(); $("#wa").classList.add("ok"); addXp(q.lv, 1); later(() => { if (ended) return; lock = false; newQ(); paint(); }, 250); }
        else { sfx.soft(); $("#wa").classList.add("no"); $("#wa").textContent = typed + " → " + q.ans; later(() => { if (ended) return; lock = false; newQ(); paint(); }, 900); } } });
  };
  newQ(); paint(); say(P("warm_intro"));
  later(() => { lock = true; ended = true;
    const prev = S.warm.last; S.warm.last = ok; S.warm.best = Math.max(S.warm.best || 0, ok); R.warm = ok; save();
    const cmp = prev == null ? T("warm_first") : ok > prev ? T("warm_better", { n:ok - prev }) : T("warm_same");
    app.innerHTML = `<div class="qbar"><button class="btn small" data-home aria-label="回首頁">🏠</button><span class="pill">⚡ ${T(title)}</span><div class="dots"></div>${settingsBtns()}</div>
      <div class="qcard warm center"><div class="bigstar">⏱️</div><div class="say">${T("warm_done", { n:ok })}</div><div class="say sub">${ok >= (prev || 0) ? cmp : T("warm_same")}</div>
      <div class="muted">最高紀錄：${S.warm.best} 題</div><button class="btn primary big" data-wgo>${T("warm_go")} 👉</button></div>`;
    bindQbar(); sayId("warm_done", { n:ok }); on("[data-wgo]", () => next());
  }, WARM_SEC * 1000);
}

/* ---------- 題目分派 ---------- */
function renderItem(){
  clearTimers(); hasTTS && speechSynthesis.cancel();
  const it = R.items[R.i]; if (!it) return finishRound(false);
  it.sc = R.mode === "challenge" ? 0 : it.kind === "easy" ? 2 : L(it.lv).sc;
  if (it.kind === "detect") { if (!it.d) it.d = TR(it.lv) === "sub" ? genDetectS(it.lv) : genDetect(it.lv); return TR(it.lv) === "sub" ? renderDetectS(it) : renderDetect(it); }
  if (!it.p) it.p = genProblem(it.lv);
  const lv = LV[it.lv];
  if (lv.demo && !L(it.lv).demo && R.mode !== "challenge" && it.kind === "p") return renderDemo(it.lv, () => { L(it.lv).demo = true; save(); renderItem(); });
  if (lv.kind === "word") return renderWord(it);
  if (it.p.type === "v") return renderV(it, { align: !!lv.align });
  if (it.p.type === "s") return renderS(it, { align: !!lv.align });
  return renderFact(it);
}
function done(it, result, info){
  info = info || {};
  if (it.demo) return;
  it.result = result;
  const s = L(it.lv), errs = info.errs || [];
  s.cnt++; s.last = Date.now(); if (result) s.ok++;
  const recErr = (type, e) => { s.err[type] = (s.err[type] || 0) + 1; S.errs[type] = (S.errs[type] || 0) + 1;
    R.errs.push(Object.assign({ type, lv:it.lv, prob:(it.p || (it.d && it.d.p) || {}).text || "" }, e || {})); };
  errs.forEach(e => recErr(e.type, e));
  if (result === 1 && !errs.length && it.kind !== "detect") recErr("hint", {});
  if (result) { S.stars++; S.totalStars++; S.starBank++; R.starsWon++; }
  addXp(it.lv, result === 2 ? 2 : result === 1 ? 1 : 0);
  R.res.push({ lv:it.lv, result, kind:it.kind });
  let offerFast = false;
  if (R.mode !== "challenge" && it.kind === "p") {
    s.hist.push(result); if (s.hist.length > 20) s.hist = s.hist.slice(-20);
    if (result === 2) { s.streak++; s.wrong = 0; s.help = 0; if (s.sc === 1 && s.streak >= 2) s.sc = 0;
      if (!s.passed && s.streak >= 3 && s.streak % 3 === 0 && it.lv === curLevel(TR(it.lv))) offerFast = true; }
    else if (result === 1) { s.streak = 0; s.wrong = 0; s.help++; if (s.sc === 2 && s.help >= 2) { s.sc = 1; s.help = 0; } }
    else { s.streak = 0; s.help = 0; s.wrong++; if (s.sc === 0) s.sc = 1;
      if (s.wrong >= 2) { s.sc = 2; s.wrong = 0;
        R.items.splice(R.i + 1, 0, { lv:prevLv(it.lv), kind:"easy" }); R.easyNote = true; } }
  }
  save();
  return offerFast;
}
// 顯示回饋，然後下一題
function feedback(it, result, offerFast, msgHTML){
  const fb = $("#fb"), after = $("#after");
  if (result) { sfx.good(); const g = pick(["good1", "good2", "good3", "good4", "good5"]);
    fb.className = "feedback good"; fb.innerHTML = (msgHTML || T(g)) + " ⭐"; if (!msgHTML) sayId(g); }
  else { sfx.soft(); fb.className = "feedback try"; if (msgHTML) fb.innerHTML = msgHTML; }
  const go = () => { if (offerFast) return offerChallenge(it.lv); nextItem(); };
  after.innerHTML = `<button class="btn primary" data-next>${T("next")} 👉</button>`;
  on("[data-next]", go, after);
  if (result && !offerFast && !it.noAuto) later(go, 1700);
}
function nextItem(){ clearTimers(); R.i++; if (R.easyNote && R.items[R.i] && R.items[R.i].kind === "easy") { R.easyNote = false; toast(T("easy_insert")); sayId("easy_insert"); }
  if (R.i >= R.items.length) finishRound(false); else renderItem(); }
function offerChallenge(n){
  const ov = document.createElement("div"); ov.className = "overlay";
  ov.innerHTML = `<div class="box pop"><div style="display:inline-block">${drawGuard(n, { awake:true })}</div><div class="say">${T("fast")}</div><div class="muted">${lvLabel(n)}</div>
    <div class="row-btns"><button class="btn sun" data-y>⚔️ 挑戰道館</button><button class="btn" data-n>再練一下</button></div></div>`;
  document.body.appendChild(ov); sayId("fast");
  ov.querySelector("[data-y]").onclick = () => { ov.remove(); finishRound(true, true); startChallenge(n); };
  ov.querySelector("[data-n]").onclick = () => { ov.remove(); nextItem(); };
}

/* ---------- 算式題（加法 1–5 關、減法 1–3 關） ---------- */
function rods(n, cls, crossFrom){ let h = ""; for (let i = 0; i < n; i++) h += `<i class="rod ${cls} ${crossFrom != null && i >= crossFrom ? "x" : ""}"></i>`; return `<div class="rods">${h}</div>`; }
function frame(cells){ return `<div class="tf">${cells.map(c => `<i class="${c}"></i>`).join("")}</div>`; }
function factVisual(p, mode){ // mode: 0 無、1 一般、2 提示
  if (!mode) return "";
  const isSub = p.type === "sfact" || p.type === "stens";
  if (p.type === "make10") { let h = ""; for (let i = 0; i < 10; i++) h += `<i class="${i < p.a ? "ra" : ""}">${mode === 2 && i >= p.a ? `<em>${i - p.a + 1}</em>` : ""}</i>`;
    return `<div class="vis"><div class="tf">${h}</div></div>`; }
  if (p.type === "tens") return `<div class="vis tensv">${rods(p.p, "ga")}<b class="op">+</b>${rods(p.q, "gb")}</div>`;
  if (p.type === "stens") return `<div class="vis tensv">${rods(p.p, "ga", mode === 2 ? p.p - p.q : null)}</div>`;
  if (isSub && p.a <= 10) return `<div class="vis">${frame(range(0, 9).map(i => i < p.a ? "ra" + (mode === 2 && i >= p.a - p.b ? " x" : "") : ""))}</div>`;
  if (isSub) { const r = p.a - 10;   // 破十：先從 10 拿走 b
    return `<div class="vis">${frame(range(0, 9).map(i => "ra" + (mode === 2 && i < p.b ? " x" : "")))}${frame(range(0, 9).map(i => i < r ? "ra" : ""))}</div>`; }
  if (p.bridge && mode === 2) { const k = 10 - p.a;
    return `<div class="vis">${frame(range(0, 9).map(i => i < p.a ? "ra" : "rb moved"))}<b class="op">+</b>${frame(range(0, 9).map(i => i < k ? "ghost" : i < p.b ? "rb" : ""))}</div>`; }
  if (p.bridge || p.ans > 10) return `<div class="vis">${frame(range(0, 9).map(i => i < p.a ? "ra" : ""))}<b class="op">+</b>${frame(range(0, 9).map(i => i < p.b ? "rb" : ""))}</div>`;
  return `<div class="vis">${frame(range(0, 9).map(i => i < p.a ? "ra" : i < p.a + p.b ? "rb" : ""))}</div>`;
}
function factAsk(p){
  if (p.type === "make10") return ["make10_ask", { a:p.a }];
  if (p.type === "sfact" || p.type === "stens") return ["s_ask", { a:p.a, b:p.b }];
  return [p.type === "tens" ? "tens_ask" : "fact_ask", { a:p.a, b:p.b }];
}
function factHint(p){
  if (p.type === "make10") return ["make10_hint", {}];
  if (p.type === "tens") return ["tens_hint", { p:p.p, q:p.q }];
  if (p.type === "stens") return ["s_tens_hint", { p:p.p, q:p.q }];
  if (p.type === "sfact") return p.a > 10 ? ["s_hint_bridge", { a:p.a, b:p.b, r:p.a - 10, k:10 - p.b }] : ["s_hint_fact", { a:p.a, b:p.b }];
  if (p.bridge) return ["fact_hint10", { a:p.a, b:p.b, k:10 - p.a, r:p.b - (10 - p.a) }];
  return ["fact_hint", {}];
}
function renderFact(it, opts){
  opts = opts || {};
  const p = it.p, chal = R.mode === "challenge", isSub = p.type === "sfact" || p.type === "stens";
  let typed = "", tries = 0, errs = [], lock = false, hintOn = it.sc === 2;
  const expr = () => p.type === "make10" ? `${p.a} + <span class="qm">${typed || "?"}</span> = 10` : `${p.a} ${isSub ? "−" : "+"} ${p.b} = <span class="qm">${typed || "?"}</span>`;
  const paint = () => {
    const [aid, av] = factAsk(p), [hid, hv] = factHint(p);
    app.innerHTML = (opts.auto ? demoBar() : qbar(tagOf(it))) + `<div class="qcard fact">
      <div class="ask" id="ask">${T(aid, av)}</div>
      ${factVisual(p, chal ? 0 : hintOn ? 2 : it.sc >= 1 ? 1 : 0)}
      ${hintOn && !chal ? `<div class="hint">💡 ${T(hid, hv)}</div>` : ""}
      <div class="expr">${expr()}</div>
      ${padHTML(true)}<div class="feedback" id="fb"></div><div id="after"></div></div>`;
    if (opts.auto) bindSettings(); else bindQbar();
    on("[data-d]", el => { if (lock || typed.length >= 3) return; typed += el.dataset.d; $(".expr").innerHTML = expr(); });
    on("[data-back]", () => { if (!lock) { typed = typed.slice(0, -1); $(".expr").innerHTML = expr(); } });
    on("[data-ok]", () => { if (lock || !typed) return; check(); });
  };
  const check = () => {
    if (opts.auto) return;
    const v = +typed;
    if (v === p.ans) { lock = true; $(".expr .qm").classList.add("ok");
      const result = tries ? 1 : it.sc === 2 ? 1 : 2; const f = done(it, result, { errs }); feedback(it, result, f); return; }
    errs.push({ type:isSub ? "sfact" : "fact", typed:v, want:p.ans }); tries++;
    if (chal || tries >= 2) { lock = true; $(".expr .qm").classList.add("no"); $(".expr .qm").textContent = p.ans;
      const f = done(it, 0, { errs }); feedback(it, 0, f, T("show_answer", { s:p.ans })); sayId("show_answer", { s:p.ans }); return; }
    sfx.soft(); hintOn = true; typed = ""; paint(); const [hid, hv] = factHint(p); sayId(hid, hv);
    $("#fb").className = "feedback try"; $("#fb").innerHTML = T("retry_col");
  };
  paint();
  if (!chal) { const [aid, av] = factAsk(p); if (hintOn) { const [hid, hv] = factHint(p); say(P(aid, av) + " " + P(hid, hv)); } else sayId(aid, av); }
  if (opts.auto) { later(() => { typed = String(p.ans); $(".expr").innerHTML = expr(); $(".expr .qm").classList.add("ok"); sfx.good(); opts.auto(); }, 4200); }
}

/* ---------- 直式加法 ---------- */
function vInit(it, opts){
  const W = it.p.cols.length;
  it.v = { ans:Array(W).fill(null), carry:Array(W).fill(0), act:0, errs:[], tries:{}, revealed:false, helped:false,
    phase: opts.align && len(it.p.b) < len(it.p.a) ? "align" : "input", blocks: it.sc === 2 && R.mode !== "challenge", bgone:{}, bin:{}, off:null, carryWant:-1, opts };
}
function vPrompt(it){
  const p = it.p, v = it.v, c = p.cols[v.act]; if (!c) return null;
  if (c.extra) return ["v_down", {}];
  if (c.k === 0) return ["v_ones", { a:c.da, b:c.db }];
  const pre = c.k === 1 ? "v_tens" : "v_hund";
  if (!c.hb || !c.ha) { const only = c.ha ? c.da : c.db; return [pre + (c.cin ? "_1c" : "_1"), { a:only }]; }
  return [pre + (c.cin ? "_c" : ""), { a:c.da, b:c.db }];
}
// 對齊時第二個數的那一列
function alignRow(it, W, sign){
  const v = it.v, lb = len(it.p.b); let h = `<span class="g-sign">${sign}</span>`;
  for (let d = 0; d < W; d++) { const i = d - v.off; const ch = i >= 0 && i < lb ? String(it.p.b)[i] : ""; h += `<span class="g-d bcard ${ch ? "on" : ""}">${ch}</span>`; }
  return h;
}
function gridHTML(it, o){
  o = o || {};
  const p = it.p, v = it.v || {}, W = p.cols.length, act = o.act != null ? o.act : v.act, hl = o.hl != null ? o.hl : -1;
  const ans = o.digits || v.ans, marks = o.marks || v.carry;
  let h = `<span class="g-sign"></span>`;
  for (let d = 0; d < W; d++) { const k = W - 1 - d; h += `<span class="g-head pk${k} ${k === hl ? "hl" : ""}">${PL1[k]}</span>`; }
  h += `<span class="g-sign"></span>`;
  for (let d = 0; d < W; d++) { const k = W - 1 - d;
    h += k >= 1 ? `<button class="g-cc pk${k} ${marks[k] ? "on" : ""} ${v.carryWant === k ? "blink" : ""} ${k === hl ? "hl" : ""}" data-cc="${k}" aria-label="${PL[k]}的進位格">${marks[k] ? "1" : ""}</button>` : `<span class="g-cc empty ${k === hl ? "hl" : ""}"></span>`; }
  h += `<span class="g-sign"></span>`;
  for (let d = 0; d < W; d++) { const k = W - 1 - d, c = p.cols[k]; h += `<span class="g-d pk${k} ${k === hl ? "hl" : ""}">${c.ha ? c.da : ""}</span>`; }
  if (v.phase === "align" && !o.digits) h += alignRow(it, W, "+");
  else { h += `<span class="g-sign">+</span>`;
    for (let d = 0; d < W; d++) { const k = W - 1 - d, c = p.cols[k]; h += `<span class="g-d pk${k} ${k === hl ? "hl" : ""}">${c.hb ? c.db : ""}</span>`; } }
  h += `<span class="g-line" style="grid-column:1 / span ${W + 1}"></span><span class="g-sign"></span>`;
  for (let d = 0; d < W; d++) { const k = W - 1 - d, val = ans[k];
    const st = o.states ? o.states[k] || "" : "";
    h += `<button class="g-ac pk${k} ${k === act && v.phase === "input" && !o.digits ? "cur" : ""} ${k === hl ? "hl" : ""} ${st}" data-ac="${k}">${val == null ? "" : val}</button>`; }
  return `<div class="vgrid" style="--w:${W}">${h}</div>`;
}
function blocksHTML(it){
  const p = it.p, v = it.v, W = p.cols.length; let h = "";
  for (let d = 0; d < W; d++) { const k = W - 1 - d, c = p.cols[k], unit = ["cube", "rod", "flat", "flat"][k];
    let units = "", idx = 0;
    const mk = (n, cls) => { for (let i = 0; i < n; i++) { units += `<i class="${unit} ${cls} ${v.bgone[k] && idx < 10 ? "gone" : ""}"></i>`; idx++; } };
    mk(c.ha ? c.da : 0, "ua"); mk(c.hb ? c.db : 0, "ub"); if (v.bin[k]) mk(1, "uc");
    h += `<div class="bcol pk${k}" data-bk="${k}"><div class="blbl">${PL[k]}</div><div class="bunits">${units}</div></div>`; }
  return `<div class="bgrid" style="--w:${W}">${h}</div>`;
}
function vShell(it, opts){
  const v = it.v;
  app.innerHTML = (opts.demo ? demoBar() : qbar(tagOf(it))) +
    `<div class="qcard v">${opts.wordHTML || ""}<div class="vmsg" id="vmsg"></div>
      <div class="vmain"><div id="vg"></div><div id="blocks" class="blocks ${v.blocks ? "" : "hide"}"></div></div>
      <div id="vact"></div><div class="feedback" id="fb"></div><div id="after"></div></div>`;
  if (opts.demo) bindSettings(); else bindQbar();
}
function renderV(it, opts){
  opts = opts || {};
  if (!it.v) vInit(it, opts);
  const v = it.v, p = it.p;
  if (v.phase === "align" && v.off == null) v.off = p.cols.length - len(p.a);   // 第二個數一開始靠左（跟第一個數的最高位對齊），要自己移到個位對個位
  vShell(it, opts);
  vDraw(it); vBlocks(it);
  vEnterPhase(it);
}
function vMsg(it, id, vars, speak){ const m = $("#vmsg"); if (!m) return; m.innerHTML = id ? T(id, vars) : ""; m.classList.remove("pop"); void m.offsetWidth; m.classList.add("pop"); if (speak) sayId(id, vars); }
function vDraw(it){
  const v = it.v, hl = it.sc >= 1 && v.phase === "input" ? v.act : -1;
  $("#vg").innerHTML = gridHTML(it, { hl });
  on("[data-cc]", el => vTapCarry(it, +el.dataset.cc), $("#vg"));
  on("[data-ac]", el => { const k = +el.dataset.ac; if (it.v.opts.auto) return;
    if (it.sc === 0 && (v.phase === "check" || (v.phase === "input" && v.ans[k] != null))) { v.act = k; v.phase = "input"; v.ans[k] = null; vDraw(it); vAct(it); } }, $("#vg"));
}
function vBlocks(it){ const b = $("#blocks"); if (!b) return; b.classList.toggle("hide", !it.v.blocks); if (it.v.blocks) b.innerHTML = blocksHTML(it); }
function alignBtns(it, a){
  a.innerHTML = `<div class="row-btns center-row"><button class="btn sky arrow" data-mv="-1">◀</button><button class="btn sky arrow" data-mv="1">▶</button><button class="btn sun" data-al>✔ ${T("align_done")}</button></div>`;
  on("[data-mv]", el => { const W = it.p.cols.length, lb = len(it.p.b); it.v.off = Math.max(0, Math.min(W - lb, it.v.off + +el.dataset.mv)); xDraw(it); }, a);
  on("[data-al]", () => alignCheck(it), a);
}
function vAct(it){
  const v = it.v, a = $("#vact");
  if (v.phase === "input" || v.phase === "carry") { a.innerHTML = padHTML(false); on("[data-d]", el => vDigit(it, +el.dataset.d), a); }
  else if (v.phase === "align") alignBtns(it, a);
  else if (v.phase === "check") { a.innerHTML = `<div class="row-btns center-row"><button class="btn primary big" data-send>${T("send")} ✔</button></div>`; on("[data-send]", () => vSubmit(it), a); }
  else a.innerHTML = "";
}
function vEnterPhase(it){
  const v = it.v;
  if (v.phase === "align") { vMsg(it, "align_ask", {}, !v.opts.auto); vAct(it); return; }
  if (v.phase === "input") {
    if (it.sc === 2) { const pr = vPrompt(it); vMsg(it, pr[0], pr[1], true); }
    else if (it.sc === 1) { if (v.act === 0) vMsg(it, "v_type", {}, R.mode !== "challenge" && !v.spoke); v.spoke = true; }
    else vMsg(it, R.mode === "challenge" ? "chal_title" : "v_type", {}, false);
  }
  vAct(it);
}
function vTapCarry(it, k){
  const v = it.v; if (v.phase === "done" || v.phase === "align" || v.phase === "detect" || v.phase === "wait") return;
  if (v.phase === "carry") { if (k !== v.carryWant) return; v.carry[k] = 1; v.carryWant = -1; v.phase = "input"; sfx.tick(); vDraw(it); vNext(it); return; }
  v.carry[k] = v.carry[k] ? 0 : 1; sfx.tick(); vDraw(it);
}
function vDigit(it, d){
  const v = it.v, p = it.p; if (v.phase !== "input") return;
  const k = v.act, c = p.cols[k];
  v.ans[k] = d;
  if (it.sc === 0) { // 不立即檢查
    sfx.tick(); const nx = v.ans.findIndex((x, i) => x == null && i > k) >= 0 ? v.ans.findIndex((x, i) => x == null && i > k) : v.ans.findIndex(x => x == null);
    if (nx >= 0) { v.act = nx; vDraw(it); return; }
    v.phase = "check"; vDraw(it);
    if (it.lv >= 12 && R.mode !== "challenge" && !it.v.scanned) { it.v.scanned = true; vScan(it, () => { vMsg(it, "check_ask", {}, true); vAct(it); }); vMsg(it, "check_title", {}, true); $("#vact").innerHTML = ""; }
    else vAct(it);
    return;
  }
  if (d === c.out) {
    sfx.tick();
    if (c.cin && !v.carry[k]) { v.carry[k] = 1; if (it.sc === 1) vMsg(it, "self_noticed", {}, true); }
    vDraw(it);
    if (c.cout && it.sc === 2) { v.phase = "carry"; v.carryWant = k + 1; v.blocks = true; vBlocks(it);
      vMsg(it, k === 0 ? "carry_t" : "carry_h", { s:c.s }, true); vDraw(it);
      vAnimCarry(it, k, () => { vDraw(it); if (it.v.opts.auto) later(() => vTapCarry(it, k + 1), 900); }); return; }
    vNext(it); return;
  }
  // 答錯：判斷錯在哪裡
  let type = "fact";
  if (c.cin && d === (c.da + c.db) % 10) type = v.carry[k] ? "notadd" : "forgot";
  v.errs.push({ type, col:PL[k], typed:d, want:c.out }); v.helped = true;
  v.tries[k] = (v.tries[k] || 0) + 1; sfx.soft();
  if (v.tries[k] >= 2) { v.ans[k] = c.out; v.revealed = true; if (c.cin) v.carry[k] = 1; vDraw(it);
    $$(`.g-ac[data-ac="${k}"]`).forEach(e => e.classList.add("reveal"));
    vMsg(it, "show_answer", { s:c.out }, true); v.phase = "wait"; vAct(it);
    later(() => { v.phase = "input"; if (c.cout && !v.carry[k + 1]) v.carry[k + 1] = 1; vNext(it); }, 2200); return; }
  v.ans[k] = null; v.phase = "wait"; vAct(it); vDraw(it);
  $$(`.g-ac[data-ac="${k}"]`).forEach(e => e.classList.add("shake"));
  const pr = c.ha && c.hb ? [c.cin ? "fact_wrong_c" : "fact_wrong", { a:c.da, b:c.db }] : vPrompt(it);
  if (type === "forgot") { vSyncBlocks(it, k - 1); v.blocks = true; vBlocks(it); vMsg(it, k === 1 ? "forgot_t" : "forgot_h", {}, true);
    later(() => vAnimCarry(it, k - 1, () => { v.carry[k] = 1; v.phase = "input"; vDraw(it); later(() => { vMsg(it, pr[0], pr[1], true); vAct(it); }, 400); }), 1600); }
  else if (type === "notadd") { vMsg(it, "not_added", {}, true); $$(`.g-cc[data-cc="${k}"]`).forEach(e => e.classList.add("blink"));
    later(() => { v.phase = "input"; vDraw(it); vAct(it); }, 2200); }
  else { vSyncBlocks(it, k); v.blocks = true; vBlocks(it); $$(`.bcol[data-bk="${k}"]`).forEach(e => e.classList.add("focus"));
    vMsg(it, pr[0], pr[1], true);
    later(() => { v.phase = "input"; vDraw(it); vAct(it); }, 900); }
}
function vNext(it){
  const v = it.v, W = it.p.cols.length;
  if (v.act + 1 < W) { v.act++; v.phase = "input"; vDraw(it);
    if (it.sc === 2) { const pr = vPrompt(it); vMsg(it, pr[0], pr[1], true); }
    else if (it.sc === 1 && it.p.cols[v.act].extra) vMsg(it, "v_down", {}, true);
    vAct(it); if (v.opts.auto) later(() => autoStep(it), 1900); return; }
  vFinish(it);
}
function vFinish(it){
  const v = it.v; v.phase = "done"; vDraw(it); vAct(it);
  $$(".g-ac").forEach(e => e.classList.add("ok"));
  if (v.opts.onSolved) return v.opts.onSolved(v);
  if (it.demo) return;
  const result = v.revealed ? 0 : (v.helped || it.sc === 2) ? 1 : 2;
  const f = done(it, result, { errs:v.errs });
  feedback(it, result, f, result === 0 ? T("show_answer", { s:it.p.sum }) : null);
}
function vSubmit(it){
  const v = it.v, p = it.p; if (v.phase !== "check") return;
  const states = {}, errs = []; let bad = -1;
  p.cols.forEach(c => { const d = v.ans[c.k];
    if (d === c.out) { states[c.k] = "ok"; return; }
    states[c.k] = "no"; if (bad < 0) bad = c.k;
    let type = "fact"; if (c.cin && d === (c.da + c.db) % 10) type = v.carry[c.k] ? "notadd" : "forgot";
    errs.push({ type, col:PL[c.k], typed:d, want:c.out }); });
  v.phase = "done"; vAct(it);
  $("#vg").innerHTML = gridHTML(it, { states, act:-1 });
  if (bad < 0) { if (v.opts.onSolved) return v.opts.onSolved(v); const f = done(it, 2, { errs:[] }); return feedback(it, 2, f); }
  v.errs = errs; v.revealed = true;
  if (v.opts.onSolved && v.opts.word) return v.opts.onSolved(v);
  const f = done(it, 0, { errs });
  wrongEnd(it, f, `${p.a} + ${p.b} = ${p.sum}`, () => {
    vSyncBlocks(it, p.cols[bad].cin ? bad - 1 : bad); v.blocks = true; vBlocks(it); $$(`.bcol[data-bk="${bad}"]`).forEach(e => e.classList.add("focus"));
    if (p.cols[bad].cin) later(() => vAnimCarry(it, bad - 1, () => {}), 800); });
}
// 整題寫完才發現錯（無提示）：顯示正確答案，可以「再算一次（有提示）」
function wrongEnd(it, f, eqText, showBlocks){
  const fb = $("#fb");
  fb.className = "feedback try"; fb.innerHTML = `${T("wrong_end")}<div class="answer-show">${eqText}</div>`;
  sfx.soft(); sayId("wrong_end");
  if (R.mode === "challenge") { $("#after").innerHTML = `<button class="btn primary" data-next>${T("next")} 👉</button>`; on("[data-next]", nextItem, $("#after")); return; }
  showBlocks && showBlocks();
  $("#after").innerHTML = `<div class="row-btns center-row"><button class="btn sun" data-redo>🔁 ${T("redo")}</button><button class="btn primary" data-next>${T("next")} 👉</button></div>`;
  on("[data-redo]", () => { const copy = { lv:it.lv, kind:it.kind, p:it.p, sc:2, demo:true }; it.v = null; redo(copy); }, $("#after"));
  on("[data-next]", () => { if (f) return offerChallenge(it.lv); nextItem(); }, $("#after"));
}
// 「再算一次（有提示）」：不計分，算完回到下一題
function redo(copy){
  const fin = () => { sfx.good(); $("#fb").className = "feedback good"; $("#fb").innerHTML = T("good5") + " 👍"; sayId("good5");
    $("#after").innerHTML = `<button class="btn primary" data-next>${T("next")} 👉</button>`; on("[data-next]", nextItem, $("#after")); };
  copy.p.type === "s" ? renderS(copy, { onSolved:fin }) : renderV(copy, { onSolved:fin });
}
function vScan(it, cb){ // 驗算小習慣：從個位往上看一次
  const W = it.p.cols.length; let k = 0;
  const step = () => { if (k >= W) { vDraw(it); return cb(); }
    $("#vg").innerHTML = gridHTML(it, { hl:k, act:-1 }); k++; later(step, 650); };
  step();
}
// 對齊（加法、減法共用）
const xDraw = it => it.p.type === "s" ? sDraw(it) : vDraw(it);
const xEnter = it => it.p.type === "s" ? sEnterPhase(it) : vEnterPhase(it);
function alignCheck(it){
  const v = it.v, W = it.p.cols.length, want = W - len(it.p.b);
  const go = () => { v.phase = "input"; xDraw(it); xEnter(it); if (v.opts.auto) later(() => autoStep(it), 1500); };
  if (v.off === want) { sfx.good(); vMsg(it, "align_ok", {}, true); later(go, 900); return; }
  v.errs.push({ type:"align", col:"", typed:"", want:"" }); v.helped = true; sfx.soft();
  vMsg(it, "align_wrong", {}, true);
  const stepTo = () => { if (v.off === want) { later(go, 800); return; }
    v.off += v.off < want ? 1 : -1; xDraw(it); later(stepTo, 450); };
  $("#vact").innerHTML = ""; later(stepTo, 900);
}
// 積木板第一次出現時，把前面已經發生的進位補畫上去（upto 之前的位）
function vSyncBlocks(it, upto){ const v = it.v; if (v.synced) return; v.synced = true;
  for (let j = 0; j < upto; j++) if (it.p.cols[j].cout) { v.bgone[j] = true; v.bin[j + 1] = true; } }
// 一塊積木從 from 位飛到 to 位
function flyUnit(fromEl, toEl, cls, cb){
  const r1 = fromEl.getBoundingClientRect(), r2 = toEl.getBoundingClientRect();
  const fly = document.createElement("i"); fly.className = "fly " + cls;
  fly.style.left = (r1.left + r1.width / 2 - 10) + "px"; fly.style.top = (r1.top + r1.height / 2 - 20) + "px";
  document.body.appendChild(fly); sfx.whoosh();
  requestAnimationFrame(() => { fly.style.transform = `translate(${r2.left + r2.width / 2 - (r1.left + r1.width / 2)}px, ${r2.top + 20 - (r1.top + r1.height / 2)}px) scale(1.1)`; });
  later(() => { fly.remove(); cb && cb(); }, 950);
}
function vAnimCarry(it, k, cb){
  const v = it.v; v.blocks = true; vBlocks(it);
  const col = $(`.bcol[data-bk="${k}"]`), dst = $(`.bcol[data-bk="${k + 1}"]`);
  if (!col || !dst) { v.bgone[k] = true; v.bin[k + 1] = true; vBlocks(it); return cb && cb(); }
  const units = $$(".bunits i:not(.gone)", col).slice(0, 10);
  units.forEach(u => u.classList.add("grp"));
  later(() => { units.forEach(u => u.classList.add("gone"));
    flyUnit(col, dst.querySelector(".bunits"), k === 0 ? "rod" : "flat", () => { v.bgone[k] = true; v.bin[k + 1] = true; vBlocks(it); cb && cb(); }); }, 900);
}
// 示範（自動作答）
function autoStep(it){
  const v = it.v; if (!v || v.phase === "done") return;
  if (v.phase === "align") { const want = it.p.cols.length - len(it.p.b); if (v.off !== want) { v.off += v.off < want ? 1 : -1; xDraw(it); return later(() => autoStep(it), 700); } return alignCheck(it); }
  if (it.p.type === "s") return sAutoStep(it);
  if (v.phase === "input") return vDigit(it, it.p.cols[v.act].out);
}

/* ---------- 直式減法 ---------- */
const sRecv = (v, k) => v.lend[k + 1] ? 1 : 0;
const sEff = (p, v, k) => p.cols[k].da - v.lend[k] + 10 * sRecv(v, k);
const sCols = p => p.cols.filter(c => !c.lead).map(c => c.k);   // 要寫答案的位
function sInit(it, opts){
  const p = it.p, W = p.cols.length;
  it.v = { s:true, ans:Array(W).fill(null), lend:Array(W + 1).fill(0), blend:Array(W + 1).fill(0), act:0, errs:[], tries:{}, revealed:false, helped:false,
    phase: opts.align && len(p.b) < len(p.a) ? "align" : "input", blocks: it.sc === 2 && R.mode !== "challenge", off:null, want:-1, chain:[], opts };
}
// 上面那一列：被劃掉的數字、上方的小數字（借位後的新數）
function sTops(it, lendArr, o){
  const p = it.p, W = p.cols.length, out = [];
  for (let k = 0; k < W; k++) { const c = p.cols[k], recv = lendArr[k + 1] ? 1 : 0, eff = c.da - (lendArr[k] ? 1 : 0) + 10 * recv;
    out.push({ val:c.da, crossed:!!(lendArr[k] || recv), small:(lendArr[k] || recv) ? eff : null }); }
  if (o && o.nodecCol >= 0) { const k = o.nodecCol; out[k] = { val:p.cols[k].da, crossed:false, small:null }; }
  return out;
}
function sGridHTML(it, o){
  o = o || {};
  const p = it.p, v = it.v || {}, W = p.cols.length, act = o.act != null ? o.act : v.act, hl = o.hl != null ? o.hl : -1;
  const ans = o.digits || v.ans, tops = o.tops || sTops(it, v.lend || []);
  let h = `<span class="g-sign"></span>`;
  for (let d = 0; d < W; d++) { const k = W - 1 - d; h += `<span class="g-head pk${k} ${k === hl ? "hl" : ""}">${PL1[k]}</span>`; }
  h += `<span class="g-sign"></span>`;
  for (let d = 0; d < W; d++) { const k = W - 1 - d, t = tops[k]; h += `<span class="g-sm ${k === hl ? "hl" : ""}">${t.small == null ? "" : t.small}</span>`; }
  h += `<span class="g-sign"></span>`;
  for (let d = 0; d < W; d++) { const k = W - 1 - d, t = tops[k];
    h += `<button class="g-d g-td pk${k} ${t.crossed ? "crossed" : ""} ${v.want === k ? "blink" : ""} ${k === hl ? "hl" : ""}" data-td="${k}" aria-label="${PL[k]}的數字">${t.val}</button>`; }
  if (v.phase === "align" && !o.digits) h += alignRow(it, W, "−");
  else { h += `<span class="g-sign">−</span>`;
    for (let d = 0; d < W; d++) { const k = W - 1 - d, c = p.cols[k]; h += `<span class="g-d pk${k} ${k === hl ? "hl" : ""}">${c.hb ? c.db : ""}</span>`; } }
  h += `<span class="g-line" style="grid-column:1 / span ${W + 1}"></span><span class="g-sign"></span>`;
  for (let d = 0; d < W; d++) { const k = W - 1 - d, c = p.cols[k], val = ans[k], st = o.states ? o.states[k] || "" : "";
    if (c.lead) { h += `<span class="g-ac lead"></span>`; continue; }
    h += `<button class="g-ac pk${k} ${k === act && v.phase === "input" && !o.digits ? "cur" : ""} ${k === hl ? "hl" : ""} ${st}" data-ac="${k}">${val == null ? "" : val}</button>`; }
  return `<div class="vgrid s" style="--w:${W}">${h}</div>`;
}
function sBlocksHTML(it){
  const p = it.p, v = it.v, W = p.cols.length; let h = "";
  for (let d = 0; d < W; d++) { const k = W - 1 - d, c = p.cols[k], unit = ["cube", "rod", "flat", "flat"][k];
    const recv = v.blend[k + 1] ? 1 : 0, own = c.da - (v.blend[k] ? 1 : 0), n = own + 10 * recv, taken = v.ans[k] != null && v.ans[k] === c.out ? c.db : 0;
    let units = ""; for (let i = 0; i < n; i++) units += `<i class="${unit} ${i >= own ? "uc" : "ua"} ${i >= n - taken ? "gone" : ""}"></i>`;
    h += `<div class="bcol pk${k}" data-bk="${k}"><div class="blbl">${PL[k]}</div><div class="bunits">${units}</div></div>`; }
  return `<div class="bgrid" style="--w:${W}">${h}</div>`;
}
function renderS(it, opts){
  opts = opts || {};
  if (!it.v) sInit(it, opts);
  const v = it.v, p = it.p;
  if (v.phase === "align" && v.off == null) v.off = p.cols.length - len(p.a);
  vShell(it, opts);
  sDraw(it); sBlocks(it);
  sEnterPhase(it);
}
function sDraw(it){
  const v = it.v, hl = it.sc >= 1 && (v.phase === "input" || v.phase === "borrow") ? v.act : -1;
  $("#vg").innerHTML = sGridHTML(it, { hl });
  on("[data-td]", el => sTapLend(it, +el.dataset.td), $("#vg"));
  on("[data-ac]", el => { const k = +el.dataset.ac; if (v.opts.auto) return;
    if (it.sc === 0 && (v.phase === "check" || (v.phase === "input" && v.ans[k] != null))) { v.act = k; v.phase = "input"; v.ans[k] = null; sDraw(it); sAct(it); } }, $("#vg"));
}
function sBlocks(it){ const b = $("#blocks"); if (!b) return; b.classList.toggle("hide", !it.v.blocks); if (it.v.blocks) b.innerHTML = sBlocksHTML(it); }
function sShowBlocks(it){ const v = it.v; if (!v.blocks) { v.blocks = true; v.blend = v.lend.slice(); } sBlocks(it); }
function sAct(it){
  const v = it.v, a = $("#vact");
  if (v.phase === "input" || v.phase === "borrow") { a.innerHTML = padHTML(false); on("[data-d]", el => sDigit(it, +el.dataset.d), a); }
  else if (v.phase === "align") alignBtns(it, a);
  else if (v.phase === "check") { a.innerHTML = `<div class="row-btns center-row"><button class="btn primary big" data-send>${T("send")} ✔</button></div>`; on("[data-send]", () => sSubmit(it), a); }
  else if (v.phase === "verify") sVerifyUI(it);
  else a.innerHTML = "";
}
function sPrompt(it){
  const p = it.p, v = it.v, c = p.cols[v.act]; if (!c) return null;
  const e = sEff(p, v, c.k);
  if (!c.hb) return ["sv_col1", { p:plv(c.k), a:e }];
  if (c.k === 0) return ["sv_first", { a:e, b:c.db }];
  return ["sv_col", { p:plv(c.k), a:e, b:c.db }];
}
// 這一位需要借位但還沒借：設定要點哪一位（遇到 0 要先向更左邊借）
function sNeedBorrow(it){
  const p = it.p, v = it.v, k = v.act, c = p.cols[k];
  if (!c.borrow || sRecv(v, k)) return false;
  const k1 = k + 1, avail = p.cols[k1].da - v.lend[k1] + 10 * sRecv(v, k1);
  v.chain = avail >= 1 ? [k1] : [k1 + 1, k1];
  v.want = v.chain[0]; v.phase = "borrow";
  if (v.chain.length === 1) vMsg(it, "sv_need", { p:plv(k), a:sEff(p, v, k), b:c.db, q:plv(k1) }, true);
  else vMsg(it, "sv_zero", { q:plv(k1), r:plv(k1 + 1) }, true);
  sShowBlocks(it); sDraw(it);
  if (v.opts.auto) later(() => sTapLend(it, v.want), 1800);
  return true;
}
function sEnterPhase(it){
  const v = it.v;
  if (v.phase === "align") { vMsg(it, "align_ask", {}, !v.opts.auto); sAct(it); return; }
  if (v.phase === "input") {
    if (it.sc === 2) { if (!sNeedBorrow(it)) { const pr = sPrompt(it); vMsg(it, pr[0], pr[1], true); } }
    else if (it.sc === 1) { vMsg(it, "sv_type", {}, R.mode !== "challenge" && !v.spoke); v.spoke = true; }
    else vMsg(it, R.mode === "challenge" ? "chal_title" : "sv_type", {}, false);
  }
  sAct(it);
}
// 點上面的數字＝這一位借 1 給右邊
function sTapLend(it, k){
  const v = it.v, p = it.p;
  if (!["input", "borrow", "check"].includes(v.phase) || v.opts.detect) return;
  if (k < 1 || k >= p.cols.length) return;
  if (v.phase === "borrow" && k !== v.want) { sfx.soft(); return; }
  if (v.lend[k]) { if (v.phase === "borrow" || v.ans[k - 1] != null) return; v.lend[k] = 0; v.blend[k] = 0; sfx.tick(); sDraw(it); sBlocks(it); return; }   // 再點一次＝取消
  const avail = p.cols[k].da + 10 * sRecv(v, k);
  if (avail < 1) { sfx.soft(); vMsg(it, "s_cant", {}, true); return; }
  v.lend[k] = 1; sfx.tick(); if (v.phase === "check") v.phase = "input";
  sDraw(it);
  const after = () => {
    if (v.phase !== "borrow") { sAct(it); return; }
    v.chain.shift();
    if (v.chain.length) { v.want = v.chain[0]; vMsg(it, "sv_zero2", { q:plv(v.want), p:plv(v.want - 1) }, true); sDraw(it); if (v.opts.auto) later(() => sTapLend(it, v.want), 1600); return; }
    v.want = -1; v.phase = "input"; const c = p.cols[v.act];
    vMsg(it, "sv_got", { p:plv(v.act), a:sEff(p, v, v.act), b:c.db }, true); sDraw(it); sAct(it);
    if (v.opts.auto) later(() => sAutoStep(it), 1800);
  };
  if (v.blocks) sAnimBorrow(it, k, after); else after();
}
function sAnimBorrow(it, k, cb){
  const v = it.v; sBlocks(it);
  const col = $(`.bcol[data-bk="${k}"]`), dst = $(`.bcol[data-bk="${k - 1}"]`);
  if (!col || !dst) { v.blend[k] = 1; sBlocks(it); return cb && cb(); }
  const units = $$(".bunits i:not(.gone)", col); const u = units[units.length - 1];
  if (u) u.classList.add("grp");
  later(() => { if (u) u.classList.add("gone");
    flyUnit(col, dst.querySelector(".bunits"), k === 1 ? "rod" : "flat", () => { v.blend[k] = 1; sBlocks(it); later(() => cb && cb(), 500); }); }, 700);
}
function sDigit(it, d){
  const v = it.v, p = it.p; if (v.phase !== "input") return;
  const k = v.act, c = p.cols[k], cols = sCols(p);
  v.ans[k] = d;
  if (it.sc === 0) {
    sfx.tick(); const nx = cols.find(i => i > k && v.ans[i] == null); const nx2 = nx != null ? nx : cols.find(i => v.ans[i] == null);
    if (nx2 != null) { v.act = nx2; sDraw(it); return; }
    v.phase = it.lv >= VERIFY_FROM && R.mode !== "challenge" && !v.verified ? "verify" : "check"; sDraw(it);
    if (v.phase === "verify") vMsg(it, "verify_title", {}, true);
    sAct(it); return;
  }
  if (d === c.out) {
    sfx.tick();
    if (c.borrow && !sRecv(v, k)) { v.lend[k + 1] = 1; if (p.cols[k + 1] && p.cols[k + 1].borrow && !sRecv(v, k + 1)) v.lend[k + 2] = 1;
      if (it.sc === 1) vMsg(it, "s_self", {}, true); }
    if (c.lent && !v.lend[k]) v.lend[k] = 1;
    if (v.blocks) v.blend = v.lend.slice();
    sDraw(it); sBlocks(it); sNext(it); return;
  }
  // 答錯：判斷錯在哪裡
  let type = "sfact";
  if (c.borrow && !sRecv(v, k) && d === Math.abs(c.top - c.db)) type = "reverse";
  else if (c.da === 0 && (c.lent || c.borrow)) type = "zero";
  else if (c.lent && d === c.out + 1) type = "nodec";
  v.errs.push({ type, col:PL[k], typed:d, want:c.out }); v.helped = true;
  v.tries[k] = (v.tries[k] || 0) + 1; sfx.soft();
  const fixMarks = () => { if (c.borrow) { v.lend[k + 1] = 1; if (p.cols[k + 1] && p.cols[k + 1].borrow) v.lend[k + 2] = 1; } if (c.lent) v.lend[k] = 1; };
  if (v.tries[k] >= 2) { fixMarks(); v.ans[k] = c.out; v.revealed = true; if (v.blocks) v.blend = v.lend.slice(); sDraw(it); sBlocks(it);
    $$(`.g-ac[data-ac="${k}"]`).forEach(e => e.classList.add("reveal"));
    vMsg(it, "show_answer", { s:c.out }, true); v.phase = "wait"; sAct(it);
    later(() => { v.phase = "input"; sNext(it); }, 2200); return; }
  v.ans[k] = null; v.phase = "wait"; sAct(it); sDraw(it);
  $$(`.g-ac[data-ac="${k}"]`).forEach(e => e.classList.add("shake"));
  const retry = () => { v.phase = "input"; sDraw(it); sAct(it); const pr = sPrompt(it); vMsg(it, pr[0], pr[1], true); };
  if (type === "reverse") { sShowBlocks(it); $$(`.bcol[data-bk="${k}"]`).forEach(e => e.classList.add("focus")); vMsg(it, "s_reverse", {}, true);
    later(() => { v.phase = "input"; sNeedBorrow(it) || retry(); }, 2600); }
  else if (type === "nodec" || type === "zero") { fixMarks(); sShowBlocks(it); v.blend = v.lend.slice(); sBlocks(it); sDraw(it);
    vMsg(it, "s_nodec", { a:c.eff }, true); $$(`.g-td[data-td="${k}"]`).forEach(e => e.classList.add("blink"));
    later(retry, 2400); }
  else { sShowBlocks(it); $$(`.bcol[data-bk="${k}"]`).forEach(e => e.classList.add("focus"));
    vMsg(it, "s_wrong", { a:sEff(p, v, k), b:c.db }, true); later(() => { v.phase = "input"; sDraw(it); sAct(it); }, 900); }
}
function sNext(it){
  const v = it.v, p = it.p, nx = sCols(p).find(i => i > v.act);
  if (nx != null) { v.act = nx; v.phase = "input"; sDraw(it);
    if (it.sc === 2) { if (!sNeedBorrow(it)) { const pr = sPrompt(it); vMsg(it, pr[0], pr[1], true); } }
    sAct(it); if (v.opts.auto && v.phase === "input") later(() => sAutoStep(it), 1900); return; }
  const lead = p.cols.find(c => c.lead);
  if (lead && it.sc >= 1) vMsg(it, "sv_lead0", { p:plv(lead.k) }, true);
  if (it.lv >= VERIFY_FROM && R.mode !== "challenge" && !v.verified && !(it.demo && !v.opts.auto)) { later(() => { v.phase = "verify"; sDraw(it); vMsg(it, "verify_title", {}, true); sAct(it); if (v.opts.auto) later(() => sAutoStep(it), 1800); }, lead ? 1600 : 300); return; }
  sFinish(it);
}
const sHerAns = it => +sCols(it.p).slice().reverse().map(k => it.v.ans[k] == null ? 0 : it.v.ans[k]).join("");
function sVerifyUI(it){
  const v = it.v, p = it.p, a = $("#vact"), her = sHerAns(it); let typed = "", tries = 0;
  const line = () => `<div class="verify"><span>${T("verify_label")}</span><div class="expr small">${her} + ${p.b} = <span class="qm">${typed || "?"}</span></div></div>`;
  a.innerHTML = line() + padHTML(true);
  const upd = () => { a.querySelector(".verify").outerHTML = line(); };
  on("[data-d]", el => { if (typed.length < 4) { typed += el.dataset.d; upd(); } }, a);
  on("[data-back]", () => { typed = typed.slice(0, -1); upd(); }, a);
  on("[data-ok]", () => { if (!typed) return; const sum = her + p.b;
    if (+typed !== sum && tries === 0) { tries++; sfx.soft(); typed = ""; upd(); vMsg(it, "verify_again", { s:her, b:p.b }, true); return; }
    v.verified = true;
    if (sum === p.a) { sfx.good(); vMsg(it, "verify_ok", { s:her, b:p.b, a:p.a }, true); a.innerHTML = "";
      later(() => { if (it.sc === 0) { v.phase = "check"; sSubmit(it); } else sFinish(it); }, 1600); }
    else { sfx.soft(); vMsg(it, "verify_bad", { s:her, b:p.b, t:sum, a:p.a }, true); v.phase = "check"; sDraw(it); sAct(it); } }, a);
}
function sFinish(it){
  const v = it.v; v.phase = "done"; sDraw(it); sAct(it);
  $$(".g-ac:not(.lead)").forEach(e => e.classList.add("ok"));
  if (v.opts.onSolved) return v.opts.onSolved(v);
  if (it.demo) return;
  const result = v.revealed ? 0 : (v.helped || it.sc === 2) ? 1 : 2;
  const f = done(it, result, { errs:v.errs });
  feedback(it, result, f, result === 0 ? T("show_answer", { s:it.p.diff }) : null);
}
function sSubmit(it){
  const v = it.v, p = it.p; if (v.phase !== "check") return;
  const states = {}, errs = []; let bad = -1;
  sCols(p).forEach(k => { const c = p.cols[k], d = v.ans[k];
    if (d === c.out) { states[k] = "ok"; return; }
    states[k] = "no"; if (bad < 0) bad = k;
    let type = "sfact";
    if (c.borrow && !sRecv(v, k) && d === Math.abs(c.top - c.db)) type = "reverse";
    else if (c.da === 0 && (c.lent || c.borrow)) type = "zero";
    else if (c.lent && d === c.out + 1) type = "nodec";
    errs.push({ type, col:PL[k], typed:d, want:c.out }); });
  v.phase = "done"; sAct(it);
  $("#vg").innerHTML = sGridHTML(it, { states, act:-1 });
  if (bad < 0) { if (v.opts.onSolved) return v.opts.onSolved(v); const r = v.helped ? 1 : 2; const f = done(it, r, { errs:v.errs }); return feedback(it, r, f); }
  v.errs = v.errs.concat(errs); v.revealed = true;
  if (v.opts.onSolved && v.opts.word) return v.opts.onSolved(v);
  const f = done(it, 0, { errs:v.errs });
  wrongEnd(it, f, `${p.a} − ${p.b} = ${p.diff}`, () => {
    v.lend = p.cols.map(c => c.lent).concat([0]); v.blocks = true; v.blend = v.lend.slice(); sBlocks(it);
    $("#vg").innerHTML = sGridHTML(it, { states, act:-1 }); $$(`.bcol[data-bk="${bad}"]`).forEach(e => e.classList.add("focus")); });
}
function sAutoStep(it){
  const v = it.v; if (!v || v.phase === "done") return;
  if (v.phase === "align") return autoStep(it);
  if (v.phase === "borrow") return sTapLend(it, v.want);
  if (v.phase === "input") return sDigit(it, it.p.cols[v.act].out);
  if (v.phase === "verify") { const a = $("#vact"); String(sHerAns(it) + it.p.b).split("").forEach(ch => a.querySelector(`[data-d="${ch}"]`).click()); a.querySelector("[data-ok]").click(); }
}

/* ---------- 文字題 ---------- */
function wordHTML(it, picked){
  const t = it.p.word; let pi = 0;
  const html = (t.z || []).map(s => {
    if (typeof s === "string") { const name = s.slice(1, -1), val = it.p[name];
      return `<button class="btn numtok ${picked.includes(name) ? "on" : ""}" data-tok="${name}">${val}</button>`; }
    if (s[1]) return `<ruby>${esc(s[0])}<rt>${esc(s[1])}</rt></ruby>`;
    return esc(s[0]).replace(/\d+/g, m => `<button class="btn numtok x" data-tok="x${pi++}">${m}</button>`);
  }).join("");
  return `<div class="story">📜 ${html}</div>`;
}
const needOp = it => it.lv === 116;
function renderWord(it, opts){
  opts = opts || {};
  const p = it.p, picked = it.picked || (it.picked = []);
  if (it.wphase === "solve") return wordSolve(it, opts);
  if (it.wphase === "op") return wordOp(it, opts);
  app.innerHTML = (opts.demo ? demoBar() : qbar(tagOf(it))) +
    `<div class="qcard word">${wordHTML(it, picked)}<div class="vmsg" id="vmsg">${T("word_pick")}</div><div class="feedback" id="fb"></div><div id="after"></div></div>`;
  if (opts.demo) bindSettings(); else bindQbar();
  if (!it.spoke) { it.spoke = true; say(segsPlain(p.word.z, { a:p.a, b:p.b }) + "。" + P("word_pick")); }
  const nextPhase = () => { it.wphase = needOp(it) ? "op" : "solve"; };
  on("[data-tok]", el => { if (opts.demo) return; const tk = el.dataset.tok;
    if (tk === "a" || tk === "b") { if (!picked.includes(tk)) { picked.push(tk); sfx.tick(); } }
    else { sfx.soft(); el.classList.add("shake"); const m = $("#vmsg"); if (m) m.innerHTML = T("word_pick_wrong"); sayId("word_pick_wrong"); it.wHelped = true; return; }
    if (picked.length === 2) { nextPhase(); later(() => renderWord(it, opts), 500); } else renderWord(it, opts); });
  if (opts.demo && picked.length === 0) later(() => { picked.push("a"); renderWord(it, opts); }, 2600);
  if (opts.demo && picked.length === 1) later(() => { picked.push("b"); nextPhase(); renderWord(it, opts); }, 1400);
}
function wordOp(it, opts){
  const op = it.p.word.op;
  app.innerHTML = (opts.demo ? demoBar() : qbar(tagOf(it))) +
    `<div class="qcard word">${wordHTML(it, ["a", "b"])}<div class="vmsg" id="vmsg">${T("op_ask")}</div>
     <div class="row-btns center-row opbtns"><button class="btn big" data-op="add">${T("op_add")}</button><button class="btn big" data-op="sub">${T("op_sub")}</button></div>
     <div class="feedback" id="fb"></div><div id="after"></div></div>`;
  if (opts.demo) bindSettings(); else bindQbar();
  sayId("op_ask");
  const choose = o => { if (o === op) { sfx.good(); $(`[data-op="${o}"]`).classList.add("sun"); it.wphase = "solve"; later(() => renderWord(it, opts), 700); }
    else { sfx.soft(); $(`[data-op="${o}"]`).classList.add("shake"); $("#vmsg").innerHTML = T("op_wrong"); sayId("op_wrong"); it.wHelped = true; } };
  on("[data-op]", el => { if (!opts.demo) choose(el.dataset.op); });
  if (opts.demo) later(() => choose(op), 2200);
}
function wordSolve(it, opts){
  const p = it.p, isSub = p.type === "s";
  const r = isSub ? renderS : renderV;
  r(it, { align:true, auto:opts.auto, demo:opts.demo, word:true, wordHTML:wordHTML(it, ["a", "b"]),
    onSolved: v => {
      const ansTxt = (isSub ? p.diff : p.sum) + " " + P(p.word.u);
      const fb = $("#fb");
      if (opts.demo) { fb.className = "feedback good"; fb.innerHTML = T("word_answer", { s:ansTxt }); say(P("word_answer", { s:ansTxt })); return opts.onDone && opts.onDone(); }
      const result = v.revealed ? 0 : (v.helped || it.wHelped || it.sc === 2) ? 1 : 2;
      const f = done(it, result, { errs:v.errs });
      feedback(it, result, f, result ? T("word_answer", { s:ansTxt }) : `${T("wrong_end")}<div class="answer-show">${p.a} ${isSub ? "−" : "+"} ${p.b} = ${isSub ? p.diff : p.sum}</div>${T("word_answer", { s:ansTxt })}`);
      if (result) say(P("word_answer", { s:ansTxt }));
      it.noAuto = true;
    } });
  if (opts.auto) later(() => autoStep(it), 1500);
}

/* ---------- 找錯偵探 ---------- */
function detectMon(){ return pick(D.monsters.filter(m => MON_LV[m.id] && gStage(MON_LV[m.id]) >= 1)) || D.monsters[0]; }
function detectFrame(it, m, reasons, gridFn, explain){
  const d = it.d; let stage = "col";
  app.innerHTML = qbar(tagOf(it)) + `<div class="qcard v detect">
    <div class="dhead">${MON.draw(m.id, 1)}<div class="vmsg" id="vmsg">${T("detect_ask", { m:m.zname })}</div></div>
    <div class="vmain"><div id="vg"></div><div id="blocks" class="blocks hide"></div></div><div id="vact"></div>
    <div class="feedback" id="fb"></div><div id="after"></div></div>`;
  bindQbar(); sayId("detect_ask", { m:m.zname });
  const draw = states => { $("#vg").innerHTML = gridFn(states); on("[data-ac]", el => { if (stage === "col") pickCol(+el.dataset.ac); }, $("#vg")); };
  let partial = false;
  const pickCol = k => {
    if (k === d.bad.col || (d.also >= 0 && k === d.also)) { stage = "why"; sfx.tick(); const st = {}; st[d.bad.col] = "no"; if (k !== d.bad.col) { st[k] = "no"; partial = true; } draw(st);
      $("#vmsg").innerHTML = (partial ? T("detect_root") + "<br>" : "") + T("detect_why"); partial ? say(P("detect_root") + P("detect_why")) : sayId("detect_why");
      $("#vact").innerHTML = `<div class="opts">${shuffle(reasons).map(o => `<button class="btn opt" data-why="${o}">${T("why_" + o)}</button>`).join("")}</div>`;
      on("[data-why]", el => { if (stage !== "why") return; stage = "end"; const ok = el.dataset.why === d.bad.type;
        $$("[data-why]").forEach(b => b.classList.add(b.dataset.why === d.bad.type ? "right" : b === el ? "wrong" : "dim"));
        explain(draw); const result = ok && !partial ? 2 : 1; const f = done(it, result, {});
        feedback(it, result, f, ok ? T("detect_right") : T("why_" + d.bad.type)); if (ok) sayId("detect_right"); else sayId("why_" + d.bad.type); it.noAuto = true; }, $("#vact"));
    } else { stage = "end"; sfx.soft(); const st = {}; st[k] = "dim"; st[d.bad.col] = "no"; draw(st);
      $("#vmsg").innerHTML = T("detect_wrong"); sayId("detect_wrong"); later(() => explain(draw), 1200);
      const f = done(it, 0, {}); feedback(it, 0, f, T("why_" + d.bad.type)); }
  };
  draw({});
}
function renderDetect(it){
  const d = it.d, p = d.p; it.p = p; it.lv = d.lv;
  const digits = d.digits.slice(), marks = d.marks.slice();
  it.v = { ans:digits, carry:marks, act:-1, phase:"detect", bgone:{}, bin:{}, opts:{}, carryWant:-1 };
  detectFrame(it, detectMon(), ["forgot", "notadd", "fact"], states => gridHTML(it, { digits, marks, act:-1, states }), draw => {
    const k = d.bad.col, c = p.cols[k];
    const fix = () => { digits[k] = c.out; marks[k] = c.cin; const st = {}; st[k] = "ok"; draw(st); };
    if (d.bad.type === "forgot" && c.cin) { vSyncBlocks(it, k - 1); it.v.blocks = true; vBlocks(it); later(() => vAnimCarry(it, k - 1, fix), 600); } else fix(); });
}
function renderDetectS(it){
  const d = it.d, p = d.p; it.p = p; it.lv = d.lv;
  const digits = d.digits.slice(); let lend = d.lend.slice(), nodecCol = d.nodecCol;
  it.v = { s:true, ans:digits, lend, act:-1, phase:"detect", want:-1, opts:{ detect:true } };
  detectFrame(it, detectMon(), ["reverse", "nodec", "sfact"], states => sGridHTML(it, { digits, tops:sTops(it, lend, { nodecCol }), act:-1, states }), draw => {
    const k = d.bad.col; digits[k] = p.cols[k].out; if (d.also >= 0) digits[d.also] = p.cols[d.also].out; lend = p.cols.map(c => c.lent).concat([0]); nodecCol = -1;
    const st = {}; st[k] = "ok"; if (d.also >= 0) st[d.also] = "ok"; draw(st); });
}

/* ---------- 示範 ---------- */
function renderDemo(n, next){
  clearTimers();
  const lv = LV[n], p = genProblem(n), it = { lv:n, kind:"p", p, sc:2, demo:true };
  const go = () => { $("#after").innerHTML = `<button class="btn primary big" data-dgo>${T("demo_go")} 👉</button>`; on("[data-dgo]", next, $("#after")); sayId("demo_go"); };
  if (lv.kind === "word") { renderWord(it, { demo:true, auto:true, onDone:go }); return; }
  if (p.type === "v" || p.type === "s") {
    const fin = () => { $("#vmsg").innerHTML = ""; $("#fb").className = "feedback good"; $("#fb").innerHTML = `${p.a} ${p.type === "s" ? "−" : "+"} ${p.b} = ${p.type === "s" ? p.diff : p.sum} ✨`; go(); };
    (p.type === "s" ? renderS : renderV)(it, { demo:true, auto:true, onSolved:fin });
    later(() => autoStep(it), 2600); return; }
  renderFact(it, { auto:go });
}
function renderChalIntro(){
  const n = R.lvT;
  app.innerHTML = qbar("⚔️ 道館挑戰") + `<div class="qcard center"><div class="gym">${drawGuard(n, { awake:true })}</div>
    <div class="say">${T("chal_title")}</div><div class="say sub">${lvLabel(n)}　${segsHTML(LV[n].zname)}　${segsHTML(LV[n].zdesc)}</div>
    <button class="btn sun big" data-cgo>⚔️ 開始挑戰</button></div>`;
  bindQbar(); sayId("chal_title"); on("[data-cgo]", renderItem);
}

/* ---------- 結算 ---------- */
function finishRound(quit, toChallenge){
  clearTimers(); hasTTS && speechSynthesis.cancel();
  if (!R) return renderHome();
  const total = R.res.length;
  const secs = Math.round((Date.now() - R.t0) / 1000);
  addToday(secs);
  let chalMsg = "", events = [];
  if (R.mode === "challenge" && !quit) {
    const n = R.lvT, okN = R.res.filter(r => r.result > 0).length, pass = okN >= Math.ceil(CHAL_N * 0.8), s = L(n);
    s.chal++; S.starBank += EGG_COST;
    if (pass) { const first = !s.passed; s.passed = true; addXp(n, 10); S.stars += 3; S.totalStars += 3; R.starsWon += 3;
      const nx = nextLv(n);
      if (first && nx && inCap(nx) && !L(nx).unlocked) { L(nx).unlocked = true; events.push({ mon:GUARD(nx), stage:0, title:P("new_egg"), sub:`${lvLabel(nx)}：${LV[nx].name}` }); } }
    chalMsg = `<div class="say">${pass ? T("chal_pass") : T("chal_fail")}</div><div class="say sub">✅ ${okN} / ${CHAL_N}　🥚 ${T("egg_gift")}</div>`;
    pass ? sayId("chal_pass") : sayId("chal_fail");
  }
  if (total > 0 || R.warm != null) record(secs);
  if (quit && !toChallenge) { save(); R = null; return renderHome(); }
  if (toChallenge) { save(); R = null; return; }
  events = gatherEvents().concat(events);
  const lvups = ALL.filter(n => L(n).unlocked && mlv(L(n).xp) > (R.lvBefore[n] || 1));
  const errTypes = {}; R.errs.forEach(e => errTypes[e.type] = (errTypes[e.type] || 0) + 1);
  const topErr = Object.entries(errTypes).sort((a, b) => b[1] - a[1])[0];
  const okN = R.res.filter(r => r.result > 0).length;
  const pi = partnerInfo();
  const ready = [curLevel("add"), curLevel("sub")].filter(n => n && canChallenge(n) && !L(n).passed);
  app.innerHTML = `<div class="topbar"><div class="title">🏰 ${esc("安安的數字城堡")}</div>${settingsBtns()}</div>
    <div class="qcard result center">
      ${pi ? `<div class="partner">${MON.draw(pi.id, pi.st)}</div>` : ""}
      <div class="bigstar">⭐ +${R.starsWon}</div>
      ${total && R.mode !== "challenge" ? `<div class="say">答對 ${okN} / ${total} 題</div>` : ""}
      ${chalMsg}
      ${lvups.length ? `<div class="lvups">${lvups.map(n => `<div class="lvup">${drawGuard(n, { awake:true })}<div>${segsHTML(monName(GUARD(n)))}<br><b class="num">Lv.${R.lvBefore[n]} → Lv.${mlv(L(n).xp)}</b></div></div>`).join("")}</div>` : ""}
      ${topErr && topErr[0] !== "hint" ? `<div class="tipkid">💡 這次要注意：<b>${ERR[topErr[0]].name}</b></div>` : ""}
      <div class="row-btns">
        ${ready.map(n => `<button class="btn sun" data-chal="${n}">⚔️ 道館挑戰：${lvLabel(n)}</button>`).join("")}
        <button class="btn primary go" data-again>⚡ 再一回</button><button class="btn" data-home2>🏠 回首頁</button></div>
    </div>`;
  bindSettings();
  const again = R.mode === "practice" ? () => startPractice(R.lvT) : () => startAdventure();
  R = null; save();
  on("[data-again]", again); on("[data-home2]", renderHome); on("[data-chal]", el => startChallenge(+el.dataset.chal));
  later(() => showEvents(events), 500);
}
function gatherEvents(){
  const ev = [];
  ALL.forEach(n => { const s = L(n); if (!s.unlocked) return; const st = gStage(n);
    if (st > s.stage) { if (st >= 1) ev.push({ mon:GUARD(n), stage:st, title:st === 1 ? P("hatch") : P("evolve"), sub:`${lvLabel(n)}的守護怪獸　Lv.${mlv(s.xp)}` });
      if (st >= 1 && !S.partner) S.partner = GUARD(n); s.stage = st; } });
  while (S.starBank >= EGG_COST) { const left = STAR_MONS.filter(id => !S.sm[id]); if (!left.length) { S.starBank = 0; break; }
    S.starBank -= EGG_COST; const id = pick(left); S.sm[id] = { stage:1, at:S.totalStars };
    ev.push({ mon:id, stage:1, title:"星星蛋" + P("hatch"), sub:"集滿 " + EGG_COST + " 顆星星的獎勵" }); }
  Object.entries(S.sm).forEach(([id, m]) => { const want = S.totalStars - m.at >= 100 ? 3 : S.totalStars - m.at >= 40 ? 2 : 1;
    if (want > m.stage) { m.stage = want; ev.push({ mon:id, stage:want, title:P("evolve"), sub:"一直答對題目，牠長大了" }); } });
  save(); return ev;
}
function showEvents(ev, cb){
  if (!ev.length) return cb && cb();
  const e = ev.shift(), m = MON.get(e.mon); sfx.hatch();
  const ov = document.createElement("div"); ov.className = "overlay";
  const show = () => { ov.innerHTML = `<div class="box pop"><h2 style="margin:0">🎉 ${segsHTML(m.zname)} ${esc(e.title)}</h2>${MON.draw(e.mon, e.stage)}
    <div class="muted">${esc(e.sub)}</div><button class="btn primary" style="margin-top:14px;min-width:200px" data-ok>好耶！</button></div>`;
    say(m.zh + " " + e.title); ov.querySelector("[data-ok]").onclick = () => { ov.remove(); showEvents(ev, cb); }; };
  if (e.stage === 0) { show(); }
  else { ov.innerHTML = `<div class="box"><div class="wobble" style="display:inline-block">${MON.draw(e.mon, e.stage === 1 ? 0 : e.stage - 1)}</div></div>`; setTimeout(show, 1400); }
  document.body.appendChild(ov);
}

/* ---------- 紀錄 ---------- */
function addToday(sec){ const d = ymd(new Date()); if (S.today.d !== d) S.today = { d, sec:0 }; S.today.sec += sec; }
const lvCode = n => (n > 100 ? "減" : "加") + pad2(dn(n));   // 試算表用：加01…加20、減01…減16
function record(secs){
  const modeName = R.mode === "challenge" ? "道館挑戰" : R.mode === "practice" ? "練習場" : "冒險";
  const lvls = [...new Set(R.res.map(r => r.lv))].sort((a, b) => a - b);
  const et = {}; R.errs.forEach(e => et[e.type] = (et[e.type] || 0) + 1);
  const cA = curLevel("add"), cS = curLevel("sub");
  const round = { time:stamp(), date:ymd(new Date()), mode:modeName + (R.lvT ? `（${lvLabel(R.lvT)}）` : ""), levels:lvls.map(lvCode).join(","),
    total:R.res.length, correct:R.res.filter(r => r.result > 0).length, self:R.res.filter(r => r.result === 2).length, seconds:secs,
    errors:Object.entries(et).map(([k, v]) => ERR[k].name + "×" + v).join("、"), warm:R.warm == null ? "" : R.warm,
    cur:`加法 ${cA ? dn(cA) : "全過"}／減法 ${cS ? dn(cS) : "全過"}`, passed:passedList("add").length + "+" + passedList("sub").length, stars:S.totalStars,
    challenge: R.mode === "challenge" ? (L(R.lvT).passed ? "過關" : "未過") : "" };
  const errs = R.errs.map(e => ({ time:round.time, level:lvCode(e.lv), levelName:LV[e.lv].name, prob:e.prob, col:e.col || "", type:ERR[e.type].name, typed:e.typed == null ? "" : e.typed, want:e.want == null ? "" : e.want }));
  const touched = [...new Set(R.res.map(r => r.lv).concat(Object.keys(R.xp).map(Number)))];
  const levels = touched.map(n => { const s = L(n), l = mlv(s.xp);
    return { n:lvCode(n), name:LV[n].name, status:s.passed ? "🏅 過關" : s.unlocked ? "練習中" : "🔒", mon:MON.get(GUARD(n)).zh, lv:l,
      form:["蛋", "幼年", "成長", "完全體"][stageByLv(l)], xp:s.xp, recent:last10(n).length ? selfCount(n) + "/" + last10(n).length : "", cnt:s.cnt, ok:s.ok,
      forgot:s.err.forgot || 0, notadd:s.err.notadd || 0, fact:s.err.fact || 0, reverse:s.err.reverse || 0, nodec:s.err.nodec || 0, sfact:s.err.sfact || 0, zero:s.err.zero || 0,
      align:s.err.align || 0, hint:s.err.hint || 0, last:stamp() }; });
  S.queue.push({ kid:KID, name:NAME, round, errs, levels });
  if (S.queue.length > 300) S.queue = S.queue.slice(-300);
  save(); flush();
}
let flushing = false;
async function flush(){
  if (flushing || !CFG.endpoint || !navigator.onLine || !S.queue.length) return;
  flushing = true;
  try { while (S.queue.length) { await fetch(CFG.endpoint, { method:"POST", mode:"no-cors", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body:JSON.stringify(S.queue[0]) });
      S.queue.shift(); save(); } } catch(e){} finally { flushing = false; }
}
window.addEventListener("online", flush);

/* ---------- 首頁、地圖、圖鑑 ---------- */
function pushScreen(){ try { history.pushState({ s:1 }, ""); } catch(e){} }
window.addEventListener("popstate", () => { clearTimers(); document.querySelectorAll(".overlay").forEach(o => o.remove()); R = null; renderHome(); });
function heroHTML(){
  const pi = partnerInfo();
  let mon, name, sub = "";
  if (pi) { mon = MON.draw(pi.id, pi.st); name = segsHTML(MON.get(pi.id).zname);
    if (pi.n) sub = `<div class="lvline"><b class="num">Lv.${mlv(L(pi.n).xp)}</b><div class="meter"><i style="width:${xpBar(pi.n)}%"></i></div></div>`; }
  else { const n = curLevel("add") || curLevel("sub") || 1; mon = drawGuard(n, { awake:true }); name = "答對題目，蛋就會孵出來！"; }
  return `<div class="partner">${mon}<div class="name">${name}</div>${sub}</div>`;
}
function curLine(tr){ const n = curLevel(tr), icon = tr === "add" ? "➕" : "➖";
  return n ? `<div class="curlv ${tr}"><span class="trk">${icon} ${trName(n)}</span><b>第 ${dn(n)} 關</b> ${segsHTML(LV[n].zname)}<div class="muted">${segsHTML(LV[n].zdesc)}　例：${esc(LV[n].ex)}</div></div>`
           : `<div class="curlv ${tr}"><span class="trk">${icon} ${tr === "add" ? "加法" : "減法"}</span>🏆 全部過關了！</div>`; }
function renderHome(){
  clearTimers(); R = null; applySettings();
  const ready = [curLevel("add"), curLevel("sub")].filter(n => n && canChallenge(n) && !L(n).passed);
  const sl = passedList().filter(sleepy);
  const eggLeft = EGG_COST - (S.starBank % EGG_COST);
  const map = (tr, title) => `<h2>${title}</h2>` + D.regions.filter(rg => rg.tr === tr).map(rg => `<div class="region r-${rg.id}"><h3>${segsHTML(rg.zname)}</h3><div class="levels">${rg.levels.map(n => levelTile(n)).join("")}</div></div>`).join("");
  app.innerHTML = `<div class="topbar"><div class="title" id="ttl">🏰 安安的數字城堡</div><span class="pill">⭐ ${S.stars}</span>${settingsBtns()}</div>
    <section class="hero">${heroHTML()}
      <div><div class="say">${T("hello")}</div>
        ${curLine("add")}${curLine("sub")}
        <div class="muted">🥚 再 ${eggLeft} ⭐ 孵一顆星星蛋</div>
        <div style="margin-top:12px"><button class="btn primary go" data-go>⚡ ${T("go")}</button></div>
        ${ready.map(n => `<button class="btn sun wide1" data-chal="${n}">⚔️ ${T("chal_ready")} ${lvLabel(n)}</button>`).join("")}
      </div></section>
    ${sl.length ? `<button class="btn sleepy-bar" data-wake="${sl[0]}">${drawGuard(sl[0])}<span>${T("sleepy", { m:monName(GUARD(sl[0])) })}</span></button>` : ""}
    <div class="row-btns"><button class="btn" data-dex>📖 我的圖鑑</button><button class="btn" data-practice>🎯 練習場</button></div>
    ${map("add", "🏰 加法城堡地圖")}
    ${map("sub", "⛏️ 減法王國地圖")}
    <p class="muted" style="margin-top:18px">每一關最近 10 題有 8 題自己算對，就能挑戰道館；連續答對 3 題也可以直接挑戰！</p>`;
  bindSettings();
  on("[data-go]", () => { say(" "); startAdventure(); });
  on("[data-chal]", el => startChallenge(+el.dataset.chal));
  on("[data-dex]", renderDex); on("[data-practice]", renderPracticeList);
  on("[data-wake]", el => startPractice(+el.dataset.wake));
  on("[data-lv]", el => openLevel(+el.dataset.lv));
  bindParentGesture($("#ttl"));
  flush();
}
function levelTile(n){
  const s = L(n), locked = !s.unlocked || !inCap(n), cur = curLevel(TR(n)) === n;
  return `<button class="btn lvtile ${locked ? "locked" : ""} ${cur ? "now" : ""} ${s.passed ? "passed" : ""}" data-lv="${n}">
    <span class="lvn ${TR(n)}">${dn(n)}</span>${locked ? MON.draw(GUARD(n), 1, { silhouette:true }) : drawGuard(n)}
    <span class="lvname">${segsHTML(LV[n].zname)}</span>
    <span class="lvsub">${locked ? "🔒" : `Lv.${mlv(s.xp)}${s.passed ? " 🏅" : ""}`}</span></button>`;
}
function openLevel(n){
  const s = L(n);
  if (!inCap(n)) return toast(`家長設定：${trName(n)}目前最高玩到第 ${dn(capOf(TR(n)))} 關`);
  if (!s.unlocked) return toast(`先通過${lvLabel(prevLv(n))}的道館，就能打開這一關！`);
  const ov = document.createElement("div"); ov.className = "overlay";
  const l = mlv(s.xp), m = MON.get(GUARD(n));
  ov.innerHTML = `<div class="box pop lvbox"><button class="btn small close" data-x>✕</button>
    <div>${drawGuard(n)}</div><div class="say">${gStage(n) >= 1 ? segsHTML(m.zname) : "守護怪獸蛋"}　<b class="num">Lv.${l}</b></div>
    <div class="meter"><i style="width:${xpBar(n)}%"></i></div>
    <div class="muted">${l < 5 ? "Lv.5 孵化" : l < 15 ? "Lv.15 進化" : l < 30 ? "Lv.30 完全體" : "已經是完全體了！"}</div>
    <h3 style="margin:10px 0 2px">${lvLabel(n)}　${segsHTML(LV[n].zname)}</h3><div>${segsHTML(LV[n].zdesc)}　例：${esc(LV[n].ex)}</div>
    <div class="muted">最近 10 題自己算對 ${selfCount(n)} 題${s.passed ? "　🏅 已過關" : ""}</div>
    <div class="row-btns"><button class="btn primary" data-p>🎯 練習這一關</button>${canChallenge(n) ? `<button class="btn sun" data-c>⚔️ 道館挑戰</button>` : ""}</div></div>`;
  document.body.appendChild(ov);
  ov.querySelector("[data-x]").onclick = () => ov.remove();
  ov.querySelector("[data-p]").onclick = () => { ov.remove(); startPractice(n); };
  const c = ov.querySelector("[data-c]"); if (c) c.onclick = () => { ov.remove(); startChallenge(n); };
}
function renderPracticeList(){
  pushScreen();
  app.innerHTML = `<div class="topbar"><button class="btn small" data-home>🏠</button><div class="title">🎯 練習場</div>${settingsBtns()}</div>
    <p class="muted">選一關來練習。練習也會讓那一關的守護怪獸長大！</p>
    <h2>➕ 加法</h2><div class="levels">${unlocked("add").map(n => levelTile(n)).join("")}</div>
    <h2>➖ 減法</h2><div class="levels">${unlocked("sub").map(n => levelTile(n)).join("")}</div>`;
  on("[data-home]", renderHome); bindSettings(); on("[data-lv]", el => startPractice(+el.dataset.lv));
}
function renderDex(){
  pushScreen();
  const cells = ALL.map(n => ({ id:GUARD(n), st:gStage(n), sub:lvLabel(n), lv:L(n).unlocked ? mlv(L(n).xp) : 0, n }));
  STAR_MONS.forEach(id => cells.push({ id, st:S.sm[id] ? S.sm[id].stage : -1, sub:"星星蛋" }));
  const got = cells.filter(c => c.st >= 1).length;
  app.innerHTML = `<div class="topbar"><button class="btn small" data-home>🏠</button><div class="title">📖 我的圖鑑　${got} / ${cells.length}</div>${settingsBtns()}</div>
    <p class="muted">點一下已經孵出來的怪獸，牠就會當你的夥伴。</p>
    <div class="dex">${cells.map(c => { const m = MON.get(c.id);
      const pic = c.st >= 1 ? (c.n ? drawGuard(c.n) : MON.draw(c.id, c.st)) : c.st === 0 ? drawGuard(c.n) : MON.draw(c.id, 1, { silhouette:true });
      return `<button class="btn cell ${S.partner === c.id ? "partner" : ""}" data-pp="${c.st >= 1 ? c.id : ""}">${pic}
        ${c.st >= 1 ? `<b>${segsHTML(m.zname)}</b>` : `<b>？？？</b>`}<span class="muted" style="font-size:14px">${esc(c.sub)}${c.lv ? "　Lv." + c.lv : ""}</span></button>`; }).join("")}</div>`;
  on("[data-home]", renderHome); bindSettings();
  on("[data-pp]", el => { if (el.dataset.pp) { S.partner = el.dataset.pp; save(); renderDex(); say(MON.get(el.dataset.pp).zh); } });
}

/* ---------- 家長區（按住標題 3 秒） ---------- */
function bindParentGesture(el){
  if (!el) return; let t = null;
  const start = e => { e.preventDefault(); el.classList.add("holding"); t = setTimeout(() => { el.classList.remove("holding"); renderParent(); }, 3000); };
  const end = () => { clearTimeout(t); el.classList.remove("holding"); };
  el.addEventListener("pointerdown", start); ["pointerup", "pointerleave", "pointercancel"].forEach(x => el.addEventListener(x, end));
}
function renderParent(){
  pushScreen();
  const top3 = Object.entries(S.errs).filter(([k]) => ERR[k]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const totalQ = ALL.reduce((a, n) => a + L(n).cnt, 0), totalOk = ALL.reduce((a, n) => a + L(n).ok, 0);
  const cA = curLevel("add"), cS = curLevel("sub");
  const rows = ALL.map(n => { const s = L(n), e = s.err; return `<tr class="${s.unlocked ? "" : "dim"}"><td>${lvCode(n)}</td><td>${esc(LV[n].name)}</td>
    <td>${s.passed ? "🏅" : s.unlocked ? "練習中" : "🔒"}</td><td>${s.cnt}</td><td>${s.cnt ? Math.round(s.ok / s.cnt * 100) + "%" : ""}</td>
    <td>${last10(n).length ? selfCount(n) + "/" + last10(n).length : ""}</td><td>${["完整提示", "部分提示", "無提示"][2 - s.sc]}</td><td>Lv.${mlv(s.xp)}</td>
    <td>${(e.forgot || 0) + (e.reverse || 0) || ""}</td><td>${(e.notadd || 0) + (e.nodec || 0) || ""}</td><td>${(e.fact || 0) + (e.sfact || 0) || ""}</td><td>${e.zero || ""}</td></tr>`; }).join("");
  const stepper = (key, label, max) => `<div class="setrow">${label} <button class="btn small" data-step="${key}" data-dir="-1">－</button> <b id="v_${key}">${S.parent[key] || 0}</b> <button class="btn small" data-step="${key}" data-dir="1">＋</button> 關<span class="muted">（共 ${max} 關）</span></div>`;
  app.innerHTML = `<div class="topbar"><button class="btn small" data-home>🏠</button><div class="title">👨‍👩‍👧 家長區</div></div>
    <div class="parent">
      <section><h3>📊 總覽</h3><p>今天練習 <b>${Math.round((S.today.d === ymd(new Date()) ? S.today.sec : 0) / 60)}</b> 分鐘　累計作答 <b>${totalQ}</b> 題，答對 <b>${totalQ ? Math.round(totalOk / totalQ * 100) : 0}%</b><br>
        加法：<b>${cA ? "第 " + dn(cA) + " 關" : "全部過關"}</b>（已過 ${passedList("add").length} 關）　減法：<b>${cS ? "第 " + dn(cS) + " 關" : "全部過關"}</b>（已過 ${passedList("sub").length} 關）　暖身最高 <b>${S.warm.best || 0}</b> 題</p></section>
      <section><h3>⚠️ 安安最常錯的 3 件事（加法＋減法）</h3>${top3.length ? `<ol class="top3">${top3.map(([k, v]) => `<li><b>${ERR[k].name}</b>（${v} 次）<div class="tip">陪練建議：${ERR[k].tip}</div></li>`).join("")}</ol>` : "<p>還沒有錯誤紀錄。</p>"}</section>
      <section><h3>🔒 關卡設定（學校還沒教到的先鎖住）</h3>
        ${stepper("cap", "➕ 加法最高可以玩到第", ADD.length)}
        ${stepper("capS", "➖ 減法最高可以玩到第", SUB.length)}
        ${stepper("force", "➕ 加法直接解鎖到第", ADD.length)}
        ${stepper("forceS", "➖ 減法直接解鎖到第", SUB.length)}
        <div class="setrow"><button class="btn small sun" data-applyforce>套用解鎖</button><span class="muted">（解鎖 0＝不使用；只會打開，不會鎖回去）</span></div>
      </section>
      <section><h3>🔊 語音與注音</h3><div class="setrow">${settingsBtns()}</div></section>
      <section><h3>📋 各關狀況</h3><div class="tblwrap"><table><thead><tr><th>關</th><th>名稱</th><th>狀態</th><th>題數</th><th>正確率</th><th>近10題自己對</th><th>目前提示</th><th>怪獸</th><th>忘記進位／大減小</th><th>進位沒加／借了沒扣</th><th>基本計算錯</th><th>0 的退位</th></tr></thead><tbody>${rows}</tbody></table></div></section>
      <section><p class="muted">完整紀錄在 Google 試算表「安安數學學習紀錄」。尚未上傳的紀錄：${S.queue.length} 筆。</p></section>
    </div>`;
  on("[data-home]", renderHome); bindSettings();
  on("[data-step]", el => { const k = el.dataset.step, max = k === "cap" || k === "force" ? ADD.length : SUB.length, min = k.startsWith("cap") ? 1 : 0;
    S.parent[k] = Math.max(min, Math.min(max, (S.parent[k] || 0) + +el.dataset.dir)); save(); $("#v_" + k).textContent = S.parent[k]; });
  on("[data-applyforce]", () => { applyForce(); save(); toast(`已解鎖：加法到第 ${S.parent.force || 0} 關、減法到第 ${S.parent.forceS || 0} 關`); });
}

/* ---------- 啟動 ---------- */
window.__game = { timers:() => timers.length, S, L, LV, R:() => R, genProblem, genDetect, genDetectS, vprob, sprob, startAdventure, startPractice, startChallenge, renderItem, renderHome,
  mlv, save, curLevel, canChallenge, gatherEvents, ADD, SUB, TR };   // 除錯、測試用
renderHome();
})();
