"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import SlideRenderer from '@/components/SlideRenderer';
import PlayChatbot from '@/components/PlayChatbot';
import { presentationHelpers, presentationCache } from '@/lib/mindcache-store';
import { Presentation } from '@/lib/types';

export default function PlayPage() {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [splitPosition, setSplitPosition] = useState(66.67); // Percentage for desktop - 2/3
  const [mobileSplitPosition, setMobileSplitPosition] = useState(66.67); // Percentage for mobile - 2/3
  const [isDragging, setIsDragging] = useState(false);
  const [isMobileDragging, setIsMobileDragging] = useState(false);
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedFromUrl, setLoadedFromUrl] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadFromUrl = async () => {
      // Check for URL parameter
      const params = new URLSearchParams(window.location.search);
      const prezUrl = params.get('url');
      
      if (prezUrl) {
        setIsLoadingFromUrl(true);
        setLoadedFromUrl(true);
        setLoadError(null);
        
        try {
          const response = await fetch(prezUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch presentation: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          // Load into MindCache
          presentationCache.clear();
          presentationCache.update(data);
          
          setIsLoadingFromUrl(false);
        } catch (error) {
          console.error('Error loading presentation from URL:', error);
          setLoadError(error instanceof Error ? error.message : 'Failed to load presentation');
          setIsLoadingFromUrl(false);
        }
      }
    };

    loadFromUrl();
  }, []);

  useEffect(() => {
    const loadPresentation = () => {
      const prez = presentationHelpers.getPresentation();
      setPresentation(prez);
    };

    loadPresentation();

    const handleMindCacheUpdate = () => {
      loadPresentation();
    };
    presentationCache.subscribeToAll(handleMindCacheUpdate);

    return () => {
      presentationCache.unsubscribeFromAll(handleMindCacheUpdate);
    };
  }, []);

  const currentSlide = presentation?.slides[presentation.currentSlideIndex];

  const handlePrevious = () => {
    if (presentation && presentation.currentSlideIndex > 0) {
      presentationHelpers.setCurrentSlideIndex(presentation.currentSlideIndex - 1);
    }
  };

  const handleNext = () => {
    if (presentation && presentation.currentSlideIndex < presentation.slides.length - 1) {
      presentationHelpers.setCurrentSlideIndex(presentation.currentSlideIndex + 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!presentation) return;
      
      if (e.key === 'ArrowLeft' && presentation.currentSlideIndex > 0) {
        presentationHelpers.setCurrentSlideIndex(presentation.currentSlideIndex - 1);
      } else if (e.key === 'ArrowRight' && presentation.currentSlideIndex < presentation.slides.length - 1) {
        presentationHelpers.setCurrentSlideIndex(presentation.currentSlideIndex + 1);
      } else if (e.key === 'Escape') {
        router.push(loadedFromUrl ? '/' : '/edit');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [presentation, router, loadedFromUrl]);

  // Drag handlers for desktop split (vertical)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPosition(Math.min(Math.max(newPosition, 30), 70));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Drag handlers for mobile split (horizontal)
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isMobileDragging || !mobileContainerRef.current || !e.touches[0]) return;
      const rect = mobileContainerRef.current.getBoundingClientRect();
      const newPosition = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
      setMobileSplitPosition(Math.min(Math.max(newPosition, 30), 70));
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMobileDragging || !mobileContainerRef.current) return;
      const rect = mobileContainerRef.current.getBoundingClientRect();
      const newPosition = ((e.clientY - rect.top) / rect.height) * 100;
      setMobileSplitPosition(Math.min(Math.max(newPosition, 30), 70));
    };

    const handleEnd = () => {
      setIsMobileDragging(false);
    };

    if (isMobileDragging) {
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isMobileDragging]);

  // Swipe gesture handlers for mobile navigation
  useEffect(() => {
    const slideContainer = slideContainerRef.current;
    if (!slideContainer || !presentation) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touchEnd = e.changedTouches[0];
      const deltaX = touchEnd.clientX - touchStartRef.current.x;
      const deltaY = touchEnd.clientY - touchStartRef.current.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Only handle horizontal swipes (ignore if vertical movement is greater)
      if (absDeltaX > absDeltaY && absDeltaX > 50) {
        // Minimum swipe distance of 50px
        if (deltaX > 0) {
          // Swipe right - go to previous slide
          if (presentation.currentSlideIndex > 0) {
            presentationHelpers.setCurrentSlideIndex(presentation.currentSlideIndex - 1);
          }
        } else {
          // Swipe left - go to next slide
          if (presentation.currentSlideIndex < presentation.slides.length - 1) {
            presentationHelpers.setCurrentSlideIndex(presentation.currentSlideIndex + 1);
          }
        }
      }

      touchStartRef.current = null;
    };

    slideContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    slideContainer.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      slideContainer.removeEventListener('touchstart', handleTouchStart);
      slideContainer.removeEventListener('touchend', handleTouchEnd);
    };
  }, [presentation]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Presentation</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!presentation || isLoadingFromUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">
            {isLoadingFromUrl ? 'Loading presentation from URL...' : 'Loading presentation...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: Draggable horizontal split */}
      <div ref={mobileContainerRef} className="flex md:hidden flex-col h-screen bg-gray-50">
        {/* Top section: Slide + Navigation - MUST contain everything */}
        <div 
          className="flex flex-col overflow-hidden relative flex-shrink-0"
          style={{ height: `${mobileSplitPosition}%` }}
        >
          <button
            onClick={() => router.push(loadedFromUrl ? '/' : '/edit')}
            className="absolute top-2 left-2 p-1.5 text-gray-400 hover:text-gray-700 rounded-full transition-colors z-10"
            aria-label="Exit play mode"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Square slide - takes most space */}
          <div 
            ref={slideContainerRef}
            className="flex-1 flex items-center justify-center p-2 overflow-hidden"
          >
            <div className="max-w-full max-h-full aspect-square">
              {currentSlide && <SlideRenderer content={currentSlide.content} />}
            </div>
          </div>

          {/* Navigation bar - fixed height below slide */}
          <div className="flex items-center justify-center gap-3 text-sm text-gray-500 flex-shrink-0">
            <button
              onClick={handlePrevious}
              disabled={presentation.currentSlideIndex === 0}
              className="p-3 rounded-full disabled:opacity-20 disabled:cursor-not-allowed transition-colors active:scale-95"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <span className="font-mono min-w-[3rem] text-center">
              {presentation.currentSlideIndex + 1}/{presentation.slides.length}
            </span>

            <button
              onClick={handleNext}
              disabled={presentation.currentSlideIndex >= presentation.slides.length - 1}
              className="p-3 rounded-full disabled:opacity-20 disabled:cursor-not-allowed transition-colors active:scale-95"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Draggable divider */}
        <div
          onMouseDown={() => setIsMobileDragging(true)}
          onTouchStart={() => setIsMobileDragging(true)}
          className="h-1 bg-gray-300 hover:bg-blue-500 cursor-ns-resize transition-colors flex-shrink-0"
        />

        {/* Bottom section: Chatbot */}
        <div 
          className="bg-white overflow-hidden flex-shrink-0"
          style={{ height: `${100 - mobileSplitPosition}%` }}
        >
          <PlayChatbot />
        </div>
      </div>

      {/* Desktop: Draggable vertical split */}
      <div ref={containerRef} className="hidden md:flex flex-row h-screen bg-gray-50">
        <div 
          className="flex flex-col items-center justify-center p-0 relative"
          style={{ width: `${splitPosition}%` }}
        >
          <button
            onClick={() => router.push(loadedFromUrl ? '/' : '/edit')}
            className="absolute top-2 left-2 p-1.5 text-gray-400 hover:text-gray-700 rounded-full transition-colors z-10"
            aria-label="Exit play mode"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center gap-0 w-full max-w-[70vmin]">
            <div className="w-full">
              {currentSlide && <SlideRenderer content={currentSlide.content} />}
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              <button
                onClick={handlePrevious}
                disabled={presentation.currentSlideIndex === 0}
                className="p-3 rounded-full disabled:opacity-20 disabled:cursor-not-allowed transition-colors active:scale-95"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <span className="font-mono min-w-[3rem] text-center">
                {presentation.currentSlideIndex + 1}/{presentation.slides.length}
              </span>

              <button
                onClick={handleNext}
                disabled={presentation.currentSlideIndex >= presentation.slides.length - 1}
                className="p-3 rounded-full disabled:opacity-20 disabled:cursor-not-allowed transition-colors active:scale-95"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Draggable divider */}
        <div
          onMouseDown={() => setIsDragging(true)}
          className="w-1 bg-gray-300 hover:bg-blue-500 cursor-ew-resize transition-colors flex-shrink-0"
        />

        <div 
          className="bg-white flex-1"
          style={{ width: `${100 - splitPosition}%` }}
        >
          <PlayChatbot />
        </div>
      </div>
    </>
  );
}

