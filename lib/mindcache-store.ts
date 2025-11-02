"use client";

import { MindCache } from 'mindcache';
import { Presentation, Slide } from './types';

// Initialize MindCache for presentation storage
export const presentationCache = new MindCache();

// Helper functions to interact with the presentation using proper MindCache keys
export const presentationHelpers = {
  // Get full presentation by reconstructing from MindCache keys
  getPresentation: (): Presentation | null => {
    const title = presentationCache.get('Presentation_Name') as string | undefined;
    if (!title) return null;

    const slides: Slide[] = [];
    const keys = presentationCache.keys();
    
    // Find all slide content keys
    const slideKeys = keys
      .filter(k => k.match(/^Slide_\d{3}_content$/))
      .sort();

    for (const contentKey of slideKeys) {
      const slideNum = contentKey.match(/Slide_(\d{3})_content/)?.[1];
      if (!slideNum) continue;

      const notesKey = `Slide_${slideNum}_notes`;
      const content = presentationCache.get(contentKey);
      const notes = presentationCache.get(notesKey) || '';

      if (content) {
        slides.push({
          id: `slide-${slideNum}`,
          content: content as any,
          speakerNotes: notes as string,
        });
      }
    }

    const currentIndex = presentationCache.get('Current_Slide_Index') as number || 0;

    return {
      id: 'prez-1',
      title,
      slides,
      currentSlideIndex: Math.min(currentIndex, slides.length - 1),
    };
  },

  // Save presentation by splitting into individual MindCache keys
  setPresentation: (presentation: Presentation): void => {
    presentationCache.set('Presentation_Name', presentation.title);
    presentationCache.set('Current_Slide_Index', presentation.currentSlideIndex);

    presentation.slides.forEach((slide, index) => {
      const slideNum = String(index + 1).padStart(3, '0');
      presentationCache.set(`Slide_${slideNum}_content`, slide.content);
      presentationCache.set(`Slide_${slideNum}_notes`, slide.speakerNotes);
    });
  },

  getCurrentSlide: (): Slide | null => {
    const presentation = presentationHelpers.getPresentation();
    if (!presentation || presentation.slides.length === 0) return null;
    return presentation.slides[presentation.currentSlideIndex] || null;
  },

  updateSlide: (slideId: string, updates: Partial<Slide>): void => {
    const slideNum = slideId.replace('slide-', '').padStart(3, '0');
    
    if (updates.content) {
      presentationCache.set(`Slide_${slideNum}_content`, updates.content);
    }
    if (updates.speakerNotes !== undefined) {
      presentationCache.set(`Slide_${slideNum}_notes`, updates.speakerNotes);
    }
  },

  addSlide: (slide: Slide): void => {
    const presentation = presentationHelpers.getPresentation();
    if (!presentation) return;

    const newIndex = presentation.slides.length + 1;
    const slideNum = String(newIndex).padStart(3, '0');
    
    presentationCache.set(`Slide_${slideNum}_content`, slide.content);
    presentationCache.set(`Slide_${slideNum}_notes`, slide.speakerNotes);
  },

  deleteSlide: (slideId: string): void => {
    const presentation = presentationHelpers.getPresentation();
    if (!presentation) return;

    const slideIndex = presentation.slides.findIndex(s => s.id === slideId);
    if (slideIndex === -1) return;

    // Delete the slide's keys
    const slideNum = String(slideIndex + 1).padStart(3, '0');
    presentationCache.delete(`Slide_${slideNum}_content`);
    presentationCache.delete(`Slide_${slideNum}_notes`);

    // Renumber remaining slides
    for (let i = slideIndex + 1; i < presentation.slides.length; i++) {
      const oldNum = String(i + 1).padStart(3, '0');
      const newNum = String(i).padStart(3, '0');
      
      const content = presentationCache.get(`Slide_${oldNum}_content`);
      const notes = presentationCache.get(`Slide_${oldNum}_notes`);
      
      presentationCache.set(`Slide_${newNum}_content`, content);
      presentationCache.set(`Slide_${newNum}_notes`, notes);
      
      presentationCache.delete(`Slide_${oldNum}_content`);
      presentationCache.delete(`Slide_${oldNum}_notes`);
    }

    // Update current index if needed
    const currentIndex = presentationCache.get('Current_Slide_Index') as number || 0;
    if (currentIndex >= presentation.slides.length - 1) {
      presentationCache.set('Current_Slide_Index', Math.max(0, presentation.slides.length - 2));
    }
  },

  setCurrentSlideIndex: (index: number): void => {
    presentationCache.set('Current_Slide_Index', index);
  },

  // Generate system prompt for AI with current presentation state
  getSystemPrompt: (): string => {
    const stmData = presentationCache.getSTM();
    return `Current Memory State: ${stmData}`;
  },
};

// Initialize with empty presentation if none exists
if (typeof window !== 'undefined') {
  const existing = presentationCache.get('Presentation_Name');
  if (!existing) {
    // Initialize with proper MindCache keys
    presentationCache.set('Presentation_Name', 'My Presentation');
    presentationCache.set('Current_Slide_Index', 0);
    
    presentationCache.set('Slide_001_content', {
      type: 'bullets',
      title: 'Welcome to SqWrite',
      bullets: [
        'Create beautiful square presentations',
        'Add quotes, bullets, or images',
        'Use AI to help write content',
      ],
    });
    presentationCache.set('Slide_001_notes', 'Welcome the audience and introduce the presentation tool.');
  }
}

