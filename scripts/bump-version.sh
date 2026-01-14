#!/bin/bash
# 🎾 Lightning Tennis - 버전 업데이트 자동화 스크립트
#
# 이 스크립트는 app.json, build.gradle, Info.plist 3곳의 버전을
# 동시에 업데이트하여 EAS Build fingerprint 불일치 문제를 방지합니다.
#
# 사용법:
#   ./scripts/bump-version.sh <version> <build_number>
#
# 예시:
#   ./scripts/bump-version.sh 2.0.8 17
#
# 작성일: 2025-12-19
# 작성자: Kim (킴)

VERSION=$1
BUILD_NUMBER=$2

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 루트로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo ""
echo -e "${BLUE}🎾 Lightning Tennis 버전 업데이트 스크립트${NC}"
echo "================================================"
echo ""

# 인자 검증
if [ -z "$VERSION" ] || [ -z "$BUILD_NUMBER" ]; then
    echo -e "${RED}❌ 오류: 버전과 빌드 번호를 모두 입력해주세요${NC}"
    echo ""
    echo "사용법: ./scripts/bump-version.sh <version> <build_number>"
    echo "예시:   ./scripts/bump-version.sh 2.0.8 17"
    echo ""
    exit 1
fi

# 버전 형식 검증 (X.X.X)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}❌ 오류: 버전 형식이 잘못되었습니다 (예: 2.0.8)${NC}"
    exit 1
fi

# 빌드 번호 검증 (숫자)
if ! [[ $BUILD_NUMBER =~ ^[0-9]+$ ]]; then
    echo -e "${RED}❌ 오류: 빌드 번호는 숫자여야 합니다 (예: 17)${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 버전 업데이트 시작: v$VERSION (build $BUILD_NUMBER)${NC}"
echo ""

# 1. app.json 업데이트
echo -e "${BLUE}[1/4] app.json 업데이트 중...${NC}"
node -e "
const fs = require('fs');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
appJson.expo.version = '$VERSION';
appJson.expo.ios.buildNumber = '$BUILD_NUMBER';
appJson.expo.android.versionCode = parseInt('$BUILD_NUMBER');
fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2) + '\n');
console.log('      ✅ app.json 업데이트 완료');
"

# 2. Android build.gradle 업데이트
echo -e "${BLUE}[2/4] android/app/build.gradle 업데이트 중...${NC}"
sed -i '' "s/versionCode [0-9]*/versionCode $BUILD_NUMBER/" android/app/build.gradle
sed -i '' "s/versionName \"[^\"]*\"/versionName \"$VERSION\"/" android/app/build.gradle
echo "      ✅ build.gradle 업데이트 완료"

# 3. iOS Info.plist 업데이트
echo -e "${BLUE}[3/4] ios/LightningTennis/Info.plist 업데이트 중...${NC}"
plutil -replace CFBundleShortVersionString -string "$VERSION" ios/LightningTennis/Info.plist
plutil -replace CFBundleVersion -string "$BUILD_NUMBER" ios/LightningTennis/Info.plist
echo "      ✅ Info.plist 업데이트 완료"

# 4. Firestore app_config/version 업데이트 (앱 업데이트 알림용)
echo -e "${BLUE}[4/4] Firestore app_config/version 업데이트 중...${NC}"
if [ -f "service-account-key.json" ]; then
    node scripts/update-app-version.js "$VERSION" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "      ✅ Firestore latest_version 업데이트 완료"
    else
        echo -e "      ${YELLOW}⚠️ Firestore 업데이트 실패 (수동으로 업데이트 필요)${NC}"
    fi
else
    echo -e "      ${YELLOW}⚠️ service-account-key.json 없음 - Firestore 업데이트 건너뜀${NC}"
    echo "         (앱 업데이트 알림이 필요하면 Firebase Console에서 수동 업데이트)"
fi

echo ""
echo "================================================"
echo -e "${GREEN}🔍 버전 검증${NC}"
echo "================================================"
echo ""

echo -e "${BLUE}📱 app.json:${NC}"
grep -E '"version"|"buildNumber"|"versionCode"' app.json | head -3

echo ""
echo -e "${BLUE}🤖 android/app/build.gradle:${NC}"
grep -E "versionCode|versionName" android/app/build.gradle | head -2

echo ""
echo -e "${BLUE}🍏 ios/LightningTennis/Info.plist:${NC}"
grep -A1 "CFBundleShortVersionString\|CFBundleVersion" ios/LightningTennis/Info.plist | head -4

echo ""
echo "================================================"
echo -e "${GREEN}✅ 모든 파일이 v$VERSION (build $BUILD_NUMBER)로 업데이트되었습니다!${NC}"
echo "================================================"
echo ""
echo -e "${YELLOW}📋 다음 단계:${NC}"
echo ""
echo "1. 변경사항 커밋:"
echo -e "   ${BLUE}git add -A && git commit -m 'chore: bump version to v$VERSION (build $BUILD_NUMBER)'${NC}"
echo ""
echo "2. EAS 빌드 시작:"
echo -e "   ${BLUE}eas build --platform all --profile production --auto-submit --non-interactive${NC}"
echo ""
