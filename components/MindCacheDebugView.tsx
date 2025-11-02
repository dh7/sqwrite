"use client";

import { useState, useEffect } from 'react';
import { presentationCache } from '@/lib/mindcache-store';
import { X, Trash2, Plus, Save } from 'lucide-react';

interface MindCacheDebugViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MindCacheDebugView({ isOpen, onClose }: MindCacheDebugViewProps) {
  const [stmData, setStmData] = useState<Record<string, any>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadSTM();
    }
  }, [isOpen, refreshKey]);

  const loadSTM = () => {
    const allData = presentationCache.getAll();
    setStmData(allData);
  };

  const handleEdit = (key: string) => {
    const value = presentationCache.get(key);
    setEditingKey(key);
    setEditValue(JSON.stringify(value, null, 2));
  };

  const handleSave = (key: string) => {
    try {
      const parsed = JSON.parse(editValue);
      presentationCache.set(key, parsed);
      setEditingKey(null);
      setRefreshKey(k => k + 1);
      // Trigger presentation update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('presentation-updated'));
      }
    } catch (e) {
      alert('Invalid JSON format');
    }
  };

  const handleDelete = (key: string) => {
    if (confirm(`Delete "${key}" from MindCache?`)) {
      presentationCache.delete(key);
      setRefreshKey(k => k + 1);
      // Trigger presentation update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('presentation-updated'));
      }
    }
  };

  const handleAdd = () => {
    if (!newKey) {
      alert('Please enter a key');
      return;
    }
    try {
      const parsed = newValue ? JSON.parse(newValue) : null;
      presentationCache.set(newKey, parsed);
      setNewKey('');
      setNewValue('');
      setRefreshKey(k => k + 1);
    } catch (e) {
      alert('Invalid JSON format');
    }
  };

  const handleClear = () => {
    if (confirm('Clear all MindCache data?')) {
      presentationCache.clear();
      setRefreshKey(k => k + 1);
      // Trigger presentation update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('presentation-updated'));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">MindCache Debug View</h2>
            <p className="text-sm text-gray-600 mt-1">
              Keys: {presentationCache.keys().length} | Size: {presentationCache.size()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Current STM Data */}
          {Object.entries(stmData).map(([key, value]) => (
            <div key={key} className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-mono font-semibold text-lg text-blue-600">{key}</h3>
                <div className="flex gap-2">
                  {editingKey === key ? (
                    <>
                      <button
                        onClick={() => handleSave(key)}
                        className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(key)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                      >
                        Edit
                      </button>
                      {key !== '$date' && key !== '$time' && (
                        <button
                          onClick={() => handleDelete(key)}
                          className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {editingKey === key ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full h-64 p-2 font-mono text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <pre className="bg-gray-50 p-3 rounded overflow-x-auto text-sm">
                  {JSON.stringify(value, null, 2)}
                </pre>
              )}
            </div>
          ))}

          {/* Add New Entry */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Entry
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key
                </label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="my-key"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value (JSON)
                </label>
                <textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder='{"example": "value"}'
                  className="w-full h-24 p-2 font-mono text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Entry
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Cmd</kbd> +{' '}
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Shift</kbd> +{' '}
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">D</kbd> to toggle
          </p>
        </div>
      </div>
    </div>
  );
}

