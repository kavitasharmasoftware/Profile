import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import { Github, Linkedin, Mail, ExternalLink, Terminal, Code, Cpu, Activity, Globe, Send, ChevronRight, Sparkles, Brain, Shield, Gamepad, Trophy, Lock, Search, Settings, Box, Plus, ArrowRight, Shapes } from "lucide-react";

// --- Utilities ---

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// --- Components ---

// 0. Cursor Trail Effect
const CursorTrail = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{x: number, y: number, age: number}[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      pointsRef.current.push({ x: e.clientX, y: e.clientY, age: 0 });
    };
    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update points
      pointsRef.current = pointsRef.current
        .map(p => ({ ...p, age: p.age + 1 }))
        .filter(p => p.age < 20); // Trail length

      if (pointsRef.current.length < 2) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Draw Trail
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      // Move to first point
      ctx.moveTo(pointsRef.current[0].x, pointsRef.current[0].y);

      for (let i = 1; i < pointsRef.current.length; i++) {
        const point = pointsRef.current[i];
        const prevPoint = pointsRef.current[i - 1];
        
        // Quadratic curve for smoothness
        const cx = (prevPoint.x + point.x) / 2;
        const cy = (prevPoint.y + point.y) / 2;
        ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cx, cy);
      }
      
      // Connect to the last point
      const last = pointsRef.current[pointsRef.current.length - 1];
      ctx.lineTo(last.x, last.y);

      // Gradient Stroke
      const gradient = ctx.createLinearGradient(
        pointsRef.current[0].x, pointsRef.current[0].y,
        last.x, last.y
      );
      gradient.addColorStop(0, "rgba(0, 255, 157, 0)");
      gradient.addColorStop(0.5, "rgba(0, 255, 157, 0.5)");
      gradient.addColorStop(1, "rgba(0, 184, 255, 0.8)");

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#00ff9d";
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[60] pointer-events-none" />;
};


// 1. Background Paths (Architectural Lines)
const FloatingPaths = ({ position }: { position: number }) => {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6} C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6} C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    color: `rgba(15,23,42,${0.1 + i * 0.03})`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full text-white/5"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            className="animate-float-path"
            style={{
                // @ts-ignore
                "--duration": `${20 + path.id * 2}s`,
                "--delay": `${path.id * -1}s`
            }}
          />
        ))}
      </svg>
    </div>
  );
};

const BackgroundPaths = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-black/95 flex items-center justify-center">
        {/* Abstract Gradient Mesh Base */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,#1e293b,transparent)]" />
        
        {/* Floating Paths scaled 2x as requested */}
        <div className="absolute inset-0 opacity-40 scale-[2] transform-gpu">
            <FloatingPaths position={1} />
            <FloatingPaths position={-1} />
        </div>
        
        {/* Style for animation */}
        <style dangerouslySetInnerHTML={{__html: `
            @keyframes float-path {
                0% { stroke-dasharray: 10, 600; stroke-dashoffset: 600; }
                50% { stroke-dasharray: 300, 600; stroke-dashoffset: 0; }
                100% { stroke-dasharray: 10, 600; stroke-dashoffset: -600; }
            }
            .animate-float-path {
                animation: float-path var(--duration) ease-in-out infinite alternate;
                animation-delay: var(--delay);
            }
        `}} />
    </div>
  );
};


// 2. Typewriter Effect (Cycling)
const TypewriterEffect = ({ phrases, className }: { phrases: string[]; className?: string }) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const handleTyping = () => {
      const currentPhrase = phrases[currentPhraseIndex];
      
      if (isDeleting) {
        setDisplayedText(prev => prev.substring(0, prev.length - 1));
      } else {
        setDisplayedText(prev => currentPhrase.substring(0, prev.length + 1));
      }

      if (!isDeleting && displayedText === currentPhrase) {
        setTimeout(() => setIsDeleting(true), 2000); // Pause at end
      } else if (isDeleting && displayedText === "") {
        setIsDeleting(false);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    };

    const speed = isDeleting ? 50 : 100;
    const timer = setTimeout(handleTyping, speed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentPhraseIndex, phrases]);

  return (
    <div className={cn("flex items-center justify-center min-h-[80px]", className)}>
        <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-center leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyber-secondary">
             {displayedText}
             <span className="inline-block w-[3px] h-[1em] bg-cyber-primary animate-pulse align-middle ml-1"></span>
        </h1>
    </div>
  );
};

