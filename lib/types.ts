export type SlideType = 'quote' | 'bullets' | 'image';

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

export type SlideContent = QuoteContent | BulletsContent | ImageContent;

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

