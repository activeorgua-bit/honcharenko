"""Сторінка для вбудовування графа «Головне» (iframe на сайті розслідувань).

Береться dossier/11651-core.html як є (дані й D3-скрипт уже всередині) і лише стилями ховається все,
крім картки з графом: навігація, шапка, застереження, таблиця звʼязків. HTML не вирізаємо — скрипт
сторінки заповнює таблицю #etb і чекає її в DOM.
Запуск після кожного оновлення досьє:  py -3.13 tools/make_embed.py
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[1] / "dossier"
SRC, OUT = ROOT / "11651-core.html", ROOT / "11651-core-embed.html"

EMBED_CSS = """
<style id="embed">
/* режим вбудовування: лише граф і панель звʼязків */
html, body { background: var(--bg); }
.projnav, header.hd, .card:not(:has(#cgc)) { display: none !important; }
.wrap { max-width: none !important; margin: 0 !important; padding: 8px !important; }
.card:has(#cgc) { margin: 0 !important; }
#cgc { height: calc(100vh - 120px) !important; min-height: 460px !important; }
.embed-src { font: 12px var(--f-body); color: var(--muted); margin: 6px 2px 0; }
.embed-src a { color: var(--accent); }
/* у вузькому iframe сітка ставить панель під граф — поза видимою висотою; тому панель — поверх графа, по кліку */
.card:has(#cgc) .cg { display: block !important; position: relative; }
#cgp { position: absolute !important; top: 8px; right: 8px; z-index: 5; width: min(380px, calc(100% - 16px));
       max-height: calc(100% - 16px) !important; display: none; box-shadow: 0 10px 34px rgba(0,0,0,.28); padding-right: 34px !important; }
.cg.open #cgp { display: block; }
#cgp-close { position: absolute; top: 14px; right: 16px; z-index: 6; display: none; width: 26px; height: 26px; border-radius: 50%;
             border: 1px solid var(--rule); background: var(--surface); color: var(--fg); font: 15px/1 var(--f-body); cursor: pointer; }
.cg.open #cgp-close { display: block; }
</style>
"""
# після основного скрипта: select() показує/ховає панель-оверлей; «✕» і повторний клік закривають
EMBED_JS = """
<script>
(function () {
  const cg = document.querySelector('.cg'), panel = document.getElementById('cgp');
  const close = document.createElement('button'); close.id = 'cgp-close'; close.type = 'button'; close.title = 'закрити'; close.textContent = '✕';
  cg.appendChild(close);
  const orig = select;
  select = function (id) { orig(id); cg.classList.toggle('open', !!sel); if (sel) panel.scrollTop = 0; };
  close.onclick = () => { if (sel) select(sel); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sel) select(sel); });
})();
</script>
"""
EMBED_LINK = ('<p class="embed-src">Граф звʼязків Олексія Гончаренка · клік по вузлу — повна інформація · '
              '<a href="11651-core.html" target="_blank" rel="noopener">відкрити досьє повністю ↗</a></p>')


def main():
    html = SRC.read_text(encoding="utf-8")
    html = html.replace("<title>Головне — Гончаренко</title>", "<title>Граф звʼязків — Гончаренко</title>", 1)
    html = html.replace("</head>", EMBED_CSS + '<base target="_blank">\n</head>', 1)
    # підпис-посилання одразу після графа
    html, n = re.subn(r'(<div class="cg"[^>]*>.*?</aside></div>)', lambda m: m.group(1) + EMBED_LINK, html, count=1, flags=re.S)
    if n != 1:
        sys.exit("не знайшов блок графа .cg — структура сторінки змінилась")
    if "function select(" not in html or html.count("</body>") != 1:
        sys.exit("не знайшов select() або </body> — структура сторінки змінилась")
    html = html.replace("</body>", EMBED_JS + "</body>", 1)
    OUT.write_text(html, encoding="utf-8")
    print("OK", OUT, len(html))


if __name__ == "__main__":
    main()
