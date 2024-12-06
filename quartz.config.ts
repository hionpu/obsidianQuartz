import { defineConfig } from './quartz/bootstrap-cli.mjs'

export default defineConfig({
  // ... 기존 설정 ...
  defaultLanguage: 'ko',
  languages: ['ko', 'en'],
  i18n: {
    ko: {
      // 한국어 관련 설정
    },
    en: {
      // 영어 관련 설정
    }
  },
  configuration: {
    pageLayout: {
      "/": {
        defaultLayout: "layout",
        components: {
          beforeBody: ["Graph", "TagList"],
          afterBody: ["BackLinks", "TableOfContents"],
        },
      },
      "/en/": {
        defaultLayout: "layout",
        components: {
          beforeBody: ["Graph", "TagList"],
          afterBody: ["BackLinks", "TableOfContents"],
        },
      },
    },
  },
})
