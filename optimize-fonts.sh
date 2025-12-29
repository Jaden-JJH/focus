#!/bin/bash

# 폰트 최적화 스크립트
# 한글 + 영문 + 숫자만 추출하여 크기 대폭 감소

set -e

echo "🔤 폰트 파일 최적화 시작..."
echo ""

# pyftsubset 설치 확인
if ! command -v pyftsubset &> /dev/null; then
    echo "❌ pyftsubset이 설치되어 있지 않습니다."
    echo "📦 설치 명령어:"
    echo "   pip3 install fonttools brotli"
    echo ""
    read -p "지금 설치하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 fonttools 설치 중..."
        pip3 install fonttools brotli
    else
        echo "⚠️  fonttools 설치 후 다시 실행해주세요."
        exit 1
    fi
fi

echo "✅ pyftsubset 설치 확인됨"
echo ""

# 백업 디렉토리 생성
BACKUP_DIR="public/backup_fonts_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 원본 폰트 파일 백업 중..."
cp -r public/font "$BACKUP_DIR/"
echo ""

# 새로운 최적화 폰트 디렉토리
OPTIMIZED_DIR="public/font/optimized"
mkdir -p "$OPTIMIZED_DIR"

# ==============================================
# 폰트 서브셋 생성
# ==============================================
echo ""
echo "🔤 폰트 서브셋 생성 중..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  추출할 글자: 한글 완성형 11,172자 + 영문 + 숫자 + 특수문자"
echo ""

# Unicode 범위:
# - U+0020-007F: 기본 라틴 (영문, 숫자, 기호)
# - U+AC00-D7A3: 한글 완성형 (가-힣)
# - U+1100-11FF: 한글 자모
# - U+3131-318E: 한글 호환 자모
UNICODE_RANGE="U+0020-007F,U+AC00-D7A3,U+1100-11FF,U+3131-318E"

# Pretendard Variable 폰트 최적화 (가장 많이 사용)
if [ -f "public/font/variable/PretendardVariable.ttf" ]; then
    echo "  🔄 처리 중: PretendardVariable.ttf"

    pyftsubset "public/font/variable/PretendardVariable.ttf" \
        --output-file="$OPTIMIZED_DIR/PretendardVariable.woff2" \
        --flavor=woff2 \
        --layout-features='*' \
        --unicodes="$UNICODE_RANGE" \
        --no-hinting \
        --desubroutinize

    original_size=$(du -h "public/font/variable/PretendardVariable.ttf" | cut -f1)
    new_size=$(du -h "$OPTIMIZED_DIR/PretendardVariable.woff2" | cut -f1)
    echo "  ✅ 완료: $original_size → $new_size"
    echo ""
fi

# 전기안전체 폰트 최적화 (게임에서 사용)
ELECTRICAL_FONTS=(
    "전기안전체_otf/Electrical Safety Bold.otf"
    "전기안전체_otf/Electrical Safety Regular.otf"
)

for font in "${ELECTRICAL_FONTS[@]}"; do
    if [ -f "public/font/$font" ]; then
        filename=$(basename "$font" .otf)
        echo "  🔄 처리 중: $filename"

        pyftsubset "public/font/$font" \
            --output-file="$OPTIMIZED_DIR/${filename}.woff2" \
            --flavor=woff2 \
            --layout-features='*' \
            --unicodes="$UNICODE_RANGE" \
            --no-hinting \
            --desubroutinize

        original_size=$(du -h "public/font/$font" | cut -f1)
        new_size=$(du -h "$OPTIMIZED_DIR/${filename}.woff2" | cut -f1)
        echo "  ✅ 완료: $original_size → $new_size"
        echo ""
    fi
done

# ==============================================
# CSS 파일 생성
# ==============================================
echo ""
echo "📝 최적화된 폰트용 CSS 생성 중..."
cat > "$OPTIMIZED_DIR/fonts.css" << 'EOF'
/* 최적화된 폰트 CSS */

/* Pretendard Variable */
@font-face {
    font-family: 'Pretendard';
    font-weight: 100 900;
    font-style: normal;
    font-display: swap;
    src: url('/font/optimized/PretendardVariable.woff2') format('woff2');
}

/* Electrical Safety Bold */
@font-face {
    font-family: 'Electrical Safety';
    src: url('/font/optimized/Electrical Safety Bold.woff2') format('woff2');
    font-weight: bold;
    font-style: normal;
    font-display: swap;
}

/* Electrical Safety Regular */
@font-face {
    font-family: 'Electrical Safety';
    src: url('/font/optimized/Electrical Safety Regular.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}
EOF

echo "  ✅ fonts.css 생성 완료"
echo ""

# ==============================================
# 완료 보고
# ==============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 폰트 최적화 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 전후 비교
echo "📊 크기 비교:"
echo ""
echo "  원본 폰트 디렉토리:"
du -sh public/font | awk '{print "    "$1}'
echo ""
echo "  최적화된 폰트:"
du -sh "$OPTIMIZED_DIR" | awk '{print "    "$1}'
echo ""

# 총 절약 용량
original_size=$(du -sk public/font | cut -f1)
optimized_size=$(du -sk "$OPTIMIZED_DIR" | cut -f1)
saved=$((original_size - optimized_size))
saved_mb=$((saved / 1024))

echo "  💾 절약 가능 용량: ~${saved_mb}MB"
echo ""

echo "📝 다음 단계:"
echo ""
echo "  1. CSS 파일에서 폰트 import 수정:"
echo ""
echo "     Before:"
echo "       @font-face {"
echo "         src: url('/font/variable/PretendardVariable.ttf');"
echo "       }"
echo ""
echo "     After:"
echo "       @import url('/font/optimized/fonts.css');"
echo ""
echo "  2. npm run build 실행"
echo "  3. 테스트 (폰트가 정상 표시되는지 확인)"
echo "  4. 문제 없으면 기존 폰트 디렉토리 삭제 가능"
echo ""
echo "  ⚠️  주의: 최적화된 폰트는 지정된 글자만 포함합니다."
echo "           추가 글자가 필요하면 UNICODE_RANGE를 수정하세요."
echo ""
