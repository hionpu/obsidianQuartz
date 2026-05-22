---
type: reference
title: Obsidian AI 연결 설정 가이드
tags:
  - Obsidian
  - AI
  - 연결
  - 설정
  - Claude
  - Gemini
categories: []
createdAt: 2025-05-26 14:44
lastmod: 2025-05-26 14:44
lang: ko
pin: true
math: true
mermaid: true
permalink: /obsidian-ai-connection-guide
---


# Obsidian AI 연결 설정 가이드

Obsidian을 Claude와 Gemini AI에 연결하여 강력한 노트 작성 환경을 구축하는 방법입니다.

## 1. Claude와 Obsidian 연결

### 필요한 플러그인 설치

1.  **MCP Tools 플러그인**
    *   Obsidian → Settings → Community plugins → Browse
    *   "MCP Tools" 검색 후 설치 및 활성화
2.  **Local REST API 플러그인**
    *   Obsidian → Settings → Community plugins → Browse
    *   "Local REST API" 검색 후 설치 및 활성화

### API 키 설정

1.  **Obsidian에서 API 키 생성**
    *   Settings → Local REST API 설정
    *   API Key 생성 (또는 기존 키 확인)
2.  **Claude Desktop 설정**
    *   Claude Desktop 폴더에서 `claude_desktop_config.json` 파일 열기
    *   API Key 추가:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "obsidian-local-rest-api",
      "args": ["--api-key", "YOUR_API_KEY_HERE"]
    }
  }
}
```



## 2. Gemini와 Obsidian 연결

### 플러그인 설치

1.  **Gemini Scribe 플러그인**
    *   Obsidian → Settings → Community plugins → Browse
    *   "Gemini Scribe" 검색 후 설치 및 활성화

### API 키 설정

1.  **Google AI Studio에서 API Key 발급**
    *   https://aistudio.google.com/apikey 방문
    *   새 API 키 생성
2.  **Obsidian에서 API Key 설정**
    *   Settings → Gemini Scribe 설정
    *   발급받은 API Key 입력