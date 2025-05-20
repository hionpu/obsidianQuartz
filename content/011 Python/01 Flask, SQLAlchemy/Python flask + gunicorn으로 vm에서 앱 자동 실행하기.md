---
title: Python flask + gunicorn으로 vm에서 앱 자동 실행하기
tags: 
categories: 
createdAt: 2025-03-19 11:03
lastmod: 2025-03-19 11:03
lang: ko
pin: true
math: true
mermaid: true
---

[[SQLAlchemy로 PostgreSQL 다루는 방법]]
## 1. Flask 앱 준비 및 업로드

로컬에서 Flask 애플리케이션을 개발합니다. 이후, 해당 프로젝트 파일들을 VM(가상머신)으로 업로드합니다. 일반적으로 `scp`나 Git, FTP 등 다양한 방법을 사용할 수 있습니다. 저는 WinSCP를 사용했어요.

---

## 2. 가상환경(venv) 구축

### 가상환경이란?

- 가상환경은 파이썬 패키지들을 프로젝트별로 격리하여 관리할 수 있도록 해줍니다.
- `venv` 명령어를 사용해 특정 디렉토리에 독립된 파이썬 인터프리터와 라이브러리 집합을 생성합니다.
- 프로젝트마다 필요한 패키지가 다른데 이를 독립적으로 관리할 수 있게 해줍니다.

### 설정 방법

1. VM에서 프로젝트 디렉토리로 이동합니다.
2. 다음 명령어로 가상환경을 생성합니다:
```bash
python3 -m venv venv
```
3. 가상환경을 활성화하려면:
```bash
source venv/bin/activate
```  
4. 활성화된 가상환경 내에서 Flask와 필요한 기타 라이브러리, gunicorn 등을 설치합니다:
    
   
```bash
pip install flask gunicorn
```

> 참고로 가상환경은 실제 파일 시스템의 디렉토리 구조 내에 존재합니다. 즉, venv 안의 실행 파일(예: gunicorn)은 물리적인 경로를 갖고 있으며, 이 경로를 통해 직접 실행할 수 있습니다. 이것이 flask app을 가상 환경에 설치했지만 gunicorn이 vm 부팅시에 이 앱을 자동으로 실행할 수 있게 하는 원리에요.

---

## 3. gunicorn을 이용한 애플리케이션 실행

### gunicorn이란?

- gunicorn은 Python WSGI HTTP 서버로, Flask와 같은 WSGI 호환 프레임워크를 실행하기 위해 사용됩니다.
- gunicorn을 가상환경 내에 설치하면, 해당 환경에서 관리되는 파이썬 인터프리터와 라이브러리를 사용할 수 있습니다.

### 실행 방법

가상환경이 활성화된 상태에서 다음과 같이 gunicorn을 실행할 수 있습니다:


```bash
gunicorn -w 4 myapp:app
```
여기서 `-w 4`는 4개의 워커 프로세스를 사용한다는 의미이며, `myapp:app`은 `myapp.py` 파일 내에 정의된 Flask 애플리케이션 객체(클래스 이름이 app)를 가리킵니다.

> 가상환경이 활성화되지 않아도, 가상환경 내의 gunicorn 실행 파일을 절대 경로를 통해 직접 호출할 수 있습니다. 예를 들어 `/path/to/venv/bin/gunicorn`처럼 말입니다.

---

## 4. systemd를 통한 자동 실행 설정

### systemd란?

- systemd는 리눅스 운영체제에서 사용하는 초기화(init) 시스템이자 서비스 매니저입니다.
- systemd를 통해 부팅 시 특정 서비스를 자동으로 시작하고, 중단 시 재시작하는 등의 관리가 가능합니다.

### systemd 유닛 파일 생성

1. `/etc/systemd/system/` 디렉토리 내에 예를 들어 `myapp.service` 파일을 생성합니다.

2. 파일 내용은 아래와 같이 작성할 수 있습니다:
```ini
[Unit] Description=My Flask Application After=network.target  [Service] User=your_username Group=www-data WorkingDirectory=/path/to/your/project ExecStart=/path/to/venv/bin/gunicorn -w 4 myapp:app Restart=always  [Install] WantedBy=multi-user.target
```
- `User`와 `Group`은 애플리케이션을 실행할 사용자와 그룹을 지정합니다.
- `WorkingDirectory`는 Flask 앱이 위치한 디렉토리입니다.
- `ExecStart`에서 가상환경 내 gunicorn의 절대 경로를 사용함으로써, 가상환경을 별도로 활성화하지 않고도 올바른 환경에서 애플리케이션이 실행됩니다.
3. 유닛 파일 작성 후, systemd 데몬을 재로드합니다:

```bash
sudo systemctl daemon-reload
```
4. 서비스 시작 및 부팅 시 자동 실행 설정:
```bash
`sudo systemctl start myapp.service sudo systemctl enable myapp.service`
 ```   

---

## 5. 전체 구조 정리

- **Flask 앱 업로드:** 로컬에서 개발한 Flask 앱을 VM에 업로드합니다.
- **가상환경 구축:** `venv`를 사용해 독립적인 파이썬 환경을 생성하고, 필요한 패키지를 설치합니다.
- **gunicorn 설치:** 가상환경 내에서 gunicorn을 설치하여, Flask 앱을 WSGI 서버를 통해 실행합니다.
- **systemd 설정:** systemd 유닛 파일을 통해 VM 부팅 시 자동으로 gunicorn이 실행되도록 설정합니다. 이때, 유닛 파일에서는 가상환경 내의 gunicorn 경로를 직접 지정합니다.

