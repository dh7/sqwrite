import { tool } from 'ai';
import { z } from 'zod';

// Create AI tools for Vercel AI SDK to interact with MindCache
// Client-side only - tools just return what should be changed, client applies it
export const createMindCacheTools = () => {
  return {
    updatePresentationTitle: tool({
      description: 'Update the presentation title',
      inputSchema: z.object({
        title: z.string().describe('The new presentation title'),
      }),
      execute: async ({ title }) => {
        // Server just validates and returns - client applies the change
        return { success: true, message: 'Title updated', action: 'update_title', data: { title } };
      },
    }),

    updateSlideContent: tool({
      description: 'Update the content of a specific slide',
      inputSchema: z.object({
        slideNumber: z.number().describe('The slide number (1-based index)'),
        content: z.object({
          type: z.enum(['title', 'quote', 'bullets', 'image', 'drawing']).describe('Type of slide content'),
          title: z.string().optional().describe('Title for all slide types'),
          subtitle: z.string().optional().describe('Subtitle for title slides'),
          quote: z.string().optional().describe('Quote text for quote slides'),
          author: z.string().optional().describe('Author for quote slides'),
          bullets: z.array(z.string()).optional().describe('Bullet points for bullet slides'),
          imageUrl: z.string().optional().describe('Image URL for image slides'),
          alt: z.string().optional().describe('Alt text for image slides'),
          drawingData: z.string().optional().describe('JSON string of Excalidraw elements and appState for drawing slides'),
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
      inputSchema: z.object({
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
      description: 'Add a new slide to the presentation. IMPORTANT: After adding a slide, you should immediately call setCurrentSlide to navigate to the newly created slide so the user can see it.',
      inputSchema: z.object({
        content: z.object({
          type: z.enum(['title', 'quote', 'bullets', 'image', 'drawing']).describe('Type of slide content'),
          title: z.string().optional().describe('Title for all slide types'),
          subtitle: z.string().optional().describe('Subtitle for title slides'),
          quote: z.string().optional(),
          author: z.string().optional(),
          bullets: z.array(z.string()).optional(),
          imageUrl: z.string().optional(),
          alt: z.string().optional(),
          drawingData: z.string().optional().describe('JSON string of Excalidraw elements and appState for drawing slides'),
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

    setCurrentSlide: tool({
      description: 'Navigate to a specific slide by setting it as the current slide. Use this after creating a new slide to show it to the user, or to navigate to any existing slide.',
      inputSchema: z.object({
        slideNumber: z.number().describe('The slide number to navigate to (1-based index)'),
      }),
      execute: async ({ slideNumber }) => {
        // Server just validates and returns - client applies the change
        return { 
          success: true, 
          message: `Navigated to slide ${slideNumber}`,
          action: 'set_current_slide',
          data: { slideNumber }
        };
      },
    }),

    scrapeWebsite: tool({
      description: 'Fetch and extract text content from a URL. Use this when the user provides a link and wants to create slides based on that webpage content. Returns the page title and text.',
      inputSchema: z.object({
        url: z.string().url().describe('The URL to scrape'),
      }),
      execute: async ({ url }) => {
        try {
          const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SqWriteBot/1.0)' },
            signal: AbortSignal.timeout(10000),
          });

          if (!response.ok) {
            return { success: false, error: `Failed to fetch: ${response.status} ${response.statusText}` };
          }

          const html = await response.text();

          // Extract title
          const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : '';

          // Strip scripts, styles, and HTML tags to get text
          const text = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[\s\S]*?<\/nav>/gi, '')
            .replace(/<footer[\s\S]*?<\/footer>/gi, '')
            .replace(/<header[\s\S]*?<\/header>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 8000);

          return { success: true, url, title, text };
        } catch (err: any) {
          return { success: false, error: err.message || 'Failed to scrape URL' };
        }
      },
    }),
  };
};

