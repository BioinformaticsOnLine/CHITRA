<div align="center">
  
  <h1>CHITRA: Interactive Chromosomal Rearrangement Visualization</h1>
  <img src="https://raw.githubusercontent.com/alo7lika/PyVerse/refs/heads/main/Images/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="900">

  <p>
    <strong>A web-based tool for interactive visualization of synteny blocks, chromosomal rearrangements, and breakpoints</strong>
  </p>

  <p>
    <a href="https://opensource.org/licenses/MIT">
      <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License">
    </a>
    <a href="https://chitra.bioinformaticsonline.com/">
      <img src="https://img.shields.io/website-up-down-green-red/https/chitra.bioinformaticsonline.com.svg?label=Website" alt="Website Status">
    </a>
  </p>

  <h3>
    <a href="https://chitra.bioinformaticsonline.com">✨ Try CHITRA</a>
    &nbsp;•&nbsp;
    <a href="https://chitra.bioinformaticsonline.com/docs">📖 Documentation</a>
  </h3>

  <img src="public/assets/Chitra-meta.png" alt="CHITRA - Interactive Chromosomal Rearrangement Visualization Platform" width="650">


</div>

---
  

## Features

*   Interactive linear and circular (chord map) visualizations.
*   Customizable ribbon colors for rearrangement types.
*   Breakpoint mapping.
*   Gene annotation integration.



<img width="1632" height="1006" alt="Chitra-flow-3" src="https://github.com/user-attachments/assets/7e7bdaf8-60ec-4e32-b508-9202e1a1b7d4" />


Figure . The workflow encompasses four sequential phases: (A) Data input supporting direct CSV upload, NCBI Feature Table conversion, or example datasets; (B) Automated data processing with validation, filtering, and coordinate transformation; (C) Interactive visualization generation featuring linear synteny views, mutation type annotation, and detailed chord diagrams; and (D) Collaborative output system with multi-format export capabilities, cloud-based link sharing, and persistent state management for reproducible research workflows.
(Additionally, CHITRA includes an integrated NCBI RefSeq Feature Table converter that automatically generates reference genome and annotation files from standard NCBI feature tables.)


---

Example data files, which can serve as a useful starting point or template for your own datasets, are located in the `/public/example` directory of this repository.

