// 모바일 디바이스 감지 유틸리티
export const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export const isIOS = () => {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export const isLowEndDevice = () => {
    // 메모리가 4GB 이하이거나, 하드웨어 동시성이 4 이하인 경우
    const memory = navigator.deviceMemory // GB (Chrome only)
    const cores = navigator.hardwareConcurrency

    if (memory && memory <= 4) return true
    if (cores && cores <= 4) return true

    // 모바일은 기본적으로 저사양으로 간주
    return isMobile()
}

export const getPerformanceLevel = () => {
    if (isLowEndDevice()) {
        return 'low' // 파티클 적게, 애니메이션 간소화
    }

    const memory = navigator.deviceMemory
    const cores = navigator.hardwareConcurrency

    if (memory && memory >= 8 && cores && cores >= 8) {
        return 'high' // 모든 효과 활성화
    }

    return 'medium' // 중간 수준
}
