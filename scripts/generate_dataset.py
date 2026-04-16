#!/usr/bin/env python3
"""
Chitra Dataset Generator
========================

This script generates the three CSV files required for Chitra chromosome visualization:
1. ref_chromosome_sizes.csv - Reference genome chromosome data
2. genome_data.csv - Genome-specific chromosome information
3. synteny_data.csv - Synteny/alignment data between genome

Usage:
    python generate_dataset.py
    
Or in Jupyter notebook:
    %run generate_dataset.py
"""

import pandas as pd
import numpy as np
import random
import os
from pathlib import Path

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

class ChitraDatasetGenerator:
    def __init__(self, output_dir="generated_dataset"):
        """
        Initialize the dataset generator
        
        Args:
            output_dir (str): Directory to save the generated CSV files
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Human chromosome data (approximate sizes in bp)
        self.human_chromosomes = {
            'chr1': 248956422,
            'chr2': 242193529,
            'chr3': 198295559,
            'chr4': 190214555,
            'chr5': 181538259,
            'chr6': 170805979,
            'chr7': 159345973,
            'chr8': 145138636,
            'chr9': 138394717,
            'chr10': 133797422,
            'chr11': 135086622,
            'chr12': 133275309,
            'chr13': 114364328,
            'chr14': 107043718,
            'chr15': 101991189,
            'chr16': 90338345,
            'chr17': 83257441,
            'chr18': 80373285,
            'chr19': 58617616,
            'chr20': 64444167,
            'chr21': 46709983,
            'chr22': 50818468,
            'chrX': 156040895,
            'chrY': 57227415
        }
        
    def generate_reference_chromosomes(self):
        """Generate reference chromosome sizes CSV"""
        print("Generating reference chromosome sizes...")
        
        ref_data = []
        for chr_name, size in self.human_chromosomes.items():
            # Add some variation to centromere positions
            centromere_start = int(size * (0.35 + np.random.normal(0, 0.1)))
            centromere_end = centromere_start + np.random.randint(2000000, 8000000)
            
            # Ensure centromere positions are within chromosome bounds
            centromere_start = max(1000000, min(centromere_start, size - 10000000))
            centromere_end = max(centromere_start + 1000000, min(centromere_end, size - 1000000))
            
            ref_data.append({
                'chromosome': chr_name,
                'size': size,
                'centromere_start': centromere_start,
                'centromere_end': centromere_end
            })
        
        ref_df = pd.DataFrame(ref_data)
        ref_file = self.output_dir / 'ref_chromosome_sizes.csv'
        ref_df.to_csv(ref_file, index=False)
        print(f"✓ Saved reference chromosomes to {ref_file}")
        return ref_df
    
    def generate_genome_data(self, num_genomes=3):
        """Generate genome chromosome data CSV"""
        print(f"Generating genome data for {num_genomes} genome...")
        
        genome_names = [f'Genome_{i+1}' for i in range(num_genomes)]
        genome_data = []
        
        for genome in genome_names:
            # Each genome has a subset of chromosomes with some size variation
            selected_chrs = random.sample(list(self.human_chromosomes.keys()), 
                                        k=random.randint(8, 15))
            
            for chr_name in selected_chrs:
                base_size = self.human_chromosomes[chr_name]
                # Add 10-30% size variation between genome
                size_variation = np.random.uniform(0.7, 1.3)
                chr_size = int(base_size * size_variation)
                
                # Generate centromere positions
                centromere_start = int(chr_size * (0.35 + np.random.normal(0, 0.15)))
                centromere_end = centromere_start + np.random.randint(1500000, 6000000)
                
                # Ensure positions are valid
                centromere_start = max(500000, min(centromere_start, chr_size - 5000000))
                centromere_end = max(centromere_start + 500000, min(centromere_end, chr_size - 500000))
                
                genome_data.append({
                    'genome_name': genome,
                    'chr_id': chr_name,
                    'chr_type': 'chromosome',
                    'chr_size_bp': chr_size,
                    'centromere_start': centromere_start,
                    'centromere_end': centromere_end
                })
        
        genome_df = pd.DataFrame(genome_data)
        genome_file = self.output_dir / 'genome_data.csv'
        genome_df.to_csv(genome_file, index=False)
        print(f"✓ Saved genome data to {genome_file}")
        return genome_df
    
    def generate_synteny_data(self, ref_df, genome_df, blocks_per_chr=5):
        """Generate synteny alignment data CSV"""
        print("Generating synteny data...")
        
        synteny_data = []
        ref_name = "Reference"
        
        # Group genome data by genome
        genome_groups = genome_df.groupby('genome_name')
        
        for genome_name, genome_chrs in genome_groups:
            print(f"  Processing {genome_name}...")
            
            for _, genome_chr in genome_chrs.iterrows():
                query_chr = genome_chr['chr_id']
                query_size = genome_chr['chr_size_bp']
                
                # Find corresponding reference chromosome
                ref_chr_data = ref_df[ref_df['chromosome'] == query_chr]
                if ref_chr_data.empty:
                    continue
                
                ref_size = ref_chr_data.iloc[0]['size']
                
                # Generate synteny blocks for this chromosome pair
                num_blocks = np.random.randint(2, blocks_per_chr + 1)
                
                # Generate non-overlapping blocks
                ref_positions = sorted(np.random.randint(1000000, ref_size - 1000000, num_blocks * 2))
                query_positions = sorted(np.random.randint(1000000, query_size - 1000000, num_blocks * 2))
                
                for i in range(0, len(ref_positions), 2):
                    if i + 1 >= len(ref_positions) or i + 1 >= len(query_positions):
                        break
                    
                    ref_start = ref_positions[i]
                    ref_end = ref_positions[i + 1]
                    
                    # Ensure minimum block size
                    if ref_end - ref_start < 500000:
                        ref_end = ref_start + np.random.randint(500000, 5000000)
                        ref_end = min(ref_end, ref_size - 100000)
                    
                    # Generate corresponding query positions with realistic size variations
                    ref_block_size = ref_end - ref_start
                    query_start = query_positions[i]
                    
                    # Create realistic size variations between reference and query blocks
                    # This simulates real biological scenarios:
                    size_variation_scenarios = [
                        # Scenario 1: Similar sizes (60% probability)
                        (0.6, lambda: np.random.uniform(0.8, 1.2)),
                        # Scenario 2: Query smaller (expansion in reference) (15% probability)  
                        (0.15, lambda: np.random.uniform(0.3, 0.7)),
                        # Scenario 3: Query larger (deletion in reference) (15% probability)
                        (0.15, lambda: np.random.uniform(1.5, 3.0)),
                        # Scenario 4: Very different sizes (10% probability)
                        (0.1, lambda: np.random.choice([np.random.uniform(0.1, 0.4), np.random.uniform(2.5, 5.0)]))
                    ]
                    
                    # Select scenario based on probabilities
                    rand_val = np.random.random()
                    cumulative_prob = 0
                    size_multiplier = 1.0
                    
                    for prob, multiplier_func in size_variation_scenarios:
                        cumulative_prob += prob
                        if rand_val <= cumulative_prob:
                            size_multiplier = multiplier_func()
                            break
                    
                    # Calculate query block size with variation
                    query_block_size = int(ref_block_size * size_multiplier)
                    
                    # Ensure minimum and maximum block sizes
                    query_block_size = max(50000, min(query_block_size, query_size // 4))
                    query_end = min(query_start + query_block_size, query_size - 100000)
                    
                    # Ensure valid positions
                    if query_end <= query_start:
                        query_end = query_start + max(50000, min(500000, query_size - query_start - 100000))
                    
                    # Random strand orientation
                    strand = random.choice(['+', '-'])
                    
                    synteny_data.append({
                        'query_name': genome_name,
                        'query_chr': query_chr,
                        'query_start': query_start,
                        'query_end': query_end,
                        'query_strand': strand,
                        'ref_chr': query_chr,
                        'ref_start': ref_start,
                        'ref_end': ref_end,
                        'ref_name': ref_name,
                        'qry_lvl': 'chromosome'
                    })
        
        synteny_df = pd.DataFrame(synteny_data)
        synteny_file = self.output_dir / 'synteny_data.csv'
        synteny_df.to_csv(synteny_file, index=False)
        print(f"✓ Saved synteny data to {synteny_file}")
        
        # Analyze size variations
        self._analyze_synteny_variations(synteny_df)
        
        return synteny_df
    
    def _analyze_synteny_variations(self, synteny_df):
        """Analyze and report size variations in synteny blocks"""
        if len(synteny_df) == 0:
            return
            
        # Calculate block sizes
        synteny_df['ref_block_size'] = synteny_df['ref_end'] - synteny_df['ref_start']
        synteny_df['query_block_size'] = synteny_df['query_end'] - synteny_df['query_start']
        synteny_df['size_ratio'] = synteny_df['query_block_size'] / synteny_df['ref_block_size']
        
        print(f"  📊 Synteny size variation analysis:")
        print(f"     • Similar sizes (0.8-1.2x): {len(synteny_df[(synteny_df['size_ratio'] >= 0.8) & (synteny_df['size_ratio'] <= 1.2)])} blocks")
        print(f"     • Query smaller (<0.8x): {len(synteny_df[synteny_df['size_ratio'] < 0.8])} blocks")
        print(f"     • Query larger (>1.2x): {len(synteny_df[synteny_df['size_ratio'] > 1.2])} blocks")
        print(f"     • Size ratio range: {synteny_df['size_ratio'].min():.2f} - {synteny_df['size_ratio'].max():.2f}")
        print(f"     • Average size ratio: {synteny_df['size_ratio'].mean():.2f}")
        
        # Examples of extreme variations
        extreme_small = synteny_df[synteny_df['size_ratio'] < 0.5]
        extreme_large = synteny_df[synteny_df['size_ratio'] > 2.0]
        
        if len(extreme_small) > 0:
            print(f"     • Extreme compressions (<0.5x): {len(extreme_small)} blocks")
        if len(extreme_large) > 0:
            print(f"     • Extreme expansions (>2.0x): {len(extreme_large)} blocks")
    
    def generate_optional_files(self, ref_df, num_genes=1000, num_breakpoints=50):
        """Generate optional annotation and breakpoint files"""
        print("Generating optional files...")
        
        # Generate gene annotations
        gene_data = []
        gene_classes = ['protein_coding', 'lncRNA', 'miRNA', 'pseudogene', 'rRNA', 'tRNA']
        
        for _, chr_row in ref_df.iterrows():
            chr_name = chr_row['chromosome']
            chr_size = chr_row['size']
            
            # Generate random number of genes per chromosome
            genes_per_chr = np.random.randint(20, 100)
            
            for i in range(genes_per_chr):
                start = np.random.randint(100000, chr_size - 100000)
                end = start + np.random.randint(1000, 50000)  # Gene length
                strand = random.choice(['+', '-'])
                gene_class = random.choice(gene_classes)
                
                gene_data.append({
                    'chromosome': chr_name,
                    'genomic_accession': f'NC_{random.randint(100000, 999999)}.1',
                    'start': start,
                    'end': end,
                    'strand': strand,
                    'class': gene_class,
                    'locus_tag': f'LOC{random.randint(100000, 999999)}',
                    'symbol': f'GENE{i+1}',
                    'name': f'Gene {i+1} protein',
                    'GeneID': str(random.randint(1000, 99999))
                })
        
        gene_df = pd.DataFrame(gene_data)
        gene_file = self.output_dir / 'ref_gene_annotations.csv'
        gene_df.to_csv(gene_file, index=False)
        print(f"✓ Saved gene annotations to {gene_file}")
        
        # Generate breakpoints
        breakpoint_data = []
        for _, chr_row in ref_df.iterrows():
            chr_name = chr_row['chromosome']
            chr_size = chr_row['size']
            
            # Generate random breakpoints
            breakpoints_per_chr = np.random.randint(1, 5)
            
            for i in range(breakpoints_per_chr):
                bp_start = np.random.randint(100000, chr_size - 100000)
                bp_end = bp_start + np.random.randint(1000, 10000)
                
                breakpoint_data.append({
                    'ref_chr': chr_name,
                    'ref_start': bp_start,
                    'ref_end': bp_end,
                    'breakpoint': f'BP_{chr_name}_{i+1}'
                })
        
        bp_df = pd.DataFrame(breakpoint_data)
        bp_file = self.output_dir / 'bp.csv'
        bp_df.to_csv(bp_file, index=False)
        print(f"✓ Saved breakpoints to {bp_file}")
        
        return gene_df, bp_df
    
    def generate_complete_dataset(self, num_genomes=3, include_optional=True):
        """Generate a complete dataset with all required files"""
        print(f"🧬 Generating Chitra dataset in '{self.output_dir}'")
        print("=" * 50)
        
        # Generate required files
        ref_df = self.generate_reference_chromosomes()
        genome_df = self.generate_genome_data(num_genomes)
        synteny_df = self.generate_synteny_data(ref_df, genome_df)
        
        # Generate optional files
        if include_optional:
            gene_df, bp_df = self.generate_optional_files(ref_df)
        
        print("\n" + "=" * 50)
        print("✅ Dataset generation complete!")
        print(f"📁 Files saved in: {self.output_dir.absolute()}")
        print("\nGenerated files:")
        print("  📊 ref_chromosome_sizes.csv (required)")
        print("  📊 genome_data.csv (required)")
        print("  📊 synteny_data.csv (required)")
        
        if include_optional:
            print("  📊 ref_gene_annotations.csv (optional)")
            print("  📊 bp.csv (optional)")
        
        # Print summary statistics
        print(f"\n📈 Dataset Summary:")
        print(f"  • Reference chromosomes: {len(ref_df)}")
        print(f"  • Genome: {num_genomes}")
        print(f"  • Total chromosomes: {len(genome_df)}")
        print(f"  • Synteny blocks: {len(synteny_df)}")
        
        if include_optional:
            print(f"  • Gene annotations: {len(gene_df)}")
            print(f"  • Breakpoints: {len(bp_df)}")
        
        return {
            'reference': ref_df,
            'genome': genome_df,
            'synteny': synteny_df,
            'genes': gene_df if include_optional else None,
            'breakpoints': bp_df if include_optional else None
        }

def visualize_synteny_variations(synteny_df):
    """
    Visualize synteny block size variations
    
    Args:
        synteny_df: DataFrame containing synteny data
    """
    import matplotlib.pyplot as plt
    
    # Calculate sizes and ratios
    synteny_df['ref_block_size'] = synteny_df['ref_end'] - synteny_df['ref_start']
    synteny_df['query_block_size'] = synteny_df['query_end'] - synteny_df['query_start']
    synteny_df['size_ratio'] = synteny_df['query_block_size'] / synteny_df['ref_block_size']
    
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    
    # 1. Scatter plot of ref vs query block sizes
    axes[0, 0].scatter(synteny_df['ref_block_size'] / 1e6, 
                      synteny_df['query_block_size'] / 1e6, 
                      alpha=0.6, s=30)
    axes[0, 0].plot([0, synteny_df['ref_block_size'].max() / 1e6], 
                   [0, synteny_df['ref_block_size'].max() / 1e6], 
                   'r--', alpha=0.5, label='Equal sizes')
    axes[0, 0].set_xlabel('Reference Block Size (Mb)')
    axes[0, 0].set_ylabel('Query Block Size (Mb)')
    axes[0, 0].set_title('Reference vs Query Block Sizes')
    axes[0, 0].legend()
    axes[0, 0].grid(True, alpha=0.3)
    
    # 2. Histogram of size ratios
    axes[0, 1].hist(synteny_df['size_ratio'], bins=30, alpha=0.7, edgecolor='black')
    axes[0, 1].axvline(x=1.0, color='red', linestyle='--', alpha=0.7, label='Equal sizes')
    axes[0, 1].set_xlabel('Query/Reference Size Ratio')
    axes[0, 1].set_ylabel('Frequency')
    axes[0, 1].set_title('Distribution of Size Ratios')
    axes[0, 1].legend()
    axes[0, 1].grid(True, alpha=0.3)
    
    # 3. Box plot of size ratios by genome
    genome_list = synteny_df['query_name'].unique()
    ratio_data = [synteny_df[synteny_df['query_name'] == genome]['size_ratio'].values 
                  for genome in genome_list]
    axes[1, 0].boxplot(ratio_data, labels=genome_list)
    axes[1, 0].axhline(y=1.0, color='red', linestyle='--', alpha=0.7)
    axes[1, 0].set_ylabel('Query/Reference Size Ratio')
    axes[1, 0].set_title('Size Ratio Distribution by Genome')
    axes[1, 0].grid(True, alpha=0.3)
    plt.setp(axes[1, 0].get_xticklabels(), rotation=45)
    
    # 4. Strand vs size ratio
    forward_ratios = synteny_df[synteny_df['query_strand'] == '+']['size_ratio']
    reverse_ratios = synteny_df[synteny_df['query_strand'] == '-']['size_ratio']
    
    axes[1, 1].hist([forward_ratios, reverse_ratios], 
                   bins=20, alpha=0.7, label=['Forward (+)', 'Reverse (-)'],
                   color=['blue', 'orange'])
    axes[1, 1].axvline(x=1.0, color='red', linestyle='--', alpha=0.7)
    axes[1, 1].set_xlabel('Query/Reference Size Ratio')
    axes[1, 1].set_ylabel('Frequency')
    axes[1, 1].set_title('Size Ratios by Strand Orientation')
    axes[1, 1].legend()
    axes[1, 1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.show()
    
    # Print some statistics
    print("\n📊 Detailed Size Variation Statistics:")
    print(f"   • Total synteny blocks: {len(synteny_df)}")
    print(f"   • Size ratio statistics:")
    print(f"     - Mean: {synteny_df['size_ratio'].mean():.3f}")
    print(f"     - Median: {synteny_df['size_ratio'].median():.3f}")
    print(f"     - Std Dev: {synteny_df['size_ratio'].std():.3f}")
    print(f"     - Min: {synteny_df['size_ratio'].min():.3f}")
    print(f"     - Max: {synteny_df['size_ratio'].max():.3f}")
    
    # Categorize variations
    similar = len(synteny_df[(synteny_df['size_ratio'] >= 0.8) & (synteny_df['size_ratio'] <= 1.2)])
    compressed = len(synteny_df[synteny_df['size_ratio'] < 0.8])
    expanded = len(synteny_df[synteny_df['size_ratio'] > 1.2])
    
    print(f"\n   • Size variation categories:")
    print(f"     - Similar sizes (0.8-1.2x): {similar} ({similar/len(synteny_df)*100:.1f}%)")
    print(f"     - Compressed in query (<0.8x): {compressed} ({compressed/len(synteny_df)*100:.1f}%)")
    print(f"     - Expanded in query (>1.2x): {expanded} ({expanded/len(synteny_df)*100:.1f}%)")

def main():
    """Main function to generate dataset"""
    # Create generator
    generator = ChitraDatasetGenerator("generated_dataset")
    
    # Generate complete dataset
    dataset = generator.generate_complete_dataset(
        num_genomes=3,  # Change this to generate more genome
        include_optional=True  # Set to False to skip optional files
    )
    
    return dataset

# For Jupyter notebook usage
def generate_chitra_dataset(output_dir="generated_dataset", num_genomes=3, include_optional=True):
    """
    Convenience function for Jupyter notebook usage
    
    Args:
        output_dir (str): Directory to save files
        num_genomes (int): Number of genome to generate
        include_optional (bool): Whether to generate optional files
    
    Returns:
        dict: Dictionary containing all generated DataFrames
    """
    generator = ChitraDatasetGenerator(output_dir)
    return generator.generate_complete_dataset(num_genomes, include_optional)

if __name__ == "__main__":
    main()