"use client";

import { SlideContent, QuoteContent, BulletsContent, ImageContent } from '@/lib/types';
import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

interface SlideEditorProps {
  content: SlideContent;
  onUpdate: (content: SlideContent) => void;
  onClose: () => void;
}

export default function SlideEditor({ content, onUpdate, onClose }: SlideEditorProps) {
  const [editedContent, setEditedContent] = useState<SlideContent>(content);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulletText, setBulletText] = useState<string>(() => 
    content.type === 'bullets' ? content.bullets.join('\n') : ''
  );

  const handleSave = () => {
    // Clean up bullets before saving
    if (editedContent.type === 'bullets') {
      const cleanedBullets = bulletText
        .split('\n')
        .map(b => b.trim())
        .filter(b => b);
      
      if (cleanedBullets.length > 5) {
        alert('Please limit your bullet points to 5 or fewer. Remove some bullets before saving.');
        return;
      }
      
      onUpdate({
        ...editedContent,
        bullets: cleanedBullets.length > 0 ? cleanedBullets : [''],
      });
    } else {
      onUpdate(editedContent);
    }
    onClose();
  };

  const [title, setTitle] = useState<string>(() => {
    if (content.type === 'bullets') return content.title;
    if (content.type === 'quote') return content.title || '';
    return content.title || '';
  });

  const handleTypeChange = (newType: 'quote' | 'bullets' | 'image') => {
    if (newType === 'quote') {
      setEditedContent({
        type: 'quote',
        title: title,
        quote: '',
        author: '',
      });
    } else if (newType === 'bullets') {
      setBulletText(''); // Reset bullet text
      setEditedContent({
        type: 'bullets',
        title: title,
        bullets: [''],
      });
    } else if (newType === 'image') {
      setEditedContent({
        type: 'image',
        title: title,
        imageUrl: '',
        alt: '',
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/') && editedContent.type === 'image') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setEditedContent({ ...editedContent, imageUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (editedContent.type === 'bullets') {
      setEditedContent({ ...editedContent, title: newTitle });
    } else if (editedContent.type === 'quote') {
      setEditedContent({ ...editedContent, title: newTitle });
    } else if (editedContent.type === 'image') {
      setEditedContent({ ...editedContent, title: newTitle });
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
            onChange={(e) => handleTitleChange(e.target.value)}
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
              onClick={() => handleTypeChange('quote')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                editedContent.type === 'quote'
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
                editedContent.type === 'bullets'
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
                editedContent.type === 'image'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Image
            </button>
          </div>
        </div>

        {editedContent.type === 'quote' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quote
              </label>
              <textarea
                value={editedContent.quote}
                onChange={(e) =>
                  setEditedContent({ ...editedContent, quote: e.target.value })
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
                value={editedContent.author || ''}
                onChange={(e) =>
                  setEditedContent({ ...editedContent, author: e.target.value })
                }
                className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Author name..."
              />
            </div>
          </div>
        )}

        {editedContent.type === 'bullets' && (
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

        {editedContent.type === 'image' && (
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
                value={editedContent.imageUrl}
                onChange={(e) =>
                  setEditedContent({ ...editedContent, imageUrl: e.target.value })
                }
                className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {editedContent.imageUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <div className="border border-gray-300 rounded-lg p-2 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editedContent.imageUrl}
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
                value={editedContent.alt || ''}
                onChange={(e) =>
                  setEditedContent({ ...editedContent, alt: e.target.value })
                }
                className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description of the image..."
              />
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
    </div>
  );
}

