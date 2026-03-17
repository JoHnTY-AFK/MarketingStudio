import React, { useState } from 'react';
import { Play, Loader2, RotateCcw, Camera, Film, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { DirectorAgent, DirectorPlan, DirectorAction, FilmPlan } from '../../services/directorAgent';
import { ImageAgent } from '../../services/imageAgent';
import { AudioAgent } from '../../services/audioAgent';
import { CameraPathUtil, ScreenFramingUtil, FocusRaycastUtil, SilhouetteClearanceUtil } from '../../utils/directorMath';
import * as THREE from 'three';

export function DirectorTab() {
  const [mode, setMode] = useState<'shot' | 'film'>('shot');
  const [prompt, setPrompt] = useState("Show the 'logo' and 'screen' features filling half the screen on the top right, with moderate dispersion. Place a point light behind the subject, revealed on the top left.");
  const [projectDetails, setProjectDetails] = useState("A sleek, energetic 15-second product showcase for a young tech-savvy audience. I want to highlight the logo and the screen. Use an upbeat vibe.");
  const [filmPrompt, setFilmPrompt] = useState("");
  const [snapshotsPerPath, setSnapshotsPerPath] = useState<number>(3);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DirectorPlan | null>(null);
  const [filmPlan, setFilmPlan] = useState<FilmPlan | null>(null);
  const [savedState, setSavedState] = useState<any>(null);
  const [validSnapshots, setValidSnapshots] = useState<THREE.Vector3[]>([]);
  const [snapshotImages, setSnapshotImages] = useState<string[]>([]);
  
  const { 
    directorCamera,
    setDirectorCamera, 
    lights, 
    updateLight,
    markers,
    clearMarkers,
    addMarker,
    showCameraGadget,
    setShowCameraGadget,
    showMarkerGadget,
    setShowMarkerGadget,
    directorLoadingState,
    setDirectorLoadingState,
    setDirectorNodes,
    captureSnapshotFromAngleRef,
    targetBoundingSphere,
    setPresetTrigger,
    setIsPlayingPath,
    setBackdropColor,
    recordedVideoUrl,
    setRecordedVideoUrl,
    isRecordingVideo,
    setIsRecordingVideo,
    resumeAudioContextRef
  } = useAppContext();

  const captureSnapshots = async (snapshots: THREE.Vector3[], targetCenter: THREE.Vector3) => {
    // The Canvas component might put the ID on a wrapper div, so we select the canvas inside it
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const images: string[] = [];
    for (let i = 0; i < snapshots.length; i++) {
      const snap = snapshots[i];
      
      setDirectorLoadingState({
        isLoading: true,
        stage: `Capturing snapshots (${i + 1}/${snapshots.length})...`,
        progress: 70 + (20 * (i / snapshots.length))
      });

      // Wait a tiny bit for the UI to update the loading state
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (captureSnapshotFromAngleRef.current) {
        try {
          const dataUrl = await captureSnapshotFromAngleRef.current(snap, targetCenter);
          images.push(dataUrl);
        } catch (e) {
          console.error("Failed to capture director snapshot", e);
        }
      }
    }
    setSnapshotImages(images);
  };

  const handleGenerateShot = async () => {
    setIsGenerating(true);
    setError(null);
    setSnapshotImages([]);
    setDirectorNodes([]);
    
    setDirectorLoadingState({
      isLoading: true,
      stage: 'Analyzing prompt...',
      progress: 10
    });

    try {
      if (!savedState) {
        setSavedState({
          directorCamera: directorCamera ? { position: directorCamera.position.clone(), target: directorCamera.target.clone() } : null,
          lights: lights.map(l => ({ ...l })),
          markers: markers.map(m => ({ ...m })),
          showCameraGadget,
          showMarkerGadget
        });
      }

      if (isDevMode) {
        setDirectorLoadingState({
          isLoading: true,
          stage: 'Dev Mode: Generating all snapshots...',
          progress: 50
        });

        const mockPlan: DirectorPlan = {
          actions: [
            {
              action: 'frame_important_features',
              params: {
                targetFeatures: [], // empty means all features/no filtering
                northPoleAngle: 0,
                stepDistance: 0.5
              }
            }
          ]
        };
        setPlan(mockPlan);
        await applyState(mockPlan.actions);
      } else {
        setDirectorLoadingState({
          isLoading: true,
          stage: 'Generating director plan...',
          progress: 30
        });

        const generatedPlan = await DirectorAgent.parsePrompt(prompt);
        setPlan(generatedPlan);
        
        await applyState(generatedPlan.actions);
      }

      setDirectorLoadingState({
        isLoading: true,
        stage: 'Finalizing...',
        progress: 100
      });
      
      // Small delay to show 100%
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate shot');
    } finally {
      setIsGenerating(false);
      setDirectorLoadingState({
        isLoading: false,
        stage: '',
        progress: 0
      });
    }
  };

  const handleGenerateFilm = async () => {
    setIsGenerating(true);
    setError(null);
    setRecordedVideoUrl(null);
    
    // Resume AudioContext via user gesture
    if (resumeAudioContextRef.current) {
      resumeAudioContextRef.current();
    }
    
    try {
      const availableFocalPoints = markers.map(m => m.label);

      setDirectorLoadingState({
        isLoading: true,
        stage: 'Refining cinematic brief...',
        progress: 20
      });

      // Step 1: Refine the brief
      const refinedBrief = await DirectorAgent.refineBrief(projectDetails);
      setFilmPrompt(refinedBrief);

      setDirectorLoadingState({
        isLoading: true,
        stage: 'Designing film sequence...',
        progress: 40
      });

      // Step 2: Parse the brief into a film plan
      const plan = await DirectorAgent.parseFilmPrompt(refinedBrief, availableFocalPoints);
      
      setDirectorLoadingState({
        isLoading: true,
        stage: 'Stitching presets...',
        progress: 60
      });
      
      if (plan.backdropPrompt) {
        setDirectorLoadingState({
          isLoading: true,
          stage: 'Generating custom backdrop...',
          progress: 70
        });
        const customBackdrop = await ImageAgent.generateImage(plan.backdropPrompt);
        if (customBackdrop) {
          setBackdropColor(customBackdrop);
        } else if (plan.backdropPreset) {
          setBackdropColor(plan.backdropPreset);
        }
      } else if (plan.backdropPreset) {
        setBackdropColor(plan.backdropPreset);
      }

      setDirectorLoadingState({
        isLoading: true,
        stage: 'Generating narration...',
        progress: 80
      });

      for (const preset of plan.presets) {
        if (preset.narrationPrompt) {
          const narrationAudio = await AudioAgent.generateNarration(preset.narrationPrompt);
          if (narrationAudio) {
            (preset as any).narrationAudio = narrationAudio;
          }
        }
      }
      
      setFilmPlan(plan);
      
      setPresetTrigger({
        name: 'Film Sequence',
        ts: Date.now(),
        sequence: plan.presets
      });
      
      setDirectorLoadingState({
        isLoading: true,
        stage: 'Finalizing film...',
        progress: 100
      });
      
      setShowCameraGadget(true);
      
      // Give CameraGadget time to generate the path
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsPlayingPath(true);
      setIsRecordingVideo(true);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate film');
    } finally {
      setIsGenerating(false);
      setDirectorLoadingState({
        isLoading: false,
        stage: '',
        progress: 0
      });
    }
  };

  const handleClear = () => {
    if (savedState) {
      setDirectorCamera(savedState.directorCamera);
      
      savedState.lights.forEach((savedLight: any) => {
        const currentLight = lights.find(l => l.id === savedLight.id);
        if (currentLight) {
          updateLight(currentLight.id, savedLight);
        }
      });
      
      clearMarkers();
      savedState.markers.forEach((m: any) => addMarker(m.position, m.label));
      
      setShowCameraGadget(savedState.showCameraGadget);
      setShowMarkerGadget(savedState.showMarkerGadget);
      
      setSavedState(null);
      setPlan(null);
      setFilmPlan(null);
      setRecordedVideoUrl(null);
      setValidSnapshots([]);
      setSnapshotImages([]);
      setDirectorNodes([]);
    }
  };

  const applyState = async (actions: DirectorAction[]) => {
    if (!actions || !Array.isArray(actions)) return;

    setDirectorLoadingState({
      isLoading: true,
      stage: 'Applying camera framing...',
      progress: 50
    });

    if (!savedState) {
      setSavedState({
        directorCamera: directorCamera ? { position: directorCamera.position.clone(), target: directorCamera.target.clone() } : null,
        lights: lights.map(l => ({ ...l })),
        markers: markers.map(m => ({ ...m })),
        showCameraGadget,
        showMarkerGadget
      });
    }

    const boundingSphere = targetBoundingSphere || new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
    const cameraFov = 50;
    
    // Use the actual canvas aspect ratio for framing calculations
    const canvas = document.querySelector('canvas');
    const aspectRatio = canvas ? canvas.clientWidth / canvas.clientHeight : 1;

    let currentSnapshots: THREE.Vector3[] = [];
    let currentCamPos = directorCamera ? directorCamera.position.clone() : new THREE.Vector3(0, 0, 5);
    let currentCamTarget = directorCamera ? directorCamera.target.clone() : new THREE.Vector3(0, 0, 0);
    let currentFocalPoint = markers.length > 0 ? new THREE.Vector3(...markers[0].position) : new THREE.Vector3(0, 0, 0);
    let currentTargetFeatures: string[] = [];

    actions.forEach(actionObj => {
      const { action, params } = actionObj;

      if (action === 'frame_important_features') {
        currentTargetFeatures = params.targetFeatures || [];
        currentSnapshots = CameraPathUtil.generateSnapshots(
          boundingSphere,
          cameraFov,
          aspectRatio,
          markers,
          currentTargetFeatures,
          params.northPoleAngle || 0,
          params.stepDistance || 0.5,
          snapshotsPerPath
        );
        setDirectorNodes([...currentSnapshots]);
      } 
      else if (action === 'adjust_screen_fill_and_alignment') {
        const adjustedSnapshots: THREE.Vector3[] = [];
        for (const snap of currentSnapshots) {
          const adjusted = ScreenFramingUtil.adjustCamera(
            snap,
            boundingSphere.center,
            markers,
            currentTargetFeatures,
            params.fillRatio || 0.5,
            params.alignment || 'center',
            params.dispersionMin || 0,
            params.dispersionMax || 1,
            cameraFov,
            aspectRatio
          );
          if (adjusted) {
            adjustedSnapshots.push(adjusted);
          }
        }
        currentSnapshots = adjustedSnapshots;
      }
      else if (action === 'place_light_relative_to_focus') {
        if (currentSnapshots.length > 0) {
          currentCamPos = currentSnapshots[0];
          currentCamTarget = boundingSphere.center;
        }
        const lightIndex = params.lightIndex || 0;
        if (lightIndex < lights.length) {
          const lightId = lights[lightIndex].id;
          const distance = params.distanceMode === 'front_subject' ? -boundingSphere.radius * 2 : boundingSphere.radius * 3;
          
          const basePos = FocusRaycastUtil.placeOnLineOfSight(currentCamPos, currentFocalPoint, distance);
          
          const finalPos = SilhouetteClearanceUtil.calculateRevealOffset(
            currentCamPos,
            basePos,
            boundingSphere,
            params.verticalOffset || 'obscured',
            params.horizontalOffset || 'center'
          );

          updateLight(lightId, {
            position: [finalPos.x, finalPos.y, finalPos.z],
            visible: true
          });
        }
      }
      else if (action === 'set_light_properties') {
        const lightIndex = params.lightIndex || 0;
        if (lightIndex < lights.length) {
          const lightId = lights[lightIndex].id;
          updateLight(lightId, {
            type: params.type || 'point',
            intensity: params.intensity || 5,
            visible: true
          });
        }
      }
    });

    setValidSnapshots(currentSnapshots);
    if (currentSnapshots.length > 0) {
      setShowCameraGadget(true);
      await captureSnapshots(currentSnapshots, boundingSphere.center);
      // Reset to the first snapshot after capturing all
      setDirectorCamera({ position: currentSnapshots[0], target: boundingSphere.center });
    } else {
      setError("No valid camera positions found for the given constraints.");
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Mode Switcher */}
      <div className="flex bg-[#151619] p-1 rounded-xl border border-white/10">
        <button
          onClick={() => setMode('shot')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
            mode === 'shot' ? 'bg-white/10 text-white' : 'text-gray-500/80 hover:text-gray-300'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Shot Design
        </button>
        <button
          onClick={() => setMode('film')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
            mode === 'film' ? 'bg-white/10 text-white' : 'text-gray-500/80 hover:text-gray-300'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          Film Design
        </button>
      </div>

      {mode === 'shot' ? (
        <>
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-gray-500/80">
              Shot Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-40 bg-[#151619] border border-white/10 rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 resize-none"
              placeholder="Describe the shot..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-gray-500/80">
                Snapshots per Path
              </label>
              <span className="text-xs text-amber-500 font-mono">{snapshotsPerPath}</span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              step="1"
              value={snapshotsPerPath}
              onChange={(e) => setSnapshotsPerPath(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-gray-600 font-mono">
              <span>1</span>
              <span>Total: {8 * snapshotsPerPath + 2}</span>
              <span>7</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="devMode"
              checked={isDevMode}
              onChange={(e) => setIsDevMode(e.target.checked)}
              className="w-4 h-4 accent-amber-500 bg-[#151619] border-white/10 rounded"
            />
            <label htmlFor="devMode" className="text-xs font-mono uppercase tracking-wider text-gray-500/80 cursor-pointer select-none">
              Dev Mode (Skip Agent, Show All Nodes)
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGenerateShot}
              disabled={isGenerating || !prompt.trim()}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-white/10 disabled:text-gray-500/80 text-black font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Generate Shot
                </>
              )}
            </button>
            {savedState && (
              <button
                onClick={handleClear}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                title="Clear and restore previous state"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-gray-500/80">
              Project Details
            </label>
            <textarea
              value={projectDetails}
              onChange={(e) => setProjectDetails(e.target.value)}
              className="w-full h-32 bg-[#151619] border border-white/10 rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50 resize-none"
              placeholder="Describe your product, target audience, and desired mood..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGenerateFilm}
              disabled={isGenerating || !projectDetails.trim()}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 disabled:bg-white/10 disabled:text-gray-500/80 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Designing...
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  Generate Film
                </>
              )}
            </button>
          </div>

          {filmPrompt && (
            <div className="space-y-2 pt-4 border-t border-white/10">
              <label className="text-xs font-mono uppercase tracking-wider text-gray-500/80">
                Generated Film Prompt (Editable)
              </label>
              <textarea
                value={filmPrompt}
                onChange={(e) => setFilmPrompt(e.target.value)}
                className="w-full h-40 bg-black/20 border border-white/5 rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50 resize-none"
              />
            </div>
          )}
        </>
      )}

      {directorLoadingState.isLoading && (
        <div className="p-4 bg-[#151619] border border-white/10 rounded-xl space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className={`w-5 h-5 animate-spin ${mode === 'film' ? 'text-indigo-500' : 'text-amber-500'}`} />
            <span className="text-sm text-gray-300 font-medium">Director Agent Running</span>
          </div>
          <p className="text-xs text-gray-400/80">{directorLoadingState.stage}</p>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className={`${mode === 'film' ? 'bg-indigo-500' : 'bg-amber-500'} h-1.5 rounded-full transition-all duration-300 ease-out`}
              style={{ width: `${directorLoadingState.progress}%` }}
            />
          </div>
          <div className="text-[10px] text-gray-500/80 font-mono text-right">
            {Math.round(directorLoadingState.progress)}%
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {mode === 'shot' && validSnapshots.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h3 className="text-xs font-mono uppercase tracking-wider text-gray-500/80">
            Valid Snapshots ({validSnapshots.length})
          </h3>
          
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
            {validSnapshots.map((snap, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirectorCamera({ position: snap, target: new THREE.Vector3(0, 0, 0) });
                  setShowCameraGadget(true);
                }}
                className="flex flex-col gap-2 p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 rounded transition-colors text-left"
              >
                {snapshotImages[idx] ? (
                  <img src={snapshotImages[idx]} alt={`Snapshot ${idx + 1}`} className="w-full h-auto rounded object-cover aspect-square bg-black" />
                ) : (
                  <div className="w-full aspect-square bg-black/20 rounded flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-gray-500/80 animate-spin" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Camera className="w-3 h-3 text-amber-400 shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] text-gray-300 font-medium">Snapshot {idx + 1}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'film' && filmPlan && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-gray-500/80">
                Film Sequence
              </h3>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-mono">
                {filmPlan.presets.reduce((acc, p) => acc + p.duration, 0).toFixed(1)}s
              </span>
            </div>
            {filmPlan.backdropPrompt && (
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <span className="text-[10px] text-indigo-400 font-mono uppercase">Custom Backdrop:</span>
                <p className="text-[10px] text-gray-300 italic">"{filmPlan.backdropPrompt}"</p>
              </div>
            )}
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filmPlan.presets.map((preset, idx) => (
              <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-black/20 border border-white/10 flex items-center justify-center text-[10px] text-gray-400/80 font-mono">
                      {idx + 1}
                    </div>
                    <span className="text-sm text-gray-200 font-medium">{preset.name}</span>
                  </div>
                  <span className="text-xs text-gray-500/80 font-mono">{preset.duration}s</span>
                </div>
                
                {(preset.animatedProp || preset.backgroundMusic || preset.narrationPrompt) && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                    <div className="flex flex-wrap gap-2">
                      {preset.animatedProp && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20">
                          Prop: {preset.animatedProp}
                        </span>
                      )}
                      {preset.backgroundMusic && (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                          Music: Active
                        </span>
                      )}
                    </div>
                    {preset.narrationPrompt && (
                      <div className="text-[10px] text-gray-400 italic bg-white/5 p-2 rounded border border-white/5">
                        "{preset.narrationPrompt}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {recordedVideoUrl && !isRecordingVideo && (
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-gray-500/80">Video Preview</h4>
              <video 
                src={recordedVideoUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full rounded-xl border border-white/10 bg-black"
              />
              <a 
                href={recordedVideoUrl} 
                download="product-film.webm"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 text-white rounded-xl transition-colors flex items-center justify-center gap-2 text-sm mt-2"
              >
                Download Video
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
