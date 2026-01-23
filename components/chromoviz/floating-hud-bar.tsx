'use client'

import { motion, useMotionValue } from "motion/react";
import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  TableProperties,
  Maximize2,
  Minimize2,
  MessageCircle,
  MessageCircleOff,
  RotateCcw,
  Upload,
  Home,
  GripVertical,
  LayoutGrid,
  LayoutPanelTop,
  Database,
  Moon,
  Sun,
  X,
  FileSpreadsheet,
  ChevronRight,
  Table as TableIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FilterDrawer } from '@/components/chromoviz/filter-drawer';
import { UserActions } from './user-actions';
import { FileUploaderGroup } from '@/components/chromoviz/file-uploader';
import { ExampleFilesDrawer } from "@/components/chromoviz/example-files-drawer";
import { DataViewerDrawer } from "./data-viewer-drawer";
import { cn } from "@/lib/utils";
import { ChromosomeData, SyntenyData } from "@/app/types";
import { useTheme } from "next-themes";


interface FloatingHUDBarProps {
  user?: any; // Deprecated, handled internally by Clerk
  onLoadExample: (path: string) => void;
  selectedSpecies: string[];
  setSelectedSpecies: (species: string[]) => void;
  selectedChromosomes: string[];
  setSelectedChromosomes: (chromosomes: string[]) => void;
  speciesOptions: { label: string; value: string; }[];
  chromosomeOptions: { [species: string]: { label: string; value: string; species: string; }[] };
  referenceGenomeData: any;
  syntenyData?: {
    ref_chr: string;
    query_chr: string;
    query_name: string;
  }[];
  onDataLoad: {
    synteny: (data: any) => void;
    species: (data: any) => void;
    reference: (data: any) => void;
    annotations: (data: any) => void;
  };
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  showTooltips: boolean;
  onToggleTooltips: () => void;
  onResetToWelcome: () => void;
  speciesData?: ChromosomeData[];
  onShare: (title: string, isPublic: boolean) => Promise<string | null>;
  onSave: (title: string) => Promise<string | null>;
  isDetailViewOpen: boolean;
  onToggleDetailView: () => void;
  selectedSynteny: SyntenyData[];

  onToggleSelection: (link: SyntenyData) => void;
  onSelectBlock?: (link: SyntenyData) => void;
  currentBlockIndex?: number;
  onExport?: (data: SyntenyData[]) => void;
  showConnectedOnly: boolean;
}

