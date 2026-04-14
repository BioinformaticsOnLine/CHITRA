// import Provider from '@/app/provider'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
// import AuthWrapper from '@/components/wrapper/auth-wrapper'
import ConvexClientProvider from '@/components/ConvexClientProvider'
import { AccessibilityProvider } from "@/components/chromoviz/accessibility-context"
import { AccessibilityButton } from "@/components/chromoviz/accessibility-button"
import { Analytics } from "@vercel/analytics/react"
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { RootProvider } from 'fumadocs-ui/provider/next';

export const metadata: Metadata = {
  metadataBase: new URL("https://chitra.bioinformaticsonline.com"),
  title: {
    default: 'CHITRA: An Interactive Visualization Tool for Comparative Genomic Rearrangement Analysis',
    template: `%s | CHITRA`
  },
  description: 'Here, we present CHITRA, a web-based interactive tool designed to visualize synteny blocks, chromosomal rearrangements, and breakpoints in both linear and circular styles. CHITRA enables real-time exploration of genome structural variations with an intuitive graphical interface, customizable visualization options, and high-resolution export capabilities for publication-ready figures. The tool supports chromosome- and scaffold-level assemblies and allows users to filter, highlight, and interactively examine syntenic relationships.',
  openGraph: {
    title: 'CHITRA: An Interactive Visualization Tool for Comparative Genomic Rearrangement Analysis',
    description: 'Here, we present CHITRA, a web-based interactive tool designed to visualize synteny blocks, chromosomal rearrangements, and breakpoints in both linear and circular styles. CHITRA enables real-time exploration of genome structural variations with an intuitive graphical interface, customizable visualization options, and high-resolution export capabilities for publication-ready figures. The tool supports chromosome- and scaffold-level assemblies and allows users to filter, highlight, and interactively examine syntenic relationships.',
    images: ['/assets/Chitra-meta.png'],
    url: 'https://chitra.bioinformaticsonline.com'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CHITRA: An Interactive Visualization Tool for Comparative Genomic Rearrangement Analysis',
    description: 'Here, we present CHITRA, a web-based interactive tool designed to visualize synteny blocks, chromosomal rearrangements, and breakpoints in both linear and circular styles. CHITRA enables real-time exploration of genome structural variations with an intuitive graphical interface, customizable visualization options, and high-resolution export capabilities for publication-ready figures. The tool supports chromosome- and scaffold-level assemblies and allows users to filter, highlight, and interactively examine syntenic relationships.',
    images: ['/assets/Chitra-meta.png'],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/x-icon" sizes="16x16 32x32" href="/favicon.ico" />
        <link rel="icon" sizes="192x192" href="/favicon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon-180-precomposed.png" />
        <meta name="msapplication-TileColor" content="#FFFFFF" />
        <meta name="msapplication-TileImage" content="/favicon-144.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${GeistSans.className} flex min-h-screen flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="chitra-theme"
          forcedTheme={undefined}
          themes={['light', 'dark', 'system']}
        >
          <RootProvider>
            <AccessibilityProvider>
              <ConvexClientProvider>
                {children}
                <Toaster />
              </ConvexClientProvider>
              <AccessibilityButton />
            </AccessibilityProvider>
          </RootProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
