"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Loader2, Link as LinkIcon, X, FileText, Database, GitGraph } from "lucide-react";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { ExampleFilesDrawer } from "./example-files-drawer";
import Link from "next/link";
import Image from "next/image";

interface GuideStep {
    title: string;
    description: string;
    image?: string;
    href: string;
}

const guideSteps: GuideStep[] = [
    {
        title: "Chromosome Visualization",
        description: "Interactive visualization of chromosomal data with detailed chromosome representations and synteny blocks.",
        image: "/media/i1.webp",
        href: "/docs/visualization#visualising-the-data",
    },
    {
        title: "Multi-Species Comparison",
        description: "Compare genomic data across multiple species to identify evolutionary relationships and conserved regions.",
        image: "/media/i2.webp",
        href: "/docs/how-to-use#2-multiple-synteny",
    },
    {
        title: "Syntenic Relationships",
        description: "Explore syntenic relationships between chromosomes with interactive ribbons and detailed block information.",
        image: "/media/i3.webp",
        href: "/docs/visualization#synteny-visualization",
    },
    {
        title: "Interactive Analysis",
        description: "Real-time genomic data analysis with filtering, zooming, and customizable visualization options.",
        image: "/media/i4.webp",
        href: "/docs/features",
    },
];

const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

interface GuideSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GuideSheet({ open, onOpenChange }: GuideSheetProps) {
    const [activeStep, setActiveStep] = useState(0);
    const [isExampleDrawerOpen, setIsExampleDrawerOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const openLightbox = (imageSrc: string) => {
        setSelectedImage(imageSrc);
        setIsLightboxOpen(true);
    };

    const closeLightbox = () => {
        setIsLightboxOpen(false);
        setSelectedImage(null);
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
            <DrawerContent className="fixed bottom-0 left-0 right-0 rounded-t-[10px] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-indigo-100 dark:border-border shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] dark:shadow-none">
                <div className="mx-auto w-full max-w-7xl">
                    {/* Sticky Header */}
                    <div className="sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-10 pt-4 rounded-t-[10px]">
                        <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-indigo-100 dark:bg-muted mb-4 md:hidden" />
                        <DrawerHeader className="px-4">
                            <DrawerTitle className="text-2xl font-medium">Getting Started with CHITRA</DrawerTitle>
                            <DrawerDescription className="text-base text-muted-foreground">
                                Follow this guide to learn how to use CHITRA effectively for your chromosome analysis.
                            </DrawerDescription>
                        </DrawerHeader>
                        <Separator className="my-2" />
                    </div>

                    {/* Scrollable Content */}
                    <div className="h-[calc(90vh-120px)] overflow-y-auto px-4 pb-4">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="mt-6 space-y-8 md:grid md:grid-cols-2 md:gap-8 md:space-y-0"
                        >
                            {/* Left Column - Clickable Steps */}
                            <motion.div
                                className="md:col-span-1"
                                variants={fadeIn}
                            >
                                <h3 className="text-lg font-medium mb-4">Quick Start Guide</h3>
                                <motion.div
                                    className="space-y-4"
                                    variants={staggerContainer}
                                >
                                    {guideSteps.map((step, index) => (
                                        <div
                                            key={step.title}
                                            className={cn(
                                                "w-full rounded-lg border transition-all duration-200",
                                                activeStep === index
                                                    ? "bg-indigo-50/80 dark:bg-primary/10 border-indigo-200 dark:border-primary/50 ring-1 ring-indigo-200 dark:ring-primary/20 shadow-sm"
                                                    : "bg-card/50 hover:bg-indigo-50/50 dark:hover:bg-accent/10 hover:border-indigo-100 dark:hover:border-border"
                                            )}
                                        >
                                            <motion.div
                                                variants={fadeIn}
                                                className="p-4 cursor-pointer"
                                                onClick={() => setActiveStep(index)}
                                            >
                                                <div className="flex items-center justify-between gap-3 mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors shadow-sm",
                                                            activeStep === index
                                                                ? "bg-indigo-500 dark:bg-primary text-white dark:text-primary-foreground"
                                                                : "bg-indigo-100 dark:bg-primary/10 text-indigo-600 dark:text-primary"
                                                        )}>
                                                            {index + 1}
                                                        </div>
                                                        <h4 className="text-base font-medium">{step.title}</h4>
                                                    </div>
                                                    <Link
                                                        href={step.href}
                                                        target="_blank"
                                                        className={cn(
                                                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium hover:bg-background/80 transition-colors border shadow-sm",
                                                            activeStep === index
                                                                ? "text-indigo-600 dark:text-primary border-indigo-200/60 dark:border-primary/20 bg-white/60 dark:bg-background/50"
                                                                : "text-muted-foreground border-transparent bg-muted/50"
                                                        )}
                                                        onClick={(e) => e.stopPropagation()}
                                                        title="View Documentation"
                                                    >
                                                        <BookOpen className="h-3.5 w-3.5" />
                                                        <span>Read more</span>
                                                    </Link>
                                                </div>
                                                <p className="text-sm text-muted-foreground pl-11">{step.description}</p>
                                            </motion.div>
                                        </div>
                                    ))}
                                </motion.div>
                            </motion.div>

