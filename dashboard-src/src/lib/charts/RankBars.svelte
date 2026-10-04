<script>
  /* Горизонтальний рейтинг із поділом смуги. Довжина — обсяг, поділ — склад.
     Домен Y розвернутий навмисно: SveltePlot кладе перший елемент домену ВНИЗУ. */
  import { Plot, BarX, GridX } from "svelteplot";
  import { num, pct } from "$lib/api.js";

  let {
    items = [],       // [{ key, label, <k>: n, n }]
    keys = [],        // [{ key, label, color }]
    onpick = null,
    height = null,
    percent = false,
  } = $props();

  const label = (r) => (r.label && r.label.length <= 34 ? r.label : (r.label || r.key).slice(0, 32) + "…");
  const long = $derived.by(() => {
    const out = [];
    for (const r of items) {
      const tot = keys.reduce((a, k) => a + (r[k.key] ?? 0), 0) || 1;
      for (const k of keys) {
        const v = r[k.key] ?? 0;
        if (!v) continue;
        out.push({ y: label(r), k: k.key, lab: k.label, value: percent ? v / tot : v, raw: v, row: r, tot });
      }
    }
    return out;
  });
  const order = $derived([...items].reverse().map(label));
  const h = $derived(height ?? Math.max(160, items.length * 24 + 44));
  const domain = $derived(keys.map((k) => k.label));
  const scheme = $derived(Object.fromEntries(keys.map((k) => [k.label, k.color])));
</script>

<div class="plot-wrap">
  <Plot height={h} marginLeft={210} marginRight={20} marginTop={6} marginBottom={28}
    x={{ grid: true, label: false, domain: percent ? [0, 1] : null,
         tickFormat: percent ? (d) => Math.round(d * 100) + "%" : (d) => (d >= 1e3 ? (d / 1e3).toFixed(0) + " тис" : String(d)) }}
    y={{ domain: order, label: false }}
    color={{ domain, scheme, legend: keys.length > 1 }}>
    <GridX />
    <BarX data={long} x="value" y="y" fill="lab"
      onclick={(e, d) => onpick?.({ row: d.row, key: d.k })}
      title={(d) => `${d.row.label || d.row.key}\n${d.lab}: ${num(d.raw)} з ${num(d.row.n)} (${pct(d.raw / (d.row.n || 1), 0)})${d.row.sub ? "\n" + d.row.sub : ""}`} />
  </Plot>
</div>
