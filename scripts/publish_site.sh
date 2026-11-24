#!/usr/bin/env bash
# Publish the built game to the gh-pages branch, which GitHub Pages serves at
# https://sfutie4-ops.github.io/ring-brawlers/
#
# The branch holds only the site: index.html, a/ and .nojekyll, as one fresh commit each time
# (it is replaced, not appended to, so the branch never grows). Normally the GitHub Action runs this
# after every merge to main; run it by hand only if the Action is unavailable:
#   python3 build.py && python3 scripts/check_site.py && scripts/publish_site.sh
# Optional argument: the remote URL to push to (defaults to this repo's origin).
set -euo pipefail
cd "$(dirname "$0")/.."
REMOTE="${1:-$(git remote get-url origin)}"
if [ ! -f index.html ] || [ ! -d a ]; then echo "Nothing to publish: run python3 build.py first" >&2; exit 1; fi
SHA="$(git rev-parse --short HEAD 2>/dev/null || echo local)"
SITE="$(mktemp -d)"
trap 'rm -rf "$SITE"' EXIT
cp index.html "$SITE/"
cp -r a "$SITE/a"
touch "$SITE/.nojekyll"
cd "$SITE"
git init -q -b gh-pages
git add -A
if [ -n "${GITHUB_ACTIONS:-}" ]; then
  git -c user.name="github-actions[bot]" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
    commit -qm "Publish FliptapWars from ${SHA}"
else
  git commit -qm "Publish FliptapWars from ${SHA}"
fi
git push -q -f "$REMOTE" gh-pages
echo "Published ${SHA} to gh-pages"
