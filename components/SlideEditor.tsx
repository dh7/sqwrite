"use client";

import { SlideContent, TitleContent, QuoteContent, BulletsContent, ImageContent, DrawingContent } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';
import { Upload, Pencil, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
);

import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import SlideRenderer from './SlideRenderer';

interface SlideEditorProps {
  content: SlideContent;
  onUpdate: (content: SlideContent) => void;
  onClose: () => void;
}

// Preview component for drawing
function DrawingPreview({ drawingData, title }: { drawingData: string; title: string }) {
  if (!drawingData || drawingData === '{"elements":[],"appState":{}}') {
    return (
      <div className="border border-gray-300 rounded-lg p-8 bg-gray-50 text-center text-gray-500">
        No drawing yet. Click &quot;Draw&quot; to create a drawing or &quot;Import Excalidraw&quot; to load one.
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <SlideRenderer 
        key={drawingData}
        content={{
          type: 'drawing',
          title: title || undefined,
          drawingData: drawingData,
        }} 
      />
    </div>
  );
}

export default function SlideEditor({ content, onUpdate, onClose }: SlideEditorProps) {
  const [currentType, setCurrentType] = useState<'title' | 'quote' | 'bullets' | 'image' | 'drawing'>(content.type);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excalidrawFileInputRef = useRef<HTMLInputElement>(null);
  const [isFullscreenDrawing, setIsFullscreenDrawing] = useState(false);
  const [fullscreenDrawingData, setFullscreenDrawingData] = useState<string>('');
  
  // Store all content types separately to preserve when switching
  const [titleData, setTitleData] = useState({
    subtitle: content.type === 'title' ? content.subtitle || '' : '',
  });
  
  const [quoteData, setQuoteData] = useState({
    quote: content.type === 'quote' ? content.quote : '',
    author: content.type === 'quote' ? content.author || '' : '',
  });
  
  const [bulletText, setBulletText] = useState<string>(
    content.type === 'bullets' ? content.bullets.join('\n') : ''
  );
  
  const [imageData, setImageData] = useState({
    imageUrl: content.type === 'image' ? content.imageUrl : '',
    alt: content.type === 'image' ? content.alt || '' : '',
  });

  const [drawingData, setDrawingData] = useState<string>(
    content.type === 'drawing' ? content.drawingData : '{"elements":[],"appState":{}}'
  );

  // Update drawingData when content changes (only if different to avoid interrupting drawing)
  useEffect(() => {
    if (content.type === 'drawing' && content.drawingData !== drawingData) {
      setDrawingData(content.drawingData);
    }
  }, [content.type, content.drawingData, drawingData]);

  const [title, setTitle] = useState<string>(() => {
    if (content.type === 'title') return content.title;
    if (content.type === 'bullets') return content.title;
    if (content.type === 'quote') return content.title || '';
    if (content.type === 'drawing') return content.title || '';
    return content.title || '';
  });

  const handleSave = () => {
    let finalContent: SlideContent;
    
    if (currentType === 'title') {
      finalContent = {
        type: 'title',
        title: title,
        subtitle: titleData.subtitle,
      };
    } else if (currentType === 'bullets') {
      const cleanedBullets = bulletText
        .split('\n')
        .map(b => b.trim())
        .filter(b => b);
      
      if (cleanedBullets.length > 5) {
        alert('Please limit your bullet points to 5 or fewer. Remove some bullets before saving.');
        return;
      }
      
      finalContent = {
        type: 'bullets',
        title: title,
        bullets: cleanedBullets.length > 0 ? cleanedBullets : [''],
      };
    } else if (currentType === 'quote') {
      finalContent = {
        type: 'quote',
        title: title,
        quote: quoteData.quote,
        author: quoteData.author,
      };
    } else if (currentType === 'image') {
      finalContent = {
        type: 'image',
        title: title,
        imageUrl: imageData.imageUrl,
        alt: imageData.alt,
      };
    } else {
      // Normalize appState when saving to ensure collaborators is always an array
      let normalizedDrawingData = drawingData;
      try {
        const parsed = JSON.parse(drawingData);
        if (parsed.appState) {
          parsed.appState = {
            ...parsed.appState,
            collaborators: Array.isArray(parsed.appState.collaborators) 
              ? parsed.appState.collaborators 
              : [],
          };
          normalizedDrawingData = JSON.stringify(parsed);
        }
      } catch (e) {
        // If parsing fails, use original data
        console.error('Failed to normalize drawing data:', e);
      }
      
      finalContent = {
        type: 'drawing',
        title: title,
        drawingData: normalizedDrawingData,
      };
    }
    
    onUpdate(finalContent);
    onClose();
  };

  const handleTypeChange = (newType: 'title' | 'quote' | 'bullets' | 'image' | 'drawing') => {
    setCurrentType(newType);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/') && currentType === 'image') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImageData({ ...imageData, imageUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExcalidrawFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      
      // Update drawing data with imported file
      const importedData = JSON.stringify({
        elements: parsed.elements || [],
        appState: parsed.appState || {},
      });
      
      setDrawingData(importedData);
      
      alert('Excalidraw file imported successfully!');
    } catch (error) {
      alert('Failed to import Excalidraw file. Please check the file format.');
      console.error('Import error:', error);
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleOpenFullscreenDrawing = () => {
    // Initialize fullscreen with current drawing data
    setFullscreenDrawingData(drawingData);
    setIsFullscreenDrawing(true);
  };

  const handleCloseFullscreenDrawing = () => {
    // Update main drawing data with fullscreen data
    setDrawingData(fullscreenDrawingData);
    setIsFullscreenDrawing(false);
    
    // Auto-save the drawing when closing fullscreen
    if (currentType === 'drawing') {
      let normalizedDrawingData = fullscreenDrawingData;
      try {
        const parsed = JSON.parse(fullscreenDrawingData);
        if (parsed.appState) {
          parsed.appState = {
            ...parsed.appState,
            collaborators: Array.isArray(parsed.appState.collaborators) 
              ? parsed.appState.collaborators 
              : [],
          };
          normalizedDrawingData = JSON.stringify(parsed);
        }
      } catch (e) {
        console.error('Failed to normalize drawing data:', e);
      }
      
      const finalContent: SlideContent = {
        type: 'drawing',
        title: title,
        drawingData: normalizedDrawingData,
      };
      onUpdate(finalContent);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Slide</h2>

        {/* Title - Always visible */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter title..."
          />
        </div>

        {/* Slide Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slide Type
          </label>
          <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => handleTypeChange('title')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currentType === 'title'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Title
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('quote')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currentType === 'quote'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Quote
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('bullets')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currentType === 'bullets'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bullets
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('image')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currentType === 'image'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Image
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('drawing')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currentType === 'drawing'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Drawing
            </button>
          </div>
        </div>

        {currentType === 'title' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle (optional)
              </label>
              <input
                type="text"
                value={titleData.subtitle}
                onChange={(e) =>
                  setTitleData({ ...titleData, subtitle: e.target.value })
                }
                className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter subtitle..."
              />
            </div>
          </div>
        )}

        {currentType === 'quote' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quote
              </label>
              <textarea
                value={quoteData.quote}
                onChange={(e) =>
                  setQuoteData({ ...quoteData, quote: e.target.value })
                }
                className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Enter your quote..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author
              </label>
              <input
                type="text"
                value={quoteData.author}
                onChange={(e) =>
                  setQuoteData({ ...quoteData, author: e.target.value })
                }
                className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Author name..."
              />
            </div>
          </div>
        )}

        {currentType === 'bullets' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bullet Points (up to 5)
              </label>
              <textarea
                value={bulletText}
                onChange={(e) => setBulletText(e.target.value)}
                className={`w-full p-3 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:border-transparent ${
                  bulletText.split('\n').filter(b => b.trim()).length > 5
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                rows={6}
                placeholder="Enter each bullet point on a new line (max 5)"
              />
              <p className={`text-xs mt-1 ${
                bulletText.split('\n').filter(b => b.trim()).length > 5
                  ? 'text-red-600 font-medium'
                  : 'text-gray-500'
              }`}>
                {bulletText.split('\n').filter(b => b.trim()).length}/5 bullet points
                {bulletText.split('\n').filter(b => b.trim()).length > 5 && (
                  <span className="ml-2">⚠️ Too many bullet points!</span>
                )}
              </p>
            </div>
          </div>
        )}

        {currentType === 'image' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4" />
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or Image URL
              </label>
              <input
                type="text"
                value={imageData.imageUrl}
                onChange={(e) =>
                  setImageData({ ...imageData, imageUrl: e.target.value })
                }
                className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {imageData.imageUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <div className="border border-gray-300 rounded-lg p-2 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageData.imageUrl}
                    alt="Preview"
                    className="max-h-48 mx-auto object-contain"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alt Text
              </label>
              <input
                type="text"
                value={imageData.alt}
                onChange={(e) =>
                  setImageData({ ...imageData, alt: e.target.value })
                }
                className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description of the image..."
              />
            </div>
          </div>
        )}

        {currentType === 'drawing' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Draw your content
              </label>
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => excalidrawFileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4" />
                  Import Excalidraw
                </button>
                <button
                  type="button"
                  onClick={handleOpenFullscreenDrawing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Pencil className="w-4 h-4" />
                  Draw
                </button>
                <input
                  ref={excalidrawFileInputRef}
                  type="file"
                  accept=".excalidraw,application/json"
                  onChange={handleExcalidrawFileImport}
                  className="hidden"
                />
              </div>
              {/* Drawing Preview */}
              <DrawingPreview drawingData={drawingData} title={title} />
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Fullscreen Drawing Modal */}
      {isFullscreenDrawing && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex flex-col">
          <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
            <h2 className="text-xl font-bold">Fullscreen Drawing</h2>
            <button
              onClick={handleCloseFullscreenDrawing}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close fullscreen drawing"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 w-full h-full">
            <Excalidraw
              onChange={(elements, appState) => {
                // Save data continuously as user draws
                const data = JSON.stringify({
                  elements,
                  appState,
                });
                setFullscreenDrawingData(data);
                // Also update drawingData so preview updates in real-time
                setDrawingData(data);
              }}
              initialData={(() => {
                try {
                  const parsed = JSON.parse(fullscreenDrawingData || drawingData);
                  if (parsed.appState) {
                    parsed.appState = {
                      ...parsed.appState,
                      collaborators: Array.isArray(parsed.appState.collaborators) 
                        ? parsed.appState.collaborators 
                        : [],
                    };
                  } else {
                    parsed.appState = { collaborators: [] };
                  }
                  if (!Array.isArray(parsed.elements)) {
                    parsed.elements = [];
                  }
                  return parsed;
                } catch {
                  return { elements: [], appState: { collaborators: [] } };
                }
              })()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

