<script>
  /* Плашки розмітки одного матеріалу — спільні для вікна першоджерел і таблиці матеріалів. */
  import { colorOf } from "$lib/api.js";
  import { CC_LABEL, ROL_LABEL, TEZA_LABEL, ZV_LABEL, QSV_LABEL, SENT_LABEL, TGT_LABEL, GCAT_LABEL, tone } from "$lib/data.svelte.js";
  let { r, full = false } = $props();
  const chip = (txt, color) => ({ txt, color });
  const chips = $derived.by(() => {
    const out = [];
    out.push(chip(CC_LABEL[r.cc], colorOf(r.cc)));
    if (r.rel !== 1) out.push(chip(r.rel === 0 ? "нерелевантне" : "не розмічено", "#9aa4b2"));
    if (r.ad) out.push(chip("реклама", "#9aa4b2"));
    if (r.dup) out.push(chip("дубль", "#9aa4b2"));
    if (r.rol) out.push(chip(ROL_LABEL[r.rol], colorOf(r.rol)));
    if (r.tgt === "subject" && r.sent != null) out.push(chip("про нього: " + SENT_LABEL[String(r.sent)], tone(r) === "neg" ? "#d92546" : tone(r) === "pos" ? "#129a6b" : "#9aa4b2"));
    else if (full && r.tgt) out.push(chip(TGT_LABEL[r.tgt], "#9aa4b2"));
    for (const t of r.teza) out.push(chip("теза: " + TEZA_LABEL[t], colorOf(t)));
    for (const z of r.zv) out.push(chip("звинувачення: " + ZV_LABEL[z], colorOf(z === "inshe" ? "inshe_zv" : z)));
    if (r.qsv) out.push(chip("канал: " + QSV_LABEL[r.qsv], colorOf(r.qsv)));
    if (full && r.gcat) out.push(chip(GCAT_LABEL[r.gcat] || r.gcat, "#9aa4b2"));
    if (r.own) out.push(chip("його власний канал", "#eda100"));
    return out;
  });
</script>

{#each chips as c (c.txt)}
  <span class="rounded px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap" style={`background:${c.color}22;color:${c.color}`}>{c.txt}</span>
{/each}
