
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CityscapeCanvas } from '@/components/cityscape-canvas';
import { Loader } from '@/components/loader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Mail, ArrowDown, FileText } from 'lucide-react';
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
    title: 'Fruit Quality Classifier using Machine Learning and IOT',
    description: 'A machine learning-based classification system that detects fruit quality from images using classical computer vision and feature-based modeling.',
    links: { github: 'https://github.com/Chaitya-shah8/Fruit-Quality' },
    position: [0, 0, 15],
  },
];

const skills = {
    position: [40, 0, -50]
};

const cameraPath = [
    { position: [0, 80, 100], target: [0, 20, 0] },      // 0. Start - Wide overview
    { position: [0, 50, 80], target: [0, 20, 0] },      // 1. Zoom in slightly for "Who Am I?"
    { position: [20, 40, -30], target: skills.position }, // 2. Pan right towards Skills
    { position: [50, 25, -35], target: skills.position },   // 3. Zoom in on Skills
    { position: [-20, 60, 0], target: projects[0].position },  // 4. Pan left towards P1
    { position: [-50, 30, -30], target: projects[0].position }, // 5. Zoom in on P1
    { position: [30, 40, 60], target: projects[1].position },    // 6. Arc towards P2
    { position: [10, 20, 45], target: projects[1].position },     // 7. Zoom in on P2
    { position: [0, 10, 60], target: [0, 10, 0] },       // 8. Settle for contact view
    { position: [0, 100, 120], target: [0, 30, 0] },     // 9. Final wide overview, pulled back
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeProjectIndex, setActiveProjectIndex] = useState(-1);
  const [journeyFinished, setJourneyFinished] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showWhoAmI, setShowWhoAmI] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  
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

    const timer = setTimeout(() => {
      clearInterval(interval);
      setLoading(false);
    }, loadingMessages.length * 1500);
      
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    }
  }, []);


  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const totalScrollableHeight = scrollHeight - clientHeight;
    const currentScroll = Math.min(Math.max(scrollTop / totalScrollableHeight, 0), 1);
    
    setScrollProgress(currentScroll);

    setShowIntro(currentScroll < 0.05);

    const sections = projects.length + 4; // Intro, Who Am I, Skills, Projects, Contact
    const sectionHeight = 1 / sections;

    const whoAmIStart = sectionHeight;
    const whoAmIEnd = sectionHeight * 2;
    setShowWhoAmI(currentScroll > whoAmIStart * 0.5 && currentScroll < whoAmIEnd + sectionHeight * 0.5);

    const skillsStart = whoAmIEnd;
    const skillsEnd = sectionHeight * 3;
    setShowSkills(currentScroll > skillsStart * 0.5 && currentScroll < skillsEnd + sectionHeight * 0.5);
    
    const projectScrollStart = skillsEnd;
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
    />
  ), [scrollProgress, activeProjectIndex, journeyFinished]);

  const ContentWrapper = ({ children, alignment = 'center' }: { children: React.ReactNode, alignment?: 'start' | 'end' | 'center' }) => {
    const alignmentClass = {
        start: 'items-center lg:items-start',
        end: 'items-center lg:items-end',
        center: 'items-center justify-center'
    }[alignment];
    return (
        <section className={`h-screen flex flex-col snap-start container mx-auto px-4 ${alignmentClass}`}>
            <div className="w-full max-w-md pt-20 pb-20 flex flex-col justify-center">
                {children}
            </div>
        </section>
    );
  };

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

          <ContentWrapper alignment="end">
              <div className={cn(
                "p-6 rounded-lg bg-black/40 backdrop-blur-md transition-all duration-500 border border-transparent",
                showWhoAmI
                  ? 'opacity-100 translate-y-0 border-accent/30 shadow-[0_0_40px_-10px_hsl(var(--accent))]' 
                  : 'opacity-0 translate-y-5'
              )}>
                <h2 className="font-headline text-3xl font-bold text-accent mb-2">Who Am I?</h2>
                <div className="text-muted-foreground mb-6 space-y-4">
                    <p>
                        I'm a CS grad with a builder’s mindset and a storyteller’s curiosity. I thrive on diving deep, whether it's backtesting a trading strategy, decoding business behavior, or bringing a creative project to life.
                    </p>
                    <p>
                        My passion lies at the intersection of technology and creative problem-solving. I'm driven by the need to learn fast, build meaningfully, and understand the "why" behind things. 
                    </p>
                    <p>
                        This portfolio is a glimpse into the things I’ve created, questioned, and grown from.
                    </p>
                </div>
              </div>
          </ContentWrapper>
          
          <ContentWrapper alignment="start">
              <div className={cn(
                "p-6 rounded-lg bg-black/40 backdrop-blur-md transition-all duration-500 border border-transparent",
                showSkills
                  ? 'opacity-100 translate-y-0 border-accent/30 shadow-[0_0_40px_-10px_hsl(var(--accent))]' 
                  : 'opacity-0 translate-y-5'
              )}>
                <h2 className="font-headline text-3xl font-bold text-accent mb-4">Skills</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg text-foreground mb-2">Languages</h3>
                        <p className="text-muted-foreground">Python, JavaScript, TypeScript, C++, SQL, HTML/CSS</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-foreground mb-2">Frameworks & Libraries</h3>
                        <p className="text-muted-foreground">React, Next.js, Node.js, TensorFlow, PyTorch, Pandas, Scikit-learn, Three.js</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-foreground mb-2">Databases</h3>
                        <p className="text-muted-foreground">MySQL, PostgreSQL, MongoDB, Firebase</p>
                    </div>
                </div>
              </div>
          </ContentWrapper>


          {projects.map((project, index) => (
             <ContentWrapper key={index} alignment={index % 2 === 0 ? "start" : "end"}>
                  <div className={cn(
                    "p-6 rounded-lg bg-black/40 backdrop-blur-md transition-all duration-500 border border-transparent",
                    activeProjectIndex === index 
                      ? 'opacity-100 translate-y-0 border-accent/30 shadow-[0_0_40px_-10px_hsl(var(--accent))]' 
                      : 'opacity-0 translate-y-5'
                  )}>
                    <h2 className="font-headline text-3xl font-bold text-accent mb-2">{project.title}</h2>
                    <p className="text-muted-foreground mb-6">{project.description}</p>
                    <div className="flex space-x-4">
                      <Button variant="ghost" className="text-muted-foreground hover:text-accent hover:bg-accent/10" size="sm" asChild><a href={project.links.github} target="_blank" rel="noopener noreferrer"><Github /> GitHub</a></Button>
                    </div>
                  </div>
             </ContentWrapper>
          ))}

          <section className="h-screen flex items-center justify-center snap-start">
            <div className="text-center">
              <h2 className="text-4xl font-headline mb-4">Let's Connect</h2>
              <p className="text-muted-foreground mb-8">The journey's end is a new beginning.</p>
              <div className="flex justify-center space-x-4 sm:space-x-8">
                 <a href="https://www.linkedin.com/in/chaitya-shah26" target="_blank" rel="noopener noreferrer" className="group">
                    <div className="p-3 sm:p-4 rounded-full border-2 border-transparent group-hover:border-accent group-hover:bg-accent/10 transition-all">
                       <Linkedin className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <p className="mt-2 text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors">LinkedIn</p>
                 </a>
                 <a href="/ChaityaShah_resume_.pdf" target="_blank" rel="noopener noreferrer" className="group">
                    <div className="p-3 sm:p-4 rounded-full border-2 border-transparent group-hover:border-accent group-hover:bg-accent/10 transition-all">
                        <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <p className="mt-2 text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors">Resume</p>
                 </a>
                 <a href="https://github.com/Chaitya-shah8" target="_blank" rel="noopener noreferrer" className="group">
                    <div className="p-3 sm:p-4 rounded-full border-2 border-transparent group-hover:border-accent group-hover:bg-accent/10 transition-all">
                        <Github className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <p className="mt-2 text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors">GitHub</p>
                 </a>
                 <a href="mailto:shahchaitya8@gmail.com" className="group">
                    <div className="p-3 sm:p-4 rounded-full border-2 border-transparent group-hover:border-accent group-hover:bg-accent/10 transition-all">
                        <Mail className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <p className="mt-2 text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors">Email</p>
                 </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
