/* Одне вікно першоджерел на весь дашборд. Панель передає НЕ фільтр, а самі рядки,
   з яких порахувала число: тоді лічильник у вікні дорівнює числу на графіку за побудовою. */
export const drill = $state({ open: false, title: "", subtitle: "", rows: [] });

export function openDrill(title, subtitle, rows) {
  drill.title = title; drill.subtitle = subtitle; drill.rows = rows || []; drill.open = true;
}
export function closeDrill() { drill.open = false; }
