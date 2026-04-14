"use client";

import { useEffect, useRef, useState, useCallback, RefObject } from "react";
import * as d3 from "d3";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Circle, Lock, Unlock, ArrowUp, ArrowDown, ArrowUpDown, ArrowLeftRight, ArrowRight, ArrowLeft, Settings2, MoreVertical, Image, Palette, ZoomIn, ZoomOut, RefreshCw, Maximize2, Minimize2 } from "lucide-react";
import { ChromosomeData, SyntenyData, ReferenceGenomeData, ChromosomeBreakpoint } from "../types";
import { cn } from "@/lib/utils";
import { useDebounce } from "use-debounce";
import { useEventListener } from "@/hooks/use-event-listener";
import { MiniMap } from "@/components/chromoviz/mini-map";
import { Tooltip } from "@/components/chromoviz/tooltip";
import { renderChromosome } from "@/components/chromoviz/chromosome-view";
import { renderSyntenyRibbon } from "@/components/chromoviz/synteny-ribbon";
import {
  getChromosomeTooltip,
  getSyntenyTooltip,
  GeneTooltipData,
  SelectionToast
} from "@/components/chromoviz/tooltip";
import React, { ReactElement } from "react";
import {
  CHROMOSOME_CONFIG,
  SYNTENY_COLORS,
  GENE_ANNOTATION_CONFIG,
  type GeneClass
} from "@/config/chromoviz.config";
import { GeneAnnotation } from "@/app/types";
// import { SettingsPanel } from "@/components/chromoviz/settings-panel"; // No longer needed
import { ChromosomeScrollbar } from "@/components/chromoviz/chromosome-scrollbar";
import { ControlsMenu } from "@/components/chromoviz/controls-menu";
import { MutationTypeDataDrawer } from "@/components/chromoviz/mutation-type-data-drawer";
import { MutationType, MUTATION_COLORS, mutationFullNames } from "@/components/chromoviz/synteny-ribbon";
import { ConfigProps } from "@/components/chromoviz/settings-panel";
import { useAccessibility } from "@/components/chromoviz/accessibility-context";
import { toast } from "sonner";

// First, add these type definitions at the top
type D3Selection = d3.Selection<SVGSVGElement, unknown, null, undefined>;
type D3Transition = d3.Transition<SVGSVGElement, unknown, null, undefined>;
type D3ZoomBehavior = d3.ZoomBehavior<SVGSVGElement, unknown>;

interface Dimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SyntenyTooltipData {
  symbol: string;
  strand: '+' | '-';
  class: string;
  position: string;
  isCluster?: boolean;
  geneCount?: number;
  name?: string;
  locus_tag?: string;
  GeneID: string;
}

interface TooltipInfo {
  x: number;
  y: number;
  content: string | GeneTooltipData | ReactElement;
  isOpen: boolean;
  type?: 'gene' | 'synteny' | 'chromosome' | 'breakpoint';
  data?: GeneTooltipData | ChromosomeData | SyntenyTooltipData | ReactElement;
}

interface ChromosomeSyntenyProps {
  referenceData: ChromosomeData[];
  syntenyData: SyntenyData[];
  referenceGenomeData: ReferenceGenomeData | null;
  selectedSynteny: SyntenyData[];
  onSyntenySelect: (link: SyntenyData, isSelected: boolean) => void;
  width: number | string;
  height: number | string;
  alignmentFilter: 'all' | 'forward' | 'reverse';
  setAlignmentFilter: (filter: 'all' | 'forward' | 'reverse') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
  svgRef: React.RefObject<SVGSVGElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  zoomBehaviorRef: React.MutableRefObject<any>;
  showAnnotations: boolean;
  setShowAnnotations: (show: boolean) => void;
  selectedChromosomes: string[];
  showTooltips: boolean;
  setShowTooltips: (show: boolean) => void;
  selectedMutationTypes: Map<string, MutationType>;
  onMutationTypeSelect: (syntenyId: string, mutationType?: MutationType) => void; // Allow undefined
  customSpeciesColors: Map<string, string>;
  onSpeciesColorChange: (species: string, color: string) => void;
  onResetSpeciesColors: () => void;
  showConnectedOnly: boolean;
  setShowConnectedOnly: (show: boolean) => void;
  config: ConfigProps;
  onConfigChange: (newConfig: Partial<ConfigProps>) => void;
  onResetLayout: () => void;
  chromosomeOrder?: Map<string, string[]>;
  onChromosomeOrderChange?: (newOrder: Map<string, string[]>) => void;
}

const ZOOM_LEVELS = {
  OVERVIEW: 0.5,    // Show all chromosomes
  CHROMOSOME: 1,    // Show individual chromosome details
  REGION: 2,        // Show gene clusters
  GENE: 3,          // Show individual genes
  SEQUENCE: 4       // Show sequence details
};

