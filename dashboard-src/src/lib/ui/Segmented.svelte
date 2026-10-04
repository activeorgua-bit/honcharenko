<script>
  /* ============================================================================
     СЕГМЕНТНИЙ ПЕРЕМИКАЧ

     ЩО ЦЕ ЛАГОДИТЬ ПО СУТІ. У попередній збірці обробники навішувалися за
     ПОЗИЦІЄЮ ряду фільтрів: attach(панель, [fn1, fn2, fn3]). Варто було
     додати панелі ще один фільтр — і обробник когорт мовчки з'їжджав на
     сусідній контрол. Це не помилка неуважності, а вада конструкції: звʼязок
     між кнопкою та дією існував лише в голові автора.

     Тут звʼязок явний: компонент отримує значення і функцію зміни. Додати
     четвертий фільтр неможливо так, щоб поїхав третій.

     СТАН «УВІМКНЕНО» НЕСУТЬ ТРИ ОЗНАКИ ОДРАЗУ — заливка, колір тексту й
     накреслення. Одного кольору мало: у темній темі, на проєкторі та в людей
     із дальтонізмом сама лише заливка зчитується ненадійно. Саме на цьому
     була скарга «неочевидно, що вибрано».
     ============================================================================ */
  import { cn } from "$lib/utils.js";

  let {
    label = "",
    options = [],          // [{ value, label, title?, disabled?, color? }]
    value,                 // поточне значення (рядок) або Set для multi
    multi = false,
    onchange,
    class: klass = "",
  } = $props();

  const isOn = (v) => (multi ? value?.has?.(v) : value === v);
</script>

<div class={cn("flex items-center gap-2", klass)}>
  {#if label}
    <span class="text-[10px] font-mono uppercase tracking-wider
                 text-muted-foreground whitespace-nowrap">{label}</span>
  {/if}
  <div class="inline-flex rounded-md border border-border bg-card overflow-hidden">
    {#each options as o (o.value)}
      <button
        type="button"
        title={o.title ?? ""}
        disabled={o.disabled}
        onclick={() => !o.disabled && onchange?.(o.value)}
        style={o.color && isOn(o.value) ? `background:${o.color};color:#fff` : ""}
        class={cn(
          "px-2.5 py-1 text-[12.5px] leading-tight whitespace-nowrap",
          "border-r border-border last:border-r-0 transition-colors",
          "flex items-center gap-1.5",
          isOn(o.value)
            ? "bg-primary text-primary-foreground font-semibold"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
          o.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent",
        )}
      >
        {#if o.color}
          <i class="size-2 rounded-[3px] shrink-0"
             style={`background:${isOn(o.value) ? "#fff" : o.color}`}></i>
        {/if}
        {o.label}
      </button>
    {/each}
  </div>
</div>
