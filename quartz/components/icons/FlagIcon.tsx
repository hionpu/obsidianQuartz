import { h } from 'preact'

const FlagIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* 예시: 한국 국기 (태극기) SVG */}
    <rect width="24" height="24" fill="#FFFFFF" />
    <circle cx="12" cy="12" r="6" fill="#CD2E3A" />
    <path d="M12 6V18M6 12H18" stroke="#003478" strokeWidth="2" />
  </svg>
)

export default FlagIcon 