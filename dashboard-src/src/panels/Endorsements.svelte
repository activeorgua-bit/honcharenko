<script>
  /* СТОРІНКА 3 — ХТО СХВАЛЬНО ПІДХОПЛЮЄ ЙОГО ТЕЗИ. Знаменник — цитування з цією тезою;
     «схвально» — другий прохід, де модель мусила навести дослівні слова самого каналу. */
  import { num, pct, colorOf } from "$lib/api.js";
  import { S } from "$lib/state.svelte.js";
  import { tg, inRange, series, groupBy, TEZA_LABEL, QSV_LABEL, CC_LABEL } from "$lib/data.svelte.js";
  import { openDrill } from "$lib/drill.svelte.js";
  import { EVENTS } from "$lib/events.js";
  import Panel from "$lib/ui/Panel.svelte";
  import Segmented from "$lib/ui/Segmented.svelte";
  import StackBars from "$lib/charts/StackBars.svelte";
  import RankBars from "$lib/charts/RankBars.svelte";
  import { theme } from "$lib/theme.svelte.js";

  const dark = $derived(theme.choice === "dark" || (theme.choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
  const C = (k) => colorOf(k, dark);
  const QS = ["endorses", "neutral", "critical"];
  const qsKeys = $derived(QS.map((k) => ({ key: k, label: QSV_LABEL[k], color: C(k) })));
  const qsOf = (r) => (QS.includes(r.qsv) ? r.qsv : null);
  const thesisOpts = [{ value: "tck", label: "ТЦК, мобілізація" }, { value: "myr", label: "мир, переговори" }, { value: "vlada", label: "критика влади" }];
  const inThesis = (r) => r.rol === "quotes" && (S.enThesis === "all" ? r.teza.length > 0 : r.teza.includes(S.enThesis));
  const thLabel = $derived(TEZA_LABEL[S.enThesis] || "усі тези");
  const ccLabel = $derived(S.cc === "all" ? "усі канали" : CC_LABEL[S.cc]);
  const bLabel = (b) => (S.step === "month" ? b : S.step === "week" ? `тиждень від ${b}` : b);

  /* порівняння країн — завжди обидві, незалежно від глобального фільтра */
  const cmpRows = $derived(["ua", "ru"].map((cc) => {
    const items = tg(cc).filter((r) => inRange(r, S.from, S.to) && inThesis(r));
    const o = { key: cc, label: CC_LABEL[cc], n: items.length, items };
    for (const k of QS) o[k] = items.filter((r) => r.qsv === k).length;
    o.sub = `перевірено ${num(items.filter((r) => r.qsv).length)} з ${num(items.length)}`;
    return o;
  }));
  const cmpPick = (p) => openDrill(`${thLabel}: ${QSV_LABEL[p.key]}`, `${p.row.label} · цитування з тезою`, p.row.items.filter((r) => r.qsv === p.key));

  const rows = $derived(tg(S.cc).filter((r) => inRange(r, S.from, S.to) && inThesis(r)));
  const tRows = $derived(series(rows, S.step, qsOf, QS, S.from, S.to));
  const tPick = (p) => { const b = tRows.find((x) => x.b === p.b); if (b) openDrill(`${thLabel}: ${QSV_LABEL[p.key]}`, `${bLabel(p.b)} · ${ccLabel}`, b.items[p.key] || []); };

  /* канали-схвалювачі: усі схвальні цитування будь-якої тези, поділ за тезою */
  const TZ = ["tck", "myr", "vlada", "inshe"];
  const tzKeys = $derived(TZ.map((k) => ({ key: k, label: TEZA_LABEL[k], color: C(k) })));
  const tzG = (r) => (r.teza.includes("tck") ? "tck" : r.teza.includes("myr") ? "myr" : r.teza.includes("vlada") ? "vlada" : "inshe");
  const endorsers = $derived(groupBy(tg(S.cc).filter((r) => inRange(r, S.from, S.to) && r.rol === "quotes" && r.qsv === "endorses"), (r) => r.ch).slice(0, S.enTop).map((g) => {
    const o = { key: g.key, label: g.items[0].chn || "@" + g.key, n: g.n, items: g.items, sub: `@${g.key} · ${num(g.items[0].subs)} підписників` };
    for (const k of TZ) o[k] = g.items.filter((r) => tzG(r) === k).length;
    return o;
  }));
  const endPick = (p) => openDrill(`Схвально: ${p.row.label}`, `${TEZA_LABEL[p.key]} · ${ccLabel}`, p.row.items.filter((r) => tzG(r) === p.key));
</script>

<h2 class="mb-1 mt-2 text-[19px] font-semibold tracking-tight">Хто схвально підхоплює його тези</h2>
<p class="mb-4 max-w-[92ch] text-[13px] text-muted-foreground">
  «Схвально» — канал своїми словами погоджується з тезою чи підхоплює її; нейтральний передрук сюди не рахується. Це схвалення тези,
  а не самого Гончаренка. Ручна перевірка: для ТЦК точність близько 85–90%, для миру нижча — частки за миром читайте як верхню оцінку.
  Частку «критично» в російських каналах читайте з поправкою: російські медіа загалом критичні до всіх українських політиків, тож критика там — фон, а не реакція саме на цю тезу; показовим є саме схвалення.
</p>

<Panel title="1 · Українські проти російських каналів" note="Знаменник — цитування з обраною тезою. Поділ смуги — результат перевірки другим проходом. Частку «критично» в російських каналах читайте з поправкою: російські медіа загалом критичні до всіх українських політиків, тож критика там — фон, а не реакція саме на цю тезу; показовим є саме схвалення.">
  {#snippet controls()}
    <Segmented label="теза" value={S.enThesis} options={[...thesisOpts, { value: "all", label: "усі" }]} onchange={(v) => (S.enThesis = v)} />
    <Segmented label="шкала" value={S.enPct ? "pct" : "n"} options={[{ value: "pct", label: "частки" }, { value: "n", label: "кількість" }]} onchange={(v) => (S.enPct = v === "pct")} />
  {/snippet}
  <RankBars items={cmpRows} keys={qsKeys} percent={S.enPct} onpick={cmpPick} height={130} />
</Panel>

<Panel title={`2 · У часі: ${thLabel} · ${ccLabel}`} note="Цитування з тезою по кошиках часу й результат перевірки.">
  <StackBars rows={tRows} keys={qsKeys} percent={S.enPct} step={S.step} events={EVENTS} onpick={tPick} />
</Panel>

<Panel title={`3 · Канали, що найчастіше погоджуються з ним · ${ccLabel}`} note="Усі схвальні цитування будь-якої тези; поділ смуги — яка саме теза.">
  {#snippet controls()}
    <Segmented label="показати" value={String(S.enTop)} options={[{ value: "20", label: "20" }, { value: "40", label: "40" }, { value: "80", label: "80" }]} onchange={(v) => (S.enTop = Number(v))} />
  {/snippet}
  <RankBars items={endorsers} keys={tzKeys} onpick={endPick} />
</Panel>
