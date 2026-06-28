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

import { useState, useCallback } from 'react'
import { copyToClipboard } from '@/utils/clipboard'
export function useCopy(timeout: number = 2000) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  const copyText = useCallback(async (text: string, identifier: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedItem(identifier)
      setTimeout(() => setCopiedItem(null), timeout)
    }
    return success
  }, [timeout])
  return {
    copiedItem,
    copyText
  }
}