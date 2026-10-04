/* ============================================================================
   ШАР ДАНИХ — УСЕ РАХУЄТЬСЯ В БРАУЗЕРІ

   Знімок із Ghost (проєкт «Олексій Гончаренко»): items.json — усі матеріали
   без тексту, колонками; text/<shard>.json — тексти, докази й резюме,
   довантажуються лише коли їх відкривають (модалка, вкладка матеріалів).

   ПРАВИЛО ДАШБОРДА (успадковане з f.ppl.watch): будь-яке число можна розкрити
   й побачити, ЩО саме в нього порахувалося. Тому кожна панель рахує зі
   списку рядків і той самий список віддає модалці — число й перелік
   збігаються за побудовою, а не «приблизно».
   ============================================================================ */

export const D = $state({ ready: false, error: null, meta: null, rows: [], progress: "" });
const byId = new Map();
const shards = new Map();          // shard -> Map(id -> [text, evidence, summary, why, fwd_url, qs_first])
const BASE = import.meta.env.BASE_URL || "/";

const split = (s) => (s ? String(s).split(";").filter(Boolean) : []);
const CC = { ukraine: "ua", russia: "ru" };

export async function load() {
  try {
    D.progress = "завантаження знімка…";
    const [meta, items] = await Promise.all([
      fetch(BASE + "data/meta.json").then((r) => r.json()),
      fetch(BASE + "data/items.json").then((r) => r.json()),
    ]);
    const ch = meta.channels;
    const n = items.n, out = new Array(n);
    for (let i = 0; i < n; i++) {
      const dt = items.dt[i] || "";
      const b = items.b[i], g = b === 15;
      const c = ch[items.ch[i]] || { u: "", n: "" };
      out[i] = {
        id: items.id[i], b, g, dt, day: dt.slice(0, 10), m: dt.slice(0, 7),
        ch: c.u, chn: c.n || c.u, cc: g ? "g" : (CC[items.cc[i]] || "other"),
        cat: items.cat[i] || "", subs: items.subs[i] || 0, views: items.views[i] || 0,
        url: items.url[i] || "", title: items.title[i] || "",
        rel: items.rel[i], sent: items.sent[i], tgt: items.tgt[i] || "", gcat: items.gcat[i] || "",
        rol: items.rol[i] || "", teza: split(items.teza[i]), zv: split(items.zv[i]), qsv: items.qsv[i] || "",
        ad: !!items.ad[i], dup: items.dup[i] != null, own: !!items.own[i], fwd: items.fwd[i] || "",
        shares: items.shares[i] || 0, react: items.react[i] || 0, comm: items.comm[i] || 0,
        src: items.src[i] || "", rank: items.rank[i],
      };
      byId.set(out[i].id, out[i]);
    }
    // Межі періоду — лише за Telemetrio: у видачі Google є сторінки 2000–2024 років (вікі, досьє), і вони не мають розтягувати вісь.
    const days = out.filter((r) => !r.g && r.day).map((r) => r.day);
    meta.date_min = days.reduce((a, d) => (d < a ? d : a), days[0]); meta.date_max = days.reduce((a, d) => (d > a ? d : a), days[0]);
    D.meta = meta; D.rows = out; D.ready = true; D.progress = "";
  } catch (e) {
    D.error = e;
  }
}

/* --- словники --- */
export const TEZA = ["myr", "tck", "vlada", "inshe", "none"];
export const TEZA_LABEL = { myr: "мир, переговори", tck: "ТЦК, мобілізація", vlada: "критика влади", inshe: "інші тези", none: "без окремої тези" };
export const ZV = ["ros_propahanda", "populizm", "koruptsiia", "zrada", "inshe"];
export const ZV_LABEL = { ros_propahanda: "російська пропаганда / робота на РФ", populizm: "популізм", koruptsiia: "корупція", zrada: "зрада", inshe: "інше" };
export const ROL_LABEL = { quotes: "цитує його", about: "про нього", mention: "згадка", "": "не розмічено" };
export const QSV_LABEL = { endorses: "схвально", neutral: "нейтрально", critical: "критично", "": "не перевірено" };
export const CC_LABEL = { ua: "українські канали", ru: "російські канали", other: "інші країни", g: "Google" };
export const SENT_LABEL = { "-2": "різко негативно", "-1": "негативно", 0: "нейтрально", 1: "позитивно", 2: "дуже позитивно" };
export const TGT_LABEL = { subject: "саме про нього", third_party: "про інше / третіх осіб", unclear: "незрозуміло", "": "—" };
export const GCAT_LABEL = {
  tck_mobilizatsiia: "ТЦК і мобілізація", parlament: "парламент", myr_perehovory: "мир і переговори", mizhnarodne: "міжнародне",
  vlada_kritika: "критика влади", koruptsiia: "корупція", osobysto: "особисте", hromadska: "громадська діяльність", odesa: "Одеса", inshe: "інше", "": "—",
};

/* Виключна група тези для 100%-стосів: мир > ТЦК > влада > інше; без тези — none. */
export function tezaGroup(r) {
  for (const k of ["myr", "tck", "vlada"]) if (r.teza.includes(k)) return k;
  return r.teza.length ? "inshe" : "none";
}
/* Полюс тональності — лише для матеріалів САМЕ про нього (tgt=subject). */
export const tone = (r) => (r.sent == null ? "" : r.sent < 0 ? "neg" : r.sent > 0 ? "pos" : "neu");
export const isAbout = (r) => r.tgt === "subject" && r.sent != null;
export const hasRos = (r) => r.zv.includes("ros_propahanda");

