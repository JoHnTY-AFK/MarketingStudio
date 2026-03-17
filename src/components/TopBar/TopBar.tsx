import React from 'react';
import { Camera } from 'lucide-react';
export default function TopBar() {
  const handleCapture = () => {
    const canvas = document.querySelector('#product-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `product-render-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none z-10">
      <div className="flex items-start gap-3">
        <div className="bg-[#151619]/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 pointer-events-auto">
          <span className="text-sm font-medium text-white">
            Physical Shading (PBR)
          </span>
        </div>
      </div>
      
      <button
        onClick={handleCapture}
        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors pointer-events-auto flex items-center gap-2 shadow-lg shadow-indigo-500/20"
      >
        <Camera className="w-4 h-4" />
        Capture Image
      </button>
    </div>
  );
}
