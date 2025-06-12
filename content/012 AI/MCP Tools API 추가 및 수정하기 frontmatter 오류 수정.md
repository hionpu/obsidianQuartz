---
title: MCP Tools API 추가 및 수정하기 frontmatter 오류 수정
tags:
  - MCP
  - Tools
  - API
  - Obsidian
  - Claude
  - 개발
  - TypeScript
  - frontmatter
  - 오류
  - 해결
createdAt: 2025-05-29 17:50
---
# Obsidian MCP Tools에 새로운 API 추가하기 및 Frontmatter 오류 해결

> Claude Desktop과 Obsidian을 연결해주는 MCP Tools에 새로운 API를 추가합니다
> 기존에 클로드가 .md 파일을 읽을 때 frontmatter(마크다운 속성)에 접근하려고 하면 타입 문제로 에러가 발생하는 부분을 해결합니다.

## 🚀 개요

이 가이드에서는 Obsidian MCP Tools 프로젝트에서 다음과 같은 작업을 수행하는 방법을 설명합니다:

1. **새로운 API 추가**: `get_file_structure` - 마크다운 파일의 frontmatter와 헤딩을 추출하는 API
2. **Frontmatter 처리 오류 해결**: 기존 API들이 복잡한 frontmatter를 처리하지 못하는 문제 수정
3. **빌드 및 배포**: Claude Desktop이 업데이트된 API를 사용할 수 있도록 설정

## 📋 사전 준비사항

