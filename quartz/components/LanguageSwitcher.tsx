import { useCallback } from 'preact/hooks'
import { FunctionComponent } from 'preact'

interface LanguageSwitcherProps {
  currentLang: string
}

export const LanguageSwitcher: FunctionComponent<LanguageSwitcherProps> = ({ currentLang }) => {
  const switchLanguage = useCallback(() => {
    const currentPath = window.location.pathname
    let newPath = ''

    if (currentLang === 'ko') {
      // 한국어에서 영어로 전환
      if (currentPath === '/') {
        newPath = '/en/'
      } else {
        newPath = `/en${currentPath}`
      }
    } else {
      // 영어에서 한국어로 전환
      if (currentPath.startsWith('/en/')) {
        newPath = currentPath.replace('/en', '')
      } else if (currentPath === '/en') {
        newPath = '/'
      } else {
        newPath = currentPath
      }
    }

    window.location.href = newPath
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
            ? '/static/images/gb-flag.svg' 
            : '/static/images/kr-flag.svg'
          } 
          alt={currentLang === 'ko' ? 'English' : '한국어'}
          width="24"
          height="24"
        />
      </button>
    </div>
  )
} 