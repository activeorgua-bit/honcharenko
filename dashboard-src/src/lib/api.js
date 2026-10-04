/* Форматування чисел і кольори осей. Статичний дашборд: мережевого API немає,
   дані живуть у $lib/data.svelte.js, тож тут лише те, що імпортують компоненти з f.ppl.watch. */
const nf = new Intl.NumberFormat("uk-UA");
export const num = (v) => (v == null || Number.isNaN(v) ? "—" : nf.format(Math.round(v)));
export const pct = (v, d = 1) =>
  v == null || Number.isNaN(v) ? "—" : (100 * v).toFixed(d).replace(".", ",") + "%";
export const sgn = (v, d = 2) =>
  v == null || Number.isNaN(v) ? "—" : (v > 0 ? "+" : "") + v.toFixed(d).replace(".", ",");

/* Кольори категорій — у HEX, бо шкала SveltePlot стоїть на d3-color і не читає oklch()/var().
   Тези — палітра dataviz (перевірена валідатором: CVD ΔE ≥ 8,4, нормальний зір ≥ 19,8). */
export const COLOR = {
  myr: "#2a78d6", tck: "#eb6834", vlada: "#1baf7a", inshe: "#eda100", none: "#b4b7bd",
  ua: "#2a78d6", ru: "#8b5cf6", other: "#9aa4b2", g: "#eda100",
  quotes: "#2a78d6", about: "#eb6834", mention: "#b4b7bd",
  ros_propahanda: "#d92546", populizm: "#eda100", koruptsiia: "#8b5cf6", zrada: "#eb6834", inshe_zv: "#b4b7bd",
  endorses: "#129a6b", neutral: "#9aa4b2", critical: "#d92546",
};
export const DARK = {
  myr: "#3987e5", tck: "#d95926", vlada: "#199e70", inshe: "#c98500", none: "#5c5f66",
  ua: "#3987e5", ru: "#a78bfa", other: "#7b8595", g: "#c98500",
  quotes: "#3987e5", about: "#d95926", mention: "#5c5f66",
  ros_propahanda: "#ff5a78", populizm: "#c98500", koruptsiia: "#a78bfa", zrada: "#d95926", inshe_zv: "#5c5f66",
  endorses: "#35d39b", neutral: "#7b8595", critical: "#ff5a78",
};
export const colorOf = (k, dark = false) => (dark ? DARK : COLOR)[k] ?? (dark ? "#7b8595" : "#9aa4b2");
