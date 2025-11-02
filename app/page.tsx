"use client";

import { useState, useEffect } from 'react';
import SlideRenderer from '@/components/SlideRenderer';
import SpeakerNotes from '@/components/SpeakerNotes';
import SlideControls from '@/components/SlideControls';
import SlideEditor from '@/components/SlideEditor';
import Chatbot from '@/components/Chatbot';
import MindCacheDebugView from '@/components/MindCacheDebugView';
import { presentationHelpers } from '@/lib/mindcache-store';
import { Presentation, Slide, SlideContent } from '@/lib/types';
import { Edit2 } from 'lucide-react';

export default function Home() {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load presentation from MindCache
  useEffect(() => {
    const loadPresentation = () => {
      const prez = presentationHelpers.getPresentation();
      setPresentation(prez);
      // Make presentation available to chatbot
      if (typeof window !== 'undefined') {
        (window as any).__presentationData = prez;
      }
    };

    loadPresentation();

    // Listen for AI updates
    const handleUpdate = () => {
      loadPresentation();
    };
    window.addEventListener('presentation-updated', handleUpdate);

    // Keyboard shortcut for debug view: Cmd+Shift+D
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsDebugOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Poll for updates from MindCache (in case AI modifies it)
    const interval = setInterval(() => {
      loadPresentation();
    }, 1000);

    return () => {
      window.removeEventListener('presentation-updated', handleUpdate);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, [refreshKey]);

  const currentSlide = presentation?.slides[presentation.currentSlideIndex];

  const handlePrevious = () => {
    if (presentation && presentation.currentSlideIndex > 0) {
      presentationHelpers.setCurrentSlideIndex(presentation.currentSlideIndex - 1);
      setRefreshKey(k => k + 1);
    }
  };

  const handleNext = () => {
    if (presentation && presentation.currentSlideIndex < presentation.slides.length - 1) {
      presentationHelpers.setCurrentSlideIndex(presentation.currentSlideIndex + 1);
      setRefreshKey(k => k + 1);
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
    setRefreshKey(k => k + 1);
  };

  const handleDeleteSlide = () => {
    if (currentSlide && confirm('Are you sure you want to delete this slide?')) {
      presentationHelpers.deleteSlide(currentSlide.id);
      setRefreshKey(k => k + 1);
    }
  };

  const handleUpdateSlideContent = (content: SlideContent) => {
    if (currentSlide) {
      presentationHelpers.updateSlide(currentSlide.id, { content });
      setRefreshKey(k => k + 1);
    }
  };

  const handleUpdateSpeakerNotes = (notes: string) => {
    if (currentSlide) {
      presentationHelpers.updateSlide(currentSlide.id, { speakerNotes: notes });
      setRefreshKey(k => k + 1);
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
    <div className="flex h-screen overflow-hidden">
      {/* Left Side - Chatbot */}
      <div className="w-1/3 p-4 border-r border-gray-200">
        <Chatbot />
      </div>

      {/* Right Side - Slide View */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Presentation Title */}
          <div className="bg-white rounded-lg shadow p-4">
            <input
              type="text"
              value={presentation.title}
              onChange={(e) => {
                const prez = presentationHelpers.getPresentation();
                if (prez) {
                  prez.title = e.target.value;
                  presentationHelpers.setPresentation(prez);
                  setRefreshKey(k => k + 1);
                }
              }}
              className="text-2xl font-bold w-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            />
          </div>

          {/* Slide Controls */}
          <SlideControls
            currentIndex={presentation.currentSlideIndex}
            totalSlides={presentation.slides.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onAddSlide={handleAddSlide}
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
    </div>
  );
}

