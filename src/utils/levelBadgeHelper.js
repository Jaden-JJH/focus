import { LEVELS } from '../config/gameConfig.js'

/**
 * 레벨 뱃지 HTML을 생성합니다
 * @param {number} level - 레벨 (1-61)
 * @param {boolean} isHardMode - 하드모드 여부
 * @returns {string} 레벨 뱃지 HTML
 */
export function createLevelBadge(level, isHardMode = false) {
  const levelInfo = LEVELS.getLevelInfo(level)

  let badgeStyle = ''
  let pulseAnimation = ''

  // 레벨별 스타일 결정
  if (level >= 50 && level <= 59) {
    // Gold tier
    badgeStyle = 'background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #000;'
    pulseAnimation = 'pulseGold'
  } else if (level === 60) {
    // Black diamond
    badgeStyle = 'background: #000; color: #fbbf24; border: 2px solid #fbbf24;'
    pulseAnimation = 'pulseGold'
  } else if (level >= 61) {
    // Beyond max
    badgeStyle = 'background: linear-gradient(135deg, #fff, #e0e0e0); color: #000;'
    pulseAnimation = isHardMode ? 'pulseHard' : 'pulse'
  } else {
    // Normal levels
    const primaryColor = isHardMode ? '#ef4444' : '#7c4dff'
    const secondaryColor = isHardMode ? '#dc2626' : '#6a3de8'
    badgeStyle = `background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); color: white;`
    pulseAnimation = isHardMode ? 'pulseHard' : 'pulse'
  }

  return `
    <div style="
      position: absolute;
      bottom: -12px;
      left: 50%;
      transform: translateX(-50%);
      ${badgeStyle}
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 700;
      white-space: nowrap;
      animation: ${pulseAnimation} 2s ease-in-out infinite;
      z-index: 10;
    ">Lv. ${level}</div>
  `
}
