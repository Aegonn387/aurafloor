"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseInfiniteScrollProps<T> {
  initialItems: T[]
  itemsPerPage?: number
  loadMoreItems?: (page: number) => Promise<T[]>
}

export function useInfiniteScroll<T>({
  initialItems,
  itemsPerPage = 12,
  loadMoreItems
}: UseInfiniteScrollProps<T>) {
  const [items, setItems] = useState<T[]>(initialItems)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Load more items
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      if (loadMoreItems) {
        // Load from API/database
        const newItems = await loadMoreItems(page + 1)
        if (newItems.length === 0) {
          setHasMore(false)
        } else {
          setItems(prev => [...prev, ...newItems])
          setPage(prev => prev + 1)
        }
      } else {
        // Simulate loading from initial data
        const startIndex = page * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const newItems = initialItems.slice(startIndex, endIndex)
        
        if (newItems.length === 0) {
          setHasMore(false)
        } else {
          setItems(prev => [...prev, ...newItems])
          setPage(prev => prev + 1)
        }
      }
    } catch (error) {
      console.error('Error loading more items:', error)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, itemsPerPage, initialItems, loadMoreItems])

  // Set up intersection observer
  useEffect(() => {
    if (!loadMoreRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loading, loadMore])

  return {
    items,
    loading,
    hasMore,
    loadMoreRef,
    loadMore
  }
}
