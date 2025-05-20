---
title: SQLAlchemy로 PostgreSQL 다루는 방법
tags:
  - python
categories: 
createdAt: 2025-05-20 10:10
lastmod: 2025-05-20 10:10
lang: ko
pin: true
math: true
mermaid: true
permalink:
---
> [[Python flask + gunicorn으로 vm에서 앱 자동 실행하기]] Flask로 백엔드를 구성한 후에 gunicorn에게 맡기는 방법

파이썬 백엔드 개발에서 자주 사용되는 SQLAlchemy와 Flask-SQLAlchemy가 PostgreSQL에 어떻게 접근하고 다루는지 알아보았습니다. 특히 `db.Model`을 상속받은 클래스가 어떻게 동작하고 `model.query`를 통해 실제 데이터베이스와 어떻게 상호작용하는지 살펴보겠습니다.

## SQLAlchemy 라이브러리

SQLAlchemy는 파이썬용 SQL 툴킷 및 ORM(Object Relational Mapper) 라이브러리예요. 2005년 Mike Bayer가 개발했으며, 파이썬 생태계에서 가장 인기 있는 데이터베이스 접근 라이브러리 중 하나입니다.

주요 특징으로는:

- **SQL 추상화**: 다양한 데이터베이스를 일관된 방식으로 다룰 수 있어요
- **ORM 기능**: 데이터베이스 테이블과 파이썬 클래스를 매핑해줘요
- **다양한 데이터베이스 지원**: PostgreSQL, MySQL, SQLite, Oracle, MS SQL 등을 지원해요
- **두 가지 사용 방식**: 저수준 SQL 조작을 위한 Core API와 객체 지향적 접근을 위한 ORM

Flask-SQLAlchemy는 이러한 SQLAlchemy를 Flask 웹 프레임워크에 쉽게 통합할 수 있게 해주는 확장 라이브러리예요. 

## Flask-SQLAlchemy 사용 방법

Flask 애플리케이션에서 데이터베이스를 사용하려면, 일반적으로 SQLAlchemy를 직접 설정하고 세션을 관리하는 등의 작업이 필요해요. 하지만 Flask-SQLAlchemy를 사용하면 이 과정이 훨씬 간단해집니다.

기본적인 설정은 다음과 같이 이루어져요:

python

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://username:password@localhost/dbname'
db = SQLAlchemy(app)
```

이렇게 `db` 객체를 생성하면, 이 객체를 통해 모델을 정의하고 데이터베이스 작업을 수행할 수 있어요. 특히 `db.Model`을 상속받아 모델 클래스를 정의하는 패턴이 Flask-SQLAlchemy에서 가장 일반적으로 사용되는 방식입니다.

python

```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True)
    email = db.Column(db.String(120), unique=True)
```

이렇게 정의된 모델 클래스는 자동으로 데이터베이스 테이블과 매핑되고, `User.query`와 같은 방식으로 쿼리를 시작할 수 있는데, 이게 엄청 간편합니다. Flask-SQLAlchemy의 장점 중 하나라고 볼 수 있겠스요.

간편함에는 대가가 있습니다. 어떻게 `db.Model`을 상속받은 클래스가 자동으로 데이터베이스와 연결되고, `.query` 속성을 사용할 수 있게 되는 걸까요?
## db.Model 상속 클래스는 어떻게 자동으로 등록되나

1. **선언적 기반 클래스**: Flask-SQLAlchemy의 `db.Model`은 SQLAlchemy의 `declarative_base()`로 만들어진 기본 클래스예요. 이걸 상속하면 특별한 메타클래스 처리가 일어납니다.
2. **메타클래스의 마법**: `db.Model`은 내부적으로 `DeclarativeMeta` 메타클래스를 사용하는데 이 메타클래스는 모델 클래스가 정의될 때 다음 작업들을 수행합니다:
    - 클래스의 속성들을 검사해서 Column 객체들을 찾기
    - 테이블 이름을 결정 (명시적으로 지정하지 않으면 클래스 이름을 소문자화, 스네이크 케이스로 변환)
    - SQLAlchemy Table 객체를 생성하고 등록
    - 매핑 정보를 설정
3. **레지스트리 등록**: 모델 클래스는 SQLAlchemy의 레지스트리에 자동으로 등록되고 Flask-SQLAlchemy가 이 레지스트리를 관리합니다.

### query 속성 사용하기

`User.query` 로 모델 클래스에서 바로 쿼리를 시작할 수 있는 이유는 Flask-SQLAlchemy의 특별한 기능 때문입니다.

1. **쿼리 프로퍼티 주입**: Flask-SQLAlchemy는 모든 모델 클래스에 `query` 속성을 주입합니다. 이 속성은 실제로는 `_QueryProperty` 클래스의 인스턴스.
2. **동적 쿼리 객체 생성**: `query` 속성에 접근하면, 이 프로퍼티는 현재 애플리케이션 컨텍스트에서 세션을 찾아 해당 세션에 연결된 `Query` 객체를 동적으로 만들어 줍니다
3. **내부 구현**: 간단히 표현하면 이런 식으로 동작해요:
    
    python
    
    ```python
    class _QueryProperty:
        def __get__(self, obj, type):
            # 현재 앱 컨텍스트에서 세션 가져오기
            session = _app_ctx_stack.top.db_session
            # 모델 클래스에 맞는 Query 객체 반환
            return session.query(type)
    ```
    
4. **세션 자동 관리**: Flask-SQLAlchemy는 요청 컨텍스트와 함께 세션을 자동으로 관리해줘서, 개발자가 직접 세션을 관리할 필요 없이 `Model.query`로 바로 쿼리를 시작할 수 있는 것입니다.

### 실제 코드 예시

python

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
db = SQLAlchemy(app)

class User(db.Model):  # db.Model 상속
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True)

# 이제 User.query를 사용할 수 있어요
# 예: User.query.filter_by(username='admin').first()
```

