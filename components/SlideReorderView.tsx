"use client";

import { useState, useEffect } from 'react';
import { X, CopyPlus, Trash2 } from 'lucide-react';
import { presentationCache } from '@/lib/mindcache-store';
import { Slide, SlideContent } from '@/lib/types';
import SlideRenderer from './SlideRenderer';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SlideReorderViewProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SortableSlideProps {
  slide: Slide;
  index: number;
  onDuplicate: (index: number) => void;
  onDelete: (slideId: string) => void;
}

function SortableSlide({ slide, index, onDuplicate, onDelete }: SortableSlideProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none' as const,
    WebkitUserSelect: 'none' as const,
    userSelect: 'none' as const,
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(index);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this slide?')) {
      onDelete(slide.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white hover:bg-gray-50 active:bg-gray-100 rounded select-none"
    >
      <div
        {...listeners}
        className="flex items-center gap-2 sm:gap-3 flex-1 cursor-move select-none"
        style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        <span className="text-sm font-semibold text-gray-700 min-w-[3rem] select-none">
          {index + 1}
        </span>
        <div className="w-24 h-24 flex-shrink-0 pointer-events-none select-none">
          <div className="scale-[0.24] origin-top-left transform w-[416.67%] h-[416.67%]">
            <SlideRenderer content={slide.content} />
          </div>
        </div>
        <div className="text-sm text-gray-600 truncate flex-1 select-none">
          {slide.content.type === 'title' && slide.content.title}
          {slide.content.type === 'bullets' && slide.content.title}
          {slide.content.type === 'quote' && (slide.content.title || slide.content.quote.substring(0, 50))}
          {slide.content.type === 'image' && (slide.content.title || 'Image slide')}
          {slide.content.type === 'drawing' && (slide.content.title || 'Drawing slide')}
        </div>
      </div>
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleDuplicate}
          className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label="Duplicate slide"
        >
          <CopyPlus className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
          aria-label="Delete slide"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function SlideReorderView({ isOpen, onClose }: SlideReorderViewProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isOpen) {
      loadSlides();
    }
  }, [isOpen]);

  // Prevent text selection during drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.touchAction = '';
    };
  }, [isDragging]);

  const loadSlides = () => {
    const keys = presentationCache.keys();
    const slideKeys = keys
      .filter(k => k.match(/^Slide_\d{3}_content$/))
      .sort();

    const loadedSlides: Slide[] = [];
    for (const contentKey of slideKeys) {
      const slideNum = contentKey.match(/Slide_(\d{3})_content/)?.[1];
      if (!slideNum) continue;

      const notesKey = `Slide_${slideNum}_notes`;
      const content = presentationCache.get(contentKey);
      const notes = presentationCache.get(notesKey) || '';

      if (content) {
        loadedSlides.push({
          id: `slide-${slideNum}`,
          content: content as any,
          speakerNotes: notes as string,
        });
      }
    }

    setSlides(loadedSlides);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSlides((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDuplicate = (index: number) => {
    const slideToDuplicate = slides[index];
    if (!slideToDuplicate) return;

    // Deep copy the content
    let contentCopy: SlideContent;
    if (slideToDuplicate.content.type === 'bullets') {
      contentCopy = {
        ...slideToDuplicate.content,
        bullets: [...slideToDuplicate.content.bullets],
      };
    } else if (slideToDuplicate.content.type === 'drawing') {
      contentCopy = {
        ...slideToDuplicate.content,
        drawingData: slideToDuplicate.content.drawingData, // Copy drawing data
      };
    } else {
      contentCopy = { ...slideToDuplicate.content };
    }

    const duplicatedSlide: Slide = {
      id: `slide-${Date.now()}`,
      content: contentCopy,
      speakerNotes: slideToDuplicate.speakerNotes,
    };

    // Insert after current index in local state
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, duplicatedSlide);
    setSlides(newSlides);
  };

  const handleDelete = (slideId: string) => {
    setSlides((currentSlides) => {
      return currentSlides.filter(s => s.id !== slideId);
    });
  };

  const handleSave = () => {
    // Get current slide to maintain selection
    const currentSlide = presentationCache.get('Current_slide') as string || 'Slide_001';
    const currentSlideNum = currentSlide.match(/\d{3}/)?.[0];
    const currentSlideIndex = slides.findIndex(s => s.id === `slide-${currentSlideNum}`);

    // Delete all existing slide keys
    const keys = presentationCache.keys();
    keys.forEach(key => {
      if (key.match(/^Slide_\d{3}_(content|notes)$/)) {
        presentationCache.delete(key);
      }
    });

    // Re-create keys with new order
    slides.forEach((slide, index) => {
      const slideNum = String(index + 1).padStart(3, '0');
      presentationCache.set(`Slide_${slideNum}_content`, slide.content);
      presentationCache.set(`Slide_${slideNum}_notes`, slide.speakerNotes);
    });

    // Update current slide to maintain selection
    if (currentSlideIndex >= 0 && currentSlideIndex < slides.length) {
      const newSlideNum = String(currentSlideIndex + 1).padStart(3, '0');
      presentationCache.set('Current_slide', `Slide_${newSlideNum}`);
    } else if (slides.length > 0) {
      // If current slide was deleted, select first slide
      presentationCache.set('Current_slide', 'Slide_001');
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Re-order Slides</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Drag slides to reorder them</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ touchAction: 'pan-y' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(event) => {
              setIsDragging(false);
              handleDragEnd(event);
            }}
            onDragCancel={() => setIsDragging(false)}
          >
            <SortableContext
              items={slides.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {slides.map((slide, index) => (
                  <SortableSlide 
                    key={slide.id} 
                    slide={slide} 
                    index={index}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="flex gap-3 p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Order
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

