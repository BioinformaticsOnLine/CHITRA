"use client";

import { Star, FileQuestion, Cpu, FileInput, Database, Settings, HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { motion } from "motion/react";

export default function OpenSource() {
    const faqs = [
        {
            id: "1",
            icon: FileQuestion,
            question: "What is CHITRA?",
            answer: "CHITRA (Chromosome Interactive Tool for Rearrangement Analysis) is an advanced bioinformatics tool for studying chromosomal rearrangements through interactive visualizations of synteny blocks and chromosome breakpoints."
        },
        {
            id: "2",
            icon: Cpu,
            question: "What are the main features?",
            answer: "CHITRA offers Synteny Block Visualization, Chromosome Breakpoint Analysis, Interactive Visualization Interface, and Multi-format Data Export. Users can compare genomes and zoom into specific chromosomal regions with dynamic adjustments."
        },
        {
            id: "3",
            icon: FileInput,
            question: "What input files are required?",
            answer: "Mandatory files include Synteny Data, Genome Data, and Reference Chromosome Size (all in CSV format). Optional files include Gene Annotations and Breakpoint Data."
        },
        {
            id: "4", 
            icon: Database,
            question: "What example datasets are available?",
            answer: "CHITRA provides three types of example datasets: Basic Synteny (3 genomes comparison), Multiple Synteny (multiple genomes comparison), and Annotated Genome (with additional gene annotations and breakpoints)."
        }
    ,
        {
            id: "5",
            icon: Settings,
            question: "What interactive features are available?",
            answer: "CHITRA offers zoom controls, image adjustment arrows, scrolling bars, background color modes (black/white), chord map settings, and a movable navigation bar for optimal visualization and analysis."
        },
        {
            id: "6",
            icon: HelpCircle,
            question: "Need additional help?",
            answer: "If you have questions not covered here, please reach out to us at mail@chitra.com. Our team is happy to assist with technical questions, feature requests, or collaboration opportunities."
        }
    ];

    return (
        <div className="relative w-full">
            <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
                <motion.div 
                    className="space-y-4 text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium 
                        bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300 
                        backdrop-blur-xs border border-blue-500/20 dark:border-blue-400/20
                        shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                        FAQ
                    </div>
                    <div className="text-3xl md:text-4xl font-bold tracking-tight 
                        bg-linear-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
                        Common Questions about CHITRA
                    </div>
                </motion.div>

                <motion.div 
                    className="mt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Accordion type="single" collapsible className="w-full" defaultValue="1">
                        {faqs.map((item) => (
                            <AccordionItem 
                                value={item.id} 
                                key={item.id} 
                                className="border border-black/10 dark:border-white/10 
                                    rounded-lg mb-4 backdrop-blur-xs bg-black/5 dark:bg-white/5"
                            >
                                <AccordionTrigger className="px-4 py-4 text-[15px] hover:no-underline">
                                    <span className="flex items-center gap-3">
                                        <item.icon
                                            size={18}
                                            strokeWidth={2}
                                            className="shrink-0 opacity-60"
                                            aria-hidden="true"
                                        />
                                        <span className="font-medium">{item.question}</span>
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4 ps-11 text-sm text-muted-foreground">
                                    {item.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </motion.div>

                {/* Contact Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12"
                >
                    <Link 
                        href="https://github.com/pranjalpruthi" 
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button 
                            variant="outline" 
                            className="h-12 px-6 gap-2 text-base
                                bg-[#FDF4E7]/80 dark:bg-[#2D2416]/80 text-[#F5A524] 
                                hover:bg-[#FCE9CF] dark:hover:bg-[#3D321F]
                                border-[#F5A524]/30 hover:border-[#F5A524]/50
                                transition-all duration-300 rounded-lg font-medium
                                backdrop-blur-xs shadow-[0_8px_16px_rgba(245,165,36,0.1)]"
                        >
                            <Star className="w-5 h-5 fill-[#F5A524]" />
                            Star us on GitHub
                        </Button>
                    </Link>
                    <Link href="mailto:mail@chitra.com">
                        <Button 
                            variant="outline" 
                            className="h-12 px-6 gap-2 text-base
                                bg-blue-500/10 text-blue-600 dark:text-blue-300
                                hover:bg-blue-500/20 
                                border-blue-500/30 hover:border-blue-500/50
                                transition-all duration-300 rounded-lg font-medium
                                backdrop-blur-xs"
                        >
                            Contact Us
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
