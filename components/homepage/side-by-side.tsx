"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, MessageSquare, Dna, GitBranch, Database, Microscope, Loader2, X } from "lucide-react";
import { BackgroundGradient } from "../ui/background-gradient";
import { BackgroundBeamsWithCollision } from "../ui/background-beams-with-collision";
import { RainbowButton } from "../ui/rainbow-button";
import { Button } from "../ui/button";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { BentoGrid } from "./bento-grid";
import { Dialog } from "@/components/ui/dialog";

export default function SideBySide() {
  const tabs = [
    {
      icon: <Dna className="w-6 h-6" />,
      title: "Chromosome Visualization",
      subtitle: "Interactive visualization of chromosomal data",
      value: "visualization",
      content: (
        <BackgroundGradient className="rounded-[22px] p-1 overflow-hidden" animate={false}>
          <div className="w-full overflow-hidden relative h-full rounded-[20px] bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-white/20 dark:border-white/10">
            <Image
              src="/media/i1.webp"
              alt="Chitra Chromosome Visualization"
              width={1200}
              height={800}
              className="object-cover w-full h-full rounded-[18px]"
              priority
            />
          </div>
        </BackgroundGradient>
      ),
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: "Multi-Genome Comparison",
      subtitle: "Compare genomic data across genome",
      value: "comparison",
      content: (
        <BackgroundGradient className="rounded-[22px] p-1 overflow-hidden">
          <div className="w-full overflow-hidden relative h-full rounded-[20px] bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-white/20 dark:border-white/10">
            <Image
              src="/media/i2.webp"
              alt="Chitra Multi-Genome Comparison"
              width={1200}
              height={800}
              className="object-cover w-full h-full rounded-[18px]"
              priority
            />
          </div>
        </BackgroundGradient>
      ),
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Syntenic Relationships",
      subtitle: "Explore syntenic relationships",
      value: "synteny",
      content: (
        <BackgroundGradient className="rounded-[22px] p-1 overflow-hidden">
          <div className="w-full overflow-hidden relative h-full rounded-[20px] bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-white/20 dark:border-white/10">
            <Image
              src="/media/i3.webp"
              alt="Chitra Syntenic Relationships"
              width={1200}
              height={800}
              className="object-cover w-full h-full rounded-[18px]"
              priority
            />
          </div>
        </BackgroundGradient>
      ),
    },
    {
      icon: <Microscope className="w-6 h-6" />,
      title: "Interactive Analysis",
      subtitle: "Real-time genomic data analysis",
      value: "analysis",
      content: (
        <BackgroundGradient className="rounded-[22px] p-1 overflow-hidden">
          <div className="w-full overflow-hidden relative h-full rounded-[20px] bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-white/20 dark:border-white/10">
            <Image
              src="/media/i4.webp"
              alt="Chitra Interactive Analysis"
              width={1200}
              height={800}
              className="object-cover w-full h-full rounded-[18px]"
              priority
            />
          </div>
        </BackgroundGradient>
      ),
    },
  ];

  const [activeTab, setActiveTab] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDocsLoading, setIsDocsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const images = [
    { src: "/media/i1.webp", alt: "Chitra Chromosome Visualization" },
    { src: "/media/i2.webp", alt: "Chitra Multi-Genome Comparison" },
    { src: "/media/i3.webp", alt: "Chitra Syntenic Relationships" },
    { src: "/media/i4.webp", alt: "Chitra Interactive Analysis" },
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const duration = 7000; // 3 seconds per slide
    const interval = 10; // Update progress every 10ms
    
    let timer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;
    
    const startTimers = () => {
      let currentProgress = 0;
      
      progressTimer = setInterval(() => {
        currentProgress += (interval / duration) * 100;
        setProgress(Math.min(currentProgress, 100));
      }, interval);

      timer = setTimeout(() => {
        setActiveTab((prev) => (prev + 1) % tabs.length);
        setProgress(0);
        clearInterval(progressTimer);
        startTimers();
      }, duration);
    };

    startTimers();

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [activeTab]);

  const handleDocsClick = async () => {
    setIsDocsLoading(true);
    setTimeout(() => setIsDocsLoading(false), 1000);
  };

  if (!isClient) {
    return null;
  }

  return (
    <section className="container relative mx-auto px-4 py-24 overflow-hidden">
      <BackgroundBeamsWithCollision className="opacity-20" />
      
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-6">
            Visualize Genomic Data with Precision
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Transform your genomic data into interactive, publication-ready visualizations with Chitra's powerful rendering engine.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/docs" onClick={handleDocsClick}>
              <Button
                variant="outline"
                className="h-12 px-8 rounded-full border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xs hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                disabled={isDocsLoading}
              >
                {isDocsLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5" />
                    View Documentation
                  </span>
                )}
              </Button>
            </Link>
            
            <Button
              className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white/10 hover:bg-gray-800 dark:hover:bg-white/20 transition-colors"
              onClick={() => {/* your feedback handler */}}
            >
              <MessageSquare className="w-5 h-5 text-white dark:text-white/80" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4 px-1">
          {tabs.map((tab, index) => (
            <motion.button
              key={index}
              onClick={() => {
                setActiveTab(index);
                setProgress(0);
              }}
              className={`
                relative p-4 rounded-xl text-left transition-colors duration-200
                ${index === activeTab 
                  ? `${
                      index === 0 ? "bg-indigo-50/80 dark:bg-indigo-500/8" :
                      index === 1 ? "bg-rose-50/80 dark:bg-rose-500/8" :
                      index === 2 ? "bg-teal-50/80 dark:bg-teal-500/8" :
                      "bg-violet-50/80 dark:bg-violet-500/8"
                    } shadow-xs` 
                  : "hover:bg-gray-50/50 dark:hover:bg-white/2 bg-white/20 dark:bg-white/1"
                }
              `}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  ${index === activeTab 
                    ? index === 0 ? "text-indigo-500" :
                      index === 1 ? "text-rose-500" :
                      index === 2 ? "text-teal-500" :
                      "text-violet-500"
                    : "text-gray-400"
                  }
                `}>
                  {tab.icon}
                </div>
                <div>
                  <div className={`
                    text-sm font-medium
                    ${index === activeTab 
                      ? "text-gray-900 dark:text-white" 
                      : "text-gray-600 dark:text-white/60"
                    }
                  `}>
                    {tab.title}
                  </div>
                  <div className={`
                    text-xs
                    ${index === activeTab 
                      ? "text-gray-600 dark:text-white/80" 
                      : "text-gray-500 dark:text-white/40"
                    }
                  `}>
                    {tab.subtitle}
                  </div>
                </div>
              </div>
              
              {index === activeTab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px]">
                  <div className="h-full bg-linear-to-r from-transparent via-current to-transparent opacity-20"/>
                  <motion.div
                    className={`
                      absolute bottom-0 left-0 h-full
                      ${index === 0 ? "bg-indigo-500" :
                        index === 1 ? "bg-rose-500" :
                        index === 2 ? "bg-teal-500" :
                        "bg-violet-500"
                      }
                    `}
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              )}
            </motion.button>
          ))}
        </div>

        <div className="relative w-full bg-zinc-900/95 rounded-3xl overflow-hidden">
          <div className="h-[600px] relative cursor-zoom-in" 
               onClick={() => setSelectedImage(images[activeTab].src)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 30 
                }}
                className="absolute inset-0"
              >
                <Image
                  src={images[activeTab].src}
                  alt={images[activeTab].alt}
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {selectedImage && (
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                onClick={() => setSelectedImage(null)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="relative w-full max-w-5xl aspect-video mx-4"
                >
                  <Image
                    src={selectedImage}
                    alt="Zoomed view"
                    fill
                    className="object-contain rounded-lg"
                    priority
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              </motion.div>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
