"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Counter } from "@/components/animate-ui/components/counter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/animate-ui/radix/tabs";
import { Palette, Layout, Zap, X, RotateCcw } from "lucide-react";
import { ChromosomeData } from "@/app/types";
import {
  CHROMOSOME_CONFIG,
  GENE_ANNOTATION_CONFIG,
  OPTIMIZATION_CONFIG,
} from "@/config/chromoviz.config";

export interface ConfigProps {
  chromosomeHeight: number;
  chromosomeSpacing: number;
  annotationHeight: number;
  maxVisibleGenes: number;
  customSpeciesColors: Map<string, string>;
  widthScale?: number;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConfigProps;
  onConfigChange: (newConfig: Partial<ConfigProps>) => void;
  speciesData: ChromosomeData[];
  onResetSpeciesColors: () => void;
  onSpeciesColorChange: (species: string, color: string) => void;
  onResetLayout: () => void;
}

export const SettingsPanel = ({
  isOpen,
  onClose,
  config,
  onConfigChange,
  speciesData,
  onResetSpeciesColors,
  onSpeciesColorChange,
  onResetLayout,
}: SettingsPanelProps) => {
  if (!isOpen) return null;

  const handleNumericChange = (key: keyof ConfigProps, value: string) => {
    const numericValue = Number(value);
    if (!isNaN(numericValue)) {
      onConfigChange({ [key]: numericValue } as Partial<ConfigProps>);
    }
  };

  return (
    <div className="w-full">
      <div className="p-2 border-b flex items-center justify-between">
        <h4 className="text-sm font-medium">Visualization Settings</h4>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="w-full rounded-none bg-muted/50 h-auto p-1">
          <TabsTrigger value="colors" className="flex-1 gap-1.5 h-8 text-xs">
            <Palette className="h-4 w-4" /> Colors
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex-1 gap-1.5 h-8 text-xs">
            <Layout className="h-4 w-4" /> Layout
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex-1 gap-1.5 h-8 text-xs">
            <Zap className="h-4 w-4" /> Perf.
          </TabsTrigger>
        </TabsList>

        <div className="p-3">
          <TabsContent value="colors">
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {Array.from(new Set(speciesData.map(d => d.species_name))).map((species, index) => {
                // Get the actual color being used - either custom or default from d3.schemePastel1
                const currentColor = config.customSpeciesColors.get(species) ||
                  (typeof window !== 'undefined' && window.d3?.schemePastel1
                    ? window.d3.schemePastel1[index % window.d3.schemePastel1.length]
                    : ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2'][index % 9]
                  );

                return (
                  <div key={species} className="flex items-center justify-between gap-2">
                    <Label htmlFor={`color-${species}`} className="text-sm font-normal flex-1 truncate" title={species}>
                      {species.replace(/_/g, " ")}
                    </Label>
                    <input
                      id={`color-${species}`}
                      type="color"
                      value={currentColor}
                      onChange={(e) => onSpeciesColorChange(species, e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 pt-2 border-t">
              <Button variant="ghost" size="sm" className="w-full justify-center h-7" onClick={onResetSpeciesColors}>
                <RotateCcw className="h-3 w-3 mr-1.5" />
                <span className="text-xs">Reset Colors</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="layout">
            <div className="space-y-4">
              <div className="grid grid-cols-2 items-center gap-2">
                <Label htmlFor="chromosomeHeight" className="text-sm">Chromosome Height</Label>
                <Counter
                  number={config.chromosomeHeight}
                  setNumber={(value) => onConfigChange({ chromosomeHeight: value })}
                  className="h-7"
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-2">
                <Label htmlFor="widthScale" className="text-sm">Width Scale (%)</Label>
                <Counter
                  number={config.widthScale || 100}
                  setNumber={(value) => onConfigChange({ widthScale: value })}
                  className="h-7"
                  min={20}
                  max={200}
                  step={10}
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-2">
                <Label htmlFor="chromosomeSpacing" className="text-sm">Chromosome Spacing</Label>
                <Counter
                  number={config.chromosomeSpacing}
                  setNumber={(value) => onConfigChange({ chromosomeSpacing: value })}
                  className="h-7"
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-2">
                <Label htmlFor="annotationHeight" className="text-sm">Annotation Height</Label>
                <Counter
                  number={config.annotationHeight}
                  setNumber={(value) => onConfigChange({ annotationHeight: value })}
                  className="h-7"
                />
              </div>
            </div>
            <div className="mt-2 pt-2 border-t">
              <Button variant="ghost" size="sm" className="w-full justify-center h-7" onClick={onResetLayout}>
                <RotateCcw className="h-3 w-3 mr-1.5" />
                <span className="text-xs">Reset Layout</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="space-y-4">
              <div className="grid grid-cols-2 items-center gap-2">
                <Label htmlFor="maxVisibleGenes" className="text-sm">Max Visible Genes</Label>
                <Counter
                  number={config.maxVisibleGenes}
                  setNumber={(value) => onConfigChange({ maxVisibleGenes: value })}
                  className="h-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">Higher values may impact performance on large datasets.</p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
