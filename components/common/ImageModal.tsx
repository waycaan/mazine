/**
 * Mazine - Image Hosting
 * https://github.com/waycaan/mazine
 * 
 * @file Core Component - Image Modal
 * @description Image preview modal component
 * @copyright (C) 2024 Mazine by waycaan
 * @license GNU GPL v3.0
 * @version 1.0.0
 * @author waycaan
 */

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
  id: 'mazine-core-imagemodal-v1.0.0',
  name: 'ImageModal',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

import styles from '@/app/styles/shared.module.css'
import { useI18n } from '@/i18n/context'

interface ImageModalProps {
  imageUrl: string
  onClose: () => void
}

export function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  const { t } = useI18n()

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent}>
        <button className={styles.modalClose} onClick={onClose}>×</button>
        <img src={imageUrl} alt="Preview" />
        <p className={styles.modalFileName}>
          {decodeURIComponent(imageUrl.split('/').pop() || '')}
        </p>
      </div>
    </div>
  )
} 
