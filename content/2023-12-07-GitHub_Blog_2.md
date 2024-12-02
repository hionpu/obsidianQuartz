---
title: GitHub 블로그 개설하기(2) - Chirpy 테마 적용
tags:
  - "#github"
  - "#blog"
  - "#chirpy"
date: 2023-12-07 16:04
lastmod: 2023-12-08 14:39
lang: ko
permalink: /posts/github_blog_2
categories:
  - "[GitHub, jekyll]"
pin: true
math: true
mermaid: true
---
# 시리즈 포스트 링크
(1) [Repository 생성과 테스트 페이지 확인하기](https://hionpu.com/posts/github_blog_1) 

<font size = "5">(2) Chirpy 테마 적용 </font >

(3) [포스트 올리기](https://hionpu.com/posts/github_blog_3) 

(4) [다국어 지원하기](https://hionpu.com/posts/github_blog_4) 

(5) [사이트맵 생성하기](https://hionpu.com/posts/github_blog_5) 

***

# 1. Chirpy 테마 파일 다운로드
테마를 모아놓은 사이트에서 zip 파일을 제공하기도 하고, chipy 공식 repository에서 fork 해오는 방법도 있지만 나는 fork 말고 clone 했다.

>[Chirpy Repository](https://github.com/cotes2020/jekyll-theme-chirpy.git) 
{: .prompt-info}

클론한 위치에 jekyll-theme-chirpy라는 폴더가 있는데 내용물을 전부 복사해서 내 로컬 repository에 복사한다(…/(git 계정명).github.io). 덮어쓰시겠습니까 $\implies$ 예

# 2. Ruby와 Jekyll 설치
## Ruby
>[Ruby installer 다운로드 링크](https://rubyinstaller.org/downloads/)
{: .prompt-info}

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/39f68fa2-5ed7-4199-b53f-2d49619aecfc)
맨위에 굵은글씨로 다운받고 실행한 다음 next연타하면 설치 끝나고

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/323f795f-893c-41e8-8d5a-88ed45ec9638)
이게 뜨면 3 엔터 해주면 끝.

## Jekyll
그러면 시작(윈도우 키)메뉴에 Start Command Prompt with Ruby가 생겨있다. 실행하고 내 깃허브 블로그 로컬 repository(앞으로 따로 설명이 없으면 내 깃 블로그의 로컬 repository 폴더에서 입력한다)에서

```shell
gem install jekyll
```

```shell
gem install bundler
```
를 입력해서 jekyll과 bundler도 설치하자. 그리고 혹시 모르니
```shell
ruby -v
jekyll -v
bundler -v
```
으로 설치가 잘 됐는지 확인

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/bfbff138-1d26-46eb-96b6-4d785b54d1a3)
이렇게 나오면 된것(설치 시점에 따라 버전이 다를 수 있다).

# 3. Node.js 설치와 npm
>[Node.Js 다운로드](https://nodejs.org/en/)
{: .prompt-info}

다운받아 설치하고 다시 Command Prompt에서 

```shell
npm install && npm run build
```

해줘야 jekyll로 빌드할 때 \*.min.js 가 없다고 찡찡거리지 않는다.
# 4. Chirpy 테마 설치
로컬 블로그 폴더에서 doc 폴더를 삭제한다. \_posts 폴더의 내용물은 삭제해도 되지만 로컬이나 깃허브 배포 후에 정상작동 여부를 확인하기 위해 그냥 두어도 된다.

그리고 로컬 블로그 폴더/.github/workflows 안에 pages-deploy.yml.hook 이라는 파일만 제외하고 전부 삭제하고 이 파일의 맨 뒤에 .hook 확장자를 삭제해서 .yml 파일로 만든다. 

이제
```shell
bundle
```
하면 테마가 설치된다. 

# 5. 로컬에서 확인하기
```shell
bundle exec jekyll serve --liveReload
```
입력하고 아무 브라우저에서 주소창에 localhost:4000을 입력하면 실제로 배포됐을 때의 블로그 화면을 볼 수 있다. `--liveReload`는 페이지를 구성하는 파일들이 변경되면 즉시 블로그 화면에 반영해주는 옵션이다.
# 6. GitHub Action 설정
블로그가 잘 표시된다면 깃허브에 올리면 되는데, Chirpy 테마는 GitHub Action으로 자동 빌드, 배포하지 않으면 오류가 난다. 따라서 먼저 Action을 설정하러 가자.
![[Pasted image 20231208143014.png]]
내 블로그의 GitHub repository의 Settings - 좌측 탭 중간아래에 Pages로 가면 Source 밑에 Deploy from a branch를 눌러보면

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/b74fd6b0-c9b7-4c37-9379-956bccf021fb)
Deploy from a branch에 체크되어 있는 것을 GitHub Actions를 눌러 변경한다.

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/4284cbb2-e181-4c7b-8db8-5eec45ef134f)
밑에 생긴 박스에서 Configure를 누르고 

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/f9298e1b-5f12-41f3-9805-47e7a27b1e32)

다른거 건들 필요 없이 우측 상단에 Commit changes… 클릭하면 배포 준비 끝

# 7. \_config.yml 수정 및 리모트 빌드 준비

## pull 받기
먼저 리모트에서 파일을 수정했으므로(Action을 추가함, .github/workflow 내부에서 수정이 이루어짐) 
``` shell
git pull
```
버전을 업데이트 한다.

## \*.min.js gitignore 수정
로컬 루트 폴더에서 .gitignore를 수정해야 하는데

맨 아래 
```shell
# Misc
assets/js/dist
```
부분에서 `assets`… 앞에 \#을 붙여서 주석 처리한다.

```shell
# Misc
# assets/js/dist
```
그래야 npm으로 생성한 \*.min.js 파일들이 정상적으로 푸시될 수 있다.

## \_config.yml 수정
루트 폴더 내 \_config.yml 파일을 열어서 
```shell
url: ""
```
"" 안에 \https://username.github.io 본인의 깃허브 주소를 적는다. 나는 hionpu.com 도메인을 사용하고 있어서
```shell
url: "hionpu.com"
```
을 적었다. 추가적으로 
```shell
languages: ['ko', 'en']
...
default_lang: 'ko'
...
timezone: Asia/Seoul
...
title: 블로그 이름
tagline: 블로그 이름 밑에 들어갈 문장
description: 블로그 설명
...
github:
	username: 깃허브계정명
...
```
등은 본인에게 맞게 수정해도 좋다. 보통 수정하면 곤란한 부분은 chirpy 원작자가 경고를 해놓았다. 이 \_config.yml은 이후에 다른 설정을 할 때도 수정할 부분이 많다.
# 8. 푸시해서 자동 빌드, 배포하기
이제 수정한 파일을 푸시한다.
```shell
git add *
git commit -m "git blog init"
git push origin main
```
그러면 리모트 repository의 Action 탭에서 빌드와 배포가 되는 것을 확인할 수 있다. 초록불이 들어오면 본인의 블로그 주소(username.github.io)에 들어가서 블로그가 온라인에서 보이는지 확인하자. 

빨간불이 들어오거나 초록불이 들어왔지만 블로그가 정상 작동하지 않는 경우는 추후에 작성할 에러케이스 모음 포스팅을 참고해서 해결할 수 있도록 할 것이다.

# 8. 이어지는 다음 글
(3) [포스트 올리기](https://hionpu.com/posts/github_blog_3) 