                            {/* Right Column - Image Display */}
                            <motion.div
                                className="space-y-8 md:col-span-1"
                                variants={fadeIn}
                            >
                                <div className="w-full relative">
                                    <div
                                        className="relative aspect-video rounded-xl overflow-hidden border bg-zinc-900/50 cursor-zoom-in"
                                        onClick={() => guideSteps[activeStep].image && openLightbox(guideSteps[activeStep].image!)}
                                    >
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeStep}
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
                                                    src={guideSteps[activeStep].image || "/media/i1.webp"}
                                                    alt={guideSteps[activeStep].title}
                                                    fill
                                                    className="object-cover"
                                                    priority
                                                />
                                            </motion.div>
                                        </AnimatePresence>

                                        {/* Image indicator dots */}
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                                            {guideSteps.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveStep(index);
                                                    }}
                                                    className={cn(
                                                        "w-2 h-2 rounded-full transition-all",
                                                        activeStep === index
                                                            ? "bg-white w-6"
                                                            : "bg-white/50 hover:bg-white/75"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Current step title below image */}
                                    <div className="mt-3 text-center">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {guideSteps[activeStep].title}
                                        </p>
                                    </div>
                                </div>

                                <Separator className="my-8" />

                                <div>
                                    <h3 className="text-lg font-medium mb-4">Additional Resources</h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Link href="/docs" target="_blank" rel="noopener noreferrer" className="rounded-lg border bg-card/50 p-4 hover:bg-accent/10 transition-colors">
                                            <h4 className="font-medium mb-1">Documentation</h4>
                                            <p className="text-sm text-muted-foreground">Detailed guides and references</p>
                                        </Link>
                                        <button onClick={() => setIsExampleDrawerOpen(true)} className="text-left rounded-lg border bg-card/50 p-4 hover:bg-accent/10 transition-colors">
                                            <h4 className="font-medium mb-1">Example Datasets</h4>
                                            <p className="text-sm text-muted-foreground">Sample data to get started</p>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Sticky Footer */}
                    <DrawerFooter className="sticky bottom-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-10 border-t border-indigo-100 dark:border-border">
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
                            <DrawerClose asChild>
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-600 border-red-200 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 dark:border-red-900"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Close
                                </Button>
                            </DrawerClose>
                            <Link href="/docs" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Documentation
                                </Button>
                            </Link>
                            <ExampleFilesDrawer onLoadExample={() => { }}>
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900"
                                >
                                    <Database className="h-4 w-4 mr-2" />
                                    Example Datasets
                                </Button>
                            </ExampleFilesDrawer>
                            <Link
                                href="https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&edit=_blank&layers=1&nav=1&title=Chitra-flow.drawio&dark=0#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D17w3unzRnXwZJFQm252RN1HcSqaLhxKEm%26export%3Ddownload"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto"
                            >
                                <Button
                                    variant="outline"
                                    className="w-full bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-950/30 dark:hover:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900"
                                >
                                    <GitGraph className="h-4 w-4 mr-2" />
                                    Workflow
                                </Button>
                            </Link>
                        </div>
                    </DrawerFooter>
                </div>
                <ExampleFilesDrawer open={isExampleDrawerOpen} onOpenChange={setIsExampleDrawerOpen} onLoadExample={() => { }} />

                {isLightboxOpen && selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-xs"
                        onClick={closeLightbox}
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative max-w-[90vw] max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selectedImage}
                                alt="Full view"
                                className="object-contain w-full h-full rounded-lg shadow-2xl"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/75 rounded-full"
                                onClick={closeLightbox}
                            >
                                <X className="h-6 w-6" />
                                <span className="sr-only">Close lightbox</span>
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </DrawerContent>
        </Drawer>
    );
}
