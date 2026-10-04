"""Знімок даних проєкту 5 (Гончаренко) для статичного дашборда: Telemetrio (UA+RU) і Google. YouScan не береться.

    cd /opt/ghost && venv/bin/python /tmp/export_dash.py /tmp/dash_data
Пише:
  meta.json      — батчі, словники вимірів, межі дат, лічильники
  items.json     — усі матеріали без тексту (компактні масиви колонок)
  text/<batch>.json — {id: text} повні тексти по батчах (довантажуються на вимогу)
Реклама й дублі НЕ викидаються: прапорці is_ad / dup_of лишаються, фільтрує дашборд (щоб число на екрані можна було розкрити).
"""
import json, os, sqlite3, sys
from datetime import datetime
from zoneinfo import ZoneInfo

OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/dash_data"
PID = 5
KYIV = ZoneInfo("Europe/Kyiv")
os.makedirs(os.path.join(OUT, "text"), exist_ok=True)
con = sqlite3.connect("file:ghost.db?mode=ro", uri=True)
con.row_factory = sqlite3.Row

batches = [dict(r) for r in con.execute("SELECT id, kind, name, created_at FROM e_batch WHERE project_id=? AND kind IN ('telemetrio','google') ORDER BY id", (PID,))]
bids = [b["id"] for b in batches]
qmarks = ",".join("?" * len(bids))

rows = con.execute(f"""
  SELECT i.id, i.batch_id, i.url, i.title, i.snippet, i.author, i.date_iso, i.views, i.domain, i.platform, i.dup_of,
         i.channel_id, i.message_id, i.subscribers, i.serp_rank, i.excluded, i.relevance_override, i.is_own, i.is_ad,
         i.fwd_from, i.fwd_url, i.shares, i.reactions, i.comments, i.chan_category, i.chan_country, i.raw_json,
         a.relevant, a.sentiment, a.target, a.category, a.summary, a.evidence, a.relevance_why,
         d.d_teza, d.d_zvynuvachennia, d.d_rol, d.d_quote_stance, d.d_quote_stance_v,
         f.text AS fulltext
  FROM e_item i
  LEFT JOIN e_analysis a ON a.item_id=i.id
  LEFT JOIN e_item_dims d ON d.item_id=i.id
  LEFT JOIN e_fulltext f ON f.item_id=i.id
  WHERE i.batch_id IN ({qmarks}) ORDER BY i.id""", bids).fetchall()


def kyiv(iso):
    if not iso:
        return None
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(KYIV).strftime("%Y-%m-%dT%H:%M")
    except ValueError:
        return None


COLS = ["id", "b", "dt", "ch", "cc", "cat", "subs", "views", "url", "title", "rel", "sent", "tgt", "gcat", "rol", "teza", "zv", "qsv",
        "ad", "dup", "own", "fwd", "shares", "react", "comm", "src", "rank"]
