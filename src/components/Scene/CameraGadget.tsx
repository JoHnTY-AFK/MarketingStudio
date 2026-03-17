import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PivotControls, PerspectiveCamera, useFBO, Hud, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { recordedPath } from './store';
import { useAppContext } from '../../context/AppContext';
import { AnimationTimeline, AnimationKeyframe, PropType } from '../../types';
import { CinematicPresets } from '../../utils/cinematicPresets';

function interpolateTimeline(timeline: AnimationTimeline, t: number) {
  const keyframes = timeline.keyframes;
  if (keyframes.length === 0) return null;
  if (keyframes.length === 1) return keyframes[0];

  let k0 = keyframes[0];
  let k1 = keyframes[keyframes.length - 1];
  
  if (t <= k0.time) {
    k1 = k0;
  } else if (t >= k1.time) {
    k0 = k1;
  } else {
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
        k0 = keyframes[i];
        k1 = keyframes[i + 1];
        break;
      }
    }
  }

  const progress = k1.time === k0.time ? 0 : (t - k0.time) / (k1.time - k0.time);
  
  let easedProgress = progress;
  if (timeline.easing === 'easeInOut') {
    easedProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
  } else if (timeline.easing === 'easeIn') {
    easedProgress = progress * progress;
  } else if (timeline.easing === 'easeOut') {
    easedProgress = progress * (2 - progress);
  }

  const camera: any = {};
  if (k0.camera?.position && k1.camera?.position) {
    camera.position = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(...k0.camera.position),
      new THREE.Vector3(...k1.camera.position),
      easedProgress
    );
  }
  if (k0.camera?.lookAt && k1.camera?.lookAt) {
    camera.lookAt = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(...k0.camera.lookAt),
      new THREE.Vector3(...k1.camera.lookAt),
      easedProgress
    );
  }

  const lights: any[] = [];
  if (k0.lights && k1.lights) {
    k0.lights.forEach(l0 => {
      const l1 = k1.lights!.find(l => l.id === l0.id);
      if (l1) {
        const light: any = { id: l0.id, type: l0.type || l1.type };
        if (l0.position && l1.position) {
          light.position = new THREE.Vector3().lerpVectors(
            new THREE.Vector3(...l0.position),
            new THREE.Vector3(...l1.position),
            easedProgress
          );
        }
        if (l0.intensity !== undefined && l1.intensity !== undefined) {
          light.intensity = l0.intensity + (l1.intensity - l0.intensity) * easedProgress;
        }
        if (l0.color && l1.color) {
          const c0 = new THREE.Color(l0.color);
          const c1 = new THREE.Color(l1.color);
          light.color = '#' + c0.lerp(c1, easedProgress).getHexString();
        }
        lights.push(light);
      }
    });
  }

  let indirectLightIntensity = undefined;
  if (k0.indirectLightIntensity !== undefined && k1.indirectLightIntensity !== undefined) {
    indirectLightIntensity = k0.indirectLightIntensity + (k1.indirectLightIntensity - k0.indirectLightIntensity) * easedProgress;
  }

  return { camera, lights, indirectLightIntensity };
}

