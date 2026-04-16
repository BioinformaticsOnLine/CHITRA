'use client'

import React from 'react'
import { Database, X, Filter, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MultiSelect } from '@/components/ui/multi-select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { motion } from 'motion/react'

interface FilterBadgeProps {
  count: number
  total: number
}

const FilterBadge = ({ count, total }: FilterBadgeProps) => (
  <Badge
    variant={count === total ? "secondary" : "default"}
    className="ml-2 text-xs"
  >
    {count}/{total}
  </Badge>
)

interface FilterSectionProps {
  title: string
  count: number
  total: number
  onClear: () => void
  children: React.ReactNode
  description?: string
  icon?: React.ReactNode
}

const FilterSection = ({
  title,
  count,
  total,
  onClear,
  children,
  description,
  icon
}: FilterSectionProps) => {
  const handleClear = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClear();
  }, [onClear]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border/50 dark:border-border/30 bg-card dark:bg-card/50 p-4 space-y-4"
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <Label className="text-base font-medium">{title}</Label>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <FilterBadge count={count} total={total} />
          </div>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Clear
            </Button>
          )}
        </div>
      </div>
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
};

interface ChromosomeOption {
  label: string
  value: string
  genome: string
}

interface FilterDrawerProps {
  selectedGenomes: string[]
  setSelectedGenomes: (genome: string[]) => void
  selectedChromosomes: string[]
  setSelectedChromosomes: (chromosomes: string[]) => void
  genomeOptions: { label: string; value: string }[]
  chromosomeOptions: { [genome: string]: ChromosomeOption[] }
  referenceGenomeData?: {
    chromosomeSizes: { chromosome: string }[]
  }
  syntenyData?: {
    ref_chr: string
    query_chr: string
    query_name: string
  }[]
  isLoading?: boolean
  children?: React.ReactNode
  showConnectedOnly?: boolean
}

