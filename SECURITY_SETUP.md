# 🔒 보안 설정 가이드

## 개요
이 가이드는 게임 결과 조작을 방지하기 위한 보안 정책을 Supabase에 적용하는 방법을 설명합니다.

## 문제점
현재 클라이언트에서 전달하는 `round`와 `xp` 값을 그대로 DB에 저장하기 때문에, 브라우저 개발자 도구로 조작이 가능합니다.

## 해결 방법
Supabase Trigger를 사용하여 서버 사이드에서 XP를 재계산합니다.

---

## 📋 적용 단계

### 1️⃣ Supabase Dashboard 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭

### 2️⃣ SQL 마이그레이션 실행
1. 프로젝트 루트의 `security-migration.sql` 파일 열기
2. 파일 내용 전체 복사 (Cmd+A, Cmd+C)
3. Supabase SQL Editor에 붙여넣기 (Cmd+V)
4. 우측 상단의 **"Run"** 버튼 클릭
5. ✅ "Success. No rows returned" 메시지 확인

### 3️⃣ 적용 확인 (선택사항)
SQL Editor에서 다음 쿼리를 실행하여 함수가 제대로 작동하는지 확인:

```sql
-- 일반 모드 XP 계산 테스트
SELECT calculate_xp_for_round(1);   -- 예상 결과: 1
SELECT calculate_xp_for_round(10);  -- 예상 결과: 21
SELECT calculate_xp_for_round(50);  -- 예상 결과: 69

-- 하드 모드 XP 계산 테스트
SELECT calculate_xp_for_hard_mode(10);  -- 예상 결과: 63 (21 * 3)
```

---

## 🛡️ 적용된 보안 정책

### 1. XP 서버 사이드 재계산
- **함수**: `calculate_xp_for_round()`
- **로직**: `floor(round + 5 * ln(round))`
- **효과**: 클라이언트가 보낸 XP 값 무시, 서버에서 정확히 재계산

### 2. 하드모드 XP 3배 적용
- **함수**: `calculate_xp_for_hard_mode()`
- **로직**: 일반 모드 XP × 3
- **효과**: 하드모드 보너스 자동 적용

### 3. Trigger 자동 실행
- **Trigger**: `recalculate_xp_trigger`
- **시점**: `game_records` INSERT 직전
- **효과**: 모든 게임 결과가 자동으로 검증됨

### 4. 라운드 범위 검증 (RLS)
- **정책**: `validate_game_round`
- **범위**: 1 ≤ max_round ≤ 200
- **효과**: 비정상적으로 높은 라운드 차단

---

## 🧪 테스트 방법

### 정상 플레이 테스트
1. 게임 정상 플레이
2. 결과 화면에서 DB 확인
3. ✅ XP가 정확하게 계산되어 저장됨

### 조작 시도 테스트
1. 게임 플레이 후 결과 화면 진입
2. F12 개발자 도구 → Console
3. 다음 코드 입력:
```javascript
history.replaceState({
  round: 9999,
  xp: 999999,
  isHardMode: false
}, '', '/result')
location.reload()
```
4. ❌ RLS 정책에 의해 INSERT 차단됨
5. 또는 라운드 200 이하로 조작 시: XP가 서버에서 재계산되어 정확한 값만 저장됨

---

## 📊 적용 전후 비교

| 항목 | 적용 전 | 적용 후 |
|------|---------|---------|
| **XP 계산** | 클라이언트 | 서버 (Trigger) |
| **조작 가능성** | ✅ 가능 | ❌ 불가능 |
| **라운드 검증** | ❌ 없음 | ✅ 1~200 범위 |
| **하드모드 보너스** | 클라이언트 | 서버 (자동) |

---

## ⚠️ 주의사항

### 기존 데이터
- 이 마이그레이션은 **새로 삽입되는 데이터**에만 적용됩니다.
- 이미 저장된 기존 데이터는 영향받지 않습니다.
- 필요시 기존 데이터를 재계산하는 별도 스크립트 작성 가능합니다.

### Trigger 동작
- Trigger는 `BEFORE INSERT` 시점에 실행됩니다.
- 클라이언트 코드는 수정할 필요 없습니다.
- 클라이언트가 보낸 `xp_earned` 값은 자동으로 재계산된 값으로 대체됩니다.

### RLS 정책
- RLS 정책은 라운드 200 초과 시 INSERT를 차단합니다.
- 200은 충분히 높은 상한선이므로 정상 플레이에는 영향 없습니다.
- 필요시 `security-migration.sql` 파일에서 상한선 조정 가능합니다.

---

## 🔧 문제 해결

### SQL 실행 오류 시
```
ERROR: relation "game_records" does not exist
```
→ 테이블명이 다를 수 있습니다. Supabase Table Editor에서 실제 테이블명 확인 후 SQL 파일 수정

### Trigger가 작동하지 않을 시
```sql
-- Trigger 존재 여부 확인
SELECT * FROM pg_trigger WHERE tgname = 'recalculate_xp_trigger';

-- Trigger 재생성
DROP TRIGGER IF EXISTS recalculate_xp_trigger ON game_records;
CREATE TRIGGER recalculate_xp_trigger
BEFORE INSERT ON game_records
FOR EACH ROW
EXECUTE FUNCTION recalculate_game_xp();
```

### RLS 정책이 작동하지 않을 시
```sql
-- RLS 활성화 여부 확인
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'game_records';

-- RLS 강제 활성화
ALTER TABLE game_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_records FORCE ROW LEVEL SECURITY;
```

---

## 📚 참고 자료

- **Supabase Triggers**: https://supabase.com/docs/guides/database/postgres/triggers
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL 함수**: https://www.postgresql.org/docs/current/sql-createfunction.html

---

## ✅ 완료 체크리스트

- [ ] `security-migration.sql` 파일을 Supabase SQL Editor에서 실행
- [ ] "Success. No rows returned" 메시지 확인
- [ ] 테스트 쿼리로 함수 작동 확인
- [ ] 게임 플레이 테스트 (정상 저장 확인)
- [ ] 조작 시도 테스트 (차단 확인)

---

적용 완료 후 문제 발생 시 이 문서를 참고하세요.
