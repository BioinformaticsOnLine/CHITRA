'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { GripVertical, RotateCcw, ArrowUp, ArrowDown, ListOrdered } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { ChromosomeData } from '@/app/types'
import { Badge } from '@/components/ui/badge'

interface ChromosomeReorderPanelProps {
  referenceData: ChromosomeData[]
  chromosomeOrder: Map<string, string[]>
  onChromosomeOrderChange: (newOrder: Map<string, string[]>) => void
}

export function ChromosomeReorderPanel({
  referenceData,
  chromosomeOrder,
  onChromosomeOrderChange,
}: ChromosomeReorderPanelProps) {
  // Group chromosomes by genome
  const genomeGroups = React.useMemo(() => {
    const groups = new Map<string, string[]>()
    referenceData.forEach(chr => {
      const existing = groups.get(chr.genome_name) || []
      if (!existing.includes(chr.chr_id)) {
        existing.push(chr.chr_id)
      }
      groups.set(chr.genome_name, existing)
    })
    return groups
  }, [referenceData])

  // Get ordered list for a genome (custom order or default)
  const getOrderedChromosomes = useCallback((genome: string): string[] => {
    const customOrder = chromosomeOrder.get(genome)
    const defaultOrder = genomeGroups.get(genome) || []
    if (customOrder) {
      // Include any chromosomes in default that aren't in custom (new data)
      const missing = defaultOrder.filter(c => !customOrder.includes(c))
      return [...customOrder.filter(c => defaultOrder.includes(c)), ...missing]
    }
    return defaultOrder
  }, [chromosomeOrder, genomeGroups])

  const handleMoveUp = useCallback((genome: string, chrId: string) => {
    const ordered = [...getOrderedChromosomes(genome)]
    const idx = ordered.indexOf(chrId)
    if (idx <= 0) return
    ;[ordered[idx - 1], ordered[idx]] = [ordered[idx], ordered[idx - 1]]
    const newMap = new Map(chromosomeOrder)
    newMap.set(genome, ordered)
    onChromosomeOrderChange(newMap)
  }, [chromosomeOrder, getOrderedChromosomes, onChromosomeOrderChange])

  const handleMoveDown = useCallback((genome: string, chrId: string) => {
    const ordered = [...getOrderedChromosomes(genome)]
    const idx = ordered.indexOf(chrId)
    if (idx < 0 || idx >= ordered.length - 1) return
    ;[ordered[idx], ordered[idx + 1]] = [ordered[idx + 1], ordered[idx]]
    const newMap = new Map(chromosomeOrder)
    newMap.set(genome, ordered)
    onChromosomeOrderChange(newMap)
  }, [chromosomeOrder, getOrderedChromosomes, onChromosomeOrderChange])

  const handleReset = useCallback((genome: string) => {
    const newMap = new Map(chromosomeOrder)
    newMap.delete(genome)
    onChromosomeOrderChange(newMap)
  }, [chromosomeOrder, onChromosomeOrderChange])

  const handleResetAll = useCallback(() => {
    onChromosomeOrderChange(new Map())
  }, [onChromosomeOrderChange])

  // Drag state
  const [dragState, setDragState] = useState<{
    genome: string
    chrId: string
    overChrId: string | null
  } | null>(null)

  const handleDragStart = useCallback((genome: string, chrId: string) => {
    setDragState({ genome, chrId, overChrId: null })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, genome: string, chrId: string) => {
    e.preventDefault()
    if (dragState && dragState.genome === genome) {
      setDragState(prev => prev ? { ...prev, overChrId: chrId } : null)
    }
  }, [dragState])

  const handleDrop = useCallback((genome: string, targetChrId: string) => {
    if (!dragState || dragState.genome !== genome) return

    const ordered = [...getOrderedChromosomes(genome)]
    const fromIdx = ordered.indexOf(dragState.chrId)
    const toIdx = ordered.indexOf(targetChrId)
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) {
      setDragState(null)
      return
    }

    // Remove from old position and insert at new
    ordered.splice(fromIdx, 1)
    ordered.splice(toIdx, 0, dragState.chrId)

    const newMap = new Map(chromosomeOrder)
    newMap.set(genome, ordered)
    onChromosomeOrderChange(newMap)
    setDragState(null)
  }, [dragState, chromosomeOrder, getOrderedChromosomes, onChromosomeOrderChange])

  const genome = Array.from(genomeGroups.keys())
  const hasCustomOrder = chromosomeOrder.size > 0

  return (
    <Sheet modal={false}>
      <div className="fixed bottom-20 right-6 z-[100]">
        <SheetTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center",
              "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700",
              "backdrop-blur-md",
              "border border-indigo-500 dark:border-indigo-500",
              "shadow-lg shadow-indigo-500/25",
              "transition-colors duration-200"
            )}
            title="Reorder chromosomes"
          >
            <ListOrdered className="h-5 w-5 text-white" />
            {hasCustomOrder && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
            )}
          </motion.button>
        </SheetTrigger>
      </div>
      <SheetContent side="right" hideOverlay className="w-[320px] sm:w-[360px] p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-semibold flex items-center gap-2">
              <ListOrdered className="h-4 w-4" />
              Chromosome Order
            </SheetTitle>
            {hasCustomOrder && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleResetAll}
              >
                <RotateCcw className="h-3 w-3" />
                Reset All
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Drag or use arrows to reorder chromosomes within each genome.
          </p>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100vh-120px)] p-3 space-y-4">
          {genome.map(sp => {
            const ordered = getOrderedChromosomes(sp)
            const hasCustom = chromosomeOrder.has(sp)

            return (
              <div key={sp} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {sp.replace(/_/g, ' ')}
                  </h3>
                  {hasCustom && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px]"
                      onClick={() => handleReset(sp)}
                    >
                      <RotateCcw className="h-2.5 w-2.5 mr-1" />
                      Reset
                    </Button>
                  )}
                </div>
                <div className="space-y-0.5 rounded-lg border bg-muted/30 p-1">
                  {ordered.map((chrId, idx) => (
                    <div
                      key={chrId}
                      draggable
                      onDragStart={() => handleDragStart(sp, chrId)}
                      onDragOver={(e) => handleDragOver(e, sp, chrId)}
                      onDrop={() => handleDrop(sp, chrId)}
                      onDragEnd={() => setDragState(null)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs",
                        "bg-background border transition-all",
                        "hover:bg-muted/50",
                        dragState?.chrId === chrId && dragState?.genome === sp
                          && "opacity-50 scale-95",
                        dragState?.overChrId === chrId && dragState?.genome === sp && dragState?.chrId !== chrId
                          && "border-primary border-dashed bg-primary/5",
                      )}
                    >
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 cursor-grab shrink-0" />
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono shrink-0 tabular-nums">
                        {idx + 1}
                      </Badge>
                      <span className="font-medium flex-1 truncate">{chrId}</span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          disabled={idx === 0}
                          onClick={(e) => { e.stopPropagation(); handleMoveUp(sp, chrId) }}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          disabled={idx === ordered.length - 1}
                          onClick={(e) => { e.stopPropagation(); handleMoveDown(sp, chrId) }}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
