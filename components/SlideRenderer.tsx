"use client";

import { SlideContent } from '@/lib/types';
import Image from 'next/image';

interface SlideRendererProps {
  content: SlideContent;
}

export default function SlideRenderer({ content }: SlideRendererProps) {
  return (
    <div className="w-full max-w-[calc(100vh-12rem)] aspect-square mx-auto bg-white shadow-lg rounded-lg flex items-center justify-center p-4">
      {content.type === 'title' && (
        <div className="text-center max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-600">
              {content.subtitle}
            </p>
          )}
        </div>
      )}

      {content.type === 'quote' && (
        <div className="text-center max-w-2xl">
          {content.title && (
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
              {content.title}
            </h2>
          )}
          <blockquote className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif italic text-gray-800 mb-3 md:mb-4">
            "{content.quote}"
          </blockquote>
          {content.author && (
            <cite className="text-base sm:text-lg text-gray-600 not-italic">
              — {content.author}
            </cite>
          )}
        </div>
      )}

      {content.type === 'bullets' && (
        <div className="w-full text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 md:mb-8">
            {content.title}
          </h2>
          <ul className="space-y-2 sm:space-y-3 md:space-y-4">
            {content.bullets.map((bullet, index) => (
              <li key={index} className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700">
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.type === 'image' && (
        <div className="w-full h-full flex flex-col">
          {content.title && (
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              {content.title}
            </h2>
          )}
          <div className="relative flex-1">
            <Image
              src={content.imageUrl}
              alt={content.alt || 'Slide image'}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