export default function CameraGadget({
  isRecordingPath,
  isPlayingPath,
  presetTrigger,
  onPathRecorded,
  onPlaybackComplete,
}: {
  isRecordingPath?: boolean;
  isPlayingPath?: boolean;
  presetTrigger?: { name: string; ts: number; timeline?: AnimationTimeline; params?: any; duration?: number; sequence?: {name: string, duration: number, params?: any, animatedProp?: string, backgroundMusic?: string}[] } | null;
  onPathRecorded?: () => void;
  onPlaybackComplete?: () => void;
}) {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const pivotRef = useRef<THREE.Group>(null);
  const cameraGroupRef = useRef<THREE.Group>(null);
  const { size, scene, gl } = useThree();
  const aspect = size.width / size.height;
  const fbo = useFBO(512, Math.round(512 / aspect), { type: THREE.UnsignedByteType });
  const { 
    markers, 
    lights, 
    updateLight, 
    color, 
    setColor, 
    roughness, 
    setRoughness, 
    metalness, 
    setMetalness, 
    indirectLightIntensity, 
    setIndirectLightIntensity, 
    directorCamera, 
    backdropColor, 
    backdropBlur, 
    triggerProp, 
    clearProp, 
    isRecordingVideo, 
    setIsRecordingVideo, 
    setRecordedVideoUrl,
    musicVolume,
    narrationVolume
  } = useAppContext();

  const recordingState = useRef({ isRecording: false, startTime: 0 });
  const playbackState = useRef({ isPlaying: false, startTime: 0 });
  const playbackOriginalState = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentMusicUrl = useRef<string | null>(null);
  const currentNarrationUrl = useRef<string | null>(null);
  const currentProp = useRef<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const narrationSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  
  // Reusable objects to reduce GC
  const _v1 = useRef(new THREE.Vector3());
  const _q1 = useRef(new THREE.Quaternion());
  const _lastPointIndex = useRef(0);

  useEffect(() => {
    const handleInteraction = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const [pivotMatrix, setPivotMatrix] = React.useState(() => new THREE.Matrix4().setPosition(0, 0, 5));
  const [backdropTexture, setBackdropTexture] = React.useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (isRecordingVideo && !videoRecorderRef.current) {
      try {
        const canvas = gl.domElement;
        const videoStream = canvas.captureStream(30);
        
        // Setup Audio Context for recording
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        
        if (!audioDestinationRef.current) {
          audioDestinationRef.current = ctx.createMediaStreamDestination();
        }
        const dest = audioDestinationRef.current;

        // Combine video and audio tracks
        const combinedStream = new MediaStream([
          ...videoStream.getVideoTracks(),
          ...dest.stream.getAudioTracks()
        ]);

        let options: MediaRecorderOptions = {
          videoBitsPerSecond: 8000000, // Reduced from 12M for better performance
        };
        
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
          options.mimeType = 'video/mp4;codecs=h264';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          options.mimeType = 'video/webm;codecs=vp9';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          options.mimeType = 'video/webm';
        }
        
        const recorder = new MediaRecorder(combinedStream, options);
        videoChunksRef.current = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            videoChunksRef.current.push(e.data);
          }
        };
        
        recorder.onstop = () => {
          const blob = new Blob(videoChunksRef.current, { type: options.mimeType || 'video/mp4' });
          const url = URL.createObjectURL(blob);
          setRecordedVideoUrl(url);
          setIsRecordingVideo(false);
        };
        
        setTimeout(() => {
          if (isRecordingVideo) {
            if (ctx.state === 'suspended') ctx.resume();
            recorder.start();
            videoRecorderRef.current = recorder;
          }
        }, 300);
      } catch (e) {
        console.error("Failed to start video recording", e);
        setIsRecordingVideo(false);
      }
    } else if (!isRecordingVideo && videoRecorderRef.current) {
      videoRecorderRef.current.stop();
      videoRecorderRef.current = null;
    }
  }, [isRecordingVideo, gl, setIsRecordingVideo, setRecordedVideoUrl]);

  useEffect(() => {
    if (backdropColor) {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(
        backdropColor, 
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.mapping = THREE.EquirectangularReflectionMapping;
          setBackdropTexture(texture);
        },
        undefined,
        (error) => console.error('Error loading backdrop texture:', error)
      );
    } else {
      setBackdropTexture(null);
    }
  }, [backdropColor]);

  useEffect(() => {
    if (directorCamera) {
      const dummyCam = new THREE.PerspectiveCamera();
      dummyCam.position.copy(directorCamera.position);
      dummyCam.lookAt(directorCamera.target);
      dummyCam.updateMatrix();
      setPivotMatrix(dummyCam.matrix.clone());
    }
  }, [directorCamera]);

  const restoreOriginalState = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current.currentTime = 0;
      narrationAudioRef.current = null;
    }
    currentMusicUrl.current = null;
    currentNarrationUrl.current = null;
    
    if (currentProp.current) {
      clearProp();
      currentProp.current = null;
    }

    if (playbackOriginalState.current) {
      setIndirectLightIntensity(playbackOriginalState.current.indirectLightIntensity);
      playbackOriginalState.current.lights.forEach((origLight: any) => {
        updateLight(origLight.id, {
          intensity: origLight.intensity,
          type: origLight.type,
          width: origLight.width,
          height: origLight.height
        });
      });
      playbackOriginalState.current.lightPositions.forEach((lp: any) => {
        const pivot = scene.getObjectByName(`light-pivot-${lp.id}`);
        if (pivot && pivot.parent) {
          pivot.parent.worldToLocal(lp.position.clone());
          pivot.position.copy(lp.position);
        }
      });
      playbackOriginalState.current = null;
    }
  };

  useEffect(() => {
    return () => {
      restoreOriginalState();
    };
  }, []);

  useEffect(() => {
    if (pivotRef.current) {
      const pivotRoot = pivotRef.current.parent?.parent;
      if (pivotRoot) {
        pivotRoot.traverse((child) => {
          child.layers.set(1);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!presetTrigger) return;

    const targetGroup = scene.getObjectByName('target-model');
    if (!targetGroup) return;

    // Calculate bounding box of the target model
    const box = new THREE.Box3().setFromObject(targetGroup);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const targetSize = new THREE.Vector3();
    box.getSize(targetSize);

    const radius = Math.max(targetSize.x, targetSize.z, 1) * 1.5 + 1;
    let duration = 5;
    if (presetTrigger.sequence) {
      duration = presetTrigger.sequence.reduce((acc, p) => acc + p.duration, 0);
    } else if (presetTrigger.timeline) {
      duration = presetTrigger.timeline.duration;
    } else if (presetTrigger.duration) {
      duration = presetTrigger.duration;
    }
    const fps = 60;
    const frames = duration * fps;
    
    recordedPath.points = [];
    
    const dummyCam = new THREE.PerspectiveCamera();

    for (let i = 0; i <= frames; i++) {
      const time = (i / frames) * duration;
      
      let pointLights: any = undefined;
      let pointIndirectLight: number | undefined = undefined;
      
      let focalPoint: THREE.Vector3 | undefined = markers.length > 0 ? new THREE.Vector3(...markers[0].position) : undefined;

      let pointAnimatedProp: string | undefined = undefined;
      let pointBackgroundMusic: string | undefined = undefined;

      if (presetTrigger.sequence) {
        let currentSequenceTime = 0;
        let activePreset = presetTrigger.sequence[0];
        let presetStartTime = 0;
        
        for (const p of presetTrigger.sequence) {
          if (time >= currentSequenceTime && time <= currentSequenceTime + p.duration) {
            activePreset = p;
            presetStartTime = currentSequenceTime;
            break;
          }
          currentSequenceTime += p.duration;
        }
        
        pointAnimatedProp = activePreset.animatedProp;
        pointBackgroundMusic = activePreset.backgroundMusic;

        if (activePreset.params?.focalPointLabel === 'none') {
          focalPoint = undefined;
        } else if (activePreset.params?.focalPointLabel) {
          const marker = markers.find(m => m.label === activePreset.params.focalPointLabel);
          focalPoint = marker ? new THREE.Vector3(...marker.position) : undefined;
        }

        const localT = activePreset.duration > 0 ? (time - presetStartTime) / activePreset.duration : 0;
        if (CinematicPresets[activePreset.name]) {
          const presetResult = CinematicPresets[activePreset.name](localT, {
            center,
            targetSize,
            radius,
            focalPoint,
            lights,
            dummyCam
          }, activePreset.params);

          dummyCam.position.copy(presetResult.camera.position);
          if (presetResult.camera.up) dummyCam.up.copy(presetResult.camera.up);
          dummyCam.lookAt(presetResult.camera.lookAt);
          
          pointLights = presetResult.lights;
          pointIndirectLight = presetResult.indirectLightIntensity;
        }
      } else if (presetTrigger.timeline) {
        const t = i / frames;
        const state = interpolateTimeline(presetTrigger.timeline, t);
        if (state) {
          if (state.camera.position) dummyCam.position.copy(state.camera.position);
          if (state.camera.lookAt) dummyCam.lookAt(state.camera.lookAt);
          if (state.lights.length > 0) pointLights = state.lights;
          if (state.indirectLightIntensity !== undefined) pointIndirectLight = state.indirectLightIntensity;
        }
      } else if (CinematicPresets[presetTrigger.name]) {
        if (presetTrigger.params?.focalPointLabel === 'none') {
          focalPoint = undefined;
        } else if (presetTrigger.params?.focalPointLabel) {
          const marker = markers.find(m => m.label === presetTrigger.params.focalPointLabel);
          focalPoint = marker ? new THREE.Vector3(...marker.position) : undefined;
        }

        const t = i / frames;
        const presetResult = CinematicPresets[presetTrigger.name](t, {
          center,
          targetSize,
          radius,
          focalPoint,
          lights,
          dummyCam
        }, presetTrigger.params);

        dummyCam.position.copy(presetResult.camera.position);
        if (presetResult.camera.up) dummyCam.up.copy(presetResult.camera.up);
        dummyCam.lookAt(presetResult.camera.lookAt);
        
        pointLights = presetResult.lights;
        pointIndirectLight = presetResult.indirectLightIntensity;
      }

      recordedPath.points.push({
        position: dummyCam.position.clone(),
        quaternion: dummyCam.quaternion.clone(),
        time,
        lights: pointLights,
        indirectLightIntensity: pointIndirectLight,
        animatedProp: pointAnimatedProp,
        backgroundMusic: pointBackgroundMusic
      });
    }

    if (onPathRecorded) onPathRecorded();
  }, [presetTrigger, scene, onPathRecorded, markers, lights, indirectLightIntensity]);

  useFrame((state) => {
    // Handle Recording
    if (isRecordingPath && !recordingState.current.isRecording) {
      recordingState.current.isRecording = true;
      recordingState.current.startTime = performance.now() / 1000;
      recordedPath.points = [];
    } else if (!isRecordingPath && recordingState.current.isRecording) {
      recordingState.current.isRecording = false;
      if (recordedPath.points.length > 0 && onPathRecorded) {
        onPathRecorded();
      }
    }

    if (recordingState.current.isRecording && cameraGroupRef.current) {
      recordedPath.points.push({
        position: cameraGroupRef.current.position.clone(),
        quaternion: cameraGroupRef.current.quaternion.clone(),
        time: (performance.now() / 1000) - recordingState.current.startTime,
      });
    }

    // Handle Playback
    if (isPlayingPath && !playbackState.current.isPlaying) {
      playbackState.current.isPlaying = true;
      playbackState.current.startTime = performance.now() / 1000;
      
      // Reset audio and prop refs so they trigger correctly on restart
      currentMusicUrl.current = null;
      currentNarrationUrl.current = null;
      currentProp.current = null;
      _lastPointIndex.current = 0;

      // Save original state before playback starts
      playbackOriginalState.current = {
        indirectLightIntensity,
        lights: lights.map(l => ({ ...l })),
        lightPositions: lights.map(l => {
          const pivot = scene.getObjectByName(`light-pivot-${l.id}`);
          return { id: l.id, position: pivot ? pivot.position.clone() : new THREE.Vector3() };
        })
      };
    } else if (!isPlayingPath && playbackState.current.isPlaying) {
      playbackState.current.isPlaying = false;
      restoreOriginalState();
    }

    if (playbackState.current.isPlaying && cameraGroupRef.current && recordedPath.points.length > 0) {
      const t = (performance.now() / 1000) - playbackState.current.startTime;
      const points = recordedPath.points;
      
      if (t >= points[points.length - 1].time) {
        playbackState.current.isPlaying = false;
        _lastPointIndex.current = 0;
        restoreOriginalState();
        if (onPlaybackComplete) onPlaybackComplete();
      } else {
        // Use last index as a starting point for optimization
        let i = _lastPointIndex.current;
        if (t < points[i].time) i = 0;
        
        for (; i < points.length - 1; i++) {
          if (t >= points[i].time && t <= points[i + 1].time) {
            _lastPointIndex.current = i;
            break;
          }
        }
        
        const p0 = points[i];
        const p1 = points[i + 1];
        const progress = p1.time === p0.time ? 0 : (t - p0.time) / (p1.time - p0.time);
        
        _v1.current.lerpVectors(p0.position, p1.position, progress);
        _q1.current.slerpQuaternions(p0.quaternion, p1.quaternion, progress);
        
        cameraGroupRef.current.position.copy(_v1.current);
        cameraGroupRef.current.quaternion.copy(_q1.current);
        
        // Apply light changes if they exist in the preset
        if (p0.indirectLightIntensity !== undefined && p1.indirectLightIntensity !== undefined) {
          const intensity = p0.indirectLightIntensity + (p1.indirectLightIntensity - p0.indirectLightIntensity) * progress;
          setIndirectLightIntensity(intensity);
        }

        if (p0.animatedProp !== currentProp.current) {
          if (p0.animatedProp) {
            triggerProp(p0.animatedProp as PropType);
          } else {
            clearProp();
          }
          currentProp.current = p0.animatedProp || null;
        }

        if (p0.backgroundMusic !== currentMusicUrl.current) {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
          }
          if (p0.backgroundMusic) {
            const audio = new Audio();
            audio.crossOrigin = "anonymous";
            audio.src = p0.backgroundMusic;
            audio.preload = "auto";
            audio.volume = musicVolume;
            audio.onerror = (e) => {
              console.warn("Audio failed to load:", p0.backgroundMusic, e);
              audioRef.current = null;
            };
            
            // Connect to AudioContext for recording
            if (audioContextRef.current && audioDestinationRef.current) {
              try {
                const ctx = audioContextRef.current;
                const connectSource = () => {
                  try {
                    const source = ctx.createMediaElementSource(audio);
                    source.connect(ctx.destination);
                    source.connect(audioDestinationRef.current!);
                  } catch (e) {
                    console.warn("Source already connected or failed", e);
                  }
                };

                if (ctx.state === 'suspended') {
                  ctx.resume().then(connectSource);
                } else {
                  connectSource();
                }
              } catch (err) {
                console.warn("Failed to connect background music to AudioContext:", err);
              }
            }

            audioRef.current = audio;
            audio.play().catch(e => {
              if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') {
                console.error("Audio play failed", e);
              }
            });
          }
          currentMusicUrl.current = p0.backgroundMusic || null;
        }

        // @ts-ignore
        if (p0.narrationAudio !== currentNarrationUrl.current) {
          if (narrationAudioRef.current) {
            narrationAudioRef.current.pause();
            narrationAudioRef.current.currentTime = 0;
            narrationAudioRef.current = null;
          }
          // @ts-ignore
          if (p0.narrationAudio) {
            // @ts-ignore
            const audio = new Audio();
            audio.crossOrigin = "anonymous";
            // @ts-ignore
            audio.src = p0.narrationAudio;
            audio.preload = "auto";
            audio.volume = narrationVolume;
            audio.onerror = (e) => {
              // @ts-ignore
              console.warn("Narration failed to load:", p0.narrationAudio, e);
              narrationAudioRef.current = null;
            };

            // Connect to AudioContext for recording
            if (audioContextRef.current && audioDestinationRef.current) {
              try {
                const ctx = audioContextRef.current;
                const connectSource = () => {
                  try {
                    const source = ctx.createMediaElementSource(audio);
                    source.connect(ctx.destination);
                    source.connect(audioDestinationRef.current!);
                  } catch (e) {
                    console.warn("Narration source already connected or failed", e);
                  }
                };

                if (ctx.state === 'suspended') {
                  ctx.resume().then(connectSource);
                } else {
                  connectSource();
                }
              } catch (err) {
                console.warn("Failed to connect narration to AudioContext:", err);
              }
            }

            narrationAudioRef.current = audio;
            audio.play().catch(e => {
              if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') {
                console.error("Narration play failed", e);
              }
            });
          }
          // @ts-ignore
          currentNarrationUrl.current = p0.narrationAudio || null;
        }

        if (p0.lights && p1.lights) {
          for (let i = 0; i < p0.lights.length; i++) {
            const l0 = p0.lights[i];
            const l1 = p1.lights[i];
            if (l0 && l1 && l0.id === l1.id) {
              const intensity = l0.intensity + (l1.intensity - l0.intensity) * progress;
              const updates: any = { intensity };
              if (l0.type) updates.type = l0.type;
              if (l0.width !== undefined && l1.width !== undefined) updates.width = l0.width + (l1.width - l0.width) * progress;
              if (l0.height !== undefined && l1.height !== undefined) updates.height = l0.height + (l1.height - l0.height) * progress;
              
              updateLight(l0.id, updates);
              
              // To update light position, we'd need to find the light's pivot in the scene
              // For a true implementation, LightGadget should read from a shared ref or store
              // For this prototype, we'll try to find it in the scene and update its position directly
              const lightPivot = scene.getObjectByName(`light-pivot-${l0.id}`);
              if (lightPivot && lightPivot.parent) {
                const pos = new THREE.Vector3().lerpVectors(l0.position, l1.position, progress);
                lightPivot.parent.worldToLocal(pos);
                lightPivot.position.copy(pos);
                
                if (l0.lookAt && l1.lookAt) {
                  const lookAt = new THREE.Vector3().lerpVectors(l0.lookAt, l1.lookAt, progress);
                  lightPivot.lookAt(lookAt);
                }
              }
            }
          }
        }
      }
    } else {
      if (pivotRef.current && cameraGroupRef.current) {
        pivotRef.current.updateWorldMatrix(true, false);
        pivotRef.current.getWorldPosition(cameraGroupRef.current.position);
        pivotRef.current.getWorldQuaternion(cameraGroupRef.current.quaternion);
      }
    }

    if (camRef.current && cameraGroupRef.current) {
      // Force update the camera's world matrix to prevent 1-frame lag when dragging
      camRef.current.updateWorldMatrix(true, true);
      
      // Hide the camera gadget itself from the PiP view
      cameraGroupRef.current.visible = false;
      
      // Hide light gadgets from the PiP view
      const hiddenObjects: THREE.Object3D[] = [];
      scene.traverse((child) => {
        if (child.name === 'light-gadget-meshes') {
          if (child.visible) {
            child.visible = false;
            hiddenObjects.push(child);
          }
        }
        if (child.name.startsWith('light-pivot-')) {
          const pivotRoot = child.parent?.parent;
          if (pivotRoot && pivotRoot.visible) {
            pivotRoot.visible = false;
            hiddenObjects.push(pivotRoot);
          }
        }
      });
      
      const mainGrid = scene.getObjectByName('main-grid');
      if (mainGrid && mainGrid.visible) {
        mainGrid.visible = false;
        hiddenObjects.push(mainGrid);
      }
      
      const oldTarget = state.gl.getRenderTarget();
      const oldBackground = scene.background;
      const oldBackgroundBlurriness = scene.backgroundBlurriness;
      
      if (!isRecordingVideo) {
        if (backdropTexture) {
          scene.background = backdropTexture;
          scene.backgroundBlurriness = backdropBlur;
        } else {
          scene.background = new THREE.Color('#0a0a0a');
          scene.backgroundBlurriness = 0;
        }
        
        state.gl.setRenderTarget(fbo);
        state.gl.clear();
        state.gl.render(scene, camRef.current);
        state.gl.setRenderTarget(oldTarget);
        
        scene.background = oldBackground;
        scene.backgroundBlurriness = oldBackgroundBlurriness;
      } else {
        if (backdropTexture) {
          scene.background = backdropTexture;
          scene.backgroundBlurriness = backdropBlur;
        } else {
          scene.background = new THREE.Color('#0a0a0a');
          scene.backgroundBlurriness = 0;
        }
      }
      
      // Restore visibility
      cameraGroupRef.current.visible = true;
      hiddenObjects.forEach(obj => {
        obj.visible = true;
      });
    }
  });

  const pipWidth = 256;
  const pipHeight = 256 / aspect;
  const margin = 24;

  return (
    <>
      <PivotControls scale={0.75} depthTest={false} visible={!isRecordingVideo && !isPlayingPath} matrix={pivotMatrix}>
        <group ref={pivotRef} />
      </PivotControls>
      
      <group ref={cameraGroupRef} name="camera-gadget">
        <group visible={!isRecordingVideo}>
          {/* Camera Body */}
          <mesh castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.6, 0.4, 0.3]} />
            <meshStandardMaterial color="#222" roughness={0.8} metalness={0.2} />
          </mesh>
          {/* Lens Barrel */}
          <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow={false} receiveShadow={false}>
            <cylinderGeometry args={[0.15, 0.15, 0.2, 32]} />
            <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Glass */}
          <mesh position={[0, 0, -0.305]} rotation={[Math.PI / 2, 0, 0]} castShadow={false} receiveShadow={false}>
            <cylinderGeometry args={[0.12, 0.12, 0.01, 32]} />
            <meshStandardMaterial color="#000" roughness={0} metalness={1} envMapIntensity={2} />
          </mesh>
          {/* Viewfinder */}
          <mesh position={[0, 0.25, 0.05]} castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.2, 0.1, 0.2]} />
            <meshStandardMaterial color="#222" roughness={0.8} />
          </mesh>
          {/* Record Light */}
          <mesh position={[0.2, 0.1, -0.16]} castShadow={false} receiveShadow={false}>
            <circleGeometry args={[0.03, 16]} />
            <meshBasicMaterial color="#ff3333" />
          </mesh>
        </group>
        
        <PerspectiveCamera 
          ref={camRef} 
          makeDefault={isRecordingVideo}
          position={[0, 0, 0]} 
          fov={50} 
          aspect={aspect}
          near={0.1} 
          far={100} 
        />
      </group>

      {!isRecordingVideo && (
        <Hud>
          <OrthographicCamera makeDefault left={0} right={size.width} top={size.height} bottom={0} near={-1} far={1} />
          <mesh position={[size.width - pipWidth / 2 - margin, pipHeight / 2 + margin, 0]}>
            <planeGeometry args={[pipWidth, pipHeight]} />
            <meshBasicMaterial map={fbo.texture} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        </Hud>
      )}
    </>
  );
}
