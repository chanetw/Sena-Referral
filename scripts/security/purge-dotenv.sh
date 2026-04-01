#!/usr/bin/env bash
set -euo pipefail
REPO_DIR="/Users/chanetw/Documents/Referral/referralsena-main"
cd "$REPO_DIR" || { echo "Cannot cd to $REPO_DIR"; exit 1; }

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash changes first."
  git status --porcelain
  exit 1
fi

OLD_COMMIT=$(git rev-parse --short HEAD)
echo "Old commit: $OLD_COMMIT"

git branch -f "backup/purge-before-dotenv-$OLD_COMMIT"

git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

git for-each-ref --format='%(refname)' refs/original/ | xargs -r git update-ref -d || true
git reflog expire --expire=now --all || true
git gc --prune=now --aggressive || true

git push origin --force --all
git push origin --force --tags

git log --oneline -n 5
git branch -r --contains "$OLD_COMMIT" || true
git branch --show-current
git rev-parse --short HEAD

echo "Purge complete"
