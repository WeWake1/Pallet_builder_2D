"use client";
import { motion } from "framer-motion";
import { Boxes } from "../UI/background-boxes";
import { 
  Layers, 
  Ruler, 
  Download, 
  Grid3X3, 
  Move, 
  Copy, 
  Undo2, 
  FileText,
  Zap,
  Target,
  Palette
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
    icon: Ruler,
    title: "Dimension Annotations",
    description: "Add precise measurements and callouts to your designs"
  },
  {
    icon: Move,
    title: "Drag & Drop Interface",
    description: "Intuitive component library with drag-and-drop functionality"
  },
  {
    icon: Copy,
    title: "Smart Duplication",
    description: "Duplicate components exactly where your cursor is positioned"
  },
  {
    icon: Undo2,
    title: "Undo/Redo History",
    description: "Full history support to experiment without fear"
  },
  {
    icon: Download,
    title: "PDF Export",
    description: "Export high-resolution technical drawings ready for production"
  },
  {
    icon: FileText,
    title: "Specification Sheets",
    description: "Generate detailed specification documents automatically"
  }
];

const stats = [
  { value: "4", label: "View Modes" },
  { value: "10+", label: "Component Types" },
  { value: "∞", label: "Design Possibilities" },
  { value: "PDF", label: "Export Format" }
];

export function LandingPage({ onTryNow }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden">
      {/* Hero Section with Background Boxes */}
      <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background Boxes */}
        <div className="absolute inset-0 w-full h-full bg-slate-900 z-0 mask-[radial-gradient(ellipse_at_center,transparent_20%,black)]">
          <Boxes />
        </div>

        {/* Hero Content */}
        <motion.div 
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8"
          >
            <Zap className="w-4 h-4" />
            Professional Pallet Design Tool
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Design Pallets with
            <span className="block bg-linear-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Precision & Speed
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            The ultimate 2D pallet design software for manufacturers. 
            Create, customize, and export production-ready technical drawings.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <button
              onClick={onTryNow}
              className="group relative px-8 py-4 bg-linear-to-r from-blue-500 to-cyan-500 rounded-xl text-white font-semibold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Target className="w-5 h-5" />
                TRY NOW
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-cyan-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            
            <a
              href="#features"
              className="px-8 py-4 border border-slate-600 rounded-xl text-slate-300 font-semibold text-lg hover:bg-slate-800 hover:border-slate-500 transition-all duration-300"
            >
              Learn More
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <motion.div 
            className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center"
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <motion.div className="w-1.5 h-3 bg-slate-500 rounded-full mt-2" />
          </motion.div>
        </motion.div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 bg-slate-800/50 border-y border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl md:text-5xl font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-4">
              <Palette className="w-4 h-4" />
              Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              A comprehensive suite of tools designed specifically for pallet design professionals
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group p-6 bg-slate-800/50 border border-slate-700 rounded-2xl hover:bg-slate-800 hover:border-slate-600 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="w-12 h-12 bg-linear-to-r from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-4">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="bg-linear-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 border border-slate-700 rounded-3xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Design Your Next Pallet?
            </h2>
            <p className="text-xl text-slate-400 mb-8 max-w-xl mx-auto">
              Start creating professional pallet designs in minutes. No signup required.
            </p>
            <button
              onClick={onTryNow}
              className="group relative px-10 py-5 bg-linear-to-r from-blue-500 to-cyan-500 rounded-xl text-white font-bold text-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Target className="w-6 h-6" />
                TRY NOW — It's Free
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-cyan-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-700 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Pallet Designer</span>
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Ambica Patterns India Pvt Ltd. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
