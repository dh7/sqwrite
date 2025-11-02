"use client";

import { ChevronLeft, ChevronRight, Plus, CopyPlus, Trash2 } from 'lucide-react';

interface SlideControlsProps {
  currentIndex: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  onAddSlide: () => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
}

export default function SlideControls({
  currentIndex,
  totalSlides,
  onPrevious,
  onNext,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
}: SlideControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-lg shadow p-2 gap-2">
      <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
          {totalSlides > 0 ? `${currentIndex + 1} / ${totalSlides}` : '0 / 0'}
        </span>
        
        <button
          onClick={onNext}
          disabled={currentIndex >= totalSlides - 1}
          className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
        <button
          onClick={onAddSlide}
          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Slide</span>
          <span className="sm:hidden">Add</span>
        </button>
        
        <button
          onClick={onDuplicateSlide}
          disabled={totalSlides === 0}
          className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CopyPlus className="w-4 h-4" />
        </button>
        
        <button
          onClick={onDeleteSlide}
          disabled={totalSlides === 0}
          className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

