#!/usr/bin/env bash
# Build and publish the site to the gh-pages branch (GitHub Pages source).
# CNAME is copied to gh-pages only once the custom domain is set on the repo,
# so the github.io URL keeps working until DNS for skills.cygnixlabs.com is in place.
set -euo pipefail
cd "$(dirname "$0")"
REPO=cygnixlabs-cmd/cygnix-skills-site
python3 build.py "$@"
OUT=$(mktemp -d)
rsync -a --exclude '.git' --exclude 'shot-*.png' --exclude 'template.html' --exclude 'build.py' --exclude 'deploy.sh' --exclude 'CNAME' --exclude 'README.md' ./ "$OUT/"
touch "$OUT/.nojekyll"
if [ "$(gh api repos/$REPO/pages --jq .cname 2>/dev/null || true)" = "skills.cygnixlabs.com" ]; then cp CNAME "$OUT/CNAME"; fi
cd "$OUT"; git init -q -b gh-pages; git add -A
git -c user.name="Cygnix Labs" -c user.email="cygnixlabs@gmail.com" commit -qm "Deploy $(date -u +%FT%TZ)"
git remote add origin "https://github.com/$REPO.git"
git fetch -q origin gh-pages 2>/dev/null && git reset -q --soft origin/gh-pages && git -c user.name="Cygnix Labs" -c user.email="cygnixlabs@gmail.com" commit -qm "Deploy $(date -u +%FT%TZ)" || true
git push -q origin gh-pages
echo "deployed"
