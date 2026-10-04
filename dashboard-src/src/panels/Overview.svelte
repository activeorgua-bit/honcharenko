<script>
  /* СТОРІНКА 1 — ЗАГАЛЬНА ДИНАМІКА: скільки матеріалу, в якій ролі він там з'являється,
     як про нього пишуть і про що саме цитують. Кожне число розкривається в перелік. */
  import { num, pct, colorOf } from "$lib/api.js";
  import { S } from "$lib/state.svelte.js";
  import { tg, inRange, series, groupBy, tezaGroup, tone, isAbout, hasRos, TEZA, TEZA_LABEL, ROL_LABEL, CC_LABEL, GCAT_LABEL } from "$lib/data.svelte.js";
  import { openDrill } from "$lib/drill.svelte.js";
  import { EVENTS } from "$lib/events.js";
  import Panel from "$lib/ui/Panel.svelte";
  import Segmented from "$lib/ui/Segmented.svelte";
  import KpiCards from "$lib/ui/KpiCards.svelte";
  import StackBars from "$lib/charts/StackBars.svelte";
  import RankBars from "$lib/charts/RankBars.svelte";
  import { theme } from "$lib/theme.svelte.js";

  const dark = $derived(theme.choice === "dark" || (theme.choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
  const C = (k) => colorOf(k, dark);
  const rows = $derived(tg(S.cc).filter((r) => inRange(r, S.from, S.to)));
  const ccLabel = $derived(S.cc === "all" ? "усі канали" : CC_LABEL[S.cc]);
  const bLabel = (b) => (S.step === "month" ? b : S.step === "week" ? `тиждень від ${b}` : b);

  /* KPI */
  const kpi = $derived.by(() => {
    const about = rows.filter(isAbout), neg = about.filter((r) => tone(r) === "neg"), pos = about.filter((r) => tone(r) === "pos");
    const ros = rows.filter(hasRos), quotes = rows.filter((r) => r.rol === "quotes");
    const tck = quotes.filter((r) => r.teza.includes("tck")), tckE = tck.filter((r) => r.qsv === "endorses");
    const myr = quotes.filter((r) => r.teza.includes("myr")), myrE = myr.filter((r) => r.qsv === "endorses");
    return [
      { label: `релевантних матеріалів · ${ccLabel}`, value: num(rows.length), hint: `цитують його: ${num(quotes.length)} · саме про нього: ${num(about.length)}` },
      { label: "негативних серед матеріалів саме про нього", value: pct(neg.length / (about.length || 1), 0), tone: "neg",
        hint: `${num(neg.length)} з ${num(about.length)}; позитивних ${pct(pos.length / (about.length || 1), 0)}` },
      { label: "звинувачення в роботі на російську пропаганду", value: num(ros.length), hint: `${pct(ros.length / (about.length || 1), 0)} матеріалів саме про нього` },
      { label: "схвально підхоплюють тези", value: `ТЦК ${pct(tckE.length / (tck.length || 1), 0)} · мир ${pct(myrE.length / (myr.length || 1), 1)}`,
        hint: `ТЦК: ${num(tckE.length)} з ${num(tck.length)} цитувань · мир: ${num(myrE.length)} з ${num(myr.length)}` },
    ];
  });

  /* 1 · обсяг */
  const volKeys = $derived(
    S.ovKey === "rol" ? [["quotes", ROL_LABEL.quotes], ["about", ROL_LABEL.about], ["mention", ROL_LABEL.mention]].map(([k, l]) => ({ key: k, label: l, color: C(k) }))
    : S.ovKey === "cc" ? [["ua", "українські"], ["ru", "російські"]].map(([k, l]) => ({ key: k, label: l, color: C(k) }))
    : TEZA.map((k) => ({ key: k, label: TEZA_LABEL[k], color: C(k) })));
  const volFn = $derived(S.ovKey === "rol" ? (r) => r.rol || "mention" : S.ovKey === "cc" ? (r) => r.cc : (r) => tezaGroup(r));
  const volRows = $derived(series(S.ovKey === "teza" ? rows.filter((r) => r.rol === "quotes") : rows, S.step, volFn, volKeys.map((k) => k.key), S.from, S.to));
  const volPick = (p) => {
    const b = volRows.find((x) => x.b === p.b); if (!b) return;
    openDrill("Обсяг матеріалів", `${bLabel(p.b)} · ${volKeys.find((k) => k.key === p.key)?.label} · ${ccLabel}`, b.items[p.key] || []);
  };

  /* 2 · тональність про нього */
  const snKeys = $derived([{ key: "neg", label: "негативно", color: dark ? "#ff5a78" : "#d92546" }, { key: "neu", label: "нейтрально", color: dark ? "#7b8595" : "#9aa4b2" }, { key: "pos", label: "позитивно", color: dark ? "#35d39b" : "#129a6b" }]);
  const snRows = $derived(series(rows.filter(isAbout), S.step, tone, ["neg", "neu", "pos"], S.from, S.to));
  const snPick = (p) => { const b = snRows.find((x) => x.b === p.b); if (b) openDrill("Матеріали саме про нього", `${bLabel(p.b)} · ${snKeys.find((k) => k.key === p.key)?.label} · ${ccLabel}`, b.items[p.key] || []); };

  /* 3 · теми цитувань */
  const tzKeys = $derived(TEZA.map((k) => ({ key: k, label: TEZA_LABEL[k], color: C(k) })));
  const tzRows = $derived(series(rows.filter((r) => r.rol === "quotes"), S.step, tezaGroup, TEZA, S.from, S.to));
  const tzPick = (p) => { const b = tzRows.find((x) => x.b === p.b); if (b) openDrill("Цитування за темою", `${bLabel(p.b)} · ${TEZA_LABEL[p.key]} · ${ccLabel}`, b.items[p.key] || []); };

  /* 4 · категорії */
  const catRows = $derived(groupBy(rows, (r) => r.gcat || "inshe").map((g) => ({
    key: g.key, label: GCAT_LABEL[g.key] || g.key, n: g.n, items: g.items,
    quotes: g.items.filter((r) => r.rol === "quotes").length, about: g.items.filter((r) => r.rol === "about").length,
    mention: g.items.filter((r) => r.rol !== "quotes" && r.rol !== "about").length,
  })));
  const rolKeys = $derived([["quotes", ROL_LABEL.quotes], ["about", ROL_LABEL.about], ["mention", "згадка / не розмічено"]].map(([k, l]) => ({ key: k, label: l, color: C(k) })));
  const catPick = (p) => openDrill(`Категорія: ${p.row.label}`, `${rolKeys.find((k) => k.key === p.key)?.label} · ${ccLabel}`,
    p.row.items.filter((r) => (p.key === "mention" ? r.rol !== "quotes" && r.rol !== "about" : r.rol === p.key)));
</script>

<h2 class="mb-1 mt-2 text-[19px] font-semibold tracking-tight">Загальна динаміка · {ccLabel}</h2>
<p class="mb-4 max-w-[92ch] text-[13px] text-muted-foreground">
  Релевантні матеріали Telemetrio без реклами й дублів. «Цитує його» — канал передає його слова; «саме про нього» — він головна дійова особа,
  і лише для таких рахується тональність. Клік по будь-якому сегменту відкриває перелік дописів, з яких складене число.
</p>
<KpiCards items={kpi} />

<Panel title="1 · Обсяг матеріалів у часі" note="Скільки дописів на кошик і в якій ролі він там з'являється. Для тем — лише дописи, де канал цитує його; одна теза на допис за пріоритетом мир → ТЦК → влада → інше.">
  {#snippet controls()}
    <Segmented label="розріз" value={S.ovKey} options={[{ value: "rol", label: "роль" }, ...(S.cc === "all" ? [{ value: "cc", label: "країна каналу" }] : []), { value: "teza", label: "тема цитування" }]} onchange={(v) => (S.ovKey = v)} />
    <Segmented label="шкала" value={S.ovPct ? "pct" : "n"} options={[{ value: "n", label: "кількість" }, { value: "pct", label: "частки" }]} onchange={(v) => (S.ovPct = v === "pct")} />
  {/snippet}
  <StackBars rows={volRows} keys={volKeys} percent={S.ovPct} step={S.step} events={EVENTS} onpick={volPick} />
</Panel>

<Panel title="2 · Як пишуть про нього: тональність матеріалів саме про нього" note="Знаменник — матеріали, де він головна дійова особа (а не джерело новини). Негатив червоний, позитив зелений, без оцінки — сірий.">
  {#snippet controls()}
    <Segmented label="шкала" value={S.snPct ? "pct" : "n"} options={[{ value: "n", label: "кількість" }, { value: "pct", label: "частки" }]} onchange={(v) => (S.snPct = v === "pct")} />
  {/snippet}
  <StackBars rows={snRows} keys={snKeys} percent={S.snPct} step={S.step} events={EVENTS} onpick={snPick} />
</Panel>

<Panel title="3 · Про що його цитують" note="Лише дописи, де канал цитує чи переказує його. Якщо тез кілька, допис іде в одну групу за пріоритетом мир → ТЦК → критика влади → інше (таких дописів близько 4%).">
  {#snippet controls()}
    <Segmented label="шкала" value={S.tzPct ? "pct" : "n"} options={[{ value: "n", label: "кількість" }, { value: "pct", label: "частки" }]} onchange={(v) => (S.tzPct = v === "pct")} />
  {/snippet}
  <StackBars rows={tzRows} keys={tzKeys} percent={S.tzPct} step={S.step} events={EVENTS} onpick={tzPick} />
</Panel>

<Panel title="4 · Категорії матеріалів" note="Категорія, яку модель дала всьому матеріалу; поділ смуги — роль Гончаренка в ньому.">
  <RankBars items={catRows} keys={rolKeys} onpick={catPick} />
</Panel>
