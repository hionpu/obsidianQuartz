---
id: "4a"
type: permanent
created: 2026-05-15
tags: [ai, claude-code, mcp, ctags]
up: "[[4 AI 워크플로우]]"
---

# 4a AI 코딩 도구 활용

핵심 통찰: **AI에게 컨텍스트를 주는 것이 곧 결과 품질을 결정한다.**
도구 설정보다 "무엇을 어떻게 보여주는가"가 더 중요.

## 컨텍스트 제공 방법론

### ctags (구조적 컨텍스트)
```bash
ctags -R --fields=+l --languages=python,javascript .
```
코드베이스 전체를 스캔해 심볼 인덱스 생성.
AI에게 파일 전체 대신 심볼 구조만 제공 → 토큰 절약.

### MCP (도구 접근 컨텍스트)
AI가 직접 파일을 읽고, 명령을 실행하고, 외부 서비스에 접근 가능하게 하는 프로토콜.
Obsidian, Git, 브라우저, API 등을 AI 워크플로우에 통합.

## Claude Code 운용 원칙
1. CLAUDE.md에 프로젝트 컨텍스트 문서화
2. 복잡한 태스크는 서브에이전트로 분리
3. 긴 세션은 컨텍스트 압축(caveman mode 등)으로 관리

---


## 관련 레퍼런스
- [[AI 에게 `ctags` 로 효율적인 코드 컨텍스트 제공하기]]
- [[MCP Tools API 추가 및 수정하기 frontmatter 오류 수정]]
- [[Obsidian AI 연결 설정 가이드]]
