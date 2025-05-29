<%*
// 현재 파일의 폴더 경로 가져오기
const currentFolder = tp.file.folder(true);
const allFiles = app.vault.getMarkdownFiles();

// 같은 폴더 내 파일들 필터링
const folderFiles = allFiles.filter(file => 
    file.parent?.path === currentFolder && 
    file.name !== tp.file.title + ".md"
);

// 관련 키워드 정의
const keywords = ['flask', 'python', 'postgresql', 'database', 'sqlalchemy', 'backend', 'web', 'api'];

// 각 파일의 heading과 제목 분석
const relatedFiles = [];

for (const file of folderFiles) {
    const content = await app.vault.read(file);
    const lines = content.split('\n').slice(0, 50); // 처음 50줄만 검사
    
    // H1, H2 heading 추출
    const headings = lines.filter(line => 
        line.match(/^#{1,2}\s+/) && !line.startsWith('###')
    );
    
    // 키워드 매칭 점수 계산
    let score = 0;
    const fileName = file.basename.toLowerCase();
    const allText = (fileName + ' ' + headings.join(' ')).toLowerCase();
    
    keywords.forEach(keyword => {
        if (allText.includes(keyword)) {
            score += 1;
        }
    });
    
    // 점수가 2 이상이면 관련 문서로 판단
    if (score >= 2) {
        relatedFiles.push({
            name: file.basename,
            score: score
        });
    }
}

// 점수 순으로 정렬
relatedFiles.sort((a, b) => b.score - a.score);

// 백링크 문자열 생성
const backlinks = relatedFiles.slice(0, 5) // 최대 5개까지
    .map(file => `  - "[[${file.name}]]"`)
    .join('\n');
_%>---
title: <% tp.file.title %>
tags:
  - python
  - flask
  - web-development
  - backend
categories: 
createdAt: <% tp.date.now("YYYY-MM-DD") %>
lastmod: <% tp.date.now("YYYY-MM-DD") %>
lang: ko
pin: false
math: false
mermaid: false
<%* if (relatedFiles.length > 0) { _%>related:
<% backlinks %>
<%* } _%>---

# <% tp.file.title %>

## 개요


## 주요 개념


## 코드 예시

```python

```

## 참고사항

