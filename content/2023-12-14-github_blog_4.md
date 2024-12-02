---
title: " GitHub 블로그 개설하기(4) - Polyglot으로 다국어 지원하기"
tags:
  - blog
  - chirpy
  - "#polyglot"
  - "#multilanguage"
categories:
  - "[GitHub, jekyll]"
createdAt: 2023-12-14 13:36
lastmod: 2023-12-14 13:36
lang: ko
permalink: /posts/github_blog_4
pin: true
math: true
mermaid: true
---

## 시리즈 포스트 링크
(1) [Repository 생성과 테스트 페이지 확인하기](https://hionpu.com/posts/github_blog_1)

(2) [Chirpy 테마 적용](https://hionpu.com/posts/github_blog_2) 

(3) [포스트 올리기](https://hionpu.com/posts/github_blog_3) 

<font size = "5">(4) 다국어 지원하기</font>

(5) [사이트맵 생성하기](https://hionpu.com/posts/github_blog_5) 

# 1. 머릿말
GPT한테 번역을 시키고 내가 어느 정도만 검수하면 영어 포스팅을 올리는게 어렵지 않기 때문에 영어권 유입을 위해 블로그에 다국어를 지원하려고 했다. 내 입장에서 다국어 지원이라 하면, 

1. 검색 엔진에서 해당 언어로 검색이 가능
2. 또는 한국어로 검색 결과로 나온 페이지더라도, 언어 변경 버튼으로 언어 변경이 가능

정도의 조건이 있고 여기에

- 한 사이트 내에서 permalink로 각 페이지를 관리할 수 있을 것

까지 충족되면 더 좋았다. 검색해보니 polyglot이라는 jekyll 플러그인을 사용하면 위 조건을 만족하는 다국어 지원을 할 수 있을 것 같았다.

# 2. Polyglot 플러그인 설치
## 2-1. 플러그인 설치
Shell의 `내_블로그_루트_디렉토리/` 에서 
```shell
gem install jekyll-polyglot
```
으로 플러그인을 설치한다. 

## 2-2. `_config.yml` 수정
설치 후에 `_config.yml`을 열고 다음과 같이`plugins:` 탭을 찾아서 `- jekyll-polyglot`을 추가해준다.
```shell
plugins:
	- jekyll-polyglot
```
언어 설정도 변경해야 하므로 `languages:` 탭을 찾아서 다음과 같이 변경한다.
```
languages: ["en", "ko"] # 지원하고자 하는 언어
default_lang: "ko" # 컨텐츠의 기본 언어
exclude_from_localization: ['javascript', 'images', 'css', 'sitemap.xml' # 루트 폴더 중 다국어 기능 제외 시킬 폴더
parallel_localizaion: false # 별 의미 없음
```
한국어, 영어 말고 다른 언어는 [List of ISO 639-1 codes - Wikipedia](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)여기에서 639-1을 보고 추가하면 된다.

# 3. `.md`파일 수정
앞서서 `_config.yml`의 `permalink:`를 다국어 지원을 위해서는 포스트마다 정해주어야 한다고 했는데 그 작업을 여기서 할 것이다. 업로드할 `yyyy-mm-dd-title` 형식의 `.md`파일의 property에 
```shell
lang: [해당 페이지의 언어]
permalink: [해당 페이지의 url]
```
을 넣어주면 된다. 예를 들어 지금 작성중인 이 포스트의 url은 기본 언어(`_config.yml`의 `default_lang`인 `ko`를 기준으로)`hionpu.com/posts/github_blog_4`인데 상대 경로를 지원하므로

```
---
    ...

lang: ko
permalink: /posts/github_blog_4

    ...
---

```

처럼 작성하면 되겠다. 영어도 `lang:` 부분만 `en`으로 바꿔주면 된다. 그러면 jekyll이 빌드할 때 한국어 페이지는
`hionpu.com/posts/github_blog_4`에 있고 영어 페이지는 `hionpu.com/en/posts/github_blog_4` 에 있게 된다.

그리고 일단 빌드해보자. 빌드가 잘 되고 로컬에서 각 언어에 대한 페이지가 잘 보이면 성공이다. 그러나 나는 에러가 발생했다.

<a name = "four"></a>
# 4. Polyglot 의존성 문제
![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/c9f5de67-c2b2-45e1-9bfd-00c92524ac97)
위와 같은 에러가 발생했는데

(텍스트)
>Dependency Error: Yikes! It looks like you don't have jekyll-polyglot or one of its dependencies installed. In order to use Jekyll as currently configured, you'll need to install this gem. If you've run Jekyll with `bundle exec`, ensure that you have included the jekyll-polyglot gem in your Gemfile as well. The full error message from Ruby is: 'cannot load such file -- jekyll-polyglot' If you run into trouble, you can find helpful resources at https://jekyllrb.com/help/!
>
C:/Users/user/.local/share/gem/ruby/3.2.0/gems/jekyll-4.3.2/lib/jekyll/external.rb:70:in `rescue in block in require_with_graceful_fail': jekyll-polyglot (Jekyll::Errors::MissingDependencyException)

polyglot의 의존성 문제로 보였다. 

gem을 업데이트하고, bundle과 polyglot도 업데이트 해보았지만 고쳐지지 않아서 오류 그대로 GPT한테 물어보았는데 Gemfile을 수정하라고 알려줬다. Gemfile을 편집기로 열고 내부에
```
gem "jekyll-polyglot"
```
를 추가했더니 해당 오류는 뜨지 않게 됐는데 다른 오류가 발생했다.

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/2118171b-7556-43b8-86b9-6ac2236cfc2b)

(텍스트)
> C:/Users/user/.local/share/gem/ruby/3.2.0/gems/jekyll-polyglot-1.7.0/lib/jekyll/polyglot/patches/jekyll/site.rb:215:in `relative_url_regex': target of repeat operator is not specified: /href="?\/((?:(?!*.gem)(?!*.gemspec)(?!docs)(?!tools)(?!README.md)(?!LICENSE)(?!rollup.config.js)(?!package*.json)(?!.sass-cache)(?!.jekyll-cache)(?!gemfiles)(?!Gemfile)(?!Gemfile.lock)(?!node_modules)(?!vendor\/bundle\/)(?!vendor\/cache\/)(?!vendor\/gems\/)(?!vendor\/ruby\/)(?!javascript)(?!images)(?!css)(?!ja\/)(?!ko\/)(?!en\/)[^,'"\s\/?.]+\.?)*(?:\/[^\]\[)("'\s]*)?)"/ (RegexpError)

regex = regular expression이고 실제로 <font color = "red">site.rb </font> 파일을 편집기로 열어서 해당 부분(215줄)로 가보면

```
def relative_url_regex(disabled = false)
  regex = ''
  unless disabled
    @exclude.each do |x|
      regex += "(?!#{x})"
    end
    @languages.each do |x|
      regex += "(?!#{x}\/)"
    end
  end
  start = disabled ? 'ferh' : 'href'
  %r{#{start}="?#{@baseurl}/((?:#{regex}[^,'"\s/?.]+\.?)*(?:/[^\]\[)("'\s]*)?)"}
end
```

과 같은 정규식이 포함된 함수가 있는데 이 부분에서 에러가 발생한다.

정규식을 잘 모르고 지금 배워서 해결하고 싶지는 않았기 때문에 GPT에게 질문, 직접 수정하라고 지시했더니 

```
def relative_url_regex(disabled = false)
  regex = ''
  unless disabled
    @exclude.each do |x|
      escaped_x = Regexp.escape(x)
      regex += "(?!#{escaped_x})"
    end
    @languages.each do |x|
      escaped_x = Regexp.escape(x)
      regex += "(?!#{escaped_x}\/)"
    end
  end
  start = disabled ? 'ferh' : 'href'
  %r{#{start}="?#{@baseurl}/((?:#{regex}[^,'"\s/?.]+\.?)*(?:/[^\]\[)("'\s]*)?)"}
end
```

로 수정해주었는데 바뀐 부분은
```
regex += "(?!#{x})"
```
와
```
regex += "(?!#{x}\/)"
```
에서 그냥 `x` 가 아닌

```
escaped_x = Regexp.escape(x)
regex += "(?!#{escaped_x})"
```

처럼 `Regexp.escape()`를 사용해서 `escaped_x`로 치환해주었다.

에러가 발생한 원인은 (GPT에 의하면) 정규표현식 자체가 원래 까다롭고, 버전이 변경됨에 따라 수정사항을 반영하지 못한것 때문일 수 있다고 한다. 그런데 내가 polyglot 적용을 위해 참고한 포스팅이 2023년 8월경에 작성된 것으로 기억하는데 몇달 사이에 변화가 있던 건가?

아무튼 위 수정사항을 적용하니 이번에는 동일한 <font color = "red">site.rb </font> 파일의 235번째 줄에서 에러가 발생했다. 생김새를 보니 비슷한 문제인 듯 했고 역시 GPT가 위와 같이 정규표현식을 수정해주었다.

__수정 전__
```
 def absolute_url_regex(url, disabled = false)
      regex = ''
      unless disabled
        @exclude.each do |x|
          regex += "(?!#{x})"
        end
        @languages.each do |x|
          regex += "(?!#{x}\/)"
        end
      end
      start = disabled ? 'ferh' : 'href'
      %r{(?<!hreflang="#{@default_lang}" )#{start}="?#{url}#{@baseurl}/((?:#{regex}[^,'"\s/?.]+\.?)*(?:/[^\]\[)("'\s]*)?)"}
    end
```

__수정 후__
```
def absolute_url_regex(url, disabled = false)
  regex = ''
  unless disabled
    @exclude.each do |x|
      escaped_x = Regexp.escape(x)
      regex += "(?!#{escaped_x})"
    end
    @languages.each do |x|
      escaped_x = Regexp.escape(x)
      regex += "(?!#{escaped_x}\/)"
    end
  end
  start = disabled ? 'ferh' : 'href'
  %r{(?<!hreflang="#{@default_lang}" )#{start}="?#{url}#{@baseurl}/((?:#{regex}[^,'"\s/?.]+\.?)*(?:/[^\]\[)("'\s]*)?)"}
end
```

적용하고 나니 
![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/fef41fa3-8a97-49e9-ac25-031ffe1dc1b4)
빌드가 잘 됐고

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/f715ed0f-353a-44f5-9912-41845ab9a0d8)
한글컨텐츠와 영어컨텐츠가 한 게시물에서 버전만 달리하여 잘 표시된다.

만약 본인의 블로그가 로컬에서 `_site`의 내용물을 빌드하고, 이것을 리모트에 푸시해서 배포하는 방식이라면 위 방법이 먹힐 것이다. 그러나 Chirpy 테마는 GitHub Action을 통해 리모트에서 별도로 빌드하고 만들어진 `_site` 를 배포하므로 이 방법은 먹히지 않는다.
# 5. GitHub 빌드에서 오류 발생하는 경우

## 5-1. 원인
GitHub Action 으로 빌드, 배포하는 Chirpy는 위 방법대로 해도 결국 Action 탭의 빌드 과정에서 아까와 같은 에러를 뱉는다.

방금 말한 대로 로컬에서 수정하더라도 GitHub Action으로 빌드할 때 로컬에서 푸시한 `Gemfile`을 참조해서 Ubuntu 가상머신에 플러그인을 새로 불러오므로 로컬에서 수정한 사항은 반영될 수가 없기 때문이다. 그럼 어쩌라고? 

## 5-2. Ubuntu 가상 환경에서도 수정한 플러그인 사용하도록 설정

[4. Polyglot 의존성 문제](#four)에서 Gemfile에 polyglot을 추가했는데, 이렇게 추가한 플러그인은 기본적으로 해당 플러그인의 Git repository를 참조해서 사용하는 것 같다. Gemfile의 polyglot 플러그인 부분을

```shell
gem 'jekyll-polyglot', git: 'https://github.com/hionpu/polyglot', branch: 'master'
```
위와 같이 수정하게 되면 이제 polyglot 플러그인을 `https://github.com/hionpu/polyglot` repository의  `master` 브랜치를 참조하도록 할 수 있다. 그러면 이제 나만의 polyglot repository가 생겼으니 이것을 clone ⟶ 수정 ⟶ push 하면 나만의 polyglot 플러그인을 리모트에서 빌드할 때도 사용할 수 있게 된다. 

당연히 위의 Gemfile 수정내역을 복붙해서 내가(작성자) 수정한 polyglot을 사용해도 좋다. 또는

> [untra/polyglot: :abc: Multilingual and i18n support tool for Jekyll Blogs (github.com)](https://github.com/untra/polyglot/tree/master)
{: .prompt-info}

polyglot 플러그인의 원본 repository에서 fork하고 로컬에 clone해서 본인이 직접 수정한 뒤에 그 repository를 참조하도록 해도 되겠다.

위 과정을 모두 마쳤으면
```shell
bundle
```
한번 해주고 블로그를 푸시해서 빌드와 배포가 잘 되는지 보자.

> 또 다른 에러가 나타나면 댓글로 문의해 주세요. 최대한 답변해보겠습니다.
{: .prompt-info}

# 다음 글
(5) [사이트맵 생성하기](https://hionpu.com/posts/github_blog_5) 