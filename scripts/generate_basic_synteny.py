#!/usr/bin/env python3
"""
Basic Synteny Dataset Generator
===============================

Creates a simple synteny dataset with:
- Reference genome (5 chromosomes)
- 2 genome with clear synteny relationships
- Easy to understand patterns for testing/demo

Perfect for quick testing of Chitra visualization.
"""

import pandas as pd
import numpy as np
import os
from pathlib import Path

def generate_basic_synteny_set(output_dir="public/example/basic_set"):
    """
    Generate a basic synteny dataset with reference + 2 genome
    
    Args:
        output_dir (str): Directory to save the CSV files
    """
    
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    print(f"🧬 Generating Basic Synteny Dataset")
    print(f"📁 Output directory: {output_path.absolute()}")
    print("=" * 50)
    
    # Define basic chromosome data (5 chromosomes for simplicity)
    chromosomes = ['chr1', 'chr2', 'chr3', 'chr4', 'chr5']
    
    # Reference chromosome sizes (in bp) - realistic but simple
    ref_chr_data = {
        'chr1': 150_000_000,  # 150 Mb
        'chr2': 120_000_000,  # 120 Mb  
        'chr3': 100_000_000,  # 100 Mb
        'chr4': 80_000_000,   # 80 Mb
        'chr5': 60_000_000,   # 60 Mb
    }
    
    # ===== 1. Generate Reference Chromosome Sizes =====
    print("📊 Generating reference chromosomes...")
    
    ref_data = []
    for chr_name, size in ref_chr_data.items():
        # Simple centromere in the middle
        centromere_start = int(size * 0.45)
        centromere_end = int(size * 0.55)
        
        ref_data.append({
            'chromosome': chr_name,
            'size': size,
            'centromere_start': centromere_start,
            'centromere_end': centromere_end
        })
    
    ref_df = pd.DataFrame(ref_data)
    ref_file = output_path / 'ref_chromosome_sizes.csv'
    ref_df.to_csv(ref_file, index=False)
    print(f"✓ Saved: {ref_file}")
    
    # ===== 2. Generate Genome Data =====
    print("📊 Generating genome data...")
    
    genome_data = []
    genome_names = ['Genome_A', 'Genome_B']
    
    for genome in genome_names:
        for chr_name, base_size in ref_chr_data.items():
            # Add some size variation (±10%)
            if genome == 'Genome_A':
                size_factor = 0.95  # Slightly smaller
            else:
                size_factor = 1.05  # Slightly larger
                
            chr_size = int(base_size * size_factor)
            
            # Centromere positions with slight variation
            centromere_start = int(chr_size * (0.45 + (0.02 if genome == 'Genome_A' else -0.02)))
            centromere_end = int(chr_size * (0.55 + (0.02 if genome == 'Genome_A' else -0.02)))
            
            genome_data.append({
                'genome_name': genome,
                'chr_id': chr_name,
                'chr_type': 'chromosome',
                'chr_size_bp': chr_size,
                'centromere_start': centromere_start,
                'centromere_end': centromere_end
            })
    
    genome_df = pd.DataFrame(genome_data)
    genome_file = output_path / 'genome_data.csv'
    genome_df.to_csv(genome_file, index=False)
    print(f"✓ Saved: {genome_file}")
    
    # ===== 3. Generate Simple Synteny Data =====
    print("📊 Generating synteny data...")
    
    synteny_data = []
    
    # Create clear, predictable synteny patterns
    for chr_name, ref_size in ref_chr_data.items():
        
        # Genome A - mostly forward orientation with some inversions
        genome_a_size = int(ref_size * 0.95)
        
        if chr_name in ['chr1', 'chr3', 'chr5']:  # Forward orientation
            # Create 3 synteny blocks per chromosome
            block_size = ref_size // 4
            
            for i in range(3):
                ref_start = i * block_size + 1_000_000
                ref_end = ref_start + block_size - 500_000
                
                # Corresponding positions in genome A (with slight compression)
                query_start = int(i * block_size * 0.95) + 1_000_000
                query_end = int(query_start + (block_size - 500_000) * 0.95)
                
                synteny_data.append({
                    'query_name': 'Genome_A',
                    'query_chr': chr_name,
                    'query_start': query_start,
                    'query_end': query_end,
                    'query_strand': '+',
                    'ref_chr': chr_name,
                    'ref_start': ref_start,
                    'ref_end': ref_end,
                    'ref_name': 'Reference',
                    'qry_lvl': 'chromosome'
                })
        
        else:  # Reverse orientation for chr2, chr4
            # Create 2 larger blocks in reverse orientation
            block_size = ref_size // 3
            
            for i in range(2):
                ref_start = i * block_size + 2_000_000
                ref_end = ref_start + block_size - 1_000_000
                
                # Reverse mapping in genome A
                query_start = int((2-i-1) * block_size * 0.95) + 2_000_000
                query_end = int(query_start + (block_size - 1_000_000) * 0.95)
                
                synteny_data.append({
                    'query_name': 'Genome_A',
                    'query_chr': chr_name,
                    'query_start': query_start,
                    'query_end': query_end,
                    'query_strand': '-',
                    'ref_chr': chr_name,
                    'ref_start': ref_start,
                    'ref_end': ref_end,
                    'ref_name': 'Reference',
                    'qry_lvl': 'chromosome'
                })
        
        # Genome B - different pattern with size variations
        genome_b_size = int(ref_size * 1.05)
        
        if chr_name in ['chr1', 'chr2']:  # More complex patterns
            # Create blocks with different size ratios
            patterns = [
                (0.1, 0.3, 0.08, 0.25, '+'),  # Compression
                (0.4, 0.6, 0.35, 0.7, '+'),   # Expansion  
                (0.7, 0.9, 0.75, 0.95, '-'),  # Reverse
            ]
            
            for ref_start_pct, ref_end_pct, query_start_pct, query_end_pct, strand in patterns:
                ref_start = int(ref_size * ref_start_pct)
                ref_end = int(ref_size * ref_end_pct)
                query_start = int(genome_b_size * query_start_pct)
                query_end = int(genome_b_size * query_end_pct)
                
                synteny_data.append({
                    'query_name': 'Genome_B',
                    'query_chr': chr_name,
                    'query_start': query_start,
                    'query_end': query_end,
                    'query_strand': strand,
                    'ref_chr': chr_name,
                    'ref_start': ref_start,
                    'ref_end': ref_end,
                    'ref_name': 'Reference',
                    'qry_lvl': 'chromosome'
                })
        
        else:  # Simpler patterns for chr3, chr4, chr5
            # Create 2 blocks with mixed orientations
            block_size = ref_size // 3
            orientations = ['+', '-']
            
            for i in range(2):
                ref_start = i * block_size + 1_500_000
                ref_end = ref_start + block_size - 800_000
                
                # Genome B positions (with expansion)
                query_start = int(i * block_size * 1.05) + 1_500_000
                query_end = int(query_start + (block_size - 800_000) * 1.05)
                
                synteny_data.append({
                    'query_name': 'Genome_B',
                    'query_chr': chr_name,
                    'query_start': query_start,
                    'query_end': query_end,
                    'query_strand': orientations[i],
                    'ref_chr': chr_name,
                    'ref_start': ref_start,
                    'ref_end': ref_end,
                    'ref_name': 'Reference',
                    'qry_lvl': 'chromosome'
                })
    
    synteny_df = pd.DataFrame(synteny_data)
    synteny_file = output_path / 'synteny_data.csv'
    synteny_df.to_csv(synteny_file, index=False)
    print(f"✓ Saved: {synteny_file}")
    
    # ===== Summary =====
    print("\n" + "=" * 50)
    print("✅ Basic Synteny Dataset Generated!")
    print(f"📁 Location: {output_path.absolute()}")
    print(f"📊 Summary:")
    print(f"   • Reference chromosomes: {len(ref_df)}")
    print(f"   • Genome: 2 (Genome_A, Genome_B)")
    print(f"   • Total genome chromosomes: {len(genome_df)}")
    print(f"   • Synteny blocks: {len(synteny_df)}")
    
    # Show synteny patterns
    print(f"\n📈 Synteny Patterns:")
    for genome in ['Genome_A', 'Genome_B']:
        genome_blocks = synteny_df[synteny_df['query_name'] == genome]
        forward_count = len(genome_blocks[genome_blocks['query_strand'] == '+'])
        reverse_count = len(genome_blocks[genome_blocks['query_strand'] == '-'])
        print(f"   • {genome}: {len(genome_blocks)} blocks ({forward_count} forward, {reverse_count} reverse)")
    
    # Show size variations
    synteny_df['ref_size'] = synteny_df['ref_end'] - synteny_df['ref_start']
    synteny_df['query_size'] = synteny_df['query_end'] - synteny_df['query_start']
    synteny_df['size_ratio'] = synteny_df['query_size'] / synteny_df['ref_size']
    
    print(f"\n📏 Size Variations:")
    print(f"   • Size ratio range: {synteny_df['size_ratio'].min():.2f} - {synteny_df['size_ratio'].max():.2f}")
    print(f"   • Average ratio: {synteny_df['size_ratio'].mean():.2f}")
    
    similar = len(synteny_df[(synteny_df['size_ratio'] >= 0.8) & (synteny_df['size_ratio'] <= 1.2)])
    compressed = len(synteny_df[synteny_df['size_ratio'] < 0.8])
    expanded = len(synteny_df[synteny_df['size_ratio'] > 1.2])
    
    print(f"   • Similar sizes: {similar} blocks")
    print(f"   • Compressed in query: {compressed} blocks") 
    print(f"   • Expanded in query: {expanded} blocks")
    
    print(f"\n🎉 Ready to load in Chitra!")
    print(f"Use path: {output_dir}")
    
    return {
        'reference': ref_df,
        'genome': genome_df,
        'synteny': synteny_df,
        'output_dir': str(output_path)
    }

def main():
    """Generate basic synteny dataset"""
    return generate_basic_synteny_set()

if __name__ == "__main__":
    main()