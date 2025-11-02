import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { MindCache } from 'mindcache';
import { createMindCacheTools } from '@/lib/ai-tools';

export const runtime = 'edge';

// Create a server-side MindCache instance
const serverCache = new MindCache();

export async function POST(req: Request) {
  const { messages, mindcacheData } = await req.json();

  // Sync client MindCache data to server
  if (mindcacheData) {
    Object.entries(mindcacheData).forEach(([key, value]) => {
      serverCache.set(key, value);
    });
  }

  // Get tools for AI to interact with the presentation
  const tools = createMindCacheTools(serverCache);

  // Get system prompt with current MindCache state (this includes all keys/values)
  const stmPrompt = serverCache.getSTM();

  const result = await streamText({
    model: google('gemini-2.5-flash'),
    messages,
    system: `You are a helpful AI assistant for a presentation creation tool called SqWrite.

## Current Memory State (MindCache STM):
${stmPrompt}

## How the presentation is structured:
- Presentation_Name: The title of the presentation
- Current_Slide_Index: The currently selected slide (0-based)
- Slide_XXX_content: Content for each slide (JSON with type: 'quote' | 'bullets' | 'image')
- Slide_XXX_notes: Speaker notes for each slide (markdown)

## Your capabilities:
You can help users:
- Rewrite slide content to be more engaging or clear
- Edit speaker notes
- Update the presentation title
- Add new slides
- Suggest improvements

When rewriting content, maintain the same slide type unless explicitly asked to change it.
Use the provided tools to update the MindCache keys directly.
Always be concise and helpful.`,
    tools,
    maxToolRoundtrips: 5,
  });

  return result.toDataStreamResponse();
}

