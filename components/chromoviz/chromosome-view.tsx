"use client";

import * as d3 from "d3";
import React from "react";
import { ChromosomeBreakpoint, ChromosomeData } from "@/app/types";
import { GeneTooltipData, getBreakpointTooltip } from "./tooltip";
import {
  GeneAnnotation,
  CHROMOSOME_CONFIG,
  GENE_ANNOTATION_CONFIG
} from "@/config/chromoviz.config";
import { Badge } from "@/components/ui/badge";

interface ChromosomeViewProps {
  chromosome: ChromosomeData;
  xOffset: number;
  y: number;
  xScale: d3.ScaleLinear<number, number>;
  genomeColor: string;
  onHover: (event: any, content: string | { type: string; data: GeneTooltipData | React.ReactElement }) => void;
  onMove: (event: any) => void;
  onLeave: () => void;
  container: d3.Selection<any, unknown, null, undefined>;
  annotations?: GeneAnnotation[];
  showAnnotations?: boolean;
  config?: {
    chromosomeHeight: number;
    chromosomeSpacing: number;
    annotationHeight?: number;
    geneColors: {
      forward: string;
      reverse: string;
    };
  };
  breakpoints?: ChromosomeBreakpoint[];
  isReferenceChromosome?: boolean;
  useStandardPalette?: boolean;
}






