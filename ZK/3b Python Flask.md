---
id: "3b"
type: permanent
created: 2026-05-15
tags: [tech-stack, python, flask, sqlalchemy]
up: "[[3 기술 스택]]"
---

# 3b Python Flask

핵심 철학: **Flask는 마이크로 프레임워크 — 필요한 것을 직접 조합한다.**
Django가 "모든 것 포함"이라면, Flask는 "필요한 것만".

## 기본 스택 구성

```
Flask          — HTTP 요청 라우팅
SQLAlchemy     — ORM (Python 객체 ↔ DB 테이블)
Alembic        — DB 마이그레이션
gunicorn       — 프로덕션 WSGI 서버
PostgreSQL     — DB (개발/프로덕션 모두)
```

## SQLAlchemy 핵심 개념

```python
# 세션이 트랜잭션의 단위
with Session(engine) as session:
    user = session.get(User, user_id)  # SELECT
    user.name = "새 이름"               # 변경 추적
    session.commit()                    # UPDATE 실행
```

ORM이 생성하는 SQL을 `echo=True`로 확인하는 습관 → 인덱스 효과 검증 가능.
→ [[1e 데이터베이스]] 인덱스 설계와 연결.

## 프로덕션 배포 (gunicorn + systemd)
개발서버(`flask run`)는 프로덕션에 쓰면 안 됨 — 단일 스레드, 재시작 없음.
gunicorn + systemd 서비스로 VM에서 자동 실행.

---


## 관련 레퍼런스
- [[Python Flask 개념 정리 1]]
- [[SQLAlchemy로 PostgreSQL 다루는 방법]]
- [[Python flask + gunicorn으로 vm에서 앱 자동 실행하기]]
- [[Python flask + Postgre DB 구축하기]]
