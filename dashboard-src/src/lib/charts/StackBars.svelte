<script>
  /* Складені стовпці (час або категорії). Клік по сегменту віддає (x, key) —
     панель сама знає, які рядки за ним стоять, і відкриває їх у вікні. */
  import { Plot, BarY, RuleX, Text, GridY } from "svelteplot";
  import { num, pct } from "$lib/api.js";
  import { bucketLabel, bucketFull } from "$lib/fmt.js";

  let {
    rows = [],            // [{ b, <key>: n, ... }]
    keys = [],            // [{ key, label, color }]
    percent = false,
    step = "month",       // month | week | day | cat
    height = 300,
    onpick = null,
    events = [],          // [{ day|b, label }]
    labelOf = null,       // підпис категорії для step=cat
    every = null,
  } = $props();

  const long = $derived.by(() => {
    const out = [];
    for (const r of rows) {
      const tot = keys.reduce((a, k) => a + (r[k.key] ?? 0), 0);
      const den = percent ? (tot || 1) : 1;
      for (const k of keys) {
        const v = r[k.key] ?? 0;
        out.push({ b: r.b, k: k.key, label: k.label, value: v / den, raw: v, tot });
      }
    }
    return out;
  });
  const domain = $derived(keys.map((k) => k.label));
  const scheme = $derived(Object.fromEntries(keys.map((k) => [k.label, k.color])));
  const xs = $derived(rows.map((r) => r.b));
  const n = $derived(xs.length);
  const ev = $derived(every ?? Math.max(1, Math.ceil(n / (step === "week" ? 14 : step === "day" ? 20 : 24))));
  const ticks = $derived(xs.filter((_, i) => i % ev === 0 || i === n - 1));
  const fmtX = (d) => (step === "cat" ? (labelOf ? labelOf(d) : d) : step === "month" ? mLabel(d) : bucketLabel(d, step));
  const MONTHS = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"];
  const mLabel = (m) => MONTHS[+m.slice(5, 7) - 1] + (m.endsWith("-01") || m === xs[0] ? " " + m.slice(2, 4) : "");
  const top = $derived(percent ? 1 : Math.max(1, ...rows.map((r) => keys.reduce((a, k) => a + (r[k.key] ?? 0), 0))));
  const bucketOf = (day) => {
    if (xs.includes(day)) return day;
    const before = xs.filter((b) => b <= day);
    return before.length ? before[before.length - 1] : null;
  };
  /* Підписи подій ярусами: сусідні події (листопад — січень) інакше налазять одна на одну. */
  const evs = $derived((events ?? []).map((e) => ({ ...e, b: e.b ?? bucketOf(e.day) })).filter((e) => e.b).map((e, i) => ({ ...e, dy: -4 - 12 * (i % 3) })));
</script>

<div class="plot-wrap">
  <Plot
    height={height} marginLeft={52} marginBottom={step === "cat" ? 70 : 48} marginTop={40} marginRight={10}
    x={{ type: "band", label: false, domain: xs, ticks, tickFormat: fmtX, tickRotate: step === "cat" ? -30 : -38 }}
    y={{ grid: true, label: false, domain: percent ? [0, 1] : null,
         tickFormat: percent ? (d) => Math.round(d * 100) + "%" : (d) => (d >= 1e3 ? (d / 1e3).toFixed(d >= 1e4 ? 0 : 1).replace(".", ",") + " тис" : String(d)) }}
    color={{ domain, scheme, legend: keys.length > 1 }}
  >
    <GridY />
    <BarY data={long} x="b" y="value" fill="label"
      onclick={(e, d) => onpick?.({ b: d.b, key: d.k })}
      title={(d) => `${step === "cat" ? fmtX(d.b) : bucketFull(d.b, step === "week" ? "week" : "day")}\n${d.label}: ${num(d.raw)}${percent || d.tot !== d.raw ? ` з ${num(d.tot)} (${pct(d.raw / (d.tot || 1), 0)})` : ""}`} />
    {#each evs as e (e.b + e.label)}
      <RuleX data={[e.b]} stroke="var(--c-neg)" strokeWidth={1.4} title={() => e.label} />
    {/each}
    {#each evs as e (e.b + e.label)}
      <Text data={[{ b: e.b, t: e.label }]} x="b" y={top} text="t" dy={e.dy} fontSize={10} fontWeight="600" fill="var(--c-neg)" textAnchor="middle" />
    {/each}
  </Plot>
</div>
