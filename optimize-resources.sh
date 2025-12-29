#!/bin/bash

# 리소스 최적화 스크립트
# 실행 전 ffmpeg 설치 필요: brew install ffmpeg

set -e  # 에러 발생 시 중단

echo "🔧 Focus 게임 리소스 최적화 시작..."
echo ""

# ffmpeg 설치 확인
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg가 설치되어 있지 않습니다."
    echo "📦 설치 명령어: brew install ffmpeg"
    echo ""
    read -p "지금 설치하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 ffmpeg 설치 중..."
        brew install ffmpeg
    else
        echo "⚠️  ffmpeg 설치 후 다시 실행해주세요."
        exit 1
    fi
fi

echo "✅ ffmpeg 설치 확인됨"
echo ""

# 백업 디렉토리 생성
BACKUP_DIR="public/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR/sounds"
mkdir -p "$BACKUP_DIR/sounds/music"

echo "📁 원본 파일 백업 중..."

# ==============================================
# 1. WAV → MP3 변환 (고음질 192kbps)
# ==============================================
echo ""
echo "🎵 1단계: WAV 파일을 MP3로 변환 (192kbps)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

WAV_FILES=(
    "1-5_hardmode.wav"
    "1-10_gameover(success).wav"
    "1-11_levelup.wav"
)

for file in "${WAV_FILES[@]}"; do
    if [ -f "public/sounds/$file" ]; then
        echo "  🔄 처리 중: $file"

        # 백업
        cp "public/sounds/$file" "$BACKUP_DIR/sounds/"

        # 파일명에서 .wav 제거하고 .mp3 추가
        output_file="${file%.wav}.mp3"

        # 변환 (192kbps, 스테레오)
        ffmpeg -i "public/sounds/$file" \
               -b:a 192k \
               -ar 44100 \
               -ac 2 \
               -y \
               "public/sounds/$output_file" 2>&1 | grep -E "Duration|bitrate|Stream" || true

        # 원본 WAV 파일 삭제 (선택사항)
        # rm "public/sounds/$file"

        # 크기 비교
        original_size=$(du -h "public/sounds/$file" | cut -f1)
        new_size=$(du -h "public/sounds/$output_file" | cut -f1)
        echo "  ✅ 완료: $original_size → $new_size"
        echo ""
    fi
done

# ==============================================
# 2. 배경음악 압축 (128kbps)
# ==============================================
echo ""
echo "🎼 2단계: 배경음악 압축 (128kbps)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MUSIC_FILES=(
    "1.main.mp3"
    "2.normal-random(1).mp3"
    "3.normal-random(2).mp3"
    "4.normal-random(3).mp3"
    "5.normal-random(4).mp3"
    "6.hard.mp3"
)

for file in "${MUSIC_FILES[@]}"; do
    if [ -f "public/sounds/music/$file" ]; then
        echo "  🔄 처리 중: $file"

        # 백업
        cp "public/sounds/music/$file" "$BACKUP_DIR/sounds/music/"

        # 임시 파일명
        temp_file="public/sounds/music/${file%.mp3}_compressed.mp3"

        # 압축 (128kbps, 모노 또는 스테레오 유지)
        ffmpeg -i "public/sounds/music/$file" \
               -b:a 128k \
               -ar 44100 \
               -y \
               "$temp_file" 2>&1 | grep -E "Duration|bitrate|Stream" || true

        # 원본과 교체
        mv "$temp_file" "public/sounds/music/$file"

        # 크기 비교
        original_size=$(du -h "$BACKUP_DIR/sounds/music/$file" | cut -f1)
        new_size=$(du -h "public/sounds/music/$file" | cut -f1)
        echo "  ✅ 완료: $original_size → $new_size"
        echo ""
    fi
done

# ==============================================
# 3. audioManager.js 업데이트 (WAV → MP3 경로 변경)
# ==============================================
echo ""
echo "🔧 3단계: 오디오 파일 경로 업데이트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# audioManager.js에서 .wav를 .mp3로 변경
if [ -f "src/utils/audioManager.js" ]; then
    echo "  🔄 audioManager.js 업데이트 중..."

    # 백업
    cp "src/utils/audioManager.js" "$BACKUP_DIR/"

    # WAV → MP3 경로 변경
    sed -i '' 's/1-5_hardmode\.wav/1-5_hardmode.mp3/g' src/utils/audioManager.js
    sed -i '' 's/1-10_gameover(success)\.wav/1-10_gameover(success).mp3/g' src/utils/audioManager.js
    sed -i '' 's/1-11_levelup\.wav/1-11_levelup.mp3/g' src/utils/audioManager.js

    echo "  ✅ 완료"
fi

# ==============================================
# 완료 보고
# ==============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 최적화 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 전후 비교
echo "📊 크기 비교:"
echo ""
echo "  백업 디렉토리:"
du -sh "$BACKUP_DIR" | awk '{print "    "$1}'
echo ""
echo "  최적화 후 sounds 디렉토리:"
du -sh public/sounds | awk '{print "    "$1}'
echo ""

# 총 절약 용량 계산
backup_size=$(du -sk "$BACKUP_DIR" | cut -f1)
current_size=$(du -sk public/sounds | cut -f1)
saved=$((backup_size - current_size))
saved_mb=$((saved / 1024))

echo "  💾 절약된 용량: ~${saved_mb}MB"
echo ""

echo "📝 다음 단계:"
echo "  1. npm run build 실행"
echo "  2. 테스트 (효과음이 정상 재생되는지 확인)"
echo "  3. 문제 없으면: rm -rf $BACKUP_DIR (백업 삭제)"
echo "  4. 문제 있으면: cp -r $BACKUP_DIR/* public/ (복원)"
echo ""
