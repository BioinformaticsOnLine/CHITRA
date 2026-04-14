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
import { Database, X, ArrowUpDown, ArrowUp, ArrowDown, Download, Check, MousePointerClick } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SyntenyData, ChromosomeData, GeneAnnotation, ReferenceGenomeData } from "@/app/types"
import { cn } from "@/lib/utils"

// Props for the RawDataTablesDisplay component
interface RawDataTablesDisplayProps {
  syntenyData?: SyntenyData[]
  speciesData?: ChromosomeData[]
  referenceData?: ReferenceGenomeData | null // Allow null
  className?: string
  onSyntenyRowClick?: (row: SyntenyData) => void
  selectedSynteny?: SyntenyData[]
}

interface DataViewerDrawerProps {
  children: React.ReactNode
  syntenyData?: SyntenyData[]
  speciesData?: ChromosomeData[]
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

const syntenyColumns = [
  columnHelper.display({ id: 'sno', header: 'S.No', size: 60, cell: (info) => info.row.index + 1 }),
  columnHelper.accessor('query_name', { header: 'Query Name', size: 140 }),
  columnHelper.accessor('query_chr', { header: 'Query Chr', size: 90 }),
  columnHelper.accessor('query_start', { header: 'Query Start', size: 110, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('query_end', { header: 'Query End', size: 110, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('query_strand', { header: 'Strand', size: 70 }),
  columnHelper.accessor('ref_chr', { header: 'Ref Chr', size: 90 }),
  columnHelper.accessor('ref_start', { header: 'Ref Start', size: 110, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('ref_end', { header: 'Ref End', size: 110, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('ref_name', { header: 'Ref Species', size: 140 }),
  columnHelper.accessor('symbol', { header: 'Symbol', size: 90 }),
  columnHelper.accessor('class', { header: 'Class', size: 110 }),
  columnHelper.accessor('GeneID', { header: 'Gene ID', size: 110 }),
]

const speciesColumns = [
  columnHelper.display({ id: 'sno', header: 'S.No', size: 60, cell: (info) => info.row.index + 1 }),
  columnHelper.accessor('species_name', { header: 'Species Name', size: 150 }),
  columnHelper.accessor('chr_id', { header: 'Chr ID', size: 110 }),
  columnHelper.accessor('chr_type', { header: 'Type', size: 90 }),
  columnHelper.accessor('chr_size_bp', { header: 'Size (bp)', size: 120, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('centromere_start', { header: 'Centro. Start', size: 130, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('centromere_end', { header: 'Centro. End', size: 130, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
]

const referenceColumns = [
  columnHelper.display({ id: 'sno', header: 'S.No', size: 60, cell: (info) => info.row.index + 1 }),
  columnHelper.accessor('chromosome', { header: 'Chromosome', size: 120 }),
  columnHelper.accessor('size', { header: 'Size', size: 120, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('centromere_start', { header: 'Centro. Start', size: 140, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('centromere_end', { header: 'Centro. End', size: 140, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
]

const geneColumns = [
  columnHelper.display({ id: 'sno', header: 'S.No', size: 60, cell: (info) => info.row.index + 1 }),
  columnHelper.accessor('chromosome', { header: 'Chr', size: 100 }),
  columnHelper.accessor('genomic_accession', { header: 'Accession', size: 140 }),
  columnHelper.accessor('start', { header: 'Start', size: 110, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('end', { header: 'End', size: 110, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('strand', { header: 'Strand', size: 70 }),
  columnHelper.accessor('class', { header: 'Class', size: 140 }),
  columnHelper.accessor('symbol', { header: 'Symbol', size: 90, cell: (info: CellContext<any, string>) => info.getValue() || 'N/A' }),
  columnHelper.accessor('name', { header: 'Name', size: 180, cell: (info: CellContext<any, string>) => info.getValue() || 'N/A' }),
  columnHelper.accessor('locus_tag', { header: 'Locus Tag', size: 110, cell: (info: CellContext<any, string>) => info.getValue() || 'N/A' }),
  columnHelper.accessor('GeneID', { header: 'Gene ID', size: 110 }),
]

const breakpointColumns = [
  columnHelper.display({ id: 'sno', header: 'S.No', size: 60, cell: (info) => info.row.index + 1 }),
  columnHelper.accessor('ref_chr', { header: 'Ref Chr', size: 160 }),
  columnHelper.accessor('ref_start', { header: 'Start Pos', size: 130, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('ref_end', { header: 'End Pos', size: 130, cell: (info: CellContext<any, number>) => info.getValue()?.toLocaleString() ?? 'N/A' }),
  columnHelper.accessor('breakpoint', { header: 'Breakpoint Type', size: 140 }),
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
  speciesData,
  referenceData,
  className,
  onSyntenyRowClick,
  selectedSynteny,
}: RawDataTablesDisplayProps) {
  const TABS = [
    { id: 'synteny', label: 'Synteny', data: syntenyData, columns: syntenyColumns, filterColumn: 'query_name' },
    { id: 'species', label: 'Species', data: speciesData, columns: speciesColumns, filterColumn: 'species_name' },
    { id: 'reference', label: 'Reference', data: referenceData?.chromosomeSizes, columns: referenceColumns, filterColumn: 'chromosome' },
    { id: 'genes', label: 'Genes', data: referenceData?.geneAnnotations, columns: geneColumns, filterColumn: 'symbol' },
    { id: 'breakpoints', label: 'Breakpoints', data: referenceData?.breakpoints, columns: breakpointColumns, filterColumn: 'ref_chr' },
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
          <SummaryDashboard syntenyData={syntenyData} speciesData={speciesData} referenceData={referenceData} />
        </TabsContent>
        {TABS.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="mt-8">
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
  speciesData,
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
                speciesData={speciesData}
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
