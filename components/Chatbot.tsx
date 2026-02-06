"use client";

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isToolUIPart, getToolName } from 'ai';
import { Send } from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';

import { presentationCache, presentationHelpers } from '@/lib/mindcache-store';
import { trackEvent } from '@/lib/sessionTracking';

function getMessageText(message: { parts: Array<{ type: string; text?: string }> }): string {
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

function applyToolResult(toolName: string, result: any) {
  if (!result?.data) return;
  const data = result.data;

  if (toolName === 'updatePresentationTitle') {
    presentationCache.set('Presentation_Name', data.title);
  } else if (toolName === 'updateSlideContent') {
    const slideNum = String(data.slideNumber).padStart(3, '0');
    presentationCache.set(`Slide_${slideNum}_content`, data.content);
  } else if (toolName === 'updateSpeakerNotes') {
    const slideNum = String(data.slideNumber).padStart(3, '0');
    presentationCache.set(`Slide_${slideNum}_notes`, data.notes);
  } else if (toolName === 'addSlide') {
    const keys = presentationCache.keys();
    const slideNums = keys
      .filter(k => k.match(/^Slide_\d{3}_content$/))
      .map(k => parseInt(k.match(/Slide_(\d{3})_content/)?.[1] || '0'))
      .filter(n => !isNaN(n));

    const nextNum = slideNums.length > 0 ? Math.max(...slideNums) + 1 : 1;
    const slideNum = String(nextNum).padStart(3, '0');

    presentationCache.set(`Slide_${slideNum}_content`, data.content);
    presentationCache.set(`Slide_${slideNum}_notes`, data.notes || '');
    presentationHelpers.setCurrentSlideIndex(nextNum - 1);
  } else if (toolName === 'setCurrentSlide') {
    presentationHelpers.setCurrentSlideIndex(data.slideNumber - 1);
  }
}

export default function Chatbot() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const processedToolCalls = useRef(new Set<string>());

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: () => ({
      mindcacheData: presentationCache.getAll(),
    }),
  }), []);

  const { messages, sendMessage, status } = useChat({
    transport,
    onFinish: ({ message }) => {
      trackEvent('chat_answer', { answer: getMessageText(message).slice(0, 200), path: '/edit' });
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Watch messages for tool results and apply them
  useEffect(() => {
    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;
      for (const part of msg.parts) {
        if (isToolUIPart(part) && (part as any).state === 'output-available') {
          const id = (part as any).toolCallId;
          if (!processedToolCalls.current.has(id)) {
            processedToolCalls.current.add(id);
            const name = getToolName(part);
            console.log('Tool result:', name, (part as any).output);
            applyToolResult(name, (part as any).output);
          }
        }
      }
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    trackEvent('chat_message', { content: message.slice(0, 200), path: '/edit' });
    sendMessage({ parts: [{ type: 'text', text: message }] });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-4 sm:mt-8">
            <p className="text-sm sm:text-base">Hi! I&apos;m here to help you create an amazing presentation.</p>
            <p className="text-xs sm:text-sm mt-2">I can help with:</p>
            <ul className="text-xs sm:text-sm text-left max-w-xs mx-auto mt-2 space-y-1 px-4">
              <li>• Brainstorming ideas and structure</li>
              <li>• Writing and refining content</li>
              <li>• Creating new slides</li>
              <li>• Improving speaker notes</li>
              <li>• Answering your questions</li>
            </ul>
            <p className="text-xs sm:text-sm mt-3 italic">Just ask me anything!</p>
          </div>
        )}

        {messages
          .filter((message) => getMessageText(message).trim().length > 0)
          .map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{getMessageText(message)}</p>
              </div>
            </div>
          ))}

        {isLoading && (
          <div className="flex justify-start">
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
                onChange={(e) => setInput(e.target.value)}
                placeholder="What would you like to create?"
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
