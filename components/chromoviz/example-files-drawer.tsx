'use client'

import { motion } from "motion/react";
import React, { useState, useMemo } from "react";
import {
  ArrowRight,
  FileText,
  Loader2,
  TableProperties,
  Download,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { parse } from 'csv-parse/sync';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose
} from "@/components/ui/drawer";

interface ExampleFile {
  name: string;
  description: string;
  downloadUrl: string;
  format: { field: string; desc: string }[];
  required: boolean;
  colorClass: string;
}

interface ExampleSet {
  id: string;
  name: string;
  description: string;
}

const EXAMPLE_SETS: ExampleSet[] = [
  {
    id: 'set1',
    name: 'Basic Synteny',
    description: 'Simple synteny visualization between genome'
  },
  {
    id: 'set2',
    name: 'Multi-Genome',
    description: 'Complex synteny relationships across multiple genome'
  },
  {
    id: 'set3',
    name: 'Annotated Genome',
    description: 'Detailed genome annotations with gene information and breakpoints'
  }
];

const getExampleFiles = (setId: string): ExampleFile[] => {
  const basePath = `/example/${setId}`;
  const commonFiles = [
    {
      name: "synteny_data.csv",
      description: "Contains information about syntenic blocks between genomes",
      downloadUrl: `${basePath}/synteny_data.csv`,
      format: [
        { field: "query_name", desc: "Name of query genome" },
        { field: "query_chr", desc: "Query chromosome ID" },
        { field: "query_start", desc: "Start position in query" },
        { field: "query_end", desc: "End position in query" },
        { field: "query_strand", desc: "Orientation (+/-)" },
        { field: "ref_chr", desc: "Reference chromosome ID" },
        { field: "ref_start", desc: "Start position in reference" },
        { field: "ref_end", desc: "End position in reference" },
        { field: "ref_name", desc: "Reference genome name" },
        { field: "qry_lvl", desc: "Query assembly level" }
      ],
      required: true,
      colorClass: 'from-blue-500/5 to-indigo-500/10'
    },
    {
      name: "genome_data.csv",
      description: "Contains chromosome information for each genome",
      downloadUrl: `${basePath}/genome_data.csv`,
      format: [
        { field: "genome_name", desc: "Name of the genome" },
        { field: "chr_id", desc: "Chromosome identifier" },
        { field: "chr_type", desc: "Type of chromosome" },
        { field: "chr_size_bp", desc: "Size of the chromosome in bp" },
        { field: "centromere_start", desc: "Centromere start position", optional: true },
        { field: "centromere_end", desc: "Centromere end position", optional: true }
      ],
      required: true,
      colorClass: 'from-emerald-500/5 to-teal-500/10'
    },
    {
      name: "ref_chromosome_sizes.csv",
      description: "Contains chromosome sizes for the reference genome",
      downloadUrl: `${basePath}/ref_chromosome_sizes.csv`,
      format: [
        { field: "chromosome", desc: "Chromosome identifier" },
        { field: "size", desc: "Total size of the chromosome" },
        { field: "centromere_start", desc: "Centromere start position", optional: true },
        { field: "centromere_end", desc: "Centromere end position", optional: true }
      ],
      required: true,
      colorClass: 'from-violet-500/5 to-purple-500/10'
    }
  ];

  if (setId === 'set3') {
    commonFiles.push({
      name: "breakpoints.csv",
      description: "Contains breakpoint information for genome analysis",
      downloadUrl: `${basePath}/bp.csv`,
      format: [
        { field: "ref_chr", desc: "Reference chromosome" },
        { field: "ref_start", desc: "Start position" },
        { field: "ref_end", desc: "End position" },
        { field: "breakpoint", desc: "Breakpoint name/annotation" }
      ],
      required: false,
      colorClass: 'from-amber-500/5 to-orange-500/10'
    });
  }

  if (setId === 'set3') {
    commonFiles.push({
      name: "ref_gene_annotations.csv",
      description: "Gene annotations for reference genome with detailed feature information",
      downloadUrl: `${basePath}/ref_gene_annotations.csv`,
      format: [
        { field: "chromosome", desc: "Chromosome identifier" },
        { field: "genomic_accession", desc: "Genomic accession number" },
        { field: "start", desc: "Start position" },
        { field: "end", desc: "End position" },
        { field: "strand", desc: "Strand orientation" },
        { field: "class", desc: "Gene class" },
        { field: "locus_tag", desc: "Locus tag" },
        { field: "symbol", desc: "Gene symbol" },
        { field: "name", desc: "Gene name" },
        { field: "GeneID", desc: "Gene ID" }
      ],
      required: false,
      colorClass: 'from-rose-500/5 to-pink-500/10'
    });
  }

  return commonFiles;
};

interface ExampleFilesDrawerProps {
  onLoadExample: (path: string) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ExampleFilesDrawer({ onLoadExample, children, open, onOpenChange }: ExampleFilesDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;
  const [selectedSet, setSelectedSet] = useState<ExampleSet>(EXAMPLE_SETS[0]);
  const [activeFile, setActiveFile] = useState<ExampleFile | null>(null);
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTableDrawerOpen, setIsTableDrawerOpen] = useState(false);
  const [isLoadingExample, setIsLoadingExample] = useState(false);

  const exampleFiles = useMemo(() =>
    getExampleFiles(selectedSet.id),
    [selectedSet]
  );

