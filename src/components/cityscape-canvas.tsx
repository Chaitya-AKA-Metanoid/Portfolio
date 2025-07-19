
"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CityscapeCanvasProps {
  scrollProgress: number;
  activeProjectIndex: number;
  cameraPath: { position: [number, number, number]; target: [number, number, number] }[];
  projects: { position: [number, number, number] }[];
  journeyFinished: boolean;
}

const createBuilding = (scene: THREE.Group, position: THREE.Vector3, isProjectBuilding: boolean) => {
  const buildingGroup = new THREE.Group();
  buildingGroup.position.copy(position);
  scene.add(buildingGroup);

  if (isProjectBuilding) {
    const meshes: THREE.Mesh[] = [];
    const material = new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        roughness: 0.6,
        metalness: 0.3,
    });
    const geom = new THREE.BoxGeometry(14, 60, 14);
    const mainBuilding = new THREE.Mesh(geom, material);
    mainBuilding.position.y = 30;
    buildingGroup.add(mainBuilding);

    const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0xBF00FF,
        emissive: 0xBF00FF,
        emissiveIntensity: 0,
    });
    
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(10, 0.15, 8, 32), ringMaterial);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 15;
    buildingGroup.add(ring1);
    
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(10, 0.15, 8, 32), ringMaterial);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 30;
    buildingGroup.add(ring2);

    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(10, 0.15, 8, 32), ringMaterial);
    ring3.rotation.x = Math.PI / 2;
    ring3.position.y = 45;
    buildingGroup.add(ring3);

    buildingGroup.userData.rings = [ring1, ring2, ring3];
    meshes.push(ring1, ring2, ring3);

    return meshes;

  } else {
    // Background buildings
    const material = new THREE.MeshStandardMaterial({
      color: 0x1a1a2a,
      roughness: 0.8,
      metalness: 0.2,
    });
     const windowMat = new THREE.MeshStandardMaterial({
      color: 0x222233,
      emissive: 0xffff00,
      emissiveIntensity: 0, 
    });

    const addWindows = (buildingMesh: THREE.Mesh) => {
        const geom = buildingMesh.geometry as THREE.BoxGeometry;
        const { width, height, depth } = geom.parameters;
        const windowGeom = new THREE.PlaneGeometry(0.8, 1.2);
        
        const emIntensity = Math.random() > 0.1 ? 1 : 0;
        const mat = windowMat.clone();
        mat.emissiveIntensity = emIntensity;

        for (let y = 2; y < height - 2; y += 4) {
            for (let x = -width / 2 + 1; x < width / 2 - 1; x += 3) {
                 if (Math.random() > 0.25) { 
                    const windowMesh = new THREE.Mesh(windowGeom, mat);
                    windowMesh.position.set(x, y - height / 2, depth / 2 + 0.01);
                    buildingMesh.add(windowMesh);
                }
            }
        }
    }


    const baseHeight = Math.random() * 60 + 20;
    const type = Math.random();

    if (type < 0.2) { // Cylindrical building
        const radius = Math.random() * 4 + 4;
        const height = Math.random() * 100 + 40;
        const baseGeom = new THREE.CylinderGeometry(radius, radius, height, 16);
        const base = new THREE.Mesh(baseGeom, material);
        base.position.y = height / 2;
        buildingGroup.add(base);

        // Add lots of glowing rings
        const ringCount = Math.floor(Math.random() * 4) + 2; // 2 to 5 rings
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xBF00FF,
            emissive: 0xBF00FF,
            emissiveIntensity: 1.5,
        });
        const ringGeom = new THREE.TorusGeometry(radius + 0.5, 0.2, 8, 32);

        for (let i = 0; i < ringCount; i++) {
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = Math.random() * (height - 20) + 10;
            buildingGroup.add(ring);
        }

        return [base];
    } else { // Rectangular building variations
        const baseWidth = Math.random() * 8 + 8;
        const baseDepth = Math.random() * 8 + 8;
        
        const baseGeom = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
        const base = new THREE.Mesh(baseGeom, material);
        base.position.y = baseHeight / 2;
        addWindows(base);
        buildingGroup.add(base);

        const buildType = Math.random();

        if (buildType < 0.4) { // Tapered building
            const midHeight = Math.random() * 30 + 10;
            const midWidth = baseWidth * (Math.random() * 0.3 + 0.5);
            const midDepth = baseDepth * (Math.random() * 0.3 + 0.5);

            const midGeom = new THREE.BoxGeometry(midWidth, midHeight, midDepth);
            const mid = new THREE.Mesh(midGeom, material);
            mid.position.y = baseHeight + midHeight / 2;
            addWindows(mid);
            buildingGroup.add(mid);

            if (Math.random() < 0.5) { // Potential third tier
                const topHeight = Math.random() * 20 + 5;
                const topWidth = midWidth * (Math.random() * 0.2 + 0.6);
                const topDepth = midDepth * (Math.random() * 0.2 + 0.6);
                
                const topGeom = new THREE.BoxGeometry(topWidth, topHeight, topDepth);
                const top = new THREE.Mesh(topGeom, material);
                top.position.y = baseHeight + midHeight + topHeight / 2;
                addWindows(top);
                buildingGroup.add(top);
            }

        } else if (buildType < 0.7) { // Spire/Antenna
            const antennaHeight = Math.random() * 40 + 20;
            const antennaGeom = new THREE.CylinderGeometry(0.5, 1, antennaHeight, 6);
            const antenna = new THREE.Mesh(antennaGeom, material);
            antenna.position.y = baseHeight + antennaHeight/2;
            buildingGroup.add(antenna);
            
            if (Math.random() > 0.5) {
                const light = new THREE.PointLight(0xff0000, 20, 30);
                light.position.y = baseHeight + antennaHeight;
                buildingGroup.add(light);
            }
        }
        
        // Original simple block buildings will be the "else" case
        return [base];
    }
  }
};

