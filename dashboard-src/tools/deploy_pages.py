"""Деплой дашборда на GitHub Pages у репозиторій activeorgua-bit/honcharenko (гілка main, тека dashboard/).

    py -3.13 tools/deploy_pages.py [--clone <тека клону>] [--dry]

Що робить: збірка з базою /honcharenko/dashboard/ → dist-static; dist-static → <клон>/dashboard (стара тека прибирається);
джерело без node_modules/dist/public/data → <клон>/dashboard-src (дані живуть лише в dashboard/data);
пункт «Дашборд цитувань» у index.html і README.md сайту (якщо його ще немає); коміт ЛИШЕ як activeorgua-bit, push по SSH ключем ~/.ssh/ghkey.
Pages у цьому репо збирається Jekyll-ом із кореня main, тому .nojekyll НЕ додається (він зламав би тему для інших розділів).
"""
import argparse, os, shutil, subprocess, sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = Path(__file__).resolve().parents[1]
HOME = Path.home()
AUTHOR = ["-c", "user.name=activeorgua-bit", "-c", "user.email=270802906+activeorgua-bit@users.noreply.github.com", "-c", "core.autocrlf=false"]
SSH = f"ssh -i {HOME / '.ssh' / 'ghkey'} -o IdentitiesOnly=yes"
REMOTE = "git@github.com:activeorgua-bit/honcharenko.git"
BASE = "/honcharenko/dashboard/"
SRC_INCLUDE = ["package.json", "package-lock.json", "vite.config.js", "jsconfig.json", "index.html", "README.md", ".gitignore", ".gitattributes", "src", "tools", "public"]

LI = """  <li>
    <a href="dashboard/">Дашборд цитувань Гончаренка</a>
    <p>Telegram-канали України й Росії (Telemetrio, 01.2025–10.2026) і російська видача Google: тональність, звинувачення, схвалення тез, канали. Кожне число розкривається в перелік першоджерел.</p>
  </li>
"""
README_LINE = "- [Дашборд цитувань Гончаренка](dashboard/) — Telegram-канали України й Росії (Telemetrio) і російська видача Google: тональність, звинувачення в роботі на РФ, схвалення тез про ТЦК і мир, канали; кожне число розкривається в перелік першоджерел. Джерело: `dashboard-src/`.\n"


def run(cmd, cwd, env=None, check=True):
    r = subprocess.run(cmd, cwd=str(cwd), env={**os.environ, **(env or {})}, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if check and r.returncode != 0:
        raise SystemExit(f"[{r.returncode}] {' '.join(map(str, cmd))}\n{r.stdout[-1500:]}\n{r.stderr[-1500:]}")
    return r.stdout + r.stderr


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--clone", default=str(ROOT.parent / "_honcharenko_pages"))
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--skip-build", action="store_true")
    a = ap.parse_args()
    clone = Path(a.clone)
    if not a.skip_build:
        print("збірка…")
        out = run([str(ROOT / "node_modules" / ".bin" / ("vite.cmd" if os.name == "nt" else "vite")), "build"], ROOT, {"VITE_BASE": BASE, "VITE_OUTDIR": "dist-static"})
        print(out.strip().splitlines()[-1])
    dist = ROOT / "dist-static"
    assert (dist / "index.html").exists() and f'src="{BASE}assets/' in (dist / "index.html").read_text(encoding="utf-8"), "dist-static зібрано не з тією базою"
    if not clone.exists():
        print("клон…"); run(["git", "clone", "-q", "--depth", "1", REMOTE, str(clone)], ROOT, {"GIT_SSH_COMMAND": SSH})
    else:
        run(["git", "fetch", "-q", "--depth", "1", "origin", "main"], clone, {"GIT_SSH_COMMAND": SSH}); run(["git", "reset", "-q", "--hard", "origin/main"], clone)
    # dashboard/ (збірка з даними)
    tgt = clone / "dashboard"
    if tgt.exists():
        shutil.rmtree(tgt)
    shutil.copytree(dist, tgt)
    # dashboard-src/ (джерело без даних і залежностей)
    src = clone / "dashboard-src"
    if src.exists():
        shutil.rmtree(src)
    src.mkdir()
    for name in SRC_INCLUDE:
        p = ROOT / name
        if not p.exists():
            continue
        if p.is_dir():
            shutil.copytree(p, src / name, ignore=shutil.ignore_patterns("data", "__pycache__", "node_modules"))
        else:
            shutil.copy2(p, src / name)
    (src / "public" / "data").mkdir(parents=True, exist_ok=True)
    (src / "public" / "data" / "README.md").write_text("Дані знімка живуть у ../../dashboard/data (щоб не дублювати 80 МБ). Для локальної збірки скопіюйте їх сюди або перегенеруйте tools/export_dash.py.\n", encoding="utf-8")
    # лендинг і README сайту
    idx = clone / "index.html"
    h = idx.read_text(encoding="utf-8")
    if 'href="dashboard/"' not in h:
        h = h.replace('<ul class="sections">\n', '<ul class="sections">\n' + LI, 1); idx.write_text(h, encoding="utf-8")
    rd = clone / "README.md"
    t = rd.read_text(encoding="utf-8")
    if "](dashboard/)" not in t:
        t = t.replace("## Розділи\n\n", "## Розділи\n\n" + README_LINE, 1); rd.write_text(t, encoding="utf-8")
    st = run(["git", "status", "--porcelain"], clone)
    n = len([l for l in st.splitlines() if l.strip()])
    print(f"змінених шляхів у клоні: {n}")
    if a.dry:
        print(st[:2000]); return
    run(["git", "add", "-A"], clone)
    if n:
        run(["git", *AUTHOR, "commit", "-q", "-m", "Дашборд цитувань Гончаренка: статична збірка (dashboard/) і джерело (dashboard-src/)"], clone)
        print(run(["git", "log", "--format=%h %an <%ae> %s", "-1"], clone).strip())
        print(run(["git", "push", "-q", "origin", "HEAD:main"], clone, {"GIT_SSH_COMMAND": SSH}).strip() or "push ok")
    else:
        print("нічого комітити")


if __name__ == "__main__":
    main()