export function renderChromosome({
  chromosome: chr,
  xOffset,
  y,
  xScale,
  genomeColor,
  onHover,
  onMove,
  onLeave,
  container,
  annotations,
  config = {
    chromosomeHeight: CHROMOSOME_CONFIG.HEIGHT,
    chromosomeSpacing: CHROMOSOME_CONFIG.SPACING,
    annotationHeight: GENE_ANNOTATION_CONFIG.HEIGHT,
    geneColors: {
      forward: GENE_ANNOTATION_CONFIG.COLORS.FORWARD,
      reverse: GENE_ANNOTATION_CONFIG.COLORS.REVERSE,
    },
  },
  breakpoints = [],
  showAnnotations = false,
  isReferenceChromosome = false,
  useStandardPalette = false,
}: ChromosomeViewProps) {
  const chrWidth = xScale(chr.chr_size_bp);

  // Determine the effective color for the chromosome
  let effectiveColor = genomeColor;
  if (useStandardPalette) {
    const colorPalette = d3.scaleOrdinal(d3.schemeCategory10);
    effectiveColor = colorPalette(chr.chr_id);
  }

  const chrPath = d3.path();
  const roundedEnd = config.chromosomeHeight / 2;
  const centromereWidth = config.chromosomeHeight * 0.8;
  const centromereIndent = config.chromosomeHeight * 0.2;

  // Draw chromosome path
  chrPath.moveTo(xOffset + roundedEnd, y);

  if (chr.centromere_start && chr.centromere_end) {
    const centromereStart = xOffset + xScale(chr.centromere_start);
    const centromereEnd = xOffset + xScale(chr.centromere_end);
    const centromereMiddle = (centromereStart + centromereEnd) / 2;

    chrPath.lineTo(centromereStart, y);
    chrPath.lineTo(centromereMiddle - centromereWidth / 2, y + centromereIndent);
    chrPath.lineTo(centromereMiddle + centromereWidth / 2, y + centromereIndent);
    chrPath.lineTo(centromereEnd, y);
  }

  chrPath.lineTo(xOffset + chrWidth - roundedEnd, y);
  chrPath.arc(
    xOffset + chrWidth - roundedEnd,
    y + roundedEnd,
    roundedEnd,
    -Math.PI / 2,
    Math.PI / 2
  );

  if (chr.centromere_start && chr.centromere_end) {
    const centromereStart = xOffset + xScale(chr.centromere_start);
    const centromereEnd = xOffset + xScale(chr.centromere_end);
    const centromereMiddle = (centromereStart + centromereEnd) / 2;

    chrPath.lineTo(centromereEnd, y + config.chromosomeHeight);
    chrPath.lineTo(centromereMiddle + centromereWidth / 2, y + config.chromosomeHeight - centromereIndent);
    chrPath.lineTo(centromereMiddle - centromereWidth / 2, y + config.chromosomeHeight - centromereIndent);
    chrPath.lineTo(centromereStart, y + config.chromosomeHeight);
  }

  chrPath.arc(
    xOffset + roundedEnd,
    y + roundedEnd,
    roundedEnd,
    Math.PI / 2,
    -Math.PI / 2
  );

  chrPath.closePath();

  // Create a group for the chromosome
  const chromosomeGroup = container.append("g");

  // Add the main chromosome body
  const body = chromosomeGroup.append("path")
    .attr("d", chrPath.toString())
    .attr("class", "chromosome-body")
    .attr("data-chr", chr.chr_id)
    .attr("data-genome", chr.genome_name)
    .attr("fill", effectiveColor) // Use effectiveColor
    .attr("stroke", d3.color(effectiveColor)?.darker(0.5)?.toString() ?? effectiveColor) // Use effectiveColor
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .style("transition", "opacity 0.2s ease-in-out");

  if (body && 'on' in body) {
    (body as d3.Selection<any, unknown, null, undefined>)
      .on("mousemove", onMove)
      .on("mouseleave", onLeave);
  }

  // Add centromere if present
  if (chr.centromere_start && chr.centromere_end) {
    const centromereStart = xOffset + xScale(chr.centromere_start);
    const centromereEnd = xOffset + xScale(chr.centromere_end);
    const centromereMiddle = (centromereStart + centromereEnd) / 2;

    chromosomeGroup.append("path")
      .attr("d", `M ${centromereStart} ${y} 
          L ${centromereMiddle - centromereWidth / 2} ${y + centromereIndent}
          L ${centromereMiddle + centromereWidth / 2} ${y + centromereIndent}
          L ${centromereEnd} ${y}
          L ${centromereEnd} ${y + config.chromosomeHeight}
          L ${centromereMiddle + centromereWidth / 2} ${y + config.chromosomeHeight - centromereIndent}
          L ${centromereMiddle - centromereWidth / 2} ${y + config.chromosomeHeight - centromereIndent}
          L ${centromereStart} ${y + config.chromosomeHeight} Z`)
      .attr("fill", d3.color(effectiveColor)?.darker(0.3)?.toString() ?? effectiveColor) // Use effectiveColor
      .attr("stroke", "none");
  }

  // Add chromosome label
  chromosomeGroup.append("text")
    .attr("x", xOffset + chrWidth / 2)
    .attr("y", y - roundedEnd - 5)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "500")
    .attr("class", "text-foreground")
    .attr("fill", "currentColor")
    .text(chr.chr_id);

  // Render gene annotations if available and enabled - ONLY for reference chromosome
  if (showAnnotations && annotations && annotations.length > 0 && isReferenceChromosome) {
    const relevantAnnotations = annotations.filter(
      (ann: GeneAnnotation) => ann.chromosome === chr.chr_id
    );

    if (relevantAnnotations.length > 0) {
      // Calculate position for gene annotation tracks using fixed spacing
      const annotationSpacing = CHROMOSOME_CONFIG.SPACING;
      let annotationStartY = y + config.chromosomeHeight + annotationSpacing; // Start below chromosome

      // If breakpoints exist, position gene annotations below the breakpoint track
      if (breakpoints && breakpoints.length > 0) {
        const relevantBreakpoints = breakpoints.filter(bp => bp.ref_chr === chr.chr_id);
        if (relevantBreakpoints.length > 0) {
          annotationStartY = y + config.chromosomeHeight + annotationSpacing + config.chromosomeHeight + annotationSpacing; // Below breakpoint track
        }
      }

      // Create simple gene density heatmap
      const densityBins = 100;
      const binSize = chr.chr_size_bp / densityBins;
      const densityData = new Array(densityBins).fill(0);

      // Calculate gene density per bin
      relevantAnnotations.forEach(gene => {
        const binIndex = Math.floor(gene.start / binSize);
        if (binIndex >= 0 && binIndex < densityBins) {
          densityData[binIndex]++;
        }
      });

      const maxDensity = Math.max(...densityData);

      // Draw the mirrored chromosome background using annotation height
      const annotationHeight = config.annotationHeight || GENE_ANNOTATION_CONFIG.HEIGHT;
      container.append("rect")
        .attr("x", xOffset)
        .attr("y", annotationStartY)
        .attr("width", chrWidth)
        .attr("height", annotationHeight)
        .attr("rx", annotationHeight / 2)
        .attr("ry", annotationHeight / 2)
        .attr("fill", "hsl(var(--muted-foreground))")
        .attr("opacity", 0.15);

      // Draw gene density heatmap
      const binWidth = chrWidth / densityBins;
      densityData.forEach((density, i) => {
        if (density > 0) {
          const intensity = density / maxDensity;
          container.append("rect")
            .attr("x", xOffset + i * binWidth)
            .attr("y", annotationStartY)
            .attr("width", Math.max(1, binWidth))
            .attr("height", annotationHeight)
            .attr("fill", d3.interpolateBlues(0.3 + intensity * 0.7))
            .attr("opacity", 0.8)
            .style("cursor", "pointer")
            .on("mouseover", (event) => {
              const startPos = Math.floor(i * binSize);
              const endPos = Math.floor((i + 1) * binSize);

              onHover(event, {
                type: 'gene-density',
                data: (
                  <div className="space-y-4 p-4 min-w-[320px] bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="bg-linear-to-r from-blue-50 to-indigo-50 text-blue-800 border-blue-200 px-3 py-1.5 font-semibold dark:from-blue-950/40 dark:to-indigo-950/40 dark:text-blue-100 dark:border-blue-800/50"
                        >
                          <div className="h-4 w-4 mr-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                          Gene Density
                        </Badge>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {density} genes
                        </span>
                      </div>
                    </div>

                    {/* Content sections */}
                    <div className="space-y-3">
                      {/* Position info */}
                      <div className="flex items-center justify-between p-3 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800/30">
                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide">
                          Position
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-white dark:bg-gray-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 px-3 py-1 font-mono text-sm"
                        >
                          {(startPos / 1_000_000).toFixed(2)} - {(endPos / 1_000_000).toFixed(2)} Mb
                        </Badge>
                      </div>

                      {/* Density information */}
                      <div className="flex items-center justify-between p-3 bg-linear-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                        <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 uppercase tracking-wide">
                          Density
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-white dark:bg-gray-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 px-3 py-1 font-mono text-sm"
                        >
                          {(density / (binSize / 1_000_000)).toFixed(1)} genes/Mb
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              });
            })
            .on("mousemove", onMove)
            .on("mouseleave", onLeave);
        }
      });
    }
  }

  // Simple breakpoint visualization with color coding by type
  if (isReferenceChromosome && breakpoints.length > 0) {
    const relevantBreakpoints = breakpoints.filter(bp => bp.ref_chr === chr.chr_id);

    if (relevantBreakpoints.length > 0) {
      const annotationSpacing = CHROMOSOME_CONFIG.SPACING;
      const mirroredChrY = y + config.chromosomeHeight + annotationSpacing; // Use fixed spacing below original

      // Draw a mirrored, "ghost" chromosome below the main one
      container.append("rect")
        .attr("x", xOffset)
        .attr("y", mirroredChrY)
        .attr("width", chrWidth)
        .attr("height", config.chromosomeHeight)
        .attr("rx", config.chromosomeHeight / 2)
        .attr("ry", config.chromosomeHeight / 2)
        .attr("fill", "hsl(var(--muted-foreground))")
        .attr("opacity", 0.2);

      // Draw breakpoints as colored segments on the mirrored chromosome
      const breakpointMarkers = container.append("g").attr("class", "breakpoint-markers");

      // Create a color scale for different breakpoint types
      const breakpointColorScale = d3.scaleOrdinal<string>()
        .domain(['deletion', 'insertion', 'inversion', 'translocation', 'duplication', 'rearrangement', 'cnv'])
        .range(['#dc2626', '#ea580c', '#7c3aed', '#0891b2', '#059669', '#be185d', '#4338ca']);

      relevantBreakpoints.forEach((bp, index) => {
        const bpStart = xOffset + xScale(bp.ref_start);
        const bpEnd = xOffset + xScale(bp.ref_end);
        // Ensure a minimum width for visibility of small breakpoints
        const bpWidth = Math.max(6, bpEnd - bpStart); // Minimum 6px width for visibility

        // Use breakpoint name for color
        const breakpointColor = breakpointColorScale(bp.breakpoint.toLowerCase()) || '#6b7280';

        breakpointMarkers.append("rect")
          .attr("x", bpStart)
          .attr("y", mirroredChrY)
          .attr("width", bpWidth)
          .attr("height", config.chromosomeHeight)
          .attr("fill", breakpointColor)
          .attr("stroke", d3.color(breakpointColor)?.darker(0.3)?.toString() || breakpointColor)
          .attr("stroke-width", 1)
          .attr("opacity", 0.85)
          .attr("rx", 2)
          .style("cursor", "pointer")
          .style("transition", "all 0.2s ease")
          .on("mouseover", (event) => {
            d3.select(event.target)
              .attr("opacity", 1)
              .attr("stroke-width", 2);

            const tooltipContent = getBreakpointTooltip(bp);
            onHover(event, { type: 'breakpoint', data: tooltipContent });
          })
          .on("mousemove", onMove)
          .on("mouseleave", (event) => {
            d3.select(event.target)
              .attr("opacity", 0.85)
              .attr("stroke-width", 1);
            onLeave();
          });
      });
    }
  }

  return container;
}
