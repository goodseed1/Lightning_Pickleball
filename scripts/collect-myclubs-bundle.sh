#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

TS="$(date +"%Y%m%d_%H%M%S")"
OUT_DIR="bundle/myclubs_review_${TS}"
CONCAT_MD="${OUT_DIR}/myclubs_review.concat.md"
MANIFEST="${OUT_DIR}/BUNDLE_MANIFEST.txt"
ARCHIVE="${OUT_DIR}.tar.gz"
mkdir -p "${OUT_DIR}"

files=()
add_if() { [[ -f "$1" ]] && files+=("${1#./}"); }
add_find_name() { # dir + find predicates
  local dir="$1"; shift
  [[ -d "$dir" ]] || return 0
  while IFS= read -r -d '' p; do files+=("${p#./}"); done \
    < <(find "$dir" -type f \( "$@" \) -print0 2>/dev/null || true)
}
add_wildcard_ci() { # dir + case-insensitive glob
  local dir="$1" pat="$2"
  [[ -d "$dir" ]] || return 0
  while IFS= read -r -d '' p; do files+=("${p#./}"); done \
    < <(find "$dir" -type f -iname "$pat" -print0 2>/dev/null || true)
}

# --- 핵심 단일 파일 ---
add_if "src/screens/MyClubsScreen.tsx"
add_if "src/navigation/AppNavigator.tsx"
add_if "src/i18n/index.ts"
add_if "App.tsx"

# --- Language/Contexts (useLanguage/useAuth/Location 등) ---
add_wildcard_ci "src/contexts" "*LanguageContext*.ts*"
add_wildcard_ci "src/contexts" "*AuthContext*.ts*"
add_wildcard_ci "src/contexts" "*LocationContext*.ts*"

# --- MyClubs 하위 컴포넌트 후보들 ---
add_wildcard_ci "src/components/clubs" "*MyClubs*.ts*"
add_wildcard_ci "src/components/clubs" "*ClubCard*.ts*"
add_wildcard_ci "src/components/clubs" "*ClubList*.ts*"
add_wildcard_ci "src/components/clubs" "*ClubListItem*.ts*"
add_wildcard_ci "src/components/clubs" "*Empty*.ts*"
add_wildcard_ci "src/components/clubs" "*JoinRequest*.ts*"
add_wildcard_ci "src/components/clubs" "*JoinRequests*.ts*"

# --- 공통 헤더/칩/리스트 등 자주 참조되는 컴포넌트 ---
add_wildcard_ci "src/components/common" "*SectionHeader*.ts*"
add_wildcard_ci "src/components/common" "*HeaderRight*.ts*"
add_wildcard_ci "src/components/common" "*FilterChip*.ts*"
add_wildcard_ci "src/components/common" "*FilterChips*.ts*"
add_wildcard_ci "src/components/common" "*ListItem*.ts*"
add_wildcard_ci "src/components/common" "*SafeText*.ts*"   # 있으면 같이

# --- env/i18n 기타 ---
add_find_name "src/i18n" -name "*.ts"
add_if ".env"
while IFS= read -r p; do p="${p#./}"; [[ -f "$p" ]] && files+=("$p"); done \
  < <(find . -maxdepth 1 -type f -name ".env.*" 2>/dev/null || true)

# --- 중복 제거 ---
if [[ "${#files[@]}" -gt 0 ]]; then
  tmp="$(mktemp -t myclubs_dedup.XXXXXX)"
  printf "%s\n" "${files[@]}" | awk '!seen[$0]++' > "$tmp"
  files=(); while IFS= read -r line; do files+=("$line"); done < "$tmp"; rm -f "$tmp"
fi

if [[ "${#files[@]}" -eq 0 ]]; then
  echo "No target files found." >&2
  exit 1
fi

# --- 민감정보 마스킹 ---
mask_if_sensitive() {
  local f="$1"
  case "$f" in
    *.env*|.env|env.ts|env/*.ts)
      sed -E 's/((KEY|SECRET|TOKEN|PASSWORD|API|PRIVATE)[A-Z0-9_]*[[:space:]]*[:=][[:space:]]*).*/\1<REDACTED>/Ig' "$f"
      ;;
    *) cat "$f" ;;
  esac
}

# --- 매니페스트 ---
{
  echo "# MyClubs Review Bundle"
  echo "Generated: ${TS}"
  echo
  echo "## Files (${OUT_DIR})"
  echo
  for f in "${files[@]}"; do
    sz=$(wc -c <"$f" | tr -d ' ')
    echo "- ${f} (${sz} bytes)"
  done
} > "${MANIFEST}"

# --- 합본(MD) ---
lang_hint(){ case "$1" in *.tsx)echo tsx;;*.ts)echo ts;;*.js)echo js;;*.json)echo json;;*.md)echo md;;*.sh)echo bash;;*)echo;;esac; }
: > "${CONCAT_MD}"
{
  echo "# MyClubs Review Bundle"
  echo "Generated: $(date)"
  echo
  echo "This bundle contains MyClubs screen, related components, contexts, and i18n for debugging the RN <Text> error."
  echo
} >> "${CONCAT_MD}"
for f in "${files[@]}"; do
  printf "\n---\n## %s\n\n" "$f" >> "${CONCAT_MD}"
  L=$(lang_hint "$f"); printf '```%s\n' "$L" >> "${CONCAT_MD}"
  mask_if_sensitive "$f" >> "${CONCAT_MD}"
  printf '\n```\n' >> "${CONCAT_MD}"
done

# --- 압축 ---
TMP_LIST="${OUT_DIR}/.files.list"
printf "%s\n" "${files[@]}" > "${TMP_LIST}"
tar -czf "${ARCHIVE}" -T "${TMP_LIST}"

# --- 결과 ---
echo "[OK] Bundle created:"
echo " - Manifest:   ${MANIFEST}"
echo " - Concat MD:  ${CONCAT_MD}"
echo " - Archive:    ${ARCHIVE}"
echo
echo "Share options:"
echo "  • View concat:   cat \"${CONCAT_MD}\""
if command -v pbcopy >/dev/null 2>&1; then
  echo "  • Copy to clipboard: cat \"${CONCAT_MD}\" | pbcopy"
fi
echo "  • Upload archive: ${ARCHIVE}"
if [[ "${1:-}" == "--stdout" ]]; then
  cat "${CONCAT_MD}"
fi