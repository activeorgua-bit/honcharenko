<script>
  /* Вікно першоджерел: кожен рядок веде на конкретний допис; тексти довантажуються шардами
     й не обрізаються мовчки. Лічильник угорі = число на графіку. */
  import { num } from "$lib/api.js";
  import { drill, closeDrill } from "$lib/drill.svelte.js";
  import { details, toCSV, download } from "$lib/data.svelte.js";
  import Chips from "$lib/ui/Chips.svelte";
  import Segmented from "$lib/ui/Segmented.svelte";

  let size = $state(40);
  let sort = $state("views");
  let expanded = $state(new Set());
  let texts = $state(new Map());
  let loading = $state(false);

  const sorted = $derived([...drill.rows].sort(sort === "views" ? (a, b) => b.views - a.views : sort === "date" ? (a, b) => (b.dt > a.dt ? 1 : -1) : (a, b) => (a.dt > b.dt ? 1 : -1)));
  const shown = $derived(sorted.slice(0, size));

  $effect(() => {
    if (!drill.open) { size = 40; expanded = new Set(); return; }
    const ids = shown.map((r) => r.id).filter((id) => !texts.has(id));
    if (!ids.length) return;
    loading = true;
    details(ids).then((m) => { const t = new Map(texts); for (const [k, v] of m) t.set(k, v); texts = t; }).finally(() => (loading = false));
  });
  function onKey(e) { if (e.key === "Escape") closeDrill(); }
  const toggle = (id) => { const s = new Set(expanded); s.has(id) ? s.delete(id) : s.add(id); expanded = s; };
</script>

<svelte:window on:keydown={onKey} />

{#if drill.open}
  <div class="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-8" role="presentation" onclick={closeDrill}>
    <div class="flex max-h-[90vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
         role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
      <div class="flex items-start justify-between gap-4 border-b border-border px-5 py-3">
        <div class="min-w-0">
          <h3 class="text-[15px] font-semibold leading-tight">{drill.title}</h3>
          <p class="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
            {drill.subtitle} · знайдено {num(drill.rows.length)}{#if shown.length < drill.rows.length} · показано {num(shown.length)}{/if}
          </p>
          <div class="mt-2 flex flex-wrap items-center gap-3">
            <Segmented label="порядок" value={sort} options={[{ value: "views", label: "за переглядами" }, { value: "date", label: "нові спершу" }, { value: "old", label: "старі спершу" }]} onchange={(v) => (sort = v)} />
            <button onclick={() => download(`honcharenko_${Date.now()}.csv`, toCSV(sorted))}
              class="rounded-md border border-border px-2 py-0.5 text-[11.5px] text-muted-foreground hover:bg-accent hover:text-foreground">CSV ({num(drill.rows.length)})</button>
          </div>
        </div>
        <button onclick={closeDrill} class="rounded-md px-2 py-1 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground">закрити ✕</button>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-3">
        {#if !drill.rows.length}
          <p class="py-8 text-center text-[12.5px] text-muted-foreground">У цьому сегменті записів немає.</p>
        {:else}
          {#each shown as it (it.id)}
            {@const d = texts.get(it.id)}
            {@const text = d?.text ?? ""}
            {@const long = text.length > 480}
            {@const open = expanded.has(it.id)}
            <div class="border-t border-border/60 py-3 first:border-t-0">
              <div class="mb-1 flex flex-wrap items-center gap-1.5 text-[12px]">
                <b>{it.g ? (it.src || it.ch) : it.chn}</b>
                {#if !it.g && it.ch}<span class="font-mono text-[10.5px] text-muted-foreground">@{it.ch}</span>{/if}
                {#if it.subs}<span class="font-mono text-[10.5px] text-muted-foreground">{num(it.subs)} підп.</span>{/if}
                <span class="font-mono text-[10.5px] text-muted-foreground">{it.dt.replace("T", " ")}{it.views ? ` · ${num(it.views)} переглядів` : ""}</span>
                {#if it.url}<a href={it.url} target="_blank" rel="noopener" class="text-[12px] underline underline-offset-2">джерело →</a>{/if}
              </div>
              <div class="mb-1.5 flex flex-wrap gap-1"><Chips r={it} /></div>
              {#if it.title}<p class="text-[13px] font-semibold">{it.title}</p>{/if}
              {#if d}
                <p class="whitespace-pre-wrap text-[13px] leading-relaxed">{open || !long ? text : text.slice(0, 480) + "…"}</p>
                {#if long}
                  <button onclick={() => toggle(it.id)} class="mt-1 text-[11.5px] text-muted-foreground underline underline-offset-2 hover:text-foreground">{open ? "згорнути" : "показати повністю"}</button>
                {/if}
                {#if d.evidence}
                  <p class="mt-1.5 border-l-2 border-border pl-2 text-[12px] text-muted-foreground"><b>доказ розмітки:</b> {d.evidence}</p>
                {/if}
                {#if d.summary && open}
                  <p class="mt-1 border-l-2 border-border pl-2 text-[12px] text-muted-foreground"><b>резюме моделі:</b> {d.summary}</p>
                {/if}
              {:else}
                <p class="text-[12px] text-muted-foreground">{loading ? "завантаження тексту…" : "тексту немає"}</p>
              {/if}
              {#if it.fwd}<p class="mt-1 font-mono text-[10.5px] text-muted-foreground">репост із: {it.fwd}</p>{/if}
            </div>
          {/each}
          {#if drill.rows.length > shown.length}
            <button onclick={() => (size += 40)} class="mt-3 w-full rounded-md border border-border py-1.5 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground">показати ще 40 із {num(drill.rows.length - shown.length)}</button>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
