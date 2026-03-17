import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import TopBar from './components/TopBar/TopBar';
import Scene from './components/Scene/Scene';
import { AppProvider, useAppContext } from './context/AppContext';
import { Loader2, Key } from 'lucide-react';

function AppContent() {
  const { isRecordingVideo } = useAppContext();

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-gray-300 font-sans overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 relative bg-[#0a0a0a]">
        <TopBar />
        <div className="w-full h-full relative">
          <Scene />
        </div>
      </main>

      {isRecordingVideo && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 pointer-events-auto">
          <div className="bg-[#151619] border border-white/10 p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin relative z-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-white">Generating Film</h2>
              <p className="text-sm text-gray-400/80">Please wait while your cinematic sequence is being recorded. Do not interact with the scene.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

