import { tool } from 'ai';
import { z } from 'zod';
import { MindCache } from 'mindcache';
import { Presentation, Slide } from './types';

// Create AI tools for Vercel AI SDK to interact with MindCache
// Note: This must be separate from client code
export const createMindCacheTools = (cache: MindCache) => {
  return {
    updateSlideContent: tool({
      description: 'Update the content of a specific slide in the presentation',
      parameters: z.object({
        slideId: z.string().describe('The ID of the slide to update'),
        content: z.object({
          type: z.enum(['quote', 'bullets', 'image']).describe('Type of slide content'),
          quote: z.string().optional().describe('Quote text for quote slides'),
          author: z.string().optional().describe('Author for quote slides'),
          title: z.string().optional().describe('Title for bullet slides'),
          bullets: z.array(z.string()).optional().describe('Bullet points for bullet slides'),
          imageUrl: z.string().optional().describe('Image URL for image slides'),
          alt: z.string().optional().describe('Alt text for image slides'),
        }),
      }),
      execute: async ({ slideId, content }) => {
        const presentation = cache.get('presentation') as Presentation | null;
        if (!presentation) return { success: false, message: 'No presentation found' };
        
        const slideIndex = presentation.slides.findIndex((s: Slide) => s.id === slideId);
        if (slideIndex === -1) return { success: false, message: 'Slide not found' };
        
        presentation.slides[slideIndex].content = content as any;
        cache.set('presentation', presentation);
        
        return { success: true, message: 'Slide content updated' };
      },
    }),
    
    updateSpeakerNotes: tool({
      description: 'Update the speaker notes for a specific slide',
      parameters: z.object({
        slideId: z.string().describe('The ID of the slide'),
        notes: z.string().describe('The speaker notes in markdown format'),
      }),
      execute: async ({ slideId, notes }) => {
        const presentation = cache.get('presentation') as Presentation | null;
        if (!presentation) return { success: false, message: 'No presentation found' };
        
        const slideIndex = presentation.slides.findIndex((s: Slide) => s.id === slideId);
        if (slideIndex === -1) return { success: false, message: 'Slide not found' };
        
        presentation.slides[slideIndex].speakerNotes = notes;
        cache.set('presentation', presentation);
        
        return { success: true, message: 'Speaker notes updated' };
      },
    }),
    
    getPresentation: tool({
      description: 'Get the current presentation data including all slides',
      parameters: z.object({}),
      execute: async () => {
        const presentation = cache.get('presentation') as Presentation | null;
        return presentation || { message: 'No presentation found' };
      },
    }),
  };
};

