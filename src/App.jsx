import { useState, useEffect } from "react";

// ── LOCAL STORAGE HELPERS (inline — no extra files needed) ──
var PREFIX = "mc_";
function loadLocal(key, fallback) { try { var r = localStorage.getItem(PREFIX + key); return r ? JSON.parse(r) : fallback; } catch (e) { return fallback; } }
function saveLocal(key, value) { try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) {} }

// ── COLORS ──
var C = { bg: "#050510", card: "#090918", border: "#141430", hi: "#1e1e42", dim: "#252550", green: "#00e5a0", amber: "#f5a623", red: "#ff3d6b", blue: "#4c6fff", cyan: "#00d4ff", purple: "#9b59f5", pink: "#ff6b9d", text: "#dde1f5", muted: "#4a4a72" };

var STYLES = "@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#050510}::-webkit-scrollbar-thumb{background:#1e1e42;border-radius:2px}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes glow{0%,100%{box-shadow:0 0 8px rgba(0,229,160,0.25)}50%{box-shadow:0 0 18px rgba(0,229,160,0.55)}}.spin{animation:spin .85s linear infinite}.fadeUp{animation:fadeUp .35s ease forwards}.glowing{animation:glow 3s ease-in-out infinite}input,textarea,select{background:transparent;color:#dde1f5;font-family:'DM Sans',sans-serif;outline:none}button{font-family:'DM Sans',sans-serif;cursor:pointer;border:none}input[type=range]{width:100%;accent-color:#00e5a0;cursor:pointer}";

var SECTORS = [
  { name: "Nifty IT", ret: -9.71, signal: "CONTRARIAN BUY", reason: "AI fear overpriced. GCC boom + order recovery.", color: C.green, conviction: 82, fund: "Motilal Oswal Nifty IT ETF" },
  { name: "Nifty Realty", ret: -16.1, signal: "HIGH RISK/REWARD", reason: "RBI rate cuts restore affordability.", color: C.amber, conviction: 68, fund: "Nifty Realty Index Fund" },
  { name: "Nifty Media", ret: -22.16, signal: "SPECULATIVE ONLY", reason: "Worst sector 2025. OTT disruption structural.", color: C.red, conviction: 28, fund: "Nifty Media ETF" },
  { name: "Nifty FMCG", ret: -2.81, signal: "DEFENSIVE VALUE", reason: "Rural demand revival 7.7% volume growth.", color: C.blue, conviction: 75, fund: "Nifty FMCG Index Fund" },
  { name: "Nifty Pharma", ret: -2.14, signal: "STEADY ACCUMULATE", reason: "India exports 25% of world generics.", color: C.cyan, conviction: 78, fund: "Nifty Pharma ETF" },
  { name: "Nifty BFSI", ret: 14.2, signal: "CORE POSITION", reason: "Credit growth 9-10%. NPA at decade lows.", color: C.green, conviction: 88, fund: "Nifty Bank ETF" },
  { name: "Nifty Defence", ret: 31.5, signal: "WAIT — PRICED IN", reason: "HAL backlog. Already ran 30%+.", color: C.amber, conviction: 52, fund: "HDFC Defence Fund" },
  { name: "Nifty Energy", ret: 0.13, signal: "GREEN PIVOT PLAY", reason: "50% non-fossil capacity hit.", color: C.purple, conviction: 70, fund: "Nifty Energy Index" },
];
var TAX_DATES = [
  { d: "15 Jun 2026", e: "Advance Tax Q1", a: "Pay 15% of estimated annual tax", urgent: true },
  { d: "31 Jul 2026", e: "ITR Filing Deadline", a: "File FY 2025-26 return", urgent: true },
  { d: "15 Sep 2026", e: "Advance Tax Q2", a: "Pay 45% cumulative", urgent: false },
  { d: "15 Dec 2026", e: "Advance Tax Q3", a: "Pay 75% cumulative", urgent: false },
  { d: "15 Mar 2027", e: "Advance Tax Q4", a: "Pay 100% — final", urgent: false },
  { d: "31 Mar 2027", e: "Tax Loss Harvesting", a: "Book losses for FY 2026-27", urgent: false },
];
var PRINCIPLES = [
  { investor: "Gajendra Kothari", tag: "Pendulum Theory", color: C.purple, rules: ["Buy sectors underperformed 3-5 years.", "Fundamentals must be intact.", "Buy INDEX fund, not stocks.", "Hold 3-5 years.", "\"To suppress volatility is to suppress returns.\""] },
  { investor: "Warren Buffett", tag: "Value Investing", color: C.amber, rules: ["Be fearful when others are greedy.", "Buy wonderful companies at fair prices.", "Time in market beats timing.", "Hold for 10 years.", "Price is what you pay, value is what you get."] },
  { investor: "Peter Lynch", tag: "Invest What You Know", color: C.cyan, rules: ["Invest in what you understand.", "10-baggers from ordinary businesses.", "Cyclical: buy when PE HIGH.", "Find great companies.", "Best stock is one you already know."] },
  { investor: "Benjamin Graham", tag: "Margin of Safety", color: C.green, rules: ["Margin of safety — 30-40% below intrinsic.", "Mr Market is your servant.", "Investment vs speculation.", "Diversify 10-30 securities.", "PE < 15 = value. PE > 25 = speculative."] },
  { investor: "Howard Marks", tag: "Market Cycles", color: C.pink, rules: ["Know where you are in the cycle.", "Bull born on pessimism, die on euphoria.", "Risk highest when everyone complacent.", "You can't predict. You can prepare.", "'This time it's different' = danger."] },
  { investor: "Ray Dalio", tag: "All Weather", color: C.blue, rules: ["Diversify: equity, gold, bonds.", "Growth + inflation = commodities.", "Growth + falling inflation = equity.", "Watch RBI rate decisions.", "Gold 5-10% for rupee protection."] },
];
var MCHECKS = [{ key: "giftNifty", label: "Check Gift Nifty" }, { key: "crude", label: "Check Crude Oil" }, { key: "usdinr", label: "Check USD/INR" }, { key: "fii", label: "Check FII/DII" }, { key: "pe", label: "Check Nifty PE" }, { key: "weekFII", label: "Check Weekly FII" }];

