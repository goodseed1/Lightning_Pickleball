#!/bin/bash

# 🏓 Lightning Pickleball - 세련된 아이콘 생성기
# 그라데이션, 그림자, 3D 효과 추가

ASSETS_DIR="/Volumes/DevSSD/development/Projects/lightning-pickleball/assets"

echo "🎨 세련된 피클볼 아이콘 생성 중..."
echo "====================================="

# ============================================================================
# 1. 메인 앱 아이콘 (1024x1024) - 세련된 버전
# ============================================================================
echo ""
echo "📱 메인 앱 아이콘 생성..."

# 먼저 그라데이션 배경 생성
magick -size 1024x1024 \
    -define gradient:angle=135 \
    gradient:'#4CAF50-#1B5E20' \
    -draw "roundrectangle 0,0 1024,1024 200,200" \
    /tmp/bg.png

# 피클볼 (노란 공 + 구멍들)
magick -size 1024x1024 xc:none \
    \( -size 500x500 xc:none \
       -fill '#FFD54F' -draw "circle 250,250 250,30" \
       -fill '#FFC107' -draw "circle 240,240 240,50" \
       \
       -fill '#2E7D32' \
       -draw "circle 180,180 180,195" \
       -draw "circle 260,170 260,185" \
       -draw "circle 330,190 330,205" \
       -draw "circle 150,250 150,265" \
       -draw "circle 230,250 230,265" \
       -draw "circle 310,240 310,255" \
       -draw "circle 370,260 370,275" \
       -draw "circle 190,330 190,345" \
       -draw "circle 270,320 270,335" \
       -draw "circle 340,340 340,355" \
       -draw "circle 130,320 130,335" \
       -draw "circle 400,310 400,325" \
    \) -geometry +262+170 -composite \
    /tmp/ball.png

# 번개 모양
magick -size 1024x1024 xc:none \
    -fill '#FFD700' -stroke '#FFA000' -strokewidth 6 \
    -draw "polygon 540,600 470,750 530,750 460,920 600,710 530,710 600,600" \
    \
    -blur 0x3 \
    /tmp/lightning.png

# 패들 실루엣 (선택적)
magick -size 1024x1024 xc:none \
    -fill 'rgba(255,255,255,0.3)' -stroke 'rgba(255,255,255,0.5)' -strokewidth 8 \
    -draw "ellipse 200,750 100,150 -30,330" \
    -draw "roundrectangle 150,850 250,950 15,15" \
    /tmp/paddle.png

# 모든 레이어 합성
magick /tmp/bg.png \
    /tmp/ball.png -composite \
    /tmp/lightning.png -composite \
    -alpha set -channel A -evaluate multiply 1 +channel \
    \( +clone -background black -shadow 60x10+0+10 \) \
    +swap -background none -layers merge +repage \
    -gravity center -extent 1024x1024 \
    "$ASSETS_DIR/icon.png"

echo "✅ icon.png 생성 완료"

# ============================================================================
# 2. Android 적응형 아이콘 (중앙 집중)
# ============================================================================
echo ""
echo "🤖 Android 적응형 아이콘..."

magick -size 1024x1024 xc:'#4CAF50' \
    \
    \( -size 420x420 xc:none \
       -fill '#FFD54F' -draw "circle 210,210 210,20" \
       -fill '#FFC107' -draw "circle 200,200 200,35" \
       \
       -fill '#2E7D32' \
       -draw "circle 150,150 150,162" \
       -draw "circle 210,140 210,152" \
       -draw "circle 270,155 270,167" \
       -draw "circle 130,205 130,217" \
       -draw "circle 190,210 190,222" \
       -draw "circle 250,200 250,212" \
       -draw "circle 300,215 300,227" \
       -draw "circle 160,270 160,282" \
       -draw "circle 220,265 220,277" \
       -draw "circle 280,275 280,287" \
    \) -geometry +302+180 -composite \
    \
    -fill '#FFD700' -stroke '#FFA000' -strokewidth 5 \
    -draw "polygon 530,580 475,700 520,700 465,840 575,665 525,665 575,580" \
    \
    "$ASSETS_DIR/adaptive-icon.png"

echo "✅ adaptive-icon.png 생성 완료"

# ============================================================================
# 3. 스플래시 아이콘 (투명 배경)
# ============================================================================
echo ""
echo "💫 스플래시 아이콘..."

magick -size 1024x1024 xc:none \
    \
    \( -size 550x550 xc:none \
       -fill '#FFD54F' -draw "circle 275,275 275,25" \
       -fill '#FFC107' -draw "circle 265,265 265,45" \
       \
       -fill '#1B5E20' \
       -draw "circle 190,190 190,207" \
       -draw "circle 275,175 275,192" \
       -draw "circle 350,200 350,217" \
       -draw "circle 155,275 155,292" \
       -draw "circle 240,275 240,292" \
       -draw "circle 320,265 320,282" \
       -draw "circle 390,285 390,302" \
       -draw "circle 195,360 195,377" \
       -draw "circle 280,355 280,372" \
       -draw "circle 355,370 355,387" \
       -draw "circle 125,345 125,362" \
       -draw "circle 410,340 410,357" \
    \) -geometry +237+130 -composite \
    \
    -fill '#FFD700' -stroke '#2E7D32' -strokewidth 8 \
    -draw "polygon 540,600 465,770 525,770 450,960 600,720 535,720 600,600" \
    \
    "$ASSETS_DIR/splash-icon.png"

echo "✅ splash-icon.png 생성 완료"

# ============================================================================
# 4. 알림 아이콘 (96x96) - 심플
# ============================================================================
echo ""
echo "🔔 알림 아이콘..."

magick -size 96x96 xc:none \
    -fill '#FFC107' \
    -draw "circle 48,35 48,10" \
    \
    -fill '#2E7D32' \
    -draw "circle 38,28 38,32" \
    -draw "circle 52,26 52,30" \
    -draw "circle 44,40 44,44" \
    -draw "circle 58,35 58,39" \
    \
    -fill '#FFD700' -stroke '#FFA000' -strokewidth 2 \
    -draw "polygon 50,52 42,68 48,68 40,90 56,65 49,65 56,52" \
    \
    "$ASSETS_DIR/notification-icon.png"

echo "✅ notification-icon.png 생성 완료"

# ============================================================================
# 5. 파비콘 (48x48)
# ============================================================================
echo ""
echo "🌐 파비콘..."

magick "$ASSETS_DIR/icon.png" -resize 48x48 \
    -unsharp 0x1 \
    "$ASSETS_DIR/favicon.png"

echo "✅ favicon.png 생성 완료"

# 임시 파일 정리
rm -f /tmp/bg.png /tmp/ball.png /tmp/lightning.png /tmp/paddle.png

# ============================================================================
# 결과 확인
# ============================================================================
echo ""
echo "====================================="
echo "🎉 세련된 아이콘 생성 완료!"
echo ""
echo "📁 생성된 파일:"
for f in icon adaptive-icon splash-icon notification-icon favicon; do
    if [ -f "$ASSETS_DIR/$f.png" ]; then
        size=$(identify -format "%wx%h" "$ASSETS_DIR/$f.png" 2>/dev/null)
        bytes=$(stat -f%z "$ASSETS_DIR/$f.png" 2>/dev/null)
        echo "   ✅ $f.png ($size, $bytes bytes)"
    fi
done
echo ""
echo "🖼️  미리보기: open $ASSETS_DIR"
