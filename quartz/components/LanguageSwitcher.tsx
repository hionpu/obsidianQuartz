import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/LanguageSwitcher.scss"

export default (() => {
  function LanguageSwitcher(props: QuartzComponentProps) {
    const { fileData, cfg } = props;
    const lang = fileData.frontmatter?.lang;
    const defaultLang = cfg.locale?.split('-')[0] || 'en';
    
    return (
      <button
        class="language-switcher"
        aria-label="언어 변경"
      >
        <span class="lang-text">{lang === 'ko' ? 'KR' : 'EN'}</span>
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
      const isKorean = currentPath.startsWith('/ko/')
      const isEnglish = currentPath.startsWith('/en/')
      
      // Update button text based on current language
      if (isKorean) {
        langText.textContent = 'KR'
      } else if (isEnglish) {
        langText.textContent = 'EN'
      } else {
        // Default language (likely Korean based on your setup)
        langText.textContent = 'KR'
      }

      const switchLanguage = async () => {
        const currentPath = window.location.pathname
        let newPath = '';
        
        if (currentPath.startsWith('/ko/')) {
          // Switch from Korean to English
          newPath = currentPath.replace('/ko/', '/en/')
        } else if (currentPath.startsWith('/en/')) {
          // Switch from English to Korean (default)
          newPath = currentPath.replace('/en/', '/')
        } else {
          // Current page is default language (Korean), switch to English
          newPath = '/en' + currentPath
        }
        
        try {
          const response = await fetch(newPath)
          if (response.ok) {
            window.location.href = newPath + window.location.search
          } else {
            console.log('해당 언어 버전의 페이지가 존재하지 않습니다.')
          }
        } catch (error) {
          console.log('해당 언어 버전의 페이지가 존재하지 않습니다.')
        }
      }

      langBtn.addEventListener("click", switchLanguage)
      window.addCleanup(() => langBtn.removeEventListener("click", switchLanguage))
    })
  `

  return LanguageSwitcher
}) satisfies QuartzComponentConstructor 