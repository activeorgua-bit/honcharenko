<script>
  /* СТОРІНКА 6 — МАТЕРІАЛИ: усі набори даних як є, з фільтрами й пошуком. Відсіяне (реклама, дублі, нерелевантне) не ховається —
     його можна показати й перевірити, що саме відкинули. Рядок відкриває текст і повну розмітку. */
  import { num, pct } from "$lib/api.js";
  import { S, resetMaterials } from "$lib/state.svelte.js";
  import { D, inCorpus, textOf, loadAllTexts, toCSV, download, TEZA_LABEL, ZV_LABEL, ROL_LABEL, QSV_LABEL, SENT_LABEL, TGT_LABEL, GCAT_LABEL, CC_LABEL } from "$lib/data.svelte.js";
  import { openDrill } from "$lib/drill.svelte.js";
  import Panel from "$lib/ui/Panel.svelte";
  import Segmented from "$lib/ui/Segmented.svelte";
  import Chips from "$lib/ui/Chips.svelte";

  let textsLoaded = $state(false), textProgress = $state("");
  const PAGE = 50;
  const batches = $derived((D.meta?.batches ?? []).map((b) => {
    const it = D.rows.filter((r) => r.b === b.id);
    return { ...b, items: it, rel: it.filter(inCorpus).length, irr: it.filter((r) => r.rel === 0).length, un: it.filter((r) => r.rel == null).length, ads: it.filter((r) => r.ad).length, dups: it.filter((r) => r.dup).length,
      from: it.reduce((a, r) => (r.day && (!a || r.day < a) ? r.day : a), ""), to: it.reduce((a, r) => (r.day > a ? r.day : a), "") };
  }));
  const qlc = $derived(S.mtQ.trim().toLowerCase());
  const filtered = $derived(D.rows.filter((r) =>
    (!S.mtB || r.b === Number(S.mtB)) && (S.cc === "all" || r.cc === S.cc)
    && (S.mtRel === "all" || (S.mtRel === "rel" ? inCorpus(r) : S.mtRel === "irr" ? r.rel === 0 : S.mtRel === "un" ? r.rel == null : S.mtRel === "ad" ? r.ad : r.dup))
    && (!S.mtRol || r.rol === S.mtRol) && (!S.mtTz || r.teza.includes(S.mtTz)) && (!S.mtZv || r.zv.includes(S.mtZv)) && (!S.mtQs || r.qsv === S.mtQs)
    && (!S.mtSent || (S.mtSent === "neg" ? r.sent < 0 : S.mtSent === "pos" ? r.sent > 0 : r.sent === 0)) && (!S.mtTgt || r.tgt === S.mtTgt) && (!S.mtGcat || r.gcat === S.mtGcat)
    && (!S.from || r.day >= S.from) && (!S.to || r.day <= S.to)
    && (!qlc || (r.chn + " @" + r.ch + " " + r.title + " " + r.url + " " + r.src + (textsLoaded ? " " + (textOf(r.id) || "") : "")).toLowerCase().includes(qlc))));
  const sorted = $derived([...filtered].sort(S.mtSort === "views" ? (a, b) => b.views - a.views : S.mtSort === "old" ? (a, b) => (a.dt > b.dt ? 1 : -1) : (a, b) => (b.dt > a.dt ? 1 : -1)));
  const pages = $derived(Math.max(1, Math.ceil(sorted.length / PAGE)));
  const page = $derived(Math.min(Math.max(1, S.mtPage), pages));
  const shown = $derived(sorted.slice((page - 1) * PAGE, page * PAGE));
  $effect(() => { S.mtB; S.cc; S.mtRel; S.mtRol; S.mtTz; S.mtZv; S.mtQs; S.mtSent; S.mtTgt; S.mtGcat; S.mtQ; S.mtPage = 1; });
  const sel = (label, key, opts) => ({ label, key, opts });
  const selects = $derived([
    sel("набір", "mtB", [["", "усі набори"], ...batches.map((b) => [String(b.id), b.name])]),
    sel("відбір", "mtRel", [["rel", "корпус: релевантні без реклами й дублів"], ["all", "усе"], ["irr", "нерелевантні (тезки, інше)"], ["un", "не розмічені"], ["ad", "реклама"], ["dup", "дублі"]]),
    sel("роль", "mtRol", [["", "будь-яка"], ...Object.entries(ROL_LABEL).filter(([k]) => k)]),
    sel("теза", "mtTz", [["", "будь-яка"], ...Object.entries(TEZA_LABEL).filter(([k]) => k !== "none")]),
    sel("звинувачення", "mtZv", [["", "будь-яке"], ...Object.entries(ZV_LABEL)]),
    sel("ставлення каналу", "mtQs", [["", "будь-яке"], ...Object.entries(QSV_LABEL).filter(([k]) => k)]),
    sel("тональність про нього", "mtSent", [["", "будь-яка"], ["neg", "негативна"], ["neu", "нейтральна"], ["pos", "позитивна"]]),
    sel("про кого", "mtTgt", [["", "будь-що"], ...Object.entries(TGT_LABEL).filter(([k]) => k)]),
    sel("категорія", "mtGcat", [["", "будь-яка"], ...Object.entries(GCAT_LABEL).filter(([k]) => k)]),
  ]);
  const openRow = (r) => openDrill(r.g ? (r.src || r.ch) : r.chn, `@${r.ch} · ${r.dt.replace("T", " ")}`, [r]);
  const openBatch = (b, kind) => openDrill(b.name, kind === "rel" ? "корпус" : kind, kind === "rel" ? b.items.filter(inCorpus) : kind === "реклама" ? b.items.filter((r) => r.ad) : kind === "дублі" ? b.items.filter((r) => r.dup) : kind === "нерелевантні" ? b.items.filter((r) => r.rel === 0) : b.items);
  async function loadTexts() { textProgress = "0"; await loadAllTexts((k, n) => (textProgress = `${k}/${n}`)); textsLoaded = true; textProgress = ""; }
