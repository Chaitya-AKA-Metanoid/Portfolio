
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
    title: 'DeFi Innovation',
    description: 'A cutting-edge platform for decentralized finance, leveraging blockchain technology for secure and transparent transactions.',
    links: { github: '#', website: '#' },
    position: [-40, 0, -50],
  },
  {
    title: 'E-commerce Analytics',
    description: 'A machine learning-powered analytics tool that provides real-time insights for e-commerce businesses.',
    links: { github: '#', website: '#' },
    position: [50, 0, -20],
  },
  {
    title: 'Enviro-Monitor',
    description: 'A cross-platform mobile application for community-driven environmental monitoring.',
    links: { github: '#', website: '#' },
    position: [0, 0, 15],
  },
];

const cameraPath = [
    { position: [0, 80, 100], target: [0, 20, 0] },     // 0. Start - Wide overview
    { position: [-60, 60, -40], target: projects[0].position }, // 1. Descend towards Project 1
    { position: [-55, 40, -30], target: projects[0].position }, // 2. Closer view of Project 1
    { position: [40, 50, 40], target: projects[1].position },    // 3. Pan towards Project 2
    { position: [65, 30, 0], target: projects[1].position },     // 4. Closer view of Project 2
    { position: [20, 40, 50], target: projects[2].position },     // 5. Move towards Project 3
    { position: [0, 20, 45], target: projects[2].position },      // 6. Closer view of Project 3
    { position: [0, 15, 60], target: [0, 10, 0] },      // 7. To Contact section
    { position: [0, 100, 120], target: [0, 30, 0] },    // 8. Final overview
];

const loadingMessages = [
    "Initializing experience...",
    "Building cityscape...",
    "Adjusting cosmic radiation shields...",
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
          <section className="h-screen flex items-center justify-center flex-col text-center snap-start">
             <div
              className={cn(
                "transition-opacity duration-1000",
                showIntro ? "opacity-100" : "opacity-0"
              )}
            >
                <h1 className="text-6xl md:text-8xl font-headline font-bold animate-glow">Skyscraper Story</h1>
                <p className="mt-4 text-xl text-muted-foreground">An interactive portfolio journey through a futuristic cityscape.</p>
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
