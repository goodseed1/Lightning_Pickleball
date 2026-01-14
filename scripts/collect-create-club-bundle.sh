#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

TS="$(date +"%Y%m%d_%H%M%S")"
OUT_DIR="bundle/create_club_review_${TS}"
CONCAT_MD="${OUT_DIR}/create_club_review.concat.md"
MANIFEST="${OUT_DIR}/BUNDLE_MANIFEST.txt"
ARCHIVE="${OUT_DIR}.tar.gz"

mkdir -p "${OUT_DIR}"

# -------- 수집 유틸: 공백/특수문자 안전 ----------
files=()
add_if_exists() { [[ -f "$1" ]] && files+=("$1"); }
add_find_name() { # dir pattern
  local dir="$1"; shift
  [[ -d "$dir" ]] || return 0
  while IFS= read -r -d '' f; do 
    files+=("$f")
  done < <(find "$dir" -type f \( "$@" \) -print0)
}
add_wildcard_dir_name() { # parentDir, case-insensitive name like *club*.*
  local dir="$1"; local pat="$2"
  [[ -d "$dir" ]] || return 0
  while IFS= read -r -d '' f; do 
    files+=("$f")
  done < <(find "$dir" -type f -iname "$pat" -print0)
}

# -------- 대상 파일 수집 (macOS bash 3.2 호환) ----------
# 핵심 단일파일
add_if_exists "src/screens/clubs/CreateClubScreen.tsx"
add_if_exists "src/components/common/SafeGooglePlacesAutocomplete.tsx"
add_if_exists "src/components/layout/Section.tsx"
add_if_exists "src/components/layout/TwoColChips.tsx"
add_if_exists "src/components/modals/MeetTimePickerModal.tsx"
add_if_exists "src/components/decor/TennisBackdrop.tsx"
add_if_exists "src/navigation/AppNavigator.tsx"
add_if_exists "src/i18n/index.ts"
add_if_exists "docs/LOCATION_SEARCH.md"
add_if_exists "scripts/check-places-usage.sh"
add_if_exists "App.tsx"
add_if_exists "package.json"
add_if_exists "tsconfig.json"
add_if_exists "babel.config.js"
add_if_exists ".env"
add_if_exists "env.ts"

# 재귀 패턴(폴더 존재 시에만)
add_find_name "src/i18n" -name "*.ts"
add_wildcard_dir_name "src/services" "*club*.*"
add_wildcard_dir_name "src/utils" "*google*.*"
add_wildcard_dir_name "src/config" "*google*.*"
add_wildcard_dir_name "env" "*.ts"

if [[ "${#files[@]}" -eq 0 ]]; then
  echo "No target files found." >&2
  exit 1
fi

# -------- 민감정보 마스킹 --------
mask_if_sensitive() {
  local f="$1"
  case "$f" in
    *.env*|.env|env.ts|env/*.ts)
      sed -E 's/((KEY|SECRET|TOKEN|PASSWORD|API|PRIVATE)[A-Z0-9_]*[[:space:]]*[:=][[:space:]]*).*/\1<REDACTED>/Ig' "$f"
      ;;
    *)
      cat "$f"
      ;;
  esac
}

# -------- 매니페스트 작성 --------
{
  echo "# CreateClub Review Bundle"
  echo "Generated: ${TS}"
  echo
  echo "## Files (${OUT_DIR})"
  echo
  for f in "${files[@]}"; do
    sz=$(wc -c <"$f" | tr -d ' ')
    echo "- ${f} (${sz} bytes)"
  done
} > "${MANIFEST}"

# -------- 합본(MD) 생성 --------
lang_hint() {
  case "$1" in
    *.tsx) echo "tsx" ;;
    *.ts)  echo "ts" ;;
    *.js)  echo "js" ;;
    *.json) echo "json" ;;
    *.md) echo "md" ;;
    *.sh) echo "bash" ;;
    *) echo "" ;;
  esac
}

: > "${CONCAT_MD}"
for f in "${files[@]}"; do
  printf "\n---\n## %s\n\n" "$f" >> "${CONCAT_MD}"
  L=$(lang_hint "$f")
  printf '```%s\n' "$L" >> "${CONCAT_MD}"
  mask_if_sensitive "$f" >> "${CONCAT_MD}"
  printf '\n```\n' >> "${CONCAT_MD}"
done

# -------- 압축 (경로 보존) --------
TMP_LIST="${OUT_DIR}/.files.list"
: > "${TMP_LIST}"
for f in "${files[@]}"; do
  printf "%s\n" "$f" >> "${TMP_LIST}"
done
tar -czf "${ARCHIVE}" -T "${TMP_LIST}"

# -------- 결과 요약 --------
echo "[OK] Bundle created:"
echo " - Manifest:   ${MANIFEST}"
echo " - Concat MD:  ${CONCAT_MD}"
echo " - Archive:    ${ARCHIVE}"
echo
echo "Tip:"
echo "  • 콘캣 MD를 바로 공유하려면: cat \"${CONCAT_MD}\""
if command -v pbcopy >/dev/null 2>&1; then
  echo "  • 맥에서 클립보드로: cat \"${CONCAT_MD}\" | pbcopy"
fi
echo "  • 압축파일 공유: ${ARCHIVE}"
if [[ "${1:-}" == "--stdout" ]]; then
  cat "${CONCAT_MD}"
fi
