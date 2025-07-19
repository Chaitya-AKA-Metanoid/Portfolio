
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

export function CityscapeCanvas({ scrollProgress, activeProjectIndex, cameraPath, projects, journeyFinished, weatherData }: CityscapeCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const projectMeshesRef = useRef<THREE.Mesh[]>([]);
  const contactMeshesRef = useRef<THREE.Sprite[]>([]);

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
    scene.fog = new THREE.FogExp2(0x121212, 0.005);
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
    const citySize = 40;
    const buildingPadding = 1.5;
    let buildingIndexCounter = 0;
    
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.8, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x212131, roughness: 0.7, metalness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x151525, roughness: 0.9, metalness: 0.1 }),
      new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        roughness: 0.6,
        metalness: 0.4,
        emissive: 0xBF00FF,
        emissiveIntensity: 0.01
      }),
    ];

    for (let x = -citySize; x < citySize; x += 3) {
        for (let z = -citySize; z < citySize; z += 3) {
            if (Math.random() > 0.15) {
                const building = new THREE.Group();

                const height = Math.random() * 20 + 5;
                const width = Math.random() * 1.5 + 1;
                const depth = Math.random() * 1.5 + 1;
                
                const material = materials[Math.floor(Math.random() * materials.length)];
                
                // Main building structure
                const mainGeom = new THREE.BoxGeometry(width, height, depth);
                const mainBuilding = new THREE.Mesh(mainGeom, material);
                mainBuilding.position.y = height / 2;
                building.add(mainBuilding);

                // Add some detail
                if (Math.random() > 0.5) {
                    const topHeight = Math.random() * 5 + 2;
                    const topWidth = width * (Math.random() * 0.3 + 0.6);
                    const topDepth = depth * (Math.random() * 0.3 + 0.6);
                    const topGeom = new THREE.BoxGeometry(topWidth, topHeight, topDepth);
                    const topPart = new THREE.Mesh(topGeom, material);
                    topPart.position.y = height + topHeight / 2;
                    building.add(topPart);
                }

                building.position.set(x + (Math.random() - 0.5) * buildingPadding, 0, z + (Math.random() - 0.5) * buildingPadding);
                cityGroup.add(building);

                if (projects.some(p => p.buildingIndex === buildingIndexCounter)) {
                    building.scale.set(1.5, 1.8, 1.5);
                    const projectMesh = building.children[0] as THREE.Mesh;
                    projectMeshesRef.current.push(projectMesh);
                    originalColorsRef.current.set(projectMesh, (projectMesh.material as THREE.MeshStandardMaterial).color.clone());
                }
                buildingIndexCounter++;
            }
        }
    }
    scene.add(cityGroup);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.8 });
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
      projectMeshesRef.current.forEach((mesh, index) => {
        const originalColor = originalColorsRef.current.get(mesh);
        if (!originalColor) return;
        
        let shouldGlow = false;
        if (journeyFinished) {
          shouldGlow = true;
        } else if (index === activeProjectIndex) {
          shouldGlow = true;
        }

        const emissiveIntensity = shouldGlow ? Math.sin(elapsedTime * 3 + index) * 0.25 + 0.75 : 0;
        (mesh.material as THREE.MeshStandardMaterial).emissive.set(new THREE.Color(0xBF00FF));
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = THREE.MathUtils.lerp((mesh.material as THREE.MeshStandardMaterial).emissiveIntensity, emissiveIntensity, 0.1);
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
