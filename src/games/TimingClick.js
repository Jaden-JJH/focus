// ========================================
// Timing Click (타이밍 클릭)
// Hard Mode Only - 한번 실패하면 게임오버
// ========================================
import audioManager from '../utils/audioManager.js'

export class TimingClick {
    constructor(container, { difficulty, roundTier, onCorrect, onWrong }) {
        this.container = container
        this.config = { difficulty, roundTier, onCorrect, onWrong }

        // Phase별 설정
        this.phaseConfig = {
            1: { safeZoneAngle: 60, rotationDuration: 2000 },   // ±30도, 2초
            2: { safeZoneAngle: 40, rotationDuration: 1500 },   // ±20도, 1.5초
            3: { safeZoneAngle: 30, rotationDuration: 1200 }    // ±15도, 1.2초 (매우 어려움)
        }

        this.rotationStartTime = null
        this.hasFailed = false
        this.hasClicked = false

        // Safe Zone 랜덤 위치 (0-360도)
        this.safeZoneCenterAngle = Math.random() * 360
    }

    render() {
        const phase = this.phaseConfig[this.config.roundTier] || this.phaseConfig[1]

        // Safe zone 각도 계산 (랜덤 중심 기준)
        const safeZoneStart = this.safeZoneCenterAngle - phase.safeZoneAngle / 2
        const safeZoneEnd = this.safeZoneCenterAngle + phase.safeZoneAngle / 2

        // SVG path 계산 (safe zone을 원호로 표시)
        const radius = 140  // 레이더 스크린 크기에 맞춤
        const centerX = 150
        const centerY = 150

        // 시작점과 끝점 계산 (각도를 라디안으로 변환)
        const startAngle = (safeZoneStart - 90) * Math.PI / 180
        const endAngle = (safeZoneEnd - 90) * Math.PI / 180

        const startX = centerX + radius * Math.cos(startAngle)
        const startY = centerY + radius * Math.sin(startAngle)
        const endX = centerX + radius * Math.cos(endAngle)
        const endY = centerY + radius * Math.sin(endAngle)

        // Large arc flag (180도 이상이면 1)
        const largeArcFlag = phase.safeZoneAngle > 180 ? 1 : 0

        this.container.innerHTML = `
            <div class="game-instruction">타이밍 맞춰 클릭!</div>

            <div class="timing-gauge" style="
                position: relative;
                width: 340px;
                height: 340px;
                margin: 20px auto;
                filter: drop-shadow(0 0 30px rgba(239, 68, 68, 0.4));
            ">
                <svg width="340" height="340" viewBox="0 0 300 300">
                    <!-- 레이더 스크린 배경 -->
                    <circle cx="150" cy="150" r="140"
                        fill="url(#radarBg)"
                        opacity="0.9"/>

                    <!-- 외곽 테두리 (레이더 스크린) -->
                    <circle cx="150" cy="150" r="140"
                        fill="none"
                        stroke="url(#screenBorder)"
                        stroke-width="3"
                        filter="url(#glow)"/>

                    <!-- 동심원 그리드 -->
                    <circle cx="150" cy="150" r="105"
                        fill="none"
                        stroke="#dc2626"
                        stroke-width="1"
                        opacity="0.3"/>
                    <circle cx="150" cy="150" r="70"
                        fill="none"
                        stroke="#dc2626"
                        stroke-width="1"
                        opacity="0.3"/>
                    <circle cx="150" cy="150" r="35"
                        fill="none"
                        stroke="#dc2626"
                        stroke-width="1"
                        opacity="0.3"/>

                    <!-- 방사형 라인 (8방향) -->
                    <line x1="150" y1="10" x2="150" y2="290" stroke="#dc2626" stroke-width="1" opacity="0.2"/>
                    <line x1="10" y1="150" x2="290" y2="150" stroke="#dc2626" stroke-width="1" opacity="0.2"/>
                    <line x1="35" y1="35" x2="265" y2="265" stroke="#dc2626" stroke-width="1" opacity="0.15"/>
                    <line x1="265" y1="35" x2="35" y2="265" stroke="#dc2626" stroke-width="1" opacity="0.15"/>

                    <!-- Safe Zone 하이라이트 (부채꼴) -->
                    <path id="safe-zone-highlight" d="
                        M 150 150
                        L ${startX} ${startY}
                        A 140 140 0 ${largeArcFlag} 1 ${endX} ${endY}
                        Z"
                        fill="url(#safeZoneGradient)"
                        opacity="0.4"
                    />

                    <!-- Safe Zone 외곽선 (강조) -->
                    <path d="
                        M ${startX} ${startY}
                        A 140 140 0 ${largeArcFlag} 1 ${endX} ${endY}"
                        fill="none"
                        stroke="#fbbf24"
                        stroke-width="3"
                        stroke-linecap="round"
                        filter="url(#glow)"
                        opacity="0.8"
                    />

                    <!-- 회전 바늘 (계기판 스타일) -->
                    <g id="timing-scan-beam" style="
                        transform-origin: 150px 150px;
                        animation: rotateNeedle ${phase.rotationDuration}ms linear infinite;
                    ">
                        <!-- 바늘 글로우 (배경) -->
                        <line x1="150" y1="150" x2="150" y2="10"
                            stroke="#fb923c"
                            stroke-width="5"
                            stroke-linecap="round"
                            opacity="0.4"
                            filter="url(#beamGlow)"
                        />

                        <!-- 바늘 메인 -->
                        <line x1="150" y1="150" x2="150" y2="10"
                            stroke="url(#needleGradient)"
                            stroke-width="2.5"
                            stroke-linecap="round"
                        />

                        <!-- 바늘 끝 표시 -->
                        <circle cx="150" cy="10" r="4"
                            fill="url(#needleTipGradient)"
                            filter="url(#glow)"
                        />
                    </g>

                    <!-- 중심점 글로우 -->
                    <circle cx="150" cy="150" r="8" fill="#ef4444" opacity="0.5" filter="url(#glow)"/>

                    <!-- 중심점 -->
                    <circle cx="150" cy="150" r="5" fill="url(#centerGradient)" stroke="#ef4444" stroke-width="2"/>

                    <!-- 스크린 반사 효과 (상단) -->
                    <ellipse cx="150" cy="80" rx="80" ry="30"
                        fill="url(#screenReflection)"
                        opacity="0.1"/>

                    <!-- SVG 정의 -->
                    <defs>
                        <!-- 레이더 배경 -->
                        <radialGradient id="radarBg">
                            <stop offset="0%" style="stop-color:#1a0505;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />
                        </radialGradient>

                        <!-- 스크린 테두리 -->
                        <linearGradient id="screenBorder" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#dc2626;stop-opacity:0.8" />
                            <stop offset="100%" style="stop-color:#b91c1c;stop-opacity:1" />
                        </linearGradient>

                        <!-- Safe Zone 그라데이션 -->
                        <radialGradient id="safeZoneGradient">
                            <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:0.6" />
                            <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:0.2" />
                        </radialGradient>

                        <!-- 스캔 빔 그라데이션 (부채꼴) -->
                        <radialGradient id="scanBeamGradient">
                            <stop offset="0%" style="stop-color:#ef4444;stop-opacity:0" />
                            <stop offset="70%" style="stop-color:#ef4444;stop-opacity:0.4" />
                            <stop offset="100%" style="stop-color:#dc2626;stop-opacity:0.8" />
                        </radialGradient>

                        <!-- 중심점 그라데이션 -->
                        <radialGradient id="centerGradient">
                            <stop offset="0%" style="stop-color:#fca5a5;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
                        </radialGradient>

                        <!-- 바늘 그라데이션 -->
                        <linearGradient id="needleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#fb923c;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#ef4444;stop-opacity:1" />
                        </linearGradient>

                        <!-- 바늘 끝 그라데이션 -->
                        <radialGradient id="needleTipGradient">
                            <stop offset="0%" style="stop-color:#fef08a;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#fbbf24;stop-opacity:1" />
                        </radialGradient>

                        <!-- 스크린 반사 -->
                        <linearGradient id="screenReflection" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.3" />
                            <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
                        </linearGradient>

                        <!-- 글로우 필터 -->
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>

                        <!-- 빔 글로우 필터 -->
                        <filter id="beamGlow">
                            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                </svg>
            </div>

            <button id="timing-click-btn" class="btn-primary" style="
                width: 200px;
                height: 60px;
                font-size: 1.5rem;
                margin: 20px auto;
                display: block;
                background: linear-gradient(135deg, #dc2626, #991b1b);
                border: 2px solid #ef4444;
                border-radius: 12px;
                color: #fecaca;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
                font-weight: 600;
            ">STOP</button>
        `

        // 회전 시작 시간 기록
        this.rotationStartTime = Date.now()

        // 클릭 이벤트
        this.handleClick = () => {
            this.handleButtonClick()
        }

        const btn = document.getElementById('timing-click-btn')
        if (btn) {
            btn.addEventListener('click', this.handleClick)
        }
    }

