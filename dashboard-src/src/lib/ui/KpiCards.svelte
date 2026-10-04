<script>
  /* ============================================================================
     КЛЮЧОВІ ЦИФРИ ЗВЕРХУ

     ЩО ЦЕ ДАЄ. Дашборд відповідав на питання лише після прокручування до
     потрібної панелі. Картки згори кажуть головне одразу: скільки матеріалу,
     наскільки різка мережа, як це співвідноситься з еталоном.

     ЧОМУ ПОРІВНЯННЯ, А НЕ ЛИШЕ ЧИСЛО. Саме «57,8%» нічого не важить, поки не
     видно, що загальний фон 10,4%. Тому в кожній картці другим рядком іде
     те, з чим її треба зіставляти — інакше читач добудує базу сам, і майже
     напевно неправильно.
     ============================================================================ */
  import { num, pct } from "$lib/api.js";
  import * as Card from "$lib/components/ui/card/index.js";

  let { items = [] } = $props();
  // item: { label, value, hint, tone: "neg"|"pos"|null, sub }
</script>

<div class="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
  {#each items as k (k.label)}
    <Card.Root class="py-4">
      <Card.Content class="px-4">
        <div class="flex items-start justify-between gap-2">
          <span class="text-[12.5px] text-muted-foreground">{k.label}</span>
          {#if k.badge}
            <span class="rounded px-1.5 py-0.5 font-mono text-[10px]"
                  style={`background:${k.badgeColor}22;color:${k.badgeColor}`}>
              {k.badge}
            </span>
          {/if}
        </div>
        <div class="tnum mt-1 text-[26px] font-semibold leading-none tracking-tight"
             style={k.tone === "neg" ? "color:var(--c-neg)"
                  : k.tone === "pos" ? "color:var(--c-pos)" : ""}>
          {k.value}
        </div>
        {#if k.hint}
          <div class="mt-1.5 text-[11.5px] leading-snug text-muted-foreground">
            {k.hint}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  {/each}
</div>
