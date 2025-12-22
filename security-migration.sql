-- ========================================
-- Security Migration: Game Result Validation
-- ========================================
-- 이 마이그레이션은 게임 결과 조작을 방지합니다.
--
-- 적용 방법:
-- 1. Supabase Dashboard → SQL Editor 접속
-- 2. 이 파일 내용 전체 복사
-- 3. SQL Editor에 붙여넣기
-- 4. "Run" 버튼 클릭
--
-- 작동 방식:
-- 1. 클라이언트가 보낸 xp_earned 값을 무시하고 서버에서 재계산
-- 2. max_round가 합리적인 범위(1~200) 내인지 검증
-- 3. 모든 INSERT는 이 검증을 통과해야만 저장됨
-- ========================================

-- ----------------------------------------
-- 1. XP 계산 함수 (Normal Mode)
-- ----------------------------------------
-- JavaScript 로직: Math.floor(round + 5 * Math.log(round))
-- PostgreSQL 변환: floor(round + 5 * ln(round))
-- ----------------------------------------
CREATE OR REPLACE FUNCTION calculate_xp_for_round(round_num INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- round_num이 0 이하면 0 반환 (안전장치)
  IF round_num <= 0 THEN
    RETURN 0;
  END IF;

  -- XP 계산: floor(round + 5 * ln(round))
  RETURN FLOOR(round_num + 5 * LN(round_num));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ----------------------------------------
-- 2. XP 계산 함수 (Hard Mode)
-- ----------------------------------------
-- 하드모드는 일반 모드의 3배
-- ----------------------------------------
CREATE OR REPLACE FUNCTION calculate_xp_for_hard_mode(round_num INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- 일반 모드 XP의 3배
  RETURN calculate_xp_for_round(round_num) * 3;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ----------------------------------------
-- 3. Trigger Function: XP 재계산
-- ----------------------------------------
-- INSERT 전에 xp_earned 값을 서버에서 재계산
-- 클라이언트가 보낸 값은 무시됨
-- ----------------------------------------
CREATE OR REPLACE FUNCTION recalculate_game_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- mode에 따라 XP 재계산
  IF NEW.mode = 'hard' THEN
    NEW.xp_earned := calculate_xp_for_hard_mode(NEW.max_round);
  ELSE
    -- mode = 'normal' 또는 NULL
    NEW.xp_earned := calculate_xp_for_round(NEW.max_round);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------
-- 4. Trigger 등록
-- ----------------------------------------
-- game_records 테이블에 INSERT 시 자동으로 XP 재계산
-- ----------------------------------------
DROP TRIGGER IF EXISTS recalculate_xp_trigger ON game_records;

CREATE TRIGGER recalculate_xp_trigger
BEFORE INSERT ON game_records
FOR EACH ROW
EXECUTE FUNCTION recalculate_game_xp();

-- ----------------------------------------
-- 5. RLS 정책: 라운드 범위 검증
-- ----------------------------------------
-- max_round가 1~200 범위 내인지 검증
-- (200 라운드는 충분히 높은 상한선)
-- ----------------------------------------

-- 먼저 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "validate_game_round" ON game_records;

-- 새 정책 생성
CREATE POLICY "validate_game_round"
ON game_records
FOR INSERT
WITH CHECK (
  -- 라운드는 1 이상 200 이하여야 함
  max_round >= 1 AND max_round <= 200
);

-- ----------------------------------------
-- 6. 정책 활성화 확인
-- ----------------------------------------
-- RLS가 활성화되어 있는지 확인 (이미 활성화되어 있을 가능성 높음)
-- ----------------------------------------
ALTER TABLE game_records ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- 완료!
-- ----------------------------------------
-- 이제 클라이언트에서 어떤 XP 값을 보내든,
-- 서버에서 재계산된 정확한 값만 저장됩니다.
-- ----------------------------------------

-- 테스트 예시 (선택사항 - 주석 해제 후 실행):
-- SELECT calculate_xp_for_round(1);   -- 결과: 0 (floor(1 + 5*ln(1)) = floor(1 + 0) = 1)
-- SELECT calculate_xp_for_round(10);  -- 결과: 21 (floor(10 + 5*ln(10)) = floor(10 + 11.51) = 21)
-- SELECT calculate_xp_for_round(50);  -- 결과: 69 (floor(50 + 5*ln(50)) = floor(50 + 19.56) = 69)
-- SELECT calculate_xp_for_hard_mode(10);  -- 결과: 63 (21 * 3)
