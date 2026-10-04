<script>
  /* СТОРІНКА 2 — ЗВИНУВАЧЕННЯ: коли і хто закидає йому роботу на російську пропаганду, популізм, корупцію, зраду. */
  import { num, pct, colorOf } from "$lib/api.js";
  import { S } from "$lib/state.svelte.js";
  import { tg, inRange, series, groupBy, isAbout, hasRos, ZV, ZV_LABEL, CC_LABEL, GCAT_LABEL } from "$lib/data.svelte.js";
  import { openDrill } from "$lib/drill.svelte.js";
  import { EVENTS } from "$lib/events.js";
  import Panel from "$lib/ui/Panel.svelte";
  import Segmented from "$lib/ui/Segmented.svelte";
  import KpiCards from "$lib/ui/KpiCards.svelte";
  import StackBars from "$lib/charts/StackBars.svelte";
  import RankBars from "$lib/charts/RankBars.svelte";
  import { theme } from "$lib/theme.svelte.js";

  const dark = $derived(theme.choice === "dark" || (theme.choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
  const C = (k) => colorOf(k === "inshe" ? "inshe_zv" : k, dark);
  const rows = $derived(tg(S.cc).filter((r) => inRange(r, S.from, S.to)));
  const ccLabel = $derived(S.cc === "all" ? "усі канали" : CC_LABEL[S.cc]);
  /* Виключна група звинувачення для стосу: рос. пропаганда > зрада > корупція > популізм > інше. */
  const zvGroup = (r) => (r.zv.includes("ros_propahanda") ? "ros_propahanda" : r.zv.includes("zrada") ? "zrada" : r.zv.includes("koruptsiia") ? "koruptsiia" : r.zv.includes("populizm") ? "populizm" : r.zv.length ? "inshe" : null);
  const acc = $derived(rows.filter((r) => r.zv.length));
  const ros = $derived(rows.filter(hasRos));
  const about = $derived(rows.filter(isAbout));
  const bLabel = (b) => (S.step === "month" ? b : S.step === "week" ? `тиждень від ${b}` : b);

  const kpi = $derived.by(() => {
    const top = groupBy(ros, (r) => r.m)[0];
    const chans = groupBy(ros, (r) => r.ch);
    return [
      { label: "звинувачення в роботі на РФ / рос. пропаганді", value: num(ros.length), tone: "neg", hint: `${pct(ros.length / (about.length || 1), 0)} матеріалів саме про нього · ${ccLabel}` },
      { label: "усі звинувачення (будь-якого типу)", value: num(acc.length), hint: `популізм ${num(acc.filter((r) => r.zv.includes("populizm")).length)} · корупція ${num(acc.filter((r) => r.zv.includes("koruptsiia")).length)} · зрада ${num(acc.filter((r) => r.zv.includes("zrada")).length)}` },
      { label: "пік звинувачень у роботі на РФ", value: top ? top.key : "—", hint: top ? `${num(top.n)} дописів за місяць` : "" },
      { label: "каналів, що звинувачували в роботі на РФ", value: num(chans.length), hint: chans[0] ? `найчастіше: ${chans[0].items[0].chn} (${num(chans[0].n)})` : "" },
    ];
  });

  const keysAll = $derived(ZV.map((k) => ({ key: k, label: ZV_LABEL[k], color: C(k) })));
  const keysRos = $derived([{ key: "ros_propahanda", label: ZV_LABEL.ros_propahanda, color: C("ros_propahanda") }]);
  const tRows = $derived(S.acKey === "ros" ? series(ros, S.step, () => "ros_propahanda", ["ros_propahanda"], S.from, S.to) : series(acc, S.step, zvGroup, ZV, S.from, S.to));
  const tPick = (p) => { const b = tRows.find((x) => x.b === p.b); if (b) openDrill("Звинувачення", `${bLabel(p.b)} · ${ZV_LABEL[p.key]} · ${ccLabel}`, b.items[p.key] || []); };

  /* хто звинувачує */
  const chanRows = $derived(groupBy(S.acKey === "ros" ? ros : acc, (r) => r.ch).slice(0, S.acTop).map((g) => {
    const o = { key: g.key, label: g.items[0].chn || "@" + g.key, n: g.n, items: g.items, sub: `@${g.key} · ${num(g.items[0].subs)} підписників` };
    for (const z of ZV) o[z] = g.items.filter((r) => zvGroup(r) === z).length;
    return o;
  }));
  const chanPick = (p) => openDrill(`Звинувачує: ${p.row.label}`, `${ZV_LABEL[p.key]} · ${ccLabel}`, p.row.items.filter((r) => zvGroup(r) === p.key));

  /* у якому контексті */
  const catRows = $derived(groupBy(S.acKey === "ros" ? ros : acc, (r) => r.gcat || "inshe").map((g) => {
    const o = { key: g.key, label: GCAT_LABEL[g.key] || g.key, n: g.n, items: g.items };
    for (const z of ZV) o[z] = g.items.filter((r) => zvGroup(r) === z).length;
    return o;
  }));
  const catPick = (p) => openDrill(`Контекст: ${p.row.label}`, `${ZV_LABEL[p.key]} · ${ccLabel}`, p.row.items.filter((r) => zvGroup(r) === p.key));
</script>

<h2 class="mb-1 mt-2 text-[19px] font-semibold tracking-tight">Звинувачення · {ccLabel}</h2>
<p class="mb-4 max-w-[92ch] text-[13px] text-muted-foreground">
  Вимір «звинувачення» фіксує, у чому матеріал закидає Гончаренку: і коли канал звинувачує сам, і коли переказує чужі закиди.
  Для стосів допис із кількома типами йде в один за пріоритетом рос. пропаганда → зрада → корупція → популізм → інше.
</p>
<KpiCards items={kpi} />

<Panel title="1 · Звинувачення у часі" note="Хвилі збігаються з його гучними заявами: вертикалі — опорні події.">
  {#snippet controls()}
    <Segmented label="тип" value={S.acKey} options={[{ value: "ros", label: "лише робота на РФ" }, { value: "all", label: "усі типи" }]} onchange={(v) => (S.acKey = v)} />
    <Segmented label="шкала" value={S.acPct ? "pct" : "n"} options={[{ value: "n", label: "кількість" }, { value: "pct", label: "частки" }]} onchange={(v) => (S.acPct = v === "pct")} />
  {/snippet}
  <StackBars rows={tRows} keys={S.acKey === "ros" ? keysRos : keysAll} percent={S.acPct && S.acKey === "all"} step={S.step} events={EVENTS} onpick={tPick} />
</Panel>

<Panel title="2 · Хто звинувачує найчастіше" note="Канали за кількістю дописів зі звинуваченнями. Клік по смузі — перелік саме цих дописів.">
  {#snippet controls()}
    <Segmented label="показати" value={String(S.acTop)} options={[{ value: "20", label: "20" }, { value: "40", label: "40" }, { value: "80", label: "80" }]} onchange={(v) => (S.acTop = Number(v))} />
  {/snippet}
  <RankBars items={chanRows} keys={S.acKey === "ros" ? keysRos : keysAll} onpick={chanPick} />
</Panel>

<Panel title="3 · У якому контексті звинувачують" note="Категорія матеріалу, в якому пролунало звинувачення.">
  <RankBars items={catRows} keys={S.acKey === "ros" ? keysRos : keysAll} onpick={catPick} />
</Panel>
