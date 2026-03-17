import * as THREE from 'three';

export const recordedPath: {
  points: { 
    position: THREE.Vector3; 
    quaternion: THREE.Quaternion; 
    time: number;
    lights?: { id: string, position: THREE.Vector3, intensity: number, color: string, type?: string, width?: number, height?: number, spotAngle?: number, lookAt?: THREE.Vector3 }[];
    material?: { color: string, roughness: number, metalness: number };
    indirectLightIntensity?: number;
    animatedProp?: string;
    backgroundMusic?: string;
    narrationAudio?: string;
  }[];
} = { points: [] };
