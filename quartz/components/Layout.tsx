import { LanguageSwitcher } from './LanguageSwitcher'

// Layout 컴포넌트 내부
return (
  <div class="layout">
    <header>
      // ... existing header content ...
      <LanguageSwitcher currentLang={props.lang || 'ko'} />
    </header>
    // ... rest of layout ...
  </div>
) 