---
title: Python Flask 개념 정리 1
tags:
  - python
  - flask
  - web-development
  - backend
  - database
  - psycopg2
  - postgresql
  - connection-pool
categories: 
createdAt: 2025-05-29
lastmod: 2025-05-29
lang: ko
pin: false
math: false
mermaid: false
related:
  - "[[Python flask + Postgre DB 구축하기]]"
  - "[[SQLAlchemy로 PostgreSQL 다루는 방법]]"
  - "[[Python flask + gunicorn으로 vm에서 앱 자동 실행하기]]"
---

# Python Flask 개념 정리 1

## Flask 애플리케이션과 데이터베이스 연결 관리

### Flask instance의 db_pool 필드

Flask 애플리케이션 객체에 커스텀 속성을 추가하여 데이터베이스 연결 풀을 관리할 수 있습니다.

```python
app = Flask(__name__)
app.db_pool = psycopg2.pool.SimpleConnectionPool(
    1, 10,  # min_conn, max_conn
    dsn=app.config['DATABASE_URL']
)
```

이렇게 하면 애플리케이션 전체에서 하나의 연결 풀을 공유하여 효율적인 데이터베이스 연결 관리가 가능합니다.

## psycopg2의 역할

psycopg2는 Python에서 PostgreSQL 데이터베이스에 연결하기 위한 어댑터입니다.

**주요 기능:**
- PostgreSQL 데이터베이스 연결
- SQL 쿼리 실행
- 트랜잭션 관리 (commit, rollback)
- 연결 풀링 지원
- 데이터 타입 변환

```python
import psycopg2
conn = psycopg2.connect("postgresql://user:password@host:port/dbname")
cur = conn.cursor()
cur.execute("SELECT * FROM table_name")
```

## DB 풀(Connection Pool)이란?

데이터베이스 연결 풀은 미리 생성된 데이터베이스 연결들을 관리하는 메커니즘입니다.

**장점:**
- 연결 생성/해제 오버헤드 감소
- 동시 연결 수 제한으로 리소스 관리
- 애플리케이션 성능 향상

**예시:**
```python
# 풀에서 연결 가져오기
conn = app.db_pool.getconn()

# 사용 후 풀에 반환
app.db_pool.putconn(conn)
```

## Flask의 g 객체

`g`는 Flask의 애플리케이션 컨텍스트 로컬 객체로, 요청 동안 데이터를 저장하는 데 사용됩니다.

**특징:**
- 각 요청마다 독립적인 저장 공간
- 요청이 끝나면 자동으로 정리됨
- 스레드 안전성 보장

```python
def get_db():
    if 'db_conn' not in g:
        g.db_conn = psycopg2.connect(DATABASE_URL)
    return g.db_conn

@app.teardown_appcontext
def close_db(exception=None):
    db_conn = g.pop('db_conn', None)
    if db_conn is not None:
        db_conn.close()
```

## Flask의 request 객체와 접근 방법

Flask의 `request` 객체는 현재 HTTP 요청에 대한 정보를 담고 있습니다.

### request.get_json()
JSON 데이터를 파싱하여 Python 딕셔너리로 반환합니다.

```python
@app.route('/api', methods=['POST'])
def handle_json():
    data = request.get_json()
    name = data.get('name')  # 안전한 접근
    return jsonify({"received": name})
```

### request.json
`request.get_json()`의 프로퍼티 버전으로, 동일한 기능을 수행합니다.

```python
data = request.json
# request.get_json()과 동일
```

### request.args.get()
URL 쿼리 파라미터에 접근할 때 사용합니다.

```python
# URL: /search?q=python&page=1
@app.route('/search')
def search():
    query = request.args.get('q')        # 'python'
    page = request.args.get('page', 1)   # 기본값 1
    return f"검색어: {query}, 페이지: {page}"
```

## Python에서 with 구문

`with` 구문은 컨텍스트 매니저를 사용하여 리소스를 안전하게 관리하는 구문입니다.

**특징:**
- 자동으로 리소스 정리
- 예외 발생 시에도 안전한 정리 보장
- `__enter__`와 `__exit__` 메서드 활용

```python
# 파일 처리 예시
with open('file.txt', 'r') as f:
    content = f.read()
# 파일이 자동으로 닫힘

# 데이터베이스 연결 예시
with psycopg2.connect(DATABASE_URL) as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM users")
        result = cur.fetchall()
# 연결과 커서가 자동으로 정리됨
```

## if not all([a,b,c]) 구문

`all()` 함수는 모든 요소가 True인지 확인하는 내장 함수입니다.

**동작 방식:**
- 모든 요소가 참이면 `True` 반환
- 하나라도 거짓이면 `False` 반환
- 빈 이터러블은 `True` 반환

```python
# 모든 필수 데이터가 있는지 확인
from_account = data.get('from_account')
to_account = data.get('to_account')  
amount = data.get('amount')

if not all([from_account, to_account, amount]):
    return jsonify({"error": "Missing data"}), 400

# 다음과 동일함:
# if not from_account or not to_account or not amount:
#     return jsonify({"error": "Missing data"}), 400
```

**예시 결과:**
```python
all([1, 2, 3])        # True
all([1, 0, 3])        # False (0은 falsy)
all([])               # True (빈 리스트)
all(['a', 'b', ''])   # False (빈 문자열은 falsy)
```
