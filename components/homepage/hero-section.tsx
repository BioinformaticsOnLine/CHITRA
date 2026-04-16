"use client";
import { ArrowRight, Github, Loader2, ExternalLink, Download } from 'lucide-react';
import Link from "next/link";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { motion } from "motion/react";
import { useState, useRef } from 'react';
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import Particles from "../ui/particles";
import { BackgroundBeamsWithCollision } from "../ui/background-beams-with-collision";
import { ProgressSlider, SliderBtnGroup, SliderBtn, SliderWrapper } from "../ui/progress-carousel";
import { Dialog, DialogContent } from "../ui/dialog";
import { DataFlowDiagram } from "./data-flow-diagram";
import ScrambleHover from "@/components/ui/scramble-hover";
import { ShinyRotatingBorderButton } from "@/components/ui/shiny-rotating-border-button";

const videos = [
    {
        id: "v1",
        src: "/media/v1.mp4",
        title: "Synteny Block Visualization",
        desc: "Interactive visualization of synteny blocks across chromosomes"
    },
    {
        id: "v2",
        src: "/media/v2.mp4",
        title: "Multi-Genome Comparison",
        desc: "Compare genomic structures across multiple genome"
    },
    {
        id: "v3",
        src: "/media/v3.mp4",
        title: "Breakpoint Analysis",
        desc: "Detailed analysis of chromosomal breakpoints"
    },
    {
        id: "v4",
        src: "/media/v4.mp4",
        title: "Interactive Visualization",
        desc: "Dynamic and interactive genome visualization tools"
    },
];