// ── HELPERS ──
function fmtINR(n) { if (n >= 1e7) return "\u20b9" + (n / 1e7).toFixed(2) + "Cr"; if (n >= 1e5) return "\u20b9" + (n / 1e5).toFixed(1) + "L"; return "\u20b9" + Math.round(n).toLocaleString("en-IN"); }
function fmtTime(d) { return d.toLocaleTimeString("en-IN", { hour12: false }); }
function fmtDate(d) { return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); }
function getNiftySignal(n) { if (n > 25000) return { label: "EXPENSIVE", sub: "SIP only.", color: C.red }; if (n > 24000) return { label: "NEUTRAL", sub: "SIP ok. Wait.", color: C.amber }; if (n > 22500) return { label: "DEPLOY ZONE \u2713", sub: "Good entry \u2014 invest", color: C.green }; if (n > 21000) return { label: "ATTRACTIVE!", sub: "Deploy \u20b97L", color: C.cyan }; return { label: "CRASH \u2014 ALL IN", sub: "Deploy \u20b915L NOW", color: "#39ff14" }; }
function getCompositeSignal(nifty, pe, vix, fiiMTD) { var s = 0; if (pe < 16) s += 3; else if (pe < 18) s += 2; else if (pe < 20) s += 1; else if (pe < 22) s -= 1; else s -= 3; if (vix > 25) s += 3; else if (vix > 20) s += 2; else if (vix > 18) s += 1; else if (vix < 14) s -= 1; if (nifty < 21000) s += 3; else if (nifty < 22500) s += 2; else if (nifty < 24000) s += 1; else if (nifty > 25000) s -= 2; if (fiiMTD < -15000) s += 2; else if (fiiMTD < -5000) s += 1; else if (fiiMTD > 10000) s -= 1; if (s >= 7) return { label: "STRONG BUY", sub: "All signals aligned.", color: "#39ff14", bg: "#39ff1420" }; if (s >= 4) return { label: "BUY", sub: "Good opportunity.", color: C.green, bg: C.green + "15" }; if (s >= 2) return { label: "ACCUMULATE", sub: "Deploy in tranches.", color: C.cyan, bg: C.cyan + "12" }; if (s >= 0) return { label: "HOLD", sub: "SIP only.", color: C.amber, bg: C.amber + "12" }; if (s >= -2) return { label: "AVOID", sub: "Market expensive.", color: C.red, bg: C.red + "12" }; return { label: "SELL / REDUCE", sub: "Take profits.", color: C.red, bg: C.red + "20" }; }

// ── UI COMPONENTS ──
function Card(props) { return <div style={{ background: C.card, border: "1px solid " + (props.borderColor || C.border), borderRadius: 16, padding: 18, ...props.style }}>{props.children}</div>; }
function Label(props) { return <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: props.color || C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>{props.children}</div>; }
function Tag(props) { return <span style={{ fontSize: 10, background: props.color + "22", color: props.color, padding: "3px 8px", borderRadius: 6, fontFamily: "'DM Mono',monospace", letterSpacing: 1 }}>{props.children}</span>; }
function Bar(props) { return <div style={{ background: C.dim, borderRadius: 4, height: props.height || 6, overflow: "hidden" }}><div style={{ width: Math.min(100, Math.max(0, props.pct)) + "%", height: "100%", background: props.color, borderRadius: 4, transition: "width 0.8s ease" }} /></div>; }
function Spinner() { return <div style={{ width: 20, height: 20, border: "2px solid " + C.hi, borderTopColor: C.green, borderRadius: "50%", margin: "0 auto" }} className="spin" />; }
function NumInput(props) { return <div style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="number" value={props.value} onChange={function (e) { props.onChange(parseFloat(e.target.value) || 0); }} style={{ background: C.hi, border: "1px solid " + C.border, borderRadius: 8, padding: "6px 10px", fontSize: 14, color: C.text, width: 80, textAlign: "right" }} />{props.suffix && <span style={{ fontSize: 12, color: C.muted }}>{props.suffix}</span>}</div>; }

function renderMarkdown(text) {
  if (!text) return null;
  return text.split("\n").map(function (line, i) {
    var t = line.trim();
    if (/^\*\*(.+)\*\*$/.test(t)) return <div key={i} style={{ fontWeight: 700, color: C.amber, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginTop: 18, marginBottom: 6 }}>{t.replace(/^\*\*|\*\*$/g, "")}</div>;
    if (/^#+\s/.test(line)) return <div key={i} style={{ fontWeight: 700, color: C.amber, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginTop: 18, marginBottom: 6 }}>{line.replace(/^#+\s/, "")}</div>;
    if (/^[•\-*]\s/.test(line)) return <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}><span style={{ color: C.green, fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>{"\u2192"}</span><span style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{line.replace(/^[•\-*]\s/, "")}</span></div>;
    if (t === "") return <div key={i} style={{ height: 6 }} />;
    return <div key={i} style={{ fontSize: 14, color: C.text, lineHeight: 1.6, marginBottom: 4 }}>{line}</div>;
  });
}

// ── AI CALL (direct Groq — works everywhere) ──
async function aiCall(sys, usr) {
  var k = loadLocal("groq_key", "");
  if (!k) throw new Error("Add your Groq API key in AI Advisor tab first.");
  var r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + k },
    body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "system", content: sys }, { role: "user", content: usr }] }),
  });
  var d = await r.json();
  if (d.error) throw new Error(d.error.message);
  if (!d.choices || !d.choices.length) throw new Error("No response.");
  return d.choices[0].message.content;
}

