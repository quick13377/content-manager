'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Maximize2, Minimize2, Clock } from 'lucide-react'
import { useToast } from "@/components/ui/toast"
import Image from 'next/image'
import { parseISO, isWithinInterval, format } from 'date-fns'

interface ContentItem {
  id: string
  title: string
  type: 'image' | 'webpage' | 'text' | 'video' // Ensure 'video' type is included
  content: string
  startDateTime: string // ISO 8601 format
  endDateTime: string // ISO 8601 format
  tags: string[]
}

const FullScreenContent = React.memo(({ item, isFullScreen, onToggleFullScreen }: { 
  item: ContentItem; 
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
}) => {
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
          <div className="max-w-3xl mx-auto p-8 overflow-auto h-full">
            <h2 className="text-2xl font-bold mb-4">{item.title}</h2>
            <p className="text-gray-600">{item.content}</p>
          </div>
        )
      case 'video': // Updated case for video to show thumbnail or iframe
        const isYouTubeLink = item.content.includes('youtube.com') || item.content.includes('youtu.be');
        if (isYouTubeLink) {
          const videoId = item.content.split('v=')[1]?.split('&')[0]; // Extract video ID from URL
          return (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`} // Enable autoplay and mute
              title={item.title}
              frameBorder="0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              playsInline
            />
          );
        } else {
          return (
            <video
              width="100%"
              height="100%"
              src={item.content}
              controls
              autoPlay // Enable autoplay
              muted // Mute the video for autoplay to work in most browsers
              playsInline
            />
          );
        }
      case 'youtube': // Handle YouTube video type
        return (
          <iframe
            width="100%"
            height="100%"
            src={item.content.includes("youtube.com") ? item.content.replace("watch?v=", "embed/") + "?autoplay=1&mute=1" : item.content} // Convert YouTube link and enable autoplay
            title={item.title}
            frameBorder="0"
            allow="autoplay; encrypted-media; picture-in-picture" // Added picture-in-picture
            allowFullScreen
            playsInline // Add playsInline for mobile compatibility
          />
        )
    }
  }

  return (
    <div className={`fixed inset-0 bg-black z-50 flex items-center justify-center ${isFullScreen ? '' : 'p-4'}`}>
      {renderContent()}
      <button 
        onClick={onToggleFullScreen}
        className={`absolute ${isFullScreen ? 'top-2 right-2 opacity-30 hover:opacity-50' : 'top-4 right-4'} transition-opacity duration-300 bg-transparent border-none cursor-pointer`}
      >
        {isFullScreen ? <Minimize2 className="h-3 w-3 text-white" /> : <Maximize2 className="h-3 w-3 text-white" />}
      </button>
    </div>
  )
})

FullScreenContent.displayName = 'FullScreenContent'

export default function ContentViewer() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const { toast } = useToast()

  const loadItems = useCallback(() => {
    try {
      const saved = localStorage.getItem('contentItems')
      if (saved) {
        const parsedItems = JSON.parse(saved)
        setItems(parsedItems)
      }
    } catch (error) {
      console.error('Error loading content items:', error)
      toast({
        title: "Error",
        description: "Failed to load content items. Please try refreshing the page.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false); // Ensure loading state is set to false here
    }
  }, [toast])

  useEffect(() => {
    setIsLoading(true)
    loadItems()

    const refreshInterval = setInterval(loadItems, 60 * 1000) // Refresh every minute

    return () => clearInterval(refreshInterval)
  }, [loadItems])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000) // Update every second
    return () => clearInterval(timer)
  }, [])

  const visibleItems = useMemo(() => {
    return items.filter(item => {
      const start = parseISO(item.startDateTime)
      const end = parseISO(item.endDateTime)
      return isWithinInterval(currentDateTime, { start, end })
    })
  }, [items, currentDateTime])

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  }, []);

  // Improved slideshow functionality
  useEffect(() => {
    if (visibleItems.length === 0) return;

    const advanceSlide = () => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % visibleItems.length);
    };

    const slideshowInterval = setInterval(advanceSlide, 10000); // Change slide every 10 seconds

    return () => clearInterval(slideshowInterval);
  }, [visibleItems]);

  // Reset currentIndex if it's out of bounds
  useEffect(() => {
    if (currentIndex >= visibleItems.length) {
      setCurrentIndex(0);
    }
  }, [visibleItems, currentIndex]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>
  }

  if (visibleItems.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">No content available at this time.</div>
  }

  return (
    <div className="min-h-screen bg-black">
      {visibleItems.length > 0 && (
        <FullScreenContent 
          item={visibleItems[currentIndex]}
          isFullScreen={isFullScreen}
          onToggleFullScreen={toggleFullScreen}
        />
      )}
      {!isFullScreen && (
        <div className="fixed bottom-4 right-4 bg-white bg-opacity-75 p-2 rounded-md shadow-md">
          <div className="flex items-center space-x-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              {format(currentDateTime, "yyyy-MM-dd HH:mm:ss 'GMT'xxx")}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}