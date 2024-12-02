---
title: " GitHub 블로그 개설하기(1) - Repository 생성과 테스트 페이지 확인하기"
date: 2023-12-04 15:22
lastmod: 2023-12-06 17:38
tags:
  - "#github"
  - "#blog"
  - "#jekyll"
  - "#polyglot"
categories:
  - "[GitHub, jekyll]"
lang: ko
permalink: /posts/github_blog_1
pin: true
math: true
mermaid: true
---

# 머릿말 
지난 며칠간 깃허브 페이지 블로그를 만들었다. 티스토리나 구글 블로그스팟으로 하려고 했었는데 다국어 지원을 해내고 싶다는 이상한 생각에 사로잡혀서 깃허브 페이지까지 오게 되었다. 

티스토리/블로그스팟은 다국어 지원 플러그인이 있긴 하지만 저렴이 버전의 자동번역은 품질이 걱정되고 내가 번역본을 수정하기가 어려워 보여서 버렸다.

진행하면서 중간에 오류가 정보도 없고 해결도 안돼서 아 그냥 티스토리 할까 싶은 때가 꽤 있었는데 GPT를 집요하게 괴롭혀서 결국 해냈다. 단계별로 다음과 같이 진행했고 나는 Chirpy 테마를 사용했기 때문에 다른 테마를 사용하는 경우에 도움이 되지 않을 수도 있다.

## 시리즈 포스트 링크
<font size = "5">(1) Repository 생성과 테스트 페이지 확인하기</font>

(2) [Chirpy 테마 적용](https://hionpu.com/posts/github_blog_2) 

(3) [포스트 올리기](https://hionpu.com/posts/github_blog_3) 

(4) [다국어 지원하기](https://hionpu.com/posts/github_blog_4) 

(5) [사이트맵 생성하기](https://hionpu.com/posts/github_blog_5) 



# 1. Repository 생성


![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/cb721c89-9865-4fbc-ae40-ebfbb0e12479)
깃허브 Repositories 탭의 오른쪽에 초록색 New 버튼

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/dd573081-6fca-4e49-91d1-b1695488f991)
소유자 - 본인 고르고 _<깃허브 계정명>.github.io_ 형식으로 입력(나는 이미 만들어서 아래 빨간 메시지로 이미 있다고 뜨는것)

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/76025c67-7d43-4735-9913-b57b0985ab2b)
Public과 Add a README file 체크하고 아래에 Create Repository 초록버튼 클릭

# 2. 내 로컬에 클론

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/a229797f-8ae0-460c-ac42-61edcccc0a2d)
만들어진 Repository에서 오른쪽 초록색 <> Code 버튼 누르면 내 Repository의 Https 주소 확인 가능(주소창에도 있다). 이것을 복사하고 git bash같은 터미널에서 클론할 위치로 이동한 다음

```
git clone 복사한 주소
```

해서 로컬에 클론하면 아까 만든 Repository 이름으로 된 폴더가 생성돼있다. 터미널에서 해당 폴더에 진입하고 임시 테스트용 인덱스 파일을 하나 만들자

```
cd username.github.io
echo "Hello World" > index.html
```

# 3. index.html 푸시하고 확인
```
git add *
git commit -m "Beginning of my git blog"
git push -u origin main
```

이제 https://계정명.github.io 로 들어가면 인덱스에 적은 내용을 볼 수 있다.

다음은 테마를 적용해볼 것이다.

***
# 이어지는 글
(2) [Chirpy 테마 적용](https://hionpu.com/posts/github_blog_2) 