// 3. Shimmer Button (Premium Action)
const ShimmerButton = ({ children, onClick, href, className }: { children: React.ReactNode; onClick?: () => void; href?: string; className?: string }) => {
    const content = (
        <div className={cn("relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50", className)}>
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 py-1 text-sm font-medium text-white backdrop-blur-3xl transition-colors hover:text-cyber-primary">
                {children}
            </span>
        </div>
    );

    if (href) {
        // Handle mailto and external links correctly
        const isExternal = href.startsWith('http') || href.startsWith('mailto');
        const target = isExternal && !href.startsWith('mailto') ? "_blank" : undefined;
        return (
          <a href={href} target={target} rel="noreferrer" className="block relative z-30">
            {content}
          </a>
        );
    }

    return <button onClick={onClick} className="relative z-30">{content}</button>;
};

// 4. Hero Geometric (Premium 3D Shapes)
const GeometricShape = ({ className, delay = 0 }: { className: string, delay?: number }) => (
    <div 
        className={cn("absolute pointer-events-none opacity-20 blur-sm animate-float-slow", className)} 
        style={{ animationDelay: `${delay}s` }}
    >
        <div className="w-full h-full bg-gradient-to-br from-cyber-primary/40 to-cyber-secondary/40 border border-white/10 rounded-[20%] backdrop-blur-3xl shadow-[0_0_30px_rgba(0,255,157,0.1)]"></div>
    </div>
)

