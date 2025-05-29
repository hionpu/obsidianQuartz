<%*
// 현재 폴더의 모든 파일 가져오기
const currentFolder = tp.file.folder(true);
const allFiles = app.vault.getMarkdownFiles();
const folderFiles = allFiles.filter(file => 
    file.parent?.path === currentFolder && 
    file.name !== tp.file.title + ".md"
);

// 파일명 기반으로 관련 파일 찾기
const keywords = ['flask', 'python', 'postgresql', 'database'];
const relatedFiles = folderFiles.filter(file => {
    const fileName = file.basename.toLowerCase();
    return keywords.some(keyword => fileName.includes(keyword));
});

const backlinks = relatedFiles
    .map(file => `  - "[[${file.basename}]]"`)
    .join('\n');
_%>---
title: <% tp.file.title %>
tags:
  - python
  - flask
categories: 
createdAt: <% tp.date.now("YYYY-MM-DD") %>
lastmod: <% tp.date.now("YYYY-MM-DD") %>
lang: ko
<%* if (relatedFiles.length > 0) { _%>related:
<% backlinks %>
<%* } _%>---

# <% tp.file.title %>

## 내용을 작성하세요

