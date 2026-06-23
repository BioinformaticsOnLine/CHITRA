'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useState } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  CellContext
} from '@tanstack/react-table'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/animate-ui/radix/tabs"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Database, X, ArrowUpDown, ArrowUp, ArrowDown, Download, Check, MousePointerClick, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SyntenyData, ChromosomeData, GeneAnnotation, ReferenceGenomeData } from "@/app/types"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Props for the RawDataTablesDisplay component
interface RawDataTablesDisplayProps {
  syntenyData?: SyntenyData[]
  genomeData?: ChromosomeData[]
  referenceData?: ReferenceGenomeData | null // Allow null
  className?: string
  onSyntenyRowClick?: (row: SyntenyData) => void
  selectedSynteny?: SyntenyData[]
}

interface DataViewerDrawerProps {
  children: React.ReactNode
  syntenyData?: SyntenyData[]
  genomeData?: ChromosomeData[]
  referenceData?: ReferenceGenomeData | null // Allow null
  isVertical?: boolean
  onSyntenyRowClick?: (row: SyntenyData) => void
  selectedSynteny?: SyntenyData[]
}

function VirtualTable<T>({
  data,
  columns,
  filterColumn,
  onRowClick,
  isRowSelected,
}: {
  data: T[]
  columns: any[]
  filterColumn?: string
  onRowClick?: (row: T) => void
  isRowSelected?: (row: T) => boolean
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const isMobile = useMediaQuery("(max-width: 768px)")

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableSortingRemoval: false, // Only toggle between asc/desc, no third "unsorted" state
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    defaultColumn: {
      cell: ({ getValue }) => getValue() ?? "N/A",
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
  })

  const { rows } = table.getRowModel()
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isMobile ? 120 : 40), // Taller rows for mobile
    overscan: 10,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
      : 0

  return (
    <div className="space-y-2.5 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search all columns..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-xs h-8 text-xs grow"
        />
        {filterColumn && (
          <Input
            placeholder={`Filter by ${filterColumn}...`}
            value={
              (table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(filterColumn)?.setFilterValue(event.target.value)
            }
            className="max-w-xs h-8 text-xs grow"
          />
        )}
      </div>

      <div ref={parentRef} className="h-[60vh] overflow-auto border rounded-md">
        {!isMobile ? (
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              {onRowClick && <col style={{ width: 36 }} />}
              {table.getAllColumns().map((column: any) => (
                <col key={column.id} style={{ width: column.getSize() }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 bg-background z-10">
              {table.getHeaderGroups().map((headerGroup: any) => (
                <tr key={headerGroup.id}>
                  {onRowClick && (
                    <th className="h-14 w-9 px-1 text-center align-middle font-medium text-muted-foreground bg-background text-xs border-b">
                      <MousePointerClick className="w-3.5 h-3.5 mx-auto text-blue-500" />
                    </th>
                  )}
                  {headerGroup.headers.map((header: any) => (
                    <th
                      key={header.id}
                      className="h-14 px-2 py-1 text-left align-middle font-medium text-muted-foreground bg-background text-xs border-b"
                    >
                      {header.isPlaceholder ? null : (
                        <Button
                          variant="ghost"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            "h-auto min-h-[2rem] flex items-center gap-1.5 px-1 py-1 w-full justify-start",
                            header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : ""
                          )}
                        >
                          <span 
                            className="whitespace-normal break-words text-left leading-tight line-clamp-2"
                            title={typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : undefined}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                          {header.column.getCanSort() && (
                            header.column.getIsSorted() === 'asc'
                              ? <ArrowUp className="h-3.5 w-3.5 shrink-0 text-foreground" />
                              : header.column.getIsSorted() === 'desc'
                                ? <ArrowDown className="h-3.5 w-3.5 shrink-0 text-foreground" />
                                : <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" />
                          )}
                        </Button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: `${paddingTop}px` }} colSpan={table.getAllColumns().length + (onRowClick ? 1 : 0)} />
                </tr>
              )}
              {virtualRows.map((virtualRow: any) => {
                const row = rows[virtualRow.index]
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b hover:bg-muted/50 transition-colors",
                      onRowClick && "cursor-pointer",
                      isRowSelected?.(row.original) && "bg-blue-500/20 hover:bg-blue-500/30 dark:bg-blue-500/30 dark:hover:bg-blue-500/40"
                    )}
                    style={{
                      height: 40,
                    }}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {onRowClick && (
                      <td className="w-8 p-1 text-center">
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center mx-auto transition-colors",
                          isRowSelected?.(row.original)
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "border-muted-foreground/30"
                        )}>
                          {isRowSelected?.(row.original) && <Check className="w-3 h-3" />}
                        </div>
                      </td>
                    )}
                    {row.getVisibleCells().map((cell: any) => (
                      <td
                        key={cell.id}
                        className="p-2 text-xs truncate"
                        title={cell.getValue() !== null && cell.getValue() !== undefined ? String(cell.getValue()) : ''}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: `${paddingBottom}px` }} colSpan={table.getAllColumns().length + (onRowClick ? 1 : 0)} />
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div
            style={{
              height: `${totalSize}px`,
              position: 'relative',
            }}
          >
            {paddingTop > 0 && (
              <div style={{ height: `${paddingTop}px` }} />
            )}
            {virtualRows.map((virtualRow: any) => {
              const row = rows[virtualRow.index]
              return (
                <div
                  key={row.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="p-3 border-b">
                    {row.getVisibleCells().map((cell: any) => (
                      <div
                        key={cell.id}
                        className="flex justify-between text-xs py-0.5"
                      >
                        <span 
                          className="font-bold text-muted-foreground pr-2"
                          title={typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : undefined}
                        >
                          {flexRender(
                            cell.column.columnDef.header,
                            cell.getContext()
                          )}
                          :
                        </span>
                        <span 
                          className="text-right truncate"
                          title={cell.getValue() !== null && cell.getValue() !== undefined ? String(cell.getValue()) : ''}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {paddingBottom > 0 && (
              <div style={{ height: `${paddingBottom}px` }} />
            )}
          </div>
        )}
      </div>
      <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between">
        <span>Showing {rows.length} rows</span>
        {onRowClick && (
          <span className="flex items-center gap-1 text-blue-500">
            <MousePointerClick className="w-3 h-3" />
            Click rows to highlight in visualization
          </span>
        )}
      </div>
    </div>
  )
}

// Column definitions for each table type
const columnHelper = createColumnHelper<any>()

/** Renders a column header with a hover tooltip describing the field. */
function ColHeader({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help">
          {label}
          <Info className="h-3 w-3 opacity-40 shrink-0" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6} className="max-w-[220px] text-xs leading-snug z-[200]">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

const syntenyColumns = [
  columnHelper.display({ id: 'sno', header: () => <ColHeader label="S.No" tooltip="Sequential row number" />, size: 60, cell: (info) => info.row.index + 1 }),
  columnHelper.accessor('query_name', { header: () => <ColHeader label="Query Name" tooltip="Name of the query genome being compared against the reference" />, size: 140 }),
  columnHelper.accessor('query_chr', { header: () => <ColHeader label="Query Chr" tooltip="Chromosome identifier in the query genome" />, size: 90 }),
  columnHelper.accessor('query_start', { header: () => <ColHeader label="Query Start" tooltip="Start position of the synteny block on the query chromosome (bp)" />, size: 110, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('query_end', { header: () => <ColHeader label="Query End" tooltip="End position of the synteny block on the query chromosome (bp)" />, size: 110, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('query_strand', { header: () => <ColHeader label="Strand" tooltip="Alignment strand orientation: + (forward/syntenic) or − (reverse/inverted)" />, size: 70 }),
  columnHelper.accessor('ref_chr', { header: () => <ColHeader label="Ref Chr" tooltip="Chromosome identifier in the reference genome" />, size: 90 }),
  columnHelper.accessor('ref_start', { header: () => <ColHeader label="Ref Start" tooltip="Start position of the synteny block on the reference chromosome (bp)" />, size: 110, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('ref_end', { header: () => <ColHeader label="Ref End" tooltip="End position of the synteny block on the reference chromosome (bp)" />, size: 110, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('ref_name', { header: () => <ColHeader label="Ref Genome" tooltip="Name of the reference genome" />, size: 140 }),
  columnHelper.accessor('symbol', { header: () => <ColHeader label="Symbol" tooltip="Gene symbol associated with this synteny block (if annotated)" />, size: 90 }),
  columnHelper.accessor('class', { header: () => <ColHeader label="Class" tooltip="Functional or structural class of the synteny block (e.g., gene, repeat)" />, size: 110 }),
  columnHelper.accessor('GeneID', { header: () => <ColHeader label="Gene ID" tooltip="NCBI Gene identifier for the annotated gene in this block" />, size: 110 }),
]

const genomeColumns = [
  columnHelper.display({ id: 'sno', header: () => <ColHeader label="S.No" tooltip="Sequential row number" />, size: 60, cell: (info) => info.row.index + 1 }),
  columnHelper.accessor('genome_name', { header: () => <ColHeader label="Genome Name" tooltip="Name of the species or genome assembly" />, size: 150 }),
  columnHelper.accessor('chr_id', { header: () => <ColHeader label="Chr ID" tooltip="Chromosome identifier within this genome (e.g., chr1, chrX)" />, size: 110 }),
  columnHelper.accessor('chr_type', { header: () => <ColHeader label="Type" tooltip="Chromosome type, e.g., autosome or sex chromosome" />, size: 90 }),
  columnHelper.accessor('chr_size_bp', { header: () => <ColHeader label="Size (bp)" tooltip="Total length of the chromosome in base pairs" />, size: 120, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('centromere_start', { header: () => <ColHeader label="Centromere Start" tooltip="Start position of the centromere region (bp). Optional — used to render the centromere constriction on chromosome ideograms." />, size: 165, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('centromere_end', { header: () => <ColHeader label="Centromere End" tooltip="End position of the centromere region (bp). Optional — used to render the centromere constriction on chromosome ideograms." />, size: 160, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
]

const referenceColumns = [
  columnHelper.display({ id: 'sno', header: () => <ColHeader label="S.No" tooltip="Sequential row number" />, size: 60, cell: (info) => info.row.index + 1 }),
  columnHelper.accessor('chromosome', { header: () => <ColHeader label="Chromosome" tooltip="Reference chromosome identifier" />, size: 120 }),
  columnHelper.accessor('size', { header: () => <ColHeader label="Size (bp)" tooltip="Total length of the reference chromosome in base pairs" />, size: 120, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('centromere_start', { header: () => <ColHeader label="Centromere Start" tooltip="Start position of the centromere region (bp). Optional — used to render the centromere constriction on chromosome ideograms." />, size: 170, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('centromere_end', { header: () => <ColHeader label="Centromere End" tooltip="End position of the centromere region (bp). Optional — used to render the centromere constriction on chromosome ideograms." />, size: 165, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
]

const geneColumns = [
  columnHelper.display({ id: 'sno', header: () => <ColHeader label="S.No" tooltip="Sequential row number" />, size: 60, cell: (info) => info.row.index + 1 }),
  columnHelper.accessor('chromosome', { header: () => <ColHeader label="Chr" tooltip="Chromosome on which this gene is located" />, size: 100 }),
  columnHelper.accessor('genomic_accession', { header: () => <ColHeader label="Accession" tooltip="NCBI genomic accession number for the sequence containing this gene" />, size: 140 }),
  columnHelper.accessor('start', { header: () => <ColHeader label="Start" tooltip="Gene start position on the chromosome (bp)" />, size: 110, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('end', { header: () => <ColHeader label="End" tooltip="Gene end position on the chromosome (bp)" />, size: 110, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('strand', { header: () => <ColHeader label="Strand" tooltip="Gene strand orientation: + (forward) or − (reverse)" />, size: 70 }),
  columnHelper.accessor('class', { header: () => <ColHeader label="Class" tooltip="Gene biotype or functional class (e.g., protein-coding, pseudogene, ncRNA)" />, size: 140 }),
  columnHelper.accessor('symbol', { header: () => <ColHeader label="Symbol" tooltip="Official gene symbol (e.g., BRCA1)" />, size: 90, cell: (info: CellContext<any, string>) => info.getValue() || 'N/A' }),
  columnHelper.accessor('name', { header: () => <ColHeader label="Name" tooltip="Full descriptive name of the gene" />, size: 180, cell: (info: CellContext<any, string>) => info.getValue() || 'N/A' }),
  columnHelper.accessor('locus_tag', { header: () => <ColHeader label="Locus Tag" tooltip="Systematic locus tag identifier assigned to this gene" />, size: 110, cell: (info: CellContext<any, string>) => info.getValue() || 'N/A' }),
  columnHelper.accessor('GeneID', { header: () => <ColHeader label="Gene ID" tooltip="NCBI Gene identifier (numeric) for this gene" />, size: 110 }),
]

const breakpointColumns = [
  columnHelper.display({ id: 'sno', header: () => <ColHeader label="S.No" tooltip="Sequential row number" />, size: 60, cell: (info) => info.row.index + 1 }),
  columnHelper.accessor('ref_chr', { header: () => <ColHeader label="Ref Chr" tooltip="Reference chromosome on which the breakpoint is located" />, size: 160 }),
  columnHelper.accessor('ref_start', { header: () => <ColHeader label="Start Pos" tooltip="Start position of the breakpoint interval on the reference chromosome (bp)" />, size: 130, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('ref_end', { header: () => <ColHeader label="End Pos" tooltip="End position of the breakpoint interval on the reference chromosome (bp)" />, size: 130, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('breakpoint', { header: () => <ColHeader label="Breakpoint Type" tooltip="Type of chromosomal rearrangement at this breakpoint (e.g., inversion, translocation)" />, size: 160 }),
]

function SkeletonLoader() {
  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-1/4" />
      </div>
      <div className="border rounded-md p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
      <div className="text-center text-sm text-muted-foreground animate-pulse">
        Fetching data from the cosmos...
      </div>
    </div>
  )
}

interface Interval { start: number; end: number; }

function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length <= 1) return intervals;
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].start <= last.end) {
      last.end = Math.max(last.end, sorted[i].end);
    } else {
      merged.push(sorted[i]);
    }
  }
  return merged;
}

function classifyRearrangement(link: SyntenyData): string {
  const isSameChromosome = link.ref_chr === link.query_chr;
  const isReverseStrand = link.query_strand === '-';
  
  if (isSameChromosome && !isReverseStrand) return "SYN";
  if (isSameChromosome && isReverseStrand) return "INV";
  if (!isSameChromosome && !isReverseStrand) return "TRANS";
  if (!isSameChromosome && isReverseStrand) return "INVTR";
  return "UNKNOWN";
}

function SummaryDashboard({ syntenyData, referenceData }: RawDataTablesDisplayProps) {
  if (!syntenyData || !referenceData || !referenceData.chromosomeSizes) return <SkeletonLoader />;

  // Coverage Logic
  const coverageData = referenceData.chromosomeSizes.map(chr => {
    const blocks = syntenyData.filter(d => d.ref_chr === chr.chromosome);
    const intervals = blocks.map(d => ({ start: d.ref_start, end: d.ref_end }));
    const merged = mergeIntervals(intervals);
    const coveredBp = merged.reduce((acc, curr) => acc + (curr.end - curr.start), 0);
    const proportion = chr.size > 0 ? (coveredBp / chr.size) * 100 : 0;
    return {
      chromosome: chr.chromosome,
      sizeBp: chr.size,
      coveredBp,
      proportionPercent: proportion,
    };
  });

  // Rearrangement Logic
  let synCount = 0, invCount = 0, transCount = 0, invtrCount = 0;
  
  // Size Logic
  let large = 0, medium = 0, small = 0, micro = 0;
  
  syntenyData.forEach(link => {
    const type = classifyRearrangement(link);
    if (type === "SYN") synCount++;
    if (type === "INV") invCount++;
    if (type === "TRANS") transCount++;
    if (type === "INVTR") invtrCount++;
    
    const sizeMb = (link.ref_end - link.ref_start) / 1000000;
    if (sizeMb > 10) large++;
    else if (sizeMb > 5) medium++;
    else if (sizeMb > 1) small++;
    else micro++;
  });

  const exportSummaryCsv = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Synteny Blocks", syntenyData.length],
      ["Syntenic (SYN) Blocks", synCount],
      ["Inversions (INV)", invCount],
      ["Translocations (TRANS)", transCount],
      ["Inverted Translocations (INVTR)", invtrCount],
      ["Large Blocks (>10Mb)", large],
      ["Medium Blocks (5-10Mb)", medium],
      ["Small Blocks (1-5Mb)", small],
      ["Micro Blocks (<1Mb)", micro],
      [],
      ["Chromosome Coverage", "Proportion (%)"],
      ...coverageData.map(c => [c.chromosome, c.proportionPercent.toFixed(2) + "%"])
    ];
    
    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "chitra_summary_quantification.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Basic Quantification Summary</h3>
          <p className="text-sm text-muted-foreground">Computed rearrangements, size distribution, and coverage.</p>
        </div>
        <Button onClick={exportSummaryCsv} className="gap-2" variant="outline">
          <Download className="w-4 h-4" /> Download Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Rearrangement Stats */}
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs">
          <div className="text-sm text-muted-foreground mb-4">Rearrangement Types</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400"/>Syntenic</span> <span>{synCount}</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-400"/>Inversion</span> <span>{invCount}</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400"/>Translocation</span> <span>{transCount}</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-400"/>Inverted Transloc.</span> <span>{invtrCount}</span></div>
          </div>
        </div>
        
        {/* Size Distribution */}
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs">
          <div className="text-sm text-muted-foreground mb-4">Block Size Distribution</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Large (&gt;10Mb)</span> <span>{large}</span></div>
            <div className="flex justify-between"><span>Medium (5-10Mb)</span> <span>{medium}</span></div>
            <div className="flex justify-between"><span>Small (1-5Mb)</span> <span>{small}</span></div>
            <div className="flex justify-between"><span>Micro (&lt;1Mb)</span> <span>{micro}</span></div>
          </div>
        </div>
        
        {/* Genome Coverage */}
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs lg:col-span-1 md:col-span-2">
          <div className="text-sm text-muted-foreground mb-4">Genome Coverage Proportion</div>
          <ScrollArea className="h-32">
            <div className="space-y-2 text-sm pr-4">
              {coverageData.map((c, i) => (
                <div key={i} className="flex justify-between items-center gap-4">
                  <span className="font-medium">{c.chromosome}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${c.proportionPercent}%` }} />
                    </div>
                    <span className="w-12 text-right">{c.proportionPercent.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// New component to display raw data tables directly
export function RawDataTablesDisplay({
  syntenyData,
  genomeData,
  referenceData,
  className,
  onSyntenyRowClick,
  selectedSynteny,
}: RawDataTablesDisplayProps) {
  const TABLE_COLUMN_DOCS: Record<string, { col: string; desc: string }[]> = {
    synteny: [
      { col: 'S.No',        desc: 'Sequential row number' },
      { col: 'Query Name',  desc: 'Name of the query genome being compared' },
      { col: 'Query Chr',   desc: 'Chromosome identifier in the query genome' },
      { col: 'Query Start', desc: 'Start position on the query chromosome (bp)' },
      { col: 'Query End',   desc: 'End position on the query chromosome (bp)' },
      { col: 'Strand',      desc: 'Orientation: + forward (syntenic) / − reverse (inverted)' },
      { col: 'Ref Chr',     desc: 'Chromosome identifier in the reference genome' },
      { col: 'Ref Start',   desc: 'Start position on the reference chromosome (bp)' },
      { col: 'Ref End',     desc: 'End position on the reference chromosome (bp)' },
      { col: 'Ref Genome',  desc: 'Name of the reference genome' },
      { col: 'Symbol',      desc: 'Gene symbol associated with this synteny block' },
      { col: 'Class',       desc: 'Functional class of the synteny block (e.g., gene, repeat)' },
      { col: 'Gene ID',     desc: 'NCBI Gene identifier for the annotated gene' },
    ],
    genome: [
      { col: 'S.No',             desc: 'Sequential row number' },
      { col: 'Genome Name',      desc: 'Name of the species or genome assembly' },
      { col: 'Chr ID',           desc: 'Chromosome identifier (e.g., chr1, chrX)' },
      { col: 'Type',             desc: 'Chromosome type (e.g., autosome, sex chromosome)' },
      { col: 'Size (bp)',        desc: 'Total chromosome length in base pairs' },
      { col: 'Centromere Start', desc: 'Start of centromere region (bp) — optional; renders constriction on ideogram' },
      { col: 'Centromere End',   desc: 'End of centromere region (bp) — optional; renders constriction on ideogram' },
    ],
    reference: [
      { col: 'S.No',             desc: 'Sequential row number' },
      { col: 'Chromosome',       desc: 'Reference chromosome identifier' },
      { col: 'Size (bp)',        desc: 'Total reference chromosome length in base pairs' },
      { col: 'Centromere Start', desc: 'Start of centromere region (bp) — optional' },
      { col: 'Centromere End',   desc: 'End of centromere region (bp) — optional' },
    ],
    genes: [
      { col: 'S.No',       desc: 'Sequential row number' },
      { col: 'Chr',        desc: 'Chromosome on which the gene is located' },
      { col: 'Accession',  desc: 'NCBI genomic accession number' },
      { col: 'Start',      desc: 'Gene start position (bp)' },
      { col: 'End',        desc: 'Gene end position (bp)' },
      { col: 'Strand',     desc: 'Gene orientation: + forward / − reverse' },
      { col: 'Class',      desc: 'Gene biotype (e.g., protein-coding, pseudogene, ncRNA)' },
      { col: 'Symbol',     desc: 'Official gene symbol (e.g., BRCA1)' },
      { col: 'Name',       desc: 'Full descriptive gene name' },
      { col: 'Locus Tag',  desc: 'Systematic locus tag identifier' },
      { col: 'Gene ID',    desc: 'NCBI Gene identifier (numeric)' },
    ],
    breakpoints: [
      { col: 'S.No',            desc: 'Sequential row number' },
      { col: 'Ref Chr',         desc: 'Reference chromosome containing the breakpoint' },
      { col: 'Start Pos',       desc: 'Breakpoint interval start on the reference chromosome (bp)' },
      { col: 'End Pos',         desc: 'Breakpoint interval end on the reference chromosome (bp)' },
      { col: 'Breakpoint Type', desc: 'Type of chromosomal rearrangement (e.g., inversion, translocation)' },
    ],
  };

  const TABS = [
    { id: 'synteny',    label: 'Synteny',    data: syntenyData,                   columns: syntenyColumns,    filterColumn: 'query_name' },
    { id: 'genome',     label: 'Genome',     data: genomeData,                    columns: genomeColumns,     filterColumn: 'genome_name' },
    { id: 'reference',  label: 'Reference',  data: referenceData?.chromosomeSizes, columns: referenceColumns,  filterColumn: 'chromosome' },
    { id: 'genes',      label: 'Genes',      data: referenceData?.geneAnnotations, columns: geneColumns,       filterColumn: 'symbol' },
    { id: 'breakpoints',label: 'Breakpoints',data: referenceData?.breakpoints,     columns: breakpointColumns, filterColumn: 'ref_chr' },
  ];

  return (
    <div className={cn("w-full", className)}>
      <Tabs defaultValue="summary" className="mt-2">
        <TabsList className="inline-flex w-auto h-auto justify-start p-1 bg-muted rounded-lg text-xs overflow-x-auto max-w-full">
          <TabsTrigger value="summary" className="py-1.5 px-3 whitespace-nowrap">Summary</TabsTrigger>
          {TABS.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="py-1.5 px-3 whitespace-nowrap">{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="summary" className="mt-8">
          <SummaryDashboard syntenyData={syntenyData} genomeData={genomeData} referenceData={referenceData} />
        </TabsContent>
        {TABS.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            {/* Per-table column legend popover */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                {tab.data ? `${(tab.data as any[]).length} rows` : 'No data'}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Info className="h-3.5 w-3.5" />
                    Column Guide
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={8} className="w-80 p-0 z-[200]">
                  <div className="px-3 py-2 border-b bg-muted/50">
                    <p className="text-xs font-semibold">{tab.label} — Column Descriptions</p>
                  </div>
                  <div className="divide-y max-h-72 overflow-y-auto">
                    {(TABLE_COLUMN_DOCS[tab.id] ?? []).map(({ col, desc }) => (
                      <div key={col} className="flex gap-3 px-3 py-2">
                        <span className="min-w-[100px] text-xs font-medium text-foreground shrink-0">{col}</span>
                        <span className="text-xs text-muted-foreground leading-snug">{desc}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {!tab.data ? (
              <SkeletonLoader />
            ) : tab.data.length > 0 ? (
              <VirtualTable
                data={tab.data as any[]}
                columns={tab.columns}
                filterColumn={tab.filterColumn}
                onRowClick={tab.id === 'synteny' ? onSyntenyRowClick as any : undefined}
                isRowSelected={tab.id === 'synteny' && selectedSynteny ? ((row: any) => selectedSynteny.some(s => s.ref_chr === row.ref_chr && s.query_chr === row.query_chr && s.ref_start === row.ref_start)) : undefined}
              />
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No {tab.label.toLowerCase()} data loaded
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export function DataViewerDrawer({
  children,
  syntenyData,
  genomeData,
  referenceData,
  onSyntenyRowClick,
  selectedSynteny,
}: DataViewerDrawerProps) {
  return (
    <Drawer direction="bottom">
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent>
        <div className="w-full relative">
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30 z-10">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
          <div className="h-[90vh] p-4">
            <DrawerHeader>
              <DrawerTitle className='text-foreground text-2xl font-bold mb-4'>
                Raw Data Viewer
              </DrawerTitle>
            </DrawerHeader>
            <div className='mt-4'>
              <RawDataTablesDisplay
                syntenyData={syntenyData}
                genomeData={genomeData}
                referenceData={referenceData}
                onSyntenyRowClick={onSyntenyRowClick}
                selectedSynteny={selectedSynteny}
              />
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