    getCurrentAngle() {
        const phase = this.phaseConfig[this.config.roundTier] || this.phaseConfig[1]
        const elapsed = Date.now() - this.rotationStartTime
        const rotationsPerMs = 360 / phase.rotationDuration
        const angle = (elapsed * rotationsPerMs) % 360

        // 0도 = 12시 방향 (위쪽)
        return angle
    }

    isInSafeZone(angle) {
        const phase = this.phaseConfig[this.config.roundTier] || this.phaseConfig[1]

        // 현재 각도와 Safe Zone 중심 각도의 차이 계산
        let diff = angle - this.safeZoneCenterAngle

        // 차이를 -180 ~ 180 범위로 정규화
        while (diff > 180) diff -= 360
        while (diff < -180) diff += 360

        // Safe Zone 범위 안에 있는지 확인
        return Math.abs(diff) <= phase.safeZoneAngle / 2
    }

    handleButtonClick() {
        if (this.hasClicked) return
        this.hasClicked = true

        // 🔊 클릭 음
        audioManager.playInGameClick()

        const currentAngle = this.getCurrentAngle()
        const inSafeZone = this.isInSafeZone(currentAngle)

        const btn = document.getElementById('timing-click-btn')
        const scanBeam = document.getElementById('timing-scan-beam')

        // 스캔 빔 애니메이션 멈추고 현재 각도로 고정
        if (scanBeam) {
            scanBeam.style.animation = 'none'
            scanBeam.style.transform = `rotate(${currentAngle}deg)`
        }

        // 버튼 비활성화
        if (btn) {
            btn.disabled = true
        }

        if (inSafeZone) {
            // 성공!
            const instruction = this.container.querySelector('.game-instruction')
            if (instruction) instruction.innerText = '성공!'

            // 바늘 색상 변경 (초록색 - 성공)
            if (scanBeam) {
                const glowLine = scanBeam.querySelectorAll('line')[0]
                const mainLine = scanBeam.querySelectorAll('line')[1]
                const needleTip = scanBeam.querySelector('circle')

                if (glowLine) glowLine.setAttribute('stroke', '#22c55e')
                if (mainLine) mainLine.setAttribute('stroke', '#4ade80')
                if (needleTip) needleTip.setAttribute('fill', '#86efac')
            }

            if (btn) {
                btn.style.transform = 'scale(0.95)'
                btn.style.boxShadow = '0 0 25px rgba(251, 191, 36, 0.8)'
                btn.style.borderColor = '#fbbf24'
                btn.style.background = 'linear-gradient(135deg, #d97706, #b45309)'
            }

            setTimeout(() => {
                if (btn) {
                    btn.style.transform = 'scale(1)'
                    btn.style.boxShadow = 'none'
                }
            }, 200)

            setTimeout(() => {
                this.config.onCorrect()
            }, 800)
        } else {
            // 실패
            this.hasFailed = true

            const instruction = this.container.querySelector('.game-instruction')
            if (instruction) instruction.innerText = '실패!'

            // 바늘 색상 변경 (빨간색 - 실패)
            if (scanBeam) {
                const glowLine = scanBeam.querySelectorAll('line')[0]
                const mainLine = scanBeam.querySelectorAll('line')[1]
                const needleTip = scanBeam.querySelector('circle')

                if (glowLine) glowLine.setAttribute('stroke', '#dc2626')
                if (mainLine) mainLine.setAttribute('stroke', '#ef4444')
                if (needleTip) needleTip.setAttribute('fill', '#fca5a5')
            }

            if (btn) {
                btn.classList.add('shake')
                btn.style.opacity = '0.6'
                btn.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.6)'
                btn.style.borderColor = '#ef4444'
            }

            setTimeout(() => {
                this.config.onWrong()
            }, 800)
        }
    }

    cleanup() {
        // 이벤트 리스너 제거
        const btn = document.getElementById('timing-click-btn')
        if (btn && this.handleClick) {
            btn.removeEventListener('click', this.handleClick)
        }
    }
}
