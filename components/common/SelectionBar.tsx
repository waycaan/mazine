/*
 * MIT License
 * 
 * Copyright (c) 2024 waycaan
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const COMPONENT_INFO = {
  id: 'mazine-core-selectionbar-v1.0.0',
  name: 'SelectionBar',
  author: 'waycaan',
  version: '1.0.0',
  license: 'MIT'
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
      {}
      <div className={styles.selectionButtonGroup}>
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
      </div>
      {}
      <div className={styles.selectionButtonGroup}>
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
      </div>
      {}
      {selectedCount > 0 && (
        <div className={styles.actionButtonGroup}>
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
        </div>
      )}
    </div>
  )
}