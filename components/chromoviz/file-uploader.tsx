"use client";

import { useState } from "react";
import { FileUploader, FileUploaderContent, FileUploaderItem, FileInput } from "@/components/extension/file-uploader";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from 'uuid';
import { Upload, AlertCircle, CheckCircle2, FileText, TableProperties, Download } from "lucide-react";
import { toast } from "sonner";
import * as d3 from 'd3';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import { FeatureTableConverter } from "@/components/chromoviz/feature-table-converter";
import { ExampleFilesDrawer } from "@/components/chromoviz/example-files-drawer";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { X } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";

export const FILE_CONFIGS = {
  synteny: {
    title: "Synteny Data",
    description: "Upload synteny_data.csv file",
    tooltip: {
      title: "Synteny Data File",
      description: "Contains information about syntenic blocks between genomes",
      format: [
        { field: "query_name", desc: "Query species name" },
        { field: "query_chr", desc: "Query chromosome ID" },
        { field: "query_start", desc: "Start position in query" },
        { field: "query_end", desc: "End position in query" },
        { field: "query_strand", desc: "Orientation (+/-)" },
        { field: "ref_chr", desc: "Reference chromosome ID" },
        { field: "ref_start", desc: "Start position in reference" },
        { field: "ref_end", desc: "End position in reference" },
        { field: "ref_name", desc: "Reference species name" },
        { field: "qry_lvl", desc: "Query level" }
      ]
    },
    fileType: '.csv',
    parser: (d: any) => ({
      ...d,
      query_start: +d.query_start,
      query_end: +d.query_end,
      ref_start: +d.ref_start,
      ref_end: +d.ref_end,
      query_name: d.query_name || d.species_name || "Unknown",
      ref_name: d.ref_name || "Reference",
      qry_lvl: d.qry_lvl || "synteny",
      symbol: d.symbol || "",
      class: d.class || "synteny",
      position: d.position || "",
      GeneID: d.GeneID || ""
    })
  },
  species: {
    title: "Species Data",
    description: "Upload species_data.csv file",
    tooltip: {
      title: "Species Data File",
      description: "Contains chromosome information for each species",
      format: [
        { field: "species_name", desc: "Name of the species" },
        { field: "chr_id", desc: "Chromosome identifier" },
        { field: "chr_type", desc: "Type of chromosome" },
        { field: "chr_size_bp", desc: "Chromosome size in base pairs" },
        { field: "centromere_start", desc: "Centromere start position (optional)" },
        { field: "centromere_end", desc: "Centromere end position (optional)" }
      ]
    },
    fileType: ".csv",
    parser: (d: any) => ({
      ...d,
      chr_size_bp: +d.chr_size_bp,
      centromere_start: d.centromere_start ? +d.centromere_start : null,
      centromere_end: d.centromere_end ? +d.centromere_end : null
    })
  },
  reference: {
    title: "Reference Chromosome Sizes",
    description: "Upload ref_chromosome_sizes.csv file",
    tooltip: {
      title: "Reference Chromosome Sizes File",
      description: "Defines the sizes of chromosomes in the reference genome",
      format: [
        { field: "chromosome", desc: "Chromosome identifier" },
        { field: "size", desc: "Chromosome size in base pairs" },
        { field: "centromere_start", desc: "Centromere start position (optional)" },
        { field: "centromere_end", desc: "Centromere end position (optional)" }
      ]
    },
    fileType: ".csv",
    parser: (d: any) => ({
      ...d,
      size: +d.size,
      centromere_start: d.centromere_start ? +d.centromere_start : null,
      centromere_end: d.centromere_end ? +d.centromere_end : null
    })
  },
  annotations: {
    title: "Gene Annotations",
    description: "Upload ref_gene_annotations.csv file",
    tooltip: {
      title: "Gene Annotations File",
      description: "Contains information about gene annotations",
      format: [
        { field: "chromosome", desc: "Chromosome ID" },
        { field: "genomic_accession", desc: "Genomic accession number" },
        { field: "start", desc: "Start position" },
        { field: "end", desc: "End position" },
        { field: "strand", desc: "Strand (+/-)" },
        { field: "class", desc: "Gene class" },
        { field: "locus_tag", desc: "Locus tag" },
        { field: "symbol", desc: "Gene symbol" },
        { field: "name", desc: "Gene name" },
        { field: "GeneID", desc: "Gene ID" }
      ]
    },
    fileType: '.csv',
    parser: (d: any) => ({
      ...d,
      start: +d.start,
      end: +d.end,
    })
  },
  breakpoints: {
    title: "Breakpoints Data",
    description: "Upload breakpoints.csv file (optional)",
    tooltip: {
      title: "Breakpoints File",
      description: "Contains information about chromosome breakpoints",
      format: [
        { field: "ref_chr", desc: "Reference chromosome ID" },
        { field: "ref_start", desc: "Start position" },
        { field: "ref_end", desc: "End position" },
        { field: "breakpoint", desc: "Breakpoint identifier" }
      ]
    },
    fileType: '.csv',
    parser: (d: any) => ({
      ...d,
      ref_start: +d.ref_start,
      ref_end: +d.ref_end,
    })
  }
} as const;