</script>

<h2 class="mb-1 mt-2 text-[19px] font-semibold tracking-tight">Матеріали й набори даних</h2>
<p class="mb-4 max-w-[92ch] text-[13px] text-muted-foreground">
  Усе, що зібрано: {num(D.rows.length)} матеріалів у {batches.length} наборах. Країна каналу й період беруться з панелі вгорі, решта фільтрів — тут.
  Пошук іде по каналу, заголовку й адресі; щоб шукати в текстах, довантажте їх (≈70 МБ, один раз).
</p>

<Panel title="1 · Набори даних" note="Клік по числу відкриває відповідні матеріали набору.">
  <div class="overflow-x-auto">
    <table class="w-full text-[12.5px]">
      <thead class="text-left text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th class="px-2 py-1.5">набір</th><th class="px-2 py-1.5">період</th><th class="px-2 py-1.5 text-right">рядків</th><th class="px-2 py-1.5 text-right">корпус</th><th class="px-2 py-1.5 text-right">нерелевантні</th><th class="px-2 py-1.5 text-right">реклама</th><th class="px-2 py-1.5 text-right">дублі</th><th class="px-2 py-1.5 text-right">не розмічені</th></tr></thead>
      <tbody>
        {#each batches as b (b.id)}
          <tr class="border-t border-border/60">
            <td class="px-2 py-1.5"><b>{b.name}</b> <span class="font-mono text-[10px] text-muted-foreground">{b.kind} · #{b.id}</span></td>
            <td class="tnum px-2 py-1.5 whitespace-nowrap text-muted-foreground">{b.from} – {b.to}</td>
            <td class="tnum cursor-pointer px-2 py-1.5 text-right underline-offset-2 hover:underline" onclick={() => openBatch(b, "усі рядки")}>{num(b.n)}</td>
            <td class="tnum cursor-pointer px-2 py-1.5 text-right font-semibold underline-offset-2 hover:underline" onclick={() => openBatch(b, "rel")}>{num(b.rel)}</td>
            <td class="tnum cursor-pointer px-2 py-1.5 text-right underline-offset-2 hover:underline" onclick={() => openBatch(b, "нерелевантні")}>{num(b.irr)}</td>
            <td class="tnum cursor-pointer px-2 py-1.5 text-right underline-offset-2 hover:underline" onclick={() => openBatch(b, "реклама")}>{num(b.ads)}</td>
            <td class="tnum cursor-pointer px-2 py-1.5 text-right underline-offset-2 hover:underline" onclick={() => openBatch(b, "дублі")}>{num(b.dups)}</td>
            <td class="tnum px-2 py-1.5 text-right">{num(b.un)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</Panel>

<Panel title={`2 · Матеріали (${num(filtered.length)})`}>
  {#snippet controls()}
    {#each selects as s (s.key)}
      <label class="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{s.label}
        <select bind:value={S[s.key]} class="rounded-md border border-border bg-card px-1.5 py-0.5 font-sans text-[12px] normal-case tracking-normal text-foreground">
          {#each s.opts as [v, l] (v)}<option value={v}>{l}</option>{/each}
        </select>
      </label>
    {/each}
    <input placeholder={textsLoaded ? "пошук у каналах, заголовках і текстах" : "пошук у каналах і заголовках"} bind:value={S.mtQ} class="min-w-[220px] rounded-md border border-border bg-card px-2 py-0.5 text-[12px]" />
    <Segmented label="порядок" value={S.mtSort} options={[{ value: "date", label: "нові спершу" }, { value: "old", label: "старі спершу" }, { value: "views", label: "за переглядами" }]} onchange={(v) => (S.mtSort = v)} />
    {#if !textsLoaded}<button onclick={loadTexts} class="rounded-md border border-border px-2 py-0.5 text-[11.5px] text-muted-foreground hover:bg-accent hover:text-foreground">{textProgress ? `тексти: ${textProgress}` : "довантажити тексти для пошуку"}</button>{/if}
    <button onclick={() => download(`honcharenko_materials_${Date.now()}.csv`, toCSV(sorted))} class="rounded-md border border-border px-2 py-0.5 text-[11.5px] text-muted-foreground hover:bg-accent hover:text-foreground">CSV ({num(filtered.length)})</button>
    <button onclick={resetMaterials} class="rounded-md px-2 py-0.5 text-[11.5px] text-muted-foreground underline underline-offset-2 hover:text-foreground">скинути фільтри</button>
  {/snippet}
  <div class="overflow-x-auto">
    <table class="w-full text-[12.5px]">
      <thead class="text-left text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th class="px-2 py-1.5">дата</th><th class="px-2 py-1.5">канал / джерело</th><th class="px-2 py-1.5 text-right">переглядів</th><th class="px-2 py-1.5">розмітка</th><th class="px-2 py-1.5"></th></tr></thead>
      <tbody>
        {#each shown as r (r.id)}
          <tr class="cursor-pointer border-t border-border/60 align-top hover:bg-accent/50" onclick={() => openRow(r)}>
            <td class="tnum px-2 py-1.5 whitespace-nowrap">{r.dt.replace("T", " ") || "без дати"}</td>
            <td class="px-2 py-1.5"><b>{r.g ? (r.src || r.ch) : r.chn}</b>{#if !r.g} <span class="font-mono text-[10.5px] text-muted-foreground">@{r.ch}</span>{/if}{#if r.title}<div class="text-muted-foreground">{r.title}</div>{/if}{#if textsLoaded && textOf(r.id)}<div class="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{textOf(r.id)}</div>{/if}</td>
            <td class="tnum px-2 py-1.5 text-right">{num(r.views)}</td>
            <td class="px-2 py-1.5"><div class="flex flex-wrap gap-1"><Chips r={r} /></div></td>
            <td class="px-2 py-1.5 whitespace-nowrap">{#if r.url}<a href={r.url} target="_blank" rel="noopener" class="underline underline-offset-2" onclick={(e) => e.stopPropagation()}>джерело →</a>{/if}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="mt-3 flex items-center gap-2 text-[12.5px] text-muted-foreground">
    <button disabled={page <= 1} onclick={() => (S.mtPage = page - 1)} class="rounded-md border border-border px-2 py-0.5 disabled:opacity-40">← назад</button>
    <span class="tnum">сторінка {page} з {num(pages)}</span>
    <button disabled={page >= pages} onclick={() => (S.mtPage = page + 1)} class="rounded-md border border-border px-2 py-0.5 disabled:opacity-40">далі →</button>
  </div>
</Panel>
