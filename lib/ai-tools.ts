import { tool } from 'ai';
import { z } from 'zod';
import { MindCache } from 'mindcache';

// Create AI tools for Vercel AI SDK to interact with MindCache
// Uses individual MindCache keys with proper structure
export const createMindCacheTools = (cache: MindCache) => {
  return {
    updatePresentationTitle: tool({
      description: 'Update the presentation title',
      parameters: z.object({
        title: z.string().describe('The new presentation title'),
      }),
      execute: async ({ title }) => {
        cache.set('Presentation_Name', title);
        return { success: true, message: 'Title updated' };
      },
    }),

    updateSlideContent: tool({
      description: 'Update the content of a specific slide',
      parameters: z.object({
        slideNumber: z.number().describe('The slide number (1-based index)'),
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
      execute: async ({ slideNumber, content }) => {
        const slideNum = String(slideNumber).padStart(3, '0');
        const key = `Slide_${slideNum}_content`;
        
        // Check if slide exists
        if (!cache.has(key)) {
          return { success: false, message: `Slide ${slideNumber} not found` };
        }
        
        cache.set(key, content);
        return { success: true, message: `Slide ${slideNumber} content updated` };
      },
    }),
    
    updateSpeakerNotes: tool({
      description: 'Update the speaker notes for a specific slide',
      parameters: z.object({
        slideNumber: z.number().describe('The slide number (1-based index)'),
        notes: z.string().describe('The speaker notes in markdown format'),
      }),
      execute: async ({ slideNumber, notes }) => {
        const slideNum = String(slideNumber).padStart(3, '0');
        const key = `Slide_${slideNum}_notes`;
        
        cache.set(key, notes);
        return { success: true, message: `Slide ${slideNumber} notes updated` };
      },
    }),
    
    addSlide: tool({
      description: 'Add a new slide to the presentation',
      parameters: z.object({
        content: z.object({
          type: z.enum(['quote', 'bullets', 'image']).describe('Type of slide content'),
          quote: z.string().optional(),
          author: z.string().optional(),
          title: z.string().optional(),
          bullets: z.array(z.string()).optional(),
          imageUrl: z.string().optional(),
          alt: z.string().optional(),
        }),
        notes: z.string().default('').describe('Speaker notes for the new slide'),
      }),
      execute: async ({ content, notes }) => {
        // Find the next slide number
        const keys = cache.keys();
        const slideNums = keys
          .filter(k => k.match(/^Slide_\d{3}_content$/))
          .map(k => parseInt(k.match(/Slide_(\d{3})_content/)?.[1] || '0'))
          .filter(n => !isNaN(n));
        
        const nextNum = slideNums.length > 0 ? Math.max(...slideNums) + 1 : 1;
        const slideNum = String(nextNum).padStart(3, '0');
        
        cache.set(`Slide_${slideNum}_content`, content);
        cache.set(`Slide_${slideNum}_notes`, notes);
        
        return { success: true, message: `Added slide ${nextNum}`, slideNumber: nextNum };
      },
    }),
  };
};

