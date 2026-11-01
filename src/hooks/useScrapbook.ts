import { useCallback, useEffect, useState } from 'react'
import type { ScrapbookEntry } from '../types/bird'
import { deleteEntry, listEntries, saveEntry } from '../services/storage'

export function useScrapbook() {
  const [entries, setEntries] = useState<ScrapbookEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const next = await listEntries()
      setEntries(next)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const upsert = useCallback(
    async (entry: ScrapbookEntry) => {
      await saveEntry(entry)
      await refresh()
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteEntry(id)
      await refresh()
    },
    [refresh],
  )

  return { entries, loading, refresh, upsert, remove }
}
