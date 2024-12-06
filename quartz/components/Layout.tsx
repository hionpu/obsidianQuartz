import { FunctionComponent } from 'preact'
import { LanguageSwitcher } from './LanguageSwitcher'

interface LayoutProps {
  children: preact.ComponentChildren
  lang: string
}

export const Layout: FunctionComponent<LayoutProps> = ({ children, lang }) => {
  return (
    <div class="layout">
      <header>
        {/* 기존 헤더 내용 */}
        <LanguageSwitcher currentLang={lang} />
      </header>
      <main>
        {children}
      </main>
      <footer>
        {/* 푸터 내용 */}
      </footer>
    </div>
  )
} 