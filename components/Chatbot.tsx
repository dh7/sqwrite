"use client";

import { useChat } from 'ai/react';
import { Send, Bot, User } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { presentationCache } from '@/lib/mindcache-store';

export default function Chatbot() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      // Send all MindCache data with each request
      mindcacheData: typeof window !== 'undefined' 
        ? presentationCache.getAll()
        : null,
    },
    onToolCall: ({ toolCall }) => {
      // When AI calls a tool, apply the changes to client MindCache
      console.log('Tool called:', toolCall.toolName, toolCall.args);
      
      if (toolCall.toolName === 'updatePresentationTitle') {
        presentationCache.set('Presentation_Name', toolCall.args.title);
      } else if (toolCall.toolName === 'updateSlideContent') {
        const slideNum = String(toolCall.args.slideNumber).padStart(3, '0');
        presentationCache.set(`Slide_${slideNum}_content`, toolCall.args.content);
      } else if (toolCall.toolName === 'updateSpeakerNotes') {
        const slideNum = String(toolCall.args.slideNumber).padStart(3, '0');
        presentationCache.set(`Slide_${slideNum}_notes`, toolCall.args.notes);
      } else if (toolCall.toolName === 'addSlide') {
        // Find the next slide number
        const keys = presentationCache.keys();
        const slideNums = keys
          .filter(k => k.match(/^Slide_\d{3}_content$/))
          .map(k => parseInt(k.match(/Slide_(\d{3})_content/)?.[1] || '0'))
          .filter(n => !isNaN(n));
        
        const nextNum = slideNums.length > 0 ? Math.max(...slideNums) + 1 : 1;
        const slideNum = String(nextNum).padStart(3, '0');
        
        presentationCache.set(`Slide_${slideNum}_content`, toolCall.args.content);
        presentationCache.set(`Slide_${slideNum}_notes`, toolCall.args.notes || '');
      }
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-4 sm:mt-8">
            <Bot className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm sm:text-base">Start a conversation to edit your presentation</p>
            <p className="text-xs sm:text-sm mt-2">Try asking:</p>
            <ul className="text-xs sm:text-sm text-left max-w-xs mx-auto mt-2 space-y-1 px-4">
              <li>• "Rewrite the first slide to be more engaging"</li>
              <li>• "Add speaker notes about market trends"</li>
              <li>• "Make the bullet points more concise"</li>
            </ul>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me to help..."
            className="flex-1 p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

