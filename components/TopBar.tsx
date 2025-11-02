"use client";

import { Download, Upload } from 'lucide-react';
import { presentationCache } from '@/lib/mindcache-store';
import { useEffect, useRef } from 'react';

interface TopBarProps {
  presentationName: string;
  onNameChange: (name: string) => void;
}

export default function TopBar({ presentationName, onNameChange }: TopBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save to cookies whenever MindCache changes
  useEffect(() => {
    const saveToCookies = () => {
      const stmData = JSON.stringify(presentationCache.getAll());
      if (typeof document !== 'undefined') {
        document.cookie = `sqwrite_presentation=${encodeURIComponent(stmData)}; max-age=${60 * 60 * 24 * 365}; path=/`;
      }
    };

    presentationCache.subscribeToAll(saveToCookies);
    
    return () => {
      presentationCache.unsubscribeFromAll(saveToCookies);
    };
  }, []);

  const handleExport = () => {
    const stmData = JSON.stringify(presentationCache.getAll(), null, 2);
    const blob = new Blob([stmData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${presentationName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.sqwrite`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          const parsedData = JSON.parse(content);
          presentationCache.clear();
          presentationCache.update(parsedData);
          alert('Presentation imported successfully!');
        } catch (error) {
          alert('Failed to import presentation. Please check the file format.');
          console.error('Import error:', error);
        }
      }
    };
    reader.readAsText(file);
    
    // Reset input so the same file can be imported again
    event.target.value = '';
  };

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <input
          type="text"
          value={presentationName}
          onChange={(e) => onNameChange(e.target.value)}
          className="text-base sm:text-xl font-bold bg-transparent text-gray-900 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 flex-1 max-w-md"
          placeholder="Presentation Name"
        />
        
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".sqwrite"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}

