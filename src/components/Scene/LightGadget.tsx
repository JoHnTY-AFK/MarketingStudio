import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { PivotControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppContext } from '../../context/AppContext';

export default function LightGadget({
  id,
  type,
  intensity,
  color,
  pointSize,
  spotAngle,
  width = 2,
  height = 2,
  position,
  visible,
  triggerLookAtOrigin,
  initialPosition = [5, 5, 5]
}: {
  id: string;
  type: 'directional' | 'point' | 'spot' | 'rectArea';
  intensity: number;
  color: string;
  pointSize: number;
  spotAngle: number;
  width?: number;
  height?: number;
  position?: [number, number, number];
  visible: boolean;
  triggerLookAtOrigin?: number;
  initialPosition?: [number, number, number];
}) {
  const { isRecordingVideo, isPlayingPath } = useAppContext();
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const rectAreaLightRef = useRef<THREE.RectAreaLight>(null);
  const pivotRef = useRef<THREE.Group>(null);
  const lightGroupRef = useRef<THREE.Group>(null);
  const spotTarget = useMemo(() => new THREE.Object3D(), []);
  
  const [pivotMatrix, setPivotMatrix] = React.useState(() => new THREE.Matrix4().setPosition(...initialPosition));

  useEffect(() => {
    if (position) {
      const newMatrix = new THREE.Matrix4().setPosition(...position);
      setPivotMatrix(newMatrix);
    }
  }, [position]);

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
    if (pivotRef.current && triggerLookAtOrigin && triggerLookAtOrigin > 0) {
      pivotRef.current.lookAt(0, 0, 0);
    }
  }, [triggerLookAtOrigin]);

  useFrame(() => {
    if (pivotRef.current && lightGroupRef.current) {
      pivotRef.current.updateWorldMatrix(true, false);
      pivotRef.current.getWorldPosition(lightGroupRef.current.position);
      pivotRef.current.getWorldQuaternion(lightGroupRef.current.quaternion);
    }

    if (lightGroupRef.current) {
      const worldPos = new THREE.Vector3();
      lightGroupRef.current.getWorldPosition(worldPos);

      if (type === 'directional' && directionalLightRef.current) {
        directionalLightRef.current.position.copy(worldPos);
        directionalLightRef.current.quaternion.copy(lightGroupRef.current.getWorldQuaternion(new THREE.Quaternion()));
        directionalLightRef.current.intensity = intensity;
        directionalLightRef.current.color.set(color); 
      } else if (type === 'point' && pointLightRef.current) {
        pointLightRef.current.position.copy(worldPos);
        pointLightRef.current.intensity = intensity * 10;
        pointLightRef.current.color.set(color);
      } else if (type === 'spot' && spotLightRef.current) {
        spotLightRef.current.position.copy(worldPos);
        spotLightRef.current.quaternion.copy(lightGroupRef.current.getWorldQuaternion(new THREE.Quaternion()));
        spotLightRef.current.intensity = intensity * 10;
        spotLightRef.current.color.set(color); 
        spotLightRef.current.angle = (spotAngle * Math.PI) / 180;
      } else if (type === 'rectArea' && rectAreaLightRef.current) {
        rectAreaLightRef.current.position.copy(worldPos);
        // RectAreaLight emits in +Z, but our gadgets point in -Z
        const quat = lightGroupRef.current.getWorldQuaternion(new THREE.Quaternion());
        const rotate180 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
        quat.multiply(rotate180);
        
        rectAreaLightRef.current.quaternion.copy(quat);
        rectAreaLightRef.current.intensity = intensity * 10;
        rectAreaLightRef.current.color.set(color);
      }
    }
  });

  return (
    <>
      <PivotControls 
        matrix={pivotMatrix}
        scale={0.75} 
        depthTest={false} 
        visible={visible && !isRecordingVideo && !isPlayingPath}
        disableAxes={!visible || isRecordingVideo || isPlayingPath}
        disableSliders={!visible || isRecordingVideo || isPlayingPath}
        disableRotations={!visible || isRecordingVideo || isPlayingPath || type === 'point'}
      >
        <group ref={pivotRef} name={`light-pivot-${id}`} />
      </PivotControls>
      
      <group ref={lightGroupRef} name="light-gadget-meshes" visible={!isRecordingVideo}>
          {type === 'directional' && (
            <>
              <mesh rotation={[Math.PI / 2, 0, 0]} visible={visible} castShadow={false} receiveShadow={false}>
                <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} metalness={0.1} />
              </mesh>
              <mesh position={[0, 0, -0.11]} rotation={[Math.PI / 2, 0, 0]} visible={visible} castShadow={false} receiveShadow={false}>
                <cylinderGeometry args={[0.25, 0.25, 0.01, 16]} />
                <meshBasicMaterial color={color} />
              </mesh>
              <mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]} visible={visible} castShadow={false} receiveShadow={false}>
                <cylinderGeometry args={[0.02, 0.02, 0.4]} />
                <meshBasicMaterial color={color} />
              </mesh>
            </>
          )}
          {type === 'point' && (
            <group>
              <mesh visible={visible} castShadow={false} receiveShadow={false}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} metalness={0.1} />
              </mesh>
              <mesh visible={visible} castShadow={false} receiveShadow={false}>
                <sphereGeometry args={[0.32, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.4} />
              </mesh>
            </group>
          )}
          {type === 'spot' && (
            <>
              <mesh rotation={[-Math.PI / 2, 0, 0]} visible={visible} castShadow={false} receiveShadow={false}>
                <cylinderGeometry args={[0.1, 0.3, 0.4, 16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} metalness={0.1} />
              </mesh>
              <mesh position={[0, 0, 0.2]} rotation={[-Math.PI / 2, 0, 0]} visible={visible} castShadow={false} receiveShadow={false}>
                <cylinderGeometry args={[0.28, 0.28, 0.01, 16]} />
                <meshBasicMaterial color={color} />
              </mesh>
              <mesh position={[0, 0, 1.21]} rotation={[-Math.PI / 2, 0, 0]} visible={visible} castShadow={false} receiveShadow={false}>
                <coneGeometry args={[Math.tan((spotAngle * Math.PI) / 180) * 2, 2, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} />
              </mesh>
            </>
          )}
          {type === 'rectArea' && (
            <>
              <mesh position={[0, 0, -0.1]} visible={visible} castShadow={false} receiveShadow={false}>
                <boxGeometry args={[width, height, 0.1]} />
                <meshStandardMaterial color="#222222" roughness={0.8} metalness={0.2} />
              </mesh>
              <mesh position={[0, 0, 0]} rotation={[0, 0, 0]} visible={visible} castShadow={false} receiveShadow={false}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial color={color} />
              </mesh>
            </>
          )}
        </group>
      
      {type === 'directional' && (
        <directionalLight
          ref={directionalLightRef}
          intensity={intensity}
          color={color}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-radius={1}
          shadow-bias={-0.0001}
        >
          <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 0.1, 50]} />
        </directionalLight>
      )}
      
      {type === 'point' && (
        <pointLight
          ref={pointLightRef}
          intensity={intensity * 10}
          color={color}
          distance={0}
          decay={2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        />
      )}
      
      {type === 'spot' && (
        <>
          <primitive object={spotTarget} />
          <spotLight
            ref={spotLightRef}
            intensity={intensity * 10}
            color={color}
            angle={(spotAngle * Math.PI) / 180}
            penumbra={0.5}
            distance={0}
            decay={2}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
            target={spotTarget}
          />
        </>
      )}

      {type === 'rectArea' && (
        <rectAreaLight
          ref={rectAreaLightRef}
          intensity={intensity * 10}
          color={color}
          width={width || 2}
          height={height || 2}
        />
      )}
    </>
  );
}
