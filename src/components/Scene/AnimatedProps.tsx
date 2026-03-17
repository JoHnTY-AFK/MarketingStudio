import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppContext } from '../../context/AppContext';

function Particles({ onComplete, params }: { onComplete: () => void, params?: any }) {
  const count = params?.density || 100;
  const color = params?.color || '#ffffff';
  const size = params?.size || 0.05;
  const speedMult = params?.speed || 1;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 10,
      y: (Math.random() - 0.5) * 10,
      z: (Math.random() - 0.5) * 10,
      speed: (Math.random() * 0.02 + 0.01) * speedMult,
    }));
  }, [count, speedMult]);

  const startTime = useRef(Date.now());

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed > 4 / speedMult) {
      onComplete();
      return;
    }

    if (meshRef.current) {
      particles.forEach((particle, i) => {
        dummy.position.set(
          particle.x,
          particle.y + elapsed * particle.speed * 50,
          particle.z
        );
        dummy.scale.setScalar(Math.max(0, 1 - elapsed / (4 / speedMult)));
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </instancedMesh>
  );
}

function EnergyRings({ onComplete, params }: { onComplete: () => void, params?: any }) {
  const color = params?.color || '#60a5fa';
  const size = params?.size || 1;
  const speedMult = params?.speed || 1;
  const ringsRef = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed > 3 / speedMult) {
      onComplete();
      return;
    }

    if (ringsRef.current) {
      ringsRef.current.children.forEach((child, i) => {
        const delay = i * 0.5 / speedMult;
        const localElapsed = Math.max(0, elapsed - delay);
        const scale = (1 + localElapsed * 3 * speedMult) * size;
        child.scale.setScalar(scale);
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = Math.max(0, 1 - localElapsed * speedMult);
      });
    }
  });

  return (
    <group ref={ringsRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <torusGeometry args={[1, 0.02, 16, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

function LightSweep({ onComplete, params }: { onComplete: () => void, params?: any }) {
  const color = params?.color || '#ffffff';
  const size = params?.size || 1;
  const speedMult = params?.speed || 1;
  const planeRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Date.now());

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed > 3 / speedMult) {
      onComplete();
      return;
    }

    if (planeRef.current) {
      planeRef.current.position.x = -5 + elapsed * 3.33 * speedMult;
      (planeRef.current.material as THREE.MeshBasicMaterial).opacity = Math.sin((elapsed * speedMult / 3) * Math.PI) * 0.5;
    }
  });

  return (
    <mesh ref={planeRef} position={[-5, 0, -2]} rotation={[0, 0, 0]} scale={[size, size, size]}>
      <planeGeometry args={[1, 10]} />
      <meshBasicMaterial color={color} transparent opacity={0} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function Confetti({ onComplete, params }: { onComplete: () => void, params?: any }) {
  const count = params?.density || 150;
  const size = params?.size || 0.1;
  const speedMult = params?.speed || 1;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 10,
      y: 5 + Math.random() * 5,
      z: (Math.random() - 0.5) * 10,
      rx: Math.random() * Math.PI,
      ry: Math.random() * Math.PI,
      rz: Math.random() * Math.PI,
      speed: (Math.random() * 0.05 + 0.02) * speedMult,
      color: new THREE.Color().setHSL(Math.random(), 1, 0.5)
    }));
  }, [count, speedMult]);

  const startTime = useRef(Date.now());

  useEffect(() => {
    if (meshRef.current) {
      particles.forEach((p, i) => {
        meshRef.current!.setColorAt(i, p.color);
      });
      meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [particles]);

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed > 5 / speedMult) {
      onComplete();
      return;
    }

    if (meshRef.current) {
      particles.forEach((p, i) => {
        dummy.position.set(p.x, p.y - elapsed * p.speed * 50, p.z);
        dummy.rotation.set(
          p.rx + elapsed * 2 * speedMult,
          p.ry + elapsed * 2 * speedMult,
          p.rz + elapsed * 2 * speedMult
        );
        dummy.scale.setScalar(Math.max(0, 1 - elapsed / (5 / speedMult)));
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

function Pedestal({ onComplete, params }: { onComplete: () => void, params?: any }) {
  const color = params?.color || '#333333';
  const size = params?.size || 1;
  const speedMult = params?.speed || 1;
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed > 4 / speedMult) {
      onComplete();
      return;
    }

    if (groupRef.current) {
      let scaleY = 1;
      if (elapsed * speedMult < 0.5) {
        scaleY = elapsed * speedMult * 2;
      } else if (elapsed * speedMult > 3.5) {
        scaleY = (4 - elapsed * speedMult) * 2;
      }
      groupRef.current.scale.set(size, scaleY * size, size);
      groupRef.current.rotation.y = elapsed * speedMult * Math.PI;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[2, 2, 0.2, 32]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.8, 1.8, 0.05, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.9} />
      </mesh>
    </group>
  );
}

function AbstractWave({ onComplete, params }: { onComplete: () => void, params?: any }) {
  const color = params?.color || '#818cf8';
  const size = params?.size || 1;
  const speedMult = params?.speed || 1;
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Date.now());

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed > 5 / speedMult) {
      onComplete();
      return;
    }

    if (meshRef.current) {
      const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
      const positionAttribute = geometry.attributes.position;
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = Math.sin(x * 2 + elapsed * 3 * speedMult) * 0.5 + Math.cos(y * 2 + elapsed * 2 * speedMult) * 0.5;
        positionAttribute.setZ(i, z);
      }
      positionAttribute.needsUpdate = true;
      
      let opacity = 1;
      if (elapsed * speedMult < 1) opacity = elapsed * speedMult;
      if (elapsed * speedMult > 4) opacity = 5 - elapsed * speedMult;
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -3]} rotation={[-Math.PI / 4, 0, 0]} scale={[size, size, size]}>
      <planeGeometry args={[20, 20, 32, 32]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0} />
    </mesh>
  );
}

export default function AnimatedProps() {
  const { activeProp, clearProp } = useAppContext();

  if (!activeProp) return null;

  return (
    <group key={activeProp.id}>
      {activeProp.type === 'particles' && <Particles onComplete={clearProp} params={activeProp.params} />}
      {activeProp.type === 'energyRings' && <EnergyRings onComplete={clearProp} params={activeProp.params} />}
      {activeProp.type === 'lightSweep' && <LightSweep onComplete={clearProp} params={activeProp.params} />}
      {activeProp.type === 'confetti' && <Confetti onComplete={clearProp} params={activeProp.params} />}
      {activeProp.type === 'pedestal' && <Pedestal onComplete={clearProp} params={activeProp.params} />}
      {activeProp.type === 'abstractWave' && <AbstractWave onComplete={clearProp} params={activeProp.params} />}
    </group>
  );
}
