"use client";
import { motion } from "framer-motion";
import { Boxes } from "../UI/background-boxes";
import { WarpBackground } from "../UI/warp-background";
import { GlowingEffect } from "../UI/glowing-effect";
import { 
  Layers, 
  Grid3X3, 
  Download, 
  Move
} from "lucide-react";

interface LandingPageProps {
  onTryNow: () => void;
}

const features = [
  {
    icon: Layers,
    title: "Multi-View Design",
    description: "Design from Top, Side, End, and Bottom views for complete 3D visualization"
  },
  {
    icon: Grid3X3,
    title: "Smart Grid System",
    description: "Snap-to-grid functionality for precise component placement"
  },
  {
    icon: Move,
    title: "Drag & Drop",
    description: "Intuitive component library with drag-and-drop functionality"
  },
  {
    icon: Download,
    title: "PDF Export",
    description: "Export high-resolution technical drawings ready for production"
  }
];

export function LandingPage({ onTryNow }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden font-sans selection:bg-white/20">
      {/* Hero Section */}
      <div className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-black">
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <Boxes />
        </div>
        <div className="absolute inset-0 w-full h-full bg-black z-10 mask-[radial-gradient(transparent,white)] pointer-events-none" />
        
        <div className="z-20 text-center px-4 max-w-4xl mx-auto">
          <motion.h1 
            className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Pallet Designer
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            The most advanced tool for professional pallet design and visualization.
          </motion.p>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-32 px-4 bg-black relative z-10">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature) => (
            <GridItem
              key={feature.title}
              icon={<feature.icon className="h-6 w-6 text-white" />}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </ul>
      </div>

      {/* Footer CTA */}
      <div className="relative h-[500px] w-full bg-black overflow-hidden">
        <WarpBackground 
          className="w-full h-full border-none p-0 rounded-none"
          gridColor="#262626"
        >
          <div className="relative w-full h-full flex items-center justify-center z-20">
            <h2 className="absolute top-16 text-4xl md:text-5xl font-bold text-white tracking-tight text-center px-4">
              Ready to start designing?
            </h2>
            <button
              onClick={onTryNow}
              className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform duration-200"
            >
              <span className="flex items-center gap-2">
                Try Now
              </span>
            </button>
          </div>
        </WarpBackground>
      </div>
    </div>
  );
}

interface GridItemProps {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ icon, title, description }: GridItemProps) => {
  return (
    <li className="min-h-[14rem] list-none">
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-neutral-800 p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] border-neutral-800 bg-black p-6 shadow-sm">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border-[0.75px] border-neutral-800 bg-neutral-900 p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl font-semibold font-sans tracking-tight text-white">
                {title}
              </h3>
              <p className="font-sans text-sm md:text-base text-neutral-400">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
