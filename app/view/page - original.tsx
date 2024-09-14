'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Maximize2, Minimize2, X, Clock, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import Image from 'next/image'
import { parseISO, isWithinInterval, format } from 'date-fns'
import dynamic from 'next/dynamic'

const Grid = dynamic(() => import('react-window').then((mod) => mod.FixedSizeGrid), { ssr: false })
const AutoSizer = dynamic(() => import('react-virtualized-auto-sizer'), { ssr: false })

interface ContentItem {
  id: string
  type: 'image' | 'webpage' | 'text'
  content: string
  title: string
  startDateTime: string
  endDateTime: string
}

const ContentCard = React.memo(({ item, onFullScreen }: { item: ContentItem; onFullScreen: (item: ContentItem) => void }) => {
  const { toast } = useToast()

  const renderContent = () => {
    switch (item.type) {
      case 'image':
        return (
          <div className="relative w-full h-full">
            <Image
              src={item.content}
              alt={item.title}
              layout="fill"
              objectFit="contain"
              onError={() => toast({
                title: "Error",
                description: `Failed to load image: ${item.title}`,
                variant: "destructive",
              })}
            />
          </div>
        )
      case 'webpage':
        return (
          <iframe 
            src={item.content} 
            className="w-full h-full border-0" 
            title={item.title}
            sandbox="allow-scripts allow-same-origin"
          />
        )
      case 'text':
        return (
          <div className="w-full h-full overflow-hidden p-4 bg-white">
            <h2 className="text-lg font-semibold mb-2 truncate">{item.title}</h2>
            <p className="text-sm text-gray-600 line-clamp-3">{item.content}</p>
          </div>
        )
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 h-full relative group">
      {renderContent()}
      <Button 
        className="absolute top-2 right-2 bg-white bg-opacity-70 hover:bg-opacity-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        size="icon"
        variant="ghost"
        onClick={() => onFullScreen(item)}
      >
        <Maximize2 className="h-4 w-4" />
        <span className="sr-only">View Full Screen</span>
      </Button>
    </Card>
  )
})

ContentCard.displayName = 'ContentCard'

export default function ContentViewer() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [fullScreenItem, setFullScreenItem] = useState<ContentItem | null>(null)
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadItems = () => {
      setIsLoading(true)
      try {
        const saved = localStorage.getItem('contentItems')
        if (saved) {
          setItems(JSON.parse(saved))
        }
      } catch (error) {
        console.error('Error loading content items:', error)
        toast({
          title: "Error",
          description: "Failed to load content items. Please try refreshing the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadItems()
    window.addEventListener('storage', loadItems)
    return () => window.removeEventListener('storage', loadItems)
  }, [toast])

  useEffect(() => {
    setCurrentDateTime(new Date())
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000) // Update every second
    return () => clearInterval(timer)
  }, [])

  const isItemVisible = useCallback((item: ContentItem) => {
    if (!item.startDateTime || !item.endDateTime || !currentDateTime) {
      return false
    }
    try {
      const start = parseISO(item.startDateTime)
      const end = parseISO(item.endDateTime)
      return isWithinInterval(currentDateTime, { start, end })
    } catch (error) {
      console.error(`Error processing dates for item ${item.id}:`, error)
      return false
    }
  }, [currentDateTime])

  const visibleItems = useMemo(() => {
    return items.filter(isItemVisible)
  }, [items, isItemVisible])

  const renderFullScreenContent = useCallback(() => {
    if (!fullScreenItem) return null

    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        {fullScreenItem.type === 'image' && (
          <div className="relative w-full h-full">
            <Image
              src={fullScreenItem.content}
              alt={fullScreenItem.title}
              layout="fill"
              objectFit="contain"
              onError={() => toast({
                title: "Error",
                description: `Failed to load image: ${fullScreenItem.title}`,
                variant: "destructive",
              })}
            />
          </div>
        )}
        {fullScreenItem.type === 'webpage' && (
          <iframe 
            src={fullScreenItem.content} 
            className="w-full h-full border-0" 
            title={fullScreenItem.title}
            sandbox="allow-scripts allow-same-origin"
          />
        )}
        {fullScreenItem.type === 'text' && (
          <div className="max-w-3xl mx-auto p-8 overflow-auto h-full">
            <h2 className="text-2xl font-bold mb-4">{fullScreenItem.title}</h2>
            <p className="text-gray-600">{fullScreenItem.content}</p>
          </div>
        )}
      </div>
    )
  }, [fullScreenItem, toast])

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Content Viewer</h1>
            <div className="flex items-center space-x-2 text-gray-500">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {currentDateTime ? format(currentDateTime, "yyyy-MM-dd HH:mm:ss 'GMT'xxx") : ''}
              </span>
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <Skeleton key={index} className="h-48 w-full" />
              ))}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-lg mt-4">No content available at this time.</p>
              <p className="text-sm mt-2">Check back later for updates.</p>
            </div>
          ) : (
            <div className="h-[calc(100vh-200px)]">
              <AutoSizer>
                {({ height, width }) => (
                  <Grid
                    columnCount={Math.floor(width / 300)}
                    columnWidth={300}
                    height={height}
                    rowCount={Math.ceil(visibleItems.length / Math.floor(width / 300))}
                    rowHeight={200}
                    width={width}
                  >
                    {({ columnIndex, rowIndex, style }) => {
                      const index = rowIndex * Math.floor(width / 300) + columnIndex
                      const item = visibleItems[index]
                      if (!item) return null
                      return (
                        <div style={style}>
                          <ContentCard key={item.id} item={item} onFullScreen={setFullScreenItem} />
                        </div>
                      )
                    }}
                  </Grid>
                )}
              </AutoSizer>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={!!fullScreenItem} onOpenChange={() => setFullScreenItem(null)}>
        <DialogContent className="max-w-full max-h-full w-screen h-screen p-0">
          {renderFullScreenContent()}
        </DialogContent>
      </Dialog>
    </div>
  )
}