export function ChromosomeSynteny({
  referenceData,
  syntenyData,
  referenceGenomeData,
  selectedSynteny,
  onSyntenySelect,
  width,
  height,
  alignmentFilter,
  setAlignmentFilter,
  onZoomIn,
  onZoomOut,
  onReset,
  onFullscreen,
  isFullscreen,
  svgRef,
  containerRef,
  zoomBehaviorRef,
  showAnnotations,
  setShowAnnotations,
  selectedChromosomes,
  showTooltips,
  setShowTooltips,
  selectedMutationTypes = new Map(),
  onMutationTypeSelect,
  customSpeciesColors,
  onSpeciesColorChange,
  onResetSpeciesColors,
  showConnectedOnly,
  setShowConnectedOnly,
  config,
  onConfigChange,
  onResetLayout,
  chromosomeOrder = new Map(),
  onChromosomeOrderChange,
}: ChromosomeSyntenyProps) {
  const [zoom, setZoom] = useState(1);
  const [isZoomUnlocked, setIsZoomUnlocked] = useState(false);
  const [customMutationTypes, setCustomMutationTypes] = useState<Record<string, string>>({});
  const [isMutationDrawerOpen, setIsMutationDrawerOpen] = useState(false);
  const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo | null>(null);
  const [debouncedHoverInfo] = useDebounce(tooltipInfo, 50); // Debounce hover info updates
  const [viewport, setViewport] = useState<Dimensions>({
    x: 0,
    y: 0,
    width: typeof width === 'string' ? parseInt(width) : width,
    height: typeof height === 'string' ? parseInt(height) : height
  });
  const [dimensions, setDimensions] = useState<Dimensions>({
    x: 0,
    y: 0,
    width: typeof width === 'string' ? parseInt(width) : width,
    height: typeof height === 'string' ? parseInt(height) : height
  });
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Add ref for tracking current transform
  const currentTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  // Add these refs for handling continuous pan
  const panIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPanningRef = useRef(false);

  const handleAddCustomMutationType = useCallback((name: string, color: string) => {
    if (name && color) {
      setCustomMutationTypes(prev => ({ ...prev, [name.toUpperCase()]: color }));
    }
  }, []);

  const { colorBlindMode, getMutationColors, getSpeciesPalette } = useAccessibility();

  const accessibleMutationColors = getMutationColors();
  const accessibleSpeciesPalette = getSpeciesPalette();

  const allMutationColors = colorBlindMode !== 'none'
    ? { ...accessibleMutationColors, ...customMutationTypes }
    : { ...MUTATION_COLORS, ...customMutationTypes };
  const customFullNames = Object.keys(customMutationTypes).reduce((acc, key) => {
    const words = key.toLowerCase().split(' ');
    const formattedName = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    acc[key] = formattedName;
    return acc;
  }, {} as Record<string, string>);
  const allMutationFullNames = { ...mutationFullNames, ...customFullNames };



  // Filter synteny data before rendering
  const filteredSyntenyData = syntenyData;

  const handleFullscreenChange = useCallback(() => {
    const isFullscreenNow = Boolean(document.fullscreenElement);

    if (isFullscreenNow && containerRef.current) {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      const aspectRatio = viewport.width / viewport.height;
      let newWidth = screenWidth;
      let newHeight = screenWidth / aspectRatio;

      if (newHeight > screenHeight) {
        newHeight = screenHeight;
        newWidth = screenHeight * aspectRatio;
      }

      setDimensions({
        x: 0,
        y: 0,
        width: newWidth,
        height: newHeight
      });
    } else {
      // Reset to container dimensions when exiting fullscreen
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          x: 0,
          y: 0,
          width: rect.width,
          height: rect.height
        });
      }
    }
  }, [viewport, containerRef]);

  const handleResize = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);

    const selection = svg as D3Selection;

    if (currentTransformRef.current && zoomBehaviorRef.current) {
      zoomBehaviorRef.current.transform(
        selection,
        currentTransformRef.current
      );
    }
  }, [svgRef, containerRef, zoomBehaviorRef]);

  useEventListener('fullscreenchange' as keyof WindowEventMap, handleFullscreenChange);
  useEventListener('resize', handleResize);

  // Fallback for Safari which often ignores overscroll-behavior-x
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // If primarily horizontal scrolling, prevent default swipe-to-navigate
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
      }
    };

    // Needs to be passive: false to allow preventDefault
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [containerRef]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  const updateViewportRect = (transform: d3.ZoomTransform) => {
    const scale = transform.k;
    const x = -transform.x / scale;
    const y = -transform.y / scale;
    const viewWidth = dimensions.width / scale;
    const viewHeight = dimensions.height / scale;

    setViewport({
      x,
      y,
      width: viewWidth,
      height: viewHeight
    });
  };

  const handleElementHover = useCallback((event: any, content: string | { type: string; data: GeneTooltipData | React.ReactElement }) => {
    if (typeof content === 'string') {
      setTooltipInfo({
        x: event.clientX,
        y: event.clientY,
        content,
        isOpen: true,
      });
    } else if (React.isValidElement(content.data)) {
      setTooltipInfo({
        x: event.clientX,
        y: event.clientY,
        content: content.data,
        isOpen: true,
        type: 'breakpoint',
        data: content.data,
      });
    } else {
      setTooltipInfo({
        x: event.clientX,
        y: event.clientY,
        content: content.data as GeneTooltipData,
        isOpen: true,
        type: content.type as 'gene' | 'synteny' | 'chromosome',
        data: content.data as GeneTooltipData,
      });
    }
  }, []);

  const handleElementLeave = () => {
    setTooltipInfo(prev => prev ? { ...prev, isOpen: false } : null);
  };

  const handleElementMove = (event: any) => {
    if (tooltipInfo) {
      setTooltipInfo(prev => ({
        ...prev!,
        x: event.clientX,
        y: event.clientY,
      }));
    }
  };

  const handleMouseOver = (event: any, link: SyntenyData, maxSyntenySize: number) => {
    if (!showTooltips) return; // Early return if tooltips are disabled

    setTooltipInfo({
      x: event.clientX,
      y: event.clientY,
      content: getSyntenyTooltip(link, maxSyntenySize),
      isOpen: true,
      type: 'synteny',
      data: {
        symbol: link.symbol,
        strand: link.query_strand,
        class: link.class,
        position: link.position,
        isCluster: link.isCluster,
        geneCount: link.geneCount,
        name: link.name,
        locus_tag: link.locus_tag,
        GeneID: link.GeneID
      }
    });

    const svg = d3.select(svgRef.current);
    const isSelected = selectedSynteny.some(s =>
      s.ref_chr === link.ref_chr &&
      s.query_chr === link.query_chr &&
      s.ref_start === link.ref_start
    );

    // Only apply hover effects if not selected
    if (!isSelected) {
      svg.selectAll(`.synteny-ribbon[data-synteny-id="${link.ref_chr}-${link.query_chr}-${link.ref_start}-${link.query_start}"]`)
        .attr("opacity", SYNTENY_COLORS.OPACITY.HOVER)
        .raise();

      svg.selectAll(`.matching-block[data-synteny-id="${link.ref_chr}-${link.query_chr}-${link.ref_start}-${link.query_start}"]`)
        .attr("opacity", 1)
        .attr("stroke-width", 1);
    }
  };

  const handleMouseOut = () => {
    handleElementLeave();

    const svg = d3.select(svgRef.current);

    // Reset ribbons based on selection state
    svg.selectAll(".synteny-ribbon").each(function () {
      const ribbon = d3.select(this);
      const isSelected = ribbon.classed("selected");
      ribbon.attr("opacity", isSelected ?
        SYNTENY_COLORS.OPACITY.ACTIVE :
        SYNTENY_COLORS.OPACITY.DEFAULT
      );
    });

    // Reset blocks based on selection state
    svg.selectAll(".matching-block").each(function () {
      const block = d3.select(this);
      const isSelected = block.classed("selected");
      block.attr("opacity", isSelected ? 1 : 0.8)
        .attr("stroke-width", isSelected ? 1 : 0.5);
    });
  };

  // Modified selection handler
  const handleSyntenySelection = (link: SyntenyData, isSelected: boolean) => {
    onSyntenySelect(link, isSelected);
    setToastMessage(isSelected ? "Block Selected" : "Block Deselected");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Add this function to handle gene hover events
  const handleGeneHover = (event: React.MouseEvent, gene: GeneAnnotation) => {
    if (!showTooltips) return;
    setTooltipInfo({
      x: event.clientX,
      y: event.clientY,
      isOpen: true,
      type: 'gene',
      content: (
        <div className="p-2 text-sm">
          <div className="font-bold mb-1">{gene.symbol || 'NA'}</div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div><span className="font-semibold">Name:</span> {gene.name || 'NA'}</div>
            <div><span className="font-semibold">Position:</span> {gene.chromosome}:{gene.start.toLocaleString()}-{gene.end.toLocaleString()}</div>
            <div><span className="font-semibold">Strand:</span> {gene.strand || 'NA'}</div>
            <div><span className="font-semibold">Class:</span> {gene.class || 'NA'}</div>
            <div><span className="font-semibold">Gene ID:</span> {gene.GeneID || 'NA'}</div>
            <div><span className="font-semibold">Locus Tag:</span> {gene.locus_tag || 'NA'}</div>
            <div><span className="font-semibold">Accession:</span> {gene.genomic_accession || 'NA'}</div>
          </div>
        </div>
      )
    });
  };

  const handleSaveAsSVG = useCallback(() => {
    if (!svgRef.current) return;

    // Get SVG content
    const svgElement = svgRef.current;

    // Create a clone of the SVG to modify for export
    const clone = svgElement.cloneNode(true) as SVGSVGElement;

    // Set the background color to match the current theme
    const isDarkMode = document.documentElement.classList.contains('dark');
    clone.style.backgroundColor = isDarkMode ? '#020817' : '#ffffff';

    // Ensure viewBox is set correctly
    const bbox = svgElement.getBBox();
    clone.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

    // Add any missing style elements
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      .chromosome-body { stroke: ${isDarkMode ? '#ffffff' : '#000000'}; }
      .chromosome-label { fill: ${isDarkMode ? '#ffffff' : '#000000'}; }
      text { fill: ${isDarkMode ? '#ffffff' : '#000000'}; }
    `;
    clone.insertBefore(styleSheet, clone.firstChild);

    const svgContent = new XMLSerializer().serializeToString(clone);

    // Add XML declaration and SVG namespace
    const svgBlob = new Blob([
      '<?xml version="1.0" standalone="no"?>\r\n',
      svgContent
    ], { type: 'image/svg+xml;charset=utf-8' });

    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(svgBlob);
    downloadLink.download = `chromoviz-overview-${new Date().toISOString().split('T')[0]}.svg`;

    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Clean up
    URL.revokeObjectURL(downloadLink.href);
  }, [svgRef]);

  // Modify the handlePan function to support continuous movement
  const handlePan = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;

    const currentTransform = d3.zoomTransform(svgRef.current);
    const panAmount = 50; // Reduced for smoother continuous movement

    let newX = currentTransform.x;
    let newY = currentTransform.y;

    switch (direction) {
      case 'up':
        newY += panAmount;
        break;
      case 'down':
        newY -= panAmount;
        break;
      case 'left':
        newX += panAmount;
        break;
      case 'right':
        newX -= panAmount;
        break;
    }

    const newTransform = d3.zoomIdentity
      .translate(newX, newY)
      .scale(currentTransform.k);

    d3.select(svgRef.current)
      .transition()
      .duration(100) // Reduced for smoother continuous movement
      .ease(d3.easeLinear) // Changed to linear for continuous movement
      .call(zoomBehaviorRef.current.transform, newTransform);
  }, [svgRef, zoomBehaviorRef]);

  // Add these handlers for continuous pan
  const startContinuousPan = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (isPanningRef.current) return;

    isPanningRef.current = true;
    handlePan(direction);

    panIntervalRef.current = setInterval(() => {
      handlePan(direction);
    }, 50); // Adjust interval for smooth movement
  }, [handlePan]);

  const stopContinuousPan = useCallback(() => {
    if (panIntervalRef.current) {
      clearInterval(panIntervalRef.current);
      panIntervalRef.current = null;
    }
    isPanningRef.current = false;
  }, []);

  // Add keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          handlePan('up');
          break;
        case 'ArrowDown':
          handlePan('down');
          break;
        case 'ArrowLeft':
          handlePan('left');
          break;
        case 'ArrowRight':
          handlePan('right');
          break;
        case 'Escape':
          if (isFullscreen) {
            onFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePan, isFullscreen, onFullscreen]);

  useEffect(() => {
    const handleResize = () => {
      if (!svgRef.current) return;

      const containerWidth = containerRef.current?.offsetWidth || 800;
      const containerHeight = containerRef.current?.offsetHeight || 600;

      setDimensions({
        x: 0,
        y: 0,
        width: containerWidth,
        height: containerHeight
      });

      // Update the SVG viewBox to match the new dimensions
      d3.select(svgRef.current)
        .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call to set dimensions

    return () => window.removeEventListener('resize', handleResize);
  }, [svgRef, containerRef]);

  // Setup effect - runs only once
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear SVG on initial setup

    // Resolve font at render time to avoid serif fallback
    const computedStyle = getComputedStyle(document.documentElement);
    const resolvedFont = computedStyle.getPropertyValue('--font-geist-mono').trim() || 'ui-monospace, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace';

    const margin = {
      top: 20,
      right: 40,
      bottom: 120,
      left: 120
    };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Determine connected chromosomes if the filter is active
    const connectedChrIds = new Set<string>();
    syntenyData.forEach(link => {
      // Assuming query_name is the species name for the query chromosome
      connectedChrIds.add(`${link.ref_name}:${link.ref_chr}`);
      connectedChrIds.add(`${link.query_name}:${link.query_chr}`);
    });

    const displayedReferenceData = (showConnectedOnly
      ? referenceData.filter(chr => connectedChrIds.has(`${chr.species_name}:${chr.chr_id}`))
      : [...referenceData])
      .sort((a, b) => {
        if (a.species_name !== b.species_name) return 0;
        const customOrder = chromosomeOrder.get(a.species_name);
        if (!customOrder || customOrder.length === 0) return 0;

        const aIdx = customOrder.indexOf(a.chr_id);
        const bIdx = customOrder.indexOf(b.chr_id);
        if (aIdx === -1 && bIdx === -1) return 0;
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });

    // Group data by species
    const speciesGroups = d3.group(displayedReferenceData, d => d.species_name);
    const uniqueSpecies = Array.from(speciesGroups.keys());

    // Calculate layout parameters
    const speciesSpacing = innerHeight / (uniqueSpecies.length + 1);

    // Create color scale for ribbons
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Calculate max chromosome size for scaling
    const maxChrSize = d3.max(referenceData, d => d.chr_size_bp) || 0;
    const maxSyntenySize = d3.max(syntenyData, d => d.ref_end - d.ref_start) || 0;
    const maxSyntenySizeMb = maxSyntenySize / 1_000_000;

    // Apply width scaling from config (percentage to decimal)
    const widthMultiplier = (config.widthScale || 100) / 100;
    const effectiveWidth = (innerWidth - 100) * widthMultiplier;

    const xScale = d3.scaleLinear()
      .domain([0, maxChrSize])
      .range([0, effectiveWidth]); // Leave space for labels and apply scaling

    // Modify the species color scale to use custom colors
    const speciesColorScale = d3.scaleOrdinal<string>()
      .domain(uniqueSpecies)
      .range(uniqueSpecies.map(species =>
        customSpeciesColors?.get(species) || accessibleSpeciesPalette[uniqueSpecies.indexOf(species) % accessibleSpeciesPalette.length]
      ));

    // Get reference species from synteny data
    const referenceSpecies = syntenyData.length > 0 ? syntenyData[0].ref_name : '';

    // Draw chromosomes for each species
    uniqueSpecies.forEach((species, speciesIndex) => {
      const speciesColor = speciesColorScale(species);
      const speciesData = speciesGroups.get(species) || [];
      const y = speciesIndex * speciesSpacing + speciesSpacing;

      // Species label
      g.append("text")
        .attr("x", -10)
        .attr("y", y + config.chromosomeHeight / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "14px")
        .attr("font-family", resolvedFont)
        .attr("class", "text-foreground")
        .attr("fill", "currentColor")
        .text(species.replace("_", " "));

      let xOffset = 0;
      speciesData.forEach((chr) => {
        renderChromosome({
          chromosome: chr,
          xOffset,
          y,
          xScale,
          speciesColor,
          onHover: handleElementHover,
          onMove: handleElementMove,
          onLeave: handleElementLeave,
          container: g,
          annotations: referenceGenomeData?.geneAnnotations,
          showAnnotations,
          breakpoints: referenceGenomeData?.breakpoints,
          config: {
            chromosomeHeight: config.chromosomeHeight,
            chromosomeSpacing: config.chromosomeSpacing,
            annotationHeight: config.annotationHeight,
            geneColors: {
              forward: GENE_ANNOTATION_CONFIG.COLORS.FORWARD,
              reverse: GENE_ANNOTATION_CONFIG.COLORS.REVERSE,
            },
          },
          isReferenceChromosome: species === referenceSpecies,
        });

        xOffset += xScale(chr.chr_size_bp) + config.chromosomeSpacing * 2;
      });
    });

    // Sort filtered data by block size (largest to smallest)
    const sortedData = [...filteredSyntenyData].sort((a, b) => {
      const sizeA = (a.ref_end - a.ref_start) * (a.query_end - a.query_start);
      const sizeB = (b.ref_end - b.ref_start) * (b.query_end - b.query_start);
      return sizeB - sizeA; // Render largest blocks first (they'll be at the bottom)
    });

    // Render filtered ribbons in sorted order
    sortedData.forEach(link => {
      const sourceSpecies = link.ref_name;
      const targetSpecies = link.query_name;

      if (!sourceSpecies || !targetSpecies) return;

      const sourceIndex = uniqueSpecies.indexOf(sourceSpecies);
      const targetIndex = uniqueSpecies.indexOf(targetSpecies);

      if (sourceIndex === -1 || targetIndex === -1) return;

      const sourceY = sourceIndex * speciesSpacing + speciesSpacing;
      const targetY = targetIndex * speciesSpacing + speciesSpacing;

      const syntenyId = `${link.ref_chr}-${link.query_chr}-${link.ref_start}-${link.query_start}`;
      const mutationType = selectedMutationTypes.get(syntenyId);

      renderSyntenyRibbon({
        link,
        sourceSpecies,
        targetSpecies,
        sourceY,
        targetY,
        xScale,
        speciesColorScale,
        referenceData: displayedReferenceData,
        container: g,
        onHover: (event, link) => handleMouseOver(event, link, maxSyntenySizeMb),
        onMove: handleElementMove,
        onLeave: handleMouseOut,
        chromosomeSpacing: config.chromosomeSpacing,
        chromosomeHeight: config.chromosomeHeight,
        isSelected: selectedSynteny.some(s =>
          s.ref_chr === link.ref_chr &&
          s.query_chr === link.query_chr &&
          s.ref_start === link.ref_start
        ),
        onSelect: handleSyntenySelection,
        zoomBehaviorRef,
        selectedChromosomes,
        mutationType,
        useCustomColors: Boolean(mutationType),
        mutationColors: allMutationColors,
      });
    });

    // Update the chromosome hover events to target the correct elements
    g.selectAll("path.chromosome-body")
      .on("mouseover", (event) => {
        if (!showTooltips) return; // Early return if tooltips are disabled

        const chr = referenceData.find(c =>
          c.chr_id === event.target.dataset.chr &&
          c.species_name === event.target.dataset.species
        );
        if (chr) {
          setTooltipInfo({
            x: event.clientX,
            y: event.clientY,
            content: getChromosomeTooltip(chr, chr.chr_size_bp / 1_000_000),
            isOpen: true,
            type: 'chromosome',
            data: chr
          });
        }
      })
      .on("mousemove", handleElementMove)
      .on("mouseout", handleElementLeave);

    // Create zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent(isZoomUnlocked ? [0.0001, 1000] : [0.01, 15])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const g = svg.select("g");
        // Convert the transform object to a string representation
        g.attr("transform", `translate(${event.transform.x}, ${event.transform.y}) scale(${event.transform.k})`);
        setZoom(event.transform.k);
        updateViewportRect(event.transform);
        currentTransformRef.current = event.transform;
      });

    // Safe assignment to mutable ref
    zoomBehaviorRef.current = zoomBehavior;

    // Type assertion for svg.call()
    svg.call(zoomBehavior as any);

    // Add proper typing for the chromosome zoom behavior
    const chromosomeZoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent(isZoomUnlocked ? [0.0001, 1000] : [0.01, 15])
      .on("zoom", (event) => {
        const transform = event.transform;
        g.selectAll(".chromosome-body")
          .attr("transform", `translate(${transform.x}, ${transform.y}) scale(${transform.k})`);
        g.selectAll(".synteny-ribbon")
          .attr("transform", `translate(${transform.x}, ${transform.y}) scale(${transform.k})`);
      });

    // Add labels for breakpoints and gene annotations if they exist
    if (referenceGenomeData?.breakpoints && referenceGenomeData.breakpoints.length > 0) {
      // Get reference species position (first species in the list)
      const referenceSpecies = syntenyData.length > 0 ? syntenyData[0].ref_name : '';
      const refSpeciesIndex = uniqueSpecies.indexOf(referenceSpecies);
      const refY = refSpeciesIndex * speciesSpacing + speciesSpacing;

      // Position the label to be vertically aligned with the mirrored chromosome
      const mirroredChrY = refY + config.chromosomeHeight + 10; // Position of the mirrored chromosome
      const labelY = mirroredChrY + (config.chromosomeHeight / 2); // Center of the mirrored chromosome

      // Add "Breakpoints" label with count
      const totalBreakpoints = referenceGenomeData.breakpoints.length;
      g.append("text")
        .attr("x", -10)  // Same x position as species labels
        .attr("y", labelY)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "12px")
        .attr("font-family", resolvedFont)
        .attr("class", "text-muted-foreground")
        .attr("fill", "currentColor")
        .text(`Breakpoints (${totalBreakpoints})`);
    }

    // Add Gene Annotations label if annotations exist and are enabled
    if (showAnnotations && referenceGenomeData?.geneAnnotations && referenceGenomeData.geneAnnotations.length > 0) {
      // Get reference species position (first species in the list)
      const referenceSpecies = syntenyData.length > 0 ? syntenyData[0].ref_name : '';
      const refSpeciesIndex = uniqueSpecies.indexOf(referenceSpecies);
      const refY = refSpeciesIndex * speciesSpacing + speciesSpacing;

      // Calculate position for gene annotation label
      let annotationLabelY = refY + config.chromosomeHeight + 10 + (config.chromosomeHeight / 2); // Default position

      // If breakpoints exist, position gene annotations label below the breakpoint track
      if (referenceGenomeData?.breakpoints && referenceGenomeData.breakpoints.length > 0) {
        annotationLabelY = refY + config.chromosomeHeight + 10 + config.chromosomeHeight + 15 + (config.chromosomeHeight / 2);
      }

      // Add "Gene Annotations" label with count
      const totalGeneAnnotations = referenceGenomeData.geneAnnotations.length;
      g.append("text")
        .attr("x", -10)  // Same x position as species labels
        .attr("y", annotationLabelY)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "12px")
        .attr("font-family", resolvedFont)
        .attr("class", "text-muted-foreground")
        .attr("fill", "currentColor")
        .text(`Gene Annotations (${totalGeneAnnotations})`);
    }

  }, [
    referenceData,
    syntenyData,
    dimensions,
    alignmentFilter,
    // selectedSynteny, // Removed to prevent re-render on selection
    // onSyntenySelect, // Removed
    referenceGenomeData,
    showAnnotations,
    selectedChromosomes,
    config,
    showTooltips,
    selectedMutationTypes,
    onMutationTypeSelect,
    customSpeciesColors,
    colorBlindMode,
    accessibleSpeciesPalette,
    showConnectedOnly,
    chromosomeOrder,
    isZoomUnlocked
  ]);

  // Update effect for selection changes
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    svg.selectAll<SVGGElement, SyntenyData>(".synteny-group").each(function (d) {
      const group = d3.select(this);
      const isSelected = selectedSynteny.some(s =>
        s.ref_chr === d.ref_chr &&
        s.query_chr === d.query_chr &&
        s.ref_start === d.ref_start
      );

      group.classed("selected", isSelected);

      group.select(".synteny-ribbon")
        .classed("selected", isSelected)
        .attr("opacity", isSelected ? SYNTENY_COLORS.OPACITY.ACTIVE : SYNTENY_COLORS.OPACITY.DEFAULT);

      group.selectAll(".matching-block")
        .classed("selected", isSelected)
        .attr("opacity", isSelected ? 1 : 0.8)
        .attr("stroke-width", isSelected ? 1 : 0.5);
    });
  }, [selectedSynteny, svgRef]);

  // Add window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      // Update dimensions based on fullscreen state
      if (document.fullscreenElement) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        const aspectRatio = viewport.width / viewport.height;
        let newWidth = screenWidth;
        let newHeight = screenWidth / aspectRatio;

        if (newHeight > screenHeight) {
          newHeight = screenHeight;
          newWidth = screenHeight * aspectRatio;
        }

        setDimensions({
          x: 0,
          y: 0,
          width: newWidth,
          height: newHeight
        });
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          x: 0,
          y: 0,
          width: rect.width,
          height: rect.height
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewport, containerRef]);

  const optimizeChromosomeLayout = (chromosomes: ChromosomeData[]) => {
    // Group chromosomes by size ranges
    const sizeRanges = d3.groups(chromosomes, d => {
      const size = d.chr_size_bp;
      if (size > 1e8) return 'large';
      if (size > 1e7) return 'medium';
      return 'small';
    });

    // Arrange chromosomes in rows based on size
    return sizeRanges.map(([range, chrs]) => ({
      range,
      chromosomes: chrs,
      row: range === 'large' ? 0 : range === 'medium' ? 1 : 2
    }));
  };

  // Update detail level based on zoom
  useEffect(() => {
    const detailLevel = zoom < 1 ? 'overview'
      : zoom < 2 ? 'chromosome'
        : zoom < 3 ? 'region'
          : zoom < 4 ? 'gene'
            : 'sequence';

    // Adjust rendering detail accordingly
  }, [zoom]);

  // Add this function to handle image export
  const handleExportImage = useCallback(async (format: 'png' | 'jpg') => {
    if (!svgRef.current) return;

    try {
      const svgElement = svgRef.current;
      const clone = svgElement.cloneNode(true) as SVGSVGElement;
      const bbox = svgElement.getBBox();

      // Add padding (reduced top padding)
      const padding = {
        top: 30,
        right: 50,
        bottom: 50,
        left: 50
      };
      const totalWidth = bbox.width + (padding.left + padding.right);
      const totalHeight = bbox.height + (padding.top + padding.bottom) + 30;

      // Check dark mode once at the beginning
      const isDarkMode = document.documentElement.classList.contains('dark');

      // Update clone dimensions with padding
      clone.setAttribute('width', `${totalWidth}`);
      clone.setAttribute('height', `${totalHeight}`);
      clone.setAttribute('viewBox', `${bbox.x - padding.left} ${bbox.y - padding.top} ${totalWidth} ${totalHeight}`);

      // Resolve CSS custom properties for fonts
      const computedStyle = getComputedStyle(document.documentElement);
      const geistMono = computedStyle.getPropertyValue('--font-geist-mono').trim() || 'ui-monospace, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace';

      // Inline styles
      const styles = document.styleSheets;
      let stylesText = '';
      for (let i = 0; i < styles.length; i++) {
        try {
          const rules = styles[i].cssRules || styles[i].rules;
          for (let j = 0; j < rules.length; j++) {
            stylesText += rules[j].cssText + '\n';
          }
        } catch (e) {
          console.warn('Could not read styles', e);
        }
      }

      // Enhanced style resolution with proper font handling
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        ${stylesText}
        text, .text-foreground { 
          font-family: ${geistMono} !important;
          fill: ${isDarkMode ? '#ffffff' : '#000000'} !important;
          color: ${isDarkMode ? '#ffffff' : '#000000'} !important;
        }
        .text-muted-foreground {
          font-family: ${geistMono} !important;
          fill: ${isDarkMode ? '#a1a1aa' : '#94a3b8'} !important;
          color: ${isDarkMode ? '#a1a1aa' : '#94a3b8'} !important;
        }
        .chromosome-label {
          font-family: ${geistMono} !important;
          fill: ${isDarkMode ? '#ffffff' : '#000000'} !important;
        }
        .chromosome-body { 
          stroke: ${isDarkMode ? '#ffffff' : '#000000'} !important; 
        }
      `;
      clone.insertBefore(styleElement, clone.firstChild);

      const svgData = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([
        '<?xml version="1.0" standalone="no"?>\r\n',
        svgData
      ], { type: 'image/svg+xml;charset=utf-8' });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Scale for reasonable quality (2x for crisp export without massive file sizes)
      const dpiScale = 2; // Good balance of quality and file size
      canvas.width = totalWidth * dpiScale;
      canvas.height = totalHeight * dpiScale;

      // Use the same isDarkMode value for background
      ctx.fillStyle = isDarkMode ? '#020817' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const url = URL.createObjectURL(svgBlob);
      const img = document.createElement('img') as HTMLImageElement;

      await new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.scale(dpiScale, dpiScale);
          ctx.drawImage(img, 0, 0, totalWidth, totalHeight);

          // Add credits with same isDarkMode value
          ctx.scale(0.5, 0.5);
          ctx.fillStyle = isDarkMode ? '#a1a1aa' : '#94a3b8';
          ctx.font = '24px system-ui, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('© 2025 CHITRA', totalWidth * 2 - 20, totalHeight * 2 - 20);

          const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
          const quality = format === 'png' ? 1 : 0.95;

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create image blob'));
              return;
            }

            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `chromoviz-full-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            URL.revokeObjectURL(downloadLink.href);
            URL.revokeObjectURL(url);
            resolve(true);
          }, mimeType, quality);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  }, [svgRef]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative select-none overscroll-none"
      style={{
        overflow: 'hidden',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      <div className={cn(
        "absolute inset-0 transition-opacity duration-200 pointer-events-none",
        isFullscreen ? "opacity-100" : "opacity-0"
      )} />

      <div className={cn(
        "relative w-full h-full z-30",
        isFullscreen && "bg-background"
      )}>
        {/* Header Controls */}
        <div className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-between gap-2 p-1",
          "border-b border-border/20",
          "bg-background/95 backdrop-blur-md z-50"
        )}>
          <ControlsMenu
            alignmentFilter={alignmentFilter}
            setAlignmentFilter={setAlignmentFilter}
            showAnnotations={showAnnotations}
            setShowAnnotations={setShowAnnotations}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onReset={onReset}
            onFullscreen={onFullscreen}
            isFullscreen={isFullscreen}
            handleSaveAsSVG={handleSaveAsSVG}
            handleExportImage={handleExportImage}
            selectedSynteny={selectedSynteny}
            selectedMutationTypes={selectedMutationTypes}
            onMutationTypeSelect={onMutationTypeSelect}
            customSpeciesColors={customSpeciesColors}
            onSpeciesColorChange={onSpeciesColorChange}
            onResetSpeciesColors={onResetSpeciesColors}
            speciesData={referenceData}
            showConnectedOnly={showConnectedOnly}
            setShowConnectedOnly={setShowConnectedOnly}
            zoomLevel={zoom}
            onViewMutations={() => setIsMutationDrawerOpen(true)}
            fullscreenContainerRef={containerRef}
            onAddCustomMutationType={handleAddCustomMutationType}
            mutationColors={allMutationColors}
            config={config}
            onConfigChange={onConfigChange}
            onResetLayout={onResetLayout}
          />
        </div>

        <MutationTypeDataDrawer
          isOpen={isMutationDrawerOpen}
          onClose={() => setIsMutationDrawerOpen(false)}
          selectedSynteny={selectedSynteny}
          selectedMutationTypes={selectedMutationTypes}
          mutationColors={allMutationColors}
          mutationFullNames={allMutationFullNames}
        />

        {/* Main Content Area */}
        <div className="relative flex-1 h-full">
          <div className="w-full h-full">
            <svg
              ref={svgRef}
              className={cn(
                "w-full h-full",
                isFullscreen && "w-screen h-screen"
              )}
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="xMidYMid meet"
            />

            <div className="absolute bottom-16 right-4 z-20 scale-90">
              <MiniMap
                mainSvgRef={svgRef}
                zoomBehaviorRef={zoomBehaviorRef}
                viewportRect={viewport}
                dimensions={dimensions}
                zoom={zoom}
                isFullscreen={isFullscreen}
              />
            </div>

            {showTooltips && (
              <Tooltip info={debouncedHoverInfo} />
            )}

            <div className="absolute left-4 bottom-16 z-20 scale-90">
              <div className="inline-grid w-fit grid-cols-3 gap-1">
                <div></div>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Pan camera up"
                  onMouseDown={() => startContinuousPan('up')}
                  onMouseUp={stopContinuousPan}
                  onMouseLeave={stopContinuousPan}
                  onTouchStart={() => startContinuousPan('up')}
                  onTouchEnd={stopContinuousPan}
                  className={cn(
                    "h-7 w-7 transition-colors",
                    isPanningRef.current && "bg-blue-500/10 border-blue-500/50"
                  )}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <div></div>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Pan camera left"
                  onMouseDown={() => startContinuousPan('left')}
                  onMouseUp={stopContinuousPan}
                  onMouseLeave={stopContinuousPan}
                  onTouchStart={() => startContinuousPan('left')}
                  onTouchEnd={stopContinuousPan}
                  className={cn(
                    "h-7 w-7 transition-colors",
                    isPanningRef.current && "bg-blue-500/10 border-blue-500/50"
                  )}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={isZoomUnlocked ? "Lock zoom limits" : "Unlock zoom limits"}
                  onClick={() => {
                    setIsZoomUnlocked(!isZoomUnlocked);
                    toast.success(isZoomUnlocked ? "Zoom limits restored" : "Zoom limits unlocked!", {
                      description: isZoomUnlocked ? "Scale restricted to 1% - 1500%" : "Unrestricted zoom enabled.",
                      duration: 3000,
                    });
                  }}
                  className={cn(
                    "h-7 w-7 transition-all duration-200",
                    isZoomUnlocked
                      ? "bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.3)] border-blue-500/50 text-blue-600"
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  {isZoomUnlocked ? (
                    <Unlock className="h-3.5 w-3.5 animate-pulse" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Pan camera right"
                  onMouseDown={() => startContinuousPan('right')}
                  onMouseUp={stopContinuousPan}
                  onMouseLeave={stopContinuousPan}
                  onTouchStart={() => startContinuousPan('right')}
                  onTouchEnd={stopContinuousPan}
                  className={cn(
                    "h-7 w-7 transition-colors",
                    isPanningRef.current && "bg-blue-500/10 border-blue-500/50"
                  )}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <div></div>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Pan camera down"
                  onMouseDown={() => startContinuousPan('down')}
                  onMouseUp={stopContinuousPan}
                  onMouseLeave={stopContinuousPan}
                  onTouchStart={() => startContinuousPan('down')}
                  onTouchEnd={stopContinuousPan}
                  className={cn(
                    "h-7 w-7 transition-colors",
                    isPanningRef.current && "bg-blue-500/10 border-blue-500/50"
                  )}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Add this component */}
        <ChromosomeScrollbar
          svgRef={svgRef}
          containerRef={containerRef}
          zoomBehaviorRef={zoomBehaviorRef}
          width={dimensions.width}
          height={dimensions.height}
        />
      </div>
      <SelectionToast message={toastMessage} show={showToast} />
      {/* SettingsPanel removed as functionality is now in ControlsMenu */}
    </div>
  );
}