---

*그러면 다음은 실제로 DB에 어떻게 접근하고 테이블을 조회, 수정, 삭제하는지 궁금해졌습니다.

## PostgreSQL과 실제로 어떻게 연결되나요?

### 1. 연결 설정 (초기화 단계)

먼저 Flask-SQLAlchemy를 사용하는 애플리케이션에서 PostgreSQL과 연결을 설정합시다:

python

```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://username:password@localhost/dbname'
db = SQLAlchemy(app)
```

이 단계에서 SQLAlchemy는:

- PostgreSQL 드라이버(보통 psycopg2)를 통해 연결 풀을 만들고
- 세션 팩토리를 설정하고
- DB 엔진을 초기화합니다.

### 2. 쿼리 실행 흐름

`User.query.filter_by(name='엄준식').first()`와 같은 코드가 실행될 때 어떤 일이 일어나는지 살펴볼게요:

1. **쿼리 객체 생성**: `User.query`에 접근하면 `_QueryProperty` 디스크립터가 현재 애플리케이션 컨텍스트의 세션을 가져와 `session.query(User)` 쿼리 객체를 반환.
2. **쿼리 빌딩**: `.filter_by(name='엄준식')`와 같은 메소드를 호출하면 실제 SQL이 바로 실행되지 않고, 내부적으로 쿼리 객체가 구성되었다가
3. **SQL 변환**: `.first()`와 같은 실행 메소드가 호출되면, 쿼리 객체는 다음과 같은 SQL로 변환됩니다:
    
    sql
    
    ```sql
    SELECT users.id, users.name, ... FROM users WHERE users.name = '홍길동' LIMIT 1
    ```
    
4. **실제 데이터베이스 접근**: 변환된 SQL은 SQLAlchemy의 내부 엔진을 통해 PostgreSQL 드라이버(psycopg2)로 전달되고
5. **결과 처리**:
    - PostgreSQL은 쿼리를 실행하고 결과를 반환
    - SQLAlchemy는 결과 행들을 User 객체의 인스턴스로 변환
    - 예시에서 `.first()`의 경우 첫 번째 결과 객체만 반환하겠습니다.

### 3. CRUD 작업 예시

#### 데이터 조회 (Read)

python

```python
# 단일 레코드 조회
user = User.query.get(5)  # id=5인 사용자 조회

# 필터링 조회
users = User.query.filter(User.age > 25).all()  # 25세 초과 사용자 모두 조회

# 조인 쿼리
results = db.session.query(User, Post).join(Post).filter(Post.user_id == User.id).all()
```

#### 데이터 생성 (Create)

python

```python
# 새 사용자 생성
new_user = User(name='김철수', email='kim@example.com')
db.session.add(new_user)  # 세션에 추가
db.session.commit()  # DB에 커밋, 실제 INSERT SQL 실행
```

#### 데이터 수정 (Update)

python

```python
# 사용자 정보 수정
user = User.query.filter_by(name='김철수').first()
user.email = 'new_email@example.com'  # 객체 속성 변경
db.session.commit()  # 변경사항 커밋, UPDATE SQL 실행
```

#### 데이터 삭제 (Delete)

python

```python
# 사용자 삭제
user = User.query.get(5)
db.session.delete(user)  # 삭제 예약
db.session.commit()  # 실제 DELETE SQL 실행
```

### 4. 트랜잭션 처리

Flask-SQLAlchemy는 요청 컨텍스트와 함께 세션을 관리해요:

python

```python
# 트랜잭션 처리 예시
try:
    # 여러 작업 수행
    db.session.add(user1)
    db.session.add(user2)
    db.session.commit()  # 모든 변경사항 커밋
except Exception as e:
    db.session.rollback()  # 오류 발생 시 롤백
    raise e
```

### 5. 내부적인 동작 원리

1. **Identity Map**: 세션은 이미 로드된 객체들을 추적하는 "Identity Map"을 유지, 같은 세션에서 같은 행을 두 번 요청하면 같은 파이썬 객체를 반환
2. **변경 감지(Change Tracking)**: 커밋할 때 SQLAlchemy는 객체의 상태가 변경되었는지 확인하고, 변경된 경우에만 UPDATE SQL을 생성
3. **지연 로딩(Lazy Loading)**: 관계된 객체는 기본적으로 필요할 때만 로드

python

```python
# 사용자의 게시물은 이 속성에 접근할 때 별도의 SQL 쿼리로 로드돼요
posts = user.posts  # SELECT * FROM posts WHERE user_id = ?
```

## 마무리

SQLAlchemy는 파이썬 코드와 PostgreSQL 사이의 다리 역할을 하면서, ORM을 통해 객체 지향적으로 데이터베이스를 다룰 수 있게 해주고 있습니다. 복잡한 SQL을 직접 작성하지 않고도 파이썬 코드만으로 데이터베이스를 효율적으로 조작할 수 있네요.

Flask-SQLAlchemy의 `db.Model`과 `model.query`는 이런 SQLAlchemy의 장점을 더욱 사용하기 쉽게 포장해 준 것이라고 볼 수 있겠습니다.

> [[Python flask + gunicorn으로 vm에서 앱 자동 실행하기]] Flask로 백엔드를 구성한 후에 gunicorn에게 맡기는 방법