"use client";

import { SlideContent, QuoteContent, BulletsContent, ImageContent } from '@/lib/types';
import { useState } from 'react';

interface SlideEditorProps {
  content: SlideContent;
  onUpdate: (content: SlideContent) => void;
  onClose: () => void;
}

export default function SlideEditor({ content, onUpdate, onClose }: SlideEditorProps) {
  const [editedContent, setEditedContent] = useState<SlideContent>(content);

  const handleSave = () => {
    onUpdate(editedContent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Slide</h2>

        {editedContent.type === 'quote' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quote
              </label>
              <textarea
                value={editedContent.quote}
                onChange={(e) =>
                  setEditedContent({ ...editedContent, quote: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author (optional)
              </label>
              <input
                type="text"
                value={editedContent.author || ''}
                onChange={(e) =>
                  setEditedContent({ ...editedContent, author: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {editedContent.type === 'bullets' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={editedContent.title}
                onChange={(e) =>
                  setEditedContent({ ...editedContent, title: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bullet Points (one per line)
              </label>
              <textarea
                value={editedContent.bullets.join('\n')}
                onChange={(e) =>
                  setEditedContent({
                    ...editedContent,
                    bullets: e.target.value.split('\n').filter(b => b.trim()),
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
              />
            </div>
          </div>
        )}

        {editedContent.type === 'image' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={editedContent.imageUrl}
                onChange={(e) =>
                  setEditedContent({ ...editedContent, imageUrl: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text (optional)
              </label>
              <input
                type="text"
                value={editedContent.alt || ''}
                onChange={(e) =>
                  setEditedContent({ ...editedContent, alt: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

