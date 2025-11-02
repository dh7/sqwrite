# SqWrite - Square Presentation Creator

A React/Next.js application for creating beautiful square presentations with AI assistance.

## Features

- **Square Presentation Format**: Create visually appealing square slides
- **Multiple Content Types**: 
  - Quotes with attribution
  - Title with bullet points
  - Images
- **Speaker Notes**: Markdown-formatted notes for each slide
- **AI Assistant**: Chat with AI to rewrite slides and speaker notes
- **MindCache Integration**: Client-side storage using [MindCache](https://github.com/dh7/mindcache)
- **Full Slide Management**: Add, edit, delete, and navigate slides

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google AI API key for Gemini

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd sqwrite
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your Google AI API key:
```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Layout

- **Left Panel**: AI chatbot for editing and improving your presentation
- **Right Panel**: Slide preview and speaker notes

### Creating Slides

1. Click "Add Slide" to create a new slide
2. Click the edit icon on a slide to modify its content
3. Choose between quote, bullets, or image formats
4. Add speaker notes in markdown format

### Using the AI Assistant

Ask the AI to help with your presentation:
- "Rewrite the first slide to be more engaging"
- "Add speaker notes about market trends"
- "Make the bullet points more concise"

The AI has access to your entire presentation through MindCache and can modify slides and speaker notes directly.

### MindCache Debug View

Press **Cmd+Shift+D** (Mac) or **Ctrl+Shift+D** (Windows/Linux) to open the MindCache debug view. This lets you:
- View all stored data in MindCache
- Edit values directly (in JSON format)
- Add new entries
- Delete entries
- Clear all data

This is useful for debugging and understanding what's stored in memory.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **UI**: React 18, Tailwind CSS
- **AI**: Vercel AI SDK
- **Storage**: MindCache for client-side memory
- **Icons**: Lucide React
- **Markdown**: react-markdown

## Project Structure

```
sqwrite/
├── app/
│   ├── api/chat/        # AI chatbot API endpoint
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main application page
│   └── globals.css      # Global styles
├── components/
│   ├── Chatbot.tsx      # AI assistant chat interface
│   ├── SlideRenderer.tsx # Slide content display
│   ├── SlideEditor.tsx  # Slide editing modal
│   ├── SlideControls.tsx # Navigation and management
│   └── SpeakerNotes.tsx # Markdown speaker notes
├── lib/
│   ├── types.ts         # TypeScript types
│   └── mindcache-store.ts # MindCache integration
└── package.json
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