  const loadCSVData = async (file: ExampleFile) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(file.downloadUrl);
      const text = await response.text();
      const parser = parse(text, { columns: false, skip_empty_lines: true });
      const rows = parser.slice(1, 101); // Get first 100 rows after header
      const headers = parser[0];
      setCsvData({ headers, rows });
    } catch (err) {
      setError('Failed to load CSV data');
      console.error(err);
    }
    setLoading(false);
  };

  const handleFileClick = (file: ExampleFile) => {
    if (activeFile?.name === file.name) {
      setActiveFile(null);
      setCsvData(null);
    } else {
      setActiveFile(file);
      loadCSVData(file);
    }
  };

  const handleSetChange = async (newSet: ExampleSet) => {
    setSelectedSet(newSet);
    setActiveFile(null);
    setCsvData(null);
  };

  const handleLoadExample = async () => {
    setIsLoadingExample(true);
    try {
      await onLoadExample(`/example/${selectedSet.id}`);
      setTimeout(() => {
        setIsOpen(false);
        setIsLoadingExample(false);
      }, 500);
    } catch (error) {
      setIsLoadingExample(false);
      console.error('Failed to load example:', error);
    }
  };

  return (
    <Drawer direction="right" open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>

      <DrawerContent className="h-full overflow-hidden">
        <DrawerHeader className="pb-2 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-xl md:text-2xl">Quick Demos</DrawerTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Choose from our curated example sets to explore different visualization scenarios
              </p>
            </div>
            <DrawerClose className="rounded-full p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex flex-row h-[calc(100%-5rem)] overflow-hidden">
          {/* Left Column - Example Sets */}
          <div className="w-[320px] lg:w-[380px] border-r border-gray-200 dark:border-gray-800 overflow-auto flex-shrink-0">
            <div className="p-4 space-y-2">
              {EXAMPLE_SETS.map((set) => (
                <motion.button
                  key={set.id}
                  onClick={() => handleSetChange(set)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${selectedSet.id === set.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${set.id === 'set1' ? 'bg-blue-400' :
                      set.id === 'set2' ? 'bg-emerald-400' :
                        set.id === 'set3' ? 'bg-purple-400' :
                          set.id === 'set4' ? 'bg-amber-400' :
                            'bg-rose-400'
                      }`} />
                    <div className="flex-1">
                      <div className="font-medium text-base">{set.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {set.description}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {set.id === 'set4' && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            Large Scale
                          </span>
                        )}
                        {set.id === 'set3' && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400">
                              Gene Annotations
                            </span>
                            <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                              Breakpoints
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="sticky bottom-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
              <Button
                size="lg"
                className="w-full bg-blue-500/90 hover:bg-blue-600/90 text-white backdrop-blur-sm disabled:opacity-50"
                onClick={handleLoadExample}
                disabled={isLoadingExample}
              >
                {isLoadingExample ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Load {selectedSet.name}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column - Improved File Details */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Example Files
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Files included in the {selectedSet.name.toLowerCase()} example set
              </p>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                {exampleFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`rounded-lg border transition-all ${activeFile?.name === file.name
                      ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                  >
                    <button
                      onClick={() => handleFileClick(file)}
                      className="w-full text-left p-4 flex items-start gap-3"
                    >
                      <FileText className={`w-5 h-5 mt-0.5 ${activeFile?.name === file.name
                        ? 'text-blue-500'
                        : 'text-gray-400'
                        }`} />
                      <div className="flex-1">
                        <div className="font-medium">{file.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {file.description}
                        </div>
                        {!file.required && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 mt-2">
                            Optional
                          </span>
                        )}
                      </div>
                      <a href={file.downloadUrl} download>
                        <Download className="w-4 h-4" />
                      </a>
                    </button>

                    {/* Expanded Content */}
                    {activeFile?.name === file.name && (
                      <div className="border-t border-gray-200 dark:border-gray-800">
                        <div className="p-4 space-y-4">
                          {/* File Format Section */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              File Format
                            </h4>
                            <div className="grid gap-2">
                              {file.format.map((f, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  className="flex items-start gap-2 text-sm bg-white dark:bg-gray-900 p-2 rounded-md border border-gray-100 dark:border-gray-800"
                                >
                                  <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 mt-1.5" />
                                  <div>
                                    <code className="text-xs font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-900 dark:text-gray-100">
                                      {f.field}
                                    </code>
                                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                                      {f.desc}
                                    </span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                loadCSVData(file);
                                setIsTableDrawerOpen(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <TableProperties className="w-4 h-4" />
                              Preview Data
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="flex items-center gap-2"
                            >
                              <a href={file.downloadUrl} download>
                                <Download className="w-4 h-4" />
                                Download File
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>

      {/* Table View Drawer */}
      <Drawer open={isTableDrawerOpen} onOpenChange={setIsTableDrawerOpen}>
        <DrawerContent className="h-[85vh] max-h-[85vh] md:h-[90vh] md:max-h-[90vh]">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="flex items-center gap-2">
                  <TableProperties className="w-5 h-5" />
                  {activeFile?.name} - Preview
                </DrawerTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing first 100 rows of data
                </p>
              </div>
              <DrawerClose className="rounded-full p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="p-4 h-full overflow-hidden">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading data...</span>
                </div>
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center text-red-500">
                {error}
              </div>
            ) : csvData ? (
              <div className="border dark:border-gray-800 rounded-lg overflow-hidden h-full">
                <div className="overflow-auto h-full">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        {csvData.headers.map((header, i) => (
                          <th key={i} className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300 border-b dark:border-gray-800">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.rows.map((row, i) => (
                        <tr key={i} className="border-b dark:border-gray-800 last:border-0">
                          {row.map((cell, j) => (
                            <td key={j} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </Drawer>
  );
}