const HeroGeometric = ({ 
    badge = "Kokonut UI", 
    title1 = "Elevate Your", 
    title2 = "Digital Vision" 
}: { badge?: string; title1?: string; title2?: string }) => {
    return (
        <div className="relative w-full overflow-hidden min-h-[85vh] flex flex-col items-center justify-center pt-20">
            {/* Background Gradient - Removed local bg to show BackgroundPaths */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-transparent z-0 pointer-events-none"></div>
            
            {/* 3D Shapes */}
            <GeometricShape className="w-64 h-64 -top-20 -left-20 rotate-12" delay={0} />
            <GeometricShape className="w-48 h-48 top-1/4 -right-10 -rotate-12" delay={2} />
            <GeometricShape className="w-32 h-32 bottom-20 left-10 rotate-45" delay={1} />
            
            <div className="relative z-10 flex flex-col items-center max-w-5xl mx-auto px-4 text-center">
                 {/* Badge */}
                <div className="mb-8">
                    <div className="relative flex items-center whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm leading-6 text-cyber-primary backdrop-blur-md shadow-[0_0_15px_rgba(0,255,157,0.15)] font-cursive tracking-wider">
                        <Shapes className="h-4 w-4 mr-2" /> 
                        {badge}
                    </div>
                </div>

                {/* Typography */}
                <div className="mb-6 w-full">
                   <TypewriterEffect 
                      phrases={[
                          "Architecting Digital Chaos",
                          "Building Intelligent Systems",
                          "Crafting Web Design"
                      ]}
                      className="justify-center min-h-[3.5em] md:min-h-[4em]"
                   />
                </div>

                <p className="md:text-lg mx-auto mb-10 mt-4 max-w-2xl px-6 text-gray-300 sm:px-6 leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                    I'm <span className="text-white font-semibold">Kavita Sharma</span>, a Fullstack Developer and AI Specialist. 
                    I build immersive, high-performance web experiences that blend chaotic creativity with precise engineering.
                </p>

                <div className="flex justify-center gap-6 mb-16 relative z-30">
                     <ShimmerButton href="#projects" className="font-bold">
                        View Projects <ChevronRight className="w-4 h-4 ml-1" />
                     </ShimmerButton>
                     <a href={`https://${RESUME.contact.linkedin}`} target="_blank" rel="noreferrer" className="px-8 py-3 bg-white/5 text-white border border-white/10 rounded-full hover:bg-white/10 transition-all font-medium backdrop-blur-sm flex items-center gap-2 group cursor-pointer z-30 hover:border-white/30">
                        <Linkedin className="w-4 h-4 group-hover:text-blue-400 transition-colors" /> Connect
                     </a>
                </div>

                {/* Integrated AI Terminal */}
                <div className="w-full max-w-2xl mx-auto transform hover:scale-[1.02] transition-transform duration-500 relative z-20">
                    <AIChatTerminal />
                </div>
            </div>
        </div>
    );
}

// --- Data ---

const RESUME = {
  name: "Kavita Sharma",
  title: "Fullstack Developer & AI Engineer",
  education: [
    {
      school: "RV College Of Engineering",
      degree: "Bachelor of Engineering - BE, Instrumentation Technology",
      period: "2022 - 2026",
    },
  ],
  experience: [
    {
      company: "AVA Technology",
      role: "Web Developer",
      period: "October 2025 - Present (2 months)",
      location: "Bangalore Urban, Karnataka, India",
    },
  ],
  skills: ["Prompt Engineering", "React Native", "C#", "Generative AI", "React", "TypeScript", "Three.js"],
  contact: {
    email: "kavitasharma.ei22@rvce.edu.in",
    linkedin: "www.linkedin.com/in/kavit-sharma-597bb3392",
  },
};

const PROJECTS = [
  {
    title: "Cursed Terminal",
    description: "A chaotic, interactive terminal simulator inspired by retro computing and memes. Features AI-generated memes, audio synthesis, and glitch aesthetics.",
    tags: ["React", "Web Audio API", "Gemini API", "Chaotic UI"],
    link: "https://cursed-terminal-antics.lovable.app/",
    repo: "https://github.com/kavitasharmasoftware/cursed-terminal-antics",
    icon: <Terminal className="w-6 h-6 text-yellow-400" />,
    color: "from-yellow-500/20 to-orange-500/20",
    award: "🏆 Cursed Genius Award (2nd Prize) - Grand India Hackathon",
    area: "md:col-span-7"
  },
  {
    title: "TrustBuddy AI",
    description: "Cybernetic Truth Defense System. A cyberpunk-themed tool to verify claims, detect deepfakes, and scan URLs.",
    tags: ["Python", "Streamlit", "Deepfake Detection"],
    link: "https://trust-buddy.streamlit.app/",
    repo: "https://github.com/kavitasharmasoftware/Trust-buddy-ai",
    icon: <Shield className="w-6 h-6 text-cyan-400" />,
    color: "from-cyan-500/20 to-blue-500/20",
    area: "md:col-span-5"
  },
  {
    title: "FeverDoc-AI",
    description: "Tropical Fever Triage Expert. AI-driven tool for rapid triage of fevers with live video consultation.",
    tags: ["React", "Gemini 2.5 Pro", "Medical AI"],
    link: "https://feverdoc-ai-tropical-fever-triage-207496543105.us-west1.run.app/",
    repo: "https://github.com/kavitasharmasoftware/Fever-Ai-Doc",
    icon: <Activity className="w-6 h-6 text-red-400" />,
    color: "from-red-500/20 to-pink-500/20",
    area: "md:col-span-5"
  },
  {
    title: "DECo",
    description: "AI Website Builder. Generates fully functional, 3D immersive landing pages from a simple business description.",
    tags: ["React", "Three.js", "Gemini 2.5 Flash"],
    link: "https://deco-ai-website-builder-462804117480.us-west1.run.app",
    repo: "https://github.com/kavitasharmasoftware/Deco",
    icon: <Sparkles className="w-6 h-6 text-purple-400" />,
    color: "from-purple-500/20 to-indigo-500/20",
    area: "md:col-span-7",
    special: true
  },
];

// UI Card Component
const Card = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
  return (
    <div className={cn("rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm text-slate-100 overflow-hidden", className)}>
      {children}
    </div>
  );
};

// Spline Scene Component
const SplineScene = ({ scene, className }: { scene: string; className?: string }) => {
  return (
    <div className={className}>
      {/* @ts-ignore */}
      <spline-viewer url={scene} class="w-full h-full block" />
    </div>
  );
};

