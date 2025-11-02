import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { MindCache } from 'mindcache';
import { createMindCacheTools } from '@/lib/ai-tools';

export const runtime = 'edge';

// Create a server-side MindCache instance
const serverCache = new MindCache();

export async function POST(req: Request) {
  const { messages, presentation } = await req.json();

  // Initialize server cache with client data
  if (presentation) {
    serverCache.set('presentation', presentation);
  }

  // Get tools for AI to interact with the presentation
  const tools = createMindCacheTools(serverCache);

  // Get system prompt with current MindCache state
  const systemPrompt = serverCache.getSTM();

  const result = await streamText({
    model: google('gemini-2.5-flash'),
    messages,
    system: `You are a helpful AI assistant for a presentation creation tool called SqWrite.
    
${systemPrompt}

Current Presentation: ${JSON.stringify(presentation, null, 2)}

You can help users:
- Rewrite slide content to be more engaging or clear
- Edit speaker notes
- Suggest improvements to presentations
- Add new slides with appropriate content

When rewriting content, maintain the same slide type (quote, bullets, or image) unless explicitly asked to change it.
Use the provided tools to update slides and speaker notes.
Always be concise and helpful.`,
    tools,
    maxToolRoundtrips: 5,
  });

  return result.toDataStreamResponse();
}

