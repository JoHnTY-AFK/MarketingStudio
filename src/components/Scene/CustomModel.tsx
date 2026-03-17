import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useAppContext } from '../../context/AppContext';

export default function CustomModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const { showMarkerGadget, addMarker } = useAppContext();
  
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return (
    <primitive 
      object={clonedScene} 
      onClick={(e: any) => {
        if (showMarkerGadget) {
          e.stopPropagation();
          addMarker([e.point.x, e.point.y, e.point.z]);
        }
      }}
    />
  );
}