// Spotlight Component
const Spotlight = ({ className, fill }: { className?: string; fill?: string }) => {
  return (
    <svg
      className={cn(
        "animate-spotlight pointer-events-none absolute z-[1]  h-[169%] w-[138%] lg:w-[84%] opacity-0",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <g filter="url(#filter0_f_29_213)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill={fill || "white"}
          fillOpacity="0.21"
        />
      </g>
      <defs>
        <filter
          id="filter0_f_29_213"
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="151"
            result="effect1_foregroundBlur_29_213"
          />
        </filter>
      </defs>
    </svg>
  );
};


// Glowing Effect Component
interface GlowingEffectProps {
  spread?: number;
  glow?: boolean;
  disabled?: boolean;
  proximity?: number;
  inactiveZone?: number;
  borderWidth?: number;
}

const GlowingEffect = ({
  spread = 40,
  glow = true,
  disabled = false,
  proximity = 64,
  inactiveZone = 0.01,
  borderWidth = 3,
}: GlowingEffectProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;
    
    const updateMouse = (e: MouseEvent) => {
        const rect = parent.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setPosition({x, y});
        
        // Simple proximity check
        if (x >= -proximity && x <= rect.width + proximity && y >= -proximity && y <= rect.height + proximity) {
             setOpacity(1);
        } else {
            setOpacity(0);
        }
    };
    
    window.addEventListener("mousemove", updateMouse);
    return () => {
        window.removeEventListener("mousemove", updateMouse);
    };
  }, [proximity]);

  return (
    <div 
        ref={containerRef}
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
            // @ts-ignore
            "--x": `${position.x}px`,
            "--y": `${position.y}px`,
            "--spread": `${spread}px`,
            "--border-width": `${borderWidth}px`,
            opacity: glow ? opacity : 0,
            transition: "opacity 0.2s ease",
        }}
    >
        {/* The Glow Gradient Mask */}
        <div 
            className="absolute inset-0 rounded-[inherit]"
            style={{
                background: `radial-gradient(var(--spread) circle at var(--x) var(--y), rgba(0, 255, 157, 0.4), transparent)`,
            }}
        />
        {/* Border Highlighting */}
        <div 
             className="absolute inset-0 rounded-[inherit] border border-transparent"
             style={{
                 mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                 maskComposite: "exclude",
                 background: `radial-gradient(var(--spread) circle at var(--x) var(--y), rgba(0, 255, 157, 0.8), transparent)`,
                 padding: "1px" // simulates border width
             }}
        ></div>
    </div>
  );
};

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tags: string[];
  link: string;
  repo?: string;
  award?: string;
}

const GridItem: React.FC<GridItemProps> = ({ area, icon, title, description, tags, link, repo, award }) => {
  return (
    <li className={cn("min-h-[16rem] list-none relative group", area)}>
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-white/10 p-2 md:rounded-[1.5rem] md:p-3 bg-black/40 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(0,255,157,0.1)]">
        <GlowingEffect
          spread={60}
          glow={true}
          disabled={false}
          proximity={100}
          inactiveZone={0.01}
          borderWidth={2}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] border-white/5 bg-slate-950/80 p-6 shadow-sm md:p-6 z-20">
          {/* Overlay to block clicks on background but allow buttons */}
          <div className="absolute inset-0 z-0 pointer-events-none"></div>

          {/* Header */}
          <div className="relative flex flex-1 flex-col gap-4 z-10">
             <div className="flex justify-between items-start">
                <div className="w-fit rounded-lg border-[0.75px] border-white/10 bg-white/5 p-2 text-white shadow-inner">
                    {icon}
                </div>
                {award && (
                     <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 text-yellow-400 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(234,179,8,0.2)] max-w-[60%] text-right leading-tight ml-auto animate-pulse-fast">
                       <Trophy className="w-3 h-3 flex-shrink-0" /> {award}
                     </div>
                )}
            </div>

            <div className="space-y-3">
              <a href={link} target="_blank" rel="noreferrer" className="block group/title">
                <h3 className="pt-0.5 text-xl leading-[1.375rem] font-bold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-white group-hover/title:text-cyber-primary transition-colors flex items-center gap-2">
                    {title} <ExternalLink className="w-4 h-4 opacity-0 group-hover/title:opacity-100 transition-opacity translate-y-1 group-hover/title:translate-y-0 duration-300" />
                </h3>
              </a>
              <p className="font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-gray-400 line-clamp-3">
                {description}
              </p>
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-auto">
                {tags.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="text-[10px] md:text-xs font-mono px-2 py-1 rounded bg-white/5 text-gray-300 border border-white/5 shadow-sm">
                        #{tag}
                    </span>
                ))}
            </div>
          </div>

          {/* Buttons - Explicit Z-Index and Pointer Events */}
          <div className="flex gap-3 pt-4 border-t border-white/5 z-30 relative pointer-events-auto">
               <a href={link} target="_blank" rel="noreferrer" className="flex-1 text-center px-3 py-2 bg-cyber-primary text-black text-sm font-bold rounded hover:bg-cyber-primary/90 transition-all hover:shadow-[0_0_10px_rgba(0,255,157,0.4)] flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap z-50">
                 <Globe size={14} /> Demo
               </a>
               {repo && (
                 <a href={repo} target="_blank" rel="noreferrer" className="flex-1 text-center px-3 py-2 bg-white/10 text-white text-sm font-medium rounded hover:bg-white/20 transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap z-50 hover:border-white/30">
                   <Code size={14} /> Code
                 </a>
               )}
          </div>
        </div>
      </div>
    </li>
  );
};

