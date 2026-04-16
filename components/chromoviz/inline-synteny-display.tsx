'use client'

import { SyntenyData } from "@/app/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileSpreadsheet, MousePointerClick, Table as TableIcon, X, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
// Removed useState, useEffect as they are not used directly in this version
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
// Removed toast as it's not used here

interface InlineSyntenyDisplayProps {
  selectedSynteny: SyntenyData[]
  onToggleSelection: (link: SyntenyData) => void
  onExport?: (data: SyntenyData[]) => void
  onSelectBlock?: (link: SyntenyData) => void
  currentBlockIndex?: number
  className?: string;
  isCompact?: boolean; // New prop for compact mode
}

function downloadCSV(data: SyntenyData[], filename: string) {
  const headers = [
    'Reference Genome',
    'Reference Chromosome',
    'Reference Start (Mb)',
    'Reference End (Mb)',
    'Query Genome',
    'Query Chromosome',
    'Query Start (Mb)',
    'Query End (Mb)',
    'Size (Mb)',
    'Orientation'
  ]

  const rows = data.map(link => [
    link.ref_name || 'N/A',
    link.ref_chr || 'N/A',
    link.ref_start != null ? (link.ref_start / 1_000_000).toFixed(2) : 'N/A',
    link.ref_end != null ? (link.ref_end / 1_000_000).toFixed(2) : 'N/A',
    link.query_name || 'N/A',
    link.query_chr || 'N/A',
    link.query_start != null ? (link.query_start / 1_000_000).toFixed(2) : 'N/A',
    link.query_end != null ? (link.query_end / 1_000_000).toFixed(2) : 'N/A',
    (link.ref_end != null && link.ref_start != null) ? ((link.ref_end - link.ref_start) / 1_000_000).toFixed(2) : 'N/A',
    link.query_strand === '+' ? 'Forward' : (link.query_strand === '-' ? 'Reverse' : 'N/A')
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function InlineSyntenyDisplay({ 
  selectedSynteny, 
  onToggleSelection, 
  onExport,
  onSelectBlock,
  currentBlockIndex = 0,
  className,
  isCompact = false // Default to not compact
}: InlineSyntenyDisplayProps) {

  if (selectedSynteny.length === 0) {
    return (
      <Card className={cn("w-full", className, isCompact && "border-none shadow-none bg-transparent")}>
        <CardContent className={cn("p-3", isCompact && "p-1")}>
          <div className={cn(
            "flex flex-col items-center justify-center text-center text-muted-foreground gap-2 py-6",
            isCompact && "py-2 gap-1"
          )}>
            {!isCompact && <MousePointerClick className="h-5 w-5 text-blue-500" />}
            <p className={cn("text-xs font-medium", isCompact && "text-[11px]")}>
              {isCompact ? "No blocks selected" : "No synteny blocks selected."}
            </p>
            {!isCompact && <p className="text-[10px] text-muted-foreground/80">Click ribbons to select.</p>}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className, isCompact && "border-none shadow-none bg-transparent")}>
      <CardContent className={cn("p-0", isCompact && "max-h-[calc(100vh-150px)] overflow-y-auto")}> {/* Adjusted max height for compact */}
        <div className={cn("flex flex-col", isCompact ? "max-h-full" : "max-h-[70vh]")}>
          {!isCompact && (
            <div className="p-3 border-b bg-background/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TableIcon className="h-4 w-4 text-blue-500" />
                  <h3 className="font-semibold tracking-tight text-sm">Selected Blocks</h3>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 rounded-full px-1.5 text-xs">
                    {selectedSynteny.length}
                  </Badge>
                </div>
                {selectedSynteny.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm" // Changed from xs to sm
                    className="h-7 px-2 text-xs" // Added classes for smaller appearance
                    onClick={() => {
                      if (onExport) {
                        onExport(selectedSynteny)
                      } else {
                        downloadCSV(
                          selectedSynteny,
                          `synteny-blocks-${new Date().toISOString().split('T')[0]}.csv`
                        )
                      }
                    }}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                    Export CSV
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className={cn("overflow-auto", isCompact ? "p-1.5 space-y-1.5" : "p-3 space-y-2")}>
            <AnimatePresence>
              {selectedSynteny.map((link, index) => (
                <motion.div
                  key={`${link.ref_chr}-${link.query_chr}-${link.ref_start}-${link.ref_end}-${index}`}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ 
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.15,
                      delay: index * 0.03
                    }
                  }}
                  exit={{ opacity: 0, y: -5, transition: { duration: 0.1 } }}
                >
                  <Card
                    className={cn(
                      "relative group transition-all duration-150",
                      "hover:bg-blue-500/5 dark:hover:bg-blue-500/10",
                      isCompact ? "ring-1 ring-black/5 dark:ring-white/10 shadow-2xs hover:shadow-xs" : "border-none ring-1 ring-black/5 dark:ring-white/10 shadow-xs hover:shadow-md",
                      "cursor-pointer",
                      index === currentBlockIndex && [
                        "ring-1 ring-blue-500 dark:ring-blue-400",
                        "bg-blue-500/5 dark:bg-blue-500/10",
                      ]
                    )}
                    onClick={() => onSelectBlock?.(link)}
                  >
                    <CardContent className={cn("p-2.5", isCompact && "p-1.5")}>
                      {!isCompact && ( // X button only if not compact
                        <div className="absolute -top-1 -right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleSelection(link);
                                  }}
                                  className="h-6 w-6 rounded-full bg-background/70 backdrop-blur-xs ring-1 ring-black/5 dark:ring-white/10 shadow-md hover:bg-red-500/10 hover:text-red-500 hover:scale-105 active:scale-95"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-background/90 backdrop-blur-xs text-xs p-1.5">
                                <p>Deselect</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                      
                      <div 
                        className={cn(
                          "space-y-1.5",
                          index === currentBlockIndex && "text-blue-600 dark:text-blue-400",
                          isCompact && "space-y-0.5"
                        )}
                      >
                        <div className={cn("flex items-center gap-1.5", isCompact && "gap-1")}>
                          <span className={cn("font-medium tracking-tight text-sm", isCompact && "text-xs truncate max-w-[100px]")}>
                            {link.ref_name || 'N/A'} {link.ref_chr || 'N/A'}
                          </span>
                          <ChevronRight className={cn(
                            "h-3.5 w-3.5 shrink-0", 
                            index === currentBlockIndex 
                              ? "text-blue-500"
                              : "text-muted-foreground",
                            isCompact && "h-3 w-3"
                          )} />
                          <span className={cn("font-medium tracking-tight text-sm", isCompact && "text-xs truncate max-w-[100px]")}>
                            {link.query_name || 'N/A'} {link.query_chr || 'N/A'}
                          </span>
                        </div>
                        
                        <div className={cn(
                          "text-xs space-y-1",
                          index === currentBlockIndex 
                            ? "text-blue-600/80 dark:text-blue-400/80"
                            : "text-muted-foreground/80",
                          isCompact && "text-[10px] space-y-0.5"
                        )}>
                          <div className="flex items-center gap-1.5">
                            <span className={cn("uppercase tracking-wider opacity-70", isCompact && "hidden sm:inline")}>Pos:</span>
                            <span className="font-mono">
                              {link.ref_start != null ? (link.ref_start / 1_000_000).toFixed(isCompact ? 0 : 1) : 'N/A'}-{link.ref_end != null ? (link.ref_end / 1_000_000).toFixed(isCompact ? 0 : 1) : 'N/A'} Mb
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={cn("uppercase tracking-wider opacity-70", isCompact && "hidden sm:inline")}>Size:</span>
                            <span className="font-mono">
                              {(link.ref_end != null && link.ref_start != null) ? ((link.ref_end - link.ref_start) / 1_000_000).toFixed(isCompact ? 0 : 1) : 'N/A'} Mb
                            </span>
                          </div>
                          {!isCompact && (
                            <div className="flex items-center gap-1.5">
                              <span className="uppercase tracking-wider opacity-70">Orient:</span>
                              <Badge variant="secondary" className={cn(
                                "rounded-full px-1.5 py-0.5 font-medium tracking-tight text-[10px] cursor-default hover:bg-current hover:text-current",
                                link.query_strand === '+' 
                                  ? "bg-blue-500/10 text-blue-500" 
                                  : "bg-red-500/10 text-red-500"
                              )}>
                                {link.query_strand === '+' ? 'Fwd ➜' : 'Rev ⟲'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
