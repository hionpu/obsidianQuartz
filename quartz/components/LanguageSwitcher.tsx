import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/LanguageSwitcher.css"

export default (() => {
  function LanguageSwitcher(_props: QuartzComponentProps) {
    return (
      <button
        class="language-switcher"
        aria-label="언어 변경"
      >
        <span class="lang-text">KR</span>
      </button>
    )
  }

  LanguageSwitcher.css = style

  LanguageSwitcher.afterDOMLoaded = `
    document.addEventListener("nav", () => {
      const langBtn = document.querySelector(".language-switcher")
      const langText = document.querySelector(".lang-text")
      if (!langBtn || !langText) return

      const currentPath = window.location.pathname
      const isEnglish = currentPath.startsWith('/en/')
      langText.textContent = isEnglish ? 'EN' : 'KR'

      const switchLanguage = async () => {
        const currentPath = window.location.pathname
        
        if (currentPath.startsWith('/en/')) {
          const newPath = currentPath.replace('/en/', '/')
          window.location.href = newPath + window.location.search
        } else {
          // 영어 버전 페이지 존재 여부 확인
          const enPath = '/en' + currentPath
          try {
            const response = await fetch(enPath)
            if (response.ok) {
              window.location.href = enPath + window.location.search
            }
          } catch (error) {
            console.log('영어 버전 페이지가 존재하지 않습니다.')
          }
        }
      }

      langBtn.addEventListener("click", switchLanguage)
      window.addCleanup(() => langBtn.removeEventListener("click", switchLanguage))
    })
  `

  return LanguageSwitcher
}) satisfies QuartzComponentConstructor 