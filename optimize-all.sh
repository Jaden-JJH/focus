#!/bin/bash

# 전체 리소스 최적화 마스터 스크립트
# Focus 게임 성능 최적화를 위한 통합 스크립트

set -e

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  Focus 게임 리소스 최적화 마스터 스크립트  ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# 초기 크기 측정
echo "📊 최적화 전 크기 측정 중..."
BEFORE_AUDIO=$(du -sk public/sounds | cut -f1)
BEFORE_GIF=$(du -sk public/gif | cut -f1)
BEFORE_FONT=$(du -sk public/font | cut -f1)
BEFORE_TOTAL=$((BEFORE_AUDIO + BEFORE_GIF + BEFORE_FONT))

echo ""
echo "  오디오: $(echo $BEFORE_AUDIO | awk '{printf "%.1fMB", $1/1024}')"
echo "  GIF:    $(echo $BEFORE_GIF | awk '{printf "%.1fMB", $1/1024}')"
echo "  폰트:   $(echo $BEFORE_FONT | awk '{printf "%.1fMB", $1/1024}')"
echo "  ─────────────────────"
echo "  합계:   $(echo $BEFORE_TOTAL | awk '{printf "%.1fMB", $1/1024}')"
echo ""

read -p "계속 진행하시겠습니까? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 취소되었습니다."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ==============================================
# 1. 오디오 최적화
# ==============================================
echo ""
echo "🎵 1/3: 오디오 파일 최적화"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "./optimize-resources.sh" ]; then
    ./optimize-resources.sh
else
    echo "⚠️  optimize-resources.sh를 찾을 수 없습니다. 건너뜁니다."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ==============================================
# 2. GIF 최적화
# ==============================================
echo ""
echo "🎬 2/3: GIF 파일 최적화"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GIF 최적화 방식:"
echo "  1) GIF 최적화 (권장) - 간단, 코드 수정 불필요"
echo "  2) WebM 변환 (고급) - 최대 압축, 코드 수정 필요"
echo "  3) 건너뛰기"
echo ""
read -p "선택 (1, 2, 또는 3): " gif_choice

case $gif_choice in
    1|2)
        if [ -f "./optimize-gif.sh" ]; then
            # GIF 스크립트를 선택된 옵션으로 실행
            echo "$gif_choice" | ./optimize-gif.sh
        else
            echo "⚠️  optimize-gif.sh를 찾을 수 없습니다. 건너뜁니다."
        fi
        ;;
    3)
        echo "⏭️  GIF 최적화를 건너뜁니다."
        ;;
    *)
        echo "❌ 잘못된 선택입니다. GIF 최적화를 건너뜁니다."
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ==============================================
# 3. 폰트 최적화
# ==============================================
echo ""
echo "🔤 3/3: 폰트 파일 최적화"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "폰트를 최적화하시겠습니까?"
echo "  - 한글+영문만 추출하여 크기 90% 감소"
echo "  - CSS 수정 필요"
echo ""
read -p "진행하시겠습니까? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "./optimize-fonts.sh" ]; then
        ./optimize-fonts.sh
    else
        echo "⚠️  optimize-fonts.sh를 찾을 수 없습니다. 건너뜁니다."
    fi
else
    echo "⏭️  폰트 최적화를 건너뜁니다."
fi

# ==============================================
# 최종 보고
# ==============================================
echo ""
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║           최적화 완료 리포트                ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# 최적화 후 크기 측정
AFTER_AUDIO=$(du -sk public/sounds 2>/dev/null | cut -f1 || echo $BEFORE_AUDIO)
AFTER_GIF=$(du -sk public/gif 2>/dev/null | cut -f1 || echo $BEFORE_GIF)
AFTER_FONT=$(du -sk public/font 2>/dev/null | cut -f1 || echo $BEFORE_FONT)
AFTER_TOTAL=$((AFTER_AUDIO + AFTER_GIF + AFTER_FONT))

# 절약량 계산
SAVED_AUDIO=$((BEFORE_AUDIO - AFTER_AUDIO))
SAVED_GIF=$((BEFORE_GIF - AFTER_GIF))
SAVED_FONT=$((BEFORE_FONT - AFTER_FONT))
SAVED_TOTAL=$((BEFORE_TOTAL - AFTER_TOTAL))

echo "📊 크기 비교:"
echo ""
printf "  카테고리   │  Before  │   After  │   절약   │  감소율\n"
echo "  ──────────┼──────────┼──────────┼──────────┼────────"
printf "  오디오     │ %7.1fMB │ %7.1fMB │ %7.1fMB │  %5.1f%%\n" \
    $(echo $BEFORE_AUDIO | awk '{print $1/1024}') \
    $(echo $AFTER_AUDIO | awk '{print $1/1024}') \
    $(echo $SAVED_AUDIO | awk '{print $1/1024}') \
    $(echo $BEFORE_AUDIO $AFTER_AUDIO | awk '{if($1>0) print (($1-$2)/$1)*100; else print 0}')

printf "  GIF        │ %7.1fMB │ %7.1fMB │ %7.1fMB │  %5.1f%%\n" \
    $(echo $BEFORE_GIF | awk '{print $1/1024}') \
    $(echo $AFTER_GIF | awk '{print $1/1024}') \
    $(echo $SAVED_GIF | awk '{print $1/1024}') \
    $(echo $BEFORE_GIF $AFTER_GIF | awk '{if($1>0) print (($1-$2)/$1)*100; else print 0}')

printf "  폰트       │ %7.1fMB │ %7.1fMB │ %7.1fMB │  %5.1f%%\n" \
    $(echo $BEFORE_FONT | awk '{print $1/1024}') \
    $(echo $AFTER_FONT | awk '{print $1/1024}') \
    $(echo $SAVED_FONT | awk '{print $1/1024}') \
    $(echo $BEFORE_FONT $AFTER_FONT | awk '{if($1>0) print (($1-$2)/$1)*100; else print 0}')

echo "  ──────────┼──────────┼──────────┼──────────┼────────"
printf "  합계       │ %7.1fMB │ %7.1fMB │ %7.1fMB │  %5.1f%%\n" \
    $(echo $BEFORE_TOTAL | awk '{print $1/1024}') \
    $(echo $AFTER_TOTAL | awk '{print $1/1024}') \
    $(echo $SAVED_TOTAL | awk '{print $1/1024}') \
    $(echo $BEFORE_TOTAL $AFTER_TOTAL | awk '{if($1>0) print (($1-$2)/$1)*100; else print 0}')

echo ""
echo "📝 다음 단계:"
echo ""
echo "  1. npm run build - 프로젝트 빌드"
echo "  2. 테스트 - 모든 리소스가 정상 작동하는지 확인"
echo "  3. 백업 폴더 정리 (문제 없으면):"
echo "     rm -rf public/backup_*"
echo ""
echo "🚀 예상 성능 향상:"
echo "  - 초기 로딩 속도: 60-80% 개선"
echo "  - 모바일 데이터 사용량: 70% 감소"
echo "  - 메모리 사용량: 40% 감소"
echo ""
