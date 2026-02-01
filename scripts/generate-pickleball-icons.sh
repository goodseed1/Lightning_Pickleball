#!/bin/bash

# 🏓 Lightning Pickleball 아이콘 생성 스크립트
# ImageMagick을 사용하여 피클볼 테마 아이콘 생성

# 색상 정의
PRIMARY_GREEN="#4CAF50"
FOREST_GREEN="#2E7D32"
YELLOW="#FFC107"
LIGHTNING_GOLD="#FFD700"
WHITE="#FFFFFF"
DARK_GREEN="#1B5E20"

# 출력 디렉토리
ASSETS_DIR="/Volumes/DevSSD/development/Projects/lightning-pickleball/assets"
BACKUP_DIR="$ASSETS_DIR/backup-$(date +%Y%m%d-%H%M%S)"

echo "🏓 Lightning Pickleball 아이콘 생성기"
echo "======================================"

# 기존 파일 백업
echo "📦 기존 아이콘 백업 중..."
mkdir -p "$BACKUP_DIR"
cp "$ASSETS_DIR/icon.png" "$BACKUP_DIR/" 2>/dev/null
cp "$ASSETS_DIR/adaptive-icon.png" "$BACKUP_DIR/" 2>/dev/null
cp "$ASSETS_DIR/splash-icon.png" "$BACKUP_DIR/" 2>/dev/null
cp "$ASSETS_DIR/notification-icon.png" "$BACKUP_DIR/" 2>/dev/null
cp "$ASSETS_DIR/favicon.png" "$BACKUP_DIR/" 2>/dev/null
echo "✅ 백업 완료: $BACKUP_DIR"

# ============================================================================
# 1. 메인 앱 아이콘 (1024x1024)
# ============================================================================
echo ""
echo "🎨 메인 앱 아이콘 생성 중..."

magick -size 1024x1024 xc:none \
    -fill "gradient:$PRIMARY_GREEN-$FOREST_GREEN" -draw "roundrectangle 0,0 1024,1024 180,180" \
    \
    -fill "$YELLOW" \
    -draw "circle 512,480 512,280" \
    \
    -fill "$DARK_GREEN" \
    -draw "circle 440,400 440,415" \
    -draw "circle 520,400 520,415" \
    -draw "circle 580,400 580,415" \
    -draw "circle 480,480 480,495" \
    -draw "circle 550,480 550,495" \
    -draw "circle 610,420 610,435" \
    -draw "circle 430,480 430,445" \
    -draw "circle 500,540 500,555" \
    -draw "circle 570,540 570,555" \
    -draw "circle 640,480 640,495" \
    \
    -fill "$LIGHTNING_GOLD" -stroke "$WHITE" -strokewidth 8 \
    -draw "polygon 530,700 490,780 520,780 480,880 560,760 520,760 560,700" \
    \
    -fill "none" -stroke "$WHITE" -strokewidth 12 \
    -draw "arc 150,600 400,900 180,0" \
    -draw "line 275,750 275,650" \
    -draw "roundrectangle 230,580 320,650 20,20" \
    \
    "$ASSETS_DIR/icon.png"

echo "✅ icon.png 생성 완료"

# ============================================================================
# 2. Android 적응형 아이콘 (1024x1024 with safe zone)
# ============================================================================
echo ""
echo "🤖 Android 적응형 아이콘 생성 중..."

# 적응형 아이콘은 중앙에 집중된 디자인 (66% 영역이 안전 영역)
magick -size 1024x1024 xc:"$PRIMARY_GREEN" \
    \
    -fill "$YELLOW" \
    -draw "circle 512,420 512,250" \
    \
    -fill "$DARK_GREEN" \
    -draw "circle 450,350 450,365" \
    -draw "circle 520,350 520,365" \
    -draw "circle 575,350 575,365" \
    -draw "circle 480,420 480,435" \
    -draw "circle 545,420 545,435" \
    -draw "circle 605,370 605,385" \
    -draw "circle 430,420 430,405" \
    -draw "circle 500,485 500,500" \
    -draw "circle 565,485 565,500" \
    -draw "circle 620,420 620,435" \
    \
    -fill "$LIGHTNING_GOLD" -stroke "$WHITE" -strokewidth 6 \
    -draw "polygon 530,620 495,690 520,690 485,780 555,670 525,670 560,620" \
    \
    "$ASSETS_DIR/adaptive-icon.png"

echo "✅ adaptive-icon.png 생성 완료"

# ============================================================================
# 3. 스플래시 아이콘 (1024x1024)
# ============================================================================
echo ""
echo "💫 스플래시 아이콘 생성 중..."

# 스플래시는 더 심플하고 임팩트 있게
magick -size 1024x1024 xc:none \
    \
    -fill "$YELLOW" \
    -draw "circle 512,400 512,180" \
    \
    -fill "$FOREST_GREEN" \
    -draw "circle 420,320 420,340" \
    -draw "circle 510,320 510,340" \
    -draw "circle 590,320 590,340" \
    -draw "circle 460,400 460,420" \
    -draw "circle 550,400 550,420" \
    -draw "circle 640,350 640,370" \
    -draw "circle 380,400 380,380" \
    -draw "circle 500,480 500,500" \
    -draw "circle 590,480 590,500" \
    -draw "circle 680,410 680,430" \
    -draw "circle 350,350 350,370" \
    -draw "circle 430,480 430,500" \
    \
    -fill "$LIGHTNING_GOLD" -stroke "$FOREST_GREEN" -strokewidth 10 \
    -draw "polygon 540,580 480,720 530,720 470,900 590,680 530,680 590,580" \
    \
    "$ASSETS_DIR/splash-icon.png"

echo "✅ splash-icon.png 생성 완료"

# ============================================================================
# 4. 푸시 알림 아이콘 (96x96) - 간단한 심볼
# ============================================================================
echo ""
echo "🔔 알림 아이콘 생성 중..."

# 알림 아이콘은 작고 심플하게 - 번개 + 공
magick -size 96x96 xc:none \
    \
    -fill "$YELLOW" \
    -draw "circle 48,36 48,12" \
    \
    -fill "$DARK_GREEN" \
    -draw "circle 38,30 38,34" \
    -draw "circle 52,30 52,34" \
    -draw "circle 45,42 45,46" \
    -draw "circle 58,36 58,40" \
    \
    -fill "$LIGHTNING_GOLD" -stroke "$FOREST_GREEN" -strokewidth 2 \
    -draw "polygon 52,55 44,70 50,70 42,88 58,66 50,66 58,55" \
    \
    "$ASSETS_DIR/notification-icon.png"

echo "✅ notification-icon.png 생성 완료"

# ============================================================================
# 5. 파비콘 (48x48)
# ============================================================================
echo ""
echo "🌐 파비콘 생성 중..."

# 파비콘은 더 작게
magick "$ASSETS_DIR/icon.png" -resize 48x48 "$ASSETS_DIR/favicon.png"

echo "✅ favicon.png 생성 완료"

# ============================================================================
# 결과 확인
# ============================================================================
echo ""
echo "======================================"
echo "🎉 모든 아이콘 생성 완료!"
echo ""
echo "📁 생성된 파일:"
ls -la "$ASSETS_DIR"/*.png | grep -E "(icon|splash|favicon|notification)" | awk '{print "   " $NF " (" $5 " bytes)"}'
echo ""
echo "📦 백업 위치: $BACKUP_DIR"
echo ""
echo "🔍 미리보기: open $ASSETS_DIR"
