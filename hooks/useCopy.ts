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