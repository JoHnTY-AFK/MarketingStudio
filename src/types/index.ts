export type LightType = 'directional' | 'point' | 'spot' | 'rectArea';

export type PropType = 'particles' | 'energyRings' | 'lightSweep' | 'confetti' | 'pedestal' | 'abstractWave';

export interface ActiveProp {
  id: string;
  type: PropType;
  params?: any;
}

export interface LightConfig {
  id: string;
  type: LightType;
  intensity: number;
  color: string;
  pointSize: number;
  spotAngle: number;
  width?: number;
  height?: number;
  position?: [number, number, number];
  visible: boolean;
  triggerLookAtOrigin?: number;
}

export interface Marker {
  id: string;
  position: [number, number, number];
  label?: string;
}

export interface AnimationKeyframe {
  time: number; // 0.0 to 1.0 (normalized progress)
  camera?: {
    position?: [number, number, number];
    lookAt?: [number, number, number];
  };
  lights?: Array<{
    id: string;
    position?: [number, number, number];
    intensity?: number;
    color?: string;
    type?: LightType;
  }>;
  indirectLightIntensity?: number;
}

export interface AnimationTimeline {
  duration: number; // in seconds
  keyframes: AnimationKeyframe[];
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}
