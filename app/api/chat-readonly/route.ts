import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages, mindcacheData } = await req.json();

  // Build STM prompt from MindCache data
  const stmPrompt = mindcacheData
    ? Object.entries(mindcacheData)
        .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
        .join(', ')
    : '';

  const result = await streamText({
    model: google('gemini-2.5-flash'),
    messages,
    system: `You are a helpful AI assistant for a presentation tool called SqWrite. You are in PLAY MODE - read-only access.

## Current Presentation State (MindCache STM):
${stmPrompt}

## How the presentation is structured:
- Presentation_Name: The title of the presentation
- Current_slide: The currently selected slide (e.g., 'Slide_001')
- Slide_XXX_content: Content for each slide (JSON with type: 'quote' | 'bullets' | 'image')
- Slide_XXX_notes: Speaker notes for each slide (markdown)

## Your capabilities in PLAY MODE:
You can help users understand and discuss their presentation:
- Answer questions about the presentation content
- Provide insights and suggestions
- Discuss the slides and speaker notes
- Help rehearse the presentation

You CANNOT modify the presentation in this mode. This is a read-only view for presenting and rehearsing.
Be concise and helpful.`,
    // No tools in read-only mode
  });

  return result.toDataStreamResponse();
}

