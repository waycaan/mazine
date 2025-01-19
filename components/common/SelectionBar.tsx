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

const COMPONENT_INFO = {
  id: 'mazine-core-selectionbar-v1.0.0',
  name: 'SelectionBar',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

import styles from '@/app/styles/shared.module.css'
import { ViewMode } from '@/types/view'
import { useI18n } from '@/i18n/context'

interface SelectionBarProps {
  selectedCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onInvertSelection: () => void
  onDeleteSelected?: () => void
  onLikeSelected?: () => void
  onUnlikeSelected?: () => void
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  showDeleteButton?: boolean
  showLikeButton?: boolean
  showViewModeToggle?: boolean
  showLiked?: boolean
  onShowLikedChange?: (show: boolean) => void
}

export function SelectionBar({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onInvertSelection,
  onDeleteSelected,
  onLikeSelected,
  onUnlikeSelected,
  viewMode,
  onViewModeChange,
  showDeleteButton = true,
  showLikeButton = true,
  showViewModeToggle = true,
  showLiked,
  onShowLikedChange
}: SelectionBarProps) {
  const { t } = useI18n()

  return (
    <div className={styles.selectionGroup}>
      {showViewModeToggle && viewMode && onViewModeChange && (
        <button
          onClick={() => onViewModeChange(viewMode === 'grid' ? 'timeline' : 'grid')}
          className={`${styles.button} ${styles.buttonSelect}`}
        >
          <span className={viewMode === 'grid' ? styles.timelineIcon : styles.gridIcon} />
        </button>
      )}
      
      {showLiked !== undefined && onShowLikedChange && (
        <label className={styles.uploadOptionLabel}>
          <button
            type="button"
            className={`${styles.toggleSwitch} ${showLiked ? styles.checked : ''}`}
            onClick={() => onShowLikedChange(!showLiked)}
            aria-label={t('manage.filter.showLiked')}
          />
          {t('manage.filter.showLiked')}
        </label>
      )}
      
      <button 
        onClick={onSelectAll}
        className={`${styles.button} ${styles.buttonSelect}`}
      >
        {t('manage.selection.all')}
      </button>
      
      <button 
        onClick={onDeselectAll}
        className={`${styles.button} ${styles.buttonSelect}`}
      >
        {t('manage.selection.none')}
      </button>
      
      <button 
        onClick={onInvertSelection}
        className={`${styles.button} ${styles.buttonSelect}`}
      >
        {t('manage.selection.invert')}
      </button>

      {selectedCount > 0 && (
        <>
          {showLikeButton && onLikeSelected && (
            <button 
              onClick={onLikeSelected}
              className={`${styles.button} ${styles.greenButton}`}
            >
              {t('manage.actions.likeSelected', { count: selectedCount })}
            </button>
          )}
          
          {showDeleteButton && onDeleteSelected && (
            <button 
              onClick={onDeleteSelected}
              className={`${styles.button} ${styles.redButton}`}
            >
              {t('manage.actions.deleteSelected', { count: selectedCount })}
            </button>
          )}
          
          {onUnlikeSelected && (
            <button 
              onClick={onUnlikeSelected}
              className={`${styles.button} ${styles.redButton}`}
            >
              {t('manage.actions.unlikeSelected', { count: selectedCount })}
            </button>
          )}
        </>
      )}
    </div>
  )
} 