type FileType = keyof typeof FILE_CONFIGS;

interface FileUploaderProps {
  onDataLoad: (file: File, data: any[]) => void;
  type: FileType;
  required?: boolean;
}

const GRADIENT_CONFIGS = {
  synteny: {
    gradient: "from-blue-500/10 via-cyan-500/10 to-teal-500/10",
    hover: "hover:from-blue-500/20 hover:via-cyan-500/20 hover:to-teal-500/20"
  },
  species: {
    gradient: "from-purple-500/10 via-pink-500/10 to-rose-500/10",
    hover: "hover:from-purple-500/20 hover:via-pink-500/20 hover:to-rose-500/20"
  },
  reference: {
    gradient: "from-amber-500/10 via-orange-500/10 to-red-500/10",
    hover: "hover:from-amber-500/20 hover:via-orange-500/20 hover:to-red-500/20"
  },
  annotations: {
    gradient: "from-emerald-500/10 via-green-500/10 to-lime-500/10",
    hover: "hover:from-emerald-500/20 hover:via-green-500/20 hover:to-lime-500/20"
  },
  breakpoints: {
    gradient: "from-emerald-500/10 via-green-500/10 to-lime-500/10",
    hover: "hover:from-emerald-500/20 hover:via-green-500/20 hover:to-lime-500/20"
  }
} as const;

