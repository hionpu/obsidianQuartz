import { useCallback } from 'preact/hooks'
import { FunctionComponent } from 'preact'

interface LanguageSwitcherProps {
  currentLang: string
}

export const LanguageSwitcher: FunctionComponent<LanguageSwitcherProps> = ({ currentLang }) => {
  const switchLanguage = useCallback((lang: string) => {
    const currentPath = window.location.pathname
    const newPath = currentLang === 'ko' 
      ? `/en${currentPath}`
      : currentPath.replace('/en/', '')
    window.location.href = newPath
  }, [currentLang])

  return (
    <div class="language-switcher">
      <button 
        onClick={() => switchLanguage(currentLang === 'ko' ? 'en' : 'ko')}
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