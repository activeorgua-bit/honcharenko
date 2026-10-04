<script>
  /* ============================================================================
     ДІАПАЗОН ДАТ ПРИ КОЖНОМУ ГРАФІКУ

     ЧОМУ НЕ ЛИШЕ ЗВЕРХУ. Глобальний фільтр змушує тримати весь дашборд в
     одному проміжку, хоча питання в панелей різні: кумулятивний зріз
     дивляться за весь період, а сплеск — за конкретний тиждень. Спільний
     фільтр перетворює це на «змінив тут — зіпсував там».

     Порожнє значення означає «як угорі»: панель не копіює глобальний
     проміжок, а посилається на нього, тож зміна вгорі діє на всі панелі, які
     не мають власного вибору.
     ============================================================================ */
  let { from = "", to = "", globalFrom = "", globalTo = "", min, max, onchange } = $props();

  const own = $derived(!!(from || to));
</script>

<div class="flex items-center gap-1.5">
  <span class="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
    період
  </span>
  <input type="date" value={from || globalFrom} {min} {max}
    onchange={(e) => onchange?.(e.currentTarget.value, to || globalTo)}
    class="tnum rounded-md border border-border bg-card px-1.5 py-0.5 text-[11.5px]
           {own ? 'ring-1 ring-ring/50' : ''}" />
  <span class="text-muted-foreground">–</span>
  <input type="date" value={to || globalTo} {min} {max}
    onchange={(e) => onchange?.(from || globalFrom, e.currentTarget.value)}
    class="tnum rounded-md border border-border bg-card px-1.5 py-0.5 text-[11.5px]
           {own ? 'ring-1 ring-ring/50' : ''}" />
  {#if own}
    <button onclick={() => onchange?.("", "")}
      title="повернутися до загального періоду"
      class="rounded px-1.5 py-0.5 text-[11px] text-muted-foreground
             hover:bg-accent hover:text-foreground">як угорі</button>
  {/if}
</div>
