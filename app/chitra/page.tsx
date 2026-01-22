'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChromosomeSynteny } from './linear-view';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {

    RefreshCw,
    Upload,

    Database,

    MousePointerClick,
    MonitorUp,

    ArrowLeft,
    ChevronRight,
} from "lucide-react";
import * as d3 from 'd3';
import { KonvaSynteny } from './konva-synteny';
import { SyntenyData, ChromosomeData, ReferenceGenomeData, GeneAnnotation, ChromosomeBreakpoint } from '../types';
// import { visualizationService, VisualizationState } from "@/lib/visualization-service";
import { api } from "@/convex/_generated/api";

// Define VisualizationState locally matching the Convex schema expectation
export interface VisualizationState {
    version: string;
    dataSetType: 'example' | 'custom_db' | 'shared';
    exampleDataSetPath?: string;
    datasetId?: string;

    // Visual Configuration
    selectedSpecies: string[];
    selectedChromosomes: string[];
    selectedSyntenyIds?: string[];
    alignmentFilter: 'all' | 'forward' | 'reverse';
    selectedMutationTypes: Array<[string, any]>; // Serialized Map
    customSpeciesColors: Array<[string, string]>; // Serialized Map

    // View State
    mainViewTransform: { k: number; x: number; y: number };
    showAnnotations: boolean;
    showTooltips: boolean;
    isDetailViewOpen?: boolean;
    currentSelectedBlockIndex?: number;
    chordViewConfig?: any;
}
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LiquidButton } from "@/components/ui/liquid";
import { FlipButton } from "@/components/ui/flip";
import { Switch } from "@/components/ui/switch";
import { ChordView } from "./chord-view";
import { Label } from "@/components/ui/label"
import { InlineSyntenyDisplay } from "@/components/chromoviz/inline-synteny-display";
import { RawDataTablesDisplay } from "@/components/chromoviz/data-viewer-drawer"; // Changed import
import PageWrapper from '@/components/wrapper/page-wrapper';
import { FloatingHUDBar } from "@/components/chromoviz/floating-hud-bar";
import { ExampleFilesDrawer } from "@/components/chromoviz/example-files-drawer";
import { FileUploaderGroup } from "@/components/chromoviz/file-uploader";
import { TipsCarousel } from "@/components/chromoviz/tips-carousel";
import { useRouter, useSearchParams } from 'next/navigation';
import { MutationType } from "@/components/chromoviz/synteny-ribbon";
import { ConfigProps } from "@/components/chromoviz/settings-panel";
import {
    CHROMOSOME_CONFIG,
    GENE_ANNOTATION_CONFIG,
    OPTIMIZATION_CONFIG,
} from "@/config/chromoviz.config";
import BreathingText from "@/components/ui/breathing-text";
import { MobileWarning } from "@/components/chromoviz/mobile-warning";
import { useMutation, useQuery } from "convex/react";

import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

const parseCSVRow = (d: any): any => {
    return {
        ...d,
        query_start: +d.query_start,
        query_end: +d.query_end,
        ref_start: +d.ref_start,
        ref_end: +d.ref_end
    };
};

const parseChromosomeRow = (d: any): any => {
    return {
        ...d,
        chr_size_bp: +d.chr_size_bp,
        centromere_start: d.centromere_start ? +d.centromere_start : null,
        centromere_end: d.centromere_end ? +d.centromere_end : null
    };
};

function parseChromosomeSizeRow(d: d3.DSVRowString): ReferenceGenomeData['chromosomeSizes'][0] {
    return {
        chromosome: d.chromosome,
        size: +d.size,
        centromere_start: d.centromere_start ? +d.centromere_start : undefined,
        centromere_end: d.centromere_end ? +d.centromere_end : undefined
    };
}

import { GeneClass } from '@/config/chromoviz.config';

function parseGeneAnnotationRow(d: d3.DSVRowString): GeneAnnotation {
    return {
        chromosome: d.chromosome,
        genomic_accession: d.genomic_accession,
        start: +d.start,
        end: +d.end,
        strand: d.strand as '+' | '-',
        class: d.class as GeneClass,
        locus_tag: d.locus_tag,
        symbol: d.symbol,
        name: d.name,
        GeneID: d.GeneID
    };
}

function parseBreakpointRow(d: d3.DSVRowString): ChromosomeBreakpoint {
    return {
        ref_chr: d.ref_chr,
        ref_start: +d.ref_start,
        ref_end: +d.ref_end,
        breakpoint: d.breakpoint
    };
}



// Add this interface for ChordView config
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
        colors: any; // Simplified for state, as colors are complex
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

// Add a loading skeleton component
function LoadingSkeleton({
    isSharedLink = false,
    downloadProgress = null
}: {
    isSharedLink?: boolean;
    downloadProgress?: { current: number; total: number } | null;
}) {
    const defaultMessages = [
        "Analyzing Genomes...",
        "Mapping Chromosomes...",
        "Visualizing Synteny...",
        "Loading Annotations...",
        "Preparing Data...",
    ];

    const sharedLinkMessages = [
        "Loading Shared Visualization...",
        "Downloading Files from Storage...",
        "Parsing Custom Data...",
        "Reconstructing Visualization...",
        "Applying Saved Settings...",
    ];

    const messages = isSharedLink ? sharedLinkMessages : defaultMessages;
    const [message, setMessage] = useState(messages[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessage(messages[Math.floor(Math.random() * messages.length)]);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-4 w-full p-4 sm:p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
                <BreathingText
                    label={message}
                    staggerDuration={0.1}
                    fromFontVariationSettings="'wght' 100, 'slnt' 0"
                    toFontVariationSettings="'wght' 800, 'slnt' -10"
                    className="text-lg font-semibold text-gray-600 dark:text-gray-300"
                />
                {isSharedLink && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        {downloadProgress ? (
                            <div className="space-y-2">
                                <div>Downloading files: {downloadProgress.current} of {downloadProgress.total}</div>
                                <div className="w-full max-w-xs mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            "This may take a moment for custom uploaded data..."
                        )}
                    </div>
                )}
                <div className="w-full max-w-md">
                    <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-blue-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Skeleton with pulsing animation */}
            <div className="grid grid-cols-12 gap-4 sm:gap-6 mt-8">
                <div className="col-span-12 lg:col-span-4 space-y-4">
                    <Skeleton className="h-[400px] w-full animate-pulse" />
                    <Skeleton className="h-[200px] w-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                </div>
                <div className="col-span-12 lg:col-span-8 space-y-4">
                    <Skeleton className="h-[600px] sm:h-[700px] md:h-[800px] w-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <Skeleton className="h-6 w-full max-w-lg mx-auto animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
            </div>
        </div>
    );
}

