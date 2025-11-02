import { tool } from 'ai';
import { z } from 'zod';

// Create AI tools for Vercel AI SDK to interact with MindCache
// Client-side only - tools just return what should be changed, client applies it
export const createMindCacheTools = () => {
  return {
    updatePresentationTitle: tool({
      description: 'Update the presentation title',
      parameters: z.object({
        title: z.string().describe('The new presentation title'),
      }),
      execute: async ({ title }) => {
        // Server just validates and returns - client applies the change
        return { success: true, message: 'Title updated', action: 'update_title', data: { title } };
      },
    }),

    updateSlideContent: tool({
      description: 'Update the content of a specific slide',
      parameters: z.object({
        slideNumber: z.number().describe('The slide number (1-based index)'),
        content: z.object({
          type: z.enum(['quote', 'bullets', 'image']).describe('Type of slide content'),
          title: z.string().optional().describe('Title for all slide types'),
          quote: z.string().optional().describe('Quote text for quote slides'),
          author: z.string().optional().describe('Author for quote slides'),
          bullets: z.array(z.string()).optional().describe('Bullet points for bullet slides'),
          imageUrl: z.string().optional().describe('Image URL for image slides'),
          alt: z.string().optional().describe('Alt text for image slides'),
        }),
      }),
      execute: async ({ slideNumber, content }) => {
        // Server just validates and returns - client applies the change
        return { 
          success: true, 
          message: `Slide ${slideNumber} content updated`,
          action: 'update_slide_content',
          data: { slideNumber, content }
        };
      },
    }),
    
    updateSpeakerNotes: tool({
      description: 'Update the speaker notes for a specific slide',
      parameters: z.object({
        slideNumber: z.number().describe('The slide number (1-based index)'),
        notes: z.string().describe('The speaker notes in markdown format'),
      }),
      execute: async ({ slideNumber, notes }) => {
        // Server just validates and returns - client applies the change
        return { 
          success: true, 
          message: `Slide ${slideNumber} notes updated`,
          action: 'update_speaker_notes',
          data: { slideNumber, notes }
        };
      },
    }),
    
    addSlide: tool({
      description: 'Add a new slide to the presentation',
      parameters: z.object({
        content: z.object({
          type: z.enum(['quote', 'bullets', 'image']).describe('Type of slide content'),
          title: z.string().optional().describe('Title for all slide types'),
          quote: z.string().optional(),
          author: z.string().optional(),
          bullets: z.array(z.string()).optional(),
          imageUrl: z.string().optional(),
          alt: z.string().optional(),
        }),
        notes: z.string().default('').describe('Speaker notes for the new slide'),
      }),
      execute: async ({ content, notes }) => {
        // Server just validates and returns - client applies the change
        return { 
          success: true, 
          message: 'Slide added',
          action: 'add_slide',
          data: { content, notes }
        };
      },
    }),
  };
};

