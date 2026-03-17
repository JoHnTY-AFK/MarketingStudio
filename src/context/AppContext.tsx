import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import * as THREE from 'three';
import { LightType, LightConfig, Marker, AnimationTimeline, PropType, ActiveProp } from '../types';

export interface DirectorLoadingState {
  isLoading: boolean;
  stage: string;
  progress: number;
}

interface AppState {
  color: string;
  setColor: (color: string) => void;
  roughness: number;
  setRoughness: (val: number) => void;
  metalness: number;
  setMetalness: (val: number) => void;
  lights: LightConfig[];
  addLight: (type: LightType) => void;
  updateLight: (id: string, updates: Partial<LightConfig>) => void;
  removeLight: (id: string) => void;
  setLights: (lights: LightConfig[]) => void;
  indirectLightIntensity: number;
  setIndirectLightIntensity: (val: number) => void;
  envPreset: string;
  setEnvPreset: (val: string) => void;
  customEnvUrl: string | null;
  setCustomEnvUrl: (val: string | null) => void;
  customModelUrl: string | null;
  setCustomModelUrl: (val: string | null) => void;
  showCameraGadget: boolean;
  setShowCameraGadget: (val: boolean) => void;
  isRecordingPath: boolean;
  setIsRecordingPath: (val: boolean) => void;
  isPlayingPath: boolean;
  setIsPlayingPath: (val: boolean) => void;
  isPausedPath: boolean;
  setIsPausedPath: (val: boolean) => void;
  hasRecordedPath: boolean;
  setHasRecordedPath: (val: boolean) => void;
  presetTrigger: {name: string, ts: number, timeline?: AnimationTimeline, params?: any, duration?: number, sequence?: {name: string, duration: number, params?: any, animatedProp?: string, backgroundMusic?: string}[]} | null;
  setPresetTrigger: (val: {name: string, ts: number, timeline?: AnimationTimeline, params?: any, duration?: number, sequence?: {name: string, duration: number, params?: any, animatedProp?: string, backgroundMusic?: string}[]} | null) => void;
  showMarkerGadget: boolean;
  setShowMarkerGadget: (val: boolean) => void;
  showGizmoGadget: boolean;
  setShowGizmoGadget: (val: boolean) => void;
  markers: Marker[];
  addMarker: (position: [number, number, number], label?: string) => void;
  updateMarker: (id: string, updates: Partial<Marker>) => void;
  removeMarker: (id: string) => void;
  clearMarkers: () => void;
  setMarkers: (markers: Marker[]) => void;
  directorCamera: { position: THREE.Vector3, target: THREE.Vector3 } | null;
  setDirectorCamera: (val: { position: THREE.Vector3, target: THREE.Vector3 } | null) => void;
  directorLoadingState: DirectorLoadingState;
  setDirectorLoadingState: (val: DirectorLoadingState) => void;
  directorNodes: THREE.Vector3[];
  setDirectorNodes: (val: THREE.Vector3[]) => void;
  captureSnapshotFromAngleRef: React.MutableRefObject<((position: THREE.Vector3, target: THREE.Vector3) => Promise<string>) | null>;
  targetBoundingSphere: THREE.Sphere | null;
  setTargetBoundingSphere: (val: THREE.Sphere | null) => void;
  activeProp: ActiveProp | null;
  backdropColor: string | null;
  setBackdropColor: (url: string | null) => void;
  backdropBlur: number;
  setBackdropBlur: (val: number) => void;
  triggerProp: (type: PropType, params?: any) => void;
  clearProp: () => void;
  recordedVideoUrl: string | null;
  setRecordedVideoUrl: (url: string | null) => void;
  isRecordingVideo: boolean;
  setIsRecordingVideo: (val: boolean) => void;
  isOfflineRendering: boolean;
  setIsOfflineRendering: (val: boolean) => void;
  renderProgress: number;
  setRenderProgress: (val: number) => void;
  musicVolume: number;
  setMusicVolume: (val: number) => void;
  narrationVolume: number;
  setNarrationVolume: (val: number) => void;
  annotationPrompt: string | null;
  setAnnotationPrompt: (val: string | null) => void;
  resumeAudioContextRef: React.MutableRefObject<(() => void) | null>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [color, setColor] = useState('#ffffff');
  const [roughness, setRoughness] = useState(0.2);
  const [metalness, setMetalness] = useState(0.1);
  
  const [lights, setLights] = useState<LightConfig[]>([
    {
      id: 'default-light',
      type: 'directional',
      intensity: 1.5,
      color: '#ffffff',
      pointSize: 1,
      spotAngle: 45,
      width: 2,
      height: 2,
      visible: true,
      triggerLookAtOrigin: 1
    }
  ]);