- [Bun](https://bun.sh/) 런타임 설치
- Obsidian MCP Tools 소스코드 클론
- TypeScript/JavaScript 기본 지식

```bash
# 프로젝트 클론
git clone https://github.com/jacksteamdev/obsidian-mcp-tools.git
cd obsidian-mcp-tools

# 의존성 설치
bun install
```

## 🔧 1. 새로운 API 추가하기

### 1.1 API 요구사항 정의

새로 추가할 `get_file_structure` API의 기능:
- 지정된 마크다운 파일의 frontmatter 추출
- 특정 레벨의 헤딩만 필터링하여 추출
- 각 헤딩의 줄 번호 정보 포함
> 참고로 클로드가 알아서 몇 단계의 헤딩 레벨을 추출할지 결정하더라구요. 물론 프롬프트에 명시할 수도 있어요.

### 1.2 API 구현

`packages/mcp-server/src/features/local-rest-api/index.ts` 파일에 다음 내용을 추가합니다:

```typescript
// GET File Structure (Frontmatter + Headings) 
tools.register(
  type({
    name: '"get_file_structure"',
    arguments: {
      filename: "string",
      "headingLevel?": "number",
    },
  }).describe(
    "Get the frontmatter and headings of a specified level from a markdown file. If no heading level is specified, returns all headings.",
  ),
  async ({ arguments: args }) => {
    // 유연한 스키마 사용 (frontmatter의 다양한 데이터 타입 지원)
    const data = await makeRequest(
      FlexibleNoteSchema,
      `/vault/${encodeURIComponent(args.filename)}`,
      {
        headers: { Accept: "application/vnd.olrapi.note+json" },
      },
    );

    // frontmatter 추출 (모든 데이터 타입 지원)
    const frontmatter = data.frontmatter || {};
    
    // 콘텐츠에서 헤딩 파싱
    const content = data.content || "";
    const lines = content.split('\n');
    const headings: Array<{ level: number; text: string; line: number }> = [];
    
    lines.forEach((line: string, index: number) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('#')) {
        const match = trimmedLine.match(/^(#+)\s*(.*)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2].trim();
          headings.push({
            level,
            text,
            line: index + 1
          });
        }
      }
    });

    // 레벨별 헤딩 필터링
    const filteredHeadings = args.headingLevel 
      ? headings.filter(heading => heading.level === args.headingLevel)
      : headings;

    // 응답 데이터 구성
    const result = {
      filename: args.filename,
      frontmatter,
      headings: filteredHeadings,
      totalHeadings: headings.length,
      filteredCount: filteredHeadings.length,
      ...(args.headingLevel && { requestedLevel: args.headingLevel })
    };

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);
```

### 1.3 API 응답 형식

```json
{
  "filename": "my-research.md",
  "frontmatter": {
    "title": "연구 노트",
    "tags": ["연구", "중요"],
    "published": true,
    "priority": 5
  },
  "headings": [
    {
      "level": 2,
      "text": "서론",
      "line": 8
    },
    {
      "level": 2, 
      "text": "본론",
      "line": 15
    }
  ],
  "totalHeadings": 12,
  "filteredCount": 2,
  "requestedLevel": 2
}
```

## 🐛 2. Frontmatter 처리 오류 해결

### 2.1 문제 상황

기존 MCP Tools의 API들(`get_active_file`, `get_vault_file` 등)이 다음과 같은 frontmatter를 처리할 때 오류가 발생했습니다:

```yaml
---
title: "문서 제목"        # ✅ 문자열
tags: [연구, 작업]        # ❌ 배열 (객체)
priority: 5              # ❌ 숫자
published: true          # ❌ 불린
categories: null         # ❌ null 값
---
```

**오류 메시지:**
```
frontmatter.tags must be a string (was an object)
frontmatter.priority must be a string (was number)
frontmatter.published must be a string (was boolean)
frontmatter.categories must be a string (was null)
```

### 2.2 원인 분석

기존 `LocalRestAPI.ApiNoteJson` 스키마가 frontmatter를 너무 제한적으로 정의:

```typescript
// 문제가 있는 기존 스키마
export const ApiNoteJson = type({
  content: "string",
  frontmatter: "Record<string, string>",  // ❌ 문자열만 허용
  // ...
});
```

### 2.3 해결 방법

#### 2.3.1 유연한 스키마 생성

파일 상단에 유연한 스키마를 정의합니다:

```typescript
// packages/mcp-server/src/features/local-rest-api/index.ts
import { makeRequest, type ToolRegistry } from "$/shared";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { type } from "arktype";
import { LocalRestAPI } from "shared";

// 유연한 노트 스키마 - 모든 frontmatter 데이터 타입 지원
const FlexibleNoteSchema = type({
  content: "string",
  frontmatter: "Record<string, unknown>", // ✅ 모든 값 타입 허용
  path: "string",
  stat: {
    ctime: "number",
    mtime: "number",
    size: "number",
  },
  tags: "string[]",
});
```

#### 2.3.2 기존 API 수정

**`get_active_file` 수정:**

```typescript
async ({ arguments: args }) => {
  const format = args?.format === "json"
    ? "application/vnd.olrapi.note+json"
    : "text/markdown";
    
  const data = await makeRequest(
    args?.format === "json" ? FlexibleNoteSchema : type("string"),
    "/active/",
    { headers: { Accept: format } }
  );
  
  const content = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text: content }] };
},
```

**`get_vault_file` 수정:**

```typescript
async ({ arguments: args }) => {
  const isJson = args.format === "json";
  const format = isJson ? "application/vnd.olrapi.note+json" : "text/markdown";
  
  const data = await makeRequest(
    isJson ? FlexibleNoteSchema : LocalRestAPI.ApiContentResponse,
    `/vault/${encodeURIComponent(args.filename)}`,
    { headers: { Accept: format } }
  );
  
  return {
    content: [{
      type: "text",
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    }],
  };
},
```

### 2.4 해결된 frontmatter 처리

이제 다음과 같은 복잡한 frontmatter를 올바르게 처리할 수 있습니다:

```yaml
---
title: "복잡한 문서"
tags: [연구, 중요, 프로젝트]    # ✅ 배열
author:                        # ✅ 객체
  name: "홍길동"
  email: "hong@example.com"
priority: 5                    # ✅ 숫자
published: true                # ✅ 불린
rating: 4.5                    # ✅ 실수
categories: null               # ✅ null
created: 2024-01-15           # ✅ 날짜
---
```

## 🔨 3. 빌드 및 배포

### 3.1 MCP 서버 빌드

```bash
# MCP 서버 디렉토리로 이동
cd packages/mcp-server

# 프로덕션 빌드 (최적화된 .exe 파일)
bun run build

# 개발용 빌드 (빠른 테스트용)
bun build ./src/index.ts --compile --outfile ../../bin/mcp-server
```

**빌드 결과:**
- `packages/mcp-server/dist/mcp-server.exe` (프로덕션용, ~111MB)
- `bin/mcp-server.exe` (개발용, ~111MB)

### 3.2 Obsidian 플러그인 빌드

```bash
# 플러그인 디렉토리로 이동
cd packages/obsidian-plugin

# 플러그인 빌드
bun run build

# 배포용 zip 파일 생성
bun run zip
```

**빌드 결과:**
- `main.js` - 컴파일된 플러그인 코드
- `manifest.json` - 플러그인 메타데이터
- `styles.css` - 플러그인 스타일
- `releases/obsidian-plugin-x.x.x.zip` - 배포용 압축파일

### 3.3 Claude Desktop에 배포

#### 3.3.1 자동 배포 (권장)

Obsidian에서 플러그인의 "Install Server" 버튼을 사용하면 자동으로:
1. MCP 서버 바이너리를 다운로드
2. Claude Desktop 설정 파일 업데이트
3. 필요한 권한 설정

#### 3.3.2 수동 배포

**1단계: 파일 교체**

```bash
# Obsidian 플러그인 폴더 위치 확인
# Windows: %VAULT_PATH%\.obsidian\plugins\obsidian-mcp-tools\

# MCP 서버 바이너리 교체
cp packages/mcp-server/dist/mcp-server.exe \
   "%VAULT_PATH%\.obsidian\plugins\obsidian-mcp-tools\bin\"

# 플러그인 파일들 교체
cp packages/obsidian-plugin/main.js \
   "%VAULT_PATH%\.obsidian\plugins\obsidian-mcp-tools\"
cp packages/obsidian-plugin/manifest.json \
   "%VAULT_PATH%\.obsidian\plugins\obsidian-mcp-tools\"
```

**2단계: Claude Desktop 설정 확인**

Claude Desktop 설정 파일 위치:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

설정 예시:
```json
{
  "mcpServers": {
    "obsidian-mcp-tools": {
      "command": "C:\\path\\to\\vault\\.obsidian\\plugins\\obsidian-mcp-tools\\bin\\mcp-server.exe",
      "env": {
        "OBSIDIAN_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**3단계: Claude Desktop 재시작**

1. Claude Desktop 완전 종료
2. Claude Desktop 재시작
3. 새로운 API 사용 가능 확인

### 3.4 배포 확인

Claude Desktop에서 다음과 같이 테스트:

```
get_file_structure 도구를 사용해서 "내-노트.md" 파일의 레벨 2 헤딩만 보여줘
```

예상 응답:
```json
{
  "filename": "내-노트.md",
  "frontmatter": {
    "title": "내 연구 노트",
    "tags": ["연구", "중요"]
  },
  "headings": [
    {"level": 2, "text": "서론", "line": 8},
    {"level": 2, "text": "결론", "line": 45}
  ],
  "totalHeadings": 8,
  "filteredCount": 2,
  "requestedLevel": 2
}
```

## 🧪 4. 개발 및 테스트

### 4.1 MCP Inspector로 디버깅

```bash
cd packages/mcp-server
bun run inspector
```

웹 브라우저에서 `http://localhost:3000`을 열어 API를 직접 테스트할 수 있습니다.

### 4.2 단위 테스트

```bash
# 전체 테스트 실행
bun test

# 특정 테스트 실행
bun test ./src/**/*.test.ts
```

### 4.3 개발 모드

```bash
# 자동 재빌드 모드
bun run dev
```

파일 변경 시 자동으로 재빌드됩니다.

## 📚 5. 추가 API 개발 가이드

### 5.1 새로운 API 추가 패턴

```typescript
tools.register(
  type({
    name: '"your_api_name"',
    arguments: {
      // 매개변수 정의
      param1: "string",
      "optionalParam?": "number",
    },
  }).describe("API 설명"),
  async ({ arguments: args }) => {
    // API 로직 구현
    const result = await processYourLogic(args);
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);
```

### 5.2 오류 처리

```typescript
import { formatMcpError } from "$/shared";

try {
  // API 로직
} catch (error) {
  throw formatMcpError(error);
}
```

### 5.3 타입 안전성

ArkType를 사용한 런타임 타입 검증:

```typescript
const MySchema = type({
  requiredField: "string",
  optionalField: "number?",
  arrayField: "string[]",
  objectField: {
    nestedField: "boolean",
  },
});
```

## 🎯 결론

이 가이드를 통해 다음을 학습했습니다:

1. **새로운 MCP API 개발**: `get_file_structure` API로 마크다운 파일 구조 분석
2. **Frontmatter 처리 개선**: 복잡한 YAML frontmatter의 모든 데이터 타입 지원
3. **배포 자동화**: Claude Desktop과의 원활한 통합

### 핵심 포인트

- ✅ **유연한 스키마 사용**: `Record<string, unknown>`으로 다양한 frontmatter 타입 지원
- ✅ **타입 안전성**: ArkType을 활용한 런타임 검증
- ✅ **모듈화**: 기능별로 분리된 코드 구조
- ✅ **배포 자동화**: 빌드부터 Claude 연동까지 원스톱

### 다음 단계

- 추가 API 개발 (파일 검색, 템플릿 처리 등)
- 성능 최적화
- 사용자 설정 옵션 확장
- 다국어 지원

이제 여러분도 Obsidian MCP Tools에 새로운 기능을 추가하고, Claude Desktop과의 강력한 연동을 구현할 수 있습니다! 🚀

---

**관련 링크:**
- [Obsidian MCP Tools GitHub](https://github.com/jacksteamdev/obsidian-mcp-tools)
- [Model Context Protocol 문서](https://modelcontextprotocol.io/)
- [Claude Desktop 다운로드](https://claude.ai/download)
- [Bun 공식 문서](https://bun.sh/docs) 