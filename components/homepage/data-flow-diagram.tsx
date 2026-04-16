"use client";

import { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { 
  TableProperties, 
  FileSpreadsheet,
  Database,
  LineChart,
  Download,
  Image,
  Table,
  Globe2,
  Dna,
  Scale,
  Scissors
} from "lucide-react";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode; label?: string }
>(({ className, children, label }, ref) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={ref}
        className={cn(
          "z-10 flex size-12 items-center justify-center rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-xl p-3",
          className,
        )}
      >
        {children}
      </div>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
});

Circle.displayName = "Circle";

export function DataFlowDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Required Input refs
  const syntenyRef = useRef<HTMLDivElement>(null);
  const genomeRef = useRef<HTMLDivElement>(null);
  const chromosomeRef = useRef<HTMLDivElement>(null);
  
  // Optional Input refs
  const annotationsRef = useRef<HTMLDivElement>(null);
  const breakpointRef = useRef<HTMLDivElement>(null);
  const ncbiRef = useRef<HTMLDivElement>(null);
  
  // Processing ref
  const processingRef = useRef<HTMLDivElement>(null);
  
  // Output refs
  const plotRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative flex h-[600px] w-full items-center justify-center overflow-hidden" ref={containerRef}>
      <div className="flex w-full max-w-5xl flex-col gap-20">
        {/* Input Layer - Split into Required and Optional */}
        <div className="grid grid-cols-2 gap-x-20">
          {/* Required Inputs */}
          <div className="flex flex-col gap-6">
            <span className="text-sm font-medium text-muted-foreground text-center">Required Input</span>
            <div className="grid grid-cols-3 gap-4">
              <Circle ref={syntenyRef} label="Synteny Data">
                <TableProperties className="h-6 w-6" />
              </Circle>
              <Circle ref={genomeRef} label="Genome Data">
                <Database className="h-6 w-6" />
              </Circle>
              <Circle ref={chromosomeRef} label="Chromosome Size">
                <Scale className="h-6 w-6" />
              </Circle>
            </div>
          </div>

          {/* Optional Inputs */}
          <div className="flex flex-col gap-6">
            <span className="text-sm font-medium text-muted-foreground text-center">Optional Input</span>
            <div className="grid grid-cols-3 gap-4">
              <Circle ref={annotationsRef} label="Gene Annotations">
                <Dna className="h-6 w-6" />
              </Circle>
              <Circle ref={breakpointRef} label="Breakpoint Data">
                <Scissors className="h-6 w-6" />
              </Circle>
              <Circle ref={ncbiRef} label="NCBI Database">
                <Globe2 className="h-6 w-6" />
              </Circle>
            </div>
          </div>
        </div>

        {/* Processing */}
        <div className="flex items-center justify-center">
          <Circle ref={processingRef} className="size-20" label="CHITRA Engine">
            <LineChart className="h-8 w-8" />
          </Circle>
        </div>

        {/* Output */}
        <div className="flex justify-center gap-20">
          <Circle ref={plotRef} label="Interactive Plot">
            <Image className="h-6 w-6" />
          </Circle>
          <Circle ref={exportRef} label="Export Synteny">
            <Table className="h-6 w-6" />
          </Circle>
        </div>
      </div>

      {/* Connect Required Inputs to Processing */}
      <AnimatedBeam containerRef={containerRef} fromRef={syntenyRef} toRef={processingRef} />
      <AnimatedBeam containerRef={containerRef} fromRef={genomeRef} toRef={processingRef} />
      <AnimatedBeam containerRef={containerRef} fromRef={chromosomeRef} toRef={processingRef} />

      {/* Connect Optional Inputs */}
      <AnimatedBeam containerRef={containerRef} fromRef={annotationsRef} toRef={ncbiRef} />
      <AnimatedBeam containerRef={containerRef} fromRef={breakpointRef} toRef={ncbiRef} />
      <AnimatedBeam containerRef={containerRef} fromRef={ncbiRef} toRef={processingRef} />

      {/* Connect Processing to Output */}
      <AnimatedBeam containerRef={containerRef} fromRef={processingRef} toRef={plotRef} />
      <AnimatedBeam containerRef={containerRef} fromRef={processingRef} toRef={exportRef} />
    </div>
  );
} 