export function FloatingHUDBar({
  user,
  onLoadExample,
  selectedSpecies,
  setSelectedSpecies,
  selectedChromosomes,
  setSelectedChromosomes,
  speciesOptions,
  chromosomeOptions,
  referenceGenomeData,
  syntenyData,
  onDataLoad,
  isFullScreen = false,
  onToggleFullScreen = () => { },
  showTooltips,
  onToggleTooltips,
  onResetToWelcome,
  speciesData,
  onShare,
  onSave,
  isDetailViewOpen,
  onToggleDetailView,
  selectedSynteny,
  onToggleSelection,
  onSelectBlock,
  currentBlockIndex = 0,
  onExport,
  showConnectedOnly,
}: FloatingHUDBarProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const [isVertical, setIsVertical] = useState(false);
  const [forceVertical, setForceVertical] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // Memoized handlers
  // handleSignOut removed as it is handled by Clerk components internally

  const toggleLayout = useCallback(() => {
    setForceVertical(!forceVertical);
  }, [forceVertical]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const downloadCSV = useCallback((data: SyntenyData[], filename: string) => {
    const headers = [
      'Reference Species',
      'Reference Chromosome',
      'Reference Start (Mb)',
      'Reference End (Mb)',
      'Query Species',
      'Query Chromosome',
      'Query Start (Mb)',
      'Query End (Mb)',
      'Size (Mb)',
      'Orientation'
    ];

    const rows = data.map(link => [
      link.ref_name,
      link.ref_chr,
      (link.ref_start / 1_000_000).toFixed(2),
      (link.ref_end / 1_000_000).toFixed(2),
      link.query_name,
      link.query_chr,
      (link.query_start / 1_000_000).toFixed(2),
      (link.query_end / 1_000_000).toFixed(2),
      ((link.ref_end - link.ref_start) / 1_000_000).toFixed(2),
      link.query_strand === '+' ? 'Forward' : 'Reverse'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(selectedSynteny);
    } else {
      downloadCSV(
        selectedSynteny,
        `synteny-blocks-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  }, [onExport, selectedSynteny, downloadCSV]);

  const clearAllSelected = useCallback(() => {
    selectedSynteny.forEach(link => onToggleSelection(link));
  }, [selectedSynteny, onToggleSelection]);

  // Check position relative to window edge
  useEffect(() => {
    const unsubscribeX = x.on("change", (latest) => {
      const windowWidth = window.innerWidth;
      if (!forceVertical) {
        setIsVertical(latest > windowWidth - 100);
      }
    });

    return () => {
      unsubscribeX();
    };
  }, [x, forceVertical]);

  // Update isVertical when forceVertical changes
  useEffect(() => {
    setIsVertical(forceVertical);
  }, [forceVertical]);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      whileHover={{ scale: 1.02 }}
      whileDrag={{ scale: 1.05 }}
      style={{ x, y }}
      className={cn(
        "fixed bottom-4 sm:bottom-8 inset-x-0 mx-auto w-fit cursor-grab active:cursor-grabbing",
        isFullScreen ? "z-51" : "z-50"
      )}
    >
      <div className="relative">
        {/* Background gradients */}
        <div className={cn(
          "absolute inset-0 blur-2xl rounded-2xl",
          isVertical
            ? "bg-linear-to-b from-blue-500/20 to-purple-500/20"
            : "bg-linear-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20"
        )} />
        <div className={cn(
          "absolute inset-0 blur-xl rounded-2xl opacity-50",
          isVertical
            ? "bg-linear-to-t from-blue-400/10 to-purple-400/10"
            : "bg-linear-to-l from-blue-400/10 via-indigo-400/10 to-purple-400/10"
        )} />

        {/* Main container */}
        <div className={cn(
          "relative backdrop-blur-xl border rounded-2xl shadow-xl transition-all duration-300",
          "bg-white/95 dark:bg-zinc-900/95",
          "border-zinc-200/80 dark:border-zinc-700/50",
          "ring-1 ring-zinc-900/5 dark:ring-white/10",
          isVertical
            ? "px-3 py-4"
            : "px-3 sm:px-5 py-2 sm:py-2.5"
        )}>
          <div className={cn(
            "flex items-center gap-1 sm:gap-2",
            isVertical ? "flex-col" : "flex-row justify-center"
          )}>
            {/* User Profile / Sign In Button */}
            <div className="relative">
              <UserActions
                onSignOut={() => { }} // Handled by Clerk UserButton
                onShare={onShare}
                onSave={onSave}
                isVertical={isVertical}
              />
            </div>

            {!isVertical && <Separator orientation="vertical" className="h-6 mx-1 bg-zinc-300 dark:bg-zinc-600" />}

            {/* Reset/Go Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetToWelcome}
              className={cn(
                "transition-colors group",
                isVertical
                  ? "h-8 w-8 p-0"
                  : "h-8 px-2 text-xs font-medium",
                referenceGenomeData
                  ? "bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 [&_svg]:stroke-red-500"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 [&_svg]:stroke-gray-500"
              )}
            >
              {referenceGenomeData ? (
                <RotateCcw className="h-3.5 w-3.5" />
              ) : (
                <Home className="h-3.5 w-3.5" />
              )}
              {!isVertical && (
                <span className="max-sm:hidden ml-1.5">
                  {referenceGenomeData ? "Go Back" : "Main"}
                </span>
              )}
            </Button>

            {/* Upload Button */}
            <FileUploaderGroup onDataLoad={onDataLoad} user={user}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30 transition-colors group [&_svg]:stroke-blue-500",
                  isVertical
                    ? "h-8 w-8 p-0"
                    : "h-8 px-2 text-xs font-medium"
                )}
              >
                <Upload className="h-3.5 w-3.5" />
                {!isVertical && <span className="max-sm:hidden ml-1.5">Upload</span>}
              </Button>
            </FileUploaderGroup>

            {/* Example Files Button */}
            <ExampleFilesDrawer onLoadExample={onLoadExample}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/30 transition-colors group [&_svg]:stroke-yellow-500",
                  isVertical
                    ? "h-8 w-8 p-0"
                    : "h-8 px-2 text-xs"
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                {!isVertical && <span className="max-sm:hidden ml-1.5">Examples</span>}
              </Button>
            </ExampleFilesDrawer>

            {/* Filter Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    {(!syntenyData || syntenyData.length === 0) && !referenceGenomeData && (!speciesData || speciesData.length === 0) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toast.info("Load data first to use filters", {
                            description: "Upload your files or select an example dataset to filter species, chromosomes, and synteny data.",
                            duration: 4000,
                          });
                        }}
                        className={cn(
                          "relative transition-colors group",
                          "bg-gray-400/20 text-gray-600 dark:text-gray-400 hover:bg-gray-400/30 [&_svg]:stroke-gray-500 dark:[&_svg]:stroke-gray-400",
                          isVertical
                            ? "h-8 w-8 p-0"
                            : "h-8 px-2 text-xs font-medium"
                        )}
                      >
                        <TableProperties className="h-3.5 w-3.5" />
                        {!isVertical && <span className="max-sm:hidden ml-1.5">Filter</span>}

                        {/* Notification indicator when no data loaded */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse border border-white dark:border-gray-800 z-20" />
                      </Button>
                    ) : (
                      <FilterDrawer
                        selectedSpecies={selectedSpecies}
                        setSelectedSpecies={setSelectedSpecies}
                        selectedChromosomes={selectedChromosomes}
                        setSelectedChromosomes={setSelectedChromosomes}
                        speciesOptions={speciesOptions}
                        chromosomeOptions={chromosomeOptions}
                        referenceGenomeData={referenceGenomeData}
                        syntenyData={syntenyData}
                        showConnectedOnly={showConnectedOnly}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/30 transition-colors group [&_svg]:stroke-purple-500",
                            isVertical
                              ? "h-8 w-8 p-0"
                              : "h-8 px-2 text-xs font-medium"
                          )}
                        >
                          <TableProperties className="h-3.5 w-3.5" />
                          {!isVertical && <span className="max-sm:hidden ml-1.5">Filter</span>}
                        </Button>
                      </FilterDrawer>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">
                    {(!syntenyData || syntenyData.length === 0) && !referenceGenomeData && (!speciesData || speciesData.length === 0)
                      ? "Load data first to use filtering options"
                      : "Filter species, chromosomes, and synteny data"
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Separator */}
            {!isVertical && (
              <Separator orientation="vertical" className="h-6 mx-1 bg-zinc-300 dark:bg-zinc-600 hidden sm:block" />
            )}

            {/* Tooltip Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleTooltips}
              className={cn(
                "transition-colors group",
                isVertical
                  ? "h-8 w-8 p-0"
                  : "h-8 px-2 text-xs font-medium",
                showTooltips
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 [&_svg]:stroke-emerald-500"
                  : "bg-gray-500/20 text-gray-600 dark:text-gray-400 hover:bg-gray-500/30 [&_svg]:stroke-gray-500"
              )}
            >
              {showTooltips ? (
                <MessageCircle className="h-3.5 w-3.5" />
              ) : (
                <MessageCircleOff className="h-3.5 w-3.5" />
              )}
              {!isVertical && (
                <span className="max-sm:hidden ml-1.5">
                  {showTooltips ? "Hide Tips" : "Show Tips"}
                </span>
              )}
            </Button>

            {/* View Data Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    {(!syntenyData || syntenyData.length === 0) && !referenceGenomeData && (!speciesData || speciesData.length === 0) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toast.info("Load data first to view tables", {
                            description: "Upload your files or select an example dataset to view data tables and explore your genomic data.",
                            duration: 4000,
                          });
                        }}
                        className={cn(
                          "transition-colors duration-200 group border bg-background/50 backdrop-blur-sm",
                          "border-border/50",
                          "text-muted-foreground hover:text-foreground",
                          "hover:bg-accent/50",
                          "[&_svg]:stroke-muted-foreground group-hover:[&_svg]:stroke-foreground",
                          "rounded-xl",
                          isVertical
                            ? "h-10 w-10 p-0"
                            : "h-9 px-3 text-xs font-semibold"
                        )}
                      >
                        <Database className="h-4 w-4 transition-colors" />
                        {!isVertical && <span className="max-sm:hidden ml-2 font-medium">View Data</span>}

                        {/* Notification indicator when no data loaded */}
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse border border-background z-20" />
                      </Button>
                    ) : (
                      <DataViewerDrawer
                        syntenyData={syntenyData as SyntenyData[]}
                        speciesData={speciesData}
                        referenceData={referenceGenomeData}
                        isVertical={isVertical}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "transition-colors duration-200 group border bg-background/50 backdrop-blur-sm",
                            "border-amber-200 dark:border-amber-800",
                            "text-amber-700 dark:text-amber-300",
                            "hover:bg-amber-100/50 dark:hover:bg-amber-900/30",
                            "[&_svg]:stroke-amber-600 dark:[&_svg]:stroke-amber-400",
                            "rounded-xl",
                            isVertical
                              ? "h-10 w-10 p-0"
                              : "h-9 px-3 text-xs font-semibold"
                          )}
                        >
                          <Database className="h-4 w-4 transition-colors" />
                          {!isVertical && <span className="max-sm:hidden ml-2 font-medium">View Data</span>}
                        </Button>
                      </DataViewerDrawer>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">
                    {(!syntenyData || syntenyData.length === 0) && !referenceGenomeData && (!speciesData || speciesData.length === 0)
                      ? "Load data first to view data tables"
                      : "View raw data tables and statistics"
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Chord View Toggle Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedSynteny.length === 0) {
                        toast.info("Select synteny ribbons first to view chord diagram", {
                          description: "Click on the colored ribbons in the visualization to select synteny blocks, then use this button to view detailed chord diagrams.",
                          duration: 4000,
                        });
                        return;
                      }
                      onToggleDetailView();
                    }}
                    className={cn(
                      "transition-colors duration-200 group border bg-background/50 backdrop-blur-sm",
                      isVertical
                        ? "h-10 w-10 p-0"
                        : "h-9 px-3 text-xs font-semibold",
                      isDetailViewOpen && selectedSynteny.length > 0 ? [
                        "border-green-200 dark:border-green-800",
                        "text-green-700 dark:text-green-300",
                        "hover:bg-green-100/50 dark:hover:bg-green-900/30",
                        "[&_svg]:stroke-green-600 dark:[&_svg]:stroke-green-400"
                      ] : selectedSynteny.length > 0 ? [
                        "border-orange-200 dark:border-orange-800",
                        "text-orange-700 dark:text-orange-300",
                        "hover:bg-orange-100/50 dark:hover:bg-orange-900/30",
                        "[&_svg]:stroke-orange-600 dark:[&_svg]:stroke-orange-400"
                      ] : [
                        "border-border/50",
                        "text-muted-foreground hover:text-foreground",
                        "hover:bg-accent/50",
                        "[&_svg]:stroke-muted-foreground group-hover:[&_svg]:stroke-foreground"
                      ],
                      "rounded-xl"
                    )}
                  >
                    <svg
                      className="h-4 w-4 transition-colors"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 12h8" />
                      <path d="M12 8v8" />
                      <path d="M16 8l-8 8" />
                      <path d="M8 8l8 8" />
                    </svg>
                    {!isVertical && <span className="max-sm:hidden ml-2 font-medium">Chord View</span>}

                    {/* Notification indicator when no blocks selected */}
                    {selectedSynteny.length === 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse border border-white dark:border-gray-800 z-20" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">
                    {selectedSynteny.length === 0
                      ? "Click synteny ribbons first to select blocks for chord view"
                      : isDetailViewOpen
                        ? "Hide chord view panel"
                        : "Show chord view panel"
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Selected Blocks Popover */}
            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "transition-colors duration-200 group border bg-background/50 backdrop-blur-sm",
                      isVertical
                        ? "h-10 w-10 p-0"
                        : "h-9 px-3 text-xs font-semibold",
                      selectedSynteny.length > 0 ? [
                        "border-blue-200 dark:border-blue-800",
                        "text-blue-700 dark:text-blue-300",
                        "hover:bg-blue-100/50 dark:hover:bg-blue-900/30",
                        "[&_svg]:stroke-blue-600 dark:[&_svg]:stroke-blue-400"
                      ] : [
                        "border-border/50",
                        "text-muted-foreground hover:text-foreground",
                        "hover:bg-accent/50",
                        "[&_svg]:stroke-muted-foreground group-hover:[&_svg]:stroke-foreground"
                      ],
                      "rounded-xl"
                    )}
                  >
                    <TableIcon className="h-4 w-4 transition-colors" />
                    {!isVertical && <span className="max-sm:hidden ml-2 font-medium">Selected</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="end"
                  className="w-[520px] h-[420px] p-0 bg-white/20 dark:bg-black/20 backdrop-blur-2xl rounded-2xl border-0 shadow-2xl ring-1 ring-white/20 dark:ring-white/10"
                >
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-white/10 dark:border-white/5 bg-white/10 dark:bg-white/5 backdrop-blur-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-blue-500/10 rounded-lg">
                            <TableIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">Selected Blocks</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {selectedSynteny.length} synteny block{selectedSynteny.length !== 1 ? 's' : ''} selected
                            </p>
                          </div>
                        </div>
                        {selectedSynteny.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs font-medium bg-red-50/50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-600"
                              onClick={clearAllSelected}
                            >
                              <X className="h-3.5 w-3.5 mr-2" />
                              Clear All
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs font-medium bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800"
                              onClick={handleExport}
                            >
                              <FileSpreadsheet className="h-3.5 w-3.5 mr-2" />
                              Export CSV
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="overflow-auto p-3 space-y-2">
                      {selectedSynteny.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground gap-3 py-8">
                          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <TableIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No blocks selected</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click on synteny ribbons to select blocks</p>
                          </div>
                        </div>
                      ) : (
                        selectedSynteny.map((link, index) => (
                          <motion.div
                            key={`${link.ref_chr}-${link.query_chr}-${link.ref_start}-${link.ref_end}-${index}`}
                            layout
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                          >
                            <Card
                              className={cn(
                                "relative group transition-all duration-200 cursor-pointer",
                                // Base colors based on orientation
                                link.query_strand === '+'
                                  ? "bg-blue-50/30 dark:bg-blue-950/20 border-blue-200/40 dark:border-blue-800/40 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 hover:border-blue-300/60 dark:hover:border-blue-600/60"
                                  : "bg-red-50/30 dark:bg-red-950/20 border-red-200/40 dark:border-red-800/40 hover:bg-red-50/60 dark:hover:bg-red-950/30 hover:border-red-300/60 dark:hover:border-red-600/60",
                                // Selected state
                                index === currentBlockIndex && [
                                  link.query_strand === '+'
                                    ? "ring-2 ring-blue-500/50 dark:ring-blue-400/50 bg-blue-100/70 dark:bg-blue-950/40 border-blue-400 dark:border-blue-500"
                                    : "ring-2 ring-red-500/50 dark:ring-red-400/50 bg-red-100/70 dark:bg-red-950/40 border-red-400 dark:border-red-500"
                                ]
                              )}
                              onClick={() => {
                                if (onSelectBlock) {
                                  onSelectBlock(link);
                                }
                              }}
                            >
                              <CardContent className="p-3">
                                {/* Remove button */}
                                <div className="absolute -top-1 -right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleSelection(link);
                                    }}
                                    className="h-6 w-6 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xs border border-gray-200 dark:border-gray-700 shadow-lg hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>

                                {/* Main content */}
                                <div className="space-y-2">
                                  {/* Species and chromosome info */}
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate max-w-[180px]">
                                      {link.ref_name} {link.ref_chr}
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate max-w-[180px]">
                                      {link.query_name} {link.query_chr}
                                    </span>
                                  </div>

                                  {/* Position and size info */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium">Position:</span>
                                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200">
                                          {(link.ref_start / 1_000_000).toFixed(1)}-{(link.ref_end / 1_000_000).toFixed(1)} Mb
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium">Size:</span>
                                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200">
                                          {((link.ref_end - link.ref_start) / 1_000_000).toFixed(1)} Mb
                                        </span>
                                      </div>
                                    </div>

                                    {/* Orientation badge */}
                                    <Badge variant="secondary" className={cn(
                                      "px-2 py-1 font-semibold text-xs cursor-default",
                                      link.query_strand === '+'
                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                                    )}>
                                      {link.query_strand === '+' ? 'Forward ➜' : 'Reverse ⟲'}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Badge positioned outside the button */}
              {selectedSynteny.length > 0 && (
                <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold min-w-[20px] shadow-lg z-20">
                  {selectedSynteny.length}
                </Badge>
              )}
            </div>

            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={cn(
                "transition-colors group",
                isVertical
                  ? "h-8 w-8 p-0"
                  : "h-8 w-8 p-0",
                "hover:bg-white/10 hover:text-white"
              )}
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5 group-hover:text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 group-hover:text-blue-400" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Layout Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLayout}
              className={cn(
                "hover:bg-accent hover:text-accent-foreground transition-colors",
                isVertical ? "h-8 w-8" : "h-8 w-8",
                forceVertical && "bg-accent/50"
              )}
            >
              {isVertical ? (
                <LayoutGrid className="h-4 w-4" />
              ) : (
                <LayoutPanelTop className="h-4 w-4" />
              )}
            </Button>

            {/* Fullscreen Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFullScreen}
              className={cn(
                "transition-colors font-medium",
                "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
                "hover:bg-indigo-500/25 dark:hover:bg-indigo-500/20",
                "border border-indigo-300/50 dark:border-indigo-600/30",
                isVertical ? "h-8 w-8 p-0" : "h-8 px-3 text-xs"
              )}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  {!isVertical && <span className="ml-1.5">Exit Full View</span>}
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  {!isVertical && <span className="ml-1.5">Full Screen</span>}
                </>
              )}
            </Button>

            {/* Drag Handle */}
            <div className={cn(
              "flex items-center cursor-grab active:cursor-grabbing",
              isVertical ? "pt-1" : "pl-1 pr-0.5"
            )}>
              <GripVertical className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}