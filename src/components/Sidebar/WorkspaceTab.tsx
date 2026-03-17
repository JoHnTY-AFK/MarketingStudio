import React from 'react';
import { Box, Camera, Circle, Globe, Monitor, Sun, Target, Upload, Image as ImageIcon, Trash2, Sparkles, Disc, Zap, PartyPopper, Activity, Layers, Music, Play, Square, Wand2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { LightType } from '../../types';
import { ImageAgent } from '../../services/imageAgent';

const MUSIC_PRESETS = [
  { id: 'corporate', name: 'Upbeat Corporate', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73456.mp3' },
  { id: 'tech', name: 'Ambient Tech', url: 'https://cdn.pixabay.com/audio/2022/02/22/audio_d0c6ff1bab.mp3' },
  { id: 'pop', name: 'Energetic Pop', url: 'https://cdn.pixabay.com/audio/2021/11/24/audio_8378f09014.mp3' },
  { id: 'jazz', name: 'Smooth Jazz', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_2760824043.mp3' },
];

function MusicSection() {
  const { musicVolume, setMusicVolume, narrationVolume, setNarrationVolume } = useAppContext();
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handlePlay = (id: string, url: string) => {
    if (playingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingId(null);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const audio = new Audio(url);
    audio.crossOrigin = "anonymous";
    audio.volume = musicVolume;
    audioRef.current = audio;
    audio.play().catch(e => {
      if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') {
        console.error("Audio play failed", e);
      }
    });
    setPlayingId(id);

    timeoutRef.current = setTimeout(() => {
      audio.pause();
      setPlayingId(null);
    }, 5000);
  };

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  React.useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-xs font-mono uppercase tracking-wider text-gray-500/80 flex items-center gap-2 border-b border-white/10 pb-2">
          <Music className="w-4 h-4" />
          Advertising Background Music
        </label>
        <div className="grid grid-cols-1 gap-2">
          {MUSIC_PRESETS.map(preset => (
            <div key={preset.id} className="flex items-center justify-between bg-white/5 border border-white/10 p-2 rounded-xl">
              <div className="flex flex-col">
                <span className="text-xs text-gray-300 font-medium">{preset.name}</span>
                <span className="text-[10px] text-gray-500/80">0:30 • 5s Preview</span>
              </div>
              <button
                onClick={() => handlePlay(preset.id, preset.url)}
                className={`p-2 rounded-full transition-colors flex items-center justify-center ${playingId === preset.id ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-gray-400/80 hover:bg-white/20 hover:text-gray-200'}`}
              >
                {playingId === preset.id ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-mono uppercase tracking-wider text-gray-500/80 flex items-center gap-2 border-b border-white/10 pb-2">
          <Layers className="w-4 h-4" />
          Audio Mixing
        </label>
        <div className="space-y-4 bg-white/5 border border-white/10 p-3 rounded-xl">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-400/80">Music Volume</span>
              <span className="text-xs font-mono text-gray-500/80">{Math.round(musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-400/80">Narration Volume</span>
              <span className="text-xs font-mono text-gray-500/80">{Math.round(narrationVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={narrationVolume}
              onChange={(e) => setNarrationVolume(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PropSettings() {
  const { activeProp, triggerProp } = useAppContext();

  if (!activeProp) return null;

  const updateParam = (key: string, value: any) => {
    triggerProp(activeProp.type, { ...activeProp.params, [key]: value });
  };

  const params = activeProp.params || {};

  return (
    <div className="mt-3 space-y-3 bg-[#151619] p-3 rounded-xl border border-white/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-300 capitalize">{activeProp.type} Settings</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400/80">Color</span>
        </div>
        <div className="flex gap-2">
          <input
            type="color"
            value={params.color || '#ffffff'}
            onChange={(e) => updateParam('color', e.target.value)}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
          />
          <input
            type="text"
            value={params.color || '#ffffff'}
            onChange={(e) => updateParam('color', e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 text-gray-300 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block px-2 outline-none font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400/80">Speed</span>
          <span className="font-mono text-gray-500/80">{params.speed?.toFixed(1) || '1.0'}</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={params.speed || 1}
          onChange={(e) => updateParam('speed', parseFloat(e.target.value))}
          className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-xl appearance-none cursor-pointer"
        />
      </div>

      {['particles', 'confetti'].includes(activeProp.type) && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400/80">Density</span>
            <span className="font-mono text-gray-500/80">{params.density || 100}</span>
          </div>
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={params.density || 100}
            onChange={(e) => updateParam('density', parseInt(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-xl appearance-none cursor-pointer"
          />
        </div>
      )}

      {['particles'].includes(activeProp.type) && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400/80">Size</span>
            <span className="font-mono text-gray-500/80">{params.size?.toFixed(2) || '0.05'}</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.2"
            step="0.01"
            value={params.size || 0.05}
            onChange={(e) => updateParam('size', parseFloat(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-xl appearance-none cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}

export default function WorkspaceTab() {
  const {
    color, setColor,
    roughness, setRoughness,
    metalness, setMetalness,
    lights, addLight, updateLight, removeLight,
    indirectLightIntensity, setIndirectLightIntensity,
    envPreset, setEnvPreset,
    customEnvUrl, setCustomEnvUrl,
    customModelUrl, setCustomModelUrl,
    showCameraGadget, setShowCameraGadget,
    isRecordingPath, setIsRecordingPath,
    isPlayingPath, setIsPlayingPath,
    isPausedPath, setIsPausedPath,
    hasRecordedPath, setHasRecordedPath,
    setPresetTrigger,
    showMarkerGadget, setShowMarkerGadget,
    showGizmoGadget, setShowGizmoGadget,
    markers, updateMarker, removeMarker, clearMarkers,
    annotationPrompt, setAnnotationPrompt,
    activeProp, triggerProp,
    backdropColor, setBackdropColor,
    backdropBlur, setBackdropBlur,
    musicVolume, setMusicVolume,
    narrationVolume, setNarrationVolume
  } = useAppContext();

  const [autoAnnotateText, setAutoAnnotateText] = React.useState('');
  const [backdropPrompt, setBackdropPrompt] = React.useState('');
  const [isGeneratingBackdrop, setIsGeneratingBackdrop] = React.useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomEnvUrl(url);
      setEnvPreset('custom');
    }
  };

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomModelUrl(url);
    }
  };

  return (
    <>
      {/* 3D Model Import */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <label className="text-xs font-mono uppercase tracking-wider text-gray-500/80 flex items-center gap-2">
            <Box className="w-4 h-4" />
            3D Model
          </label>
          {customModelUrl && (
            <button 
              onClick={() => setCustomModelUrl(null)}
              className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-wider"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex flex-col items-center justify-center pt-4 pb-4">
              <Upload className="w-5 h-5 mb-1 text-gray-500/80" />
              <p className="text-[10px] text-gray-500/80 uppercase tracking-wider">Upload .GLB / .GLTF</p>
            </div>
            <input type="file" className="hidden" accept=".glb,.gltf" onChange={handleModelUpload} />
          </label>
        </div>
      </div>

      {/* Props */}
      <div className="space-y-3">
        <label className="text-xs font-mono uppercase tracking-wider text-gray-500/80 flex items-center gap-2 border-b border-white/10 pb-2">
          <Sparkles className="w-4 h-4" />
          Animated Props
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => triggerProp('particles')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${activeProp?.type === 'particles' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/10 text-gray-400/80 hover:bg-white/10 hover:text-gray-300'}`}
          >
            <Sparkles className="w-5 h-5 mb-1" />
            <span className="text-[10px] uppercase tracking-wider">Particles</span>
          </button>
          <button
            onClick={() => triggerProp('energyRings')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${activeProp?.type === 'energyRings' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/10 text-gray-400/80 hover:bg-white/10 hover:text-gray-300'}`}
          >
            <Disc className="w-5 h-5 mb-1" />
            <span className="text-[10px] uppercase tracking-wider">Energy Rings</span>
          </button>
          <button
            onClick={() => triggerProp('lightSweep')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${activeProp?.type === 'lightSweep' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/10 text-gray-400/80 hover:bg-white/10 hover:text-gray-300'}`}
          >
            <Zap className="w-5 h-5 mb-1" />
            <span className="text-[10px] uppercase tracking-wider">Light Sweep</span>
          </button>
          <button
            onClick={() => triggerProp('confetti')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${activeProp?.type === 'confetti' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/10 text-gray-400/80 hover:bg-white/10 hover:text-gray-300'}`}
          >
            <PartyPopper className="w-5 h-5 mb-1" />
            <span className="text-[10px] uppercase tracking-wider">Confetti</span>
          </button>
          <button
            onClick={() => triggerProp('pedestal')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${activeProp?.type === 'pedestal' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/10 text-gray-400/80 hover:bg-white/10 hover:text-gray-300'}`}
          >
            <Layers className="w-5 h-5 mb-1" />
            <span className="text-[10px] uppercase tracking-wider">Pedestal</span>
          </button>
          <button
            onClick={() => triggerProp('abstractWave')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${activeProp?.type === 'abstractWave' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/10 text-gray-400/80 hover:bg-white/10 hover:text-gray-300'}`}
          >
            <Activity className="w-5 h-5 mb-1" />
            <span className="text-[10px] uppercase tracking-wider">Abstract Wave</span>
          </button>
        </div>
        <PropSettings />
      </div>

      {/* Tools */}
      <div className="space-y-3">
        <label className="text-xs font-mono uppercase tracking-wider text-gray-500/80 flex items-center gap-2 border-b border-white/10 pb-2">
          <Camera className="w-4 h-4" />
          Tools
        </label>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400/80">Camera Gadget</span>
          <button
            onClick={() => {
              setShowCameraGadget(!showCameraGadget);
              if (showCameraGadget) {
                setIsRecordingPath(false);
                setIsPlayingPath(false);
              }
            }}
            className={`w-10 h-5 rounded-full transition-colors relative ${showCameraGadget ? 'bg-indigo-500' : 'bg-white/10'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-transform ${showCameraGadget ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        {showCameraGadget && (
          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={() => {
                if (isRecordingPath) {
                  setIsRecordingPath(false);
                } else {
                  setIsRecordingPath(true);
                  setIsPlayingPath(false);
                  setHasRecordedPath(false);
                }
              }}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${isRecordingPath ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'}`}
            >
              {isRecordingPath ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Stop Recording
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Record Path
                </>
              )}
            </button>
            {hasRecordedPath && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (isPlayingPath) {
                      setIsPausedPath(!isPausedPath);
                    } else {
                      setIsPlayingPath(true);
                      setIsPausedPath(false);
                      setIsRecordingPath(false);
                    }
                  }}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${isPlayingPath && !isPausedPath ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'}`}
                >
                  {isPlayingPath && !isPausedPath ? 'Pause' : (isPausedPath ? 'Resume' : 'Play Path')}
                </button>
                {isPlayingPath && (
                  <button
                    onClick={() => {
                      setIsPlayingPath(false);
                      setIsPausedPath(false);
                    }}
                    className="px-3 py-2 rounded text-sm font-medium transition-colors bg-white/5 text-red-400 border border-white/10 hover:bg-white/10"
                  >
                    Stop
                  </button>
                )}
              </div>
            )}

            <div className="pt-3 mt-1 border-t border-white/10">
              <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500/80 mb-2 block flex justify-between">
                <span>Cinematic Presets</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Turntable', 'Vertical Sweep', 
                  'Top-Down', 'Macro Pan',
                  'Spiral Reveal', 'Dynamic Push-In',
                  'Low Angle Hero', 'Diagonal Slide',
                  'Eclipse Reveal', 'Variant Transition'
                ].map(preset => {
                  return (
                  <button
                    key={preset}
                    onClick={() => {
                      setPresetTrigger({ name: preset, ts: Date.now() });
                      setIsPlayingPath(false);
                      setIsRecordingPath(false);
                    }}
                    className={`text-[11px] py-2 px-1 rounded transition-colors border truncate bg-white/5 hover:bg-white/10 text-gray-300 border-white/10 hover:border-indigo-500/50`}
                  >
                    {preset}
                  </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-400/80">Gizmo Gadget</span>
          <button
            onClick={() => {
              setShowGizmoGadget(!showGizmoGadget);
            }}
            className={`w-10 h-5 rounded-full transition-colors relative ${showGizmoGadget ? 'bg-indigo-500' : 'bg-white/10'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-transform ${showGizmoGadget ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        {showGizmoGadget && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="text-[11px] text-indigo-400/80 bg-indigo-500/10 p-2 rounded border border-indigo-500/20 leading-relaxed">
              Use the 3D gizmo in the scene to translate and rotate the model.
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-400/80">Focal Point Gadget</span>
          <button
            onClick={() => {
              setShowMarkerGadget(!showMarkerGadget);
            }}
            className={`w-10 h-5 rounded-full transition-colors relative ${showMarkerGadget ? 'bg-indigo-500' : 'bg-white/10'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-transform ${showMarkerGadget ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        {showMarkerGadget && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="text-[11px] text-amber-500/80 bg-amber-500/10 p-2 rounded border border-amber-500/20 leading-relaxed">
              Click on the model to add focal points manually, or use Auto Annotate below.
            </div>
            
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={autoAnnotateText}
                onChange={(e) => setAutoAnnotateText(e.target.value)}
                placeholder="e.g. the logo, the shoelaces"
                className="flex-1 bg-[#151619] border border-white/10 text-gray-300 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 p-2 outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && autoAnnotateText.trim() && !annotationPrompt) {
                    setAnnotationPrompt(autoAnnotateText.trim());
                    setAutoAnnotateText('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (autoAnnotateText.trim()) {
                    setAnnotationPrompt(autoAnnotateText.trim());
                    setAutoAnnotateText('');
                  }
                }}
                disabled={!autoAnnotateText.trim() || !!annotationPrompt}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 disabled:bg-white/10 disabled:text-gray-500/80 text-white text-xs font-medium rounded transition-colors"
              >
                {annotationPrompt ? 'Annotating...' : 'Auto Annotate'}
              </button>
            </div>

            {markers.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 mt-1">
                {markers.map((marker) => (
                  <div key={marker.id} className="flex flex-col bg-white/5 p-2 rounded border border-white/10 gap-1">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={marker.label || ''}
                        onChange={(e) => updateMarker(marker.id, { label: e.target.value })}
                        className="bg-transparent border-none text-xs font-medium text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-full mr-2"
                        placeholder="Marker Label"
                      />
                      <button onClick={() => removeMarker(marker.id)} className="text-red-400 hover:text-red-300 shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500/80 px-1">
                      [{marker.position[0].toFixed(2)}, {marker.position[1].toFixed(2)}, {marker.position[2].toFixed(2)}]
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-gray-600 italic mt-1">No focal points added yet.</div>
            )}
            {markers.length > 0 && (
              <button
                onClick={clearMarkers}
                className="mt-2 px-3 py-2 rounded text-xs font-medium transition-colors bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
              >
                Clear All Focal Points
              </button>
            )}
          </div>
        )}
      </div>

      {/* Material Properties */}
      <div className="space-y-5">
        <label className="text-xs font-mono uppercase tracking-wider text-gray-500/80 flex items-center gap-2 border-b border-white/10 pb-2">
          <Circle className="w-4 h-4" />
          Material
        </label>
        
        {customModelUrl ? (
          <div className="text-xs text-amber-500/80 bg-amber-500/10 p-3 rounded border border-amber-500/20 leading-relaxed">
            Using original PBR materials from the imported model. Material overrides are disabled.
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400/80">Base Color</span>
                <span className="font-mono text-gray-500/80">{color}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400/80">Roughness</span>
                <span className="font-mono text-gray-500/80">{roughness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={roughness}
                onChange={(e) => setRoughness(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-xl appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400/80">Metalness</span>
                <span className="font-mono text-gray-500/80">{metalness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={metalness}
                onChange={(e) => setMetalness(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-xl appearance-none cursor-pointer"
              />
            </div>
          </>
        )}
      </div>

      {/* Lights */}
      <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <label className="text-xs font-mono uppercase tracking-wider text-gray-500/80 flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Lights ({lights.length}/3)
            </label>
            <button
              onClick={() => addLight('directional')}
              disabled={lights.length >= 3}
              className={`text-[10px] uppercase tracking-wider ${lights.length >= 3 ? 'text-gray-600 cursor-not-allowed' : 'text-indigo-400 hover:text-indigo-300'}`}
            >
              + Add Light
            </button>
          </div>

          {lights.map((light, index) => (
            <div key={light.id} className="bg-[#151619] p-3 rounded-xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Light {index + 1}</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateLight(light.id, { visible: !light.visible })}
                    className={`w-8 h-4 rounded-full transition-colors relative ${light.visible ? 'bg-indigo-500' : 'bg-white/10'}`}
                  >
                    <div className={`w-2 h-2 rounded-full bg-white absolute top-1 transition-transform ${light.visible ? 'left-5' : 'left-1'}`} />
                  </button>
                  <button onClick={() => removeLight(light.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-gray-400/80">Type</label>
                <select
                  value={light.type}
                  onChange={(e) => updateLight(light.id, { type: e.target.value as LightType })}
                  className="w-full bg-white/5 border border-white/10 text-gray-300 text-sm rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none"
                >
                  <option value="directional">Directional Light</option>
                  <option value="point">Point Light</option>
                  <option value="spot">Spot Light</option>
                  <option value="rectArea">Area Light</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400/80">Intensity</span>
                  <span className="font-mono text-gray-500/80">{light.intensity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={light.intensity}
                  onChange={(e) => updateLight(light.id, { intensity: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-xl appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400/80">Color</span>
                  <span className="font-mono text-gray-500/80">{light.color}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={light.color}
                    onChange={(e) => updateLight(light.id, { color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input
                    type="text"
                    value={light.color}
                    onChange={(e) => updateLight(light.id, { color: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/10 text-gray-300 text-sm rounded focus:ring-indigo-500 focus:border-indigo-500 block px-2 outline-none font-mono"
                  />
                </div>
              </div>

              {light.type === 'rectArea' && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400/80">Width</span>
                      <span className="font-mono text-gray-500/80">{light.width?.toFixed(1) || '2.0'}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={light.width || 2}
                      onChange={(e) => updateLight(light.id, { width: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-xl appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400/80">Height</span>
                      <span className="font-mono text-gray-500/80">{light.height?.toFixed(1) || '2.0'}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={light.height || 2}
                      onChange={(e) => updateLight(light.id, { height: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-xl appearance-none cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={() => updateLight(light.id, { triggerLookAtOrigin: (light.triggerLookAtOrigin || 0) + 1 })}
                    className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    Target Center
                  </button>
                </>
              )}

              {light.type === 'spot' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400/80">Size (Cone Angle)</span>
                    <span className="font-mono text-gray-500/80">{light.spotAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="90"
                    step="1"
                    value={light.spotAngle}
                    onChange={(e) => updateLight(light.id, { spotAngle: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-xl appearance-none cursor-pointer"
                  />
                  <button
                    onClick={() => updateLight(light.id, { triggerLookAtOrigin: (light.triggerLookAtOrigin || 0) + 1 })}
                    className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    Target Center
                  </button>
                </div>
              )}

              {light.type === 'directional' && (
                <button
                  onClick={() => updateLight(light.id, { triggerLookAtOrigin: (light.triggerLookAtOrigin || 0) + 1 })}
                  className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Target Center
                </button>
              )}
            </div>
          ))}
        </div>

      {/* Environment Light Properties */}
      <div className="space-y-5">
          <label className="text-xs font-mono uppercase tracking-wider text-gray-500/80 flex items-center gap-2 border-b border-white/10 pb-2">
            <Globe className="w-4 h-4" />
            Environment Light
          </label>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400/80">Indirect Illumination</span>
              <span className="font-mono text-gray-500/80">{indirectLightIntensity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={indirectLightIntensity}
              onChange={(e) => setIndirectLightIntensity(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-xl appearance-none cursor-pointer"
            />
          </div>
        </div>

      {/* Digital Backdrop */}
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <label className="text-xs font-mono uppercase tracking-wider text-gray-500/80 flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Digital Backdrop
          </label>
          {backdropColor && (
            <button 
              onClick={() => setBackdropColor(null)}
              className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-wider"
            >
              Clear
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'Studio', url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/studio_small_09.jpg', thumb: 'https://cdn.polyhaven.com/asset_img/primary/studio_small_09.png?height=200' },
              { name: 'Landscape', url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/kloofendal_48d_partly_cloudy.jpg', thumb: 'https://cdn.polyhaven.com/asset_img/primary/kloofendal_48d_partly_cloudy.png?height=200' },
              { name: 'City', url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/venice_sunset.jpg', thumb: 'https://cdn.polyhaven.com/asset_img/primary/venice_sunset.png?height=200' },
              { name: 'Forest', url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/forest_slope.jpg', thumb: 'https://cdn.polyhaven.com/asset_img/primary/forest_slope.png?height=200' },
              { name: 'Night Sky', url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/moonless_golf.jpg', thumb: 'https://cdn.polyhaven.com/asset_img/primary/moonless_golf.png?height=200' },
              { name: 'Interior', url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/brown_photostudio_02.jpg', thumb: 'https://cdn.polyhaven.com/asset_img/primary/brown_photostudio_02.png?height=200' }
            ].map(preset => (
              <button
                key={preset.name}
                onClick={() => setBackdropColor(preset.url)}
                className={`flex flex-col gap-1 p-1 rounded border transition-colors overflow-hidden ${backdropColor === preset.url ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/10 text-gray-400/80 hover:bg-white/10 hover:text-gray-300'}`}
              >
                <div className="w-full h-12 relative overflow-hidden rounded-sm">
                  <img 
                    src={preset.thumb} 
                    alt={preset.name}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[9px] uppercase tracking-wider truncate w-full text-center px-1 pb-1">{preset.name}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center w-full mt-2">
            <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex flex-col items-center justify-center pt-2 pb-2">
                <Upload className="w-4 h-4 mb-1 text-gray-500/80" />
                <p className="text-[10px] text-gray-500/80 uppercase tracking-wider">Upload Custom Image</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/jpeg, image/png, image/webp" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setBackdropColor(url);
                  }
                }} 
              />
            </label>
          </div>

          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-gray-400/80 uppercase tracking-wider">AI Generate</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={backdropPrompt}
                onChange={(e) => setBackdropPrompt(e.target.value)}
                placeholder="e.g. A neon cyberpunk city street"
                className="flex-1 bg-[#151619] border border-white/10 text-gray-300 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 p-2 outline-none"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && backdropPrompt.trim() && !isGeneratingBackdrop) {
                    setIsGeneratingBackdrop(true);
                    const url = await ImageAgent.generateImage(backdropPrompt.trim());
                    if (url) setBackdropColor(url);
                    setIsGeneratingBackdrop(false);
                  }
                }}
              />
              <button
                onClick={async () => {
                  if (backdropPrompt.trim() && !isGeneratingBackdrop) {
                    setIsGeneratingBackdrop(true);
                    const url = await ImageAgent.generateImage(backdropPrompt.trim());
                    if (url) setBackdropColor(url);
                    setIsGeneratingBackdrop(false);
                  }
                }}
                disabled={!backdropPrompt.trim() || isGeneratingBackdrop}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 disabled:bg-white/10 disabled:text-gray-500/80 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
              >
                {isGeneratingBackdrop ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Gen...</span>
                  </>
                ) : (
                  'Generate'
                )}
              </button>
            </div>
          </div>
          
          {backdropColor && (
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400/80">Backdrop Blur</span>
                <span className="text-xs text-gray-500/80 font-mono">{backdropBlur.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={backdropBlur}
                onChange={(e) => setBackdropBlur(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-xl appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Environment Map */}
      <div className="space-y-5">
          <label className="text-xs font-mono uppercase tracking-wider text-gray-500/80 flex items-center gap-2 border-b border-white/10 pb-2">
            <Globe className="w-4 h-4" />
            Environment Map
          </label>
          
          <div className="space-y-3">
            <select
              value={envPreset}
              onChange={(e) => setEnvPreset(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-gray-300 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none cursor-pointer"
            >
              <option value="studio">Studio</option>
              <option value="city">City</option>
              <option value="park">Park</option>
              <option value="forest">Forest</option>
              <option value="apartment">Apartment</option>
              <option value="sunset">Sunset</option>
              <option value="dawn">Dawn</option>
              <option value="night">Night</option>
              <option value="warehouse">Warehouse</option>
              <option value="lobby">Lobby</option>
              {customEnvUrl && <option value="custom">Custom Image</option>}
            </select>

            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                  <Upload className="w-5 h-5 mb-1 text-gray-500/80" />
                  <p className="text-[10px] text-gray-500/80 uppercase tracking-wider">Upload JPG/PNG</p>
                </div>
                <input type="file" className="hidden" accept="image/jpeg, image/png" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        </div>

        {/* Music Section */}
        <MusicSection />
    </>
  );
}
