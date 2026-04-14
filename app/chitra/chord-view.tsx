'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { SyntenyData, ChromosomeData } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Info,
  Minimize2,
  Maximize2,
  Settings,
  Save,
  Lock,
  Unlock,
  Image,
  X,
  FileType,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { HoverTooltip, GENE_ANNOTATION_CONFIG as TOOLTIP_GENE_CONFIG } from "@/components/chromoviz/tooltip";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAccessibility } from "@/components/chromoviz/accessibility-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

// Add configuration types
interface SyntenyViewConfig {
  visual: {
    ribbonOpacity: number;
    blockOpacity: number;
    trackWidth: number;
    gapAngle: number;
    colors: {
      reference: string;
      query: string;
      forwardStrand: string;
      reverseStrand: string;
    };
  };
  annotations: {
    show: boolean;
    height: number;
    spacing: number;
    colors: typeof TOOLTIP_GENE_CONFIG.COLORS;
  };
  scale: {
    showTicks: boolean;
    tickCount: number;
    tickLength: number;
    showLabels: boolean;
    fontSize: number;
  };
  interaction: {
    enableZoom: boolean;
    zoomExtent: [number, number];
    showTooltips: boolean;
  };
  markers: {
    tickLength: number;
    textOffset: number;
    fontSize: number;
    strokeWidth: number;
    markerRadius: number;
    dashPattern: [number, number];
    colors: {
      reference: string;
      query: string;
    };
  };
}

interface ChordViewProps {
  selectedBlock: SyntenyData;
  referenceData: ChromosomeData[];
  onBlockClick: (block: SyntenyData) => void;
  selectedSynteny: SyntenyData[];
  onToggleSelection: (block: SyntenyData) => void;
  isFullscreen?: boolean;
  onFullscreen?: (isFullscreen: boolean) => void;
  config?: Partial<SyntenyViewConfig>;
  onConfigChange?: (config: SyntenyViewConfig) => void;
  showTooltips?: boolean;
}

const defaultConfig: SyntenyViewConfig = {
  visual: {
    ribbonOpacity: 0.6,
    blockOpacity: 0.8,
    trackWidth: 0.15,
    gapAngle: 0.1,
    colors: {
      reference: '#e6effd',
      query: '#f5ebff',
      forwardStrand: '#3b82f6',
      reverseStrand: '#ef4444',
    },
  },
  annotations: {
    show: true,
    height: 8,
    spacing: 2,
    colors: TOOLTIP_GENE_CONFIG.COLORS,
  },
  scale: {
    showTicks: true,
    tickCount: 10,
    tickLength: 5,
    showLabels: true,
    fontSize: 5,
  },
  interaction: {
    enableZoom: true,
    zoomExtent: [0.1, 20], // Allow much more zooming for gene annotations
    showTooltips: true,
  },
  markers: {
    tickLength: 20,
    textOffset: 30,
    fontSize: 10,
    strokeWidth: 1,
    markerRadius: 2,
    dashPattern: [2, 2],
    colors: {
      reference: '#3b82f6',
      query: '#8b5cf6'
    }
  }
};

