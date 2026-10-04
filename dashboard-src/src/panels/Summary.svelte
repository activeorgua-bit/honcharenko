<script>
  /* СТОРІНКА 0 — ГОЛОВНЕ. Відповіді на три питання дослідження одним екраном: як пишуть про нього,
     чи звинувачують у роботі на РФ, і хто схвально підхоплює його тези про ТЦК і мир — українські чи російські канали.
     Українські й російські канали тут ЗАВЖДИ поруч, незалежно від перемикача на інших сторінках. Кожне число розкривається. */
  import { num, pct, colorOf } from "$lib/api.js";
  import { S } from "$lib/state.svelte.js";
  import { D, tg, google, inRange, series, groupBy, tone, isAbout, hasRos, TEZA_LABEL, CC_LABEL } from "$lib/data.svelte.js";
  import { openDrill } from "$lib/drill.svelte.js";
  import Panel from "$lib/ui/Panel.svelte";
  import KpiCards from "$lib/ui/KpiCards.svelte";
  import StackBars from "$lib/charts/StackBars.svelte";
  import EX from "$lib/examples.json";
  import { theme } from "$lib/theme.svelte.js";

  const dark = $derived(theme.choice === "dark" || (theme.choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
  const C = (k) => colorOf(k, dark);
  const ua = $derived(tg("ua").filter((r) => inRange(r, S.from, S.to)));
  const ru = $derived(tg("ru").filter((r) => inRange(r, S.from, S.to)));
  const about = (rows) => rows.filter(isAbout);
  const neg = (rows) => about(rows).filter((r) => tone(r) === "neg");
  const quotes = (rows, t) => rows.filter((r) => r.rol === "quotes" && r.teza.includes(t));
  const endo = (rows) => rows.filter((r) => r.qsv === "endorses");
  const crit = (rows) => rows.filter((r) => r.qsv === "critical");

  const kpi = $derived([
    { label: "негативних серед українських матеріалів саме про нього", value: pct(neg(ua).length / (about(ua).length || 1), 0), tone: "neg",
      hint: `${num(neg(ua).length)} з ${num(about(ua).length)}; позитивних ${pct(about(ua).filter((r) => tone(r) === "pos").length / (about(ua).length || 1), 0)}` },
    { label: "звинувачення в роботі на російську пропаганду", value: num(ua.filter(hasRos).length), hint: `${pct(ua.filter(hasRos).length / (about(ua).length || 1), 0)} українських матеріалів саме про нього` },
    { label: "схвально підхоплюють тезу про ТЦК", value: `RU ${pct(endo(quotes(ru, "tck")).length / (quotes(ru, "tck").length || 1), 0)} · UA ${pct(endo(quotes(ua, "tck")).length / (quotes(ua, "tck").length || 1), 0)}`,
      hint: `російські канали — утричі частіше за українські (${num(endo(quotes(ru, "tck")).length)} з ${num(quotes(ru, "tck").length)} проти ${num(endo(quotes(ua, "tck")).length)} з ${num(quotes(ua, "tck").length)})` },
    { label: "схвально підхоплюють тезу про мир", value: `RU ${pct(endo(quotes(ru, "myr")).length / (quotes(ru, "myr").length || 1), 1)} · UA ${pct(endo(quotes(ua, "myr")).length / (quotes(ua, "myr").length || 1), 1)}`,
      hint: `верхня оцінка: ${num(endo(quotes(ru, "myr")).length)} з ${num(quotes(ru, "myr").length)} проти ${num(endo(quotes(ua, "myr")).length)} з ${num(quotes(ua, "myr").length)}` },
  ]);

  /* 1 · частки схвалення */
  const bars = $derived([["tck", "ru"], ["tck", "ua"], ["myr", "ru"], ["myr", "ua"]].map(([t, cc]) => {
    const q = quotes(cc === "ua" ? ua : ru, t), e = endo(q);
    return { t, cc, label: `${t === "tck" ? "ТЦК" : "мир"} · ${cc === "ua" ? "українські" : "російські"}`, n: q.length, e: e.length, share: q.length ? e.length / q.length : 0, items: e, color: C(t) };
  }));
  const maxShare = $derived(Math.max(...bars.map((b) => b.share), 0.01));

  /* 2 · топ каналів-схвалювачів */
  const DM = new Set(["mediakiller2021", "skosoi", "rezident_ua", "yurasumy", "asupersharij", "legitimniy", "zerada1", "stranaua", "ponomarb1", "otryadkovpaka", "novoeizdanie", "sheyhtamir1974", "ze_kartel", "nabludatels", "htosho", "first_political"]);
  const topOf = (rows) => groupBy(rows.filter((r) => r.rol === "quotes" && r.qsv === "endorses"), (r) => r.ch).slice(0, 10).map((g) => ({ ch: g.key, label: g.items[0].chn || "@" + g.key, n: g.n, items: g.items, dm: DM.has(g.key) }));
  const topUa = $derived(topOf(ua)), topRu = $derived(topOf(ru));
  const dmUa = $derived(topUa.filter((c) => c.dm).map((c) => c.label));

  /* 4 · Google */
  /* Датовані результати ЛИШЕ в межах 01.2025–10.2026: у видачі є сторінки 2000–2024 років (вікі, досьє), їх рахуємо в «старші або без дати». */
  const gRows = $derived(google().filter((r) => r.day >= "2025-01-01" && r.day <= "2026-10-31"));
  const gKeys = $derived([{ key: "myr", label: "цитують його про мир", color: C("myr") }, { key: "other", label: "інші результати про нього", color: C("none") }]);
  const gSeries = $derived(series(gRows, "month", (r) => (r.rol === "quotes" && r.teza.includes("myr") ? "myr" : "other"), ["myr", "other"], "2025-01-01", "2026-10-31"));
  const gPick = (p) => { const b = gSeries.find((x) => x.b === p.b); if (b) openDrill("Видача Google", `${p.b} · ${gKeys.find((k) => k.key === p.key)?.label}`, b.items[p.key] || []); };
  const gStat = $derived.by(() => {
    const all = D.rows.filter((r) => r.g), rel = google(), oct = gRows.filter((r) => r.m === "2026-10"), ab = about(oct);
    return { all: all.length, rel: rel.length, dated: gRows.length, oct: oct.length, octMyr: oct.filter((r) => r.rol === "quotes" && r.teza.includes("myr")).length, ab: ab.length, abNeg: neg(oct).length, ros: oct.filter(hasRos).length, y25: gRows.filter((r) => r.m.startsWith("2025")).length };
  });
  const exGroups = [["russia_tck", "ТЦК, російські канали"], ["ukraine_tck", "ТЦК, українські канали"], ["russia_myr", "Мир, російські канали"], ["ukraine_myr", "Мир, українські канали"]];
  const go = (page) => (S.page = page);
</script>

<h2 class="mb-1 mt-2 text-[19px] font-semibold tracking-tight">Головне</h2>
<p class="mb-4 max-w-[96ch] text-[13.5px] leading-relaxed text-muted-foreground">
  Українські канали пишуть про Гончаренка переважно негативно. Кожен восьмий український матеріал саме про нього звинувачує його
  в поширенні російських наративів, і ці звинувачення йдуть хвилями навколо його гучних заяв. Водночас його тези про ТЦК і мобілізацію російські канали
  схвально підхоплюють утричі частіше за українські, а серед українських «схвалювачів» помітні проросійські канали. Телеграм України й Росії за
  01.01.2025–03.10.2026 (Telemetrio) і російська видача Google від 03.10.2026. Кожне число відкривається в перелік першоджерел.
</p>
<KpiCards items={kpi} />

<Panel title="1 · Хто схвально підхоплює його тези: частка цитувань, де канал від себе погоджується" note="Знаменник — дописи, де канал цитує або переказує його тезу на цю тему. «Схвально» — канал своїми словами погоджується з тезою чи підхоплює її («провальна реформа», «вони у своєму розумі?», «признал очевидное»). Це схвалення тези, а не самого Гончаренка: частина каналів, що погоджуються з ним щодо ТЦК, водночас лає його особисто. Для ТЦК оцінка надійна, для миру — верхня: серед найпереглядуваніших «схвалень миру» явну згоду містить приблизно половина українських і три чверті російських, решта — сарказм чи реакції на кшталт «Оце так…». Клік по смузі — перелік саме цих дописів.">
  <div class="grid gap-3">
    {#each bars as b (b.label)}
      <button class="grid grid-cols-[150px_1fr_auto] items-center gap-3 text-left hover:opacity-90" onclick={() => openDrill(`${TEZA_LABEL[b.t]}: схвально`, `${CC_LABEL[b.cc]} · цитування з тезою`, b.items)}>
        <span class="text-[13.5px]">{b.label}</span>
        <span class="h-[14px] overflow-hidden rounded bg-muted"><i class="block h-full rounded" style={`width:${(100 * b.share / maxShare).toFixed(1)}%;background:${b.color}`}></i></span>
        <span class="tnum whitespace-nowrap text-[12.5px] text-muted-foreground"><b class="text-[15px] text-foreground">{pct(b.share, 1)}</b> · {num(b.e)} з {num(b.n)}</span>
      </button>
    {/each}
  </div>
  <p class="mt-3 text-[12px]"><button class="text-muted-foreground underline underline-offset-2 hover:text-foreground" onclick={() => go("en")}>Докладніше: сторінка «Схвалення тез» →</button></p>
</Panel>

<Panel title="2 · Канали, що найчастіше погоджуються з його тезами" note="Усі схвальні цитування будь-якої тези за період. Клік по каналу відкриває його схвальні дописи.">
  <div class="grid gap-6 md:grid-cols-2">
    {#each [["Українські канали", topUa], ["Російські канали", topRu]] as [title, list] (title)}
      <div>
        <h3 class="mb-2 text-[14px] font-semibold">{title}</h3>
        <ol class="grid gap-1 pl-6 text-[13.5px]">
          {#each list as c, i (c.ch)}
            <li><button class="text-left hover:underline underline-offset-2" onclick={() => openDrill(`Схвально: ${c.label}`, `@${c.ch} · усі тези`, c.items)}>{c.label}</button> <span class="font-mono text-[11px] text-muted-foreground">{c.n}</span>{#if c.dm}<span class="ml-1 rounded px-1 font-mono text-[9.5px]" style="background:var(--c-neg)22;color:var(--c-neg)">ДМ</span>{/if}</li>
          {/each}
        </ol>
      </div>
    {/each}
  </div>
  {#if dmUa.length}
    <p class="mt-3 font-mono text-[11.5px]" style="color:var(--c-neg)">ДМ — канали з переліку проросійських каналів «Детектора медіа»: серед українських це {dmUa.join(", ")}.</p>
  {/if}
</Panel>

<Panel title="3 · Як саме вони погоджуються" note="Приклади з явною згодою, відібрані вручну серед найпереглядуваніших; у лапках — слова самого каналу, не Гончаренка.">
  <div class="grid gap-4 md:grid-cols-2">
    {#each exGroups as [k, title] (k)}
      <div>
        <h3 class="mb-1.5 text-[14px] font-semibold">{title}</h3>
        <ul class="grid gap-2">
          {#each EX[k] as x (x.url)}
            <li class="border-l-2 border-border pl-2.5 text-[13px] leading-relaxed"><a href={x.url} target="_blank" rel="noopener" class="font-semibold underline underline-offset-2">{x.author}</a>: «{x.own}» <span class="font-mono text-[10.5px] text-muted-foreground">{x.date} · {num(x.views)} переглядів</span></li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
</Panel>

<Panel title="4 · Російська видача Google за датою публікації" note={`Знімок видачі Google від 03.10.2026 за запитом «Алексей Гончаренко»: ${num(gStat.rel)} результатів про нього, з них ${num(gStat.dated)} опубліковані 01.2025–10.2026 і мають дату (решта ${num(gStat.rel - gStat.dated)} — старші або без дати). Видача показує те, що Google вважає актуальним сьогодні, тож свіжі матеріали в ній завжди переважають: це підтверджує, що жовтнева тема миру зараз на першій сторінці, але не є часовим рядом. З ${num(gStat.dated)} датованих результатів ${num(gStat.oct)} (${pct(gStat.oct / (gStat.dated || 1), 0)}) опубліковані 1–3 жовтня 2026 року, і ${num(gStat.octMyr)} з них цитують його про мир. Серед ${num(gStat.ab)} матеріалів саме про нього за ці три дні негативні ${num(gStat.abNeg)}, у ${num(gStat.ros)} його звинувачують у роботі на російські наративи. За весь 2025 рік у видачі лишилось ${num(gStat.y25)} датованих результатів.`}>
  <StackBars rows={gSeries} keys={gKeys} step="month" onpick={gPick} height={260} events={[]} />
  <p class="mt-3 text-[12px]"><button class="text-muted-foreground underline underline-offset-2 hover:text-foreground" onclick={() => go("g")}>Докладніше: сторінка «Google» →</button></p>
</Panel>
