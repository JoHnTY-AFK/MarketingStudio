import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Grid, PivotControls, Html } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { useAppContext } from '../../context/AppContext';
import CameraGadget from './CameraGadget';
import LightGadget from './LightGadget';
import CustomModel from './CustomModel';
import AnimatedProps from './AnimatedProps';
import * as THREE from 'three';

import { AnnotationAgent } from '../../services/annotationAgent';

function AnnotationHandler() {
  const { scene, gl, camera } = useThree();
  const { annotationPrompt, setAnnotationPrompt, addMarker } = useAppContext();

  useEffect(() => {
    if (!annotationPrompt) return;

    const annotate = async () => {
      try {
        // Capture current canvas
        const canvas = gl.domElement;
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

        const prompts = annotationPrompt.split(',').map(p => p.trim()).filter(p => p.length > 0);

        for (const prompt of prompts) {
          // Call agent
          const coords = await AnnotationAgent.findFeature2D(prompt, imageBase64);
          
          if (coords) {
            // Convert to NDC
            const ndcX = (coords.x * 2) - 1;
            const ndcY = -(coords.y * 2) + 1;

            // Raycast
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

            const targetModel = scene.getObjectByName('target-model');
            if (targetModel) {
              const intersects = raycaster.intersectObject(targetModel, true);
              if (intersects.length > 0) {
                const point = intersects[0].point;
                addMarker([point.x, point.y, point.z], prompt);
              } else {
                console.warn(`Annotation point for "${prompt}" did not intersect with the model.`);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to annotate:", error);
      } finally {
        setAnnotationPrompt(null);
      }
    };

    annotate();
  }, [annotationPrompt, scene, gl, camera, addMarker, setAnnotationPrompt]);

  return null;
}

function SnapshotCapturer() {
  const { scene, gl } = useThree();
  const { captureSnapshotFromAngleRef, backdropColor, backdropBlur } = useAppContext();

  useEffect(() => {
    captureSnapshotFromAngleRef.current = async (position: THREE.Vector3, target: THREE.Vector3) => {
      const width = 512;
      const height = 512;
      
      const renderTarget = new THREE.WebGLRenderTarget(width, height, {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType
      });
      
      const dummyCam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      dummyCam.position.copy(position);
      dummyCam.lookAt(target);
      dummyCam.updateMatrixWorld();
      
      const cameraGadget = scene.getObjectByName('camera-gadget');
      const wasVisible = cameraGadget ? cameraGadget.visible : false;
      if (cameraGadget) cameraGadget.visible = false;

      const mainGrid = scene.getObjectByName('main-grid');
      const gridWasVisible = mainGrid ? mainGrid.visible : false;
      if (mainGrid) mainGrid.visible = false;

      const oldTarget = gl.getRenderTarget();
      const oldBackground = scene.background;
      const oldBackgroundBlurriness = scene.backgroundBlurriness;

      if (backdropColor) {
        const texture = await new Promise<THREE.Texture>((resolve) => {
          const loader = new THREE.TextureLoader();
          loader.setCrossOrigin('anonymous');
          loader.load(
            backdropColor, 
            (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.mapping = THREE.EquirectangularReflectionMapping;
              resolve(tex);
            },
            undefined,
            () => resolve(new THREE.Texture()) // Fallback on error
          );
        });
        scene.background = texture;
        scene.backgroundBlurriness = backdropBlur;
      } else {
        scene.background = new THREE.Color('#0a0a0a');
        scene.backgroundBlurriness = 0;
      }

      gl.setRenderTarget(renderTarget);
      gl.clear();
      gl.render(scene, dummyCam);
      gl.setRenderTarget(oldTarget);
      
      scene.background = oldBackground;
      scene.backgroundBlurriness = oldBackgroundBlurriness;

      if (cameraGadget) cameraGadget.visible = wasVisible;
      if (mainGrid) mainGrid.visible = gridWasVisible;
      
      const buffer = new Uint8Array(width * height * 4);
      gl.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer);
      
      const canvas2d = document.createElement('canvas');
      canvas2d.width = width;
      canvas2d.height = height;
      const ctx = canvas2d.getContext('2d');
      if (!ctx) return '';
      const imgData = ctx.createImageData(width, height);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcIndex = (y * width + x) * 4;
          const destIndex = ((height - y - 1) * width + x) * 4;
          imgData.data[destIndex] = buffer[srcIndex];
          imgData.data[destIndex + 1] = buffer[srcIndex + 1];
          imgData.data[destIndex + 2] = buffer[srcIndex + 2];
          imgData.data[destIndex + 3] = buffer[srcIndex + 3];
        }
      }
      ctx.putImageData(imgData, 0, 0);
      renderTarget.dispose();
      
      return canvas2d.toDataURL('image/jpeg', 0.8);
    };
    return () => {
      captureSnapshotFromAngleRef.current = null;
    };
  }, [scene, gl, captureSnapshotFromAngleRef]);

  return null;
}

function DirectorCameraHandler() {
  const { directorCamera, setDirectorCamera } = useAppContext();
  const { camera, controls } = useThree();

  useEffect(() => {
    if (directorCamera) {
      camera.position.copy(directorCamera.position);
      if (controls) {
        // @ts-ignore
        controls.target.copy(directorCamera.target);
        // @ts-ignore
        controls.update();
      } else {
        camera.lookAt(directorCamera.target);
      }
      // Reset the director camera state after applying to avoid infinite loops
      // but only if we want it to be a one-time jump. 
      // Actually, let's keep it so it can be re-applied.
    }
  }, [directorCamera, camera, controls]);

  return null;
}

function TargetBoundingSphereUpdater() {
  const { scene } = useThree();
  const { setTargetBoundingSphere, customModelUrl } = useAppContext();

  useEffect(() => {
    // Wait a bit for the model to load if it's a custom model
    const timeout = setTimeout(() => {
      const targetGroup = scene.getObjectByName('target-model');
      if (targetGroup) {
        const box = new THREE.Box3().setFromObject(targetGroup);
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        // If the sphere is empty (radius 0 or negative), fallback to default
        if (sphere.radius <= 0 || !isFinite(sphere.radius)) {
          setTargetBoundingSphere(new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1));
        } else {
          setTargetBoundingSphere(sphere);
        }
      }
    }, 500); // 500ms delay to ensure model is loaded

    return () => clearTimeout(timeout);
  }, [scene, setTargetBoundingSphere, customModelUrl]);

  return null;
}


