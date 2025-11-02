"use client";

import { useRouter } from 'next/navigation';
import { Square, Sparkles, Users, Zap } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Square className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Square</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-blue-600 rounded-2xl shadow-lg">
              <Square className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6">
            Square
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
            An opinionated presentation editor and player
          </p>
          
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            AI understands what you build and helps you craft it. 
            It can also help your audience understand and engage with the content.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => router.push('/edit')}
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl active:scale-95 w-full sm:w-auto"
            >
              Start Creating
            </button>
            <button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg active:scale-95 border border-gray-200 w-full sm:w-auto"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Creation</h3>
            <p className="text-gray-600 leading-relaxed">
              Leverage AI to help you create compelling presentations. From brainstorming to polishing, 
              AI assists you every step of the way.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Semantic Structure</h3>
            <p className="text-gray-600 leading-relaxed">
              Built with a semantic foundation, your presentations are more than just slides—they're 
              meaningful content that AI can understand and enhance.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Audience Engagement</h3>
            <p className="text-gray-600 leading-relaxed">
              Your audience can interact with an AI assistant that understands your presentation, 
              helping them grasp concepts and ask questions.
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Ready to create your first presentation?
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Start building beautiful, AI-enhanced square presentations today.
        </p>
        <button
          onClick={() => router.push('/edit')}
          className="px-10 py-5 bg-blue-600 text-white text-xl font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          Get Started
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Square className="w-5 h-5 text-blue-600" />
            <span className="font-semibold">Square</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm">Opinionated presentation editor</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