export const FilterDrawer = ({
  children,
  showConnectedOnly,
  selectedGenomes,
  setSelectedGenomes,
  selectedChromosomes,
  setSelectedChromosomes,
  genomeOptions,
  chromosomeOptions,
  referenceGenomeData,
  syntenyData,
  isLoading
}: FilterDrawerProps) => {
  // Get connected query chromosomes for selected reference chromosomes
  const getConnectedQueryChromosomes = (refChrs: string[]) => {
    if (!syntenyData) return [];

    const refChrsWithoutPrefix = refChrs.map(chr => chr.replace('ref:', ''));

    // Use a Map to ensure uniqueness based on value
    const uniqueChromosomes = new Map();

    syntenyData
      .filter(syn => refChrsWithoutPrefix.includes(syn.ref_chr))
      .forEach(syn => {
        const value = `${syn.query_name}:${syn.query_chr}`;
        if (!uniqueChromosomes.has(value)) {
          uniqueChromosomes.set(value, {
            label: `${syn.query_name} ${syn.query_chr}`,
            value: value,
            genome: syn.query_name
          });
        }
      });

    return Array.from(uniqueChromosomes.values());
  };

  // Get unique query chromosomes based on selected reference chromosomes
  const connectedQueryChromosomes = React.useMemo(() => {
    const selectedRefChrs = selectedChromosomes.filter(chr => chr.startsWith('ref:'));
    return getConnectedQueryChromosomes(selectedRefChrs);
  }, [selectedChromosomes, syntenyData]);

  // Automatically update selected chromosomes when reference selection changes
  React.useEffect(() => {
    const selectedRefChrs = selectedChromosomes.filter(chr => chr.startsWith('ref:'));

    if (selectedRefChrs.length > 0 && showConnectedOnly) {
      // If "Show Connected Only" is active, filter query chromosomes
      const connectedChrs = getConnectedQueryChromosomes(selectedRefChrs);
      const connectedValues = new Set(connectedChrs.map(chr => chr.value));

      const currentQueryChrs = selectedChromosomes.filter(chr =>
        !chr.startsWith('ref:') && connectedValues.has(chr)
      );

      setSelectedChromosomes([...selectedRefChrs, ...currentQueryChrs]);
    } else if (selectedRefChrs.length === 0) {
      // If no reference chromosomes are selected, do nothing to the query selection
    }
    // When showConnectedOnly is false, we don't touch the query selection,
    // allowing the user to select any query chromosome.
  }, [selectedChromosomes.filter(chr => chr.startsWith('ref:')).join(','), syntenyData, showConnectedOnly]);

  // Add this function to filter synteny data based on selections
  const getFilteredSyntenyData = (data: typeof syntenyData) => {
    if (!data) return [];

    return data.filter(syn => {
      const refChr = `ref:${syn.ref_chr}`;
      const queryChr = `${syn.query_name}:${syn.query_chr}`;

      // If no chromosomes are selected, show all
      if (selectedChromosomes.length === 0) return true;

      // Only show ribbons between selected chromosomes
      return selectedChromosomes.includes(refChr) &&
        selectedChromosomes.includes(queryChr);
    });
  };

  const totalSelectedFilters = selectedGenomes.length + selectedChromosomes.length;

  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>

      <DrawerContent className="h-[85vh] max-h-[85vh] md:h-[90vh] md:max-h-[90vh] overflow-hidden">
        <DrawerHeader className="border-b border-border/50 dark:border-border/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DrawerTitle className="text-xl flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Data Filters
                {totalSelectedFilters > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {totalSelectedFilters} active
                  </Badge>
                )}
              </DrawerTitle>
              <DrawerDescription>
                Configure visualization parameters and data selection
              </DrawerDescription>
            </div>
            <DrawerClose className="rounded-full p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-5 w-5" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-6">
            <div className="py-6">
              {/* Main Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Genome and Reference Selection */}
                <div className="space-y-6">
                  {/* Genome Filter Section */}
                  <FilterSection
                    title="Genome Selection"
                    description="Choose which genome to include in the visualization"
                    count={selectedGenomes.length}
                    total={genomeOptions.length}
                    icon={<Database className="h-4 w-4 text-blue-500" />}
                    onClear={() => {
                      setSelectedGenomes([]);
                      const remainingChromosomes = selectedChromosomes.filter(chr =>
                        chr.startsWith('ref:')
                      );
                      setSelectedChromosomes(remainingChromosomes);
                    }}
                  >
                    <MultiSelect
                      value={selectedGenomes}
                      options={genomeOptions}
                      onValueChange={setSelectedGenomes}
                      placeholder="Filter by genome..."
                      disabled={isLoading}
                      maxCount={2}
                      modalPopover={true}
                    />
                  </FilterSection>

                  {/* Reference Chromosomes Section */}
                  {referenceGenomeData?.chromosomeSizes && (
                    <FilterSection
                      title="Reference Chromosomes"
                      description="Select chromosomes from the reference genome"
                      count={selectedChromosomes.filter(chr => chr.startsWith('ref:')).length}
                      total={referenceGenomeData.chromosomeSizes.length}
                      icon={<ChevronRight className="h-4 w-4 text-emerald-500" />}
                      onClear={() => setSelectedChromosomes([])}
                    >
                      <MultiSelect
                        value={selectedChromosomes.filter(chr => chr.startsWith('ref:'))}
                        options={referenceGenomeData.chromosomeSizes.map(chr => ({
                          label: chr.chromosome,
                          value: `ref:${chr.chromosome}`
                        }))}
                        onValueChange={(values) => {
                          const currentQueryChrs = selectedChromosomes.filter(chr => !chr.startsWith('ref:'));
                          setSelectedChromosomes([...values, ...currentQueryChrs]);
                        }}
                        placeholder="Select reference chromosomes..."
                        disabled={isLoading}
                        maxCount={10}
                        modalPopover={true}
                      />
                    </FilterSection>
                  )}
                </div>

                {/* Middle Column - Connected Chromosomes */}
                <div className="space-y-6">
                  {/* Connected Query Chromosomes Section */}
                  {connectedQueryChromosomes.length > 0 && (
                    <FilterSection
                      title="Connected Query Chromosomes"
                      description="Chromosomes connected to selected reference chromosomes"
                      count={connectedQueryChromosomes.length}
                      total={connectedQueryChromosomes.length}
                      icon={<ChevronRight className="h-4 w-4 text-violet-500" />}
                      onClear={() => { }}
                    >
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {connectedQueryChromosomes.map((chr) => (
                          <motion.div
                            key={chr.value}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50 border border-border/50 hover:bg-muted/80 transition-colors"
                          >
                            <Badge variant="outline" className="text-xs flex-1">
                              {chr.label}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </FilterSection>
                  )}
                </div>

                {/* Right Column - Genome Chromosomes */}
                <div className="space-y-6">
                  <FilterSection
                    title="Genome Chromosomes"
                    description="Select chromosomes from each genome"
                    count={selectedChromosomes.filter(chr => !chr.startsWith('ref:')).length}
                    total={Object.values(chromosomeOptions).flat().filter(chr => !chr.value.startsWith('ref:')).length}
                    icon={<ChevronRight className="h-4 w-4 text-rose-500" />}
                    onClear={() => {
                      const refChromosomes = selectedChromosomes.filter(chr => chr.startsWith('ref:'));
                      setSelectedChromosomes(refChromosomes);
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                      {Object.entries(chromosomeOptions).map(([genome, chromosomes]) => {
                        if (genome === 'Reference') return null;
                        if (selectedGenomes.length > 0 && !selectedGenomes.includes(genome)) return null;

                        const selectedCount = selectedChromosomes.filter(chr =>
                          chr.startsWith(`${genome}:`)
                        ).length;

                        return (
                          <motion.div
                            key={genome}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-md border border-border/50 p-3 space-y-3 bg-muted/30"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium">
                                  {genome.replace('_', ' ')}
                                </Label>
                                <FilterBadge count={selectedCount} total={chromosomes.length} />
                              </div>
                              {selectedCount > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const otherChromosomes = selectedChromosomes.filter(chr =>
                                      !chr.startsWith(`${genome}:`)
                                    );
                                    setSelectedChromosomes(otherChromosomes);
                                  }}
                                  className="h-7 px-2 text-xs"
                                >
                                  Clear
                                </Button>
                              )}
                            </div>
                            <MultiSelect
                              value={selectedChromosomes.filter(chr =>
                                chr.startsWith(`${genome}:`)
                              )}
                              options={chromosomes}
                              onValueChange={(values) => {
                                const otherChromosomes = selectedChromosomes.filter(chr =>
                                  !chr.startsWith(`${genome}:`)
                                );
                                setSelectedChromosomes([...otherChromosomes, ...values]);
                              }}
                              placeholder={`Select chromosomes...`}
                              disabled={isLoading || showConnectedOnly}
                              maxCount={2}
                              modalPopover={true}
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  </FilterSection>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DrawerFooter className="border-t border-border/50 dark:border-border/30">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 hover:bg-blue-500/10 hover:text-blue-500 border-border/50"
              onClick={() => {
                setSelectedGenomes([]);
                setSelectedChromosomes([]);
              }}
              disabled={isLoading || (selectedGenomes.length === 0 && selectedChromosomes.length === 0)}
            >
              <Database className="h-4 w-4 mr-2" />
              Show all
            </Button>
            <DrawerClose asChild>
              <Button className="flex-1">
                Apply Filters
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
