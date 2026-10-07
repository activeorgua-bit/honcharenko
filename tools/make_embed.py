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
</style>
"""
EMBED_LINK = ('<p class="embed-src">Граф звʼязків Олексія Гончаренка · '
              '<a href="11651-core.html" target="_blank" rel="noopener">відкрити досьє повністю ↗</a></p>')


def main():
    html = SRC.read_text(encoding="utf-8")
    html = html.replace("<title>Головне — Гончаренко</title>", "<title>Граф звʼязків — Гончаренко</title>", 1)
    html = html.replace("</head>", EMBED_CSS + '<base target="_blank">\n</head>', 1)
    # підпис-посилання одразу після графа
    html, n = re.subn(r'(<div class="cg"[^>]*>.*?</aside></div>)', lambda m: m.group(1) + EMBED_LINK, html, count=1, flags=re.S)
    if n != 1:
        sys.exit("не знайшов блок графа .cg — структура сторінки змінилась")
    OUT.write_text(html, encoding="utf-8")
    print("OK", OUT, len(html))


if __name__ == "__main__":
    main()