// Spline 3D Project Card
const SplineProjectCard: React.FC<GridItemProps> = ({ area, icon, title, description, tags, link, repo }) => {
    return (
        <li className={cn("min-h-[30rem] list-none relative group", area)}>
             <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-white/10 p-2 md:rounded-[1.5rem] md:p-3 bg-black/40 backdrop-blur-sm overflow-hidden">
                <GlowingEffect
                    spread={60}
                    glow={true}
                    disabled={false}
                    proximity={100}
                    inactiveZone={0.01}
                    borderWidth={2}
                />
                 <Card className="w-full h-full bg-black/[0.96] relative overflow-hidden border border-white/10 z-20">
                    <Spotlight
                        className="-top-40 left-0 md:left-60 md:-top-20"
                        fill="white"
                    />
                    
                    <div className="flex flex-col md:flex-row h-full relative z-10">
                        {/* Left content */}
                        <div className="flex-1 p-8 relative z-10 flex flex-col justify-center bg-gradient-to-r from-black via-black/90 to-transparent">
                            <div className="w-fit rounded-lg border border-white/10 bg-white/5 p-3 text-cyber-primary mb-6 shadow-[0_0_15px_rgba(0,255,157,0.2)]">
                                {icon}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 leading-tight">
                                {title}
                            </h1>
                            <div className="flex flex-wrap gap-2 mt-4 mb-4">
                                {tags.map((tag: string) => (
                                    <span key={tag} className="text-xs font-mono px-2 py-1 rounded bg-white/10 text-gray-300 border border-white/10">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            <p className="mt-4 text-neutral-300 max-w-lg text-lg leading-relaxed">
                                {description}
                            </p>

                            <div className="flex gap-4 pt-8 pointer-events-auto">
                                <ShimmerButton href={link} className="h-10 px-6">
                                    <Globe size={16} className="mr-2" /> Live Demo
                                </ShimmerButton>
                                {repo && (
                                    <a href={repo} target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-white/5 text-white text-sm font-medium rounded-full hover:bg-white/10 transition-transform hover:scale-105 border border-white/10 flex items-center gap-2 z-50 relative">
                                    <Code size={16} /> Source Code
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Right content */}
                        <div className="flex-1 relative h-[300px] md:h-full">
                            <SplineScene 
                                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                                className="w-full h-full"
                            />
                            {/* Overlay to ensure text readability if scene overlaps on mobile */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:hidden pointer-events-none"></div>
                        </div>
                    </div>
                </Card>
             </div>
        </li>
    );
};


const AIChatTerminal = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "model"; text: string }[]>([
    { role: "model", text: "Initializing KavitaAI v2.5... \nReady. Ask me about Kavita's projects, skills, or experience." },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemPrompt = `
        You are an advanced AI assistant for Kavita Sharma's portfolio website. 
        
        Kavita's Profile:
        - Student at RV College of Engineering (Instrumentation Tech, 2022-2026).
        - Web Developer at AVA Technology (Oct 2025 - Present).
        - Skills: Prompt Engineering, React Native, C#, GenAI, TypeScript.
        
        Projects:
        1. Cursed Terminal: Chaotic terminal simulator with memes, WebAudio, glitch effects. Won "Cursed Genius Award".
        2. TrustBuddy AI: Cyberpunk truth defense system, deepfake detection, fact-checking.
        3. FeverDoc-AI: Medical triage for tropical fevers, video consultation, cough analysis.
        4. DECo: AI website builder, 3D landing pages, Gemini 2.5 Flash powered.

        Tone: Professional but with a slight 'hacker' or 'cyberpunk' edge. Keep answers concise (under 3 sentences if possible).
        If asked about contact, provide her email: ${RESUME.contact.email}.
        
        User Question: ${userMsg}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      });

      const text = response.text || "Connection interrupted. Try again.";
      setMessages((prev) => [...prev, { role: "model", text }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "model", text: "Error: Neural link unstable. (API Error)" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 border border-cyber-primary/30 rounded-lg bg-black/90 backdrop-blur-md overflow-hidden shadow-[0_0_20px_rgba(0,255,157,0.15)] relative z-20">
      <div className="bg-cyber-panel px-4 py-2 border-b border-cyber-primary/20 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-xs font-mono text-cyber-primary/70 tracking-widest">KAVITA_AI_ASSISTANT.EXE</div>
      </div>
      
      <div className="h-48 md:h-64 p-4 overflow-y-auto font-mono text-sm space-y-3 scrollbar-hide" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20' : 'text-gray-300 bg-white/5 border border-white/5'}`}>
              {msg.role === 'model' && <span className="text-cyber-secondary mr-2 font-bold">{'>'}</span>}
              {msg.text}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="text-left text-cyber-secondary animate-pulse flex items-center gap-2">
            <span className="w-2 h-2 bg-cyber-secondary rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-cyber-secondary rounded-full animate-bounce delay-75"></span>
            <span className="w-2 h-2 bg-cyber-secondary rounded-full animate-bounce delay-150"></span>
          </div>
        )}
      </div>

      <div className="p-3 bg-cyber-panel border-t border-cyber-primary/20 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Input command or query..."
          className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyber-primary/50 font-mono placeholder:text-gray-600"
        />
        <button 
          onClick={handleSend}
          className="bg-cyber-primary/10 hover:bg-cyber-primary/20 text-cyber-primary p-2 rounded transition-colors border border-cyber-primary/20"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

// --- Main Application ---

const App = () => {
  return (
    <div className="min-h-screen font-sans selection:bg-cyber-primary/30 selection:text-cyber-primary pb-20 relative text-slate-200">
      
      {/* 0. Cursor Trail Effect */}
      <CursorTrail />

      {/* 1. Global Background (Paths) */}
      <BackgroundPaths />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-xl border-b border-white/5 supports-[backdrop-filter]:bg-black/30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold font-mono tracking-tighter flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <Cpu className="text-cyber-primary w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
            <span className="text-white group-hover:text-cyber-primary transition-colors">KAVITA<span className="text-cyber-primary group-hover:text-white transition-colors">.DEV</span></span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-gray-400 relative z-50">
            <a href="#about" className="hover:text-cyber-primary transition-colors hover:underline decoration-cyber-primary/50 underline-offset-4 cursor-pointer">ABOUT</a>
            <a href="#projects" className="hover:text-cyber-primary transition-colors hover:underline decoration-cyber-primary/50 underline-offset-4 cursor-pointer">PROJECTS</a>
            <a href="#contact" className="hover:text-cyber-primary transition-colors hover:underline decoration-cyber-primary/50 underline-offset-4 cursor-pointer">CONTACT</a>
          </div>
        </div>
      </nav>

      {/* New Hero Section */}
      <section id="home">
          <HeroGeometric badge="Kavita.dev" />
      </section>

      {/* Skills & Experience */}
      <section id="about" className="py-20 px-6 max-w-6xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-16">
          <div className="relative">
             {/* Decorative background blob */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyber-primary/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2 relative z-10">
              <Code className="text-cyber-secondary" /> Technical Arsenal
            </h2>
            <div className="flex flex-wrap gap-3 relative z-10">
              {RESUME.skills.map((skill) => (
                <span key={skill} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-gray-300 hover:border-cyber-primary/50 hover:text-cyber-primary hover:bg-cyber-primary/5 transition-all cursor-default shadow-sm">
                  {skill}
                </span>
              ))}
            </div>
            
            <h2 className="text-2xl font-bold text-white mt-12 mb-8 flex items-center gap-2 relative z-10">
              <Brain className="text-cyber-secondary" /> Education
            </h2>
            {RESUME.education.map((edu, i) => (
              <div key={i} className="mb-6 border-l-2 border-cyber-secondary/30 pl-6 relative z-10">
                <h3 className="text-white font-semibold text-lg">{edu.school}</h3>
                <p className="text-gray-400 text-sm mt-1">{edu.degree}</p>
                <p className="text-cyber-secondary text-xs mt-2 font-mono bg-cyber-secondary/10 w-fit px-2 py-0.5 rounded">{edu.period}</p>
              </div>
            ))}
          </div>

          <div className="relative">
             {/* Decorative background blob */}
             <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyber-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2 relative z-10">
              <Activity className="text-cyber-secondary" /> Experience
            </h2>
            <div className="space-y-6 relative z-10">
              {RESUME.experience.map((exp, i) => (
                <div key={i} className="group relative bg-white/5 p-6 rounded-xl border border-white/5 hover:border-cyber-primary/30 transition-all hover:bg-white/10 hover:shadow-lg">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="text-cyber-primary w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyber-primary transition-colors">{exp.role}</h3>
                  <div className="text-cyber-secondary font-mono text-sm mb-2">{exp.company}</div>
                  <p className="text-gray-500 text-xs mb-4 font-mono flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    {exp.period} | {exp.location}
                  </p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Developing modern web solutions with a focus on AI integration and performance optimization.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section id="projects" className="py-20 px-6 max-w-6xl mx-auto border-t border-white/5 relative z-10">
        <div className="flex justify-between items-end mb-16">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">Featured Projects</h2>
            <p className="text-gray-400 max-w-xl">
                A collection of AI-powered applications, winners of hackathons, and chaotic experiments.
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          {PROJECTS.map((project, index) => {
              if (project.title === "DECo") {
                  return (
                    <SplineProjectCard
                        key={index}
                        area={project.area || "md:col-span-12"}
                        icon={project.icon}
                        title={project.title}
                        description={project.description}
                        tags={project.tags}
                        link={project.link}
                        repo={project.repo}
                    />
                  );
              }
              return (
                <GridItem
                    key={index}
                    area={project.area || "md:col-span-6"}
                    icon={project.icon}
                    title={project.title}
                    description={project.description}
                    tags={project.tags}
                    link={project.link}
                    repo={project.repo}
                    award={project.award}
                />
            );
          })}
        </ul>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 max-w-6xl mx-auto text-center relative z-20">
        <div className="bg-gradient-to-b from-slate-900/50 to-slate-950/80 rounded-3xl p-12 border border-white/10 relative overflow-hidden backdrop-blur-sm z-30">
          {/* Animated Gradient Line */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-primary to-transparent opacity-50"></div>
          
          <h2 className="text-4xl font-bold text-white mb-6">Ready to collaborate?</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-10 text-lg">
            I'm currently looking for new opportunities in Frontend Engineering and AI Development. 
            Let's build something extraordinary.
          </p>
          
          <div className="flex justify-center gap-6 flex-wrap relative z-40">
            <ShimmerButton href={`mailto:${RESUME.contact.email.trim()}`} className="h-14 px-10 text-base">
                 <Mail size={18} className="mr-2" /> Send Email
            </ShimmerButton>
            <a href={`https://${RESUME.contact.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-8 py-4 bg-white/5 text-white font-medium rounded-full hover:bg-white/10 transition-colors border border-white/10 cursor-pointer hover:border-white/30 relative z-40">
              <Linkedin size={18} /> LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-gray-600 text-sm font-mono border-t border-white/5 bg-black/40 backdrop-blur-md relative z-10 flex flex-col items-center">
        <div className="flex justify-center items-center gap-2 mb-4">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span>System Status: Online</span>
        </div>
        <p className="mb-2">© 2025 Kavita Sharma. Built with React, Gemini 2.5 & Chaos.</p>
        <a href={`mailto:${RESUME.contact.email}`} className="text-cyber-secondary hover:underline">{RESUME.contact.email}</a>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);