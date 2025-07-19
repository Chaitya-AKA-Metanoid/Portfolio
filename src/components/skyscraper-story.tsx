
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
    title: 'Alpha Hunter',
    description: 'A cutting-edge financial forecasting model leveraging the Temporal Fusion Transformer (TFT) to predict asset returns and quantify the influence of economic indicators using historical stock data.',
    links: { github: 'https://github.com/Chaitya-shah8' },
    position: [-40, 0, -50],
  },
  {
    title: 'Enviro-Monitor',
    description: 'A cross-platform mobile application for community-driven environmental monitoring.',
    links: { github: 'https://github.com/Chaitya-shah8' },
    position: [0, 0, 15],
  },
];

const cameraPath = [
    { position: [0, 80, 100], target: [0, 20, 0] },     // 0. Start - Wide overview
    { position: [0, 50, 80], target: [0, 20, 0] },     // 1. Zoom in slightly for "Who Am I?"
    { position: [-20, 60, 0], target: projects[0].position }, // 2. Pan left towards P1
    { position: [-50, 30, -30], target: projects[0].position }, // 3. Zoom in on P1
    { position: [30, 40, 60], target: projects[1].position },   // 4. Arc towards P2
    { position: [10, 20, 45], target: projects[1].position },    // 5. Zoom in on P2
    { position: [0, 10, 60], target: [0, 10, 0] },      // 6. Settle for contact view
    { position: [0, 100, 120], target: [0, 30, 0] },    // 7. Final wide overview, pulled back
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
  const [showWhoAmI, setShowWhoAmI] = useState(false);
  
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

    setShowIntro(currentScroll < 0.05);

    const sections = projects.length + 3; // Intro, Who Am I, Projects, Contact
    const sectionHeight = 1 / sections;

    const whoAmIStart = sectionHeight;
    const whoAmIEnd = sectionHeight * 2;
    setShowWhoAmI(currentScroll > whoAmIStart * 0.5 && currentScroll < whoAmIEnd);
    
    const projectScrollStart = whoAmIEnd;
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
                <h1 className="text-6xl md:text-8xl font-headline font-bold animate-glow">Chaitya Shah</h1>
                <p className="mt-4 text-xl text-muted-foreground">An interactive journey through a futuristic cityscape.</p>
                <div className="mt-20 text-accent flex flex-col items-center animate-bounce">
                    <span className="text-sm">Scroll to begin</span>
                    <ArrowDown className="h-6 w-6" />
                </div>
             </div>
          </section>

          <section className="h-screen flex items-center justify-end snap-start">
            <div className="container mx-auto px-4 flex justify-end">
              <div className={cn(
                "w-full max-w-md p-6 rounded-lg border-2 bg-black/30 backdrop-blur-sm transition-all duration-500",
                showWhoAmI
                  ? 'opacity-100 translate-y-0 border-accent/50 shadow-[0_0_30px_-5px_hsl(var(--accent))]' 
                  : 'opacity-0 translate-y-5 border-transparent'
              )}>
                <h2 className="font-headline text-3xl font-bold text-accent mb-2">Who Am I?</h2>
                <div className="text-muted-foreground mb-6 space-y-4">
                    <p>
                        A CS grad with a builder’s mindset and a storyteller’s curiosity. I code, analyze, write, and constantly explore the “why” behind things. Whether it's backtesting a trading strategy or decoding everyday business behavior, I’m driven by the need to learn fast and build meaningfully.
                    </p>
                    <p>
                        This portfolio is a glimpse into the things I’ve created, questioned, and grown from.
                    </p>
                </div>
              </div>
            </div>
          </section>

          {projects.map((project, index) => (
             <section key={index} className="h-screen flex items-center justify-start snap-start">
               <div className="container mx-auto px-4">
                  <div className={cn(
                    "w-full max-w-md p-6 rounded-lg border-2 bg-black/30 backdrop-blur-sm transition-all duration-500",
                    activeProjectIndex === index 
                      ? 'opacity-100 translate-y-0 border-accent/50 shadow-[0_0_30px_-5px_hsl(var(--accent))]' 
                      : 'opacity-0 translate-y-5 border-transparent'
                  )}>
                    <h2 className="font-headline text-3xl font-bold text-accent mb-2">{project.title}</h2>
                    <p className="text-muted-foreground mb-6">{project.description}</p>
                    <div className="flex space-x-4">
                      <Button variant="ghost" className="text-muted-foreground hover:text-accent hover:bg-accent/10" size="sm" asChild><a href={project.links.github} target="_blank" rel="noopener noreferrer"><Github /> GitHub</a></Button>
                    </div>
                  </div>
               </div>
             </section>
          ))}

          <section className="h-screen flex items-center justify-center snap-start">
            <div className="text-center">
              <h2 className="text-4xl font-headline mb-4">Let's Connect</h2>
              <p className="text-muted-foreground mb-8">The journey's end is a new beginning.</p>
              <div className="flex justify-center space-x-8">
                 <a href="https://www.linkedin.com/in/chaitya-shah26" target="_blank" rel="noopener noreferrer" className="group">
                    <div className="p-4 rounded-full border-2 border-transparent group-hover:border-accent group-hover:bg-accent/10 transition-all">
                       <Linkedin className="h-10 w-10 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors">LinkedIn</p>
                 </a>
                 <a href="https://github.com/Chaitya-shah8" target="_blank" rel="noopener noreferrer" className="group">
                    <div className="p-4 rounded-full border-2 border-transparent group-hover:border-accent group-hover:bg-accent/10 transition-all">
                        <Github className="h-10 w-10 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors">GitHub</p>
                 </a>
                 <a href="mailto:shahchaitya8@gmail.com" className="group">
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
