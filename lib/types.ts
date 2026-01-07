export type SlideType = 'title' | 'quote' | 'bullets' | 'image' | 'drawing';

export interface TitleContent {
  type: 'title';
  title: string;
  subtitle?: string;
}

export interface QuoteContent {
  type: 'quote';
  title?: string;
  quote: string;
  author?: string;
}

export interface BulletsContent {
  type: 'bullets';
  title: string;
  bullets: string[];
}

export interface ImageContent {
  type: 'image';
  title?: string;
  imageUrl: string;
  alt?: string;
}

export interface DrawingContent {
  type: 'drawing';
  title?: string;
  drawingData: string; // JSON string of Excalidraw elements
}

export type SlideContent = TitleContent | QuoteContent | BulletsContent | ImageContent | DrawingContent;

export interface Slide {
  id: string;
  content: SlideContent;
  speakerNotes: string;
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  currentSlideIndex: number;
}

