import React, { useState } from 'react';
import { Box, Settings, Clapperboard } from 'lucide-react';
import WorkspaceTab from './WorkspaceTab';
import { DirectorTab } from './DirectorTab';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'director'>('workspace');

  return (
    <aside className="w-[340px] flex-shrink-0 bg-[#151619] border-r border-white/10 flex flex-col h-full overflow-hidden shadow-2xl z-10">
      <div className="p-6 border-b border-white/5">
        <h1 className="text-lg font-semibold text-white flex items-center gap-2 tracking-tight">
          <Box className="w-5 h-5 text-indigo-400" />
          Product Studio
        </h1>
        <p className="text-[10px] text-gray-500 mt-1 font-mono uppercase tracking-widest">
          Virtual Workspace
        </p>
      </div>

      <div className="p-4 border-b border-white/5 bg-black/20">
        <div className="flex bg-[#0a0a0a] rounded-lg p-1 border border-white/5">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-2 rounded-md transition-all ${
              activeTab === 'workspace' ? 'text-white bg-[#222] shadow-sm' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Workspace
          </button>
          <button
            onClick={() => setActiveTab('director')}
            className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-2 rounded-md transition-all ${
              activeTab === 'director' ? 'text-white bg-[#222] shadow-sm' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            Director
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'workspace' ? <div className="p-6 flex flex-col gap-8"><WorkspaceTab /></div> : <DirectorTab />}
      </div>
      
      <div className="p-4 border-t border-white/5 bg-black/20 text-[10px] text-gray-600 font-mono text-center">
        <p>Use mouse to rotate, zoom, and pan.</p>
      </div>
    </aside>
  );
}
