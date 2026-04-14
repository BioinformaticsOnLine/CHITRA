"use client"
import Link from 'next/link';
import Image from 'next/image';
import { Github, Copy, CheckCheck, Building } from 'lucide-react';
import { motion, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import HyperText from '../ui/hyper-text';
import { Button } from '../ui/button';
import AnimatedText from '../ui/animated-text';

export default function Footer() {
    const ref = useRef(null);
    const isInView = useInView(ref);
    const [hasCopied, setHasCopied] = useState(false);

    const citation = `Pruthi, P., Narayan, J., Agarwal, P., Shukla, N., & Bhatia, A. (2024). CHITRA: Chromosome Interactive Tool for Rearrangement Analysis. CSIR-IGIB.`;

    const handleCopyCitation = async () => {
        await navigator.clipboard.writeText(citation);
        setHasCopied(true);
        toast.success("Citation copied to clipboard!");
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <footer className="relative mt-auto border-t bg-white/95 dark:bg-black/95 backdrop-blur-xl">
            <div className="mx-auto max-w-screen-xl px-3 py-4 sm:px-4 sm:py-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Logo and Brand Section */}
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-black/60 dark:text-white/60 hidden sm:inline">Supported by</span>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Image
                                src="/assets/logos/igib.png"
                                alt="CSIR-IGIB Logo"
                                width={80}
                                height={40}
                                className="object-contain h-8"
                            />
                            <Image
                                src="/assets/logos/csir.png"
                                alt="CSIR Logo"
                                width={80}
                                height={40}
                                className="object-contain h-8"
                            />
                            <Image
                                src="/assets/logos/dst.png"
                                alt="DST Logo"
                                width={80}
                                height={40}
                                className="object-contain h-8"
                            />
                            <Image
                                src="/assets/logos/rf.png"
                                alt="Rockefeller Logo"
                                width={80}
                                height={40}
                                className="object-contain h-8"
                            />
                            <Image
                                src="/assets/logos/aiims.png"
                                alt="AIIMS Logo"
                                width={80}
                                height={40}
                                className="object-contain h-8"
                            />
                        </div>
                    </div>

                    {/* Status, Citation & Resources - Inline */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Status Badge */}
                        <div className="flex items-center gap-2 bg-zinc-100/80 dark:bg-zinc-900/50 rounded-full px-2 py-1 border border-black/10 dark:border-white/10">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs text-black/60 dark:text-white/60">All systems operational</span>
                        </div>

                        {/* Citation Button */}
                        <Button
                            variant="outline"
                            className={cn(
                                "h-7 px-2 text-xs",
                                "bg-zinc-100/80 dark:bg-zinc-900/50 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/50",
                                "text-black/80 dark:text-white/80 hover:text-black/90 dark:hover:text-white/90",
                                "border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20",
                                "backdrop-blur-md backdrop-saturate-150",
                                "transition-all duration-300"
                            )}
                            onClick={handleCopyCitation}
                        >
                            {hasCopied ? (
                                <>
                                    <CheckCheck className="mr-1 h-3 w-3" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-1 h-3 w-3" />
                                    Copy Citation
                                </>
                            )}
                        </Button>

                        {/* Resources Links */}
                        <div className="flex items-center gap-3">
                            {[
                                { name: "Docs", url: "/docs" },
                                { name: "Lab", url: "https://jitendralab.igib.res.in" },
                                { name: "GitHub", url: "https://github.com/pranjalpruthi/CHITRA" }
                            ].map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.url}
                                    className="text-black/60 dark:text-white/60 hover:text-black/90 dark:hover:text-white/90 transition-colors text-xs"
                                    target={item.url.startsWith('http') ? '_blank' : '_self'}
                                    rel={item.url.startsWith('http') ? 'noopener noreferrer' : ''}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                    className="mt-4 pt-3 border-t border-black/10 dark:border-white/10"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                            <Building className="h-6 w-6 text-black/60 dark:text-white/60" />
                            <div>
                                <p className="text-xs font-medium text-black/90 dark:text-white/90">CSIR-IGIB</p>
                                <p className="text-[10px] text-black/60 dark:text-white/60">Lab of Bioinformatics and Big Data</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px] text-black/60 dark:text-white/60 sm:justify-end">
                            <Link href="/privacy" className="hover:text-black/90 dark:hover:text-white/90 transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="hover:text-black/90 dark:hover:text-white/90 transition-colors">
                                Terms of Service
                            </Link>
                            <span>&copy; {new Date().getFullYear()} CHITRA</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Animated text - made more subtle */}
            <div className="relative h-16 w-full overflow-hidden opacity-10 dark:opacity-20 select-none pointer-events-none">
                <AnimatedText
                    text="CHITRA"
                    className="!text-[8vw] font-black tracking-tighter text-black/80 dark:text-white/80"
                />
            </div>
        </footer>
    );
}