'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';

function WavingKid() {
  const fbx = useFBX('/models/jok-waving.fbx');
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    if (fbx.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(fbx);
      const action = mixer.clipAction(fbx.animations[0]);
      action.play();
      mixerRef.current = mixer;
    }
    fbx.scale.set(0.01, 0.01, 0.01);
    fbx.position.set(0, -1.4, 0);
    fbx.rotation.set(0, 0, 0);

    // Apply a warm material to all meshes
    fbx.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
        }
      }
    });
  }, [fbx]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  return <primitive object={fbx} />;
}

export default function JokScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.5], fov: 30 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[3, 4, 3]} intensity={1.5} />
      <directionalLight position={[-2, 2, -1]} intensity={0.5} />
      <WavingKid />
    </Canvas>
  );
}
