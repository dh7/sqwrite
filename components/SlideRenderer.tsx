"use client";

import { SlideContent } from '@/lib/types';
import { useEffect, useRef } from 'react';

interface SlideRendererProps {
  content: SlideContent;
}

const CANVAS_SIZE = 800; // Square canvas size

// Calculate bounding box of all Excalidraw elements
function calculateBounds(elements: any[]): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } | null {
  if (!elements || elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((element) => {
    if (element.points && Array.isArray(element.points)) {
      // For elements with points array (lines, arrows, etc.)
      // Points is flat: [x1, y1, x2, y2, ...]
      for (let i = 0; i < element.points.length; i += 2) {
        const x = element.x + (element.points[i] || 0);
        const y = element.y + (element.points[i + 1] || 0);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    } else if (element.x !== undefined && element.y !== undefined) {
      // For elements with x, y, width, height (rectangles, ellipses, text, etc.)
      const x = element.x;
      const y = element.y;
      const width = element.width || 0;
      const height = element.height || 0;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    }
  });

  if (minX === Infinity) return null;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export default function SlideRenderer({ content }: SlideRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentImageUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Revoke previous image URL to prevent caching
    if (currentImageUrlRef.current) {
      URL.revokeObjectURL(currentImageUrlRef.current);
      currentImageUrlRef.current = null;
    }

    // Handle drawing type - export Excalidraw to SVG and render on canvas
    if (content.type === 'drawing') {
      const renderDrawing = async () => {
        try {
          if (!content.drawingData) return;
          
          const parsed = JSON.parse(content.drawingData);
          if (!parsed.elements || parsed.elements.length === 0) return;

          // Normalize appState to ensure proper structure while preserving all properties
          const normalizedAppState = {
            ...(parsed.appState || {}),
            collaborators: Array.isArray(parsed.appState?.collaborators) 
              ? parsed.appState.collaborators 
              : [],
            viewBackgroundColor: '#ffffff', // White background for canvas
          };

          // Ensure elements is an array and filter out deleted elements
          const allElements = Array.isArray(parsed.elements) ? parsed.elements : [];
          const elements = allElements.filter((el: any) => !el.isDeleted);

          // Calculate bounding box of actual drawing content
          const bounds = calculateBounds(elements);
          
          // Normalize appState to focus viewport on actual content (remove whitespace)
          let optimizedAppState = { ...normalizedAppState };
          if (bounds && bounds.width > 0 && bounds.height > 0) {
            // Calculate center of content
            const centerX = bounds.minX + bounds.width / 2;
            const centerY = bounds.minY + bounds.height / 2;
            
            // Calculate optimal zoom to fit content with minimal padding
            // Use a standard viewport size (e.g., 2000x2000) to calculate zoom
            const viewportPadding = 50;
            const targetViewportWidth = bounds.width + viewportPadding * 2;
            const targetViewportHeight = bounds.height + viewportPadding * 2;
            
            // Calculate zoom to fit content in viewport
            const baseZoom = normalizedAppState.zoom?.value || 1;
            const zoomX = (2000 / targetViewportWidth) * baseZoom;
            const zoomY = (2000 / targetViewportHeight) * baseZoom;
            const optimalZoom = Math.min(zoomX, zoomY);
            
            // Center viewport on content
            optimizedAppState = {
              ...normalizedAppState,
              scrollX: -centerX,
              scrollY: -centerY,
              zoom: { value: optimalZoom as any },
            };
          }
          
          // Dynamically import Excalidraw export function
          const { exportToBlob } = await import('@excalidraw/excalidraw');
          
          // Calculate export padding based on bounds
          const exportPadding = bounds && bounds.width > 0 && bounds.height > 0 ? 20 : 10;
          
          // Export to PNG with normalized viewport
          const blob = await exportToBlob({
            elements: elements,
            appState: {
              ...optimizedAppState,
              exportBackground: true,
              exportWithDarkMode: false,
              exportEmbedScene: false,
            },
            mimeType: 'image/png',
            quality: 1,
            exportPadding: exportPadding,
            files: null,
          });

          const url = URL.createObjectURL(blob);
          currentImageUrlRef.current = url;

          const img = new Image();
          img.onload = () => {
            // Clear canvas again before drawing to ensure clean state
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            
            let currentY = 120;
            
            // Draw title if exists
            if (content.title) {
              ctx.textAlign = 'left';
              ctx.font = 'bold 40px "Georgia", "Baskerville", "Palatino", "Times New Roman", serif';
              ctx.fillStyle = '#1a1a1a';
              
              const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
                ctx.font = `${fontSize}px "Georgia", "Baskerville", "Palatino", "Times New Roman", serif`;
                const words = text.split(' ');
                const lines: string[] = [];
                let currentLine = '';
                for (const word of words) {
                  const testLine = currentLine + (currentLine ? ' ' : '') + word;
                  const metrics = ctx.measureText(testLine);
                  if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                  } else {
                    currentLine = testLine;
                  }
                }
                if (currentLine) lines.push(currentLine);
                return lines;
              };
              
              const titleLines = wrapText(content.title, CANVAS_SIZE - 120, 40);
              titleLines.forEach((line, i) => {
                ctx.fillText(line, 60, currentY + i * 50);
              });
              currentY += titleLines.length * 50 + 40; // Reduced spacing
            } else {
              // If no title, start drawing closer to top
              currentY = 60;
            }

            // Calculate available space - use maximum space available
            const availableHeight = CANVAS_SIZE - currentY - 20; // Minimal bottom padding
            const availableWidth = CANVAS_SIZE - 40; // Minimal side padding for maximum space
            
            // Calculate scale to maximize size
            // PNG export with exportPadding should already be cropped to content bounds
            // So we can use image dimensions directly, which should match content size
            const scale = Math.min(
              availableWidth / img.width,
              availableHeight / img.height
            );
            
            const width = img.width * scale;
            const height = img.height * scale;
            
            // Center the drawing horizontally and align to top
            const x = (CANVAS_SIZE - width) / 2;
            const y = currentY;
            
            ctx.drawImage(img, x, y, width, height);
          };
          img.onerror = () => {
            console.error('Failed to load PNG image');
            if (currentImageUrlRef.current) {
              URL.revokeObjectURL(currentImageUrlRef.current);
              currentImageUrlRef.current = null;
            }
          };
          img.src = url;
        } catch (e) {
          console.error('Failed to render Excalidraw drawing:', e);
        }
      };

      renderDrawing();
      return;
    }

    // Helper function to wrap text
    const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
      ctx.font = `${fontSize}px "Georgia", "Baskerville", "Palatino", "Times New Roman", serif`;
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    // Render based on slide type
    if (content.type === 'title') {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1a1a1a';
      
      const titleLines = wrapText(content.title, CANVAS_SIZE - 120, 72);
      const startY = content.subtitle ? CANVAS_SIZE / 2 - 80 : CANVAS_SIZE / 2 - 36;
      
      ctx.font = 'bold 72px "Georgia", "Baskerville", "Palatino", "Times New Roman", serif';
      titleLines.forEach((line, i) => {
        ctx.fillText(line, CANVAS_SIZE / 2, startY + i * 80);
      });

      if (content.subtitle) {
        ctx.font = '36px "Georgia", "Baskerville", "Palatino", "Times New Roman", serif';
        ctx.fillStyle = '#6b7280';
        const subtitleLines = wrapText(content.subtitle, CANVAS_SIZE - 120, 36);
        subtitleLines.forEach((line, i) => {
          ctx.fillText(line, CANVAS_SIZE / 2, startY + titleLines.length * 80 + 60 + i * 45);
        });
      }
    }

    if (content.type === 'quote') {
      let currentY = 120;

      // Draw title at top-left if exists
      if (content.title) {
        ctx.textAlign = 'left';
        ctx.font = 'bold 40px "Georgia", "Baskerville", "Palatino", "Times New Roman", serif';
        ctx.fillStyle = '#1a1a1a';
        const titleLines = wrapText(content.title, CANVAS_SIZE - 120, 40);
        titleLines.forEach((line, i) => {
          ctx.fillText(line, 60, currentY + i * 50);
        });
        currentY += titleLines.length * 50 + 80;
      } else {
        currentY = CANVAS_SIZE / 2 - 120;
      }

      ctx.textAlign = 'center';

      // Draw quote in italic gray
      ctx.font = 'italic 48px "Georgia", "Baskerville", "Palatino", "Times New Roman", serif';
      ctx.fillStyle = '#6b7280';
      
      // Create a helper to wrap text with the correct font for measuring
      const wrapTextSerif = (text: string, maxWidth: number, fontSize: number): string[] => {
        ctx.font = `italic ${fontSize}px "Georgia", "Baskerville", "Palatino", "Times New Roman", serif`;
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      };
      
      const quoteLines = wrapTextSerif(content.quote, CANVAS_SIZE - 200, 48);
      quoteLines.forEach((line, i) => {
        ctx.fillText(line, CANVAS_SIZE / 2, currentY + i * 62);
      });
      currentY += quoteLines.length * 62 + 40;

      // Draw author at bottom-right
      if (content.author) {
        ctx.textAlign = 'right';
        ctx.font = 'italic 32px "Georgia", "Baskerville", "Palatino", "Times New Roman", serif';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(`— ${content.author}`, CANVAS_SIZE - 100, CANVAS_SIZE - 80);
      }
    }

    if (content.type === 'bullets') {
      ctx.textAlign = 'left';
      
      ctx.font = 'bold 40px "Georgia", "Baskerville", "Palatino", "Times New Roman", serif';
      ctx.fillStyle = '#1a1a1a';
      const titleLines = wrapText(content.title, CANVAS_SIZE - 120, 40);
      let currentY = 120;
      
      titleLines.forEach((line, i) => {
        ctx.fillText(line, 60, currentY + i * 50);
      });
      currentY += titleLines.length * 50 + 60;

      ctx.font = '30px "Georgia", "Baskerville", "Palatino", "Times New Roman", serif';
      ctx.fillStyle = '#4b5563';
      
      // Measure bullet character width
      ctx.font = '16px "Georgia", serif';
      const bulletChar = '•';
      const bulletWidth = ctx.measureText(bulletChar).width;
      const bulletSpacing = 12;
      const bulletX = 60;
      const textStartX = bulletX + bulletWidth + bulletSpacing;
      const textWidth = CANVAS_SIZE - textStartX - 60; // Available width for text
      
      ctx.font = '30px "Georgia", "Baskerville", "Palatino", "Times New Roman", serif';
      
      content.bullets.forEach(bullet => {
        const bulletLines = wrapText(bullet, textWidth, 30);
        bulletLines.forEach((line, i) => {
          if (i === 0) {
            // Draw bullet point
            ctx.font = '16px "Georgia", "Baskerville", "Palatino", "Times New Roman", serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText(bulletChar, bulletX, currentY);
            
            // Draw first line of text
            ctx.font = '30px "Georgia", "Baskerville", "Palatino", "Times New Roman", serif';
            ctx.fillStyle = '#4b5563';
            ctx.fillText(line, textStartX, currentY);
          } else {
            // Wrapped lines align with first line text
            ctx.fillText(line, textStartX, currentY);
          }
          currentY += 50;
        });
        currentY += 18;
      });
    }

    if (content.type === 'image') {
      let currentY = 120;
      
      if (content.title) {
        ctx.textAlign = 'left';
        ctx.font = 'bold 40px "Georgia", "Baskerville", "Palatino", "Times New Roman", serif';
        ctx.fillStyle = '#1a1a1a';
        const titleLines = wrapText(content.title, CANVAS_SIZE - 120, 40);
        titleLines.forEach((line, i) => {
          ctx.fillText(line, 60, currentY + i * 50);
        });
        currentY += titleLines.length * 50 + 60;
      }

      // Load and draw image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const availableHeight = CANVAS_SIZE - currentY - 50;
        const availableWidth = CANVAS_SIZE - 120; // Match title margins (60px left + 60px right)
        
        const scale = Math.min(
          availableWidth / img.width,
          availableHeight / img.height
        );
        
        const width = img.width * scale;
        const height = img.height * scale;
        const x = 60; // Align with title's left margin
        const y = currentY; // Top-align with bullets
        
        ctx.drawImage(img, x, y, width, height);
      };
      img.src = content.imageUrl;
    }
    
    // Cleanup function to revoke URL when component unmounts or content changes
    return () => {
      if (currentImageUrlRef.current) {
        URL.revokeObjectURL(currentImageUrlRef.current);
        currentImageUrlRef.current = null;
      }
    };
  }, [content]);

  return (
    <div className="w-full h-full grid place-items-center min-w-0 min-h-0">
      <div className="w-[min(100%,100vh)] aspect-square shadow-lg rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}

