"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ZoomIn, ZoomOut, RefreshCw, Maximize2, Minimize2, Save,
  ArrowLeftRight, ArrowRight, ArrowLeft, MoreVertical, Image, Eye, X, Download, RotateCcw, Settings2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SyntenyData, ChromosomeData } from "@/app/types"; // Adjusted path
import { MutationType, MUTATION_COLORS, mutationFullNames } from "@/components/chromoviz/synteny-ribbon"; // Assuming this is the correct path
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Palette, LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlignmentFilterButton } from "@/components/chromoviz/alignment-filter-button";
import { SettingsPanel, ConfigProps } from "@/components/chromoviz/settings-panel";


const MutationTypeSelector = ({
  onSelect,
  currentType,
  mutationColors,
  mutationFullNames,
  onAddCustom,
}: {
  onSelect: (type?: MutationType) => void;
  currentType?: MutationType;
  mutationColors: Record<string, string>;
  mutationFullNames: Record<string, string>;
  onAddCustom: () => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-7 gap-2",
            currentType && `border-${mutationColors[currentType]}/50 text-${mutationColors[currentType]}`
          )}
        >
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: currentType ? mutationColors[currentType] : 'currentColor' }}
          />
          {currentType ? mutationFullNames[currentType] || currentType : 'Set Type'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onSelect(undefined)} className="gap-2">
          <div className="h-3 w-3 rounded-full border" />
          None
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {Object.entries(mutationColors).map(([type, color]) => (
          <DropdownMenuItem
            key={type}
            onClick={() => onSelect(type as MutationType)}
            className="gap-2"
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            {mutationFullNames[type] || type}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddCustom}>
          Add Custom Type...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface ControlsMenuProps {
  alignmentFilter: 'all' | 'forward' | 'reverse';
  setAlignmentFilter: (filter: 'all' | 'forward' | 'reverse') => void;
  showAnnotations: boolean;
  setShowAnnotations: (show: boolean) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
  handleSaveAsSVG: () => void;
  handleExportImage: (format: 'png' | 'jpg') => void;
  selectedSynteny: SyntenyData[];
  selectedMutationTypes: Map<string, MutationType>;
  onMutationTypeSelect: (syntenyId: string, mutationType?: MutationType) => void;
  customGenomeColors: Map<string, string>;
  onGenomeColorChange: (genome: string, color: string) => void;
  onResetGenomeColors: () => void;
  onAddCustomMutationType: (name: string, color: string) => void;
  mutationColors: Record<string, string>;
  config: ConfigProps;
  onConfigChange: (newConfig: Partial<ConfigProps>) => void;
  onResetLayout: () => void;
  genomeData: ChromosomeData[]; // Assuming ChromosomeData contains genome_name
  showConnectedOnly: boolean;
  setShowConnectedOnly: (show: boolean) => void;
  zoomLevel: number;
  onViewMutations: () => void;
  fullscreenContainerRef?: React.RefObject<HTMLDivElement>;
}

export const ControlsMenu = ({
  alignmentFilter,
  setAlignmentFilter,
  showAnnotations,
  setShowAnnotations,
  onZoomIn,
  onZoomOut,
  onReset,
  onFullscreen,
  isFullscreen,
  handleSaveAsSVG,
  handleExportImage,
  selectedSynteny,
  selectedMutationTypes,
  onMutationTypeSelect,
  customGenomeColors,
  onGenomeColorChange,
  onResetGenomeColors,
  genomeData,
  showConnectedOnly,
  setShowConnectedOnly,
  zoomLevel,
  onViewMutations,
  fullscreenContainerRef,
  onAddCustomMutationType,
  mutationColors,
  config,
  onConfigChange,
  onResetLayout,
}: ControlsMenuProps) => {
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showMutationPanel, setShowMutationPanel] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [isAddTypeDialogOpen, setIsAddTypeDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("#ff0000");

  const handleToggle = (checked: boolean) => {
    setShowConnectedOnly(checked);
  };

  const handleAddCustom = () => {
    onAddCustomMutationType(newTypeName, newTypeColor);
    setNewTypeName("");
    setNewTypeColor("#ff0000");
    setIsAddTypeDialogOpen(false);
  };

  const desktopControls = (
    <>
      <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Switch
            id="show-annotations"
            checked={showAnnotations}
            onCheckedChange={setShowAnnotations}
          />
          <Label htmlFor="show-annotations" className="text-xs whitespace-nowrap">Annotations</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch
            id="show-connected-only"
            checked={showConnectedOnly}
            onCheckedChange={setShowConnectedOnly}
          />
          <Label htmlFor="show-connected-only" className="text-xs whitespace-nowrap">Linked Only</Label>
        </div>
      </div>

      <Popover open={showSettingsPanel} onOpenChange={setShowSettingsPanel}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 px-2">
            <Settings2 className="h-4 w-4 mr-1" />
            <span>Settings</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <SettingsPanel
            isOpen={showSettingsPanel}
            onClose={() => setShowSettingsPanel(false)}
            config={config}
            onConfigChange={onConfigChange}
            genomeData={genomeData}
            onResetGenomeColors={onResetGenomeColors}
            onGenomeColorChange={onGenomeColorChange}
            onResetLayout={onResetLayout}
          />
        </PopoverContent>
      </Popover>

      {selectedSynteny.length > 0 && (
        <Popover open={showMutationPanel} onOpenChange={setShowMutationPanel}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 px-2">
              <Palette className="h-4 w-4 mr-1" />
              <span>Mutations</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0">
            <Card className="border-0 shadow-none">
              <CardHeader className="p-2 border-b flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Mutation Types</CardTitle>
                <div className="flex items-center">
                  {selectedMutationTypes.size > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onViewMutations}>
                      <Download className="h-4 w-4 mr-1" />
                      <span className="text-xs">Export</span>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowMutationPanel(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-2 max-h-[300px] overflow-y-auto">
                {selectedSynteny.map(link => {
                  const syntenyId = `${link.ref_chr}-${link.query_chr}-${link.ref_start}-${link.query_start}`;
                  const currentType = selectedMutationTypes.get(syntenyId);
                  const refPos = link.ref_start >= 1000000 ? `${(link.ref_start / 1000000).toFixed(1)}Mb` : link.ref_start >= 1000 ? `${(link.ref_start / 1000).toFixed(1)}kb` : `${link.ref_start}bp`;
                  const queryPos = link.query_start >= 1000000 ? `${(link.query_start / 1000000).toFixed(1)}Mb` : link.query_start >= 1000 ? `${(link.query_start / 1000).toFixed(1)}kb` : `${link.query_start}bp`;

                  return (
                    <div key={syntenyId} className="flex items-center gap-2 p-1 rounded hover:bg-accent">
                      <div className="flex-1">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1 text-xs font-medium">
                              <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950 rounded-full px-1.5 py-0.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                <span className="text-[8px] text-blue-700 dark:text-blue-300 uppercase tracking-wide">R</span>
                              </div>
                              {link.ref_chr}
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-950 rounded-full px-1.5 py-0.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                <span className="text-[8px] text-purple-700 dark:text-purple-300 uppercase tracking-wide">Q</span>
                              </div>
                              {link.query_chr}
                            </div>
                            <Badge variant="secondary" className="h-4 text-[10px] px-1 font-normal overflow-hidden flex-wrap">
                              {link.query_name || 'Genome 2'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="text-[10px] text-muted-foreground">
                              {refPos} - {queryPos}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              ({link.query_strand === '+' ? 'Forward' : 'Reverse'})
                            </div>
                          </div>
                        </div>
                      </div>
                      <MutationTypeSelector
                        currentType={currentType}
                        onSelect={(type) => onMutationTypeSelect(syntenyId, type)}
                        mutationColors={mutationColors}
                        mutationFullNames={mutationFullNames}
                        onAddCustom={() => setIsAddTypeDialogOpen(true)}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>
      )}

      <Popover open={showExportPanel} onOpenChange={setShowExportPanel}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <Image className="h-4 w-4 mr-1" />
            <span>Export</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-40 p-1">
          <Button variant="ghost" className="w-full justify-start h-8" onClick={() => { handleSaveAsSVG(); setShowExportPanel(false); }}>
            Save as SVG
          </Button>
          <Button variant="ghost" className="w-full justify-start h-8" onClick={() => { handleExportImage('png'); setShowExportPanel(false); }}>
            Export as PNG
          </Button>
          <Button variant="ghost" className="w-full justify-start h-8" onClick={() => { handleExportImage('jpg'); setShowExportPanel(false); }}>
            Export as JPG
          </Button>
        </PopoverContent>
      </Popover>

      <Badge variant="secondary" className="text-xs">
        {Math.round(zoomLevel * 100)}%
      </Badge>
    </>
  );

  return (
    <>
      <div className="flex items-center justify-between w-full gap-2 p-1 bg-background/10 backdrop-blur-md border-b border-border/20 whitespace-nowrap overflow-x-auto no-scrollbar">
        {/* Left Side: Alignment Filters */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <AlignmentFilterButton
            filter="all"
            currentFilter={alignmentFilter}
            onClick={setAlignmentFilter}
            icon={ArrowLeftRight}
            label="All"
          />
          <AlignmentFilterButton
            filter="forward"
            currentFilter={alignmentFilter}
            onClick={setAlignmentFilter}
            icon={ArrowRight}
            label="Forward"
          />
          <AlignmentFilterButton
            filter="reverse"
            currentFilter={alignmentFilter}
            onClick={setAlignmentFilter}
            icon={ArrowLeft}
            label="Reverse"
          />
        </div>

        {/* Right Side: Main Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 justify-end shrink-0">
          <div className="flex items-center gap-1.5">
            {desktopControls}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Button variant="ghost" size="sm" onClick={onZoomIn} className="h-7 px-2">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onZoomOut} className="h-7 px-2">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onReset} className="h-7 px-2">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onFullscreen} className="h-7 px-2">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
          {/* Mobile dropdown - hidden since app is desktop-only */}
          <div className="hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              {/* <DropdownMenuPortal container={isFullscreen && fullscreenContainerRef?.current ? fullscreenContainerRef.current : undefined}> */}
              <DropdownMenuContent
                align="end"
                className={cn(isFullscreen && "z-[60]")}
              >
                <DropdownMenuLabel>Controls</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between">
                  <Label htmlFor="show-annotations-mobile">Annotations</Label>
                  <Switch
                    id="show-annotations-mobile"
                    checked={showAnnotations}
                    onCheckedChange={setShowAnnotations}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between">
                  <Label htmlFor="show-connected-only-mobile">Linked Only</Label>
                  <Switch
                    id="show-connected-only-mobile"
                    checked={showConnectedOnly}
                    onCheckedChange={setShowConnectedOnly}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setShowSettingsPanel(true)}>
                  <Settings2 className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                {selectedSynteny.length > 0 && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Palette className="mr-2 h-4 w-4" />
                      <span>Mutations</span>
                    </DropdownMenuSubTrigger>
                    {/* This DropdownMenuPortal is for the SubContent of the Mutations SubMenu */}
                    {/* <DropdownMenuPortal container={isFullscreen && fullscreenContainerRef?.current ? fullscreenContainerRef.current : undefined}> */}
                    <DropdownMenuSubContent
                      className={cn(
                        "w-96 max-h-[300px] overflow-y-auto",
                        isFullscreen && "z-[60]"
                      )}
                    >
                      <DropdownMenuLabel>Mutation Types</DropdownMenuLabel>
                      {selectedMutationTypes.size > 0 && (
                        <>
                          <DropdownMenuItem onClick={onViewMutations}>
                            <Download className="mr-2 h-4 w-4" />
                            <span>Export Tagged Data</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {selectedSynteny.map(link => {
                        const syntenyId = `${link.ref_chr}-${link.query_chr}-${link.ref_start}-${link.query_start}`;
                        const currentType = selectedMutationTypes.get(syntenyId);
                        const refPos = link.ref_start >= 1000000 ? `${(link.ref_start / 1000000).toFixed(1)}Mb` : link.ref_start >= 1000 ? `${(link.ref_start / 1000).toFixed(1)}kb` : `${link.ref_start}bp`;
                        const queryPos = link.query_start >= 1000000 ? `${(link.query_start / 1000000).toFixed(1)}Mb` : link.query_start >= 1000 ? `${(link.query_start / 1000).toFixed(1)}kb` : `${link.query_start}bp`;

                        return (
                          <DropdownMenuItem
                            key={syntenyId}
                            className="flex items-center gap-2 py-2"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <div className="flex-1">
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <div className="flex items-center gap-1 text-xs font-medium">
                                    <div className="flex items-center gap-1 bg-blue-50 rounded-full px-1.5 py-0.5">
                                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                      <span className="text-[8px] text-blue-700 uppercase tracking-wide">R</span>
                                    </div>
                                    {link.ref_chr}
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <div className="flex items-center gap-1 bg-purple-50 rounded-full px-1.5 py-0.5">
                                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                      <span className="text-[8px] text-purple-700 uppercase tracking-wide">Q</span>
                                    </div>
                                    {link.query_chr}
                                  </div>
                                  <Badge variant="secondary" className="h-4 text-[10px] px-1 font-normal overflow-hidden flex-wrap">
                                    {link.query_name || 'Genome 2'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <div className="text-[10px] text-muted-foreground">
                                    {refPos} - {queryPos}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    ({link.query_strand === '+' ? 'Forward' : 'Reverse'})
                                  </div>
                                </div>
                              </div>
                            </div>
                            <MutationTypeSelector
                              currentType={currentType}
                              onSelect={(type) => onMutationTypeSelect(syntenyId, type)}
                              mutationColors={mutationColors}
                              mutationFullNames={mutationFullNames}
                              onAddCustom={() => setIsAddTypeDialogOpen(true)}
                            />
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuSubContent>
                    {/* </DropdownMenuPortal> */}
                  </DropdownMenuSub>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Image className="mr-2 h-4 w-4" />
                    <span>Export</span>
                  </DropdownMenuSubTrigger>
                  {/* This DropdownMenuPortal is for the SubContent of the Export SubMenu */}
                  {/* <DropdownMenuPortal container={isFullscreen && fullscreenContainerRef?.current ? fullscreenContainerRef.current : undefined}> */}
                  <DropdownMenuSubContent
                    className={cn(isFullscreen && "z-[60]")}
                  >
                    <DropdownMenuItem onClick={handleSaveAsSVG}>Save as SVG</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportImage('png')}>Export as PNG</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportImage('jpg')}>Export as JPG</DropdownMenuItem>
                  </DropdownMenuSubContent>
                  {/* </DropdownMenuPortal> */}
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  Zoom: {Math.round(zoomLevel * 100)}%
                </DropdownMenuItem>
              </DropdownMenuContent>
              {/* </DropdownMenuPortal> */}
            </DropdownMenu>
          </div>
        </div>
      </div>
      <Dialog open={isAddTypeDialogOpen} onOpenChange={setIsAddTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Mutation Type</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Deletion"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Color
              </Label>
              <Input
                id="color"
                type="color"
                value={newTypeColor}
                onChange={(e) => setNewTypeColor(e.target.value)}
                className="col-span-3 p-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddCustom}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};