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

import styles from '@/app/styles/shared.module.css'import { useI18n } from '@/i18n/context'interface SearchBarProps {  searchTerm: string  onSearchChange: (value: string) => void  onSearch: () => void  placeholder?: string}export function SearchBar({   searchTerm,   onSearchChange,   onSearch,  placeholder = "搜索图片..."}: SearchBarProps) {  const { t } = useI18n()  return (    <div className={styles.searchGroup}>      <input        type="text"        placeholder={t('manage.filter.search')}        value={searchTerm}        onChange={(e) => onSearchChange(e.target.value)}        className={styles.searchInput}      />      <button         onClick={onSearch}        className={`${styles.button} ${styles.buttonSearch}`}      >        {t('common.search')}      </button>    </div>  )}