export function ChordView({
  selectedBlock,
  referenceData,
  onBlockClick,
  selectedSynteny,
  onToggleSelection,
  isFullscreen = false,
  onFullscreen,
  config: userConfig,
  onConfigChange,
  showTooltips = true,
}: ChordViewProps & {
  onConfigChange?: (config: SyntenyViewConfig) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<SyntenyData | null>(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredChromosome, setHoveredChromosome] = useState<{
    size: number;
    isRef: boolean;
    position?: number;
    gene?: any;
  } | null>(null);
  const [showInfo, setShowInfo] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<SyntenyViewConfig>({ ...defaultConfig, ...userConfig });
  const { colorBlindMode, getSyntenyColors } = useAccessibility();
  const [isGraphFixed, setIsGraphFixed] = useState(true);
  const [viewBoxDimensions, setViewBoxDimensions] = useState({ width: 1400, height: 1400 });

  // Apply accessibility colors to chord config when colorblind mode changes
  useEffect(() => {
    if (colorBlindMode !== 'none') {
      const accColors = getSyntenyColors();
      setConfig(prev => ({
        ...prev,
        visual: {
          ...prev.visual,
          colors: {
            ...prev.visual.colors,
            forwardStrand: accColors.FORWARD,
            reverseStrand: accColors.REVERSE,
          }
        }
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        visual: {
          ...prev.visual,
          colors: {
            ...prev.visual.colors,
            forwardStrand: defaultConfig.visual.colors.forwardStrand,
            reverseStrand: defaultConfig.visual.colors.reverseStrand,
          }
        }
      }));
    }
  }, [colorBlindMode, getSyntenyColors]);

  // Add fullscreen handling
  const handleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
        onFullscreen?.(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        onFullscreen?.(false);
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  // Add fullscreen change event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onFullscreen?.(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onFullscreen]);

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

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    zoomBehaviorRef.current.scaleBy(svg.transition().duration(750), 1.2);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    zoomBehaviorRef.current.scaleBy(svg.transition().duration(750), 0.8);
  };

  const handleReset = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    zoomBehaviorRef.current.transform(svg.transition().duration(750), d3.zoomIdentity);
  };

  // Replace the existing handleSaveAsSVG function with these new export functions
  const handleExportImage = useCallback(async (format: 'png' | 'jpg') => {
    if (!svgRef.current) return;

    try {
      const svgElement = svgRef.current;
      const clone = svgElement.cloneNode(true) as SVGSVGElement;
      const bbox = svgElement.getBBox();

      // Add padding (50px on each side)
      const padding = 50;
      const totalWidth = bbox.width + (padding * 2);
      const totalHeight = bbox.height + (padding * 2) + 30; // Extra 30px for credits

      // Check dark mode once at the beginning
      const isDarkMode = document.documentElement.classList.contains('dark');

      // Update clone dimensions with padding
      clone.setAttribute('width', `${totalWidth}`);
      clone.setAttribute('height', `${totalHeight}`);
      clone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${totalWidth} ${totalHeight}`);

      // Add styles with dark mode consideration
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        ${isDarkMode ? `
          text, .text-foreground, .chromosome-label { 
            fill: #ffffff !important;
            color: #ffffff !important;
          }
          .text-muted-foreground {
            fill: #a1a1aa !important;
            color: #a1a1aa !important;
          }
        ` : ''}
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

      const scale2x = 2;
      canvas.width = totalWidth * scale2x;
      canvas.height = totalHeight * scale2x;

      // Use the same isDarkMode value for background
      ctx.fillStyle = isDarkMode ? '#020817' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const url = URL.createObjectURL(svgBlob);
      const img = document.createElement('img') as HTMLImageElement;

      await new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.scale(scale2x, scale2x);
          ctx.drawImage(img, 0, 0, totalWidth, totalHeight);

          // Add credits
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
            downloadLink.download = `chromoviz-synteny-${new Date().toISOString().split('T')[0]}.${format}`;

            const container = containerRef.current || document.body;
            container.appendChild(downloadLink);
            downloadLink.click();
            container.removeChild(downloadLink);

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

  const handleSaveAsSVG = useCallback(() => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current;
    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    const bbox = svgElement.getBBox();

    // Add padding (50px on each side)
    const padding = 50;
    const totalWidth = bbox.width + (padding * 2);
    const totalHeight = bbox.height + (padding * 2) + 30; // Extra 30px for credits

    // Check dark mode
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Update clone dimensions with padding
    clone.setAttribute('width', `${totalWidth}`);
    clone.setAttribute('height', `${totalHeight}`);
    clone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${totalWidth} ${totalHeight}`);

    // Add styles for dark mode
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      ${isDarkMode ? `
        text, .text-foreground, .chromosome-label { 
          fill: #ffffff !important;
          color: #ffffff !important;
        }
        .text-muted-foreground {
          fill: #a1a1aa !important;
          color: #a1a1aa !important;
        }
      ` : ''}
    `;
    clone.insertBefore(styleElement, clone.firstChild);

    const svgData = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([
      '<?xml version="1.0" standalone="no"?>\r\n',
      svgData
    ], { type: 'image/svg+xml;charset=utf-8' });

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(svgBlob);
    downloadLink.download = `chromoviz-synteny-${new Date().toISOString().split('T')[0]}.svg`;

    const container = containerRef.current || document.body;
    container.appendChild(downloadLink);
    downloadLink.click();
    container.removeChild(downloadLink);

    URL.revokeObjectURL(downloadLink.href);
  }, [svgRef]);

  const refChromosome = selectedBlock ? referenceData.find(d =>
    d.species_name === selectedBlock.ref_name && d.chr_id === selectedBlock.ref_chr
  ) : null;

  const queryChromosome = selectedBlock ? referenceData.find(d =>
    d.species_name === selectedBlock.query_name && d.chr_id === selectedBlock.query_chr
  ) : null;

  // Add resize observer to update viewBox
  useEffect(() => {
    if (!containerRef.current) return;

    const updateViewBox = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      setViewBoxDimensions({
        width: rect.width,
        height: rect.height
      });
    };

    // Initial update
    updateViewBox();

    // Create resize observer
    const resizeObserver = new ResizeObserver(updateViewBox);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update SVG rendering code to use new dimensions
  useEffect(() => {
    if (!svgRef.current || !selectedBlock) return;

    const svg = d3.select(svgRef.current);
    const oldTransform = d3.zoomTransform(svg.node() as SVGSVGElement);

    if (!zoomBehaviorRef.current) {
      zoomBehaviorRef.current = d3.zoom<SVGSVGElement, unknown>();
    }

    zoomBehaviorRef.current
      .scaleExtent(config.interaction.zoomExtent)
      .on('zoom', (event) => {
        if (!svgRef.current) return;
        const { width, height } = viewBoxDimensions;
        const g = d3.select(svgRef.current).select('g');
        g.attr('transform', `translate(${width / 2}, ${height / 2}) ${event.transform}`);
        setZoom(event.transform.k);
      });

    svg.selectAll('*').remove();

    // Only apply zoom behavior if graph is not fixed
    if (!isGraphFixed) {
      svg.call(zoomBehaviorRef.current as any);
    } else {
      svg.on('.zoom', null);
    }

    // Helper function to format base pairs
    const formatBase = (value: number) => {
      if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}Mb`;
      } else if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}kb`;
      }
      return `${value}bp`;
    };

    const width = viewBoxDimensions.width;
    const height = viewBoxDimensions.height;
    const margin = {
      top: height * 0.07,    // 7% of height
      right: width * 0.07,   // 7% of width
      bottom: height * 0.07, // 7% of height
      left: width * 0.07     // 7% of width
    };

    // Create main group
    const g = svg.append('g');

    // If fixed, manually apply the transform that the zoom handler would have.
    if (isGraphFixed) {
      const { width, height } = viewBoxDimensions;
      g.attr('transform', `translate(${width / 2}, ${height / 2})`);
    }

    // Create layers
    const ribbonLayer = g.append('g').attr('class', 'ribbon-layer');
    const chromosomeLayer = g.append('g').attr('class', 'chromosome-layer');
    const syntenyLayer = g.append('g').attr('class', 'synteny-layer');
    const labelLayer = g.append('g').attr('class', 'label-layer');

    // Dimensions
    const radius = Math.min(width, height) * 0.3;
    const innerRadius = radius * 0.8;
    const trackWidth = radius * config.visual.trackWidth;
    const gapAngle = Math.PI * config.visual.gapAngle;

    if (!refChromosome || !queryChromosome) return;

    // Calculate the relative sizes and adjust track width
    const maxChrSize = Math.max(refChromosome.chr_size_bp, queryChromosome.chr_size_bp);
    const refRelativeSize = refChromosome.chr_size_bp / maxChrSize;
    const queryRelativeSize = queryChromosome.chr_size_bp / maxChrSize;

    // Adjust arc angles based on relative sizes
    const refArcLength = Math.PI - (2 * gapAngle);
    const queryArcLength = Math.PI - (2 * gapAngle);

    // Create scales with adjusted ranges
    const refScale = d3.scaleLinear()
      .domain([0, refChromosome.chr_size_bp])
      .range([gapAngle, gapAngle + (refArcLength * refRelativeSize)]);

    const queryScale = d3.scaleLinear()
      .domain([0, queryChromosome.chr_size_bp])
      .range([Math.PI + gapAngle, Math.PI + gapAngle + (queryArcLength * queryRelativeSize)]);

    // Update arc definitions with new angles
    const refArc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(innerRadius + trackWidth)
      .startAngle(gapAngle)
      .endAngle(gapAngle + (refArcLength * refRelativeSize));

    const queryArc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(innerRadius + trackWidth)
      .startAngle(Math.PI + gapAngle)
      .endAngle(Math.PI + gapAngle + (queryArcLength * queryRelativeSize));

    chromosomeLayer.append('path')
      .attr('d', refArc({} as any) as string)
      .attr('fill', config.visual.colors.reference)
      .attr('stroke', '#d1d5db')
      .attr('cursor', 'pointer')
      .on('mousemove', (event) => {
        const [x, y] = d3.pointer(event);
        let angle = Math.atan2(y, x) + Math.PI / 2;
        if (angle < 0) angle += 2 * Math.PI;
        const position = refScale.invert(angle);
        setHoveredChromosome({
          size: refChromosome.chr_size_bp,
          isRef: true,
          position: Math.round(position)
        });
      })
      .on('mouseleave', () => {
        setHoveredChromosome(null);
        setHoveredBlock(null);
      });


    chromosomeLayer.append('path')
      .attr('d', queryArc({} as any) as string)
      .attr('fill', config.visual.colors.query)
      .attr('stroke', '#d1d5db')
      .attr('cursor', 'pointer')
      .on('mousemove', (event) => {
        const [x, y] = d3.pointer(event);
        let angle = Math.atan2(y, x) + Math.PI / 2;
        if (angle < 0) angle += 2 * Math.PI;
        const position = queryScale.invert(angle);
        setHoveredChromosome({
          size: queryChromosome.chr_size_bp,
          isRef: false,
          position: Math.round(position)
        });
      })
      .on('mouseleave', () => {
        setHoveredChromosome(null);
        setHoveredBlock(null);
      });


    // Add gene annotations for reference chromosome
    if (refChromosome && refChromosome.annotations && config.annotations.show) {
      const annotationGroup = chromosomeLayer.append('g')
        .attr('class', 'ref-annotations');

      refChromosome.annotations.forEach((gene) => {
        const startAngle = refScale(gene.start);
        const endAngle = refScale(gene.end);

        // Create an arc for each gene annotation
        const annotationArc = d3.arc()
          .innerRadius(innerRadius + trackWidth)
          .outerRadius(innerRadius + trackWidth + config.annotations.height)
          .startAngle(startAngle)
          .endAngle(endAngle);

        annotationGroup.append('path')
          .attr('d', annotationArc({} as any) as string)
          .attr('fill', config.annotations.colors[gene.class as keyof typeof config.annotations.colors] || config.annotations.colors.default)
          .attr('cursor', 'pointer')
          .on('mouseover', (event) => {
            const [x, y] = d3.pointer(event);
            setHoveredChromosome({
              size: refChromosome.chr_size_bp,
              isRef: true,
              position: Math.round(refScale.invert(Math.atan2(y, x) + Math.PI / 2)),
              gene: gene
            });
          })
          .on('mouseleave', () => {
            setHoveredChromosome(null);
          });
      });
    }

    // Add gene annotations for query chromosome
    if (queryChromosome && queryChromosome.annotations && config.annotations.show) {
      const annotationGroup = chromosomeLayer.append('g')
        .attr('class', 'query-annotations');

      queryChromosome.annotations.forEach((gene) => {
        const startAngle = queryScale(gene.start);
        const endAngle = queryScale(gene.end);

        // Create an arc for each gene annotation
        const annotationArc = d3.arc()
          .innerRadius(innerRadius + trackWidth)
          .outerRadius(innerRadius + trackWidth + config.annotations.height)
          .startAngle(startAngle)
          .endAngle(endAngle);

        annotationGroup.append('path')
          .attr('d', annotationArc({} as any) as string)
          .attr('fill', config.annotations.colors[gene.class as keyof typeof config.annotations.colors] || config.annotations.colors.default)
          .attr('cursor', 'pointer')
          .on('mouseover', (event) => {
            const [x, y] = d3.pointer(event);
            setHoveredChromosome({
              size: queryChromosome.chr_size_bp,
              isRef: false,
              position: Math.round(queryScale.invert(Math.atan2(y, x) + Math.PI / 2)),
              gene: gene
            });
          })
          .on('mouseleave', () => {
            setHoveredChromosome(null);
          });
      });
    }

    // Draw ribbon
    const ribbon = d3.ribbon()
      .radius(innerRadius)
      .padAngle(0.02)
      .source((d) => ({
        startAngle: refScale(selectedBlock.ref_start),
        endAngle: refScale(selectedBlock.ref_end),
        radius: innerRadius
      }))
      .target((d) => ({
        startAngle: queryScale(selectedBlock.query_start),
        endAngle: queryScale(selectedBlock.query_end),
        radius: innerRadius
      }));

    // Add ribbon with gradient
    const gradientId = `ribbon-gradient-${selectedBlock.query_strand}`;
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('gradientUnits', 'userSpaceOnUse');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', config.visual.colors.forwardStrand)
      .attr('stop-opacity', 0.2);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', config.visual.colors.forwardStrand)
      .attr('stop-opacity', 0.6);

    // Create a properly typed data object for the ribbon
    const ribbonData = {
      source: {
        startAngle: refScale(selectedBlock.ref_start),
        endAngle: refScale(selectedBlock.ref_end),
        radius: innerRadius
      },
      target: {
        startAngle: queryScale(selectedBlock.query_start),
        endAngle: queryScale(selectedBlock.query_end),
        radius: innerRadius
      }
    };

    // Update the ribbon path hover interactions
    ribbonLayer.append('path')
      .datum(ribbonData)
      .attr('d', ribbon as any)
      .attr('fill', `url(#${gradientId})`)
      .attr('stroke', config.visual.colors.forwardStrand)
      .attr('stroke-opacity', 0.8)
      .attr('stroke-width', 1)
      .attr('cursor', 'pointer')
      .attr('class', 'synteny-block')
      .on('mouseenter', (event) => {
        event.stopPropagation();
        setHoveredBlock(selectedBlock);
        setHoveredChromosome(null);
      })
      .on('mouseleave', (event) => {
        event.stopPropagation();
        setHoveredBlock(null);
      });

    // Draw synteny blocks
    const blockColor = selectedBlock.query_strand === '+' ? config.visual.colors.forwardStrand : config.visual.colors.reverseStrand;

    // Reference block
    syntenyLayer.append('path')
      .attr('d', refArc
        .startAngle(refScale(selectedBlock.ref_start))
        .endAngle(refScale(selectedBlock.ref_end))({} as any) as string)
      .attr('fill', blockColor)
      .attr('opacity', config.visual.blockOpacity)
      .attr('cursor', 'pointer')
      .attr('class', 'synteny-block')
      .on('mouseenter', (event) => {
        event.stopPropagation();
        setHoveredBlock(selectedBlock);
        setHoveredChromosome(null);
      })
      .on('mouseleave', (event) => {
        event.stopPropagation();
        setHoveredBlock(null);
      });

    // Query block
    syntenyLayer.append('path')
      .attr('d', queryArc
        .startAngle(queryScale(selectedBlock.query_start))
        .endAngle(queryScale(selectedBlock.query_end))({} as any) as string)
      .attr('fill', blockColor)
      .attr('opacity', config.visual.blockOpacity)
      .attr('cursor', 'pointer')
      .attr('class', 'synteny-block')
      .on('mouseenter', (event) => {
        event.stopPropagation();
        setHoveredBlock(selectedBlock);
        setHoveredChromosome(null);
      })
      .on('mouseleave', (event) => {
        event.stopPropagation();
        setHoveredBlock(null);
      });

    // Add circular scale
    const addCircularScale = (isRef: boolean) => {
      const scale = isRef ? refScale : queryScale;
      const baseRadius = innerRadius + trackWidth;
      const tickCount = config.scale.tickCount;
      const chromosomeSize = isRef ? refChromosome.chr_size_bp : queryChromosome.chr_size_bp;

      const ticks = d3.range(0, chromosomeSize, chromosomeSize / tickCount);

      ticks.forEach(tick => {
        const angle = scale(tick);
        const x1 = baseRadius * Math.cos(angle - Math.PI / 2);
        const y1 = baseRadius * Math.sin(angle - Math.PI / 2);
        const x2 = (baseRadius + config.scale.tickLength) * Math.cos(angle - Math.PI / 2);
        const y2 = (baseRadius + config.scale.tickLength) * Math.sin(angle - Math.PI / 2);
        const textX = (baseRadius + config.scale.tickLength + 15) * Math.cos(angle - Math.PI / 2);
        const textY = (baseRadius + config.scale.tickLength + 15) * Math.sin(angle - Math.PI / 2);

        // Add tick line
        labelLayer.append('line')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2)
          .attr('stroke', '#94a3b8')
          .attr('stroke-width', 1);

        // Add tick label
        if (config.scale.showLabels) {
          const formattedTick = tick >= 1000000
            ? `${(tick / 1000000).toFixed(1)}M`
            : tick >= 1000
              ? `${(tick / 1000).toFixed(0)}K`
              : tick.toString();

          labelLayer.append('text')
            .attr('x', textX)
            .attr('y', textY)
            .attr('text-anchor', angle > Math.PI ? 'end' : 'start')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', `${config.scale.fontSize}px`)
            .attr('fill', '#64748b')
            .text(formattedTick);
        }
      });
    };

    // Technique: Layered positioning with adaptive spacing
    const addPositionTick = (angle: number, position: number, isRef: boolean, markerType: 'start' | 'end') => {
      const tickRadius = innerRadius + trackWidth;
      const { markers } = config;

      // Calculate block size to determine if we need special handling
      const blockSize = isRef
        ? selectedBlock.ref_end - selectedBlock.ref_start
        : selectedBlock.query_end - selectedBlock.query_start;
      const isSmallBlock = blockSize < 1_000_000; // Less than 1Mb

      // Technique 1: Layered positioning - different radial layers for start/end
      const layerOffset = isSmallBlock ? (markerType === 'start' ? 0 : 15) : 0;
      const adjustedTickRadius = tickRadius + layerOffset;
      const adjustedTextOffset = markers.textOffset + layerOffset;

      // Technique 2: Staggered angular positioning for small blocks
      let adjustedAngle = angle;
      if (isSmallBlock) {
        const staggerOffset = 0.08; // ~4.5 degrees
        adjustedAngle = markerType === 'start' ? angle - staggerOffset : angle + staggerOffset;
      }

      // Draw tick line
      labelLayer.append('line')
        .attr('x1', adjustedTickRadius * Math.cos(adjustedAngle - Math.PI / 2))
        .attr('y1', adjustedTickRadius * Math.sin(adjustedAngle - Math.PI / 2))
        .attr('x2', (adjustedTickRadius + markers.tickLength) * Math.cos(adjustedAngle - Math.PI / 2))
        .attr('y2', (adjustedTickRadius + markers.tickLength) * Math.sin(adjustedAngle - Math.PI / 2))
        .attr('stroke', isRef ? markers.colors.reference : markers.colors.query)
        .attr('stroke-width', markers.strokeWidth)
        .attr('stroke-dasharray', `${markers.dashPattern[0]},${markers.dashPattern[1]}`);

      // Technique 3: Smart text positioning with quadrant-aware anchoring
      const textX = (adjustedTickRadius + adjustedTextOffset) * Math.cos(adjustedAngle - Math.PI / 2);
      const textY = (adjustedTickRadius + adjustedTextOffset) * Math.sin(adjustedAngle - Math.PI / 2);
      const labelAngle = (adjustedAngle * 180 / Math.PI - 90) % 360;

      // Determine text anchor based on position and marker type
      let textAnchor: 'start' | 'middle' | 'end' = 'middle';
      let rotateAngle = labelAngle;

      if (labelAngle > 90 && labelAngle < 270) {
        rotateAngle = labelAngle + 180;
        textAnchor = markerType === 'start' ? 'end' : 'start';
      } else {
        textAnchor = markerType === 'start' ? 'start' : 'end';
      }

      const formattedPosition = position >= 1_000_000
        ? `${(position / 1_000_000).toFixed(1)}M`
        : position >= 1_000
          ? `${(position / 1_000).toFixed(0)}K`
          : position.toString();

      // Technique 4: Badge-style labels with better contrast
      const badgeGroup = labelLayer.append('g')
        .attr('class', `marker-badge ${markerType}`);

      // Background badge
      const badgeWidth = formattedPosition.length * markers.fontSize * 0.7;
      const badgeHeight = markers.fontSize + 6;

      badgeGroup.append('rect')
        .attr('x', textX - badgeWidth / 2)
        .attr('y', textY - badgeHeight / 2)
        .attr('width', badgeWidth)
        .attr('height', badgeHeight)
        .attr('rx', badgeHeight / 2)
        .attr('fill', isRef ? markers.colors.reference : markers.colors.query)
        .attr('fill-opacity', 0.9)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('transform', `rotate(${rotateAngle}, ${textX}, ${textY})`);

      badgeGroup.append('text')
        .attr('x', textX)
        .attr('y', textY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('transform', `rotate(${rotateAngle}, ${textX}, ${textY})`)
        .attr('font-size', `${markers.fontSize - 1}px`)
        .attr('font-weight', '600')
        .attr('fill', 'white')
        .text(formattedPosition);

      // Enhanced marker with type indicator
      const markerGroup = labelLayer.append('g');

      // Outer ring for better visibility
      markerGroup.append('circle')
        .attr('cx', adjustedTickRadius * Math.cos(adjustedAngle - Math.PI / 2))
        .attr('cy', adjustedTickRadius * Math.sin(adjustedAngle - Math.PI / 2))
        .attr('r', markers.markerRadius + 2)
        .attr('fill', 'white')
        .attr('stroke', isRef ? markers.colors.reference : markers.colors.query)
        .attr('stroke-width', 2);

      // Inner marker with type indicator
      markerGroup.append('circle')
        .attr('cx', adjustedTickRadius * Math.cos(adjustedAngle - Math.PI / 2))
        .attr('cy', adjustedTickRadius * Math.sin(adjustedAngle - Math.PI / 2))
        .attr('r', markers.markerRadius)
        .attr('fill', isRef ? markers.colors.reference : markers.colors.query);

      // Add small indicator for start/end
      const indicatorSize = 1;
      markerGroup.append('rect')
        .attr('x', adjustedTickRadius * Math.cos(adjustedAngle - Math.PI / 2) - indicatorSize / 2)
        .attr('y', adjustedTickRadius * Math.sin(adjustedAngle - Math.PI / 2) - indicatorSize / 2)
        .attr('width', indicatorSize)
        .attr('height', indicatorSize)
        .attr('fill', markerType === 'start' ? '#22c55e' : '#ef4444')
        .attr('rx', 0.5);
    };

    // Add circular scales
    addCircularScale(true);   // Reference
    addCircularScale(false);  // Query

    // Smart marker positioning - combine when too close
    const addSmartMarkers = (startAngle: number, endAngle: number, startPos: number, endPos: number, isRef: boolean) => {
      const tickRadius = innerRadius + trackWidth;
      const { markers } = config;
      const blockSize = endPos - startPos;
      const angleDiff = Math.abs(endAngle - startAngle);

      // If markers are too close (< 0.15 radians ≈ 8.5°), combine them
      const shouldCombine = angleDiff < 0.15 || blockSize < 500_000;

      if (shouldCombine) {
        // Single combined marker at midpoint
        const midAngle = (startAngle + endAngle) / 2;
        const midRadius = tickRadius + 10;

        // Draw single tick line
        labelLayer.append('line')
          .attr('x1', tickRadius * Math.cos(midAngle - Math.PI / 2))
          .attr('y1', tickRadius * Math.sin(midAngle - Math.PI / 2))
          .attr('x2', (tickRadius + markers.tickLength) * Math.cos(midAngle - Math.PI / 2))
          .attr('y2', (tickRadius + markers.tickLength) * Math.sin(midAngle - Math.PI / 2))
          .attr('stroke', isRef ? markers.colors.reference : markers.colors.query)
          .attr('stroke-width', markers.strokeWidth)
          .attr('stroke-dasharray', `${markers.dashPattern[0]},${markers.dashPattern[1]}`);

        // Combined badge showing size
        const textX = (midRadius + markers.textOffset) * Math.cos(midAngle - Math.PI / 2);
        const textY = (midRadius + markers.textOffset) * Math.sin(midAngle - Math.PI / 2);
        const labelAngle = (midAngle * 180 / Math.PI - 90) % 360;
        const rotateAngle = labelAngle > 90 && labelAngle < 270 ? labelAngle + 180 : labelAngle;

        // Show midpoint position with size indicator
        const midPosition = (startPos + endPos) / 2;
        const formattedPosition = midPosition >= 1_000_000
          ? `${(midPosition / 1_000_000).toFixed(1)}M`
          : midPosition >= 1_000
            ? `${(midPosition / 1_000).toFixed(0)}K`
            : `${midPosition.toFixed(0)}bp`;

        const formattedSize = blockSize >= 1_000_000
          ? `${(blockSize / 1_000_000).toFixed(1)}M`
          : blockSize >= 1_000
            ? `${(blockSize / 1_000).toFixed(0)}K`
            : `${blockSize}bp`;

        // Display format: show block size instead of position
        const displayText = `${formattedSize}`;

        // Create tooltip-enabled badge group
        const badgeGroup = labelLayer.append('g')
          .attr('class', 'combined-marker-badge')
          .style('cursor', 'pointer');

        // Badge background
        const badgeWidth = formattedSize.length * markers.fontSize * 0.8 + 8;
        const badgeHeight = markers.fontSize + 8;

        badgeGroup.append('rect')
          .attr('x', textX - badgeWidth / 2)
          .attr('y', textY - badgeHeight / 2)
          .attr('width', badgeWidth)
          .attr('height', badgeHeight)
          .attr('rx', badgeHeight / 2)
          .attr('fill', isRef ? markers.colors.reference : markers.colors.query)
          .attr('fill-opacity', 0.95)
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .attr('transform', `rotate(${rotateAngle}, ${textX}, ${textY})`);

        // Badge text - show position instead of size
        badgeGroup.append('text')
          .attr('x', textX)
          .attr('y', textY)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('transform', `rotate(${rotateAngle}, ${textX}, ${textY})`)
          .attr('font-size', `${markers.fontSize}px`)
          .attr('font-weight', '700')
          .attr('fill', 'white')
          .text(displayText);

        // Single marker dot
        labelLayer.append('circle')
          .attr('cx', tickRadius * Math.cos(midAngle - Math.PI / 2))
          .attr('cy', tickRadius * Math.sin(midAngle - Math.PI / 2))
          .attr('r', markers.markerRadius + 1)
          .attr('fill', 'white')
          .attr('stroke', isRef ? markers.colors.reference : markers.colors.query)
          .attr('stroke-width', 3);

        // Add tooltip functionality with enhanced hover effects
        badgeGroup
          .on('mouseenter', (event) => {
            const formatPos = (pos: number) => pos >= 1_000_000
              ? `${(pos / 1_000_000).toFixed(2)}M`
              : pos >= 1_000
                ? `${(pos / 1_000).toFixed(0)}K`
                : pos.toString();

            // Enhance badge on hover
            badgeGroup.select('rect')
              .transition()
              .duration(200)
              .attr('stroke-width', 3)
              .attr('fill-opacity', 1);

            setHoveredBlock({
              ...selectedBlock,
              tooltipContent: `${isRef ? 'Reference' : 'Query'} Range\n${formatPos(startPos)} - ${formatPos(endPos)}\nSize: ${formattedSize}`,
              isCompactMarker: true
            } as any);
          })
          .on('mouseleave', () => {
            // Reset badge appearance
            badgeGroup.select('rect')
              .transition()
              .duration(200)
              .attr('stroke-width', 2)
              .attr('fill-opacity', 0.95);

            setHoveredBlock(null);
          });

      } else {
        // Separate markers for larger blocks
        addPositionTick(startAngle, startPos, isRef, 'start');
        addPositionTick(endAngle, endPos, isRef, 'end');
      }
    };

    // Apply smart markers
    addSmartMarkers(
      refScale(selectedBlock.ref_start),
      refScale(selectedBlock.ref_end),
      selectedBlock.ref_start,
      selectedBlock.ref_end,
      true
    );

    addSmartMarkers(
      queryScale(selectedBlock.query_start),
      queryScale(selectedBlock.query_end),
      selectedBlock.query_start,
      selectedBlock.query_end,
      false
    );

    // Replace the size indicator text with a Glass Neumorphic Badge
    const sizeIndicator = g.append('g')
      .attr('transform', 'translate(0,0)');

    // Add background pill
    sizeIndicator.append('rect')
      .attr('x', -50)
      .attr('y', -15)
      .attr('width', 100)
      .attr('height', 30)
      .attr('rx', 15)
      .attr('fill', 'rgba(255,255,255,0.4)')
      .attr('stroke', 'rgba(255,255,255,0.5)')
      .attr('stroke-width', 1);

    // Add text
    sizeIndicator.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '16px')
      .attr('fill', 'currentColor')
      .text(`${((selectedBlock.ref_end - selectedBlock.ref_start) / 1_000_000).toFixed(1)}Mb`);

    if (zoomBehaviorRef.current) {
      (zoomBehaviorRef.current as any).transform(svg, oldTransform);
    }

    // Cleanup
    return () => {
      svg.on('.zoom', null); // Remove zoom behavior on cleanup
    };
  }, [selectedBlock, referenceData, onBlockClick, config, isGraphFixed, viewBoxDimensions]);

  const handleConfigChange = (newConfig: Partial<SyntenyViewConfig>) => {
    const updatedConfig = {
      ...config,
      ...newConfig,
      visual: { ...config.visual, ...newConfig.visual },
      annotations: { ...config.annotations, ...newConfig.annotations },
      scale: { ...config.scale, ...newConfig.scale },
      interaction: { ...config.interaction, ...newConfig.interaction },
    };
    setConfig(updatedConfig);
    onConfigChange?.(updatedConfig);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full flex flex-col overscroll-none",
        isFullscreen && "fixed inset-0 bg-background/95 backdrop-blur-xs z-50"
      )}
    >
      {/* Controls Header - Updated to take full width in fullscreen */}
      <div className={cn(
        "flex items-center justify-between p-2 border-b shrink-0",
        isFullscreen && "w-full z-100"
      )}>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInfo(!showInfo)}
            className={cn("h-8 text-blue-500 hover:text-blue-600", isFullscreen ? "px-3" : "w-8 p-0")}
          >
            <Info className="h-4 w-4" />
            {isFullscreen && <span className="ml-2 text-xs">Info</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className={cn("h-8 text-gray-500 hover:text-gray-600", isFullscreen ? "px-3" : "w-8 p-0")}
          >
            <Settings className="h-4 w-4" />
            {isFullscreen && <span className="ml-2 text-xs">Settings</span>}
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 text-green-500 hover:text-green-600", isFullscreen ? "px-3" : "w-8 p-0")}
              >
                <Save className="h-4 w-4" />
                {isFullscreen && <span className="ml-2 text-xs">Export</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleSaveAsSVG}>
                <FileType className="h-4 w-4 mr-2" />
                Save as SVG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportImage('png')}>
                <Image className="h-4 w-4 mr-2" />
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportImage('jpg')}>
                <Image className="h-4 w-4 mr-2" />
                Export as JPG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Badge variant="secondary">
            {Math.round(zoom * 100)}%
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isGraphFixed ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsGraphFixed(!isGraphFixed)}
            className={cn("h-8", isFullscreen ? "px-3" : "w-8 p-0")}
          >
            {isGraphFixed ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            {isFullscreen && <span className="ml-2 text-xs">{isGraphFixed ? 'Unlock' : 'Lock'}</span>}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className={cn("h-8", isFullscreen ? "px-3" : "w-8 p-0")}
            disabled={isGraphFixed}
          >
            <ZoomOut className="h-4 w-4" />
            {isFullscreen && <span className="ml-2 text-xs">Zoom Out</span>}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className={cn("h-8", isFullscreen ? "px-3" : "w-8 p-0")}
            disabled={isGraphFixed}
          >
            <RefreshCw className="h-4 w-4" />
            {isFullscreen && <span className="ml-2 text-xs">Reset</span>}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className={cn("h-8", isFullscreen ? "px-3" : "w-8 p-0")}
            disabled={isGraphFixed}
          >
            <ZoomIn className="h-4 w-4" />
            {isFullscreen && <span className="ml-2 text-xs">Zoom In</span>}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullscreen}
            className={cn("h-8", isFullscreen ? "px-3" : "w-8 p-0")}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullscreen && <span className="ml-2 text-xs">Exit</span>}
          </Button>
        </div>
      </div>

      {/* Main Content Area - Updated to take full width */}
      <div className={cn(
        "relative w-full flex-1 min-h-0"
      )}>
        {/* Info Bars */}
        <AnimatePresence>
          {showInfo && (
            <>
              {/* Top Info Bar */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "absolute top-0 left-0 right-0 z-20 p-1.5 bg-white/40 dark:bg-gray-950/40 backdrop-blur-md border-b border-white/50 dark:border-gray-800/50",
                  isFullscreen && "fixed top-[50px]"
                )}
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-1 text-xs">
                  <span className="font-semibold">Synteny Block:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50/50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100 border-blue-200/50 dark:border-blue-800/50">
                      Ref
                    </Badge>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedBlock?.ref_name} Chr: {selectedBlock?.ref_chr} ({refChromosome && (refChromosome.chr_size_bp / 1_000_000).toFixed(1)} Mb)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-50/50 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 border-purple-200/50 dark:border-purple-800/50">
                      Query
                    </Badge>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedBlock?.query_name} Chr: {selectedBlock?.query_chr} ({queryChromosome && (queryChromosome.chr_size_bp / 1_000_000).toFixed(1)} Mb)
                    </span>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Config Card */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "absolute top-2 left-2 z-20",
                isFullscreen && "fixed top-[80px]"
              )}
            >
              <Card className="w-[400px] bg-white/40 dark:bg-gray-950/40 backdrop-blur-md border-white/50 dark:border-gray-800/50">
                <div className="flex justify-between items-center p-3 border-b">
                  <h4 className="font-medium text-sm">Settings</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfig(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <Tabs defaultValue="visual" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="visual" className="text-xs">Visual</TabsTrigger>
                      <TabsTrigger value="annotations" className="text-xs">Annot.</TabsTrigger>
                      <TabsTrigger value="scale" className="text-xs">Scale</TabsTrigger>
                      <TabsTrigger value="interaction" className="text-xs">Inter.</TabsTrigger>
                      <TabsTrigger value="markers" className="text-xs">Markers</TabsTrigger>
                    </TabsList>

                    {/* Visual Tab */}
                    <TabsContent value="visual" className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Ribbon Opacity</Label>
                          <Slider
                            value={[config.visual.ribbonOpacity * 100]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                visual: {
                                  ...config.visual,
                                  ribbonOpacity: value / 100
                                }
                              })
                            }
                            max={100}
                            step={1}
                            className="h-4"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Block Opacity</Label>
                          <Slider
                            value={[config.visual.blockOpacity * 100]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                visual: {
                                  ...config.visual,
                                  blockOpacity: value / 100
                                }
                              })
                            }
                            max={100}
                            step={1}
                            className="h-4"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Track Width</Label>
                          <Slider
                            value={[config.visual.trackWidth * 100]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                visual: { ...config.visual, trackWidth: value / 100 }
                              })
                            }
                            max={50}
                            step={1}
                            className="h-4"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Gap Angle</Label>
                          <Slider
                            value={[config.visual.gapAngle * 100]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                visual: { ...config.visual, gapAngle: value / 100 }
                              })
                            }
                            max={50}
                            step={1}
                            className="h-4"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Reference Color</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full h-6"
                                style={{ backgroundColor: config.visual.colors.reference }}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2">
                              <Input
                                type="color"
                                value={config.visual.colors.reference}
                                onChange={(e) =>
                                  handleConfigChange({
                                    visual: {
                                      ...config.visual,
                                      colors: {
                                        ...config.visual.colors,
                                        reference: e.target.value
                                      }
                                    }
                                  })
                                }
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Query Color</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full h-6"
                                style={{ backgroundColor: config.visual.colors.query }}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2">
                              <Input
                                type="color"
                                value={config.visual.colors.query}
                                onChange={(e) =>
                                  handleConfigChange({
                                    visual: {
                                      ...config.visual,
                                      colors: {
                                        ...config.visual.colors,
                                        query: e.target.value
                                      }
                                    }
                                  })
                                }
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Annotations Tab */}
                    <TabsContent value="annotations" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Show Annotations</Label>
                        <Switch
                          checked={config.annotations.show}
                          onCheckedChange={(checked) =>
                            handleConfigChange({
                              annotations: {
                                ...config.annotations,
                                show: checked
                              }
                            })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Height</Label>
                          <Slider
                            value={[config.annotations.height]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                annotations: {
                                  ...config.annotations,
                                  height: value
                                }
                              })
                            }
                            max={20}
                            step={1}
                            className="h-4"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Spacing</Label>
                          <Slider
                            value={[config.annotations.spacing]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                annotations: {
                                  ...config.annotations,
                                  spacing: value
                                }
                              })
                            }
                            max={10}
                            step={1}
                            className="h-4"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Scale Tab */}
                    <TabsContent value="scale" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Show Ticks</Label>
                        <Switch
                          checked={config.scale.showTicks}
                          onCheckedChange={(checked) =>
                            handleConfigChange({
                              scale: {
                                ...config.scale,
                                showTicks: checked
                              }
                            })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Font Size</Label>
                          <Slider
                            value={[config.scale.fontSize]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                scale: {
                                  ...config.scale,
                                  fontSize: value
                                }
                              })
                            }
                            min={3}
                            max={12}
                            step={1}
                            className="h-4"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Tick Count</Label>
                          <Slider
                            value={[config.scale.tickCount]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                scale: {
                                  ...config.scale,
                                  tickCount: value
                                }
                              })
                            }
                            min={4}
                            max={20}
                            step={1}
                            className="h-4"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Tick Length</Label>
                          <Slider
                            value={[config.scale.tickLength]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                scale: {
                                  ...config.scale,
                                  tickLength: value
                                }
                              })
                            }
                            max={20}
                            step={1}
                            className="h-4"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Interaction Tab */}
                    <TabsContent value="interaction" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Enable Zoom</Label>
                        <Switch
                          checked={config.interaction.enableZoom}
                          onCheckedChange={(checked) =>
                            handleConfigChange({
                              interaction: {
                                ...config.interaction,
                                enableZoom: checked
                              }
                            })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Zoom Min</Label>
                          <Slider
                            value={[config.interaction.zoomExtent[0] * 100]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                interaction: {
                                  ...config.interaction,
                                  zoomExtent: [
                                    value / 100,
                                    config.interaction.zoomExtent[1]
                                  ]
                                }
                              })
                            }
                            min={10}
                            max={100}
                            step={1}
                            className="h-4"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Zoom Max</Label>
                          <Slider
                            value={[config.interaction.zoomExtent[1] * 100]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                interaction: {
                                  ...config.interaction,
                                  zoomExtent: [
                                    config.interaction.zoomExtent[0],
                                    value / 100
                                  ]
                                }
                              })
                            }
                            min={100}
                            max={1000}
                            step={10}
                            className="h-4"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Show Tooltips</Label>
                        <Switch
                          checked={config.interaction.showTooltips}
                          onCheckedChange={(checked) =>
                            handleConfigChange({
                              interaction: { ...config.interaction, showTooltips: checked }
                            })
                          }
                        />
                      </div>
                    </TabsContent>

                    {/* Markers Tab */}
                    <TabsContent value="markers" className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Tick Length</Label>
                          <Slider
                            value={[config.markers.tickLength]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                markers: {
                                  ...config.markers,
                                  tickLength: value
                                }
                              })
                            }
                            min={10}
                            max={40}
                            step={1}
                            className="h-4"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Text Offset</Label>
                          <Slider
                            value={[config.markers.textOffset]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                markers: {
                                  ...config.markers,
                                  textOffset: value
                                }
                              })
                            }
                            min={20}
                            max={60}
                            step={1}
                            className="h-4"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Font Size</Label>
                          <Slider
                            value={[config.markers.fontSize]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                markers: {
                                  ...config.markers,
                                  fontSize: value
                                }
                              })
                            }
                            min={8}
                            max={16}
                            step={1}
                            className="h-4"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Marker Radius</Label>
                          <Slider
                            value={[config.markers.markerRadius]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                markers: {
                                  ...config.markers,
                                  markerRadius: value
                                }
                              })
                            }
                            min={1}
                            max={5}
                            step={0.5}
                            className="h-4"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Stroke Width</Label>
                          <Slider
                            value={[config.markers.strokeWidth]}
                            onValueChange={([value]) =>
                              handleConfigChange({
                                markers: {
                                  ...config.markers,
                                  strokeWidth: value
                                }
                              })
                            }
                            min={0.5}
                            max={3}
                            step={0.5}
                            className="h-4"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Dash Pattern</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              value={config.markers.dashPattern[0]}
                              onChange={(e) =>
                                handleConfigChange({
                                  markers: {
                                    ...config.markers,
                                    dashPattern: [Number(e.target.value), config.markers.dashPattern[1]]
                                  }
                                })
                              }
                              className="h-8"
                            />
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              value={config.markers.dashPattern[1]}
                              onChange={(e) =>
                                handleConfigChange({
                                  markers: {
                                    ...config.markers,
                                    dashPattern: [config.markers.dashPattern[0], Number(e.target.value)]
                                  }
                                })
                              }
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Reference Color</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full h-6"
                                style={{ backgroundColor: config.markers.colors.reference }}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2">
                              <Input
                                type="color"
                                value={config.markers.colors.reference}
                                onChange={(e) =>
                                  handleConfigChange({
                                    markers: {
                                      ...config.markers,
                                      colors: {
                                        ...config.markers.colors,
                                        reference: e.target.value
                                      }
                                    }
                                  })
                                }
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Query Color</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full h-6"
                                style={{ backgroundColor: config.markers.colors.query }}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2">
                              <Input
                                type="color"
                                value={config.markers.colors.query}
                                onChange={(e) =>
                                  handleConfigChange({
                                    markers: {
                                      ...config.markers,
                                      colors: {
                                        ...config.markers.colors,
                                        query: e.target.value
                                      }
                                    }
                                  })
                                }
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SVG Container - Updated to take full width in fullscreen */}
        <div className="w-full h-full flex flex-col">
          <div className="grow relative">
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`0 0 ${viewBoxDimensions.width} ${viewBoxDimensions.height}`}
              preserveAspectRatio="xMidYMid meet"
              className="absolute inset-0 w-full h-full"
            />
          </div>
          <div className="shrink-0 px-4 pb-4 space-y-2">
            <AnimatePresence>
              {showInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  className={cn(
                    "relative w-full z-20 p-2 bg-white/40 dark:bg-gray-950/40 backdrop-blur-md border-t border-white/50 dark:border-gray-800/50 rounded-lg"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-500 dark:text-gray-400">Ref Range:</span>
                      <span className="text-gray-800 dark:text-gray-200">
                        {(selectedBlock?.ref_start! / 1_000_000).toFixed(1)}-{(selectedBlock?.ref_end! / 1_000_000).toFixed(1)}Mb
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-500 dark:text-gray-400">Query Range:</span>
                      <span className="text-gray-800 dark:text-gray-200">
                        {(selectedBlock?.query_start! / 1_000_000).toFixed(1)}-{(selectedBlock?.query_end! / 1_000_000).toFixed(1)}Mb
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-500 dark:text-gray-400">Size:</span>
                      <span className="text-gray-800 dark:text-gray-200">
                        {((selectedBlock?.ref_end - selectedBlock?.ref_start) / 1_000_000).toFixed(2)} Mb
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "flex items-center gap-1 text-xs px-1.5 py-0.5",
                        selectedBlock?.query_strand === '+'
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                      )}
                    >
                      {selectedBlock?.query_strand === '+' ? 'Forward' : 'Reverse'} ({selectedBlock?.query_strand})
                    </Badge>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <HoverTooltip
              hoveredBlock={hoveredBlock}
              hoveredChromosome={hoveredChromosome}
              selectedBlock={selectedBlock}
              refChromosome={refChromosome}
              queryChromosome={queryChromosome}
              showTooltips={showTooltips}
            />
            <PersistentProgressBar
              hoveredBlock={hoveredBlock}
              hoveredChromosome={hoveredChromosome}
              refChromosome={refChromosome}
              showInfo={showInfo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PersistentProgressBar({
  hoveredBlock,
  hoveredChromosome,
  refChromosome,
  showInfo,
}: {
  hoveredBlock: SyntenyData | null;
  hoveredChromosome: { size: number; position?: number; gene?: any } | null;
  refChromosome: ChromosomeData | null | undefined;
  showInfo: boolean;
}) {
  const formatMb = (value: number) => `${(value / 1_000_000).toFixed(2)} Mb`;

  let startPercent = 0;
  let widthPercent = 0;
  let startLabel = '';
  let endLabel = '';
  let midLabel = '';

  if (hoveredBlock && refChromosome) {
    startPercent = (hoveredBlock.ref_start / refChromosome.chr_size_bp) * 100;
    widthPercent = ((hoveredBlock.ref_end - hoveredBlock.ref_start) / refChromosome.chr_size_bp) * 100;
    startLabel = formatMb(hoveredBlock.ref_start);
    endLabel = formatMb(hoveredBlock.ref_end);
  } else if (hoveredChromosome) {
    if (hoveredChromosome.gene) {
      startPercent = (hoveredChromosome.gene.start / hoveredChromosome.size) * 100;
      widthPercent = ((hoveredChromosome.gene.end - hoveredChromosome.gene.start) / hoveredChromosome.size) * 100;
      startLabel = formatMb(hoveredChromosome.gene.start);
      endLabel = formatMb(hoveredChromosome.gene.end);
    } else if (hoveredChromosome.position !== undefined) {
      startPercent = (Math.abs(hoveredChromosome.position) / hoveredChromosome.size) * 100;
      widthPercent = 0.5; // Small marker for a single point
      startPercent -= widthPercent / 2; // Center the marker
      midLabel = formatMb(hoveredChromosome.position);
    }
  }

  widthPercent = Math.max(widthPercent, 0);
  const endPercent = startPercent + widthPercent;

  if (endPercent > 100) {
    widthPercent = 100 - startPercent;
  }
  if (startPercent < 0) {
    startPercent = 0;
  }

  const showLabels = startLabel || endLabel || midLabel;

  return (
    <AnimatePresence>
      {showInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="relative w-full h-8" // Increased height for labels
        >
          <div className="absolute top-0 w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="absolute h-full bg-linear-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600"
              style={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
              }}
              initial={{ width: "0%" }}
              animate={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <div className="absolute inset-0 bg-linear-to-r from-white/10 to-transparent dark:from-white/5" />
          </div>
          {showLabels && (
            <div className="absolute top-3 w-full text-xs text-muted-foreground">
              {midLabel ? (
                <motion.span
                  className="absolute"
                  style={{ left: `${startPercent + widthPercent / 2}%`, transform: 'translateX(-50%)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {midLabel}
                </motion.span>
              ) : (
                <>
                  {/* Check if labels would overlap and handle accordingly */}
                  {widthPercent < 15 ? (
                    // For small blocks, show combined label
                    <motion.span
                      className="absolute whitespace-nowrap bg-background/80 backdrop-blur-xs px-2 py-1 rounded border text-xs"
                      style={{
                        left: `${startPercent + widthPercent / 2}%`,
                        transform: 'translateX(-50%)',
                        zIndex: 10
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      {startLabel} - {endLabel}
                    </motion.span>
                  ) : (
                    // For larger blocks, show separate labels
                    <>
                      <motion.span
                        className="absolute whitespace-nowrap"
                        style={{
                          left: `${startPercent}%`,
                          transform: startPercent < 10 ? 'translateX(0%)' : 'translateX(-50%)'
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {startLabel}
                      </motion.span>
                      <motion.span
                        className="absolute whitespace-nowrap"
                        style={{
                          left: `${startPercent + widthPercent}%`,
                          transform: (startPercent + widthPercent) > 90 ? 'translateX(-100%)' : 'translateX(-50%)'
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {endLabel}
                      </motion.span>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
