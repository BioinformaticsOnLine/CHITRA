// lib/tour-steps.ts
import { ReactNode } from 'react';

type Side = "bottom" | "left" | "top" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "left-top" | "left-bottom" | "right-top" | "right-bottom";

export const tourSteps = [{
  tour: "chromoviz-intro",
  steps: [
    {
      icon: "👋",
      title: "Welcome to ChromoViz",
      content: "Let's explore how to visualize and analyze chromosome synteny data.",
      selector: "body",
      side: "bottom" as Side,
      showControls: true,
    },
    {
      icon: "📤",
      title: "Upload & Examples",
      content: "Start by uploading your data files or try our example datasets to explore the visualization capabilities.",
      selector: "[data-tour='upload-section']",
      side: "bottom" as Side,
      showControls: true,
    },
    {
      icon: "🔍",
      title: "Interactive Controls",
      content: "Use these controls to filter genome, chromosomes, and customize your visualization.",
      selector: "[data-tour='controls-section']",
      side: "bottom" as Side,
      showControls: true,
    },
    {
      icon: "📊",
      title: "Visualization Area",
      content: "The main visualization area where you can interact with chromosome synteny blocks. Zoom, pan, and click for details.",
      selector: "[data-tour='visualization-area']",
      side: "left" as Side,
      showControls: true,
    },
    {
      icon: "📋",
      title: "Details Panel",
      content: "When you select synteny blocks, detailed information will appear here.",
      selector: "[data-tour='details-panel']",
      side: "left" as Side,
      showControls: true,
    }
  ]
}];