#!/usr/bin/env bash
set -euo pipefail

# Ensure clean working tree (or allow with --allow-dirty)
ALLOW_DIRTY=0
for arg in "$@"; do [[ "$arg" == "--allow-dirty" ]] && ALLOW_DIRTY=1; done

if [[ $ALLOW_DIRTY -eq 0 ]]; then
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "✖ Working tree not clean. Commit or stash changes, or run: backup-tag.sh --allow-dirty"
    exit 1
  fi
fi

STAMP=$(date +"%Y%m%d-%H%M")
TAG="backup/${STAMP}"

# Avoid collision
if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  TAG="backup/${STAMP}-$(git rev-parse --short HEAD)"
fi

echo "→ Creating backup tag: ${TAG}"
git tag -a "${TAG}" -m "Automated backup ${TAG}"

# If remote exists, push (best-effort)
if git remote | grep -q .; then
  echo "→ Detected remote(s): pushing tag"
  git push --tags || true
else
  echo "ℹ No remote configured. Local tag created only."
fi

echo "✓ Done."