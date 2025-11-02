"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import SlideRenderer from '@/components/SlideRenderer';
import PlayChatbot from '@/components/PlayChatbot';
import { presentationHelpers, presentationCache } from '@/lib/mindcache-store';
import { Presentation } from '@/lib/types';

export default function PlayPage() {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const router = useRouter();

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
        router.push('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [presentation, router]);

  if (!presentation) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading presentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Slides */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">
        <button
          onClick={() => router.push('/')}
          className="absolute top-2 left-2 p-1.5 text-gray-400 hover:text-gray-700 rounded-full transition-colors z-10"
          aria-label="Exit play mode"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full max-w-[90vmin] md:max-w-[70vmin]">
          {currentSlide && <SlideRenderer content={currentSlide.content} />}
        </div>

        {/* Minimalist Navigation */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-xs text-gray-400">
          <button
            onClick={handlePrevious}
            disabled={presentation.currentSlideIndex === 0}
            className="p-1 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-mono">
            {presentation.currentSlideIndex + 1}/{presentation.slides.length}
          </span>

          <button
            onClick={handleNext}
            disabled={presentation.currentSlideIndex >= presentation.slides.length - 1}
            className="p-1 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chatbot - Below on mobile, right on desktop */}
      <div className="w-full md:w-96 h-64 md:h-full border-t md:border-t-0 md:border-l border-gray-200 bg-white">
        <PlayChatbot />
      </div>
    </div>
  );
}

