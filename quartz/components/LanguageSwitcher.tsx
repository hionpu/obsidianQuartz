import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { useRouter } from 'preact-router'
import FlagIcon from './icons/FlagIcon'
import './LanguageSwitcher.css'

export const LanguageSwitcher = () => {
  const router = useRouter()
  const [currentPath, setCurrentPath] = useState('/')
  const [currentLang, setCurrentLang] = useState<'ko' | 'en'>('ko')

  useEffect(() => {
    setCurrentPath(router.current)
    setCurrentLang(router.current.startsWith('/en/') ? 'en' : 'ko')
  }, [router.current])

  const handleLanguageSwitch = () => {
    if (currentLang === 'en') {
      const newPath = currentPath.replace('/en/', '/')
      router.set(newPath)
      setCurrentLang('ko')
    } else {
      const newPath = `/en${currentPath}`
      router.set(newPath)
      setCurrentLang('en')
    }
  }

  return (
    <button
      onClick={handleLanguageSwitch}
      class="language-switcher"
      aria-label="언어 변경"
    >
      {currentLang === 'ko' ? <span>🇰🇷</span> : <span>🇺🇸</span>}
    </button>
  )
} 