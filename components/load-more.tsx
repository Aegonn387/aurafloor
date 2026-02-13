"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoadMoreProps {
  loading: boolean
  hasMore: boolean
  onLoadMore?: () => void
  observerRef?: React.RefObject<HTMLDivElement>
}

export function LoadMore({ loading, hasMore, onLoadMore, observerRef }: LoadMoreProps) {
  if (!hasMore && !loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>You've reached the end</p>
      </div>
    )
  }

  return (
    <div ref={observerRef} className="py-8 flex justify-center">
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading more...</span>
        </div>
      ) : (
        onLoadMore && (
          <Button onClick={onLoadMore} variant="outline" size="lg">
            Load More
          </Button>
        )
      )}
    </div>
  )
}
