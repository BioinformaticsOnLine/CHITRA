import { Dna, GitBranch, Database, Microscope } from "lucide-react";
import { GradientBentoCard } from "../ui/gradient-bento-card";

export function BentoGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-3 max-w-6xl mx-auto mb-12">
      <GradientBentoCard
        icon={<Dna className="w-5 h-5 text-indigo-500" />}
        title="Chromosome Visualization"
        description="Create stunning, interactive visualizations of chromosomal data with customizable layouts and styling options."
        className={`sm:col-span-1 sm:row-span-2 p-4 sm:p-6 h-full 
          bg-linear-to-br from-indigo-500/10 via-blue-500/10 to-sky-500/10
          dark:from-indigo-400/10 dark:via-blue-400/10 dark:to-sky-400/10
          border border-indigo-500/20 dark:border-indigo-400/20
          backdrop-blur-md shadow-[0_0_25px_-5px_rgba(99,102,241,0.3)]
          hover:shadow-[0_0_35px_-5px_rgba(99,102,241,0.45)]
          transition-all duration-300`}
        gradient="linear-gradient(135deg, rgba(129,140,248,0.8), rgba(99,102,241,0.8), rgba(79,70,229,0.8))"
        size="default"
      />
      <GradientBentoCard
        icon={<GitBranch className="w-5 h-5 text-rose-500" />}
        title="Syntenic Relationships"
        description="Explore and visualize syntenic relationships between different genome with intuitive, interactive displays."
        className={`sm:col-span-1 p-4 sm:p-6 h-full 
          bg-linear-to-br from-rose-500/10 via-pink-500/10 to-red-500/10
          dark:from-rose-400/10 dark:via-pink-400/10 dark:to-red-400/10
          border border-rose-500/20 dark:border-rose-400/20
          backdrop-blur-md shadow-[0_0_25px_-5px_rgba(244,63,94,0.3)]
          hover:shadow-[0_0_35px_-5px_rgba(244,63,94,0.45)]
          transition-all duration-300`}
        gradient="linear-gradient(135deg, rgba(251,113,133,0.8), rgba(244,63,94,0.8), rgba(225,29,72,0.8))"
        size="default"
      />
      <GradientBentoCard
        icon={<Database className="w-5 h-5 text-teal-500" />}
        title="Data Integration"
        description="Import and integrate various genomic data formats seamlessly for comprehensive visualization and analysis."
        className={`sm:col-span-1 p-4 sm:p-6 h-full 
          bg-linear-to-br from-teal-500/10 via-emerald-500/10 to-green-500/10
          dark:from-teal-400/10 dark:via-emerald-400/10 dark:to-green-400/10
          border border-teal-500/20 dark:border-teal-400/20
          backdrop-blur-md shadow-[0_0_25px_-5px_rgba(20,184,166,0.3)]
          hover:shadow-[0_0_35px_-5px_rgba(20,184,166,0.45)]
          transition-all duration-300`}
        gradient="linear-gradient(135deg, rgba(45,212,191,0.8), rgba(20,184,166,0.8), rgba(13,148,136,0.8))"
        size="default"
      />
      <GradientBentoCard
        icon={<Microscope className="w-5 h-5 text-violet-500" />}
        title="Interactive Analysis"
        description="Perform dynamic analysis with real-time updates and interactive features for deeper insights into your genomic data."
        className={`sm:col-span-2 p-4 sm:p-6 h-full 
          bg-linear-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10
          dark:from-violet-400/10 dark:via-purple-400/10 dark:to-fuchsia-400/10
          border border-violet-500/20 dark:border-violet-400/20
          backdrop-blur-md shadow-[0_0_25px_-5px_rgba(139,92,246,0.3)]
          hover:shadow-[0_0_35px_-5px_rgba(139,92,246,0.45)]
          transition-all duration-300`}
        gradient="linear-gradient(135deg, rgba(167,139,250,0.8), rgba(139,92,246,0.8), rgba(124,58,237,0.8))"
        size="default"
      />
    </div>
  );
} 