
"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { UpdateCityLightingOutput } from '@/ai/flows/update-city-lighting';

interface CityscapeCanvasProps {
  scrollProgress: number;
  activeProjectIndex: number;
  cameraPath: { position: [number, number, number]; target: [number, number, number] }[];
  projects: { position: [number, number, number] }[];
  journeyFinished: boolean;
  weatherData: UpdateCityLightingOutput | null;
}

const createBuilding = (scene: THREE.Group, position: THREE.Vector3, isProjectBuilding: boolean) => {
  const buildingGroup = new THREE.Group();
  buildingGroup.position.copy(position);
  scene.add(buildingGroup);

  if (isProjectBuilding) {
    const meshes: THREE.Mesh[] = [];

    // Main Structure
    const mainMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      roughness: 0.6,
      metalness: 0.3,
    });
    const mainGeom = new THREE.BoxGeometry(14, 60, 14);
    const mainBuilding = new THREE.Mesh(mainGeom, mainMaterial);
    mainBuilding.position.y = 30;
    buildingGroup.add(mainBuilding);

    // Glowing Core
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xBF00FF,
      emissive: 0xBF00FF,
      emissiveIntensity: 0,
    });
    const coreGeom = new THREE.CylinderGeometry(2, 2, 65, 16);
    const core = new THREE.Mesh(coreGeom, coreMaterial);
    core.position.y = 32.5;
    buildingGroup.add(core);
    meshes.push(core); // This will be the part that glows

    // Holographic Rings
    const ringGeom = new THREE.TorusGeometry(8, 0.2, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xBF00FF,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    const ring1 = new THREE.Mesh(ringGeom, ringMat);
    ring1.position.y = 20;
    ring1.rotation.x = Math.PI / 2;
    buildingGroup.add(ring1);
    
    const ring2 = ring1.clone();
    ring2.position.y = 40;
    ring2.scale.set(0.8, 0.8, 0.8);
    buildingGroup.add(ring2);

    buildingGroup.userData.rings = [ring1, ring2];

    return meshes;

  } else {
    // Background buildings
    const material = new THREE.MeshStandardMaterial({
      color: 0x1a1a2a,
      roughness: 0.8,
      metalness: 0.2,
    });

    const bodyHeight = Math.random() * 40 + 20;
    const bodyWidth = Math.random() * 6 + 4;
    const bodyDepth = Math.random() * 6 + 4;

    const bodyGeom = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth);
    const body = new THREE.Mesh(bodyGeom, material);
    body.position.y = bodyHeight / 2;
    buildingGroup.add(body);

    // Windows
    const windowGeom = new THREE.PlaneGeometry(0.8, 1.2);
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x222233,
      emissive: 0xffff00,
      emissiveIntensity: Math.random() > 0.3 ? 1 : 0,
    });

    for (let y = 5; y < bodyHeight - 5; y += 4) {
      for (let x = -bodyWidth / 2 + 1; x < bodyWidth / 2 - 1; x += 3) {
        if (Math.random() > 0.2) { // Add some randomness to window placement
            const windowMesh = new THREE.Mesh(windowGeom, windowMat);
            windowMesh.position.set(x, y - bodyHeight / 2 + (Math.random()-0.5), bodyDepth / 2 + 0.01);
            windowMesh.rotation.z = (Math.random() - 0.5) * 0.05;
            body.add(windowMesh);
        }
      }
    }
    return [body]; // Return array for consistency
  }
};

