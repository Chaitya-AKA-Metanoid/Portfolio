
"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { UpdateCityLightingOutput } from '@/ai/flows/update-city-lighting';

interface CityscapeCanvasProps {
  scrollProgress: number;
  activeProjectIndex: number;
  cameraPath: { position: [number, number, number]; target: [number, number, number] }[];
  projects: { buildingIndex: number }[];
  journeyFinished: boolean;
  weatherData: UpdateCityLightingOutput | null;
}

// Helper function to create a landmark building
const createLandmark = (
  scene: THREE.Group,
  position: THREE.Vector3,
  createGeometry: (group: THREE.Group) => THREE.Mesh[],
  scale = 1
) => {
  const landmarkGroup = new THREE.Group();
  const meshes = createGeometry(landmarkGroup);
  
  landmarkGroup.position.copy(position);
  landmarkGroup.scale.set(scale, scale, scale);
  scene.add(landmarkGroup);

  return meshes;
};

// --- Landmark Creation Functions ---

// Inspired by The Imperial towers
const createImperialTowers = (group: THREE.Group) => {
    const material = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.7, metalness: 0.3 });
    const tower1 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 60, 8), material);
    tower1.position.set(-3, 30, 0);

    const tower2 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 55, 8), material);
    tower2.position.set(3, 27.5, 0);

    group.add(tower1, tower2);
    return [tower1, tower2];
};

// Inspired by Antilia
const createAntilia = (group: THREE.Group) => {
    const material = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.6, metalness: 0.4 });
    const mainStructure = new THREE.Mesh(new THREE.BoxGeometry(10, 40, 10), material);
    mainStructure.position.y = 20;

    for (let i = 0; i < 8; i++) {
        const tierGeom = new THREE.BoxGeometry(10.5, 2, 10.5);
        const tier = new THREE.Mesh(tierGeom, new THREE.MeshStandardMaterial({ color: 0x34495e, roughness: 0.5 }));
        tier.position.y = 5 + i * 5;
        group.add(tier);
    }
    
    group.add(mainStructure);
    return [mainStructure];
};

// Inspired by the Taj Mahal Palace Hotel
const createTajHotel = (group: THREE.Group) => {
    const material = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.8 });
    const mainBuilding = new THREE.Mesh(new THREE.BoxGeometry(20, 15, 8), material);
    mainBuilding.position.y = 7.5;
    group.add(mainBuilding);

    const dome = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xc0392b }));
    dome.position.y = 15;
    group.add(dome);
    
    return [mainBuilding, dome];
};


export function CityscapeCanvas({ scrollProgress, activeProjectIndex, cameraPath, projects, journeyFinished, weatherData }: CityscapeCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const projectMeshesRef = useRef<THREE.Mesh[][]>([]);

  const originalColorsRef = useRef<Map<THREE.Mesh, THREE.Color>>(new Map());

  // Use refs for props to access latest values in animation loop without re-triggering useEffect
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
    projectMeshesRef.current = []; // Reset meshes

    // Place landmarks
    const landmarks = [
      { creator: createImperialTowers, position: new THREE.Vector3(-40, 0, -50), scale: 1.2 },
      { creator: createAntilia, position: new THREE.Vector3(50, 0, -20), scale: 1.1 },
      { creator: createTajHotel, position: new THREE.Vector3(0, 0, 15), scale: 1.5 },
    ];

    landmarks.forEach((landmark, index) => {
        const meshes = createLandmark(cityGroup, landmark.position, landmark.creator, landmark.scale);
        if (projects.some(p => p.buildingIndex === index)) {
            projectMeshesRef.current.push(meshes);
            meshes.forEach(mesh => {
                originalColorsRef.current.set(mesh, (mesh.material as THREE.MeshStandardMaterial).color.clone());
            });
        }
    });

    scene.add(cityGroup);

    // Background Buildings
    const bgBuildingMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.8, metalness: 0.2 });
    for (let i = 0; i < 300; i++) {
        const height = Math.random() * 40 + 10;
        const width = Math.random() * 4 + 2;
        const depth = Math.random() * 4 + 2;
        const geom = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(geom, bgBuildingMaterial);
        
        const x = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 300;

        // Avoid placing them too close to the center/landmarks
        if (Math.abs(x) < 50 && Math.abs(z) < 50) continue;

        building.position.set(x, height / 2, z);
        scene.add(building);
    }


    // Ground
    const groundGeometry = new THREE.PlaneGeometry(300, 300);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9, reflectivity: 0.1 });
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
      projectMeshesRef.current.forEach((meshGroup, index) => {
        let shouldGlow = false;
        if (journeyFinished) {
          shouldGlow = true;
        } else if (index === activeProjectIndex) {
          shouldGlow = true;
        }
        
        const emissiveIntensity = shouldGlow ? Math.sin(elapsedTime * 3 + index) * 0.25 + 0.75 : 0;
        
        meshGroup.forEach(mesh => {
            const material = mesh.material as THREE.MeshStandardMaterial;
            material.emissive.set(new THREE.Color(0xBF00FF));
            material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, emissiveIntensity, 0.1);
        });
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
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // Dispose geometries and materials if necessary
    };
  }, [cameraPath, projects]);


  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
}