export function CityscapeCanvas({ scrollProgress, activeProjectIndex, cameraPath, projects, journeyFinished }: CityscapeCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const projectBuildingGroupsRef = useRef<THREE.Group[]>([]);
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Use refs for props to access latest values in animation loop
  const propsRef = useRef({ scrollProgress, activeProjectIndex, journeyFinished });
  useEffect(() => {
    propsRef.current = { scrollProgress, activeProjectIndex, journeyFinished };
  }, [scrollProgress, activeProjectIndex, journeyFinished]);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // --- Mouse tracking ---
    const handleMouseMove = (event: MouseEvent) => {
        if (mountRef.current) {
            const rect = mountRef.current.getBoundingClientRect();
            mousePosRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mousePosRef.current.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
        }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x121212, 0.0035); // Adjusted fog density
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 2000); // Increased far plane
    camera.position.set(...cameraPath[0].position);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x4B0082, 2.0); // Increased intensity
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Increased intensity
    directionalLight.position.set(50, 50, 25);
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xBF00FF, 40, 400, 2); // Increased intensity
    pointLight1.position.set(-50, 20, -40);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xFFD700, 30, 400, 2); // Increased intensity
    pointLight2.position.set(60, 25, 30);
    scene.add(pointLight2);
    
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
    const citySize = 800; // Increased city size
    for (let i = 0; i < 500; i++) {
        const x = (Math.random() - 0.5) * citySize;
        const z = (Math.random() - 0.5) * citySize;

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
    const groundGeometry = new THREE.PlaneGeometry(citySize, citySize);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Handle resize
    const handleResize = () => {
      if (rendererRef.current && cameraRef.current && mountRef.current) {
        cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        
        // Adjust FoV for wider screens to prevent feeling too empty
        if (cameraRef.current.aspect > 1.8) {
             cameraRef.current.fov = 80; // Wider FOV for wide screens
        } else {
             cameraRef.current.fov = 75;
        }
        
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once initially

    // Animation loop
    const clock = new THREE.Clock();
    let finalTarget = new THREE.Vector3();
    const animate = () => {
      requestAnimationFrame(animate);
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      
      const { scrollProgress, activeProjectIndex, journeyFinished } = propsRef.current;
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
      
      // Add mouse look
      const lookAtOffset = new THREE.Vector3(mousePosRef.current.x * 5, mousePosRef.current.y * 5, 0);
      const targetWithMouse = currentTarget.clone().add(lookAtOffset);
      
      // Smoothly interpolate the final target
      finalTarget.lerp(targetWithMouse, 0.1);

      cameraRef.current.lookAt(finalTarget);

      // Update building animations
      projectBuildingGroupsRef.current.forEach((buildingGroup, index) => {
        if(buildingGroup.userData.rings) {
            buildingGroup.userData.rings[0].rotation.z = elapsedTime * 0.5;
            buildingGroup.userData.rings[1].rotation.z = -elapsedTime * 0.3;
            buildingGroup.userData.rings[2].rotation.z = elapsedTime * 0.2;
        }

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
      });

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, [cameraPath, projects]);


  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
}
