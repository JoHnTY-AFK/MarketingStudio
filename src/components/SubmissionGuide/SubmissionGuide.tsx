import React, { useState } from 'react';
import { Info, CheckCircle2, Video, Mic, Eye, Sparkles, Award, X } from 'lucide-react';

export default function SubmissionGuide() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl shadow-indigo-500/40 transition-all hover:scale-110 group"
        title="Project Submission Guide"
      >
        <Award className="w-6 h-6" />
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10">
          Submission Guide
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-bottom border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Award className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Project Submission Guide</h2>
              <p className="text-xs text-gray-400">How this project meets the Gemini API Developer Competition criteria</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Core Categories
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Mic className="w-4 h-4" />
                  <span className="text-sm font-medium">Live Agent</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Uses the <strong>Gemini Live API</strong> for real-time multimodal interaction. The agent "sees" the 3D scene via video streaming and "hears" commands via audio streaming.
                </p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Creative Storyteller</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Generates rich, mixed-media responses. Combines 3D scene manipulation with AI-generated backdrops, narration, and cinematic camera planning.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Multimodal Capabilities
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-sm text-gray-200 font-medium">Vision & Spatial Understanding</span>
                  <p className="text-xs text-gray-400">AI analyzes the 3D model to automatically annotate key features (logo, textures) and maps them to 3D coordinates for camera tracking.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-sm text-gray-200 font-medium">Real-time Audio</span>
                  <p className="text-xs text-gray-400">Natural language voice commands for directing the scene, changing environments, and triggering special effects.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-sm text-gray-200 font-medium">Generative Assets</span>
                  <p className="text-xs text-gray-400">On-demand 360° panoramic backdrops generated from text prompts to create immersive product environments.</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <Video className="w-4 h-4" />
              Key Features for Judges
            </h3>
            <div className="space-y-3">
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                <span className="text-xs font-mono text-indigo-400">01. Live Director</span>
                <p className="text-xs text-gray-300 mt-1">Click the "Live Director" button to start a real-time session. Try saying: "Show me the logo from a low angle" or "Create a futuristic neon city backdrop".</p>
              </div>
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                <span className="text-xs font-mono text-indigo-400">02. Auto-Annotation</span>
                <p className="text-xs text-gray-300 mt-1">Upload a custom 3D model and use the "Auto Annotate" feature. The AI will find important parts of your product automatically.</p>
              </div>
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                <span className="text-xs font-mono text-indigo-400">03. Cinematic Film Generation</span>
                <p className="text-xs text-gray-300 mt-1">Use the "Film" mode in the Director tab to generate a complete advertising sequence with narration and music, then download the final video.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
            <Info className="w-3 h-3" />
            FREE TIER COMPLIANT
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