export default function HeroSection() {
    const [isLoading, setIsLoading] = useState(false);
    const [isDocsLoading, setIsDocsLoading] = useState(false);
    const [isGithubHovered, setIsGithubHovered] = useState(false);
    const [fullscreenVideo, setFullscreenVideo] = useState<{ id: string, src: string } | null>(null);
    const { resolvedTheme } = useTheme();

    // Draw.io URL always in light mode with zoom
    const drawioUrl = `https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&edit=_blank&layers=1&nav=1&title=Chitra-flow.drawio&dark=0&zoom=1.5#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D17w3unzRnXwZJFQm252RN1HcSqaLhxKEm%26export%3Ddownload`;
    const drawioFullscreenUrl = `https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&edit=_blank&layers=1&nav=1&title=Chitra-flow.drawio&dark=0#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D17w3unzRnXwZJFQm252RN1HcSqaLhxKEm%26export%3Ddownload`;

    return (
        <section className="relative w-full overflow-hidden">
            <Particles
                className="fixed inset-0 -z-10"
                quantity={100}
                staticity={30}
                color="#3b82f6"
                ease={20}
                size={1.2}
            />

            <div className="relative z-10 flex w-full items-center justify-center py-8">
                <div className="container mx-auto px-2 xs:px-4">
                    <div className="grid items-center gap-4 xs:gap-8 xl:grid-cols-[0.7fr,1.3fr] xl:gap-20">
                        <div className="flex flex-col items-center text-center xl:items-start xl:text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, ease: "easeOut" }}
                                className="w-full space-y-3 xs:space-y-4 sm:space-y-8"
                            >
                                {/* Feature Tags */}
                                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 xl:justify-start">
                                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                        #Synteny
                                    </Badge>
                                    <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                        #Annotations
                                    </Badge>
                                    <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                        #Breakpoints
                                    </Badge>
                                    <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                        #Visualization
                                    </Badge>
                                    <Badge variant="secondary" className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                                        #Chromosomes
                                    </Badge>
                                </div>

                                <div className="space-y-1.5 xs:space-y-2 sm:space-y-4">
                                    <div className="flex justify-center xl:justify-start">
                                        <ShinyRotatingBorderButton className="p-1 sm:p-1.5 rounded-full">
                                            <span className="text-2xl xs:text-3xl sm:text-6xl xl:text-7xl 2xl:text-8xl font-bold tracking-tight">
                                                CHITRA
                                            </span>
                                        </ShinyRotatingBorderButton>
                                    </div>
                                    <div className="relative flex justify-center xl:justify-start">
                                        <ScrambleHover
                                            text="CHROMOSOME INTERACTIVE TOOL FOR REARRANGEMENT ANALYSIS"
                                            scrambleSpeed={50}
                                            maxIterations={8}
                                            useOriginalCharsOnly={true}
                                            className="text-[10px] xs:text-xs sm:text-base md:text-lg text-muted-foreground font-medium text-center xl:text-left"
                                        />
                                    </div>
                                </div>

                                <p className="text-sm xs:text-base sm:text-xl xl:text-2xl text-muted-foreground font-light max-w-xl mx-auto xl:ml-0">
                                    An advanced visualization tool for studying chromosomal rearrangements through interactive synteny block analysis and chromosome breakpoint mapping.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-1.5 xs:gap-2 sm:gap-4 pt-2 xs:pt-3 sm:pt-6 justify-center sm:justify-center xl:justify-start">
                                    <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm border border-white/20 dark:border-black/20 
                                        rounded-full p-1 xs:p-1.5 sm:p-3 md:p-6 shadow-lg inline-flex justify-center">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-3"
                                        >
                                            <Link
                                                href="/chitra"
                                                className="inline-flex"
                                                onClick={() => setIsLoading(true)}
                                                {...(isLoading && { target: "_self" })}
                                            >
                                                <div className="relative overflow-hidden rounded-full shadow group p-0.5">
                                                    <span className={cn(
                                                        "absolute inset-[-1000%] animate-[spin_5s_linear_infinite_reverse]",
                                                        "bg-[conic-gradient(from_90deg_at_50%_50%,#4f46e5_0%,#06b6d4_25%,#3b82f6_50%,#4f46e5_75%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#1d4ed8_0%,#2563eb_25%,#3b82f6_50%,#60a5fa_75%)]"
                                                    )} />
                                                    <Button
                                                        variant="outline"
                                                        disabled={isLoading}
                                                        className={cn(
                                                            "h-7 xs:h-8 sm:h-9 md:h-12 px-3 xs:px-4 sm:px-6 md:px-8 rounded-full font-medium",
                                                            "bg-white/80 dark:bg-black/80 backdrop-blur-xl",
                                                            "text-zinc-800 dark:text-zinc-200",
                                                            "border-0 transition-colors duration-300",
                                                            "relative z-10",
                                                            "text-[10px] xs:text-xs sm:text-sm md:text-base",
                                                            "whitespace-nowrap",
                                                            "cursor-pointer disabled:cursor-not-allowed"
                                                        )}
                                                    >
                                                        {isLoading ? (
                                                            <>
                                                                <Loader2 className="mr-1.5 xs:mr-2 h-3 xs:h-4 w-3 xs:w-4 animate-spin" />
                                                                Loading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Get Started
                                                                <ArrowRight className="ml-1.5 xs:ml-2 h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </Link>

                                            <Link
                                                href="/docs"
                                                className="inline-flex"
                                                onClick={() => setIsDocsLoading(true)}
                                            >
                                                <div className="relative overflow-hidden rounded-full shadow group p-0.5">
                                                    <span className={cn(
                                                        "absolute inset-[-1000%] animate-[spin_5s_linear_infinite_reverse]",
                                                        "bg-[conic-gradient(from_90deg_at_50%_50%,#7E22CE_0%,#EC4899_25%,#8B5CF6_50%,#7E22CE_75%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#9333EA_0%,#F472B6_25%,#A78BFA_50%,#9333EA_75%)]"
                                                    )} />
                                                    <Button
                                                        variant="outline"
                                                        disabled={isDocsLoading}
                                                        className={cn(
                                                            "h-7 xs:h-8 sm:h-9 md:h-12 px-3 xs:px-4 sm:px-6 md:px-8 rounded-full font-medium",
                                                            "bg-white/80 dark:bg-black/80 backdrop-blur-xl",
                                                            "text-zinc-800 dark:text-zinc-200",
                                                            "border-0 transition-colors duration-300",
                                                            "relative z-10",
                                                            "text-[10px] xs:text-xs sm:text-sm md:text-base",
                                                            "whitespace-nowrap",
                                                            "cursor-pointer disabled:cursor-not-allowed"
                                                        )}
                                                    >
                                                        {isDocsLoading ? (
                                                            <>
                                                                <Loader2 className="mr-1.5 xs:mr-2 h-3 xs:h-4 w-3 xs:w-4 animate-spin" />
                                                                Loading...
                                                            </>
                                                        ) : (
                                                            "Documentation"
                                                        )}
                                                    </Button>
                                                </div>
                                            </Link>

                                            <Link
                                                href="https://github.com/pranjalpruthi/CHITRA"
                                                target="_blank"
                                                onMouseEnter={() => setIsGithubHovered(true)}
                                                onMouseLeave={() => setIsGithubHovered(false)}
                                            >
                                                <div className="relative overflow-hidden rounded-full dark:bg-zinc-900 bg-white shadow border dark:border-zinc-800 group border-zinc-400 p-0.5">
                                                    <span className={cn(
                                                        "absolute inset-[-1000%] animate-[spin_5s_linear_infinite_reverse]",
                                                        "dark:bg-[conic-gradient(from_90deg_at_50%_50%,#fff_0%,#09090B_7%)]",
                                                        "bg-[conic-gradient(from_90deg_at_50%_50%,#000_0%,#fff_5%)]",
                                                        "group-hover:bg-none"
                                                    )} />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="relative h-7 xs:h-8 sm:h-9 md:h-12 w-7 xs:w-8 sm:w-9 md:w-12 rounded-full backdrop-blur-xl 
                                                            bg-zinc-50 dark:bg-zinc-900 
                                                            text-zinc-800 dark:text-zinc-200
                                                            border-0"
                                                    >
                                                        <Github className={cn(
                                                            "h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 transition-all duration-300",
                                                            isGithubHovered && "scale-110 text-blue-500 dark:text-blue-400"
                                                        )} />
                                                        <span className="sr-only">GitHub Repository</span>
                                                        {isGithubHovered && (
                                                            <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/20" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Carousel Section - Moved Above Workflow */}
            <div className="relative z-10 py-12">
                <div className="container mx-auto px-4">
                    <motion.div
                        className="relative w-full max-w-6xl mx-auto aspect-[16/9] cursor-pointer"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="relative h-full w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-sm bg-white/5">
                            <ProgressSlider
                                activeSlider={videos[0].id}
                                duration={10000}
                                className="w-full h-full"
                                items={videos}
                            >
                                <div className="relative h-full">
                                    {videos.map((video) => (
                                        <SliderWrapper
                                            key={video.id}
                                            value={video.id}
                                            className="absolute inset-0"
                                            onClick={() => setFullscreenVideo(video)}
                                        >
                                            <video
                                                suppressHydrationWarning={true}
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                                className="w-full h-full object-cover"
                                                onLoadedData={(e) => {
                                                    const videoElement = e.target as HTMLVideoElement;
                                                    switch (video.id) {
                                                        case 'v1':
                                                            videoElement.currentTime = 15;
                                                            break;
                                                        case 'v2':
                                                            videoElement.currentTime = 23;
                                                            break;
                                                        case 'v3':
                                                            videoElement.currentTime = 23;
                                                            break;
                                                        case 'v4':
                                                            videoElement.currentTime = 13;
                                                            break;
                                                        default:
                                                            videoElement.currentTime = 0;
                                                    }
                                                }}
                                            >
                                                <source src={video.src} type="video/mp4" />
                                            </video>
                                        </SliderWrapper>
                                    ))}
                                </div>

                                <SliderBtnGroup className="px-2 sm:px-4">
                                    {videos.map((video) => (
                                        <SliderBtn
                                            key={video.id}
                                            value={video.id}
                                            className={cn(
                                                "text-center p-2 lg:p-3 rounded-xl",
                                                "hover:bg-white/10 transition-colors",
                                                "w-full sm:w-[180px] lg:w-[220px] xl:w-[250px]",
                                                "flex flex-col gap-1"
                                            )}
                                            progressBarClass="bg-blue-500 h-0.5"
                                        >
                                            <h3 className={cn(
                                                "text-white font-medium",
                                                "text-xs sm:text-sm lg:text-base",
                                                "px-1",
                                                "whitespace-normal",
                                                "min-h-[2.5em]",
                                                "flex items-center justify-center"
                                            )}>
                                                {video.title}
                                            </h3>
                                        </SliderBtn>
                                    ))}
                                </SliderBtnGroup>
                            </ProgressSlider>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Workflow Section - Right after Video Carousel */}
            <div className="relative z-10 py-8 bg-white/5 backdrop-blur-sm">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-8">
                        <ScrambleHover
                            text="Workflow & Features"
                            scrambleSpeed={50}
                            maxIterations={8}
                            useOriginalCharsOnly={false}
                            characters="abcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;':\,./<>?"
                            className="text-right"
                        />
                    </h2>
                    <div className="flex flex-col gap-8">
                        {/* Draw.io Flowchart Container - Full width, larger */}
                        <div className="relative aspect-video w-full max-w-6xl mx-auto rounded-2xl overflow-hidden border border-white/20 bg-white dark:bg-zinc-900">
                            <iframe
                                frameBorder="0"
                                style={{ width: '100%', height: '100%' }}
                                src={drawioUrl}
                                title="CHITRA Workflow Diagram"
                            />
                        </div>

                        {/* Open in New Window button */}
                        <div className="flex justify-center">
                            <Link
                                href={drawioFullscreenUrl}
                                target="_blank"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm transition-colors"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Open Flowchart in New Window
                            </Link>
                        </div>

                        {/* Workflow Description - Grid of cards below */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold mb-4">Required Files</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Synteny data (CSV)</span>
                                        <div className="flex gap-1">
                                            <Link href="/example/set1/synteny_data.csv" target="_blank" className="p-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors" title="Preview">
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                            <a href="/example/set1/synteny_data.csv" download className="p-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors" title="Download">
                                                <Download className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Genome data (CSV)</span>
                                        <div className="flex gap-1">
                                            <Link href="/example/set1/genome_data.csv" target="_blank" className="p-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors" title="Preview">
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                            <a href="/example/set1/genome_data.csv" download className="p-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors" title="Download">
                                                <Download className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Reference chromosome sizes (CSV)</span>
                                        <div className="flex gap-1">
                                            <Link href="/example/set1/ref_chromosome_sizes.csv" target="_blank" className="p-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors" title="Preview">
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                            <a href="/example/set1/ref_chromosome_sizes.csv" download className="p-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors" title="Download">
                                                <Download className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold mb-4">Optional Files</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Gene annotations (CSV)</span>
                                        <div className="flex gap-1">
                                            <Link href="/example/set3/ref_gene_annotations.csv" target="_blank" className="p-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors" title="Preview">
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                            <a href="/example/set3/ref_gene_annotations.csv" download className="p-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors" title="Download">
                                                <Download className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Breakpoint data (CSV)</span>
                                        <div className="flex gap-1">
                                            <Link href="/example/set3/bp.csv" target="_blank" className="p-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors" title="Preview">
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                            <a href="/example/set3/bp.csv" download className="p-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors" title="Download">
                                                <Download className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold mb-3">Visualization Options</h3>
                                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                    <li>Linear synteny view</li>
                                    <li>Chord/circular map</li>
                                    <li>Interactive filtering</li>
                                </ul>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-4 justify-center">
                            <Link
                                href="/docs"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm transition-colors"
                            >
                                <ArrowRight className="h-4 w-4" />
                                Documentation
                            </Link>
                            <Link
                                href="https://github.com/pranjalpruthi/CHITRA"
                                target="_blank"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-400 text-sm transition-colors"
                            >
                                <Github className="h-4 w-4" />
                                Source Code
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* DataFlowDiagram section */}
            <div className="mt-2 hidden md:block">
                <div className="container mx-auto px-4">
                    <DataFlowDiagram />
                </div>
            </div>

            <Dialog open={!!fullscreenVideo} onOpenChange={() => setFullscreenVideo(null)}>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
                    {fullscreenVideo && (
                        <video
                            autoPlay
                            controls
                            className="w-full h-full object-contain"
                        >
                            <source src={fullscreenVideo.src} type="video/mp4" />
                        </video>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}
