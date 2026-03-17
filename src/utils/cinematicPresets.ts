import * as THREE from 'three';
import { LightConfig } from '../types';

export interface PresetContext {
  center: THREE.Vector3;
  targetSize: THREE.Vector3;
  radius: number;
  focalPoint?: THREE.Vector3;
  lights: LightConfig[];
  dummyCam: THREE.PerspectiveCamera;
}

export interface PresetParams {
  direction?: 1 | -1 | 'up' | 'down' | 'left' | 'right';
  speed?: number; // Multiplier for revolutions or distance
  zoomLevel?: number; // Multiplier for radius (e.g., 0.5 for close up, 2.0 for wide)
  angleOffset?: number; // Radians offset for starting angle
  heightOffset?: number; // Relative to target size
  [key: string]: any;
}

export interface PresetResult {
  camera: { position: THREE.Vector3; lookAt: THREE.Vector3; up?: THREE.Vector3 };
  lights: any[];
  indirectLightIntensity: number;
}

export const CinematicPresets: Record<string, (t: number, ctx: PresetContext, params?: PresetParams) => PresetResult> = {
  'Turntable': (t, { center, targetSize, radius, lights, focalPoint }, params = {}) => {
    const direction = params.direction === -1 ? -1 : 1;
    const speed = params.speed || 1;
    const zoomLevel = params.zoomLevel || 1;
    const angleOffset = params.angleOffset || 0;
    const heightOffset = params.heightOffset !== undefined ? params.heightOffset : 0.2;

    const angle = angleOffset + (t * Math.PI * 2 * speed * direction);
    const currentRadius = radius * zoomLevel;
    
    let camPos = new THREE.Vector3(
      center.x + Math.sin(angle) * currentRadius,
      center.y + targetSize.y * heightOffset,
      center.z + Math.cos(angle) * currentRadius
    );

    let lookAtTarget = center.clone();

    if (focalPoint) {
      // Smoothly focus on the focal point and back. Peaks at t=0.5
      const focusWeight = Math.sin(t * Math.PI);
      
      // Pan lookAt to focal point
      lookAtTarget.lerp(focalPoint, focusWeight);
      
      // Adjust camera height to align better with focal point
      camPos.y = THREE.MathUtils.lerp(camPos.y, focalPoint.y + targetSize.y * 0.1, focusWeight);
      
      // Zoom in slightly towards the focal point
      const zoomInRadius = currentRadius * 0.6;
      const radiusAtT = THREE.MathUtils.lerp(currentRadius, zoomInRadius, focusWeight);
      camPos.x = center.x + Math.sin(angle) * radiusAtT;
      camPos.z = center.z + Math.cos(angle) * radiusAtT;
    }

    const pointLights = lights.slice(0, 3).map((light, index) => {
      const lightAngle = t * Math.PI * 4 + (index * Math.PI * 2 / 3);
      let lightPos = new THREE.Vector3(
        center.x + Math.sin(lightAngle) * currentRadius * 1.5, 
        center.y + currentRadius * (1 + index * 0.2), 
        center.z + Math.cos(lightAngle) * currentRadius * 1.5
      );

      if (focalPoint && index === 0) {
        // Bring the primary light closer to the focal point to highlight it
        const focusWeight = Math.sin(t * Math.PI);
        const focalLightPos = focalPoint.clone().add(new THREE.Vector3(
          Math.sin(angle + Math.PI / 4) * currentRadius * 0.8,
          targetSize.y * 0.5,
          Math.cos(angle + Math.PI / 4) * currentRadius * 0.8
        ));
        lightPos.lerp(focalLightPos, focusWeight);
      }

      return {
        id: light.id,
        position: lightPos,
        intensity: light.intensity,
        color: light.color,
        type: light.type
      };
    });

    return {
      camera: { position: camPos, lookAt: lookAtTarget },
      lights: pointLights,
      indirectLightIntensity: 0.5
    };
  },

  'Vertical Sweep': (t, { center, targetSize, radius, lights, focalPoint }, params = {}) => {
    const direction = params.direction === 'up' ? -1 : 1; // 1 = down, -1 = up
    const zoomLevel = params.zoomLevel || 0.8;
    const heightOffset = params.heightOffset !== undefined ? params.heightOffset : 0.5;
    
    const startY = center.y + targetSize.y * heightOffset * direction;
    const endY = center.y - targetSize.y * heightOffset * direction;
    
    let camPos = new THREE.Vector3(center.x, startY - (startY - endY) * t, center.z + radius * zoomLevel);
    let lookAtTarget = new THREE.Vector3(center.x, startY - (startY - endY) * t, center.z);

    if (focalPoint) {
      const focusWeight = Math.sin(t * Math.PI);
      lookAtTarget.lerp(focalPoint, focusWeight);
      camPos.x = THREE.MathUtils.lerp(camPos.x, focalPoint.x, focusWeight * 0.5);
      camPos.z = THREE.MathUtils.lerp(camPos.z, focalPoint.z + radius * zoomLevel * 0.8, focusWeight);
    }

    const pointLights = lights.slice(0, 3).map((light, index) => {
      let lightPos = new THREE.Vector3(
        center.x + radius * (index === 1 ? -1 : 1), 
        center.y + targetSize.y + (index * 0.5), 
        center.z + radius * (index === 2 ? -1 : 1)
      );

      if (focalPoint && index === 0) {
        const focusWeight = Math.sin(t * Math.PI);
        lightPos.lerp(focalPoint.clone().add(new THREE.Vector3(0, targetSize.y * 0.5, radius * 0.5)), focusWeight);
      }

      return {
        id: light.id,
        position: lightPos,
        intensity: light.intensity,
        color: light.color,
        type: light.type
      };
    });

    return {
      camera: { position: camPos, lookAt: lookAtTarget },
      lights: pointLights,
      indirectLightIntensity: 0.4
    };
  },

  'Top-Down': (t, { center, targetSize, radius, lights, focalPoint }, params = {}) => {
    const zoomLevel = params.zoomLevel || 1.5;
    const speed = params.speed || 1;
    
    let camPos = new THREE.Vector3(center.x, center.y + targetSize.y * zoomLevel + 1 - (t * speed * 0.5), center.z + 0.01);
    let lookAtTarget = center.clone();

    if (focalPoint) {
      const focusWeight = Math.sin(t * Math.PI);
      lookAtTarget.lerp(focalPoint, focusWeight);
      camPos.x = THREE.MathUtils.lerp(camPos.x, focalPoint.x, focusWeight);
      camPos.z = THREE.MathUtils.lerp(camPos.z, focalPoint.z + 0.01, focusWeight);
    }
    
    const lightStartX = center.x - radius * 2;
    const lightEndX = center.x + radius * 2;
    const pointLights = lights.slice(0, 3).map((light, index) => {
      const offsetZ = (index - 1) * radius * 0.5;
      let lightPos = new THREE.Vector3(
        lightStartX + (lightEndX - lightStartX) * t, 
        center.y + targetSize.y * 2 + index * 0.5, 
        center.z + offsetZ
      );

      if (focalPoint && index === 0) {
        const focusWeight = Math.sin(t * Math.PI);
        lightPos.lerp(focalPoint.clone().add(new THREE.Vector3(0, targetSize.y, 0)), focusWeight);
      }

      return {
        id: light.id,
        position: lightPos,
        intensity: light.intensity,
        color: light.color,
        type: light.type
      };
    });

    return {
      camera: { position: camPos, lookAt: lookAtTarget },
      lights: pointLights,
      indirectLightIntensity: 0.6
    };
  },

  'Macro Pan': (t, { center, targetSize, radius, lights, focalPoint }, params = {}) => {
    const direction = params.direction === 'right' ? -1 : 1;
    const zoomLevel = params.zoomLevel || 0.8; // Increased default zoom level to prevent being too close
    const speed = params.speed || 0.3;
    
    const targetCenter = focalPoint ? focalPoint : center;
    const macroRadius = Math.max(targetSize.x, targetSize.z) * zoomLevel + 0.2;
    const startX = targetCenter.x - targetSize.x * speed * direction;
    const endX = targetCenter.x + targetSize.x * speed * direction;
    
    let camPos = new THREE.Vector3(startX + (endX - startX) * t, targetCenter.y, targetCenter.z + macroRadius);
    let lookAtTarget = new THREE.Vector3(startX + (endX - startX) * t, targetCenter.y, targetCenter.z);

    if (focalPoint) {
      const focusWeight = Math.sin(t * Math.PI);
      camPos.z = THREE.MathUtils.lerp(camPos.z, targetCenter.z + macroRadius * 0.9, focusWeight);
    }

    const pointLights = lights.slice(0, 3).map((light, index) => {
      const offsetY = (index - 1) * targetSize.y * 0.3;
      let lightPos = new THREE.Vector3(
        endX - (endX - startX) * t, 
        targetCenter.y + targetSize.y * 0.5 + offsetY, 
        targetCenter.z + radius
      );

      if (focalPoint && index === 0) {
        const focusWeight = Math.sin(t * Math.PI);
        lightPos.lerp(focalPoint.clone().add(new THREE.Vector3(0, targetSize.y * 0.2, radius * 0.5)), focusWeight);
      }

      return {
        id: light.id,
        position: lightPos,
        intensity: light.intensity,
        color: light.color,
        type: light.type
      };
    });

    return {
      camera: { position: camPos, lookAt: lookAtTarget },
      lights: pointLights,
      indirectLightIntensity: 0.3
    };
  },

  'Spiral Reveal': (t, { center, targetSize, radius, lights, focalPoint }, params = {}) => {
    const direction = params.direction === -1 ? -1 : 1;
    const speed = params.speed || 1.25;
    const zoomLevel = params.zoomLevel || 1.5;
    
    const spiralAngle = t * Math.PI * 2 * speed * direction;
    const currentR = radius * zoomLevel * (1 - 0.3 * t); // Spirals inwards
    const startY = center.y - targetSize.y * 0.5;
    const endY = center.y + targetSize.y * 0.8;
    
    let camPos = new THREE.Vector3(
      center.x + Math.sin(spiralAngle) * currentR,
      startY + (endY - startY) * t,
      center.z + Math.cos(spiralAngle) * currentR
    );

    let lookAtTarget = center.clone();

    if (focalPoint) {
      const focusWeight = t; // Focus more on focal point as reveal progresses
      lookAtTarget.lerp(focalPoint, focusWeight);
      camPos.y = THREE.MathUtils.lerp(camPos.y, focalPoint.y + targetSize.y * 0.2, focusWeight * 0.5);
    }

    const pointLights = lights.slice(0, 3).map((light, index) => {
      const lightAngle = spiralAngle + Math.PI + (index * Math.PI / 2);
      let lightPos = new THREE.Vector3(
        center.x + Math.sin(lightAngle) * radius * 2,
        center.y + targetSize.y * (0.5 + index * 0.2),
        center.z + Math.cos(lightAngle) * radius * 2
      );

      if (focalPoint && index === 0) {
        lightPos.lerp(focalPoint.clone().add(new THREE.Vector3(0, targetSize.y * 0.5, radius)), t);
      }

      return {
        id: light.id,
        position: lightPos,
        intensity: light.intensity,
        color: light.color,
        type: light.type
      };
    });

    return {
      camera: { position: camPos, lookAt: lookAtTarget },
      lights: pointLights,
      indirectLightIntensity: 0.1 + 0.5 * t
    };
  },

  'Dynamic Push-In': (t, { center, targetSize, radius, lights, focalPoint }, params = {}) => {
    const zoomLevel = params.zoomLevel || 2.5;
    const speed = params.speed || 1.0;
    const heightOffset = params.heightOffset !== undefined ? params.heightOffset : 0.3;
    
    const easeT = 1 - Math.pow(1 - t, 3);
    const startZ = center.z + radius * zoomLevel;
    const endZ = center.z + radius * Math.max(1.0, zoomLevel - 1.5 * speed); // Prevent zooming too close
    
    let camPos = new THREE.Vector3(center.x, center.y + targetSize.y * heightOffset, startZ - (startZ - endZ) * easeT);
    let lookAtTarget = center.clone();

    if (focalPoint) {
      const focusWeight = easeT;
      lookAtTarget.lerp(focalPoint, focusWeight);
      camPos.x = THREE.MathUtils.lerp(camPos.x, focalPoint.x, focusWeight);
      camPos.y = THREE.MathUtils.lerp(camPos.y, focalPoint.y + targetSize.y * heightOffset * 0.5, focusWeight);
    }

    const pointLights = lights.slice(0, 3).map((light, index) => {
      let lightPos = new THREE.Vector3(
        center.x + (index - 1) * radius,
        center.y + targetSize.y * (1 + index * 0.2),
        startZ - (startZ - endZ) * easeT + radius
      );

      if (focalPoint && index === 0) {
        lightPos.lerp(focalPoint.clone().add(new THREE.Vector3(0, targetSize.y * 0.5, radius * 0.8)), easeT);
      }

      return {
        id: light.id,
        position: lightPos,
        intensity: light.intensity,
        color: light.color,
        type: light.type
      };
    });

    return {
      camera: { position: camPos, lookAt: lookAtTarget },
      lights: pointLights,
      indirectLightIntensity: 0.2 + 0.3 * easeT
    };
  },

  'Low Angle Hero': (t, { center, targetSize, radius, lights, focalPoint }, params = {}) => {
    const zoomLevel = params.zoomLevel || 2.0;
    const speed = params.speed || 1.0;
    const heightOffset = params.heightOffset !== undefined ? params.heightOffset : -0.3;
    
    const startZ = center.z + radius * zoomLevel;
    const endZ = center.z + radius * Math.max(0.8, zoomLevel - 0.8 * speed);
    const camY = center.y + targetSize.y * heightOffset;
    
    let camPos = new THREE.Vector3(center.x, camY, startZ - (startZ - endZ) * t);
    let lookAtTarget = new THREE.Vector3(center.x, center.y + targetSize.y * 0.4, center.z);

    if (focalPoint) {
      const focusWeight = t;
      lookAtTarget.lerp(focalPoint, focusWeight);
      camPos.x = THREE.MathUtils.lerp(camPos.x, focalPoint.x, focusWeight * 0.5);
    }

    const pointLights = lights.slice(0, 3).map((light, index) => {
      let lightPos = new THREE.Vector3(
        center.x + (index - 1) * radius * 1.5,
        center.y + targetSize.y * 1.5,
        center.z - radius
      );

      if (focalPoint && index === 0) {
        lightPos.lerp(focalPoint.clone().add(new THREE.Vector3(0, targetSize.y, radius * 0.5)), t);
      }

      return {
        id: light.id,
        position: lightPos,
        intensity: light.intensity,
        color: light.color,
        type: light.type
      };
    });

    return {
      camera: { position: camPos, lookAt: lookAtTarget },
      lights: pointLights,
      indirectLightIntensity: 0.3
    };
  },

  'Diagonal Slide': (t, { center, targetSize, radius, lights, focalPoint }, params = {}) => {
    const direction = params.direction === 'left' ? -1 : 1;
    const zoomLevel = params.zoomLevel || 1.2;
    const speed = params.speed || 0.8;
    
    const startX = center.x - radius * speed * direction;
    const endX = center.x + radius * speed * direction;
    const startY = center.y + targetSize.y * 0.5;
    const endY = center.y - targetSize.y * 0.2;
    
    let camPos = new THREE.Vector3(startX + (endX - startX) * t, startY - (startY - endY) * t, center.z + radius * zoomLevel);
    let lookAtTarget = center.clone();

    if (focalPoint) {
      const focusWeight = Math.sin(t * Math.PI);
      lookAtTarget.lerp(focalPoint, focusWeight);
      camPos.x = THREE.MathUtils.lerp(camPos.x, focalPoint.x - radius * speed * direction * (1 - 2*t), focusWeight * 0.5);
      camPos.y = THREE.MathUtils.lerp(camPos.y, focalPoint.y + targetSize.y * 0.2, focusWeight * 0.5);
    }

    const pointLights = lights.slice(0, 3).map((light, index) => {
      let lightPos = new THREE.Vector3(
        endX - (endX - startX) * t + (index - 1) * radius,
        endY + (startY - endY) * t + index * 0.5,
        center.z + radius
      );

      if (focalPoint && index === 0) {
        const focusWeight = Math.sin(t * Math.PI);
        lightPos.lerp(focalPoint.clone().add(new THREE.Vector3(0, targetSize.y * 0.5, radius * 0.5)), focusWeight);
      }

      return {
        id: light.id,
        position: lightPos,
        intensity: light.intensity,
        color: light.color,
        type: light.type
      };
    });

    return {
      camera: { position: camPos, lookAt: lookAtTarget },
      lights: pointLights,
      indirectLightIntensity: 0.5
    };
  },

  'Eclipse Reveal': (t, { center, targetSize, focalPoint, lights, dummyCam }, params = {}) => {
    const effectiveFocalPoint = focalPoint || center;
    const N = new THREE.Vector3().subVectors(effectiveFocalPoint, center).normalize();
    if (N.lengthSq() < 0.001) N.set(0, 1, 0);

    const preferredV = new THREE.Vector3(0, 0, -1); 
    const dot = preferredV.dot(N);
    const V = preferredV.clone().sub(N.clone().multiplyScalar(dot)).normalize();

    if (V.lengthSq() < 0.001) {
      V.set(1, 0, 0);
    }

    const D = Math.max(targetSize.x, targetSize.y, targetSize.z);
    const fov = dummyCam.fov || 50;
    const visibleHeight = D * (params.zoomLevel || 1.5);
    const distance = visibleHeight / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));

    const yOffset = visibleHeight * (1/6);

    let lookAtTarget = center.clone().add(N.clone().multiplyScalar(yOffset));
    let camPos = center.clone().sub(V.clone().multiplyScalar(distance)).add(N.clone().multiplyScalar(yOffset));

    if (focalPoint) {
      lookAtTarget.lerp(focalPoint, t);
    }

    const pointLights = lights.slice(0, 3).map((light, index) => {
      const lightBase = center.clone().add(V.clone().multiplyScalar(D * 0.6)); 
      const lightStartHeight = -D * 0.2; 
      const lightEndHeight = D * 0.8; 
      
      const currentHeight = lightStartHeight + (lightEndHeight - lightStartHeight) * t;
      let lightPos = lightBase.clone().add(N.clone().multiplyScalar(currentHeight + index * 0.2));
      
      if (focalPoint && index === 0) {
        lightPos.lerp(focalPoint.clone().add(N.clone().multiplyScalar(D * 0.5)), t);
      }

      const baseIntensity = light.intensity;
      const intensity = Math.min(10, baseIntensity + (10 - baseIntensity) * t);
      
      return {
        id: light.id,
        position: lightPos,
        intensity: intensity,
        color: light.color,
        type: 'rectArea'
      };
    });

    return {
      camera: { position: camPos, lookAt: lookAtTarget, up: N },
      lights: pointLights,
      indirectLightIntensity: 0.2 + 0.3 * t
    };
  },

  'Variant Transition': (t, { center, targetSize, radius, lights, focalPoint }, params = {}) => {
    const zoomLevel = params.zoomLevel || 2.5;
    const speed = params.speed || 1.0;
    
    const startZ = center.z + radius * zoomLevel;
    const endZ = center.z + radius * Math.max(0.5, zoomLevel - 1.0 * speed);
    
    let camPos = new THREE.Vector3(center.x, center.y, startZ - (startZ - endZ) * t);
    let lookAtTarget = center.clone();

    if (focalPoint) {
      const focusWeight = t;
      lookAtTarget.lerp(focalPoint, focusWeight);
      camPos.x = THREE.MathUtils.lerp(camPos.x, focalPoint.x, focusWeight);
      camPos.y = THREE.MathUtils.lerp(camPos.y, focalPoint.y, focusWeight);
    }

    const pointLights = lights.slice(0, 3).map((light, index) => {
      const lightAngle = t * Math.PI + (index * Math.PI / 4);
      let lightPos = new THREE.Vector3(
        center.x + Math.sin(lightAngle) * radius * 2, 
        center.y + radius * (1 + index * 0.3), 
        center.z + Math.cos(lightAngle) * radius * 2
      );

      if (focalPoint && index === 0) {
        lightPos.lerp(focalPoint.clone().add(new THREE.Vector3(0, targetSize.y * 0.5, radius)), t);
      }

      return {
        id: light.id,
        position: lightPos,
        intensity: light.intensity,
        color: light.color,
        type: light.type
      };
    });

    return {
      camera: { position: camPos, lookAt: lookAtTarget },
      lights: pointLights,
      indirectLightIntensity: 0.4
    };
  },
  'Product Hero': (t, { center, targetSize, radius, lights, focalPoint }, params = {}) => {
    const zoomLevel = params.zoomLevel || 1.5;
    const speed = params.speed || 0.5;
    
    // Slow dramatic orbit with a slight vertical oscillation
    const angle = (t * Math.PI * 0.5 * speed);
    const heightOscillation = Math.sin(t * Math.PI) * targetSize.y * 0.15;
    const currentRadius = radius * zoomLevel * (1 - 0.05 * Math.sin(t * Math.PI));
    
    let camPos = new THREE.Vector3(
      center.x + Math.sin(angle) * currentRadius,
      center.y + targetSize.y * 0.4 + heightOscillation,
      center.z + Math.cos(angle) * currentRadius
    );

    let lookAtTarget = center.clone();
    if (focalPoint) {
      lookAtTarget.lerp(focalPoint, Math.sin(t * Math.PI * 0.5));
    }

    const pointLights = lights.slice(0, 3).map((light, index) => {
      // Lights move in a way that creates sweeping highlights
      const lightAngle = t * Math.PI * 1.5 + (index * Math.PI * 2 / 3);
      let lightPos = new THREE.Vector3(
        center.x + Math.sin(lightAngle) * radius * 1.5,
        center.y + targetSize.y * (1.2 + Math.sin(t * Math.PI + index) * 0.3),
        center.z + Math.cos(lightAngle) * radius * 1.5
      );

      return {
        id: light.id,
        position: lightPos,
        intensity: light.intensity * (0.7 + 0.3 * Math.sin(t * Math.PI * 2 + index)),
        color: light.color,
        type: light.type
      };
    });

    return {
      camera: { position: camPos, lookAt: lookAtTarget },
      lights: pointLights,
      indirectLightIntensity: 0.4 + 0.3 * Math.sin(t * Math.PI)
    };
  },

  'Cinematic Reveal': (t, { center, targetSize, radius, lights, focalPoint }, params = {}) => {
    const zoomLevel = params.zoomLevel || 2.0;
    const speed = params.speed || 1.0;
    
    // Slow push in from darkness
    const easeT = t * t; // Quadratic ease-in for lighting
    const camZ = center.z + radius * zoomLevel * (1 - 0.2 * t);
    
    let camPos = new THREE.Vector3(center.x, center.y + targetSize.y * 0.2, camZ);
    let lookAtTarget = center.clone();

    if (focalPoint) {
      lookAtTarget.lerp(focalPoint, t);
    }

    const pointLights = lights.slice(0, 3).map((light, index) => {
      // Lights start behind and move to front, intensifying
      const lightZ = center.z + radius * (1.5 - 2.5 * t);
      let lightPos = new THREE.Vector3(
        center.x + (index - 1) * radius,
        center.y + targetSize.y * 1.5,
        lightZ
      );

      return {
        id: light.id,
        position: lightPos,
        intensity: light.intensity * (0.2 + 0.8 * easeT) * 1.5,
        color: light.color,
        type: light.type,
        lookAt: center
      };
    });

    return {
      camera: { position: camPos, lookAt: lookAtTarget },
      lights: pointLights,
      indirectLightIntensity: 0.15 + 0.35 * easeT
    };
  },

  'Rim Light Reveal': (t, { center, targetSize, radius, lights, focalPoint }, params = {}) => {
    const zoomLevel = params.zoomLevel || 1.8;
    
    // Start with camera behind or to the side, looking at the silhouette
    const angle = Math.PI * 0.75 + t * Math.PI * 0.5;
    const currentRadius = radius * zoomLevel;
    
    let camPos = new THREE.Vector3(
      center.x + Math.sin(angle) * currentRadius,
      center.y + targetSize.y * 0.2,
      center.z + Math.cos(angle) * currentRadius
    );
    
    const pointLights = lights.slice(0, 3).map((light, index) => {
      // Rim lights are placed behind the object relative to the camera
      // As t increases, one light moves to the front to reveal the product
      let lightPos: THREE.Vector3;
      let intensity = light.intensity;
      
      if (index === 0) {
        // This light moves from back to front
        const lAngle = angle + Math.PI * (1 - t);
        lightPos = new THREE.Vector3(
          center.x + Math.sin(lAngle) * radius * 1.2,
          center.y + targetSize.y * 0.5,
          center.z + Math.cos(lAngle) * radius * 1.2
        );
        intensity *= (0.2 + 0.8 * t); // Fades in as it moves to front
      } else {
        // Static rim lights
        const lAngle = angle + Math.PI * (0.8 + index * 0.2);
        lightPos = new THREE.Vector3(
          center.x + Math.sin(lAngle) * radius * 1.1,
          center.y + targetSize.y * 0.8,
          center.z + Math.cos(lAngle) * radius * 1.1
        );
        intensity *= 1.5;
      }

      return {
        id: light.id,
        position: lightPos,
        intensity: intensity,
        color: light.color,
        type: 'spot',
        lookAt: center
      };
    });

    return {
      camera: { position: camPos, lookAt: center },
      lights: pointLights,
      indirectLightIntensity: 0.2 + 0.12 * t
    };
  },

  'Macro Detail': (t, { center, targetSize, radius, lights, focalPoint }, params = {}) => {
    const zoomLevel = params.zoomLevel || 0.7;
    const speed = params.speed || 0.2;
    
    const target = focalPoint || center;
    const currentRadius = Math.max(targetSize.x, targetSize.z) * zoomLevel + 0.3;
    
    // Slow breathing motion around the detail
    const angle = Math.sin(t * Math.PI * 0.5) * 0.2;
    const height = target.y + Math.cos(t * Math.PI * 0.5) * targetSize.y * 0.1;
    
    let camPos = new THREE.Vector3(
      target.x + Math.sin(angle) * currentRadius,
      height,
      target.z + Math.cos(angle) * currentRadius
    );

    const pointLights = lights.slice(0, 3).map((light, index) => {
      const lAngle = t * Math.PI + (index * Math.PI / 2);
      let lightPos = new THREE.Vector3(
        target.x + Math.sin(lAngle) * radius * 0.8,
        target.y + targetSize.y * 0.5,
        target.z + Math.cos(lAngle) * radius * 0.8
      );

      return {
        id: light.id,
        position: lightPos,
        intensity: light.intensity * (0.8 + 0.4 * Math.sin(t * Math.PI * 4)),
        color: light.color,
        type: light.type
      };
    });

    return {
      camera: { position: camPos, lookAt: target },
      lights: pointLights,
      indirectLightIntensity: 0.4
    };
  },

  'Spotlight Sweep': (t, { center, targetSize, radius, lights, focalPoint }, params = {}) => {
    const zoomLevel = params.zoomLevel || 1.8;
    
    // Static camera, moving lights
    let camPos = new THREE.Vector3(center.x, center.y + targetSize.y * 0.3, center.z + radius * zoomLevel);
    let lookAtTarget = center.clone();
    if (focalPoint) lookAtTarget.lerp(focalPoint, 0.5);

    const pointLights = lights.slice(0, 3).map((light, index) => {
      // Lights sweep across the product like a searchlight
      const sweepX = center.x + radius * 2 * Math.sin(t * Math.PI - Math.PI/2 + index * 0.5);
      let lightPos = new THREE.Vector3(
        sweepX,
        center.y + targetSize.y * 1.2,
        center.z + radius * 0.5
      );

      return {
        id: light.id,
        position: lightPos,
        intensity: light.intensity * 2 * Math.exp(-Math.pow((t - 0.5 - (index-1)*0.2) * 4, 2)), // Gaussian pulse
        color: light.color,
        type: 'spot',
        lookAt: center
      };
    });

    return {
      camera: { position: camPos, lookAt: lookAtTarget },
      lights: pointLights,
      indirectLightIntensity: 0.2
    };
  }
};
