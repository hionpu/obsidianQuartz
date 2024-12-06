import { useCallback } from 'preact/hooks'
import { FunctionComponent } from 'preact'

interface LanguageSwitcherProps {
  currentLang: string
}

export const LanguageSwitcher: FunctionComponent<LanguageSwitcherProps> = ({ currentLang }) => {
  const switchLanguage = useCallback(() => {
    const currentPath = window.location.pathname
    // 루트 URL인 경우
    if (currentPath === '/') {
      window.location.href = currentLang === 'ko' ? '/en/' : '/'
      return
    }
    
    // 이미 /en/이 있는 경우
    if (currentPath.startsWith('/en/')) {
      window.location.href = currentPath.replace('/en/', '/')
    } else {
      // 일반 경로인 경우
      window.location.href = `/en${currentPath}`
    }
  }, [currentLang])

  return (
    <div class="language-switcher">
      <button 
        onClick={switchLanguage}
        class="language-button"
        aria-label={currentLang === 'ko' ? 'Switch to English' : '한국어로 전환'}
      >
        <img 
          src={currentLang === 'ko' 
            ? './static/images/gb-flag.svg' 
            : './static/images/kr-flag.svg'
          } 
          alt={currentLang === 'ko' ? 'English' : '한국어'}
          width="24"
          height="24"
        />
      </button>
    </div>
  )
} 