// Add this utility function at the top of the file
// CSV Generation Helpers
function generateSyntenyCSV(data: SyntenyData[]): string {
    const headers = [
        'ref_name', 'ref_chr', 'ref_start', 'ref_end',
        'query_name', 'query_chr', 'query_start', 'query_end', 'query_strand'
    ];
    const rows = data.map(link => [
        link.ref_name, link.ref_chr, link.ref_start.toString(), link.ref_end.toString(),
        link.query_name, link.query_chr, link.query_start.toString(), link.query_end.toString(),
        link.query_strand
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function generateSpeciesCSV(data: ChromosomeData[]): string {
    const headers = ['species_name', 'chr_id', 'chr_size_bp', 'centromere_start', 'centromere_end'];
    const rows = data.map(d => [
        d.species_name, d.chr_id, d.chr_size_bp.toString(),
        d.centromere_start?.toString() || '', d.centromere_end?.toString() || ''
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function generateReferenceCSV(data: ReferenceGenomeData['chromosomeSizes']): string {
    const headers = ['chromosome', 'size', 'centromere_start', 'centromere_end'];
    const rows = data.map(d => [
        d.chromosome, d.size.toString(),
        d.centromere_start?.toString() || '', d.centromere_end?.toString() || ''
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function downloadCSV(data: SyntenyData[], filename: string) {
    // Re-use logic for compatibility, though we prefer raw format for save
    // The previous implementation used human-readable headers, keeping them for download button
    const headers = [
        'Reference Species', 'Reference Chromosome', 'Reference Start (Mb)', 'Reference End (Mb)',
        'Query Species', 'Query Chromosome', 'Query Start (Mb)', 'Query End (Mb)',
        'Size (Mb)', 'Orientation'
    ];
    const rows = data.map(link => [
        link.ref_name, link.ref_chr, (link.ref_start / 1_000_000).toFixed(2), (link.ref_end / 1_000_000).toFixed(2),
        link.query_name, link.query_chr, (link.query_start / 1_000_000).toFixed(2), (link.query_end / 1_000_000).toFixed(2),
        ((link.ref_end - link.ref_start) / 1_000_000).toFixed(2), link.query_strand === '+' ? 'Forward' : 'Reverse'
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Add this type for grouped chromosome options
interface ChromosomeOption {
    label: string;
    value: string;
    species: string;
}

// Add new components for better organization
const FilterBadge = ({ count, total }: { count: number; total: number }) => (
    <Badge
        variant={count === total ? "secondary" : "default"}
        className="ml-2 text-xs"
    >
        {count}/{total}
    </Badge>
);

const FilterSection = ({
    title,
    count,
    total,
    onClear,
    children
}: {
    title: string;
    count: number;
    total: number;
    onClear: () => void;
    children: React.ReactNode;
}) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">{title}</Label>
                <FilterBadge count={count} total={total} />
            </div>
            {count > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="h-7 px-2 text-xs"
                >
                    Clear
                </Button>
            )}
        </div>
        {children}
    </div>
);


// Add this component
const SpeciesColorPicker = ({
    species,
    currentColor,
    onChange
}: {
    species: string;
    currentColor: string;
    onChange: (color: string) => void;
}) => {
    return (
        <div className="flex items-center gap-2">
            <span>{species}</span>
            <input
                type="color"
                value={currentColor}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
            />
        </div>
    );
};


function ChromoVizContent() {
    const { theme, setTheme } = useTheme();
    const [syntenyData, setSyntenyData] = useState<SyntenyData[]>([]);
    const [speciesData, setSpeciesData] = useState<ChromosomeData[]>([]);
    const [referenceData, setReferenceData] = useState<ReferenceGenomeData | null>(null);
    const [geneAnnotations, setGeneAnnotations] = useState<GeneAnnotation[]>([]);
    const [breakpointsData, setBreakpointsData] = useState<ChromosomeBreakpoint[]>([]);
    const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [selectedChromosomes, setSelectedChromosomes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isVerticalLayout, setIsVerticalLayout] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [containerHeight, setContainerHeight] = useState<number>(800);
    const mainCardRef = useRef<HTMLDivElement>(null);
    const [showTooltips, setShowTooltips] = useState(true);
    const [showConnectedOnly, setShowConnectedOnly] = useState(true);
    const [currentBlockIndex, setCurrentBlockIndex] = useState<number>(0);
    const router = useRouter();
    const [isAtRoot, setIsAtRoot] = useState(true);
    const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
    const [selectedMutationTypes, setSelectedMutationTypes] = useState<Map<string, MutationType>>(new Map());
    const [customSpeciesColors, setCustomSpeciesColors] = useState<Map<string, string>>(new Map());
    const [showKonvaDemo, setShowKonvaDemo] = useState(false); // State for Konva demo
    const [currentShareId, setCurrentShareId] = useState<string | null>(null); // For storing the ID of a saved state
    const [isLoadingShare, setIsLoadingShare] = useState(false); // To indicate when sharing/loading shared state
    const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
    // const [user, setUser] = useState<User | null>(null); // Replaced by useUser
    const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null);
    const [initialTransform, setInitialTransform] = useState<any>(null);
    const [chordViewConfig, setChordViewConfig] = useState<Partial<SyntenyViewConfig>>({});
    const [config, setConfig] = useState<ConfigProps>({
        chromosomeHeight: CHROMOSOME_CONFIG.HEIGHT,
        chromosomeSpacing: CHROMOSOME_CONFIG.SPACING,
        annotationHeight: GENE_ANNOTATION_CONFIG.HEIGHT,
        maxVisibleGenes: OPTIMIZATION_CONFIG.MAX_VISIBLE_GENES,
        customSpeciesColors: new Map(),
    });

    const handleConfigChange = useCallback((newConfig: Partial<ConfigProps>) => {
        setConfig(prev => ({ ...prev, ...newConfig }));
    }, []);

    const handleResetLayout = useCallback(() => {
        setConfig(prev => ({
            ...prev,
            chromosomeHeight: CHROMOSOME_CONFIG.HEIGHT,
            chromosomeSpacing: CHROMOSOME_CONFIG.SPACING,
            annotationHeight: GENE_ANNOTATION_CONFIG.HEIGHT,
        }));
        toast.success("Layout settings have been reset to default.");
    }, []);

    useEffect(() => {
        setConfig(prevConfig => ({
            ...prevConfig,
            customSpeciesColors: customSpeciesColors
        }));
    }, [customSpeciesColors]);

    // Clerk handles auth state
    const { user } = useUser();

    // Use Query for shared data loading
    // We skip the query if there is no shareId
    const searchParams = useSearchParams();
    const shareId = searchParams.get('shareId');
    const sharedVizData = useQuery(api.visualizations.getVisualization,
        shareId ? { id: shareId as Id<"visualizations"> } : "skip"
    );
    const saveMutation = useMutation(api.visualizations.saveVisualization);
    const generateUploadUrl = useMutation(api.visualizations.generateUploadUrl);

    // Initialize from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('selectedSpecies');
        if (saved) {
            setSelectedSpecies(JSON.parse(saved));
        }
        setIsInitialized(true);
    }, []);

    // Create options for the MultiSelect component
    const speciesOptions = React.useMemo(() =>
        Array.from(new Set(speciesData.map(d => d.species_name)))
            .map(species => ({
                label: species.replace('_', ' '),
                value: species,
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        [speciesData]
    );

    // Update the chromosome options to include species information
    const chromosomeOptions = React.useMemo(() => {
        const options: { [species: string]: ChromosomeOption[] } = {};

        speciesData.forEach(d => {
            if (!options[d.species_name]) {
                options[d.species_name] = [];
            }
            options[d.species_name].push({
                label: d.chr_id,
                value: `${d.species_name}:${d.chr_id}`, // Make value unique by including species
                species: d.species_name
            });
        });

        // Add reference genome chromosomes
        if (referenceData?.chromosomeSizes) {
            const refSpecies = 'Reference';
            options[refSpecies] = referenceData.chromosomeSizes.map(chr => ({
                label: chr.chromosome,
                value: `ref:${chr.chromosome}`, // Prefix reference chromosomes
                species: refSpecies
            }));
        }

        return options;
    }, [speciesData, referenceData]);

    // Helper function to extract chromosome ID from combined value
    const getChromosomeId = (value: string) => {
        const parts = value.split(':');
        return parts[parts.length - 1];
    };

    // Helper function to extract species from combined value
    const getSpeciesFromValue = (value: string) => {
        return value.split(':')[0];
    };

    // Set initial selections when data is loaded
    useEffect(() => {
        if (speciesData.length > 0 && selectedSpecies.length === 0 && isInitialized) {
            // Only set all species as selected by default if there are no saved selections
            const allSpeciesValues = speciesOptions.map(option => option.value);
            setSelectedSpecies(allSpeciesValues);
            localStorage.setItem('selectedSpecies', JSON.stringify(allSpeciesValues));

            // Set top N chromosomes as selected by default for each species
            const initialSelectedChromosomes: string[] = [];
            const maxChromosomesPerSpecies = 3;

            for (const speciesName in chromosomeOptions) {
                if (chromosomeOptions.hasOwnProperty(speciesName)) {
                    const speciesChrOptions = chromosomeOptions[speciesName];
                    // Sort chromosomes by label (e.g., Chr1, Chr2, ..., Chr10, etc.)
                    // This assumes a natural sort order is desired for "top N"
                    const sortedChrOptions = [...speciesChrOptions].sort((a, b) =>
                        a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' })
                    );
                    const topNChrValues = sortedChrOptions
                        .slice(0, maxChromosomesPerSpecies)
                        .map(option => option.value);
                    initialSelectedChromosomes.push(...topNChrValues);
                }
            }
            setSelectedChromosomes(initialSelectedChromosomes);
        }
    }, [speciesData, speciesOptions, chromosomeOptions, selectedSpecies, isInitialized]);

    // Save to localStorage whenever selection changes
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('selectedSpecies', JSON.stringify(selectedSpecies));
        }
    }, [selectedSpecies, isInitialized]);

    const [isUsingExample, setIsUsingExample] = useState(true);
    const [uploadedFiles, setUploadedFiles] = useState({
        synteny: false,
        species: false,
        reference: false
    });
    const [selectedSynteny, setSelectedSynteny] = useState<SyntenyData[]>([]);
    const [alignmentFilter, setAlignmentFilter] = useState<'all' | 'forward' | 'reverse'>('all');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDetailedViewFullscreen, setIsDetailedViewFullscreen] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null) as React.RefObject<SVGSVGElement>;
    const containerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
    const zoomBehaviorRef = useRef<any>(null);
    const [showAnnotations, setShowAnnotations] = useState(false);
    const [showWelcomeCard, setShowWelcomeCard] = useState(true);

    // Get reference species from synteny data
    const referenceSpecies = React.useMemo(() => {
        if (syntenyData.length === 0) return null;
        return syntenyData[0].ref_name;
    }, [syntenyData]);

    // Modify the loadExampleData function to include breakpoints
    const loadExampleData = async (path: string = '/example/set1') => {
        setIsLoading(true);
        setError(null);
        setIsUsingExample(true);
        localStorage.setItem('lastExamplePath', path);
        setShowWelcomeCard(false);

        // Reset selections to ensure new data is not filtered by stale selections
        setSelectedSpecies([]);
        setSelectedChromosomes([]);
        setSelectedSynteny([]); // Also reset selected synteny blocks

        try {
            // Load required files first
            const [syntenyResponse, referenceResponse, refChromosomeSizes] =
                await Promise.all([
                    d3.csv(`${path}/synteny_data.csv`, parseCSVRow),
                    d3.csv(`${path}/species_data.csv`, parseChromosomeRow),
                    d3.csv(`${path}/ref_chromosome_sizes.csv`, parseChromosomeSizeRow),
                ]);

            // Load optional files - don't fail if they don't exist
            let geneAnnotations: GeneAnnotation[] = [];
            let breakpoints: ChromosomeBreakpoint[] = [];

            // Only attempt to load optional files for datasets that include them (e.g., set3)
            if (path.includes('set3')) {
                try {
                    geneAnnotations = await d3.csv(`${path}/ref_gene_annotations.csv`, parseGeneAnnotationRow);
                } catch (e) {
                    console.log(`Optional file ref_gene_annotations.csv not found for ${path}`);
                }

                try {
                    breakpoints = await d3.csv(`${path}/bp.csv`, parseBreakpointRow);
                } catch (e) {
                    console.log(`Optional file bp.csv not found for ${path}`);
                }
            }

            setSyntenyData(syntenyResponse);
            setSpeciesData(referenceResponse);
            setReferenceData({
                chromosomeSizes: refChromosomeSizes,
                geneAnnotations: geneAnnotations,
                breakpoints: breakpoints
            });
        } catch (err) {
            console.error('Error loading data:', err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while loading data.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Handlers for file uploads
    const handleDataLoad = {
        synteny: (data: SyntenyData[], datasetId?: string) => {
            setSyntenyData(data);
            setShowWelcomeCard(false);
            if (datasetId) setCurrentDatasetId(datasetId);
            setIsUsingExample(false);
        },
        species: (data: ChromosomeData[], datasetId?: string) => {
            console.log('Loading species data:', data);
            setSpeciesData(prev => {
                const newData = [...data];
                // Sort to ensure reference species is at the bottom
                newData.sort((a, b) => {
                    if (a.species_name === 'Reference') return 1;
                    if (b.species_name === 'Reference') return -1;
                    return a.species_name.localeCompare(b.species_name);
                });
                return newData;
            });
            setIsUsingExample(false);
        },
        reference: (data: any[], datasetId?: string) => {
            setReferenceData(prev => ({
                ...prev,
                chromosomeSizes: data.map(d => ({
                    chromosome: d.chromosome,
                    size: +d.size,
                    centromere_start: d.centromere_start ? +d.centromere_start : undefined,
                    centromere_end: d.centromere_end ? +d.centromere_end : undefined
                }))
            }));
            setIsUsingExample(false);
        },
        annotations: (data: GeneAnnotation[], datasetId?: string) => {
            console.log('Loading annotation data:', data);
            setReferenceData(prev => {
                if (!prev) {
                    return {
                        chromosomeSizes: [],
                        geneAnnotations: data,
                        breakpoints: []
                    };
                }
                return {
                    ...prev,
                    geneAnnotations: data,
                    breakpoints: prev.breakpoints
                };
            });
            setIsUsingExample(false);
        },
        breakpoints: (data: ChromosomeBreakpoint[], datasetId?: string) => {
            console.log('Loading breakpoints data:', data);
            setBreakpointsData(data);
            setReferenceData(prev => {
                if (!prev) {
                    return {
                        chromosomeSizes: [],
                        geneAnnotations: [],
                        breakpoints: data
                    };
                }
                return {
                    ...prev,
                    breakpoints: data
                };
            });
            setIsUsingExample(false);
        }
    };

    const canGenerateVisualization = uploadedFiles.synteny &&
        uploadedFiles.species &&
        uploadedFiles.reference;

    const handleGenerateVisualization = () => {
        setIsLoading(true);
        // Small delay to show loading state
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    };

    const filteredData = React.useMemo(() => {
        // Ensure all critical data pieces are available before full computation
        if (!referenceData?.chromosomeSizes ||
            !syntenyData || syntenyData.length === 0 ||
            !speciesData || speciesData.length === 0 ||
            !referenceSpecies) {
            // Return a minimal, safe structure if data is incomplete
            const refChrsWhenIncomplete = referenceData?.chromosomeSizes
                ? referenceData.chromosomeSizes.map(chr => ({
                    species_name: referenceSpecies || "Reference",
                    chr_id: chr.chromosome,
                    chr_type: 'chromosome' as 'chromosome',
                    chr_size_bp: +chr.size,
                    centromere_start: chr.centromere_start ? +chr.centromere_start : undefined,
                    centromere_end: chr.centromere_end ? +chr.centromere_end : undefined,
                    annotations: [] as GeneAnnotation[]
                }))
                : [];
            return {
                referenceData: refChrsWhenIncomplete,
                syntenyData: []
            };
        }

        // 1. Filter synteny by selected species and chromosomes
        const baseFilteredSynteny = syntenyData.filter(d =>
            (selectedSpecies.length === 0 || selectedSpecies.includes(d.query_name)) &&
            (selectedChromosomes.length === 0 ||
                (selectedChromosomes.includes(`ref:${d.ref_chr}`) ||
                    selectedChromosomes.includes(`${d.query_name}:${d.query_chr}`)))
        );

        // 2. Apply alignment filter
        let alignmentFilteredSynteny = baseFilteredSynteny;
        if (alignmentFilter !== 'all') {
            alignmentFilteredSynteny = baseFilteredSynteny.filter(link =>
                alignmentFilter === 'forward' ? link.query_strand === '+' : link.query_strand === '-'
            );
        }

        let finalReferenceData: ChromosomeData[];
        const finalSyntenyData = alignmentFilteredSynteny;

        // 3. Filter chromosomes based on connections if "showConnectedOnly" is true
        if (showConnectedOnly) {
            const connectedChrIds = new Set<string>();
            finalSyntenyData.forEach(link => {
                connectedChrIds.add(`ref:${link.ref_chr}`);
                connectedChrIds.add(`${link.query_name}:${link.query_chr}`);
            });

            const referenceChromosomes = referenceData.chromosomeSizes
                .filter(chr => connectedChrIds.has(`ref:${chr.chromosome}`))
                .map(chr => ({
                    species_name: referenceSpecies,
                    chr_id: chr.chromosome,
                    chr_type: 'chromosome' as 'chromosome',
                    chr_size_bp: +chr.size,
                    centromere_start: chr.centromere_start ? +chr.centromere_start : undefined,
                    centromere_end: chr.centromere_end ? +chr.centromere_end : undefined,
                    annotations: referenceData.geneAnnotations?.filter(
                        gene => gene.chromosome === chr.chromosome
                    ) || []
                }));

            const filteredSpeciesData = speciesData.filter(d =>
                connectedChrIds.has(`${d.species_name}:${d.chr_id}`)
            );

            finalReferenceData = [...filteredSpeciesData, ...referenceChromosomes];
        } else {
            // If not filtering by connection, show all selected chromosomes
            const referenceChromosomes = referenceData.chromosomeSizes
                .filter(chr =>
                    selectedChromosomes.length === 0 ||
                    selectedChromosomes.includes(`ref:${chr.chromosome}`)
                )
                .map(chr => ({
                    species_name: referenceSpecies,
                    chr_id: chr.chromosome,
                    chr_type: 'chromosome' as 'chromosome',
                    chr_size_bp: +chr.size,
                    centromere_start: chr.centromere_start ? +chr.centromere_start : undefined,
                    centromere_end: chr.centromere_end ? +chr.centromere_end : undefined,
                    annotations: referenceData.geneAnnotations?.filter(
                        gene => gene.chromosome === chr.chromosome
                    ) || []
                }));

            const filteredSpeciesData = speciesData.filter(d =>
                (selectedSpecies.length === 0 || selectedSpecies.includes(d.species_name)) &&
                (selectedChromosomes.length === 0 || selectedChromosomes.includes(`${d.species_name}:${d.chr_id}`)) &&
                d.species_name !== referenceSpecies
            );

            finalReferenceData = [...filteredSpeciesData, ...referenceChromosomes];
        }

        // Always put reference genome at bottom
        finalReferenceData.sort((a, b) => {
            if (a.species_name === referenceSpecies) return 1;
            if (b.species_name === referenceSpecies) return -1;
            return a.species_name.localeCompare(b.species_name);
        });

        return {
            referenceData: finalReferenceData,
            syntenyData: finalSyntenyData
        };
    }, [speciesData, syntenyData, selectedSpecies, selectedChromosomes, referenceSpecies, referenceData, showConnectedOnly, alignmentFilter]);

    const handleZoomIn = () => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        d3.select(svgRef.current)
            .transition()
            .duration(750)
            .call(zoomBehaviorRef.current.scaleBy, 1.2);
    };

    const handleZoomOut = () => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        d3.select(svgRef.current)
            .transition()
            .duration(750)
            .call(zoomBehaviorRef.current.scaleBy, 0.8);
    };

    const handleReset = () => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        d3.select(svgRef.current)
            .transition()
            .duration(750)
            .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    };

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement && containerRef.current) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else if (document.fullscreenElement) {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) {
            console.error('Error toggling fullscreen:', err);
        }
    };

    // Add fullscreen change event listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        // Cleanup
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Modify the selection handler to be more robust
    const handleSyntenySelection = (link: SyntenyData, isSelected: boolean) => {
        setSelectedSynteny(prev => {
            // Check if the link already exists in selection
            const exists = prev.some(l =>
                l.ref_chr === link.ref_chr &&
                l.query_chr === link.query_chr &&
                l.ref_start === link.ref_start
            );

            if (isSelected && !exists) {
                return [...prev, link];
            } else if (!isSelected && exists) {
                return prev.filter(l =>
                    l.ref_chr !== link.ref_chr ||
                    l.query_chr !== link.query_chr ||
                    l.ref_start !== link.ref_start
                );
            }
            return prev;
        });
    };

    // Unified toggle handler for both visualization and table
    const handleSyntenyToggle = (link: SyntenyData) => {
        setSelectedSynteny(prev => {
            const exists = prev.some(l =>
                l.ref_chr === link.ref_chr &&
                l.query_chr === link.query_chr &&
                l.ref_start === link.ref_start
            );

            return exists
                ? prev.filter(l =>
                    l.ref_chr !== link.ref_chr ||
                    l.query_chr !== link.query_chr ||
                    l.ref_start !== link.ref_start
                )
                : [...prev, link];
        });
    };

    const toggleLayout = () => {
        setIsVerticalLayout(prev => !prev);
    };

    const onDataLoad = handleDataLoad;

    // Add this useEffect to handle height adjustments
    useEffect(() => {
        if (!mainCardRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const height = entry.contentRect.height;
                setContainerHeight(height);
            }
        });

        resizeObserver.observe(mainCardRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const handleResetToWelcome = () => {
        setSyntenyData([]);
        setSpeciesData([]);
        setReferenceData(null);
        setGeneAnnotations([]);
        setBreakpointsData([]);
        setSelectedSpecies([]);
        setSelectedChromosomes([]);
        setSelectedSynteny([]);
        setShowWelcomeCard(true);
        setIsUsingExample(true);
    };

    const handleMutationTypeSelect = useCallback((syntenyId: string, mutationType?: MutationType) => {
        setSelectedMutationTypes(prev => {
            const newMap = new Map(prev);
            if (mutationType === undefined) {
                newMap.delete(syntenyId);
            } else {
                newMap.set(syntenyId, mutationType);
            }
            return newMap;
        });
    }, []);

    const handleSpeciesColorChange = useCallback((species: string, color: string) => {
        setCustomSpeciesColors(prev => {
            const newColors = new Map(prev);
            newColors.set(species, color);
            return newColors;
        });
    }, []);

    const handleResetSpeciesColors = useCallback(() => {
        setCustomSpeciesColors(new Map());
        localStorage.removeItem('speciesColors');
        toast.success("Species colors have been reset to their default values.");
    }, []);

    // Save colors to localStorage when they change
    useEffect(() => {
        if (customSpeciesColors.size > 0) {
            localStorage.setItem('speciesColors', JSON.stringify(Array.from(customSpeciesColors.entries())));
        }
    }, [customSpeciesColors]);

    // Load colors from localStorage on mount
    useEffect(() => {
        const savedColors = localStorage.getItem('speciesColors');
        if (savedColors) {
            setCustomSpeciesColors(new Map(JSON.parse(savedColors)));
        }
    }, []);

    // Effect to load shared state from URL
    // Load Shared State Effect
    const [processedShareId, setProcessedShareId] = useState<string | null>(null);

    useEffect(() => {
        if (!sharedVizData || processedShareId === shareId) return;

        const load = async () => {
            setIsLoading(true);
            setShowWelcomeCard(false);
            try {
                const { fileUrls, ...state } = sharedVizData;

                // Load Data
                if (state.dataSetType === 'example' && state.exampleDataSetPath) {
                    await loadExampleData(state.exampleDataSetPath);
                } else if (fileUrls && (fileUrls.synteny || fileUrls.species)) {
                    // Fetch files from URLs
                    const [syntenyText, speciesText, refText] = await Promise.all([
                        fileUrls.synteny ? fetch(fileUrls.synteny).then(r => r.text()) : Promise.resolve(""),
                        fileUrls.species ? fetch(fileUrls.species).then(r => r.text()) : Promise.resolve(""),
                        fileUrls.reference ? fetch(fileUrls.reference).then(r => r.text()) : Promise.resolve("")
                    ]);

                    if (syntenyText) handleDataLoad.synteny(d3.csvParse(syntenyText, parseCSVRow));
                    if (speciesText) handleDataLoad.species(d3.csvParse(speciesText, parseChromosomeRow));
                    if (refText) handleDataLoad.reference(d3.csvParse(refText, parseChromosomeSizeRow));
                }

                // Restore State
                // Restore State
                const vizState = state.visualizationState;
                if (vizState) {
                    if (vizState.selectedSpecies) setSelectedSpecies(vizState.selectedSpecies);
                    if (vizState.selectedChromosomes) setSelectedChromosomes(vizState.selectedChromosomes);
                    if (vizState.alignmentFilter) setAlignmentFilter(vizState.alignmentFilter as any);
                    if (vizState.selectedMutationTypes) setSelectedMutationTypes(new Map(vizState.selectedMutationTypes as any));
                    if (vizState.customSpeciesColors) setCustomSpeciesColors(new Map(vizState.customSpeciesColors as any));

                    if (vizState.mainViewTransform) {
                        const transform = d3.zoomIdentity
                            .translate(vizState.mainViewTransform.x, vizState.mainViewTransform.y)
                            .scale(vizState.mainViewTransform.k);
                        setInitialTransform(transform);
                    }

                    if (vizState.chordViewConfig) setChordViewConfig(vizState.chordViewConfig);
                    if (vizState.showAnnotations !== undefined) setShowAnnotations(vizState.showAnnotations);
                    if (vizState.showTooltips !== undefined) setShowTooltips(vizState.showTooltips);
                    if (vizState.isDetailViewOpen !== undefined) setIsDetailViewOpen(vizState.isDetailViewOpen);
                    if (vizState.currentSelectedBlockIndex !== undefined) setCurrentBlockIndex(vizState.currentSelectedBlockIndex);
                }

                toast.success("Visualization loaded!");
                if (shareId) setProcessedShareId(shareId);

            } catch (e) {
                console.error("Error loading shared viz", e);
                toast.error("Failed to load visualization");
            } finally {
                setIsLoading(false);
            }
        };

        load();

    }, [sharedVizData, processedShareId, shareId]);

    useEffect(() => {
        if (initialTransform && svgRef.current && zoomBehaviorRef.current && syntenyData.length > 0) {
            d3.select(svgRef.current).call(zoomBehaviorRef.current.transform, initialTransform);
            setInitialTransform(null);
        }
    }, [initialTransform, syntenyData]);

    // Unified Save/Share Handler
    const handleSaveOrShare = async (title: string, isPublic: boolean): Promise<string | null> => {
        if (!user) {
            toast.error("Please sign in to save or share.");
            return null;
        }

        if (!referenceData || !syntenyData.length) {
            toast.error("Cannot save, data not loaded.");
            return null;
        }

        setIsLoadingShare(true);
        try {
            const currentTransform = d3.zoomTransform(svgRef.current!);

            // 1. Upload files if Custom DB
            let fileStorageIds: { synteny?: string; species?: string; reference?: string } | undefined = undefined;

            if (!isUsingExample) {
                // Upload Synteny
                const syntenyCSV = generateSyntenyCSV(syntenyData);
                const syntenyUrl = await generateUploadUrl();
                const syntenyRes = await fetch(syntenyUrl, { method: "POST", headers: { "Content-Type": "text/csv" }, body: syntenyCSV });
                const { storageId: syntenyId } = await syntenyRes.json();

                // Upload Species
                const speciesCSV = generateSpeciesCSV(speciesData);
                const speciesUrl = await generateUploadUrl();
                const speciesRes = await fetch(speciesUrl, { method: "POST", headers: { "Content-Type": "text/csv" }, body: speciesCSV });
                const { storageId: speciesId } = await speciesRes.json();

                // Upload Reference
                let referenceId = undefined;
                if (referenceData.chromosomeSizes) {
                    const refCSV = generateReferenceCSV(referenceData.chromosomeSizes);
                    const refUrl = await generateUploadUrl();
                    const refRes = await fetch(refUrl, { method: "POST", headers: { "Content-Type": "text/csv" }, body: refCSV });
                    const { storageId: refId } = await refRes.json();
                    referenceId = refId;
                }

                fileStorageIds = {
                    synteny: syntenyId,
                    species: speciesId,
                    reference: referenceId
                };
            }

            // 2. Prepare Visualization State
            const visualizationState = {
                version: "1.0",
                selectedSpecies,
                selectedChromosomes,
                selectedSyntenyIds: selectedSynteny.map(s => `${s.ref_chr}-${s.query_chr}-${s.ref_start}-${s.query_start}`),
                alignmentFilter,
                selectedMutationTypes: Array.from(selectedMutationTypes.entries()),
                customSpeciesColors: Array.from(customSpeciesColors.entries()),
                mainViewTransform: {
                    k: currentTransform.k,
                    x: currentTransform.x,
                    y: currentTransform.y,
                },
                showAnnotations,
                showTooltips,
                isDetailViewOpen,
                currentSelectedBlockIndex: currentBlockIndex,
                chordViewConfig: chordViewConfig,
            };

            // 3. Save Mutation
            const vizId = await saveMutation({
                title,
                isPublic,
                dataSetType: isUsingExample ? 'example' : 'custom_db',
                exampleDataSetPath: isUsingExample ? localStorage.getItem('lastExamplePath') || '/example/set1' : undefined,
                datasetId: !isUsingExample ? (currentDatasetId ?? undefined) : undefined,
                files: fileStorageIds,
                visualizationState
            });

            if (isPublic) {
                const shareUrl = `${window.location.origin}${window.location.pathname}?shareId=${vizId}`;
                toast.success("Shareable link generated!");
                return shareUrl;
            } else {
                toast.success("Visualization saved successfully!");
                return null;
            }

        } catch (e: any) {
            console.error("Error saving visualization:", e);
            toast.error("Failed to save: " + e.message);
            return null;
        } finally {
            setIsLoadingShare(false);
        }
    };

    const handleShare = async (title: string, isPublic: boolean): Promise<string | null> => {
        return handleSaveOrShare(title, isPublic);
    };

    const handleSave = async (title: string): Promise<string | null> => {
        return handleSaveOrShare(title, false);
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
                <div className="text-red-500 mb-4">{error}</div>
                <Button
                    onClick={() => loadExampleData()}
                    variant="outline"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <>
            <MobileWarning />
            <PageWrapper hideNavbar={isFullScreen} hideFooter={isFullScreen}>
                {/* When mainCardRef (a child) is fullscreen, this outer div should not apply fixed/z-index/backdrop styles.
          The browser handles the fullscreen layer for mainCardRef.
          We only adjust padding based on fullscreen state here. */}
                <div className={cn(
                    "relative w-full bg-background flex-1 flex flex-col",
                    isFullScreen ? "fixed inset-0 z-50 p-0" : "py-4 sm:py-6"
                )}>
                    <div className={cn(
                        "flex-1 flex flex-col w-full",
                        isFullScreen ? "h-full p-0" : "px-4 sm:px-6"
                    )}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "flex-1 w-full max-w-[2000px] mx-auto flex flex-col"
                                // Removed: isFullScreen && "backdrop-blur-md" to simplify stacking context
                            )}
                        >
                            {/* Main Content Grid */}
                            <div className="grid grid-cols-12 gap-4 h-full">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="col-span-12 flex flex-col h-full"
                                >
                                    {/* Controls Bar */}
                                    <FloatingHUDBar
                                        onLoadExample={loadExampleData}
                                        selectedSpecies={selectedSpecies}
                                        setSelectedSpecies={setSelectedSpecies}
                                        selectedChromosomes={selectedChromosomes}
                                        setSelectedChromosomes={setSelectedChromosomes}
                                        speciesOptions={speciesOptions}
                                        chromosomeOptions={chromosomeOptions}
                                        referenceGenomeData={referenceData}
                                        syntenyData={syntenyData}
                                        onDataLoad={onDataLoad}
                                        isFullScreen={isFullScreen}
                                        onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                                        showTooltips={showTooltips}
                                        onToggleTooltips={() => setShowTooltips(!showTooltips)}
                                        onResetToWelcome={handleResetToWelcome}
                                        speciesData={speciesData}
                                        onShare={handleShare}
                                        onSave={handleSave}
                                        user={user}
                                        isDetailViewOpen={isDetailViewOpen}
                                        onToggleDetailView={() => setIsDetailViewOpen(prev => !prev)}
                                        selectedSynteny={selectedSynteny}
                                        onToggleSelection={handleSyntenyToggle}
                                        onSelectBlock={(block) => {
                                            const index = selectedSynteny.findIndex(b =>
                                                b.ref_chr === block.ref_chr &&
                                                b.query_chr === block.query_chr &&
                                                b.ref_start === block.ref_start
                                            );
                                            if (index !== -1) {
                                                setCurrentBlockIndex(index);
                                            }
                                        }}
                                        currentBlockIndex={currentBlockIndex}
                                        onExport={(data) => downloadCSV(
                                            data,
                                            `synteny-blocks-${new Date().toISOString().split('T')[0]}.csv`
                                        )}
                                    />

                                    {/* Responsive Layout for Visualization and Details */}
                                    <div className={cn("grid grid-cols-12 gap-6 flex-1 min-h-0", isFullScreen && "pb-24")}> {/* Increased gap */}
                                        {/* Main Visualization Area */}
                                        <div className={cn(
                                            "transition-all duration-300 ease-in-out",
                                            isDetailViewOpen && selectedSynteny.length > 0
                                                ? "col-span-12 lg:col-span-8"
                                                : "col-span-12"
                                        )}>
                                            <Card className={cn(
                                                "h-[80vh] flex flex-col border-l-4 border-r-4", // Added fixed height
                                                isFullScreen && "h-full" // Ensure fullscreen still takes full screen height
                                            )} ref={mainCardRef}>
                                                {/* Modified Card Header with integrated Tips and Back Button */}
                                                {referenceData && !showWelcomeCard && (
                                                    <CardHeader className="p-4 border-b">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-4">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={handleResetToWelcome}
                                                                    className="h-8 px-2 text-xs font-medium text-red-600 dark:text-red-400 
                                  hover:bg-red-500/10 transition-colors group [&_svg]:stroke-red-500
                                  sm:bg-red-500/20 sm:hover:bg-red-500/30"
                                                                >
                                                                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                                                    <span className="hidden sm:inline">Go Back</span>
                                                                </Button>
                                                                <CardTitle className="text-lg font-medium">Linear Synteny Visualization</CardTitle>
                                                                <div className="flex items-center gap-1.5 ml-auto">
                                                                    <Switch
                                                                        id="draggable-view"
                                                                        checked={showKonvaDemo}
                                                                        onCheckedChange={() => setShowKonvaDemo(!showKonvaDemo)}
                                                                    />
                                                                    <label htmlFor="draggable-view" className="text-xs text-muted-foreground whitespace-nowrap">
                                                                        Draggable View
                                                                    </label>
                                                                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                                                        Beta
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <div className="h-8 border-l pl-4">
                                                                <TipsCarousel variant="compact" className="w-[300px]" />
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                )}

                                                {isLoading ? (
                                                    <div className="p-4 flex-1">
                                                        <LoadingSkeleton
                                                            isSharedLink={isLoadingShare}
                                                            downloadProgress={downloadProgress}
                                                        />
                                                    </div>
                                                ) : showKonvaDemo && syntenyData.length > 0 && referenceData && !showWelcomeCard ? ( // Added referenceData check for Konva
                                                    <div className="flex-1 min-h-0">
                                                        <KonvaSynteny
                                                            referenceData={filteredData.referenceData}
                                                            syntenyData={filteredData.syntenyData}
                                                            alignmentFilter={alignmentFilter}
                                                            setAlignmentFilter={setAlignmentFilter}
                                                            onBack={() => setShowKonvaDemo(false)}
                                                        />
                                                    </div>
                                                ) : syntenyData.length > 0 && referenceData && !showWelcomeCard ? ( // Added referenceData check
                                                    <div className="flex-1 min-h-0">
                                                        <ChromosomeSynteny
                                                            referenceData={filteredData.referenceData}
                                                            syntenyData={filteredData.syntenyData}
                                                            referenceGenomeData={referenceData}
                                                            selectedSynteny={selectedSynteny}
                                                            onSyntenySelect={handleSyntenySelection}
                                                            width="100%"
                                                            height="100%"
                                                            alignmentFilter={alignmentFilter}
                                                            setAlignmentFilter={setAlignmentFilter}
                                                            onZoomIn={handleZoomIn}
                                                            onZoomOut={handleZoomOut}
                                                            onReset={handleReset}
                                                            onFullscreen={toggleFullscreen}
                                                            isFullscreen={isFullscreen}
                                                            svgRef={svgRef}
                                                            containerRef={containerRef}
                                                            zoomBehaviorRef={zoomBehaviorRef}
                                                            showAnnotations={showAnnotations}
                                                            setShowAnnotations={setShowAnnotations}
                                                            selectedChromosomes={selectedChromosomes}
                                                            showTooltips={showTooltips}
                                                            setShowTooltips={setShowTooltips}
                                                            selectedMutationTypes={selectedMutationTypes}
                                                            onMutationTypeSelect={handleMutationTypeSelect}
                                                            customSpeciesColors={customSpeciesColors}
                                                            onSpeciesColorChange={handleSpeciesColorChange}
                                                            onResetSpeciesColors={handleResetSpeciesColors}
                                                            showConnectedOnly={showConnectedOnly}
                                                            setShowConnectedOnly={setShowConnectedOnly}
                                                            config={config}
                                                            onConfigChange={handleConfigChange}
                                                            onResetLayout={handleResetLayout}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center p-4 sm:p-8">
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="text-center space-y-12 max-w-4xl w-full"
                                                        >
                                                            {/* Header */}
                                                            <div className="space-y-6">
                                                                <div className="relative w-20 h-20 mx-auto">
                                                                    <div className="absolute inset-0 bg-blue-400/20 dark:bg-blue-500/20 blur-2xl rounded-full" />
                                                                    <div className="relative flex items-center justify-center w-full h-full 
                                  bg-white/50 dark:bg-gray-900/50 backdrop-blur-xs rounded-full 
                                  border border-blue-200 dark:border-blue-800 
                                  shadow-lg shadow-blue-500/20"
                                                                    >
                                                                        <MonitorUp className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                                                        Welcome to CHITRA
                                                                    </h3>
                                                                    <p className="text-xl text-gray-500 dark:text-gray-400">
                                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">C</span>hromosome{' '}
                                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">I</span>nteractive{' '}
                                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">T</span>ool for{' '}
                                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">R</span>earrangement{' '}
                                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">A</span>nalysis
                                                                    </p>
                                                                </div>

                                                                {/* Feature Tags */}
                                                                <div className="flex flex-wrap justify-center gap-2">
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

                                                                {/* Get Started Section */}
                                                                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center text-gray-700 dark:text-gray-300">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                                                                            1
                                                                        </span>
                                                                        <span>Explore example datasets</span>
                                                                    </div>
                                                                    <span className="text-gray-400 hidden sm:inline">or</span>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                                                                            2
                                                                        </span>
                                                                        <span>Upload your files</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Upload Button and More Examples - MOVED UP */}
                                                            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 p-4">
                                                                <FileUploaderGroup
                                                                    onDataLoad={onDataLoad}
                                                                    user={user}
                                                                    trigger={
                                                                        <LiquidButton
                                                                            variant="default" // Assuming default variant aligns with a blue-ish theme
                                                                            size="lg" // To match h-12, lg is typically 3rem (48px)
                                                                            className="min-w-[190px]"
                                                                        >
                                                                            <Upload className="h-5 w-5" />
                                                                            <span className="text-base">Upload Files</span>
                                                                        </LiquidButton>
                                                                    }
                                                                />

                                                                <ExampleFilesDrawer onLoadExample={loadExampleData}>
                                                                    <FlipButton
                                                                        frontText="Examples"
                                                                        backText="View Sets"
                                                                        className="min-w-[190px] h-12 text-base" // Added h-12 and text-base
                                                                        frontClassName="bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-300"
                                                                        backClassName="bg-amber-500 text-white dark:bg-amber-600 dark:text-white"
                                                                    />
                                                                    {/* The FileText icon is omitted as FlipButton frontText/backText expect strings. */}
                                                                    {/* If icon is desired, FlipButton may need modification or icon placed externally. */}
                                                                </ExampleFilesDrawer>
                                                            </div>

                                                            {/* Example Sets Grid - NOW BELOW BUTTONS */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                                                                {[
                                                                    {
                                                                        id: 'set1',
                                                                        name: 'Basic Synteny',
                                                                        description: 'Simple synteny visualization between species',
                                                                        color: 'bg-blue-400',
                                                                        borderColor: 'border-blue-200 dark:border-blue-800',
                                                                        hoverBg: 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10',
                                                                        groupHover: 'group-hover:text-blue-500 dark:group-hover:text-blue-400'
                                                                    },
                                                                    {
                                                                        id: 'set2',
                                                                        name: 'Multi-Species',
                                                                        description: 'Complex synteny relationships across multiple species',
                                                                        color: 'bg-emerald-400',
                                                                        borderColor: 'border-emerald-200 dark:border-emerald-800',
                                                                        hoverBg: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10',
                                                                        groupHover: 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400',
                                                                    },
                                                                    {
                                                                        id: 'set3',
                                                                        name: 'Annotated Genome',
                                                                        description: 'Detailed genome annotations with gene information',
                                                                        color: 'bg-purple-400',
                                                                        borderColor: 'border-purple-200 dark:border-purple-800',
                                                                        hoverBg: 'hover:bg-purple-50/50 dark:hover:bg-purple-900/10',
                                                                        groupHover: 'group-hover:text-purple-500 dark:group-hover:text-purple-400',
                                                                    }
                                                                ].map((set) => (
                                                                    <motion.button
                                                                        key={set.id}
                                                                        onClick={() => loadExampleData(`/example/${set.id}`)}
                                                                        className={cn(
                                                                            "w-full text-left p-3 sm:p-4 rounded-lg transition-all border overflow-hidden",
                                                                            set.borderColor,
                                                                            set.hoverBg,
                                                                            "group"
                                                                        )}
                                                                        whileHover={{ scale: 1.02 }}
                                                                        whileTap={{ scale: 0.98 }}
                                                                    >
                                                                        <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                                                                            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full mt-1 sm:mt-1.5 shrink-0 ${set.color}`} />
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className={cn(
                                                                                    "font-medium text-sm sm:text-base transition-colors wrap-break-word",
                                                                                    set.groupHover
                                                                                )}>
                                                                                    {set.name}
                                                                                </div>
                                                                                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 wrap-break-word line-clamp-2">
                                                                                    {set.description}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </motion.button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                )}
                                            </Card>
                                        </div>

                                        {/* Detailed View Sidebar */}
                                        {isDetailViewOpen && selectedSynteny.length > 0 && !showWelcomeCard && (
                                            <div className="col-span-12 lg:col-span-4 h-full">
                                                <Card className="h-full flex flex-col w-full">
                                                    <CardHeader className="p-4 border-b shrink-0">
                                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                            <MousePointerClick className="h-4 w-4" />
                                                            Selected Block Details
                                                            <Badge variant="secondary" className="ml-auto">
                                                                {selectedSynteny.length} selected
                                                            </Badge>
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-0 flex-1 overflow-hidden">
                                                        <div className="h-full w-full">
                                                            <ChordView
                                                                selectedBlock={selectedSynteny[currentBlockIndex]}
                                                                referenceData={filteredData.referenceData}
                                                                onBlockClick={handleSyntenyToggle}
                                                                selectedSynteny={selectedSynteny}
                                                                onToggleSelection={handleSyntenyToggle}
                                                                isFullscreen={isDetailedViewFullscreen}
                                                                onFullscreen={setIsDetailedViewFullscreen}
                                                                showTooltips={showTooltips}
                                                                config={chordViewConfig}
                                                                onConfigChange={setChordViewConfig}
                                                            />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        )}
                                    </div>

                                    {/* Inline Tables Section - Below Visualization and Details */}
                                    {!isFullScreen && !showWelcomeCard && (syntenyData.length > 0 || speciesData.length > 0 || referenceData) && (
                                        <div className="col-span-12 mt-6 grid grid-cols-12 gap-6">
                                            {/* Left Column: Raw Data Tables */}
                                            <div className="col-span-12 md:col-span-8 lg:col-span-9">
                                                <Card>
                                                    <CardHeader className="p-3 border-b">
                                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                                            <Database className="h-4 w-4 text-muted-foreground" />
                                                            Raw Data Tables
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-3">
                                                        <RawDataTablesDisplay
                                                            syntenyData={syntenyData}
                                                            speciesData={speciesData}
                                                            referenceData={referenceData}
                                                        />
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Right Column: Compact Selected Blocks */}
                                            <div className="col-span-12 md:col-span-4 lg:col-span-3">
                                                <Card>
                                                    <CardHeader className="p-3 border-b">
                                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                                            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                                                            Selected Blocks
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-0"> {/* Padding handled by InlineSyntenyDisplay with isCompact */}
                                                        <InlineSyntenyDisplay
                                                            selectedSynteny={selectedSynteny}
                                                            onToggleSelection={handleSyntenyToggle}
                                                            onSelectBlock={(block) => {
                                                                const index = selectedSynteny.findIndex(b =>
                                                                    b.ref_chr === block.ref_chr &&
                                                                    b.query_chr === block.query_chr &&
                                                                    b.ref_start === block.ref_start
                                                                );
                                                                if (index !== -1) {
                                                                    setCurrentBlockIndex(index);
                                                                }
                                                            }}
                                                            currentBlockIndex={currentBlockIndex}
                                                            // No export button in compact view to save space, can be added if needed
                                                            // onExport={(data) => downloadCSV(
                                                            //   data,
                                                            //   `synteny-blocks-${new Date().toISOString().split('T')[0]}.csv`
                                                            // )}
                                                            isCompact={true} // Enable compact mode
                                                            className="w-full"
                                                        />
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </PageWrapper>
        </>
    );
}

function ChromoVizSuspenseWrapper() {
    const searchParams = useSearchParams();
    const shareId = searchParams.get('shareId');

    return (
        <React.Suspense fallback={<LoadingSkeleton isSharedLink={Boolean(shareId)} />}>
            <ChromoVizContent />
        </React.Suspense>
    );
}

export default function ChromoViz() {
    return (
        <React.Suspense fallback={<LoadingSkeleton />}>
            <ChromoVizSuspenseWrapper />
        </React.Suspense>
    );
}