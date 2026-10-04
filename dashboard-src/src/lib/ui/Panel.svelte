<script>
  /* ============================================================================
     ПАНЕЛЬ ЗІ СВОЇМ СТАНОМ ЗАВАНТАЖЕННЯ

     ЧОМУ СТАН ЖИВЕ ТУТ, А НЕ НА СТОРІНЦІ. У попередній збірці зміна одного
     фільтра гасила ВСЮ сторінку: сім запитів переобчислювалися, вміст на
     мить зникав, висота документа схлопувалася — і прокрутка притискалася
     до нової межі. Виглядало це як «сторінка стрибає вгору», хоча прокрутку
     ніхто не скидав, їй просто не було куди дітися.

     Тут кожна панель показує власний індикатор, не зникаючи: попередні дані
     лишаються на екрані приглушеними, доки не прийдуть нові. Висота
     документа не змінюється, прокрутка не має причини рухатися.

     ПОМИЛКА ПОКАЗУЄТЬСЯ, А НЕ КОВТАЄТЬСЯ. Порожній графік і графік, який не
     завантажився, виглядають однаково, і плутати їх у дослідженні дорого.
     ============================================================================ */
  import * as Card from "$lib/components/ui/card/index.js";

  let {
    title,
    note = "",
    warn = "",
    controls,
    children,
    loading = false,
    error = null,
    fetching = false,
  } = $props();
</script>

<Card.Root class="mb-4 relative">
  <Card.Header class="pb-3">
    <Card.Title class="text-[15px] font-semibold tracking-tight">
      {title}
    </Card.Title>
    {#if note}
      <Card.Description class="text-[12.5px] leading-relaxed max-w-[92ch]">
        {@html note}
      </Card.Description>
    {/if}
  </Card.Header>

  <Card.Content class="pt-0">
    {#if warn}
      <p class="mb-3 rounded-md border-l-[3px] border-l-amber-500 bg-amber-500/5
                px-3 py-2 text-[12px] leading-relaxed text-muted-foreground">
        {@html warn}
      </p>
    {/if}

    {#if controls}
      <div class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2
                  rounded-lg border border-border bg-muted/40 px-3 py-2">
        {@render controls()}
      </div>
    {/if}

    {#if error}
      <p class="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2
                text-[12.5px] text-destructive">
        Не вдалося завантажити: {error.message}
      </p>
    {:else if loading}
      <div class="flex h-40 items-center justify-center text-[12.5px]
                  text-muted-foreground">рахуємо…</div>
    {:else}
      <!-- Приглушення замість зникнення: розміри лишаються, прокрутка теж -->
      <div class:opacity-50={fetching} class="transition-opacity duration-150">
        {@render children?.()}
      </div>
    {/if}
  </Card.Content>
</Card.Root>
