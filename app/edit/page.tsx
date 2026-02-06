"use client";

import { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import SlideRenderer from '@/components/SlideRenderer';
import SpeakerNotes from '@/components/SpeakerNotes';
import SlideControls from '@/components/SlideControls';
import SlideEditor from '@/components/SlideEditor';
import Chatbot from '@/components/Chatbot';
import MindCacheDebugView from '@/components/MindCacheDebugView';
import SlideReorderView from '@/components/SlideReorderView';
import { presentationHelpers, presentationCache } from '@/lib/mindcache-store';
import { Presentation, Slide, SlideContent } from '@/lib/types';
import { Edit2 } from 'lucide-react';

export default function EditPage() {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isReorderOpen, setIsReorderOpen] = useState(false);

  // Load presentation from MindCache and subscribe to changes
  useEffect(() => {
    const loadPresentation = () => {
      const prez = presentationHelpers.getPresentation();
      setPresentation(prez);
    };

    // Initial load
    loadPresentation();

    // Subscribe to all MindCache changes
    const handleMindCacheUpdate = () => {
      loadPresentation();
    };
    presentationCache.subscribeToAll(handleMindCacheUpdate);

    // Keyboard shortcut for debug view: Cmd+Shift+D
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsDebugOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      presentationCache.unsubscribeFromAll(handleMindCacheUpdate);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentSlide = presentation?.slides[presentation.currentSlideIndex];

  const handlePrevious = () => {
    if (presentation && presentation.currentSlideIndex > 0) {
      presentationHelpers.setCurrentSlideIndex(presentation.currentSlideIndex - 1);
      // No need to manually trigger refresh - MindCache subscription will handle it
    }
  };

  const handleNext = () => {
    if (presentation && presentation.currentSlideIndex < presentation.slides.length - 1) {
      presentationHelpers.setCurrentSlideIndex(presentation.currentSlideIndex + 1);
      // No need to manually trigger refresh - MindCache subscription will handle it
    }
  };

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      content: {
        type: 'bullets',
        title: 'New Slide',
        bullets: ['Point 1', 'Point 2', 'Point 3'],
      },
      speakerNotes: 'Add your speaker notes here.',
    };
    presentationHelpers.addSlide(newSlide);
    // No need to manually trigger refresh - MindCache subscription will handle it
  };

  const handleDuplicateSlide = () => {
    if (currentSlide && presentation) {
      // Deep copy the content
      let contentCopy: SlideContent;
      if (currentSlide.content.type === 'bullets') {
        contentCopy = {
          ...currentSlide.content,
          bullets: [...currentSlide.content.bullets],
        };
      } else if (currentSlide.content.type === 'drawing') {
        contentCopy = {
          ...currentSlide.content,
          drawingData: currentSlide.content.drawingData, // Copy drawing data
        };
      } else {
        contentCopy = { ...currentSlide.content };
      }

      const duplicatedSlide: Slide = {
        id: `slide-${Date.now()}`,
        content: contentCopy,
        speakerNotes: currentSlide.speakerNotes,
      };
      presentationHelpers.insertSlideAfter(duplicatedSlide, presentation.currentSlideIndex);
      // No need to manually trigger refresh - MindCache subscription will handle it
    }
  };

  const handleDeleteSlide = () => {
    if (currentSlide) {
      presentationHelpers.deleteSlide(currentSlide.id);
    }
  };

  const handleUpdateSlideContent = (content: SlideContent) => {
    if (currentSlide) {
      presentationHelpers.updateSlide(currentSlide.id, { content });
      // No need to manually trigger refresh - MindCache subscription will handle it
    }
  };

  const handleUpdateSpeakerNotes = (notes: string) => {
    if (currentSlide) {
      presentationHelpers.updateSlide(currentSlide.id, { speakerNotes: notes });
      // No need to manually trigger refresh - MindCache subscription will handle it
    }
  };

  if (!presentation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading presentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Bar */}
      <TopBar 
        presentationName={presentation.title}
        onNameChange={(name) => {
          presentationCache.set('Presentation_Name', name);
        }}
        onReorder={() => setIsReorderOpen(true)}
      />

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden gap-4 p-4">
        {/* Left Side - Chatbot (hidden on mobile, shown on medium screens) */}
        <div className="hidden md:flex md:w-1/3">
          <Chatbot />
        </div>

        {/* Right Side - Slide View */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full space-y-4">
            {/* Slide Controls */}
          <SlideControls
            currentIndex={presentation.currentSlideIndex}
            totalSlides={presentation.slides.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onAddSlide={handleAddSlide}
            onDuplicateSlide={handleDuplicateSlide}
            onDeleteSlide={handleDeleteSlide}
          />

          {/* Slide Preview */}
          {currentSlide && (
            <div className="relative">
              <SlideRenderer content={currentSlide.content} />
              <button
                onClick={() => setIsEditing(true)}
                className="absolute top-4 right-4 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50"
              >
                <Edit2 className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}

          {/* Speaker Notes */}
          {currentSlide && (
            <SpeakerNotes
              notes={currentSlide.speakerNotes}
              onUpdate={handleUpdateSpeakerNotes}
            />
          )}

          {/* Mobile Chatbot - shown only on small screens, below speaker notes */}
          <div className="md:hidden">
            <div className="h-96">
              <Chatbot />
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Slide Editor Modal */}
      {isEditing && currentSlide && (
        <SlideEditor
          content={currentSlide.content}
          onUpdate={handleUpdateSlideContent}
          onClose={() => setIsEditing(false)}
        />
      )}

      {/* MindCache Debug View */}
      <MindCacheDebugView 
        isOpen={isDebugOpen} 
        onClose={() => setIsDebugOpen(false)} 
      />

      {/* Slide Reorder View */}
      <SlideReorderView 
        isOpen={isReorderOpen} 
        onClose={() => setIsReorderOpen(false)} 
      />
    </div>
  );
}