export function CityscapeCanvas({ scrollProgress, activeProjectIndex, cameraPath, projects, journeyFinished, weatherData }: CityscapeCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const projectBuildingGroupsRef = useRef<THREE.Group[]>([]);

  // Use refs for props to access latest values in animation loop
  const propsRef = useRef({ scrollProgress, activeProjectIndex, journeyFinished, weatherData });
  useEffect(() => {
    propsRef.current = { scrollProgress, activeProjectIndex, journeyFinished, weatherData };
  }, [scrollProgress, activeProjectIndex, journeyFinished, weatherData]);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x121212, 0.008);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(...cameraPath[0].position);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 25);
    scene.add(directionalLight);
    
    // Cityscape
    const cityGroup = new THREE.Group();
    projectBuildingGroupsRef.current = [];

    // Create project buildings
    projects.forEach(project => {
        const buildingContainerGroup = new THREE.Group();
        const meshes = createBuilding(buildingContainerGroup, new THREE.Vector3(...project.position), true);
        const buildingGroup = buildingContainerGroup.children[0] as THREE.Group;
        buildingGroup.userData.meshes = meshes; // Attach meshes to the inner group for animation
        cityGroup.add(buildingGroup); // Add the building group directly
        projectBuildingGroupsRef.current.push(buildingGroup);
    });

    // Create background buildings
    for (let i = 0; i < 300; i++) {
        const x = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 300;

        // Avoid placing them too close to project buildings
        const isTooClose = projects.some(p => {
            const dx = x - p.position[0];
            const dz = z - p.position[2];
            return Math.sqrt(dx*dx + dz*dz) < 20;
        });

        if (!isTooClose) {
            createBuilding(cityGroup, new THREE.Vector3(x, 0, z), false);
        }
    }
    
    scene.add(cityGroup);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(300, 300);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Handle resize
    const handleResize = () => {
      if (rendererRef.current && cameraRef.current && mountRef.current) {
        cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      
      const { scrollProgress, activeProjectIndex, journeyFinished, weatherData } = propsRef.current;
      const elapsedTime = clock.getElapsedTime();

      // Update camera
      const pathSegment = Math.min(Math.floor(scrollProgress * (cameraPath.length - 1)), cameraPath.length - 2);
      const segmentProgress = (scrollProgress * (cameraPath.length - 1)) - pathSegment;
      
      const startPos = new THREE.Vector3(...cameraPath[pathSegment].position);
      const endPos = new THREE.Vector3(...cameraPath[pathSegment + 1].position);
      cameraRef.current.position.lerpVectors(startPos, endPos, segmentProgress);
      
      const startTarget = new THREE.Vector3(...cameraPath[pathSegment].target);
      const endTarget = new THREE.Vector3(...cameraPath[pathSegment + 1].target);
      const currentTarget = new THREE.Vector3().lerpVectors(startTarget, endTarget, segmentProgress);
      cameraRef.current.lookAt(currentTarget);

      // Update building animations
      projectBuildingGroupsRef.current.forEach((buildingGroup, index) => {
        let shouldGlow = false;
        if (journeyFinished) {
          shouldGlow = true;
        } else if (index === activeProjectIndex) {
          shouldGlow = true;
        }
        
        const emissiveIntensity = shouldGlow ? Math.sin(elapsedTime * 3 + index) * 0.5 + 1.5 : 0;
        
        if (buildingGroup.userData.meshes) {
            buildingGroup.userData.meshes.forEach((mesh: THREE.Mesh) => {
                const material = mesh.material as THREE.MeshStandardMaterial;
                material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, emissiveIntensity, 0.1);
            });
        }
        
        if(buildingGroup.userData.rings) {
            buildingGroup.userData.rings[0].rotation.z = elapsedTime * 0.2;
            buildingGroup.userData.rings[1].rotation.z = -elapsedTime * 0.1;
        }
      });

      // Update weather
      if (weatherData?.updatedLightingConfig) {
        try {
          const config = JSON.parse(weatherData.updatedLightingConfig);
          ambientLight.color.set(config.ambientColor || 0x404040);
          ambientLight.intensity = config.ambientIntensity || 2;
          directionalLight.color.set(config.directionalColor || 0xffffff);
          directionalLight.intensity = config.directionalIntensity || 1;
        } catch (e) {
          // console.error("Failed to parse lighting config");
        }
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, [cameraPath, projects]);


  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
}
