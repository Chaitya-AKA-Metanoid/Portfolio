
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { updateCityLighting, UpdateCityLightingOutput } from '@/ai/flows/update-city-lighting';
import { CityscapeCanvas } from '@/components/cityscape-canvas';
import { Loader } from '@/components/loader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Mail, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const projects = [
  {
    title: 'DeFi Innovation (The Imperial)',
    description: 'A cutting-edge platform for decentralized finance, leveraging blockchain technology for secure and transparent transactions, inspired by Mumbai\'s iconic twin towers.',
    links: { github: '#', website: '#' },
    buildingIndex: 0, // Corresponds to Imperial Towers
  },
  {
    title: 'E-commerce Analytics (Antilia)',
    description: 'A machine learning-powered analytics tool that provides real-time insights for e-commerce businesses, reflecting the modern architecture of Antilia.',
    links: { github: '#', website: '#' },
    buildingIndex: 1, // Corresponds to Antilia
  },
  {
    title: 'Enviro-Monitor (The Taj)',
    description: 'A cross-platform mobile application for community-driven environmental monitoring, paying homage to the heritage of the Taj Mahal Palace.',
    links: { github: '#', website: '#' },
    buildingIndex: 2, // Corresponds to Taj Hotel
  },
];

const cameraPath = [
  { position: [0, 80, 100], target: [0, 20, 0] },     // 0. Start - Wide overview of the city
  { position: [-60, 60, -40], target: [-40, 30, -50] }, // 1. Descend towards Imperial Towers
  { position: [-55, 40, -30], target: [-40, 30, -50] }, // 2. Closer view of Imperial Towers
  { position: [40, 50, 40], target: [50, 20, -20] },    // 3. Pan towards Antilia
  { position: [65, 30, 0], target: [50, 20, -20] },     // 4. Closer view of Antilia
  { position: [20, 40, 50], target: [0, 10, 15] },     // 5. Move towards Taj Hotel
  { position: [0, 20, 45], target: [0, 10, 15] },      // 6. Closer view of Taj Hotel
  { position: [0, 15, 60], target: [0, 10, 0] },      // 7. To Contact section, looking at the city center
  { position: [0, 100, 120], target: [0, 30, 0] },    // 8. Final overview, higher and further back
];


const loadingMessages = [
    "Initializing experience...",
    "Building cityscape of Mumbai...",
    "Checking weather in Mumbai...",
    "Finalizing visuals...",
];

