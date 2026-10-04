/* Стан дашборда з синхронізацією в URL: зріз має бути посиланням, яке можна надіслати. */
const DEFAULTS = {
  page: "sm",
  cc: "ua",            // ua | ru | all — спільна вісь країни каналу
  from: "", to: "",    // спільний період (порожньо = увесь знімок)
  step: "month",
  // огляд
  ovKey: "rol", ovPct: false,
  snPct: false, tzPct: false,
  // схвалення
  enThesis: "tck", enPct: true, enTop: 20,
  // канали
  chSort: "n", chTop: 40, chMin: 5, chSplit: "rol",
  // google
  gKey: "myr",
  // матеріали
  mtB: "", mtRel: "rel", mtRol: "", mtTz: "", mtZv: "", mtQs: "", mtSent: "", mtTgt: "", mtGcat: "", mtQ: "", mtSort: "date", mtPage: 1,
};
export const S = $state({ ...DEFAULTS });

(function readURL() {
  const p = new URLSearchParams(location.search);
  for (const [k, v] of p) {
    if (!(k in DEFAULTS)) continue;
    const d = DEFAULTS[k];
    S[k] = typeof d === "boolean" ? v === "1" : typeof d === "number" ? Number(v) : v;
  }
})();

export function syncURL() {
  const p = new URLSearchParams();
  for (const [k, d] of Object.entries(DEFAULTS)) {
    const v = S[k];
    if (v === d || v === "" || v == null) continue;
    p.set(k, typeof v === "boolean" ? "1" : String(v));
  }
  const s = p.toString();
  const url = location.pathname + (s ? "?" + s : "");
  if (url !== location.pathname + location.search) history.replaceState(null, "", url);
}
export const resetMaterials = () => {
  for (const k of Object.keys(DEFAULTS)) if (k.startsWith("mt")) S[k] = DEFAULTS[k];
};