You can browse all example sets directly on GitHub:
**[➡️ Browse All Example Sets on GitHub](https://github.com/BioinformaticsOnLine/CHITRA/tree/main/public/example)**

Here are direct links to the curated example sets, as featured in the "Quick Demos" section of the application:

*   **Set 1: Basic Synteny** - Simple synteny visualization between genome.
    *   [View Set 1 Files on GitHub](https://github.com/BioinformaticsOnLine/CHITRA/tree/main/public/example/set1)
*   **Set 2: Multi-Genome** - Complex synteny relationships across multiple genome.
    *   [View Set 2 Files on GitHub](https://github.com/BioinformaticsOnLine/CHITRA/tree/main/public/example/set2)
*   **Set 3: Annotated Genome** - Detailed genome annotations with gene information and breakpoints.
    *   [View Set 3 Files on GitHub](https://github.com/BioinformaticsOnLine/CHITRA/tree/main/public/example/set3)


## Data Format

CHITRA requires three CSV files as input:

### 1. Synteny Data (`synteny_data.csv`)
This file contains the pairwise synteny blocks between the query and reference genome.

| Column | Description |
| --- | --- |
| `query_name` | Query genome name |
| `query_chr` | Query chromosome ID |
| `query_start` | Start position in query |
| `query_end` | End position in query |
| `query_strand`| Orientation (+/-) |
| `ref_chr` | Reference chromosome ID |
| `ref_start` | Start position in reference |
| `ref_end` | End position in reference |
| `ref_name` | Reference genome name |
| `qry_lvl` | Query level |

### 2. Genome Data (`genome_data.csv`)
This file contains information about the chromosomes of each genome.

| Column | Description |
| --- | --- |
| `genome_name` | Name of the genome |
| `chr_id` | Chromosome identifier |
| `chr_type` | Type of chromosome |
| `chr_size_bp` | Chromosome size in base pairs |
| `centromere_start`| Centromere start position (optional) |
| `centromere_end` | Centromere end position (optional) |

### 3. Reference Chromosome Sizes (`ref_chromosome_sizes.csv`)
This file contains the sizes of the reference chromosomes.

| Column | Description |
| --- | --- |
| `chromosome` | Chromosome identifier |
| `size` | Chromosome size in base pairs |
| `centromere_start`| Centromere start position (optional) |
| `centromere_end` | Centromere end position (optional) |

### Optional Input Files

#### 4. Gene Annotations (`ref_gene_annotations.csv`) (Optional)
This file contains information about gene annotations.

| Column | Description |
| --- | --- |
| `chromosome` | Chromosome ID |
| `genomic_accession` | Genomic accession number |
| `start` | Start position |
| `end` | End position |
| `strand` | Strand (+/-) |
| `class` | Gene class |
| `locus_tag` | Locus tag (optional) |
| `symbol` | Gene symbol (optional) |
| `name` | Gene name (optional) |
| `GeneID` | Gene ID |

#### 5. Breakpoints Data (`breakpoints.csv`) (Optional)
This file contains information about chromosome breakpoints.

| Column | Description |
| --- | --- |
| `ref_chr` | Reference chromosome ID |
| `ref_start` | Start position |
| `ref_end` | End position |
| `breakpoint` | Breakpoint identifier |



## Implementation

Built with ❤️, React, ShadCN UI, Tailwind CSS, Motion, D3.js, and jsSVG.

## Availability

*   Web: [https://chitra.bioinformaticsonline.com/](https://chitra.bioinformaticsonline.com/)
*   Docs: [https://chitra.bioinformaticsonline.com/docs](https://chitra.bioinformaticsonline.com/docs)
*   Source: [https://github.com/BioinformaticsOnLine/CHITRA](https://github.com/BioinformaticsOnLine/CHITRA)


## Quick Deploy 🚀

### In-Browser Development
Instantly launch a complete development environment in your browser. This is ideal for exploring the code, testing changes, or contributing without any local setup.

<p align="center">
  <a href="https://stackblitz.com/github/pranjalpruthi/CHITRA?file=README.md">
    <img src="https://img.shields.io/badge/Open%20in-StackBlitz-1374EF?style=for-the-badge&logo=stackblitz&logoColor=white" alt="Open in StackBlitz">
  </a>
  <a href="https://codesandbox.io/p/github/pranjalpruthi/CHITRA">
    <img src="https://img.shields.io/badge/Open%20in-CodeSandbox-151515?style=for-the-badge&logo=codesandbox&logoColor=white" alt="Open in CodeSandbox">
  </a>
</p>

### One-Click Cloud Deployment
Deploy a live, public instance of CHITRA to the cloud with a single click.

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https://github.com/pranjalpruthi/CHITRA">
    <img src="https://img.shields.io/badge/Deploy%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Deploy on Vercel">
  </a>
  <a href="https://app.netlify.com/start/deploy?repository=https://github.com/pranjalpruthi/CHITRA">
    <img src="https://img.shields.io/badge/Deploy%20on-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" alt="Deploy on Netlify">
  </a>
  <a href="https://render.com/deploy?repo=https://github.com/pranjalpruthi/CHITRA">
    <img src="https://img.shields.io/badge/Deploy%20on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Deploy on Render">
  </a>
  <a href="https://app.coolify.io/deploy?template=https://raw.githubusercontent.com/BioinformaticsOnLine/CHITRA/main/coolify.json">
    <img src="https://img.shields.io/badge/Deploy%20on-Coolify-25BDBE?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjZmZmIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEwLjg4NiAyLjkzNGMuMjgzLS43NDEuOTktLjc0MSAxLjI3NyAwbDkuMzc4IDI0LjIyOGMuMjg2Ljc0Mi0uMTk0IDEuNTY2LS44ODEgMS41NjZINS41MzZBMS4wMDMgMS4wMDMgMCAwIDEtNC44NTIgMjYuNzYzbDkuMzczLTI0LjIyOHoiLz48L3N2Zz4=" alt="Deploy on Coolify">
  </a>
</p>

---

## Get Started (Locally & Self-Hosted) 🚀

Follow these steps to set up and run CHITRA on your local machine or a self-hosted server.

### 1. Prerequisites
*   **Node.js**: We recommend the latest LTS version. Download from [nodejs.org](https://nodejs.org/).
*   **pnpm**: This project uses pnpm for efficient dependency management. Install via `npm install -g pnpm`.

### 2. Clone the Repository

Open your terminal and run the following command to clone the CHITRA repository:
```bash
git clone https://github.com/BioinformaticsOnLine/CHITRA.git
```

### 3. Navigate to the Project Directory

Change into the newly cloned directory:
```bash
cd CHITRA
```

### 4. Install Dependencies

Install the project dependencies using pnpm:
```bash
pnpm install
```

### 5. Run the Development Server

Start the Next.js development server:
```bash
pnpm dev
```
This will typically start the application on `http://localhost:3000`. Open this URL in your web browser to see CHITRA running.

### Docker Deployment 🐳

The fastest way to deploy CHITRA is using Docker:

```bash
# Clone and navigate to the repository
git clone https://github.com/BioinformaticsOnLine/CHITRA.git
cd CHITRA

# Start with Docker Compose (recommended)
pnpm docker:compose

# Or build and run manually
pnpm docker:build
pnpm docker:run
```

CHITRA will be available at `http://localhost:3000`

**Docker Compose Features:**
- ✅ Production-ready setup
- ✅ Automatic restarts
- ✅ Health checks
- ✅ Optional nginx reverse proxy
- ✅ Volume mounting for example data

**Stop the application:**
```bash
pnpm docker:down
```

### Other Production Options

*   **Self-hosting (Node.js server)**: Build using `pnpm build` and start with `pnpm start`
*   **Static Export**: Use `next export` for static HTML/CSS/JS files
*   **Vercel**: Deploy directly to [Vercel](https://vercel.com/) for automatic scaling

For detailed deployment guides, refer to the [official Next.js deployment documentation](https://nextjs.org/docs/deployment).

## Funding

Funded by The Rockefeller Foundation and CSIR-IGIB.

## License

MIT License.


[](https://api.visitorbadge.io/api/VisitorHit?user=pranjalpruthi&repo=github-visitors-badge&countColor=%237B1E7A)
