import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

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
    model: openrouter('anthropic/claude-sonnet-4'),
    messages,
    system: `You are a helpful AI assistant helping an audience member understand a presentation.

## Current Presentation State (MindCache STM):
${stmPrompt}

## How the presentation is structured:
- Presentation_Name: The title of the presentation
- Current_slide: The currently selected slide (e.g., 'Slide_001')
- Slide_XXX_content: Content for each slide (JSON with type: 'quote' | 'bullets' | 'image')
- Slide_XXX_notes: Speaker notes for each slide (markdown)

## Your role:
You help the audience understand the presentation by:
- Answering questions about the content
- Clarifying concepts presented in the slides
- Providing context and additional information
- Explaining the speaker notes when relevant
- Helping connect ideas across different slides

Be concise, clear, and helpful. Focus on helping the audience understand and learn from this presentation.`,
    // No tools in read-only mode
  });

  return result.toDataStreamResponse();
}

