<script>
  /* СТОРІНКА 5 — РОСІЙСЬКА ВИДАЧА GOOGLE: знімок від 03.10.2026 за запитом «Алексей Гончаренко». Це не часовий ряд, а те,
     що Google вважав актуальним у день знімка; тому графіки по місяцях — лише розподіл датованих результатів. */
  import { num, pct, colorOf } from "$lib/api.js";
  import { S } from "$lib/state.svelte.js";
  import { D, google, series, groupBy, tezaGroup, tone, isAbout, hasRos, TEZA, TEZA_LABEL, ROL_LABEL, SENT_LABEL } from "$lib/data.svelte.js";
  import { openDrill } from "$lib/drill.svelte.js";
  import Panel from "$lib/ui/Panel.svelte";
  import Segmented from "$lib/ui/Segmented.svelte";
  import KpiCards from "$lib/ui/KpiCards.svelte";
  import StackBars from "$lib/charts/StackBars.svelte";
  import RankBars from "$lib/charts/RankBars.svelte";
  import Chips from "$lib/ui/Chips.svelte";
  import { theme } from "$lib/theme.svelte.js";

  const dark = $derived(theme.choice === "dark" || (theme.choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
  const C = (k) => colorOf(k, dark);
  let showAll = $state(false);
  const all = $derived(D.rows.filter((r) => r.g));
  const rows = $derived(google());
  const dated = $derived(rows.filter((r) => r.day));
  const kpi = $derived.by(() => {
    const about = rows.filter(isAbout), neg = about.filter((r) => tone(r) === "neg");
    const q = rows.filter((r) => r.rol === "quotes"), myr = q.filter((r) => r.teza.includes("myr"));
    const oct = dated.filter((r) => r.m === "2026-10");
    return [
      { label: "результатів у знімку", value: num(all.length), hint: `релевантних про нього ${num(rows.length)}, з датою публікації ${num(dated.length)}` },
      { label: "негативних серед матеріалів саме про нього", value: pct(neg.length / (about.length || 1), 0), tone: "neg", hint: `${num(neg.length)} з ${num(about.length)}` },
      { label: "цитують його про мир", value: num(myr.length), hint: `з ${num(q.length)} результатів, що цитують його` },
      { label: "опубліковано 1–3 жовтня 2026", value: num(oct.length), hint: `${pct(oct.length / (dated.length || 1), 0)} датованих результатів; з них про мир ${num(oct.filter((r) => r.teza.includes("myr")).length)}` },
    ];
  });
  const keys = $derived(S.gKey === "myr" ? [{ key: "myr", label: "цитують його про мир", color: C("myr") }, { key: "other", label: "інші результати", color: C("none") }]
    : S.gKey === "teza" ? TEZA.map((k) => ({ key: k, label: TEZA_LABEL[k], color: C(k) }))
    : [{ key: "neg", label: "негативно", color: dark ? "#ff5a78" : "#d92546" }, { key: "neu", label: "нейтрально", color: dark ? "#7b8595" : "#9aa4b2" }, { key: "pos", label: "позитивно", color: dark ? "#35d39b" : "#129a6b" }]);
  const fn = $derived(S.gKey === "myr" ? (r) => (r.rol === "quotes" && r.teza.includes("myr") ? "myr" : "other") : S.gKey === "teza" ? (r) => (r.rol === "quotes" ? tezaGroup(r) : null) : (r) => (isAbout(r) ? tone(r) : null));
  const tRows = $derived(series(dated, "month", fn, keys.map((k) => k.key), "2025-01-01", "2026-10-31"));
  const tPick = (p) => { const b = tRows.find((x) => x.b === p.b); if (b) openDrill("Видача Google", `${p.b} · ${keys.find((k) => k.key === p.key)?.label}`, b.items[p.key] || []); };

  const srcRows = $derived(groupBy(rows, (r) => r.src || r.ch || "—").map((g) => {
    const o = { key: g.key, label: g.key, n: g.n, items: g.items };
    for (const k of TEZA) o[k] = g.items.filter((r) => r.rol === "quotes" && tezaGroup(r) === k).length;
    o.notq = g.items.filter((r) => r.rol !== "quotes").length;
    return o;
  }));
  const srcKeys = $derived([...TEZA.map((k) => ({ key: k, label: "цитує: " + TEZA_LABEL[k], color: C(k) })), { key: "notq", label: "не цитує (про нього / згадка)", color: C("about") }]);
  const srcPick = (p) => openDrill(`Джерело: ${p.row.label}`, srcKeys.find((k) => k.key === p.key)?.label, p.row.items.filter((r) => (p.key === "notq" ? r.rol !== "quotes" : r.rol === "quotes" && tezaGroup(r) === p.key)));
  const table = $derived((showAll ? all : rows).slice().sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)));
</script>

<h2 class="mb-1 mt-2 text-[19px] font-semibold tracking-tight">Російська видача Google</h2>
<p class="mb-4 max-w-[92ch] text-[13px] text-muted-foreground">
  Знімок видачі від 03.10.2026 за запитом «Алексей Гончаренко»; дати публікації відновлено зі сторінок і YouTube. Видача показує те, що Google
  вважає актуальним сьогодні, тож свіжі матеріали в ній переважають завжди — це підтвердження, що тема миру зараз на першій сторінці, а не часовий ряд.
</p>
<KpiCards items={kpi} />

<Panel title="1 · Датовані результати за місяцем публікації">
  {#snippet controls()}
    <Segmented label="розріз" value={S.gKey} options={[{ value: "myr", label: "мир / інше" }, { value: "teza", label: "тема цитування" }, { value: "tone", label: "тональність про нього" }]} onchange={(v) => (S.gKey = v)} />
  {/snippet}
  <StackBars rows={tRows} keys={keys} step="month" onpick={tPick} height={260} />
</Panel>

<Panel title="2 · Джерела у видачі" note="Сайт або канал результату; поділ — чи цитує він Гончаренка і про що.">
  <RankBars items={srcRows} keys={srcKeys} onpick={srcPick} />
</Panel>

<Panel title={`3 · Усі результати (${num(table.length)})`} note="У порядку видачі. Клік по рядку відкриває текст і розмітку.">
  {#snippet controls()}
    <Segmented label="показати" value={showAll ? "all" : "rel"} options={[{ value: "rel", label: "лише релевантні" }, { value: "all", label: "усі, включно з нерелевантними" }]} onchange={(v) => (showAll = v === "all")} />
  {/snippet}
  <div class="overflow-x-auto">
    <table class="w-full text-[12.5px]">
      <thead class="text-left text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th class="px-2 py-1.5">#</th><th class="px-2 py-1.5">дата</th><th class="px-2 py-1.5">джерело</th><th class="px-2 py-1.5">заголовок</th><th class="px-2 py-1.5">розмітка</th></tr></thead>
      <tbody>
        {#each table as r (r.id)}
          <tr class="cursor-pointer border-t border-border/60 align-top hover:bg-accent/50" onclick={() => openDrill(r.src || r.ch, "результат Google", [r])}>
            <td class="tnum px-2 py-1.5 text-muted-foreground">{r.rank ?? "—"}</td>
            <td class="tnum px-2 py-1.5 whitespace-nowrap">{r.day || "без дати"}</td>
            <td class="px-2 py-1.5">{r.src || r.ch}</td>
            <td class="px-2 py-1.5">{r.title || r.url}</td>
            <td class="px-2 py-1.5"><div class="flex flex-wrap gap-1"><Chips r={r} /></div></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</Panel>
