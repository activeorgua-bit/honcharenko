<script>
  /* Оболонка: ліва колонка з навігацією і спільними осями (країна каналу, період, крок), праворуч — сторінка.
     Стан у URL: будь-який зріз можна надіслати посиланням. */
  import { theme, cycleTheme, themeLabel } from "$lib/theme.svelte.js";
  import { num } from "$lib/api.js";
  import { S, syncURL } from "$lib/state.svelte.js";
  import { D, tg, google } from "$lib/data.svelte.js";
  import Overview from "./panels/Overview.svelte";
  import Accusations from "./panels/Accusations.svelte";
  import Endorsements from "./panels/Endorsements.svelte";
  import Channels from "./panels/Channels.svelte";
  import Google from "./panels/Google.svelte";
  import Materials from "./panels/Materials.svelte";
  import Methodology from "./panels/Methodology.svelte";
  import Drill from "$lib/ui/Drill.svelte";
  import Segmented from "$lib/ui/Segmented.svelte";
  import * as Button from "$lib/components/ui/button/index.js";

  $effect(() => { syncURL(); });
  const PAGES = [
    { key: "ov", label: "Загальна динаміка" }, { key: "ac", label: "Звинувачення" }, { key: "en", label: "Схвалення тез" },
    { key: "ch", label: "Канали" }, { key: "g", label: "Google" }, { key: "mt", label: "Матеріали й набори" }, { key: "pm", label: "Методологія" },
  ];
  const nUa = $derived(D.ready ? tg("ua").length : 0), nRu = $derived(D.ready ? tg("ru").length : 0), nG = $derived(D.ready ? google().length : 0);
  /* Фільтр країни каналу — на всіх сторінках, крім Google (там джерела — сайти) і методології.
     На вкладці матеріалів є ще «інші країни» і «Google»; при переході на сторінку з графіками такі значення скидаються на «усі». */
  const ccPages = new Set(["ov", "ac", "en", "ch", "mt"]);
  const ccOpts = $derived([{ value: "ua", label: "українські" }, { value: "ru", label: "російські" },
    ...(S.page === "mt" ? [{ value: "other", label: "інші країни" }, { value: "g", label: "Google" }] : []), { value: "all", label: "усі" }]);
  $effect(() => { if (S.page !== "mt" && (S.cc === "other" || S.cc === "g")) S.cc = "all"; });
</script>

<div class="grid min-h-screen grid-cols-[250px_1fr]">
  <aside class="sticky top-0 flex h-screen flex-col border-r border-border bg-card">
    <div class="border-b border-border px-4 py-4">
      <h1 class="text-[15px] font-semibold leading-tight tracking-tight">Цитування Олексія Гончаренка</h1>
      <p class="mt-1 font-mono text-[10.5px] text-muted-foreground">
        {#if D.ready}{num(nUa)} UA · {num(nRu)} RU · {num(nG)} Google<br>{D.meta.date_min} — {D.meta.date_max}{:else}{D.progress || "завантаження…"}{/if}
      </p>
    </div>
    <nav class="flex flex-col gap-0.5 p-2">
      {#each PAGES as p, i (p.key)}
        <button onclick={() => (S.page = p.key)}
          class="rounded-md px-3 py-1.5 text-left text-[13px] transition-colors {S.page === p.key ? 'bg-secondary font-semibold text-foreground' : 'text-muted-foreground hover:bg-accent/60'}">{i + 1} · {p.label}</button>
      {/each}
    </nav>
    <div class="mt-auto flex flex-col gap-2 border-t border-border p-3">
      <Button.Root variant="outline" size="sm" onclick={cycleTheme} title="Світла → темна → як у системі">Тема: {themeLabel()}</Button.Root>
      <span class="text-[10.5px] leading-snug text-muted-foreground">Статичний знімок даних Ghost від {D.meta?.exported_at ?? "…"}. Джерела: Telemetrio, Google. Кожне число розкривається в перелік першоджерел.</span>
    </div>
  </aside>

  <main class="min-w-0 px-6 pb-16">
    <div class="sticky top-0 z-20 -mx-6 mb-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-background/95 px-6 py-2 backdrop-blur">
      {#if ccPages.has(S.page)}
        <Segmented label="канали" value={S.cc} options={ccOpts} onchange={(v) => (S.cc = v)} />
      {/if}
      {#if ccPages.has(S.page) && S.page !== "mt"}
        <Segmented label="крок" value={S.step} options={[{ value: "month", label: "місяць" }, { value: "week", label: "тиждень" }]} onchange={(v) => (S.step = v)} />
      {/if}
      {#if S.page !== "g" && S.page !== "pm"}
        <div class="flex items-center gap-1.5">
          <span class="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">період</span>
          <input type="date" value={S.from || D.meta?.date_min || ""} min={D.meta?.date_min} max={D.meta?.date_max} onchange={(e) => (S.from = e.currentTarget.value)} class="tnum rounded-md border border-border bg-card px-1.5 py-0.5 text-[11.5px] {S.from ? 'ring-1 ring-ring/50' : ''}" />
          <span class="text-muted-foreground">–</span>
          <input type="date" value={S.to || D.meta?.date_max || ""} min={D.meta?.date_min} max={D.meta?.date_max} onchange={(e) => (S.to = e.currentTarget.value)} class="tnum rounded-md border border-border bg-card px-1.5 py-0.5 text-[11.5px] {S.to ? 'ring-1 ring-ring/50' : ''}" />
          {#if S.from || S.to}<button onclick={() => { S.from = ""; S.to = ""; }} class="rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground">увесь період</button>{/if}
        </div>
      {/if}
    </div>

    {#if D.error}
      <p class="mt-6 text-[13px] text-destructive">Не вдалося завантажити дані: {D.error.message}</p>
    {:else if !D.ready}
      <p class="mt-10 text-center text-[13px] text-muted-foreground">{D.progress || "завантаження…"}</p>
    {:else if S.page === "ov"}<Overview />
    {:else if S.page === "ac"}<Accusations />
    {:else if S.page === "en"}<Endorsements />
    {:else if S.page === "ch"}<Channels />
    {:else if S.page === "g"}<Google />
    {:else if S.page === "mt"}<Materials />
    {:else}<Methodology />{/if}
  </main>
</div>
<Drill />
