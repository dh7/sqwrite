"use client";

import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';

interface SpeakerNotesProps {
  notes: string;
  onUpdate: (notes: string) => void;
}

export default function SpeakerNotes({ notes, onUpdate }: SpeakerNotesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(notes);

  const handleSave = () => {
    onUpdate(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(notes);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Speaker Notes</h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full h-40 sm:h-48 p-2 sm:p-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-xs sm:text-sm"
          placeholder="Write speaker notes in markdown..."
        />
      ) : (
        <div className="prose prose-sm max-w-none text-gray-700 text-sm sm:text-base">
          <ReactMarkdown>{notes}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