chan_idx = {}          # username -> індекс у meta.channels (економія ~40% items.json)
SHARD = 2000           # деталі (текст, доказ, резюме) — шардами по id, щоб модалка тягла 1–2 файли, а не 17 МБ
data = {c: [] for c in COLS}
texts = {}
chan_names = {}
for r in rows:
    raw = {}
    try:
        raw = json.loads(r["raw_json"] or "{}")
    except ValueError:
        pass
    is_g = r["batch_id"] == 15
    ch = (raw.get("Channel Username") or r["author"] or r["domain"] or "")
    chn = raw.get("Channel Name") or r["author"] or r["domain"] or ""
    if ch:
        chan_names[ch] = chn
    text = r["fulltext"] or raw.get("Text") or r["snippet"] or ""
    texts.setdefault(r["id"] // SHARD, {})[r["id"]] = [text, (r["evidence"] or "")[:400], (r["summary"] or "")[:400], (r["relevance_why"] or "")[:120], r["fwd_url"] or "", r["d_quote_stance"] or ""]
    data["id"].append(r["id"]); data["b"].append(r["batch_id"]); data["dt"].append(kyiv(r["date_iso"]))
    data["ch"].append(chan_idx.setdefault(ch, len(chan_idx))); data["cc"].append(r["chan_country"] or ("" if is_g else None))
    data["cat"].append(r["chan_category"]); data["subs"].append(r["subscribers"]); data["views"].append(r["views"])
    data["url"].append(r["url"]); data["title"].append((r["title"] or "")[:200] if is_g else "")
    data["rel"].append(r["relevant"]); data["sent"].append(r["sentiment"]); data["tgt"].append(r["target"]); data["gcat"].append(r["category"])
    data["rol"].append(r["d_rol"]); data["teza"].append(r["d_teza"]); data["zv"].append(r["d_zvynuvachennia"])
    data["qsv"].append(r["d_quote_stance_v"])
    data["ad"].append(1 if r["is_ad"] else 0); data["dup"].append(r["dup_of"]); data["own"].append(1 if r["is_own"] else 0)
    data["fwd"].append((r["fwd_from"] or "")[:60])
    data["shares"].append(r["shares"]); data["react"].append(r["reactions"]); data["comm"].append(r["comments"])
    data["src"].append(raw.get("Source") or "" if is_g else ""); data["rank"].append(r["serp_rank"] if is_g else None)

for b, m in texts.items():
    json.dump(m, open(os.path.join(OUT, "text", f"{b}.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
channels = [{"u": u, "n": chan_names.get(u, "")} for u in chan_idx]
json.dump({"cols": COLS, "n": len(rows), **data}, open(os.path.join(OUT, "items.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

dates = [d for d in data["dt"] if d]
meta = {
    "project": "Олексій Гончаренко", "exported_at": datetime.now(KYIV).strftime("%Y-%m-%d %H:%M"),
    "batches": [{**b, "n": data["b"].count(b["id"])} for b in batches],
    "date_min": min(dates)[:10], "date_max": max(dates)[:10], "n_items": len(rows),
    "channels": channels, "shard": SHARD,
    "dims": {
        "teza": {"myr": "мир, переговори", "tck": "ТЦК, мобілізація", "vlada": "критика влади", "inshe": "інші тези"},
        "zv": {"ros_propahanda": "російська пропаганда / робота на РФ", "populizm": "популізм", "koruptsiia": "корупція", "zrada": "зрада", "inshe": "інше"},
        "rol": {"about": "про нього", "quotes": "цитує його", "mention": "згадка"},
        "qsv": {"endorses": "схвально", "neutral": "нейтрально", "critical": "критично"},
        "gcat": {"tck_mobilizatsiia": "ТЦК і мобілізація", "parlament": "парламент", "myr_perehovory": "мир і переговори", "mizhnarodne": "міжнародне",
                 "vlada_kritika": "критика влади", "koruptsiia": "корупція", "osobysto": "особисте", "hromadska": "громадська діяльність", "odesa": "Одеса", "inshe": "інше"},
        "sent": {"-2": "різко негативно", "-1": "негативно", "0": "нейтрально", "1": "позитивно", "2": "дуже позитивно"},
        "tgt": {"subject": "саме про нього", "other": "про інше"},
    },
}
json.dump(meta, open(os.path.join(OUT, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
sizes = {f: os.path.getsize(os.path.join(OUT, f)) // 1024 for f in os.listdir(OUT) if f.endswith(".json")}
print("rows", len(rows), "channels", len(chan_names), "sizes KB", sizes, "text KB", sum(os.path.getsize(os.path.join(OUT, "text", f)) for f in os.listdir(os.path.join(OUT, "text"))) // 1024)
print("tgt values", [tuple(r) for r in con.execute("select target, count(*) from e_analysis a join e_item i on i.id=a.item_id where i.batch_id in (%s) group by 1" % qmarks, bids)])
print("rol values", [tuple(r) for r in con.execute("select d_rol, count(*) from e_item_dims d join e_item i on i.id=d.item_id where i.batch_id in (%s) group by 1" % qmarks, bids)])