// ══════════════════════════════════════════════════════════════════════
export default function App() {
  var [unlocked, setUnlocked] = useState(function () { return loadLocal("unlocked", false); });
  var [pwd, setPwd] = useState("");
  var MY_PASSWORD = "mantraa2026";
  var [time, setTime] = useState(new Date());
  var [nifty, setNifty] = useState(function () { return loadLocal("nifty", 23643.5); });
  var [tab, setTab] = useState("overview");
  var [aiQuery, setAiQuery] = useState("");
  var [aiLoading, setAiLoading] = useState(false);
  var [aiResponse, setAiResponse] = useState(null);
  var [oppLoading, setOppLoading] = useState(false);
  var [oppResponse, setOppResponse] = useState(null);
  var [selectedSector, setSelectedSector] = useState(null);
  var [activePrinciple, setActivePrinciple] = useState(null);
  var [groqKey, setGroqKey] = useState(function () { return loadLocal("groq_key", ""); });
  var [netWorth, setNetWorth] = useState(function () { return loadLocal("netWorth", { business: 150, investments: 25, cash: 15, debt: 0 }); });
  var [checks, setChecks] = useState(function () { return loadLocal("checks", { giftNifty: false, crude: false, usdinr: false, fii: false, pe: false, weekFII: false }); });
  var [goals, setGoals] = useState(function () { return loadLocal("goals", [{ id: 1, label: "\ud83c\udf93 Child Education Fund", goal: 3300000, inv: 1000000, sipK: 0, yrs: 18, color: C.blue }, { id: 2, label: "\ud83c\udfd6 Retirement Corpus", goal: 100000000, inv: 1000000, sipK: 5, yrs: 34, color: C.purple }]); });
  var [editingId, setEditingId] = useState(null);
  var [showAddGoal, setShowAddGoal] = useState(false);
  var [newGoal, setNewGoal] = useState({ label: "\ud83c\udfaf New Goal", goal: 5000000, inv: 500000, sipK: 5, yrs: 15, color: C.amber });
  var [calcP, setCalcP] = useState(function () { return loadLocal("calcP", 10); });
  var [calcR, setCalcR] = useState(function () { return loadLocal("calcR", 12); });
  var [calcY, setCalcY] = useState(function () { return loadLocal("calcY", 15); });
  var [calcSIP, setCalcSIP] = useState(function () { return loadLocal("calcSIP", 5); });
  var [dailyBrief, setDailyBrief] = useState(function () { return loadLocal("dailyBrief", null); });
  var [briefLoading, setBriefLoading] = useState(false);
  var [doneItems, setDoneItems] = useState(function () { return loadLocal("doneItems", []); });

  var mkt = { crude: 109.26, usdinr: 95.71, vix: 18.43, pe: 21.2, fii: -1329, dii: 1958, fiiMTD: -18500 };
  var sig = getNiftySignal(nifty);
  var composite = getCompositeSignal(nifty, mkt.pe, mkt.vix, mkt.fiiMTD);
  var totalNW = (netWorth.business + netWorth.investments + netWorth.cash - netWorth.debt) * 100000;
  var checkedCount = Object.values(checks).filter(Boolean).length;
  var totalChecks = Object.keys(checks).length;
  var calcPrincipal = calcP * 100000; var calcSIPRs = calcSIP * 1000; var calcRate = calcR / 100;
  var calcLumpFV = calcPrincipal * Math.pow(1 + calcRate, calcY);
  var calcSipFV = calcSIPRs > 0 ? calcSIPRs * ((Math.pow(1 + calcRate / 12, calcY * 12) - 1) / (calcRate / 12)) * (1 + calcRate / 12) : 0;
  var calcTotalFV = calcLumpFV + calcSipFV; var calcTotalInvested = calcPrincipal + calcSIPRs * 12 * calcY; var calcGain = calcTotalFV - calcTotalInvested;
  function goalFV(g) { var l = g.inv * Math.pow(1.12, g.yrs); var s = g.sipK * 1000; var sf = s > 0 ? s * ((Math.pow(1 + 0.12 / 12, g.yrs * 12) - 1) / (0.12 / 12)) * (1 + 0.12 / 12) : 0; return l + sf; }

  // ── EFFECTS ──
  useEffect(function () {
    if (!document.getElementById("mc-sty")) { var el = document.createElement("style"); el.id = "mc-sty"; el.textContent = STYLES; document.head.appendChild(el); }
    var t1 = setInterval(function () { setTime(new Date()); }, 1000);
    var t2 = setInterval(function () { setNifty(function (p) { return +(p + (Math.random() - 0.5) * 8).toFixed(2); }); }, 6000);
    return function () { clearInterval(t1); clearInterval(t2); };
  }, []);
  useEffect(function () { saveLocal("goals", goals); }, [goals]);
  useEffect(function () { saveLocal("netWorth", netWorth); }, [netWorth]);
  useEffect(function () { saveLocal("checks", checks); }, [checks]);
  useEffect(function () { saveLocal("doneItems", doneItems); }, [doneItems]);
  useEffect(function () { saveLocal("calcP", calcP); }, [calcP]);
  useEffect(function () { saveLocal("calcR", calcR); }, [calcR]);
  useEffect(function () { saveLocal("calcY", calcY); }, [calcY]);
  useEffect(function () { saveLocal("calcSIP", calcSIP); }, [calcSIP]);
  useEffect(function () { saveLocal("groq_key", groqKey); }, [groqKey]);

  // Daily briefing on load
  useEffect(function () {
    var today = new Date().toDateString();
    var cached = loadLocal("dailyBrief", null);
    if (cached && cached.date === today) { setDailyBrief(cached); return; }
    var k = loadLocal("groq_key", "");
    if (!k) return;
    setBriefLoading(true);
    aiCall("You are a sharp Indian financial advisor. Give today's market pulse and 3 actions. Use \u20b9.", "Today's market briefing?")
      .then(function (text) { var b = { briefing: text, date: today, timestamp: new Date().toISOString() }; setDailyBrief(b); saveLocal("dailyBrief", b); setBriefLoading(false); })
      .catch(function () { setBriefLoading(false); });
  }, []);

  // ── HANDLERS ──
  function toggleDone(id) { setDoneItems(function (p) { return p.includes(id) ? p.filter(function (x) { return x !== id; }) : p.concat([id]); }); }
  function isDone(id) { return doneItems.includes(id); }
  function callAdvisor(q) { var query = q || aiQuery || "What should I do today?"; setAiLoading(true); setAiResponse(null); aiCall("You are a sharp financial advisor for Param, 26yr D2C founder. Portfolio: 10L Nifty 50 Index, 15L Arbitrage Fund, 10Cr retirement goal. Be direct. Use \u20b9. Format with **HEADERS** and - bullets.", query).then(function (text) { setAiResponse(text); setAiLoading(false); }).catch(function (e) { setAiResponse("\u26a0 " + e.message); setAiLoading(false); }); }
  function callOpportunity(sector) { setOppLoading(true); setOppResponse(null); var p = sector ? "Analyse " + sector.name + " (" + sector.ret + "% in 2025) using Kothari pendulum. BUY/WAIT/AVOID with Indian MF/ETF." : "Which 3 Indian sectors at bottom for 2-3yr recovery? MF/ETF names."; aiCall("Apply Gajendra Kothari pendulum philosophy. Give specific Indian MF/ETF names.", p).then(function (text) { setOppResponse(text); setOppLoading(false); }).catch(function (e) { setOppResponse("\u26a0 " + e.message); setOppLoading(false); }); }
  function updateGoal(id, f, v) { setGoals(function (p) { return p.map(function (g) { return g.id === id ? Object.assign({}, g, { [f]: v }) : g; }); }); }
  function deleteGoal(id) { setGoals(function (p) { return p.filter(function (g) { return g.id !== id; }); }); setEditingId(null); }
  function addGoal() { var id = Date.now(); setGoals(function (p) { return p.concat([Object.assign({ id: id }, newGoal)]); }); setNewGoal({ label: "\ud83c\udfaf New Goal", goal: 5000000, inv: 500000, sipK: 5, yrs: 15, color: C.amber }); setShowAddGoal(false); setEditingId(id); }
  function handleUnlock() { if (pwd === MY_PASSWORD) { setUnlocked(true); saveLocal("unlocked", true); } }

  var tabsList = ["overview", "opportunity", "my money", "ai advisor", "habits"];
  var tabLabels = { overview: "Overview", opportunity: "\ud83c\udfaf Opportunity", "my money": "My Money", "ai advisor": "AI Advisor", habits: "Habits" };
  var sigInd = [
    { label: "Nifty", value: nifty.toFixed(0), signal: nifty < 22500 ? "BUY" : nifty < 24000 ? "HOLD" : "AVOID", color: nifty < 22500 ? C.green : nifty < 24000 ? C.amber : C.red },
    { label: "PE", value: mkt.pe, signal: mkt.pe < 18 ? "BUY" : mkt.pe < 22 ? "HOLD" : "AVOID", color: mkt.pe < 18 ? C.green : mkt.pe < 22 ? C.amber : C.red },
    { label: "VIX", value: mkt.vix, signal: mkt.vix > 20 ? "BUY(FEAR)" : "WATCH", color: mkt.vix > 20 ? C.green : C.amber },
    { label: "FII MTD", value: "\u2212\u20b918.5K Cr", signal: "BUY(SELL)", color: C.green },
  ];

  // ── PASSWORD SCREEN ──
  if (!unlocked) return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 20, padding: "40px 36px", width: 340, textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 6 }}>MANTRAA <span style={{ color: C.green }}>CAPITAL</span></div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 28 }}>Enter password to continue</div>
        <input type="password" value={pwd} onChange={function (e) { setPwd(e.target.value); }} onKeyDown={function (e) { if (e.key === "Enter") handleUnlock(); }} placeholder="Password" style={{ width: "100%", background: C.hi, border: "1px solid " + C.border, borderRadius: 12, padding: "12px 16px", fontSize: 15, color: C.text, marginBottom: 16, textAlign: "center" }} />
        <button onClick={handleUnlock} style={{ width: "100%", padding: "12px", borderRadius: 12, background: C.green, color: "#000", fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>UNLOCK</button>
        {pwd.length > 0 && pwd !== MY_PASSWORD && <div style={{ color: C.red, fontSize: 12, marginTop: 12 }}>Wrong password</div>}
      </div>
    </div>
  );

  // ── MAIN APP ──
  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      {/* HEADER */}
      <div style={{ background: C.card + "ee", borderBottom: "1px solid " + C.border, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(16px)" }}>
        <div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 3 }}>CAPITAL COMMAND CENTER</div><div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>MANTRAA <span style={{ color: C.green }}>CAPITAL</span></div></div>
        <div style={{ textAlign: "right" }}><div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginBottom: 2 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green }} className="glowing" /><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.green, letterSpacing: 1 }}>LIVE</span></div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, color: C.green }}>{fmtTime(time)}</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.muted }}>{fmtDate(time)}</div>
        </div>
      </div>
      {/* TABS */}
      <div style={{ display: "flex", gap: 3, padding: "12px 18px", borderBottom: "1px solid " + C.border, overflowX: "auto" }}>{tabsList.map(function (t) { return <button key={t} onClick={function () { setTab(t); }} style={{ padding: "7px 15px", borderRadius: 20, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", background: tab === t ? C.green : "transparent", color: tab === t ? "#000" : C.muted, transition: "all 0.2s" }}>{tabLabels[t]}</button>; })}</div>

      <div style={{ padding: "18px", maxWidth: 960, margin: "0 auto" }}>

        {/* ══ OVERVIEW ══ */}
        {tab === "overview" && <div className="fadeUp">
          <Card borderColor={sig.color + "55"} style={{ marginBottom: 14, background: sig.color + "08" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div><Label>Nifty 50 {"\u2014"} Your Entry Signal</Label><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 11, height: 11, borderRadius: "50%", background: sig.color }} className="glowing" /><div style={{ fontSize: 26, fontWeight: 800, color: sig.color }}>{sig.label}</div></div><div style={{ fontSize: 14, color: C.muted, marginTop: 5 }}>{sig.sub}</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 30, color: sig.color }}>{nifty.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.red, marginTop: 4 }}>{"\u25bc"} -8.2% from peak</div></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 18 }}>{[{ level: 25000, label: "Expensive", color: C.red }, { level: 24000, label: "Neutral", color: C.amber }, { level: 22500, label: "Deploy \u20b97L", color: C.green }, { level: 21000, label: "Deploy \u20b98L", color: C.cyan }].map(function (item) { var below = nifty < item.level; return <div key={item.level} style={{ background: below ? item.color + "18" : "transparent", border: "1px solid " + (below ? item.color : C.dim), borderRadius: 10, padding: "10px 8px", textAlign: "center" }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: item.color }}>{item.level.toLocaleString("en-IN")}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{item.label}</div>{below && <div style={{ fontSize: 9, color: item.color, marginTop: 4, letterSpacing: 1 }}>{"\u2713"} BELOW</div>}</div>; })}</div>
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>{[{ label: "Crude Oil", value: "$" + mkt.crude, sub: "Hurts India", color: C.red, w: true }, { label: "USD/INR", value: "\u20b9" + mkt.usdinr, sub: "FIIs exiting", color: C.red, w: true }, { label: "India VIX", value: mkt.vix, sub: mkt.vix > 18 ? "Fear" : "Calm", color: C.amber, w: mkt.vix > 18 }, { label: "Nifty PE", value: mkt.pe, sub: "Fair value", color: C.amber, w: false }].map(function (item) { return <div key={item.label} style={{ background: C.card, border: "1px solid " + (item.w ? item.color + "44" : C.border), borderRadius: 14, padding: "14px 16px" }}><Label>{item.label}</Label><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, color: item.color }}>{item.value}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 5 }}>{item.sub}</div></div>; })}</div>
          <Card style={{ marginBottom: 14 }}><Label>FII / DII Activity Today</Label><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 14 }}><div><div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>FII</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 24, color: C.red }}>-{"\u20b9"}1,329 Cr</div><div style={{ fontSize: 12, color: C.red, marginTop: 5 }}>Selling</div></div><div><div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>DII</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 24, color: C.green }}>+{"\u20b9"}1,958 Cr</div><div style={{ fontSize: 12, color: C.green, marginTop: 5 }}>Absorbing {"\u2713"}</div></div></div><Bar pct={60} color={C.green} /></Card>
          <Card borderColor={C.amber + "33"} style={{ background: C.amber + "07" }}><Label>Why Is Market Falling?</Label>{[{ e: "\ud83d\udee2", t: "Crude at $109 \u2014 India imports 85%" }, { e: "\ud83d\udcb5", t: "Rupee at \u20b995.7 record low" }, { e: "\ud83c\udf0d", t: "US-Iran tensions \u2014 risk-off" }, { e: "\ud83e\udd16", t: "OpenAI fear \u2014 IT at 52-week lows" }, { e: "\ud83d\udcc9", t: "Austerity call hit consumer stocks" }].map(function (item) { return <div key={item.t} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid " + C.border, fontSize: 14 }}><span>{item.e}</span><span style={{ color: C.text, lineHeight: 1.5 }}>{item.t}</span></div>; })}<div style={{ marginTop: 14, background: C.green + "14", border: "1px solid " + C.green + "33", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.green, lineHeight: 1.65 }}>{"\ud83d\udca1"} <strong>Your move:</strong> {"\u20b9"}15L arbitrage earns 7% while waiting.</div></Card>
          {dailyBrief && dailyBrief.briefing && <Card borderColor={C.cyan + "44"} style={{ marginTop: 14, background: C.cyan + "06" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><Label color={C.cyan}>{"\ud83e\udd16"} AI DAILY BRIEFING</Label><div style={{ fontSize: 10, color: C.muted }}>{dailyBrief.timestamp ? new Date(dailyBrief.timestamp).toLocaleTimeString("en-IN", { hour12: true, hour: "numeric", minute: "numeric" }) : ""}</div></div>{renderMarkdown(dailyBrief.briefing)}<button onClick={function () { saveLocal("dailyBrief", null); setDailyBrief(null); setBriefLoading(true); aiCall("Sharp Indian financial advisor. Market pulse + 3 actions. Use \u20b9.", "Today's briefing?").then(function (text) { var b = { briefing: text, date: new Date().toDateString(), timestamp: new Date().toISOString() }; setDailyBrief(b); saveLocal("dailyBrief", b); setBriefLoading(false); }).catch(function () { setBriefLoading(false); }); }} style={{ marginTop: 14, padding: "8px 16px", borderRadius: 10, background: C.cyan + "20", color: C.cyan, fontSize: 12, border: "1px solid " + C.cyan + "44" }}>{briefLoading ? "Refreshing..." : "\ud83d\udd04 Refresh"}</button></Card>}
          {briefLoading && !dailyBrief && <Card style={{ marginTop: 14, textAlign: "center", padding: 30 }}><Spinner /><div style={{ fontSize: 13, color: C.muted, marginTop: 12 }}>Loading AI briefing...</div></Card>}
        </div>}

        {/* ══ OPPORTUNITY ══ */}
        {tab === "opportunity" && <div className="fadeUp">
          <Card borderColor={composite.color + "55"} style={{ marginBottom: 14, background: composite.bg }}><Label>{"\ud83d\udce1"} Signal Engine</Label><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}><div><div style={{ fontSize: 28, fontWeight: 800, color: composite.color }}>{composite.label}</div><div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>{composite.sub}</div></div></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 16 }}>{sigInd.map(function (s) { return <div key={s.label} style={{ background: C.dim, borderRadius: 10, padding: "10px 12px", border: "1px solid " + s.color + "33" }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{s.label}</div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: C.text }}>{s.value}</div><Tag color={s.color}>{s.signal}</Tag></div></div>; })}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><div style={{ background: C.green + "10", border: "1px solid " + C.green + "33", borderRadius: 12, padding: "12px 14px" }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.green, letterSpacing: 2, marginBottom: 8 }}>WHEN TO BUY</div>{["PE below 18", "VIX above 20", "FII sell > \u20b915K Cr", "Nifty falls 15-20%", "News terrifying"].map(function (r) { return <div key={r} style={{ fontSize: 12, color: C.text, marginBottom: 5, display: "flex", gap: 6 }}><span style={{ color: C.green }}>{"\u2713"}</span>{r}</div>; })}</div><div style={{ background: C.red + "10", border: "1px solid " + C.red + "33", borderRadius: 12, padding: "12px 14px" }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.red, letterSpacing: 2, marginBottom: 8 }}>WHEN TO SELL</div>{["PE above 25", "VIX below 12", "Everyone bullish", "Goal reached", "Nifty up 40%+"].map(function (r) { return <div key={r} style={{ fontSize: 12, color: C.text, marginBottom: 5, display: "flex", gap: 6 }}><span style={{ color: C.red }}>{"\u2715"}</span>{r}</div>; })}</div></div>
          </Card>
          <Card borderColor={C.purple + "44"} style={{ marginBottom: 14, background: C.purple + "08" }}><div style={{ display: "flex", gap: 14 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: C.purple + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{"\ud83c\udfaf"}</div><div><div style={{ fontSize: 17, fontWeight: 800, marginBottom: 5 }}>Kothari's <span style={{ color: C.purple }}>Pendulum Strategy</span></div><div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>Buy worst-performing sector funds when fundamentals intact. Hold 3-5 years.</div></div></div></Card>
          <Card style={{ marginBottom: 14 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><Label>Sector Heatmap 2025</Label><div style={{ fontSize: 11, color: C.muted }}>Tap {"\u2192"} AI scan</div></div>
            {SECTORS.map(function (s) { var sel = selectedSector && selectedSector.name === s.name; return <div key={s.name} onClick={function () { setSelectedSector(s); setOppResponse(null); }} style={{ background: sel ? s.color + "18" : s.ret < 0 ? C.green + "07" : C.red + "06", border: "1px solid " + (sel ? s.color : C.border), borderRadius: 12, padding: "12px 14px", cursor: "pointer", marginBottom: 6 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div><Tag color={s.color}>{s.signal}</Tag></div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: s.ret >= 0 ? C.green : C.red, fontWeight: 700 }}>{s.ret >= 0 ? "+" : ""}{s.ret}%</div></div><div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{s.reason}</div><div style={{ marginTop: 8 }}><Bar pct={s.conviction} color={s.color} /></div><div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: C.muted }}><span>Conviction: {s.conviction}%</span><span>{s.fund}</span></div></div>; })}
          </Card>
          {selectedSector && <Card borderColor={selectedSector.color + "55"} style={{ marginBottom: 14 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><Label color={selectedSector.color}>AI: {selectedSector.name}</Label><button onClick={function () { callOpportunity(selectedSector); }} disabled={oppLoading} style={{ padding: "6px 14px", borderRadius: 8, background: selectedSector.color + "20", color: selectedSector.color, fontSize: 12, border: "1px solid " + selectedSector.color + "44" }}>{oppLoading ? "Scanning..." : "\ud83d\udd0d AI Scan"}</button></div>{oppLoading && <div style={{ textAlign: "center", padding: 20 }}><Spinner /></div>}{oppResponse && <div style={{ marginTop: 8 }}>{renderMarkdown(oppResponse)}</div>}</Card>}
          {!selectedSector && <button onClick={function () { callOpportunity(null); }} disabled={oppLoading} style={{ width: "100%", padding: "14px", borderRadius: 12, background: C.purple + "20", color: C.purple, fontSize: 14, fontWeight: 600, border: "1px solid " + C.purple + "44", marginBottom: 14 }}>{oppLoading ? "Scanning..." : "\ud83d\udd0d AI: Find Best Sectors"}</button>}
          {!selectedSector && oppResponse && <Card style={{ marginBottom: 14 }}>{renderMarkdown(oppResponse)}</Card>}
          <Card><Label>{"\ud83d\udcda"} Principles</Label><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 14 }}>{PRINCIPLES.map(function (p) { var a = activePrinciple === p.investor; return <button key={p.investor} onClick={function () { setActivePrinciple(a ? null : p.investor); }} style={{ padding: "8px 6px", borderRadius: 10, background: a ? p.color + "20" : "transparent", border: "1px solid " + (a ? p.color : C.border), color: a ? p.color : C.muted, fontSize: 11, fontWeight: 600 }}>{p.investor.split(" ").pop()}</button>; })}</div>{PRINCIPLES.filter(function (p) { return activePrinciple === p.investor; }).map(function (p) { return <div key={p.investor}><div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}><div style={{ fontWeight: 700, fontSize: 15 }}>{p.investor}</div><Tag color={p.color}>{p.tag}</Tag></div>{p.rules.map(function (r, i) { return <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}><span style={{ color: p.color, fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>{i + 1}.</span><span style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{r}</span></div>; })}</div>; })}</Card>
        </div>}

        {/* ══ MY MONEY ══ */}
        {tab === "my money" && <div className="fadeUp">
          <Card borderColor={C.green + "33"} style={{ marginBottom: 14, background: C.green + "06" }}><Label color={C.green}>Net Worth</Label><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 32, color: C.green, marginBottom: 16 }}>{fmtINR(totalNW)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{[{ label: "Business", key: "business", color: C.purple }, { label: "Investments", key: "investments", color: C.blue }, { label: "Cash & FDs", key: "cash", color: C.cyan }, { label: "Debt", key: "debt", color: C.red }].map(function (item) { return <div key={item.key} style={{ background: C.hi, borderRadius: 10, padding: "10px 12px" }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{item.label}</div><div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 13, color: C.muted }}>{"\u20b9"}</span><input type="number" value={netWorth[item.key]} onChange={function (e) { setNetWorth(function (p) { return Object.assign({}, p, { [item.key]: parseFloat(e.target.value) || 0 }); }); }} style={{ background: "transparent", border: "none", fontSize: 18, fontWeight: 700, color: item.color, width: "80%", fontFamily: "'DM Mono',monospace" }} /><span style={{ fontSize: 11, color: C.muted }}>L</span></div></div>; })}</div>
          </Card>
          <Card style={{ marginBottom: 14 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><Label>{"\ud83c\udfaf"} Goals (12% CAGR)</Label><button onClick={function () { setShowAddGoal(!showAddGoal); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, background: C.green + "20", color: C.green, border: "1px solid " + C.green + "44" }}>+ Add</button></div>
            {showAddGoal && <div style={{ background: C.hi, borderRadius: 12, padding: 16, marginBottom: 14, border: "1px solid " + C.amber + "44" }}><div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 12 }}>New Goal</div><input value={newGoal.label} onChange={function (e) { setNewGoal(Object.assign({}, newGoal, { label: e.target.value })); }} style={{ background: C.dim, border: "1px solid " + C.border, borderRadius: 8, padding: "8px 12px", fontSize: 14, width: "100%", marginBottom: 8 }} placeholder="Goal name" /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}><NumInput value={newGoal.goal / 1e5} onChange={function (v) { setNewGoal(Object.assign({}, newGoal, { goal: v * 1e5 })); }} suffix="L target" /><NumInput value={newGoal.inv / 1e5} onChange={function (v) { setNewGoal(Object.assign({}, newGoal, { inv: v * 1e5 })); }} suffix="L invested" /><NumInput value={newGoal.sipK} onChange={function (v) { setNewGoal(Object.assign({}, newGoal, { sipK: v })); }} suffix="K/mo" /><NumInput value={newGoal.yrs} onChange={function (v) { setNewGoal(Object.assign({}, newGoal, { yrs: v })); }} suffix="years" /></div><button onClick={addGoal} style={{ padding: "10px", borderRadius: 10, background: C.green, color: "#000", fontWeight: 700, fontSize: 13, width: "100%" }}>Add Goal</button></div>}
            {goals.map(function (g) { var fv = goalFV(g); var pct = Math.min(100, (fv / g.goal) * 100); var ed = editingId === g.id; return <div key={g.id} style={{ background: C.hi, borderRadius: 12, padding: 14, marginBottom: 10, border: "1px solid " + (ed ? g.color : C.border) }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><div style={{ fontWeight: 700, fontSize: 15 }}>{g.label}</div><div style={{ display: "flex", gap: 6 }}><button onClick={function () { setEditingId(ed ? null : g.id); }} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: ed ? g.color + "20" : "transparent", color: ed ? g.color : C.muted, border: "1px solid " + C.border }}>{ed ? "Done" : "Edit"}</button>{ed && <button onClick={function () { deleteGoal(g.id); }} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: C.red + "20", color: C.red, border: "1px solid " + C.red + "44" }}>Delete</button>}</div></div>
              {ed ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}><NumInput value={g.goal / 1e5} onChange={function (v) { updateGoal(g.id, "goal", v * 1e5); }} suffix="L target" /><NumInput value={g.inv / 1e5} onChange={function (v) { updateGoal(g.id, "inv", v * 1e5); }} suffix="L invested" /><NumInput value={g.sipK} onChange={function (v) { updateGoal(g.id, "sipK", v); }} suffix="K/mo" /><NumInput value={g.yrs} onChange={function (v) { updateGoal(g.id, "yrs", v); }} suffix="years" /></div> : <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 8 }}><span>Invested: {fmtINR(g.inv)}{g.sipK > 0 ? " + \u20b9" + g.sipK + "K/mo" : ""}</span><span>{g.yrs}yr</span></div>}
              <Bar pct={pct} color={g.color} height={8} /><div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12 }}><span style={{ color: g.color }}>{fmtINR(fv)} projected</span><span style={{ color: pct >= 100 ? C.green : C.amber }}>Goal: {fmtINR(g.goal)} ({pct.toFixed(0)}%)</span></div></div>; })}
          </Card>
          <Card><Label>{"\ud83d\udcca"} Compound Calculator</Label><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}><div><div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Lumpsum ({"\u20b9"}L)</div><input type="range" min={0} max={100} value={calcP} onChange={function (e) { setCalcP(+e.target.value); }} /><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: C.text, marginTop: 4 }}>{fmtINR(calcPrincipal)}</div></div><div><div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>SIP ({"\u20b9"}K/mo)</div><input type="range" min={0} max={100} value={calcSIP} onChange={function (e) { setCalcSIP(+e.target.value); }} /><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: C.text, marginTop: 4 }}>{"\u20b9"}{calcSIP}K/mo</div></div><div><div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Return (%)</div><input type="range" min={6} max={20} value={calcR} onChange={function (e) { setCalcR(+e.target.value); }} /><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: C.text, marginTop: 4 }}>{calcR}%</div></div><div><div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Years</div><input type="range" min={1} max={40} value={calcY} onChange={function (e) { setCalcY(+e.target.value); }} /><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: C.text, marginTop: 4 }}>{calcY}yr</div></div></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}><div style={{ background: C.hi, borderRadius: 10, padding: 12, textAlign: "center" }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Invested</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, color: C.text }}>{fmtINR(calcTotalInvested)}</div></div><div style={{ background: C.hi, borderRadius: 10, padding: 12, textAlign: "center" }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Gains</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, color: C.green }}>{fmtINR(calcGain)}</div></div><div style={{ background: C.green + "15", borderRadius: 10, padding: 12, textAlign: "center", border: "1px solid " + C.green + "33" }}><div style={{ fontSize: 11, color: C.green, marginBottom: 4 }}>Total</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, color: C.green, fontWeight: 700 }}>{fmtINR(calcTotalFV)}</div></div></div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 12, textAlign: "center" }}>{fmtINR(calcTotalInvested)} {"\u2192"} {fmtINR(calcTotalFV)} in {calcY}yr at {calcR}%{calcGain > calcTotalInvested && <span style={{ color: C.green }}> {"\ud83d\udd25"} {(calcTotalFV / calcTotalInvested).toFixed(1)}x</span>}</div>
          </Card>
        </div>}

        {/* ══ AI ADVISOR ══ */}
        {tab === "ai advisor" && <div className="fadeUp">
          <Card><Label color={C.cyan}>{"\ud83e\udd16"} AI Financial Advisor</Label><div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>Ask any financial question. Portfolio context built-in.</div>
            <div style={{ marginBottom: 16, background: C.hi, borderRadius: 10, padding: "12px 14px" }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Groq API Key (free at console.groq.com)</div><input type="password" value={groqKey} onChange={function (e) { setGroqKey(e.target.value); }} placeholder="gsk_..." style={{ width: "100%", background: C.dim, border: "1px solid " + C.border, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.text }} /><div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Paste your key here to enable AI features.</div></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>{["Should I invest more?", "Best sector now?", "Tax saving FY27", "Review portfolio", "When to book profits?"].map(function (q) { return <button key={q} onClick={function () { setAiQuery(q); callAdvisor(q); }} style={{ padding: "6px 12px", borderRadius: 8, background: C.hi, color: C.text, fontSize: 12, border: "1px solid " + C.border }}>{q}</button>; })}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}><input value={aiQuery} onChange={function (e) { setAiQuery(e.target.value); }} onKeyDown={function (e) { if (e.key === "Enter" && !aiLoading) callAdvisor(); }} placeholder="Ask anything..." style={{ flex: 1, background: C.hi, border: "1px solid " + C.border, borderRadius: 10, padding: "12px 16px", fontSize: 14 }} /><button onClick={function () { callAdvisor(); }} disabled={aiLoading} style={{ padding: "12px 20px", borderRadius: 10, background: aiLoading ? C.dim : C.green, color: "#000", fontWeight: 700, fontSize: 14 }}>{aiLoading ? "..." : "Ask"}</button></div>
            {aiLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner /><div style={{ fontSize: 13, color: C.muted, marginTop: 12 }}>Analyzing...</div></div>}
            {aiResponse && <div style={{ background: C.hi, borderRadius: 12, padding: 18, marginTop: 8, border: "1px solid " + C.border }}>{renderMarkdown(aiResponse)}</div>}
          </Card>
        </div>}

        {/* ══ HABITS ══ */}
        {tab === "habits" && <div className="fadeUp">
          <Card borderColor={checkedCount === totalChecks ? C.green + "55" : C.border} style={{ marginBottom: 14, background: checkedCount === totalChecks ? C.green + "06" : C.card }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><Label color={checkedCount === totalChecks ? C.green : C.muted}>{"\u2600"} Morning Checklist</Label><Tag color={checkedCount === totalChecks ? C.green : C.amber}>{checkedCount}/{totalChecks}</Tag></div>
            <Bar pct={(checkedCount / totalChecks) * 100} color={C.green} height={4} />
            <div style={{ marginTop: 14 }}>{MCHECKS.map(function (item) { var ch = checks[item.key]; return <div key={item.key} onClick={function () { setChecks(function (p) { return Object.assign({}, p, { [item.key]: !p[item.key] }); }); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid " + C.border, cursor: "pointer" }}><div style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid " + (ch ? C.green : C.dim), background: ch ? C.green + "20" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.green, flexShrink: 0 }}>{ch ? "\u2713" : ""}</div><span style={{ fontSize: 14, color: ch ? C.green : C.text, textDecoration: ch ? "line-through" : "none" }}>{item.label}</span></div>; })}</div>
            {checkedCount === totalChecks && <div style={{ marginTop: 14, background: C.green + "15", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.green, textAlign: "center" }}>{"\u2705"} All done!</div>}
            {checkedCount > 0 && checkedCount < totalChecks && <button onClick={function () { setChecks({ giftNifty: false, crude: false, usdinr: false, fii: false, pe: false, weekFII: false }); }} style={{ marginTop: 12, fontSize: 11, color: C.muted, background: "transparent", padding: "4px 8px" }}>Reset</button>}
          </Card>
          <Card style={{ marginBottom: 14 }}><Label>{"\ud83d\udcc5"} Tax Calendar 2026-27</Label>{TAX_DATES.map(function (t, i) { var d = isDone("tax-" + i); return <div key={i} onClick={function () { toggleDone("tax-" + i); }} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid " + C.border, cursor: "pointer", opacity: d ? 0.5 : 1 }}><div style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid " + (d ? C.green : t.urgent ? C.red : C.dim), background: d ? C.green + "20" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.green, flexShrink: 0 }}>{d ? "\u2713" : ""}</div><div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontWeight: 600, fontSize: 14, textDecoration: d ? "line-through" : "none", color: d ? C.muted : C.text }}>{t.e}</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: t.urgent ? C.red : C.muted }}>{t.d}</div></div><div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{t.a}</div></div>{t.urgent && !d && <Tag color={C.red}>URGENT</Tag>}</div>; })}</Card>
          <Card><Label>{"\ud83d\udcda"} Investment Wisdom</Label>{PRINCIPLES.map(function (p) { var a = activePrinciple === p.investor; return <div key={p.investor} style={{ marginBottom: 8 }}><button onClick={function () { setActivePrinciple(a ? null : p.investor); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: 10, background: a ? p.color + "15" : C.hi, border: "1px solid " + (a ? p.color : C.border), color: C.text, fontSize: 14, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>{p.investor}</span><Tag color={p.color}>{p.tag}</Tag></button>{a && <div style={{ padding: "12px 14px" }}>{p.rules.map(function (r, i) { return <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}><span style={{ color: p.color, fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>{i + 1}.</span><span style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{r}</span></div>; })}</div>}</div>; })}</Card>
        </div>}

      </div>
    </div>
  );
}
