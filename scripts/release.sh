#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: scripts/release.sh <version>  (e.g., 1.4.0)"
  exit 1
fi

VERSION="$1"
TAG="v${VERSION}"

# Basic version check
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "✖ Version must be in form X.Y.Z"
  exit 1
fi

# Ensure clean tree
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "✖ Working tree not clean. Commit or stash changes."
  exit 1
fi

# Generate simple CHANGELOG entry (append to top)
DATE=$(date +"%Y-%m-%d")
TMP=$(mktemp)
{
  echo "## ${TAG} - ${DATE}"
  echo ""
  echo "### Added"
  git log --pretty=format:'- %s' "$(git describe --tags --abbrev=0 2>/dev/null || echo "")"..HEAD | grep '^feat' || echo "- (none)"
  echo ""
  echo "### Fixed"
  git log --pretty=format:'- %s' "$(git describe --tags --abbrev=0 2>/dev/null || echo "")"..HEAD | grep '^fix' || echo "- (none)"
  echo ""
} > "$TMP"

if [[ -f CHANGELOG.md ]]; then
  cat "$TMP" "CHANGELOG.md" > "${TMP}.all"
  mv "${TMP}.all" CHANGELOG.md
else
  mv "$TMP" CHANGELOG.md
fi

git add CHANGELOG.md
git commit -m "chore(release): prepare ${TAG}"
git tag -a "${TAG}" -m "Release ${TAG}"

if git remote | grep -q .; then
  git push && git push --tags || true
else
  echo "ℹ No remote configured. Local release tag created."
fi

echo "✓ Release ${TAG} done."