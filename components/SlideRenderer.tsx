"use client";

import { SlideContent } from '@/lib/types';
import Image from 'next/image';

interface SlideRendererProps {
  content: SlideContent;
}

export default function SlideRenderer({ content }: SlideRendererProps) {
  return (
    <div className="w-full aspect-square bg-white shadow-lg rounded-lg flex items-center justify-center p-8">
      {content.type === 'quote' && (
        <div className="text-center max-w-2xl">
          <blockquote className="text-2xl md:text-3xl font-serif italic text-gray-800 mb-4">
            "{content.quote}"
          </blockquote>
          {content.author && (
            <cite className="text-lg text-gray-600 not-italic">
              — {content.author}
            </cite>
          )}
        </div>
      )}

      {content.type === 'bullets' && (
        <div className="w-full">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            {content.title}
          </h2>
          <ul className="space-y-4">
            {content.bullets.map((bullet, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 mr-3 text-2xl">•</span>
                <span className="text-xl md:text-2xl text-gray-700">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.type === 'image' && (
        <div className="relative w-full h-full">
          <Image
            src={content.imageUrl}
            alt={content.alt || 'Slide image'}
            fill
            className="object-contain"
          />
        </div>
      )}
    </div>
  );
}

