#!/usr/bin/env python3
"""Quick checks on the built game, run after `python3 build.py`.

- every inline <script> in index.html parses (node --check)
- every a/<file> the page references exists
- the page stays small (art belongs in a/, not inline)
Exit code 1 on any problem.   Usage: python3 scripts/check_site.py
"""
import pathlib, re, subprocess, sys, tempfile

root = pathlib.Path(__file__).resolve().parent.parent
page = root / "index.html"
problems = []
if not page.is_file():
    sys.exit("index.html missing: run python3 build.py first")
html = page.read_text(encoding="utf-8")

with tempfile.TemporaryDirectory() as tmp:
    for i, script in enumerate(re.findall(r"<script>([\s\S]*?)</script>", html)):
        f = pathlib.Path(tmp) / f"script{i}.js"
        f.write_text(script, encoding="utf-8")
        r = subprocess.run(["node", "--check", str(f)], capture_output=True, text=True)
        if r.returncode:
            problems.append(f"inline script {i} does not parse:\n{r.stderr.strip()[:2000]}")

refs = sorted(set(re.findall(r"a/[0-9a-f]{14}\.[a-z0-9]+", html)))
missing = [r for r in refs if not (root / r).is_file()]
if missing:
    problems.append(f"{len(missing)} referenced asset files are missing, e.g. {missing[:5]}")
size = page.stat().st_size
if size > 5_000_000:
    problems.append(f"index.html is {size / 1e6:.1f} MB; art should be written to a/ by build.py")

if problems:
    print("SITE CHECK FAILED"); [print(" -", p) for p in problems]; sys.exit(1)
print(f"Site check passed: {len(refs)} asset files, index.html {size / 1e6:.2f} MB, scripts parse.")
