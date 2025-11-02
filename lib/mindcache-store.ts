"use client";

import { MindCache } from 'mindcache';
import { Presentation, Slide } from './types';

// Initialize MindCache for presentation storage
export const presentationCache = new MindCache();

// Helper functions to interact with the presentation
export const presentationHelpers = {
  getPresentation: (): Presentation | null => {
    return presentationCache.get('presentation') as Presentation | null;
  },

  setPresentation: (presentation: Presentation): void => {
    presentationCache.set('presentation', presentation);
  },

  getCurrentSlide: (): Slide | null => {
    const presentation = presentationHelpers.getPresentation();
    if (!presentation || presentation.slides.length === 0) return null;
    return presentation.slides[presentation.currentSlideIndex] || null;
  },

  updateSlide: (slideId: string, updates: Partial<Slide>): void => {
    const presentation = presentationHelpers.getPresentation();
    if (!presentation) return;

    const slideIndex = presentation.slides.findIndex(s => s.id === slideId);
    if (slideIndex === -1) return;

    presentation.slides[slideIndex] = {
      ...presentation.slides[slideIndex],
      ...updates,
    };

    presentationCache.set('presentation', presentation);
  },

  addSlide: (slide: Slide): void => {
    const presentation = presentationHelpers.getPresentation();
    if (!presentation) return;

    presentation.slides.push(slide);
    presentationCache.set('presentation', presentation);
  },

  deleteSlide: (slideId: string): void => {
    const presentation = presentationHelpers.getPresentation();
    if (!presentation) return;

    presentation.slides = presentation.slides.filter(s => s.id !== slideId);
    if (presentation.currentSlideIndex >= presentation.slides.length) {
      presentation.currentSlideIndex = Math.max(0, presentation.slides.length - 1);
    }
    presentationCache.set('presentation', presentation);
  },

  setCurrentSlideIndex: (index: number): void => {
    const presentation = presentationHelpers.getPresentation();
    if (!presentation) return;

    if (index >= 0 && index < presentation.slides.length) {
      presentation.currentSlideIndex = index;
      presentationCache.set('presentation', presentation);
    }
  },

  // Generate system prompt for AI with current presentation state
  getSystemPrompt: (): string => {
    const stmData = presentationCache.getSTM();
    return `Current Memory State: ${stmData}`;
  },
};

// Initialize with empty presentation if none exists
if (typeof window !== 'undefined') {
  const existing = presentationCache.get('presentation');
  if (!existing) {
    const initialPresentation: Presentation = {
      id: 'prez-1',
      title: 'My Presentation',
      slides: [
        {
          id: 'slide-1',
          content: {
            type: 'bullets',
            title: 'Welcome to SqWrite',
            bullets: [
              'Create beautiful square presentations',
              'Add quotes, bullets, or images',
              'Use AI to help write content',
            ],
          },
          speakerNotes: 'Welcome the audience and introduce the presentation tool.',
        },
      ],
      currentSlideIndex: 0,
    };
    presentationCache.set('presentation', initialPresentation);
  }
}