const FileFormatInfo = ({ config }: { config: typeof FILE_CONFIGS[FileType] }) => (
  <TooltipProvider>
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5 absolute top-2 right-2">
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="sr-only">File format info</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[350px] p-4 space-y-2">
        <div className="space-y-2">
          <h4 className="font-medium">{config.tooltip.title}</h4>
          <p className="text-sm text-muted-foreground">
            {config.tooltip.description}
          </p>
          <div className="space-y-1">
            <p className="text-sm font-medium">Required Fields:</p>
            <div className="grid grid-cols-1 gap-1">
              {config.tooltip.format.map((field, index) => (
                <div key={index} className="text-xs">
                  <span className="font-mono text-primary">{field.field}</span>
                  <span className="text-muted-foreground"> - {field.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-muted-foreground border-t pt-2">
            Download example file from above to see the correct format.
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// Helper component for rendering file format details within an Accordion
const DirectFileFormatInfo = ({ config, type }: { config: typeof FILE_CONFIGS[FileType], type: FileType }) => (
  <Accordion type="single" collapsible className="w-full mt-2">
    <AccordionItem value={`item-${type}`} className="border border-muted-foreground/10 rounded-lg bg-muted/20">
      <AccordionTrigger className="px-3 py-2 text-xs hover:no-underline data-[state=open]:border-b border-muted-foreground/10">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
          <span>View File Format Details</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-0 px-3 pb-3 text-sm">
        <div className="mt-2 space-y-2">
          <h4 className="font-semibold text-foreground text-xs">{config.tooltip.title}</h4>
          <p className="text-xs text-muted-foreground">
            {config.tooltip.description}
          </p>
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">Required Fields:</p>
            <div className="grid grid-cols-1 gap-1">
              {config.tooltip.format.map((field, index) => (
                <div key={index} className="text-xs">
                  <span className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded text-[10px]">{field.field}</span>
                  <span className="text-muted-foreground ml-1">- {field.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground/80 border-t border-muted-foreground/10 pt-1.5 mt-2">
            Download an example file from the "Example Files" drawer to see the correct format.
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

export function CSVUploader({ onDataLoad, type, required = true }: FileUploaderProps) {
  const [files, setFiles] = useState<File[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const config = FILE_CONFIGS[type];

  const dropZoneConfig = {
    maxFiles: 1,
    maxSize: 1024 * 1024 * 1024, // 1GB
    multiple: false,
    accept: {
      'text/csv': [config.fileType]
    },
  };

  const validateCSVFormat = (data: any[]): boolean => {
    if (!data || data.length === 0) return false;

    // Get required fields from the config's tooltip format
    const requiredFields = config.tooltip.format.map(f => f.field);

    // Check if first row has all required fields
    const hasAllFields = requiredFields.every(field =>
      Object.keys(data[0]).includes(field)
    );

    // Check if numeric fields are actually numbers
    const isValidData = data.every(row => {
      return Object.entries(row).every(([key, value]) => {
        if (typeof value === 'number') {
          return !isNaN(value);
        }
        return true;
      });
    });

    return hasAllFields && isValidData;
  };

  const handleFileChange = async (newFiles: File[] | null) => {
    setFiles(newFiles);
    if (!newFiles || newFiles.length === 0) {
      setIsValid(null);
      return;
    }

    setIsLoading(true);
    try {
      const file = newFiles[0];

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error(`Please upload a CSV file for ${config.title}`);
        setIsValid(false);
        setFiles(null);
        return;
      }

      // Validate file size
      if (file.size > dropZoneConfig.maxSize) {
        toast.error(`File size exceeds 1GB limit for ${config.title}`);
        setIsValid(false);
        setFiles(null);
        return;
      }

      const text = await file.text();

      // Check if file is empty
      if (!text.trim()) {
        toast.error(`The uploaded file for ${config.title} is empty`);
        setIsValid(false);
        setFiles(null);
        return;
      }

      let data;
      try {
        data = await d3.csvParse(text, config.parser);
      } catch (parseError) {
        toast.error(`Invalid CSV format for ${config.title}. Please check the file format.`);
        setIsValid(false);
        setFiles(null);
        return;
      }

      // Validate CSV format and required fields
      if (validateCSVFormat(data)) {
        setIsValid(true);
        onDataLoad(file, data);
        toast.success(`Successfully loaded ${config.title}`, {
          description: `Loaded ${data.length} rows of data`
        });
      } else {
        toast.error(`Invalid ${config.title} format`, {
          description: "Please ensure all required fields are present and data types are correct"
        });
        setIsValid(false);
        setFiles(null);
      }
    } catch (error) {
      console.error('File processing error:', error);
      toast.error(`Error processing ${config.title}`, {
        description: (error instanceof Error && error.message) ? error.message : `An error occurred while processing the ${config.title} file.`
      });
      setIsValid(false);
      setFiles(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FileUploader
      value={files}
      onValueChange={handleFileChange}
      dropzoneOptions={dropZoneConfig}
      className="relative"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <FileInput className="border border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 transition-colors bg-linear-to-br from-background to-muted/30 hover:from-background hover:to-muted/50">
          <div className="flex items-center justify-between p-3 text-left relative">
            <motion.div
              className={`absolute inset-0 bg-linear-to-br ${GRADIENT_CONFIGS[type].gradient} opacity-50 rounded-lg transition-colors duration-300 ${GRADIENT_CONFIGS[type].hover}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ duration: 0.5 }}
            />
            <div className="flex items-center gap-3 relative z-10">
              <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium leading-none">{config.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
              </div>
            </div>
            {!required && (
              <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted/50 relative z-10">
                Optional
              </span>
            )}
          </div>
          {/* FileFormatInfo is removed from here, will be placed below FileInput */}
        </FileInput>
        {/* Display file format information directly below the input using Accordion */}
        {/* Wrapper to prevent click on accordion from triggering file dialog */}
        <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }} className="flex items-center gap-2 w-full">
          <div className="grow">
            <DirectFileFormatInfo config={config} type={type} />
          </div>
          <ExampleFilesDrawer onLoadExample={() => {
            toast.info("Load Example feature is not implemented in this context yet.")
          }}>
            <Badge variant="secondary" className="cursor-pointer h-9 flex items-center">
              <Download className="h-3 w-3 mr-1" />
              Example
            </Badge>
          </ExampleFilesDrawer>
        </div>
      </motion.div>

      <FileUploaderContent>
        {files?.map((file, i) => (
          <FileUploaderItem
            key={i}
            index={i}
            className="flex items-center gap-2 text-xs p-2 mt-1.5"
          >
            {isLoading ? (
              <div className="animate-spin">
                <Upload className="h-3.5 w-3.5" />
              </div>
            ) : isValid ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className="truncate">{file.name}</span>
          </FileUploaderItem>
        ))}
      </FileUploaderContent>
    </FileUploader>
  );
}

interface FileUploaderGroupProps {
  onDataLoad: {
    synteny: (data: any[], datasetId?: string) => void;
    species: (data: any[], datasetId?: string) => void;
    reference: (data: any[], datasetId?: string) => void;
    annotations: (data: any[], datasetId?: string) => void;
    breakpoints?: (data: any[], datasetId?: string) => void;
  };
  user?: any;
  children?: React.ReactNode;
  trigger?: React.ReactNode;
}

export function DataViewer({ data, title }: { data: any[]; title: string }) {
  if (!data?.length) return null;

  const columns = Object.keys(data[0]);
  const firstFiveRows = data.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-xs text-muted-foreground">
          Showing 5 of {data.length} rows
        </span>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="text-xs">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {firstFiveRows.map((row, i) => (
              <TableRow key={i}>
                {columns.map((column) => (
                  <TableCell key={column} className="text-xs">
                    {String(row[column])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function FileUploaderGroup({ onDataLoad, user, children, trigger }: FileUploaderGroupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedData, setUploadedData] = useState<{
    synteny?: { file: File, data: any[] };
    species?: { file: File, data: any[] };
    reference?: { file: File, data: any[] };
    annotations?: { file: File, data: any[] };
    breakpoints?: { file: File, data: any[] };
  }>({});
  const [isReadyToVisualize, setIsReadyToVisualize] = useState(false);

  const handleDataLoad = (type: keyof typeof onDataLoad, file: File, data: any[]) => {
    setUploadedData(prev => ({
      ...prev,
      [type]: { file, data }
    }));
  };

  const handleVisualize = async () => {
    if (uploadedData.synteny && uploadedData.species && uploadedData.reference) {
      // Pass parsed data to parent
      // We don't upload here anymore; saving is handled by the main Save action in page.tsx
      onDataLoad.reference(uploadedData.reference.data);
      onDataLoad.species(uploadedData.species.data);
      onDataLoad.synteny(uploadedData.synteny.data);
      if (uploadedData.annotations) {
        onDataLoad.annotations(uploadedData.annotations.data);
      }
      if (uploadedData.breakpoints) {
        onDataLoad.breakpoints?.(uploadedData.breakpoints.data);
      }
      setIsOpen(false);
    }
  };

  const requiredFilesCount = Object.keys(uploadedData).filter(key =>
    ['synteny', 'species', 'reference'].includes(key)
  ).length;

  const optionalFilesCount = Object.keys(uploadedData).filter(key =>
    ['annotations', 'breakpoints'].includes(key)
  ).length;

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {children || trigger || (
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        )}
      </DrawerTrigger>

      <DrawerContent className="h-[85vh] max-h-[85vh] md:h-[90vh] md:max-h-[90vh] overflow-hidden bg-white/95 dark:bg-gray-950/80">
        <DrawerHeader className="pb-2 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-xl md:text-2xl">Data Upload</DrawerTitle>
              <DrawerDescription className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Upload required and optional files to create your visualization
              </DrawerDescription>
            </div>
            <DrawerClose className="rounded-full p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Mobile Layout with Tabs */}
        <div className="flex lg:hidden flex-1 overflow-hidden flex-col">
          <Tabs defaultValue="required" className="h-full flex flex-col">
            <TabsList className="w-full justify-start px-4 pt-2">
              <TabsTrigger value="required" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Required
              </TabsTrigger>
              <TabsTrigger value="optional" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Optional
              </TabsTrigger>
              <TabsTrigger value="converter" className="flex items-center gap-2">
                <TableProperties className="h-4 w-4" />
                Converter
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="required" className="h-full mt-0">
                {/* Required Files Content */}
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto p-4 space-y-3">
                    {['synteny', 'species', 'reference'].map((type) => (
                      <motion.div
                        key={type}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: ['synteny', 'species', 'reference'].indexOf(type) * 0.1 }}
                      >
                        <CSVUploader
                          type={type as keyof typeof FILE_CONFIGS}
                          onDataLoad={(file, data) => handleDataLoad(type as keyof typeof onDataLoad, file, data)}
                        />
                      </motion.div>
                    ))}
                  </div>
                  {/* Progress indicator for required files */}
                  <div className="p-4 bg-white/80 dark:bg-gray-950/80 border-t border-gray-200 dark:border-gray-800">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Required Files</span>
                        <span className="font-medium">{requiredFilesCount}/3</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-500"
                          initial={{ width: "0%" }}
                          animate={{ width: `${(requiredFilesCount / 3) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="optional" className="h-full mt-0">
                {/* Optional Files Content */}
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto p-4 space-y-3">
                    {['annotations', 'breakpoints'].map((type) => (
                      <motion.div
                        key={type}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: ['annotations', 'breakpoints'].indexOf(type) * 0.1 }}
                      >
                        <CSVUploader
                          type={type as keyof typeof FILE_CONFIGS}
                          onDataLoad={(file, data) => handleDataLoad(type as keyof typeof onDataLoad, file, data)}
                          required={false}
                        />
                      </motion.div>
                    ))}
                  </div>
                  {/* Progress indicator for optional files */}
                  <div className="p-4 bg-white/80 dark:bg-gray-950/80 border-t border-gray-200 dark:border-gray-800">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Optional Files</span>
                        <span className="font-medium">{optionalFilesCount}/2</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-green-500"
                          initial={{ width: "0%" }}
                          animate={{ width: `${(optionalFilesCount / 2) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="converter" className="h-full mt-0">
                {/* Feature Table Converter Content */}
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto p-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FeatureTableConverter />
                    </motion.div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Desktop Layout - Three Columns */}
        <div className="flex max-lg:hidden flex-1 overflow-hidden">
          {/* Left Column - Required Files */}
          <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-linear-to-r from-gray-50/50 via-gray-50/30 to-transparent dark:from-gray-900/50 dark:via-gray-900/30 dark:to-transparent">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Required Files
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                These files are necessary for the visualization
              </p>
            </div>

            <div className="p-4 space-y-3">
              {['synteny', 'species', 'reference'].map((type) => (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: ['synteny', 'species', 'reference'].indexOf(type) * 0.1 }}
                >
                  <CSVUploader
                    type={type as keyof typeof FILE_CONFIGS}
                    onDataLoad={(file, data) => handleDataLoad(type as keyof typeof onDataLoad, file, data)}
                  />
                </motion.div>
              ))}
            </div>

            <div className="sticky bottom-0 p-4 bg-white/80 dark:bg-gray-950/80 border-t border-gray-200 dark:border-gray-800 backdrop-blur-xs">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Required Files</span>
                  <span className="font-medium">{requiredFilesCount}/3</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(requiredFilesCount / 3) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Optional Files */}
          <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-linear-to-r from-gray-50/50 via-gray-50/30 to-transparent dark:from-gray-900/50 dark:via-gray-900/30 dark:to-transparent">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Optional Files
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Additional files to enhance the visualization
              </p>
            </div>

            <div className="p-4 space-y-3">
              {['annotations', 'breakpoints'].map((type) => (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: ['annotations', 'breakpoints'].indexOf(type) * 0.1 }}
                >
                  <CSVUploader
                    type={type as keyof typeof FILE_CONFIGS}
                    onDataLoad={(file, data) => handleDataLoad(type as keyof typeof onDataLoad, file, data)}
                    required={false}
                  />
                </motion.div>
              ))}
            </div>

            <div className="sticky bottom-0 p-4 bg-white/80 dark:bg-gray-950/80 border-t border-gray-200 dark:border-gray-800 backdrop-blur-xs">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Optional Files</span>
                  <span className="font-medium">{optionalFilesCount}/2</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(optionalFilesCount / 2) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Feature Table Converter */}
          <div className="w-full lg:w-1/3 overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-linear-to-r from-gray-50/50 via-gray-50/30 to-transparent dark:from-gray-900/50 dark:via-gray-900/30 dark:to-transparent">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <TableProperties className="h-4 w-4" />
                Feature Table Converter
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Convert your feature table data into the required format
              </p>
            </div>

            <div className="p-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FeatureTableConverter />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="sticky bottom-0 p-4 bg-white/80 dark:bg-gray-950/80 border-t border-gray-200 dark:border-gray-800 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {requiredFilesCount === 3 ? (
                <span className="text-green-500 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  All required files uploaded
                </span>
              ) : (
                <span>{3 - requiredFilesCount} required files remaining</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleVisualize}
                disabled={requiredFilesCount < 3}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Create Visualization
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
