/* ============================================================================
   СВІТЛА / ТЕМНА ТЕМА

   ЧОМУ ВЛАСНИЙ ПЕРЕМИКАЧ, А НЕ БІБЛІОТЕКА. mode-watcher записував вибір у
   localStorage (`mode-watcher-mode=light`), змінював власний стан — підпис
   кнопки справно перемикався, — але клас `.dark` з кореня не знімав. Тобто
   збій був найгіршого різновиду: інтерфейс каже, що перемкнувся, а сторінка
   лишається темною. Двадцять рядків тут не мають цієї невизначеності.

   ТРИ СТАНИ, А НЕ ДВА. «Світла», «темна» і «як у системі» — різні речі:
   третя означає «слідкуй далі», і саме її очікують від дашборда, відкритого
   зранку й закритого ввечері. Перемикач ходить по колу між ними.
   ============================================================================ */

const KEY = "tgr-theme";
const media = window.matchMedia("(prefers-color-scheme: dark)");

function read() {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export const theme = $state({ choice: read() });

const resolved = () => (theme.choice === "system"
  ? (media.matches ? "dark" : "light")
  : theme.choice);

function apply() {
  const dark = resolved() === "dark";
  document.documentElement.classList.toggle("dark", dark);
  // colorScheme керує тим, у якому вигляді браузер малює власні елементи —
  // смуги прокрутки й поля вибору дати. Без нього вони лишаються світлими
  // на темній сторінці й видають себе рамкою.
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

apply();
media.addEventListener("change", () => {
  if (theme.choice === "system") apply();
});

export function setTheme(next) {
  theme.choice = next;
  try {
    next === "system" ? localStorage.removeItem(KEY)
                      : localStorage.setItem(KEY, next);
  } catch { /* приватний режим — вибір діє до перезавантаження */ }
  apply();
}

export function cycleTheme() {
  setTheme(theme.choice === "light" ? "dark"
    : theme.choice === "dark" ? "system" : "light");
}

export const themeLabel = () =>
  theme.choice === "light" ? "Світла" : theme.choice === "dark" ? "Темна" : "Як у системі";
