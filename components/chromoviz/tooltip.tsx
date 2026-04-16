"use client";

import { motion, AnimatePresence, Variants } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft, AlertTriangle } from "lucide-react";
import { ChromosomeData, SyntenyData, GeneAnnotation, ChromosomeBreakpoint } from "@/app/types";
import React, { ReactElement } from "react";

const glassEffect = cn(
  "bg-linear-to-br from-white/90 to-white/80 dark:from-gray-950/90 dark:to-gray-950/80",
  "backdrop-blur-md",
  "border border-white/20 dark:border-gray-800/20",
  "shadow-lg shadow-black/5",
  "hover:shadow-xl transition-shadow duration-300"
);

export function getChromosomeTooltip(chr: ChromosomeData, maxChrSizeMb: number): ReactElement {
  const mbSize = (chr.chr_size_bp / 1_000_000).toFixed(2);
  const centromereInfo = chr.centromere_start && chr.centromere_end
    ? {
      start: (chr.centromere_start / 1_000_000).toFixed(2),
      end: (chr.centromere_end / 1_000_000).toFixed(2)
    }
    : null;

  return (
    <div className="space-y-4 p-1 min-w-[300px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-linear-to-r from-indigo-50 to-blue-50 text-gray-800 dark:from-indigo-950/30 dark:to-blue-950/30 dark:text-gray-100 dark:border-blue-800/30"
          >
            Chromosome
          </Badge>
          <span className="text-sm font-medium dark:text-gray-200">
            {chr.chr_id}
          </span>
        </div>
        <Badge
          variant="secondary"
          className="bg-blue-100/50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100 dark:border-blue-800/30"
        >
          {mbSize} Mb
        </Badge>
      </div>

      {/* Genome Info */}
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-800 dark:bg-gray-900/50 dark:text-gray-100 dark:border-gray-700"
        >
          Genome
        </Badge>
        <span className="text-sm text-muted-foreground dark:text-gray-300">
          {chr.genome_name}
        </span>
      </div>

      {/* Properties */}
      <div className="grid grid-cols-2 gap-3">
        {/* Type */}
        <div className="space-y-1.5">
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-800 dark:bg-gray-900/50 dark:text-gray-100 dark:border-gray-700"
          >
            Type
          </Badge>
          <div className="text-sm text-muted-foreground dark:text-gray-300 pl-1">
            {chr.chr_type || 'Unknown'}
          </div>
        </div>

        {/* Structure */}
        {chr.centromere_start && (
          <div className="space-y-1.5">
            <Badge
              variant="outline"
              className="bg-gray-50 text-gray-800 dark:bg-gray-900/50 dark:text-gray-100 dark:border-gray-700"
            >
              Structure
            </Badge>
            <div className="text-sm text-muted-foreground dark:text-gray-300 pl-1">
              {chr.centromere_start ? 'Metacentric/Submetacentric' : 'Acrocentric'}
            </div>
          </div>
        )}
      </div>

      {/* Centromere Info */}
      {centromereInfo && (
        <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="bg-gray-50 text-gray-800 dark:bg-gray-900/50 dark:text-gray-100 dark:border-gray-700"
            >
              Centromere Position
            </Badge>
            <Badge
              variant="secondary"
              className="bg-indigo-100/50 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100 dark:border-indigo-800/30"
            >
              {centromereInfo.start}-{centromereInfo.end} Mb
            </Badge>
          </div>

          {/* Centromere Position Visualization */}
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 dark:bg-indigo-600"
              style={{
                width: `${((Number(centromereInfo.end) - Number(centromereInfo.start)) / (chr.chr_size_bp / 1_000_000)) * 100}%`,
                marginLeft: `${(Number(centromereInfo.start) / (chr.chr_size_bp / 1_000_000)) * 100}%`,
                transition: 'all 0.3s ease-in-out'
              }}
            />
          </div>
        </div>
      )}

      {/* Size Comparison */}
      <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-800 dark:bg-gray-900/50 dark:text-gray-100 dark:border-gray-700"
          >
            Size Category
          </Badge>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              Number(mbSize) > 100 ? "bg-green-100 text-green-900 dark:bg-green-950/50 dark:text-green-100 dark:border-green-800/30" :
                Number(mbSize) > 50 ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-100 dark:border-yellow-800/30" :
                  "bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-100 dark:border-orange-800/30"
            )}
          >
            {Number(mbSize) > 100 ? 'Large (>100Mb)' :
              Number(mbSize) > 50 ? 'Medium (50-100Mb)' :
                'Small (<50Mb)'}
          </Badge>
        </div>

        {/* Size Visualization */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600"
            style={{
              width: `${(Number(mbSize) / Math.max(maxChrSizeMb, Number(mbSize))) * 100}%`,
              transition: 'width 0.3s ease-in-out'
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center -mt-1">
          Size relative to a {maxChrSizeMb.toFixed(0)}Mb chromosome
        </p>
      </div>
    </div>
  );
}

export function SelectionToast({ message, show }: { message: string; show: boolean }) {
  const toastVariants: Variants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    },
  };

  const isSelected = message.includes("Selected");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={toastVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "fixed top-6 left-6 z-100",
            "px-8 py-4 rounded-2xl text-base font-bold text-white shadow-2xl",
            "border border-white/30 backdrop-blur-md",
            "ring-2 ring-white/20",
            isSelected
              ? "bg-linear-to-br from-emerald-500 via-green-500 to-teal-500"
              : "bg-linear-to-br from-red-500 via-rose-500 to-pink-500"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-3 h-3 rounded-full animate-pulse",
              isSelected ? "bg-emerald-200" : "bg-red-200"
            )} />
            <span className="tracking-wide">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function getBreakpointTooltip(breakpoint: ChromosomeBreakpoint): ReactElement {
  const formatBp = (bp: number) => `${(bp / 1_000_000).toFixed(2)} Mb`;
  const sizeMb = ((breakpoint.ref_end - breakpoint.ref_start) / 1_000_000).toFixed(3);

  return (
    <div className="space-y-4 p-4 min-w-[320px] bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-linear-to-r from-orange-50 to-red-50 text-orange-800 border-orange-200 px-3 py-1.5 font-semibold dark:from-orange-950/40 dark:to-red-950/40 dark:text-orange-100 dark:border-orange-800/50"
          >
            <AlertTriangle className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
            Breakpoint
          </Badge>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">
            {breakpoint.breakpoint}
          </span>
        </div>
      </div>

      {/* Content sections */}
      <div className="space-y-3">
        {/* Chromosome info */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 font-medium"
            >
              Chromosome
            </Badge>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {breakpoint.ref_chr}
            </span>
          </div>
        </div>

        {/* Position info */}
        <div className="flex items-center justify-between p-3 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800/30">
          <span className="text-sm font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide">
            Position
          </span>
          <Badge
            variant="secondary"
            className="bg-white dark:bg-gray-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 px-3 py-1 font-mono text-sm"
          >
            {formatBp(breakpoint.ref_start)} - {formatBp(breakpoint.ref_end)}
          </Badge>
        </div>

        {/* Size information */}
        <div className="flex items-center justify-between p-3 bg-linear-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
          <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 uppercase tracking-wide">
            Size
          </span>
          <Badge
            variant="secondary"
            className="bg-white dark:bg-gray-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 px-3 py-1 font-mono text-sm"
          >
            {sizeMb} Mb
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function getSyntenyTooltip(link: SyntenyData, maxSyntenySizeMb: number): ReactElement {
  const refMb = {
    start: (link.ref_start / 1_000_000).toFixed(2),
    end: (link.ref_end / 1_000_000).toFixed(2)
  };
  const queryMb = {
    start: (link.query_start / 1_000_000).toFixed(2),
    end: (link.query_end / 1_000_000).toFixed(2)
  };
  const size = ((link.ref_end - link.ref_start) / 1_000_000).toFixed(2);
  const percentage = (Number(size) / Math.max(maxSyntenySizeMb, Number(size))) * 100;

  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="bg-linear-to-r from-blue-50 to-purple-50 text-gray-800 dark:from-blue-950/30 dark:to-purple-950/30 dark:text-gray-100 dark:border-blue-800/30">
          Syntenic Block
        </Badge>
        <Badge
          variant="secondary"
          className={cn(
            "flex items-center gap-1",
            link.query_strand === '+'
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 hover:bg-blue-200/80"
              : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200/80"
          )}
        >
          {link.query_strand === '+' ? (
            <>Forward (+) <ArrowRight className="h-3 w-3" /></>
          ) : (
            <><ArrowLeft className="h-3 w-3" /> Reverse (-)</>
          )}
        </Badge>
      </div>

      {/* Reference Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100 dark:border-blue-800/30">
            Reference Range
          </Badge>
          <span className="text-sm text-muted-foreground">{link.ref_name}</span>
        </div>
        <div className="flex items-center justify-between px-2">
          <span className="text-sm font-medium dark:text-gray-200">{link.ref_chr}</span>
          <Badge variant="secondary" className="bg-blue-100/50 dark:bg-blue-950/50 dark:text-blue-100 dark:border-blue-800/30">
            {refMb.start}-{refMb.end} Mb
          </Badge>
        </div>
      </div>

      {/* Query Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-900 dark:bg-purple-950/50 dark:text-purple-100 dark:border-purple-800/30">
            Query Range
          </Badge>
          <span className="text-sm text-muted-foreground">{link.query_name}</span>
        </div>
        <div className="flex items-center justify-between px-2">
          <span className="text-sm font-medium dark:text-gray-200">{link.query_chr}</span>
          <Badge variant="secondary" className="bg-purple-100/50 dark:bg-purple-950/50 dark:text-purple-100 dark:border-purple-800/30">
            {queryMb.start}-{queryMb.end} Mb
          </Badge>
        </div>
      </div>

      {/* Properties Section */}
      <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-gray-50 dark:bg-gray-900/50 dark:text-gray-100 dark:border-gray-700">
            Synteny Block Size
          </Badge>
          <span className="text-sm font-medium dark:text-gray-200">{size} Mb</span>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-gray-50 dark:bg-gray-900/50 dark:text-gray-100 dark:border-gray-700">
            Size Category
          </Badge>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              Number(size) > 10 ? "bg-green-100 text-green-900 dark:bg-green-950/50 dark:text-green-100 dark:border-green-800/30" :
                Number(size) > 5 ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-100 dark:border-yellow-800/30" :
                  Number(size) > 1 ? "bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-100 dark:border-orange-800/30" :
                    "bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-100 dark:border-red-800/30"
            )}
          >
            {calculateConservation(Number(size))}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600"
          style={{
            width: `${percentage}%`,
            transition: 'width 0.3s ease-in-out'
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground -mt-1">
        <span>Size relative to a {maxSyntenySizeMb.toFixed(0)}Mb synteny block</span>
        <span>{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function calculateConservation(sizeMb: number): string {
  if (sizeMb > 10) return 'Large (>10Mb)';
  if (sizeMb > 5) return 'Medium (5-10Mb)';
  if (sizeMb > 1) return 'Small (1-5Mb)';
  return 'Micro (<1Mb)';
}

export interface GeneTooltipData {
  symbol: string;
  strand: '+' | '-';
  class: string;
  position: string;
  isCluster?: boolean;
  geneCount?: number;
  name?: string;
  locus_tag?: string;
  GeneID?: string;
  genomic_accession: string;
  start: number;
  end: number;
}

interface TooltipProps {
  info: any;
  enabled?: boolean;
  showTooltips?: boolean;
}

export function Tooltip({
  info,
  enabled = true,
  showTooltips = true
}: TooltipProps) {
  if (!enabled || !showTooltips || !info || !info.isOpen) return null;

  const tooltipVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 10
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10
    }
  };

  return (
    <AnimatePresence>
      {info.isOpen && (
        <motion.div
          variants={tooltipVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "fixed z-90",
            "right-4 top-20",
            "w-[calc(100vw-2rem)] sm:w-auto",
            "min-w-[280px] max-w-[350px]",
            glassEffect,
            "rounded-lg",
            "before:absolute before:inset-0 before:rounded-lg",
            "before:bg-linear-to-br before:from-blue-500/10 before:to-purple-500/10",
            "dark:before:from-blue-500/5 dark:before:to-purple-500/5",
            "transition-transform hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          {typeof info.content === 'string' ? (
            <div className="p-3 text-sm whitespace-pre-line">
              {info.content}
            </div>
          ) : (
            info.content
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const GENE_ANNOTATION_CONFIG = {
  HEIGHT: 8,
  SPACING: 2,
  COLORS: {
    transcribed_pseudogene: '#94a3b8',
    protein_coding: '#dc2626',
    pseudogene: '#dc2626',
    ncRNA: '#16a34a',
    tRNA: '#8b5cf6',
    rRNA: '#ec4899',
    default: '#6b7280'
  } as const,
}

interface HoverTooltipProps {
  hoveredBlock: SyntenyData | null;
  hoveredChromosome: {
    size: number;
    isRef: boolean;
    position?: number;
    gene?: GeneAnnotation;
  } | null,
  selectedBlock: SyntenyData;
  refChromosome?: ChromosomeData | null;
  queryChromosome?: ChromosomeData | null;
  className?: string;
  showTooltips?: boolean;
}

export function HoverTooltip({
  hoveredBlock,
  hoveredChromosome,
  selectedBlock,
  refChromosome,
  queryChromosome,
  className,
  showTooltips = true
}: HoverTooltipProps) {
  const [isRendered, setIsRendered] = React.useState(false);

  React.useEffect(() => {
    if (hoveredBlock || hoveredChromosome) {
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => setIsRendered(false), 200);
      return () => clearTimeout(timer);
    }
  }, [hoveredBlock, hoveredChromosome]);

  if (!showTooltips || !isRendered) return null;

  const tooltipVariants: Variants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.5
      }
    }
  };

  const contentVariants = {
    hidden: {
      opacity: 0,
      y: 5,
      transition: {
        duration: 0.1
      }
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.15,
        delay: 0.05
      }
    }
  };

  const getPositionDisplay = (position: number | undefined, size: number) => {
    if (!position) return `${(size / 1_000_000).toFixed(2)} Mb total`;
    const positionMb = Math.abs(position) / 1_000_000;
    return `${positionMb.toFixed(2)} Mb`;
  };

  const InfoItem = ({ label, value, icon, valueClassName }: { label: string, value: React.ReactNode, icon?: React.ReactNode, valueClassName?: string }) => (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
      <span className={cn("text-sm font-semibold text-gray-900 dark:text-white", valueClassName)}>{value}</span>
    </div>
  );

  const Divider = () => <div className="w-px h-6 bg-gray-900/10 dark:bg-white/10" />;

  return (
    <>
      <AnimatePresence mode="sync">
        {hoveredBlock && (
          <motion.div
            key="block-tooltip"
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={cn(
              "fixed top-20 left-1/2 -translate-x-1/2 z-90",
              "w-auto max-w-4xl",
              "bg-white/95 dark:bg-gray-900/95",
              "backdrop-blur-md",
              "border border-gray-300 dark:border-gray-600",
              "rounded-full shadow-xl shadow-black/25",
              "ring-1 ring-black/5 dark:ring-white/10",
              className
            )}
          >
            <div className="flex items-center h-12 px-3 space-x-4">
              <div className="flex items-center gap-2 pr-2">
                <div className="w-2.5 h-2.5 rounded-full bg-linear-to-br from-blue-400 to-purple-500 shadow-lg" />
                <span className="text-sm font-bold text-gray-800 dark:text-white tracking-wide">Synteny</span>
              </div>
              <Divider />
              <InfoItem
                label="Ref"
                value={`${hoveredBlock.ref_chr}: ${(hoveredBlock.ref_start / 1_000_000).toFixed(2)}-${(hoveredBlock.ref_end / 1_000_000).toFixed(2)}Mb`}
              />
              <Divider />
              <InfoItem
                label="Query"
                value={`${hoveredBlock.query_chr}: ${(hoveredBlock.query_start / 1_000_000).toFixed(2)}-${(hoveredBlock.query_end / 1_000_000).toFixed(2)}Mb`}
              />
              <Divider />
              <InfoItem
                label="Strand"
                value={hoveredBlock.query_strand}
                icon={hoveredBlock.query_strand === '+'
                  ? <ArrowRight className="w-4 h-4 text-green-500 dark:text-green-400" />
                  : <ArrowLeft className="w-4 h-4 text-red-500 dark:text-red-400" />}
              />
              <Divider />
              <InfoItem
                label="Size"
                value={`${((hoveredBlock.ref_end - hoveredBlock.ref_start) / 1_000_000).toFixed(2)}Mb`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="sync">
        {hoveredChromosome && !hoveredBlock && (
          <motion.div
            key="chromosome-tooltip"
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={cn(
              "fixed right-4 top-20 z-90",
              "w-[calc(100vw-2rem)] sm:w-auto",
              "min-w-[280px] max-w-[350px]",
              glassEffect,
              "rounded-lg",
              "before:absolute before:inset-0 before:rounded-lg",
              "before:bg-linear-to-br before:from-blue-500/10 before:to-purple-500/10",
              "dark:before:from-blue-500/5 dark:before:to-purple-500/5",
              "transition-transform hover:scale-[1.02] active:scale-[0.98]",
              className
            )}
          >
            <div className="relative space-y-3 p-3">
              {/* Position Content */}
              <div className="flex items-center justify-between group">
                <Badge
                  variant="outline"
                  className="bg-linear-to-r from-indigo-50 to-blue-50 text-gray-800 dark:from-indigo-950/30 dark:to-blue-950/30 dark:text-gray-100 dark:border-blue-800/30 transition-all group-hover:from-indigo-100 group-hover:to-blue-100"
                >
                  {hoveredChromosome.isRef ? 'Reference Position' : `Query: ${queryChromosome?.genome_name} ${queryChromosome?.chr_id}`}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-blue-100/50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100 dark:border-blue-800/30 transition-colors group-hover:bg-blue-200/50"
                >
                  {getPositionDisplay(hoveredChromosome.position, hoveredChromosome.size)}
                </Badge>
              </div>

              {/* Gene Content */}
              {hoveredChromosome.gene && (
                <motion.div
                  key="gene-content"
                  variants={contentVariants}
                  className="p-2 rounded-md hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="outline"
                      className="bg-gray-50 text-gray-800 dark:bg-gray-900/50 dark:text-gray-100 dark:border-gray-700"
                    >
                      Gene
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-gray-100/50 dark:bg-gray-900/50 dark:text-gray-100"
                    >
                      {hoveredChromosome.gene.class || 'NA'}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Symbol:</span>
                      <span>{hoveredChromosome.gene.symbol || 'NA'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Name:</span>
                      <span className="truncate">{hoveredChromosome.gene.name || 'NA'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Position:</span>
                      <span>
                        {hoveredChromosome.gene.start?.toLocaleString()}-
                        {hoveredChromosome.gene.end?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Strand:</span>
                      <span>{hoveredChromosome.gene.strand || 'NA'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Gene ID:</span>
                      <span>{hoveredChromosome.gene.GeneID || 'NA'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Locus Tag:</span>
                      <span>{hoveredChromosome.gene.locus_tag || 'NA'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Accession:</span>
                      <span>{hoveredChromosome.gene.genomic_accession || 'NA'}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
