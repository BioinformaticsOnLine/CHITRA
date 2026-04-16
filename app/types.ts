export interface SyntenyData {
  query_name: string;
  query_chr: string;
  query_start: number;
  query_end: number;
  query_strand: '+' | '-';
  ref_chr: string;
  ref_start: number;
  ref_end: number;
  ref_name: string;
  qry_lvl: string;
  symbol: string;
  class: string;
  position: string;
  GeneID: string;
  isCluster?: boolean;
  geneCount?: number;
  name?: string;
  locus_tag?: string;
  genomic_accession?: string;
}

export interface ChromosomeData {
  genome_name: string;
  chr_id: string;
  chr_type: string;
  chr_size_bp: number;
  centromere_start: number | null | undefined;
  centromere_end: number | null | undefined;
  annotations?: GeneAnnotation[]; 
}

import { GeneClass } from "@/config/chromoviz.config";

export interface GeneAnnotation {
  chromosome: string;
  genomic_accession: string;
  start: number;
  end: number;
  strand: '+' | '-';
  class: GeneClass;
  locus_tag?: string | null;
  symbol?: string | null;
  name?: string | null;
  GeneID: string;
}

export interface BreakpointData {
  ref_chr: string;
  ref_start: number;
  ref_end: number;
  breakpoint: string;
}

export interface ChromosomeBreakpoint {
  ref_chr: string;
  ref_start: number;
  ref_end: number;
  breakpoint: string;
}

export interface ReferenceGenomeData {
  chromosomeSizes: {
    chromosome: string;
    size: number;
    centromere_start?: number;
    centromere_end?: number;
  }[];
  geneAnnotations?: GeneAnnotation[];
  breakpoints?: ChromosomeBreakpoint[];
}