function Backdrop() {
  const { scene } = useThree();
  const { backdropColor, backdropBlur } = useAppContext();

  useEffect(() => {
    if (!backdropColor) {
      scene.background = new THREE.Color('#0a0a0a');
      scene.environment = null;
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      backdropColor, 
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        scene.background = texture;
        scene.environment = texture;
        scene.backgroundBlurriness = backdropBlur;
      },
      undefined,
      () => {
        console.warn("Failed to load backdrop, using default.");
        scene.background = new THREE.Color('#0a0a0a');
      }
    );
  }, [backdropColor, backdropBlur, scene]);

  return null;
}

export default function Scene() {
  const gridRef = React.useRef<any>(null);
  
  useEffect(() => {
    RectAreaLightUniformsLib.init();
  }, []);

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.layers.set(2);
      gridRef.current.traverse((child) => {
        child.layers.set(2);
      });
    }
  }, []);

  const {
    color,
    roughness,
    metalness,
    lights,
    indirectLightIntensity,
    envPreset,
    customEnvUrl,
    customModelUrl,
    showCameraGadget,
    isRecordingPath,
    isPlayingPath,
    presetTrigger,
    setHasRecordedPath,
    setIsPlayingPath,
    setIsPausedPath,
    showMarkerGadget,
    showGizmoGadget,
    markers,
    addMarker,
    directorNodes,
    backdropColor,
    isRecordingVideo,
    setIsRecordingVideo
  } = useAppContext();

  return (
    <Canvas 
      camera={{ position: [0, 0, 4], fov: 45 }}
      gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }}
      id="product-canvas"
      onCreated={({ camera, raycaster, gl, scene }) => {
        camera.layers.enable(1);
        camera.layers.enable(2);
        raycaster.layers.enable(1);
        raycaster.layers.enable(2);
        gl.setClearColor('#0a0a0a');
        scene.background = new THREE.Color('#0a0a0a');
      }}
    >
      <DirectorCameraHandler />
      <SnapshotCapturer />
      <Backdrop />
      <TargetBoundingSphereUpdater />
      <AnnotationHandler />
      
      <ambientLight intensity={indirectLightIntensity * 0.5} />
      {lights.map((light, index) => (
        <LightGadget
          key={light.id}
          id={light.id}
          type={light.type}
          intensity={light.intensity}
          color={light.color}
          pointSize={light.pointSize}
          spotAngle={light.spotAngle}
          width={light.width}
          height={light.height}
          position={light.position}
          visible={light.visible}
          triggerLookAtOrigin={light.triggerLookAtOrigin}
          initialPosition={[5 + index * 2, 5, 5 - index * 2]}
        />
      ))}
      {!backdropColor && (envPreset === 'custom' && customEnvUrl ? (
        <Environment files={customEnvUrl} environmentIntensity={indirectLightIntensity} />
      ) : (
        <Environment preset={envPreset as any} environmentIntensity={indirectLightIntensity} />
      ))}

      <AnimatedProps />

      {/* Visualize Director Nodes */}
      {!isRecordingVideo && directorNodes && directorNodes.length > 0 && (
        <group>
          {directorNodes.map((pos, i) => (
            <mesh key={`dir-node-${i}`} position={pos}>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshBasicMaterial color="#f59e0b" wireframe />
            </mesh>
          ))}
        </group>
      )}

      <Suspense fallback={
        <Html center>
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Loading Assets...</span>
          </div>
        </Html>
      }>
        {showCameraGadget && (
          <CameraGadget 
            isRecordingPath={isRecordingPath}
            isPlayingPath={isPlayingPath}
            presetTrigger={presetTrigger}
            onPathRecorded={() => setHasRecordedPath(true)}
            onPlaybackComplete={() => {
              setIsPlayingPath(false);
              setIsPausedPath(false);
              setIsRecordingVideo(false);
            }}
          />
        )}
        <PivotControls
          scale={1.5}
          depthTest={false}
          visible={showGizmoGadget && !isRecordingVideo && !isPlayingPath}
          disableAxes={!showGizmoGadget || isRecordingVideo || isPlayingPath}
          disableSliders={!showGizmoGadget || isRecordingVideo || isPlayingPath}
          disableRotations={!showGizmoGadget || isRecordingVideo || isPlayingPath}
        >
          <group position={[0, 0, 0]} name="target-model">
            {customModelUrl ? (
              <CustomModel url={customModelUrl} />
            ) : (
              <mesh 
                castShadow 
                receiveShadow
                onClick={(e) => {
                  if (showMarkerGadget) {
                    e.stopPropagation();
                    addMarker([e.point.x, e.point.y, e.point.z]);
                  }
                }}
              >
                <sphereGeometry args={[1, 64, 64]} />
                <meshStandardMaterial
                  color={color}
                  roughness={roughness}
                  metalness={metalness}
                />
              </mesh>
            )}
            {!isRecordingVideo && showMarkerGadget && markers.map((marker) => (
              <mesh key={marker.id} position={marker.position}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshBasicMaterial color="#ef4444" />
                <Html position={[0, 0.1, 0]} center style={{ pointerEvents: 'none' }}>
                  <div className="px-2 py-1 bg-[#151619]/90 text-white text-[10px] font-mono rounded border border-white/10 whitespace-nowrap shadow-lg">
                    {marker.label}
                  </div>
                </Html>
              </mesh>
            ))}
          </group>
        </PivotControls>
        
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.5}
          scale={10}
          blur={2}
          far={4}
          color="#000000"
        />
      </Suspense>

      <Grid
        ref={gridRef}
        name="main-grid"
        position={[0, 0, 0]}
        args={[10.5, 10.5]}
        cellSize={0.5}
        cellThickness={1}
        cellColor="#333333"
        sectionSize={2.5}
        sectionThickness={1.5}
        sectionColor="#444444"
        fadeDistance={15}
        fadeStrength={1}
        visible={!isRecordingVideo}
      />

      <OrbitControls 
        makeDefault={!isRecordingVideo} 
        enabled={!isRecordingVideo && !isPlayingPath}
        minPolarAngle={0} 
        maxPolarAngle={Math.PI} 
        enableDamping={true}
        dampingFactor={0.05}
      />
    </Canvas>
  );
}
