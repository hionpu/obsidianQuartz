### 1. %AppData%\Roaming\Insights Capture 내부에 db.sqlite3를 DB Browser로 확인

- video 테이블의 file_path: 녹화 파일이 실제로 어디 있는지랑 무관하게 얘가 기준임
- video_game_event: 이 테이블이 각 녹화의 하이라이트 이벤트 정보 가지고 있음

### 2. %AppData%\Roaming\Insights Capture 폴더 전체를 다른 컴퓨터의 같은 경로에 옮김
db.sqlite3만 옮겨도 될거같긴 한데 안해봄

### 3. 원본 db.sqlite3 -> video 테이블 -> file_path와 동일한 경로에 녹화 파일 넣으면 됨