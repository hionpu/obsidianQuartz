---
title: GitHub 블로그 개설하기(3) - 포스팅
tags:
  - "#github"
  - blog
  - chirpy
categories:
  - "[GitHub, jekyll]"
createdAt: 2023-12-11 15:54
lastmod: 2023-12-11 15:54
lang: ko
permalink: /posts/github_blog_3
pin: true
math: true
mermaid: true
---
# 시리즈 포스트 링크
(1) [Repository 생성과 테스트 페이지 확인하기](https://hionpu.com/posts/github_blog_1) 

[(2) Chirpy 테마 적용](https://hionpu.com/posts/github_blog_2)

<font size = "5">(3) 포스팅</font >

(4) [다국어 지원하기](https://hionpu.com/posts/github_blog_4) 

(5) [사이트맵 생성하기](https://hionpu.com/posts/github_blog_5) 

# 1. 포스트 파일명 형식과 저장 위치
포스팅할 글은

> 2023-12-11-글제목.md

형식으로 마크다운 파일이어야 하고 .md 파일들을 \_post 폴더에 넣어주면 된다.

Jekyll이 빌드될 때 블로그 루트 폴더/\_posts 에 저장된 .md 파일을 모두 찾아서(\_posts 내부에 폴더가 있으면 그 폴더도 탐색함) .html 파일로 컴파일하고 \_site 폴더에 넣는다. \_site 폴더에 들어있는 .html 파일들이 실제로 배포했을 때(또는 localhost:4000에서) 보이는 페이지들이 된다. 다만 \_site 폴더에 파일이름과 하위 상대 경로 변경 없이 그대로 들어가지는 않고 \_config.yml의
```shell
defaults:
...
	-scope:
	...
	values:
		layout: page
		permalink: /:title/
...
```
에서 `permalink:` 속성을 참조해서 들어가는데, 이 속성은 전역 설정이고 .md 파일에서 property 하위에 `permalink: 경로` 를 입력함으로써 수정할 수 있다. 이 부분은 차후에 다국어 지원을 위한 Jekyll의 플러그인 중 하나인 polyglot을 사용할 때 포스트마다 지정해주어야 한다. 현재 단계에서는 일단 그냥 두자.

# 2. 포스트 작성
업로드한 포스팅을 클릭해서 글을 읽을 때 오른쪽 패널에 최근 업데이트 글, 태그, **목차**가 표시되는데 이 중에 목차는 chipy 테마에서 jekyll이 빌드할 때 자동으로 \# 등의 헤더를 뽑아내서 만들어 준다. 나는 이 부분도 약간의 커스터마이징을 위해 tocbot을 사용했지만 나중에 설명하기로 하고 아무튼 헤더를 인식하고 목차를 생성한다는 사실은 알아두자.

이보다 중요한 것은 마크다운 파일의 property 부분을 작성하는 것인데 지난 포스팅의 .md 파일의 property를 예로 들어 설명하겠다.

```shell
---
title: Setting Up a GitHub Blog (1) - Creating a Repository and Checking the Test Page
date: 2023-12-04 15:22
lastmod: 2023-12-07 15:56
tags:
  - "#github"
  - "#blog"
  - "#jekyll"
  - "#polyglot"
categories:
  - "[GitHub, jekyll]"
lang: en
permalink: /posts/Github_blog_1
pin: true
math: true
mermaid: true
---
```

- `title:` 블로그에 업로드됐을 때 보여지는 글 제목이다.
- `date:` 글이 생성된 일시 YYYY-MM-DD HH:MM 형식으로 쓴다.
- `lastmod:` 최근 수정 일시. 이 속성이 있어야 sitemap 생성할 때 편하다. 귀찮으면 글 생성일과 동일하게 두자.
- `tags:` 태그. 여러 개를 입력할 수 있고 chirpy 테마는 배포된 페이지의 TAGS 탭에서 태그별로 글을 분류해준다.
- `categories:` 태그와 비슷한데 역시 chirpy에서 카테고리별 분류를 해준다. 폴더랑 비슷한 성격인듯
- `lang:` 다국어 지원을 하려면 필요하다. \_config.yml의 `language` 속성에 array로 들어간 언어 속성을 loop로 돌면서 각 언어별 페이지를 생성하기 때문이다.
- `permalink:` \_config.yml에서 설정한 전역 `permalink` 속성을 덮어쓰는 속성이다.
- `pin:`, `math:`, `mermaid:` 각각 부가적인 기능을 제공하는데 chirpy테마에 예시로 딸려온 포스트들에 모두 `true`로 돼있다.

이제 아래 템플릿을 복붙해서 각 속성을 채우자. 나는 마크다운 에디터로 [Obsidian](https://obsidian.md/)을 사용하는데 &#123;&#123;date&#125;&#125;와 &#123;&#123;time&#125;&#125;을 입력하고 템플릿으로 사용하면 글 생성 당시의 시간으로 타임스탬프처럼 입력된다.

``` shell
---
title: 
tags: 
categories: 
createdAt: {% raw %}{{ date }} {{ time }}{% endraw %}
lastmod:  {% raw %}{{ date }} {{ time }}{% endraw %}
lang: ko
permalink: /posts/
pin: true
math: true
mermaid: true
---
```

# 3. 저장, 푸시, 빌드, 배포
위에서 말한 대로 .md파일을 로컬의 루트폴더/\_posts 안에 넣고 먼저 로컬에서만 빌드하고 확인해보자.
```shell
bundle exec jekyll serve
```
localhost:4000으로 이동해서 확인하고 포스팅이 올바르게 표시되면 푸시하고 자동으로 빌드, 배포된 페이지를 확인해보자.

# 이어지는 글
(4) [다국어 지원하기](https://hionpu.com/posts/github_blog_4) 