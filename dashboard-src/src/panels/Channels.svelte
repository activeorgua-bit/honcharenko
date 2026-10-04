<script>
  /* СТОРІНКА 4 — КАНАЛИ: хто говорить найбільше, хто найрізкіший, хто схвалює. Таблиця сортується, рядок відкриває дописи каналу. */
  import { num, pct, colorOf } from "$lib/api.js";
  import { S } from "$lib/state.svelte.js";
  import { tg, inRange, groupBy, tone, isAbout, hasRos, ROL_LABEL, CC_LABEL } from "$lib/data.svelte.js";
  import { openDrill } from "$lib/drill.svelte.js";
  import Panel from "$lib/ui/Panel.svelte";
  import Segmented from "$lib/ui/Segmented.svelte";
  import RankBars from "$lib/charts/RankBars.svelte";
  import { theme } from "$lib/theme.svelte.js";

  const dark = $derived(theme.choice === "dark" || (theme.choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
  const C = (k) => colorOf(k, dark);
  let q = $state("");
  const rows = $derived(tg(S.cc).filter((r) => inRange(r, S.from, S.to)));
  const ccLabel = $derived(S.cc === "all" ? "усі канали" : CC_LABEL[S.cc]);

  const chans = $derived(groupBy(rows, (r) => r.ch).map((g) => {
    const it = g.items, about = it.filter(isAbout), neg = about.filter((r) => tone(r) === "neg").length, pos = about.filter((r) => tone(r) === "pos").length;
    const f = it[0];
    return {
      key: g.key, label: f.chn || "@" + g.key, ch: g.key, cc: f.cc, cat: f.cat, subs: f.subs, n: g.n, items: it,
      views: it.reduce((a, r) => a + r.views, 0),
      quotes: it.filter((r) => r.rol === "quotes").length, about: about.length, mention: it.filter((r) => r.rol !== "quotes" && r.rol !== "about").length,
      neg, neu: about.length - neg - pos, pos, negShare: about.length ? neg / about.length : null,
      endorses: it.filter((r) => r.qsv === "endorses").length, critical: it.filter((r) => r.qsv === "critical").length, neutral: it.filter((r) => r.qsv === "neutral").length,
      ros: it.filter(hasRos).length, own: f.own,
    };
  }));
  const SORT = {
    n: (a, b) => b.n - a.n, views: (a, b) => b.views - a.views, subs: (a, b) => b.subs - a.subs, quotes: (a, b) => b.quotes - a.quotes,
    about: (a, b) => b.about - a.about, neg: (a, b) => b.neg - a.neg, negShare: (a, b) => (b.negShare ?? -1) - (a.negShare ?? -1),
    endorses: (a, b) => b.endorses - a.endorses, ros: (a, b) => b.ros - a.ros,
  };
  const list = $derived(chans.filter((c) => c.n >= S.chMin && (!q || (c.label + " " + c.ch).toLowerCase().includes(q.toLowerCase()))).sort(SORT[S.chSort] || SORT.n));
  const shown = $derived(list.slice(0, S.chTop));

  const splitKeys = $derived(
    S.chSplit === "rol" ? [["quotes", ROL_LABEL.quotes], ["about", ROL_LABEL.about], ["mention", "згадка"]].map(([k, l]) => ({ key: k, label: l, color: C(k) }))
    : S.chSplit === "tone" ? [{ key: "neg", label: "негативно про нього", color: dark ? "#ff5a78" : "#d92546" }, { key: "neu", label: "нейтрально", color: dark ? "#7b8595" : "#9aa4b2" }, { key: "pos", label: "позитивно", color: dark ? "#35d39b" : "#129a6b" }]
    : [{ key: "endorses", label: "схвально", color: C("endorses") }, { key: "neutral", label: "нейтрально", color: C("neutral") }, { key: "critical", label: "критично", color: C("critical") }]);
  const pickRows = (c, k) => {
    if (S.chSplit === "rol") return c.items.filter((r) => (k === "mention" ? r.rol !== "quotes" && r.rol !== "about" : r.rol === k));
    if (S.chSplit === "tone") return c.items.filter((r) => isAbout(r) && tone(r) === k);
    return c.items.filter((r) => r.qsv === k);
  };
  const barPick = (p) => openDrill(p.row.label, `${splitKeys.find((x) => x.key === p.key)?.label} · @${p.row.ch}`, pickRows(p.row, p.key));
  const rowOpen = (c) => openDrill(c.label, `@${c.ch} · усі релевантні матеріали · ${ccLabel}`, c.items);
  const col = (k, l) => ({ k, l });
  const cols = [col("n", "матеріалів"), col("quotes", "цитує"), col("about", "про нього"), col("negShare", "негатив про нього"), col("endorses", "схвалює тези"), col("ros", "звинувачує в роботі на РФ"), col("views", "переглядів"), col("subs", "підписників")];
</script>

<h2 class="mb-1 mt-2 text-[19px] font-semibold tracking-tight">Канали · {ccLabel}</h2>
<p class="mb-4 max-w-[92ch] text-[13px] text-muted-foreground">
  Один рядок — один канал у вибраному періоді. «Негатив про нього» рахується лише серед матеріалів саме про нього, тому в каналів,
  які лише передруковують його заяви, ця клітинка порожня. Поріг за замовчуванням — 5 матеріалів.
</p>

<Panel title={`1 · Найактивніші канали (${num(list.length)} проходять поріг)`} note="Довжина смуги — кількість матеріалів, поділ — обраний розріз. Клік по сегменту відкриває саме ці дописи.">
  {#snippet controls()}
    <Segmented label="поділ" value={S.chSplit} options={[{ value: "rol", label: "роль" }, { value: "tone", label: "тональність про нього" }, { value: "qsv", label: "ставлення до тез" }]} onchange={(v) => (S.chSplit = v)} />
    <Segmented label="порядок" value={S.chSort} options={[{ value: "n", label: "матеріалів" }, { value: "views", label: "переглядів" }, { value: "neg", label: "негативу" }, { value: "endorses", label: "схвалень" }, { value: "ros", label: "звинувачень" }]} onchange={(v) => (S.chSort = v)} />
    <Segmented label="поріг" value={String(S.chMin)} options={[{ value: "1", label: "1" }, { value: "5", label: "5" }, { value: "20", label: "20" }]} onchange={(v) => (S.chMin = Number(v))} />
    <Segmented label="показати" value={String(S.chTop)} options={[{ value: "20", label: "20" }, { value: "40", label: "40" }, { value: "100", label: "100" }]} onchange={(v) => (S.chTop = Number(v))} />
    <input placeholder="пошук каналу" bind:value={q} class="rounded-md border border-border bg-card px-2 py-0.5 text-[12px]" />
  {/snippet}
  <RankBars items={shown.map((c) => ({ ...c, sub: `@${c.ch} · ${num(c.subs)} підписників` }))} keys={splitKeys} onpick={barPick} />
</Panel>

<Panel title="2 · Таблиця каналів" note="Клік по заголовку сортує, клік по рядку відкриває всі матеріали каналу за період.">
  <div class="overflow-x-auto">
    <table class="w-full text-[12.5px]">
      <thead class="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
        <tr>
          <th class="px-2 py-1.5">канал</th><th class="px-2 py-1.5">категорія</th>
          {#each cols as c (c.k)}
            <th class="cursor-pointer px-2 py-1.5 text-right hover:text-foreground {S.chSort === c.k ? 'text-foreground' : ''}" onclick={() => (S.chSort = c.k)}>{c.l}{S.chSort === c.k ? " ↓" : ""}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each shown as c (c.key)}
          <tr class="cursor-pointer border-t border-border/60 hover:bg-accent/50" onclick={() => rowOpen(c)}>
            <td class="px-2 py-1.5"><b>{c.label}</b> <span class="font-mono text-[10.5px] text-muted-foreground">@{c.ch}</span>{#if c.own}<span class="ml-1 rounded bg-amber-500/15 px-1 font-mono text-[9.5px] text-amber-600">його канал</span>{/if}</td>
            <td class="px-2 py-1.5 text-muted-foreground">{c.cat}</td>
            <td class="tnum px-2 py-1.5 text-right">{num(c.n)}</td>
            <td class="tnum px-2 py-1.5 text-right">{num(c.quotes)}</td>
            <td class="tnum px-2 py-1.5 text-right">{num(c.about)}</td>
            <td class="tnum px-2 py-1.5 text-right" style={c.negShare != null && c.negShare >= 0.5 ? "color:var(--c-neg)" : ""}>{c.negShare == null ? "—" : pct(c.negShare, 0)}</td>
            <td class="tnum px-2 py-1.5 text-right" style={c.endorses ? "color:var(--c-pos)" : ""}>{num(c.endorses)}</td>
            <td class="tnum px-2 py-1.5 text-right" style={c.ros ? "color:var(--c-neg)" : ""}>{num(c.ros)}</td>
            <td class="tnum px-2 py-1.5 text-right">{num(c.views)}</td>
            <td class="tnum px-2 py-1.5 text-right">{num(c.subs)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if list.length > shown.length}<p class="mt-2 text-[12px] text-muted-foreground">показано {num(shown.length)} із {num(list.length)} — змініть «показати» або звузьте пошук</p>{/if}
</Panel>