  const addLight = (type: LightType) => {
    if (lights.length >= 3) return;
    const newLight: LightConfig = {
      id: `light-${Date.now()}`,
      type,
      intensity: 1.5,
      color: '#ffffff',
      pointSize: 1,
      spotAngle: 45,
      width: 2,
      height: 2,
      visible: true,
      triggerLookAtOrigin: type !== 'point' ? 1 : 0
    };
    setLights([...lights, newLight]);
  };

  const updateLight = (id: string, updates: Partial<LightConfig>) => {
    setLights(lights.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeLight = (id: string) => {
    setLights(lights.filter(l => l.id !== id));
  };

  const [indirectLightIntensity, setIndirectLightIntensity] = useState(0.5);
  const [envPreset, setEnvPreset] = useState<string>('studio');
  const [customEnvUrl, setCustomEnvUrl] = useState<string | null>(null);

  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
  const [showCameraGadget, setShowCameraGadget] = useState(false);

  const [isRecordingPath, setIsRecordingPath] = useState(false);
  const [isPlayingPath, setIsPlayingPath] = useState(false);
  const [isPausedPath, setIsPausedPath] = useState(false);
  const [hasRecordedPath, setHasRecordedPath] = useState(false);
  const [presetTrigger, setPresetTrigger] = useState<{name: string, ts: number, timeline?: AnimationTimeline, params?: any, duration?: number, sequence?: {name: string, duration: number, params?: any, animatedProp?: string, backgroundMusic?: string}[]} | null>(null);

  const [showMarkerGadget, setShowMarkerGadget] = useState(false);
  const [showGizmoGadget, setShowGizmoGadget] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);

  const addMarker = (position: [number, number, number], label?: string) => {
    setMarkers([...markers, { id: `marker-${Date.now()}`, position, label: label || `F${markers.length + 1}` }]);
  };

  const updateMarker = (id: string, updates: Partial<Marker>) => {
    setMarkers(markers.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeMarker = (id: string) => {
    setMarkers(markers.filter(m => m.id !== id));
  };

  const clearMarkers = () => {
    setMarkers([]);
  };

  const [directorCamera, setDirectorCamera] = useState<{ position: THREE.Vector3, target: THREE.Vector3 } | null>(null);
  const [directorLoadingState, setDirectorLoadingState] = useState<DirectorLoadingState>({ isLoading: false, stage: '', progress: 0 });
  const [directorNodes, setDirectorNodes] = useState<THREE.Vector3[]>([]);
  const [targetBoundingSphere, setTargetBoundingSphere] = useState<THREE.Sphere | null>(null);
  const captureSnapshotFromAngleRef = React.useRef<((position: THREE.Vector3, target: THREE.Vector3) => Promise<string>) | null>(null);

  const [activeProp, setActiveProp] = useState<ActiveProp | null>(null);
  const [backdropColor, setBackdropColor] = useState<string | null>(null);
  const [backdropBlur, setBackdropBlur] = useState<number>(0);
  const triggerProp = (type: PropType, params?: any) => {
    setActiveProp({ id: Math.random().toString(), type, params });
  };
  const clearProp = () => setActiveProp(null);

  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isOfflineRendering, setIsOfflineRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [annotationPrompt, setAnnotationPrompt] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [narrationVolume, setNarrationVolume] = useState(1.0);
  const resumeAudioContextRef = React.useRef<(() => void) | null>(null);

  return (
    <AppContext.Provider value={{
      color, setColor,
      roughness, setRoughness,
      metalness, setMetalness,
      lights, addLight, updateLight, removeLight, setLights,
      indirectLightIntensity, setIndirectLightIntensity,
      envPreset, setEnvPreset,
      customEnvUrl, setCustomEnvUrl,
      customModelUrl, setCustomModelUrl,
      showCameraGadget, setShowCameraGadget,
      isRecordingPath, setIsRecordingPath,
      isPlayingPath, setIsPlayingPath,
      isPausedPath, setIsPausedPath,
      hasRecordedPath, setHasRecordedPath,
      presetTrigger, setPresetTrigger,
      showMarkerGadget, setShowMarkerGadget,
      showGizmoGadget, setShowGizmoGadget,
      markers, addMarker, updateMarker, removeMarker, clearMarkers, setMarkers,
      directorCamera, setDirectorCamera,
      directorLoadingState, setDirectorLoadingState,
      directorNodes, setDirectorNodes,
      captureSnapshotFromAngleRef,
      targetBoundingSphere, setTargetBoundingSphere,
      activeProp, triggerProp, clearProp,
      backdropColor, setBackdropColor,
      backdropBlur, setBackdropBlur,
      recordedVideoUrl, setRecordedVideoUrl,
      isRecordingVideo, setIsRecordingVideo,
      isOfflineRendering, setIsOfflineRendering,
      renderProgress, setRenderProgress,
      musicVolume, setMusicVolume,
      narrationVolume, setNarrationVolume,
      annotationPrompt, setAnnotationPrompt,
      resumeAudioContextRef
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
