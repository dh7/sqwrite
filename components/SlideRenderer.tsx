"use client";

import { SlideContent } from '@/lib/types';
import { useEffect, useRef } from 'react';

interface SlideRendererProps {
  content: SlideContent;
}

const CANVAS_SIZE = 800; // Square canvas size

export default function SlideRenderer({ content }: SlideRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Handle drawing type - export Excalidraw to SVG and render on canvas
    if (content.type === 'drawing') {
      const renderDrawing = async () => {
        try {
          if (!content.drawingData) return;
          
          const parsed = JSON.parse(content.drawingData);
          if (!parsed.elements || parsed.elements.length === 0) return;

          // Dynamically import Excalidraw export function
          const { exportToSvg } = await import('@excalidraw/excalidraw');
          
          // Export to SVG
          const svg = await exportToSvg({
            elements: parsed.elements,
            appState: {
              ...parsed.appState,
              viewBackgroundColor: '#ffffff', // White background
            },
            files: null,
          });

          // Convert SVG to image and draw on canvas
          const svgString = new XMLSerializer().serializeToString(svg);
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);

          const img = new Image();
          img.onload = () => {
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
              currentY += titleLines.length * 50 + 60;
            }

            // Calculate available space and scale
            const availableHeight = CANVAS_SIZE - currentY - 50;
            const availableWidth = CANVAS_SIZE - 120;
            
            const scale = Math.min(
              availableWidth / img.width,
              availableHeight / img.height
            );
            
            const width = img.width * scale;
            const height = img.height * scale;
            const x = 60; // Align with title's left margin
            const y = currentY;
            
            ctx.drawImage(img, x, y, width, height);
            URL.revokeObjectURL(url);
          };
          img.onerror = () => {
            console.error('Failed to load SVG image');
            URL.revokeObjectURL(url);
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

