/**
 * Copyright 2024 waycaan
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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