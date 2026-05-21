import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import type { AvatarIntent } from '../../core/avatar/adapters';
import type { BlendshapeMap, HeadPose, PoseHandDebug } from '../../types/signals';
import { directBlendshapeToVrmExpressions, type VrmExpressionWeights } from '../../core/avatar/directBlendshapeToVrm';
import { applyAvatarRestPose, applyPoseHandToVrm, getAvatarBoneDiagnostics } from '../../core/avatar/directPoseHandToVrm';

type VRMPreviewProps = {
  modelUrl: string;
  framing: 'upper' | 'full';
  mirrorIntent?: AvatarIntent;
  empathicIntent?: AvatarIntent;
  directBlendshapes?: BlendshapeMap;
  poseHand?: PoseHandDebug;
  headPose?: HeadPose;
  variant?: 'research' | 'stage';
};

function applyCameraFraming(camera: THREE.PerspectiveCamera, framing: 'upper' | 'full', aspect: number) {
  const portrait = aspect < 0.82;
  if (framing === 'upper') {
    camera.fov = portrait ? 22 : 19;
    camera.position.set(0, portrait ? 1.45 : 1.42, portrait ? 2.75 : 2.45);
    camera.lookAt(0, portrait ? 1.46 : 1.48, 0);
  } else {
    camera.fov = portrait ? 31 : 25;
    camera.position.set(0, portrait ? 1.22 : 1.28, portrait ? 4.35 : 3.85);
    camera.lookAt(0, portrait ? 1.08 : 1.12, 0);
  }
  camera.updateProjectionMatrix();
}

function expressionForIntent(intent?: AvatarIntent): { name: string; value: number } {
  if (!intent) return { name: 'neutral', value: 0.4 };
  const value = Math.max(0, Math.min(1, intent.intensity));
  switch (intent.facialExpression) {
    case 'smile': return { name: 'happy', value };
    case 'surprise': return { name: 'surprised', value };
    case 'frustrated': return { name: 'angry', value };
    case 'concern':
    case 'uncertain': return { name: 'sad', value: value * 0.8 };
    case 'soften': return { name: 'relaxed', value: value * 0.8 };
    case 'focused': return { name: 'angry', value: value * 0.35 };
    default: return { name: 'neutral', value: 0.25 };
  }
}

export function VRMPreview({ modelUrl, framing, mirrorIntent, empathicIntent, directBlendshapes, poseHand, headPose, variant = 'research' }: VRMPreviewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const vrmRef = useRef<VRM | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const framingRef = useRef(framing);
  const intentsRef = useRef({ mirrorIntent, empathicIntent, directBlendshapes, poseHand, headPose });
  const expressionWeightsRef = useRef<VrmExpressionWeights>({});
  const [status, setStatus] = useState('loading VRM');
  const [boneStatus, setBoneStatus] = useState('bones: checking');

  useEffect(() => {
    intentsRef.current = { mirrorIntent, empathicIntent, directBlendshapes, poseHand, headPose };
  }, [mirrorIntent, empathicIntent, directBlendshapes, poseHand, headPose]);

  useEffect(() => {
    framingRef.current = framing;
    const camera = cameraRef.current;
    const mount = mountRef.current;
    if (!camera || !mount) return;
    const rect = mount.getBoundingClientRect();
    applyCameraFraming(camera, framing, Math.max(0.2, rect.width / Math.max(1, rect.height)));
  }, [framing]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 20);
    cameraRef.current = camera;
    applyCameraFraming(camera, framingRef.current, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(1.8, 2.6, 2.2);
    scene.add(key);
    const fill = new THREE.AmbientLight(0xfff4c2, 1.15);
    scene.add(fill);

    const clock = new THREE.Clock();
    let disposed = false;
    let raf = 0;

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      const width = Math.max(220, rect.width);
      const height = Math.max(260, rect.height || 320);
      camera.aspect = width / height;
      applyCameraFraming(camera, framingRef.current, camera.aspect);
      renderer.setSize(width, height, false);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    setStatus('loading VRM');
    setBoneStatus('bones: checking');
    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) return;
        const vrm = gltf.userData.vrm as VRM;
        VRMUtils.rotateVRM0(vrm);
        scene.add(vrm.scene);
        vrm.scene.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(vrm.scene);
        const center = box.getCenter(new THREE.Vector3());
        vrm.scene.position.x -= center.x;
        vrm.scene.position.z -= center.z;
        vrm.scene.position.y -= box.min.y;
        const rect = mount.getBoundingClientRect();
        applyCameraFraming(camera, framingRef.current, Math.max(0.2, rect.width / Math.max(1, rect.height)));
        vrmRef.current = vrm;
        const bones = getAvatarBoneDiagnostics(vrm);
        setBoneStatus(`bones: arms ${bones.armBones}/${bones.armBonesTotal} · fingers ${bones.fingerBones}/${bones.fingerBonesTotal}`);
        setStatus('VRM loaded');
      },
      (progress) => {
        if (progress.total) setStatus(`loading VRM ${Math.round((progress.loaded / progress.total) * 100)}%`);
      },
      (error) => {
        console.error(error);
        setStatus(`VRM load failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      },
    );

    const tick = () => {
      const delta = clock.getDelta();
      const vrm = vrmRef.current;
      if (vrm) {
        const hasLiveFace = Boolean(intentsRef.current.directBlendshapes);
        const direct = directBlendshapeToVrmExpressions(intentsRef.current.directBlendshapes);
        const targetWeights: VrmExpressionWeights = hasLiveFace ? direct : {};
        const current = expressionWeightsRef.current;
        const alpha = 0.28;
        const names = new Set([...Object.keys(current), ...Object.keys(targetWeights)]);
        vrm.expressionManager?.resetValues();
        for (const name of names) {
          const next = targetWeights[name as keyof VrmExpressionWeights] ?? 0;
          const prev = current[name as keyof VrmExpressionWeights] ?? 0;
          const value = prev + (next - prev) * alpha;
          current[name as keyof VrmExpressionWeights] = value;
          vrm.expressionManager?.setValue(name, value);
        }
        if (hasLiveFace || intentsRef.current.poseHand || intentsRef.current.headPose) {
          applyPoseHandToVrm(vrm, intentsRef.current.poseHand, intentsRef.current.headPose);
        } else {
          applyAvatarRestPose(vrm, 0.1);
        }
        vrm.update(delta);
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      vrmRef.current = null;
      cameraRef.current = null;
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [modelUrl]);

  return (
    <div className={`vrm-preview ${variant === 'stage' ? 'vrm-preview-stage' : ''}`}>
      <div ref={mountRef} className="vrm-canvas" />
      <div className="vrm-status">{status}</div>
    </div>
  );
}
