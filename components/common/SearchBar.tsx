import styles from '@/app/styles/shared.module.css'
import { useI18n } from '@/i18n/context'

interface SearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onSearch: () => void
  placeholder?: string
}

export function SearchBar({ 
  searchTerm, 
  onSearchChange, 
  onSearch,
  placeholder = "搜索图片..."
}: SearchBarProps) {
  const { t } = useI18n()
  
  return (
    <div className={styles.searchGroup}>
      <input
        type="text"
        placeholder={t('manage.filter.search')}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className={styles.searchInput}
      />
      <button 
        onClick={onSearch}
        className={`${styles.button} ${styles.buttonSearch}`}
      >
        {t('common.search')}
      </button>
    </div>
  )
} 