/* --- корпус ---
   «Корпус» = релевантні матеріали без реклами й дублів. Відсіяне не викидається:
   вкладка матеріалів показує його за перемикачем, бо «що саме відкинули» — теж питання. */
export const inCorpus = (r) => r.rel === 1 && !r.ad && !r.dup;
export const corpus = () => D.rows.filter(inCorpus);
export const tg = (cc = "all") => D.rows.filter((r) => inCorpus(r) && !r.g && (cc === "all" ? r.cc !== "other" : r.cc === cc));
export const google = () => D.rows.filter((r) => inCorpus(r) && r.g);

/* --- час --- */
const pad = (n) => String(n).padStart(2, "0");
export function weekStart(day) {
  const d = new Date(day + "T00:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7;          // понеділок = 0 (Київ)
  d.setUTCDate(d.getUTCDate() - dow);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
export const bucket = (r, step) => (step === "month" ? r.m : step === "week" ? weekStart(r.day) : r.day);
export function inRange(r, from, to) {
  return (!from || r.day >= from) && (!to || r.day <= to);
}
/* Повний ряд кошиків між min і max — порожні місяці/тижні мають бути на осі нулями, а не зникати. */
export function bucketsBetween(step, from, to) {
  const out = [];
  if (!from || !to) return out;
  if (step === "month") {
    let [y, m] = from.slice(0, 7).split("-").map(Number);
    const end = to.slice(0, 7);
    for (let k = `${y}-${pad(m)}`; k <= end; k = `${y}-${pad(m)}`) { out.push(k); m++; if (m > 12) { m = 1; y++; } }
    return out;
  }
  let d = step === "week" ? weekStart(from) : from;
  const stepDays = step === "week" ? 7 : 1;
  while (d <= to) {
    out.push(d);
    const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + stepDays);
    d = t.toISOString().slice(0, 10);
  }
  return out;
}
/* Ряд: для кожного кошика лічильники за ключами + масиви рядків (для розкриття). */
export function series(rows, step, keyFn, keys, from, to) {
  const map = new Map();
  for (const r of rows) {
    const b = bucket(r, step); const k = keyFn(r);
    if (k == null || k === false) continue;
    let o = map.get(b);
    if (!o) { o = { b, n: 0, items: {} }; for (const key of keys) { o[key] = 0; o.items[key] = []; } map.set(b, o); }
    if (!(k in o.items)) { o[k] = 0; o.items[k] = []; }
    o[k]++; o.n++; o.items[k].push(r);
  }
  const lo = from || [...map.keys()].sort()[0], hi = to || [...map.keys()].sort().at(-1);
  return bucketsBetween(step, lo, hi).map((b) => map.get(b) || { b, n: 0, items: Object.fromEntries(keys.map((k) => [k, []])), ...Object.fromEntries(keys.map((k) => [k, 0])) });
}
/* Групування за довільним ключем: [{key, n, items}] за спаданням. */
export function groupBy(rows, keyFn) {
  const map = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (k == null || k === "") continue;
    const ks = Array.isArray(k) ? k : [k];
    for (const kk of ks) {
      let o = map.get(kk);
      if (!o) { o = { key: kk, n: 0, items: [] }; map.set(kk, o); }
      o.n++; o.items.push(r);
    }
  }
  return [...map.values()].sort((a, b) => b.n - a.n);
}

/* --- тексти (шарди за id) --- */
export async function details(ids) {
  const want = new Set(ids.map((id) => Math.floor(id / (D.meta?.shard || 2000))));
  await Promise.all([...want].filter((s) => !shards.has(s)).map(async (s) => {
    const r = await fetch(`${BASE}data/text/${s}.json`);
    const j = r.ok ? await r.json() : {};
    shards.set(s, new Map(Object.entries(j).map(([k, v]) => [Number(k), v])));
  }));
  const out = new Map();
  for (const id of ids) {
    const sh = shards.get(Math.floor(id / (D.meta?.shard || 2000)));
    const v = sh?.get(id);
    if (v) out.set(id, { text: v[0], evidence: v[1], summary: v[2], why: v[3], fwd_url: v[4], qs1: v[5] });
  }
  return out;
}
export async function loadAllTexts(onProgress) {
  const all = new Set(D.rows.map((r) => Math.floor(r.id / (D.meta?.shard || 2000))));
  let k = 0;
  for (const s of all) {
    if (!shards.has(s)) await details([s * (D.meta?.shard || 2000)]);
    onProgress?.(++k, all.size);
  }
}
export const textOf = (id) => shards.get(Math.floor(id / (D.meta?.shard || 2000)))?.get(id)?.[0] ?? null;
export const rowById = (id) => byId.get(id);

/* --- експорт переліку --- */
export function toCSV(rows) {
  const cols = ["id", "date", "channel", "channel_name", "country", "url", "views", "relevant", "sentiment", "target", "category", "role", "teza", "accusation", "quote_stance", "ad", "dup"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [cols.join(",")];
  for (const r of rows) lines.push([r.id, r.dt, r.ch, r.chn, r.cc, r.url, r.views, r.rel, r.sent, r.tgt, r.gcat, r.rol, r.teza.join(";"), r.zv.join(";"), r.qsv, r.ad ? 1 : 0, r.dup ? 1 : 0].map(esc).join(","));
  return "﻿" + lines.join("\r\n");
}
export function download(name, text, mime = "text/csv;charset=utf-8") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
