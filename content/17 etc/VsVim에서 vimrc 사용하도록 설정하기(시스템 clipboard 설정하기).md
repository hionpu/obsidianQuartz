---
type: reference
title: VsVim에서 vimrc 사용하도록 설정하기(시스템 clipboard 설정하기)
tags: 
categories: 
createdAt: 2025-06-24 16:44
lastmod: 2025-06-24 16:44
lang: ko
pin: true
math: true
mermaid: true
permalink:
---
# VsVim에서 vimrc 파일 설정하기

Visual Studio에서 VsVim을 사용하다 보면 자신만의 vim 설정을 적용하고 싶을 때가 있습니다. 하지만 `:set vimrc` 명령어를 실행했을 때 `vimrc=""`로 나타나며 설정 파일이 로드되지 않는 경우가 종종 있어요. 이런 문제를 해결하는 방법을 정리해보겠습니다.

## VsVim의 vimrc 파일 로딩 방식

VsVim은 기본적으로 다음과 같은 순서로 vimrc 파일을 찾습니다:

### 파일명 우선순위

1. `.vsvimrc`
2. `_vsvimrc`
3. `.vimrc`
4. `_vimrc`

### 검색 경로

- `%HOME%`
- `%VIM%`
- `%USERPROFILE%` (일반적으로 `C:\Users\[사용자명]`)

## vimrc가 로드되지 않을 때 해결 방법

### 1. VsVim 설정 확인하기

먼저 VsVim이 vimrc 파일을 로드하도록 설정되어 있는지 확인해야 합니다.

1. **Tools → Options** 메뉴로 이동
2. **VsVim → Defaults** 섹션 선택
3. **"VimRc File Loading"** 옵션을 다음 중 하나로 설정:
    - **"Default"**: .vimrc와 .vsvimrc 파일 모두 로드
    - **"vsvimrc only"**: .vsvimrc 파일만 로드
    - ⚠️ **"None"**으로 설정되어 있다면 이것이 문제의 원인입니다!

### 2. 검색 경로 확인하기

VsVim이 실제로 어떤 경로에서 파일을 찾고 있는지 확인할 수 있어요:

```vim
:set vimrcpaths
```

이 명령어를 실행하면 VsVim이 검색하는 모든 경로와 파일명을 보여줍니다.

### 3. vimrc 파일 생성 및 배치

가장 간단한 해결책은 사용자 프로필 디렉토리에 `.vsvimrc` 파일을 생성하는 것입니다.

1. 파일 탐색기에서 `C:\Users\[사용자명]\` 경로로 이동
2. `.vsvimrc` 파일 생성 (확장자 없음)
3. 원하는 vim 설정을 작성

**예시 .vsvimrc 내용:**

```vim
set number
set relativenumber
set ignorecase
set smartcase
set backspace=indent,eol,start
```

### 4. Visual Studio 재시작

vimrc 파일을 생성하거나 수정한 후에는 Visual Studio를 완전히 재시작해야 합니다. VsVim은 시작할 때만 vimrc 파일을 로드하기 때문이에요.

### 5. 설정 확인하기

재시작 후 다음 명령어들로 설정이 제대로 적용되었는지 확인할 수 있습니다:

```vim
:set vimrc          # 로드된 vimrc 파일 경로 확인
:set number?        # 특정 설정값 확인
```

## 추가 팁

### vimrc 로딩 비활성화하기

만약 기본 vimrc 로딩을 비활성화하고 싶다면:

- **Tools → Options → VsVim → Defaults**
- **"VimRc File Loading"**을 **"None"**으로 설정

### VsVim 전용 설정 파일 사용하기

일반 vim과 다른 설정을 사용하고 싶다면 `.vsvimrc` 파일을 사용하는 것이 좋습니다. 이 파일은 VsVim에서만 사용되므로 Visual Studio 환경에 최적화된 설정을 따로 관리할 수 있어요.