export default function SkyscraperStory() {
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState(loadingMessages[0]);
  const [weatherData, setWeatherData] = useState<UpdateCityLightingOutput | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeProjectIndex, setActiveProjectIndex] = useState(-1);
  const [journeyFinished, setJourneyFinished] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let messageIndex = 0;
    const interval = setInterval(() => {
        messageIndex++;
        if (messageIndex < loadingMessages.length) {
            setLoadingText(loadingMessages[messageIndex]);
        }
    }, 1500);

    const weatherPromise = updateCityLighting({})
      .then(setWeatherData)
      .catch(() => {
        toast({
          title: "Weather API Error",
          description: "Could not fetch dynamic weather. Using default lighting.",
          variant: "destructive",
        });
      });

    Promise.all([weatherPromise, new Promise(resolve => setTimeout(resolve, loadingMessages.length * 1500))])
      .finally(() => {
        clearInterval(interval);
        setTimeout(() => setLoading(false), 500); // Short delay for smooth transition
      });
      
    return () => clearInterval(interval);
  }, [toast]);


  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const totalScrollableHeight = scrollHeight - clientHeight;
    const currentScroll = Math.min(Math.max(scrollTop / totalScrollableHeight, 0), 1);
    
    setScrollProgress(currentScroll);

    if(currentScroll > 0.05) {
      setShowIntro(false);
    } else {
      setShowIntro(true);
    }

    const sections = projects.length + 2; // Intro, Projects, Contact
    const sectionHeight = 1 / sections;
    
    // Determine which section is active based on scroll.
    // We give a bit of space at the top (for intro) and bottom (for contact)
    const projectScrollStart = sectionHeight;
    const projectScrollEnd = 1 - sectionHeight;
    const projectScrollArea = projectScrollEnd - projectScrollStart;
    const projectSectionHeight = projectScrollArea / projects.length;

    if (currentScroll > projectScrollStart && currentScroll < projectScrollEnd) {
      const active = Math.floor((currentScroll - projectScrollStart) / projectSectionHeight);
      setActiveProjectIndex(active);
    } else {
      setActiveProjectIndex(-1);
    }
    
    setJourneyFinished(currentScroll > 0.95);

  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const memoizedCanvas = useMemo(() => (
    <CityscapeCanvas
      scrollProgress={scrollProgress}
      activeProjectIndex={activeProjectIndex}
      cameraPath={cameraPath}
      projects={projects}
      journeyFinished={journeyFinished}
      weatherData={weatherData}
    />
  ), [scrollProgress, activeProjectIndex, journeyFinished, weatherData]);

  return (
    <>
      {loading && <Loader text={loadingText} />}
      <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-scroll overflow-x-hidden snap-y snap-mandatory">
        {memoizedCanvas}
        
        <div className="relative z-10 w-full">
          {/* Spacer divs define scroll sections */}
          <section className="h-screen flex items-center justify-center flex-col text-center snap-start">
             <div
              className={cn(
                "transition-opacity duration-1000",
                showIntro ? "opacity-100" : "opacity-0"
              )}
            >
                <h1 className="text-6xl md:text-8xl font-headline font-bold animate-glow">Skyscraper Story</h1>
                <p className="mt-4 text-xl text-muted-foreground">An interactive portfolio journey through Mumbai.</p>
                <div className="mt-20 text-accent flex flex-col items-center animate-bounce">
                    <span className="text-sm">Scroll to begin</span>
                    <ArrowDown className="h-6 w-6" />
                </div>
             </div>
          </section>

          {projects.map((project, index) => (
             <section key={index} className="h-screen flex items-center justify-start snap-start">
               <div className="container mx-auto px-4">
                  <Card className={cn(
                    "w-full max-w-md bg-card/70 backdrop-blur-md border-accent/20 shadow-2xl shadow-accent/10 transition-all duration-500",
                    activeProjectIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                  )}>
                    <CardHeader>
                      <CardTitle className="font-headline text-3xl text-accent">{project.title}</CardTitle>
                      <CardDescription>{weatherData?.condition || 'A metropolis of innovation'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-6">{project.description}</p>
                      <div className="flex space-x-4">
                        <Button variant="outline" size="sm" asChild><a href={project.links.github} target="_blank" rel="noopener noreferrer"><Github /> GitHub</a></Button>
                        <Button variant="outline" size="sm" asChild><a href={project.links.website} target="_blank" rel="noopener noreferrer">Website</a></Button>
                      </div>
                    </CardContent>
                  </Card>
               </div>
             </section>
          ))}

          <section className="h-screen flex items-center justify-center snap-start">
            <div className="text-center">
              <h2 className="text-4xl font-headline mb-4">Let's Connect</h2>
              <p className="text-muted-foreground mb-8">The journey's end is a new beginning.</p>
              <div className="flex justify-center space-x-8">
                 <a href="#" className="group">
                    <div className="p-4 rounded-full border-2 border-transparent group-hover:border-accent group-hover:bg-accent/10 transition-all">
                       <Linkedin className="h-10 w-10 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors">LinkedIn</p>
                 </a>
                 <a href="#" className="group">
                    <div className="p-4 rounded-full border-2 border-transparent group-hover:border-accent group-hover:bg-accent/10 transition-all">
                        <Github className="h-10 w-10 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors">GitHub</p>
                 </a>
                 <a href="#" className="group">
                    <div className="p-4 rounded-full border-2 border-transparent group-hover:border-accent group-hover:bg-accent/10 transition-all">
                        <Mail className="h-10 w-10 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors">Email</p>
                 </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
