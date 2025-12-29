#!/bin/bash

# GIF 최적화 스크립트
# 실행 전 ffmpeg 설치 필요: brew install ffmpeg

set -e

echo "🎬 GIF 파일 최적화 시작..."
echo ""

# ffmpeg 설치 확인
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg가 설치되어 있지 않습니다."
    echo "📦 설치 명령어: brew install ffmpeg"
    exit 1
fi

echo "✅ ffmpeg 설치 확인됨"
echo ""

# 백업 디렉토리 생성
BACKUP_DIR="public/backup_gif_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR/new"

echo "📁 원본 GIF 파일 백업 중..."
cp -r public/gif/new/* "$BACKUP_DIR/new/"
echo ""

# ==============================================
# 옵션 선택
# ==============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "최적화 방법을 선택하세요:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1) GIF 최적화 (권장) - 크기 30~50% 감소, 코드 수정 불필요"
echo "  2) WebM 변환 (고급) - 크기 80% 감소, 코드 수정 필요"
echo ""
read -p "선택 (1 또는 2): " choice
echo ""

case $choice in
    1)
        echo "📊 옵션 1: GIF 최적화 선택"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""

        for gif in public/gif/new/*.gif; do
            if [ -f "$gif" ]; then
                filename=$(basename "$gif")
                echo "  🔄 처리 중: $filename"

                # GIF 최적화 (품질 유지하면서 크기 감소)
                # - 팔레트 최적화
                # - 프레임 최적화
                # - 메타데이터 제거
                ffmpeg -i "$gif" \
                       -vf "split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" \
                       -loop 0 \
                       -y \
                       "${gif%.gif}_optimized.gif" 2>&1 | grep -E "Duration|Stream" || true

                # 원본과 교체
                mv "${gif%.gif}_optimized.gif" "$gif"

                # 크기 비교
                original_size=$(du -h "$BACKUP_DIR/new/$filename" | cut -f1)
                new_size=$(du -h "$gif" | cut -f1)
                echo "  ✅ 완료: $original_size → $new_size"
                echo ""
            fi
        done
        ;;

    2)
        echo "🎥 옵션 2: WebM 변환 선택"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "⚠️  주의: 코드에서 GIF를 <video> 태그로 변경해야 합니다!"
        echo ""

        for gif in public/gif/new/*.gif; do
            if [ -f "$gif" ]; then
                filename=$(basename "$gif" .gif)
                echo "  🔄 처리 중: $filename.gif → $filename.webm"

                # WebM 변환 (VP9 코덱, 최적 품질)
                ffmpeg -i "$gif" \
                       -c:v libvpx-vp9 \
                       -crf 30 \
                       -b:v 500k \
                       -auto-alt-ref 0 \
                       -cpu-used 2 \
                       -row-mt 1 \
                       -threads 4 \
                       -y \
                       "public/gif/new/${filename}.webm" 2>&1 | grep -E "Duration|Stream|bitrate" || true

                # 크기 비교
                original_size=$(du -h "$gif" | cut -f1)
                new_size=$(du -h "public/gif/new/${filename}.webm" | cut -f1)
                echo "  ✅ 완료: $original_size → $new_size"
                echo ""
            fi
        done

        echo ""
        echo "📝 다음 단계 (코드 수정 필요):"
        echo ""
        echo "  GameEngineHard.js에서 다음과 같이 수정:"
        echo ""
        echo "  Before:"
        echo "    background-image: url('/gif/new/hard.gif');"
        echo ""
        echo "  After:"
        echo "    <video autoplay loop muted playsinline"
        echo "           style='position:absolute; width:100%; height:100%; object-fit:cover;'>"
        echo "      <source src='/gif/new/hard.webm' type='video/webm'>"
        echo "    </video>"
        echo ""
        ;;

    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac

# ==============================================
# 완료 보고
# ==============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 GIF 최적화 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 전후 비교
echo "📊 크기 비교:"
echo ""
echo "  백업:"
du -sh "$BACKUP_DIR" | awk '{print "    "$1}'
echo ""
echo "  최적화 후:"
du -sh public/gif/new/ | awk '{print "    "$1}'
echo ""

# 총 절약 용량
backup_size=$(du -sk "$BACKUP_DIR" | cut -f1)
current_size=$(du -sk public/gif/new/ | cut -f1)
saved=$((backup_size - current_size))
saved_mb=$((saved / 1024))

echo "  💾 절약된 용량: ~${saved_mb}MB"
echo ""

if [ $choice -eq 1 ]; then
    echo "📝 다음 단계:"
    echo "  1. npm run build 실행"
    echo "  2. 테스트 (GIF가 정상 표시되는지 확인)"
    echo "  3. 문제 없으면: rm -rf $BACKUP_DIR (백업 삭제)"
else
    echo "⚠️  코드 수정 후 테스트하세요!"
fi

echo ""
