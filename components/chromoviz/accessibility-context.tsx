'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Scientifically validated colorblind-safe palettes
// Based on Wong (2011) Nature Methods and Okabe & Ito universal design palettes

export type ColorBlindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia'

export interface AccessibilityState {
  colorBlindMode: ColorBlindMode
  setColorBlindMode: (mode: ColorBlindMode) => void
  highContrast: boolean
  setHighContrast: (enabled: boolean) => void
  getMutationColors: () => Record<string, string>
  getSyntenyColors: () => { FORWARD: string; REVERSE: string; BLOCK_FORWARD: string; BLOCK_REVERSE: string }
  getGenomePalette: () => string[]
}

// Default (normal vision) palettes - matching existing app colors
const DEFAULT_MUTATION_COLORS = {
  SYN: '#4ade80',
  INV: '#f87171',
  TRANS: '#60a5fa',
  INVTR: '#c084fc',
  DUP: '#fbbf24',
  INVDP: '#f472b6',
}

const DEFAULT_SYNTENY_COLORS = {
  FORWARD: '#2563eb',
  REVERSE: '#dc2626',
  BLOCK_FORWARD: '#2563eb',
  BLOCK_REVERSE: '#dc2626',
}

// Wong (2011) Nature Methods colorblind-safe palette
// Optimized for deuteranopia (red-green, ~8% males) and protanopia
const DEUTERANOPIA_MUTATION_COLORS = {
  SYN: '#0072B2',    // Blue
  INV: '#E69F00',    // Orange
  TRANS: '#56B4E9',  // Sky Blue
  INVTR: '#CC79A7',  // Reddish Purple
  DUP: '#F0E442',    // Yellow
  INVDP: '#D55E00',  // Vermillion
}

const DEUTERANOPIA_SYNTENY_COLORS = {
  FORWARD: '#0072B2',  // Blue
  REVERSE: '#E69F00',  // Orange
  BLOCK_FORWARD: '#0072B2',
  BLOCK_REVERSE: '#E69F00',
}

// Protanopia-safe (similar to deuteranopia but with different emphasis)
const PROTANOPIA_MUTATION_COLORS = {
  SYN: '#0072B2',
  INV: '#E69F00',
  TRANS: '#56B4E9',
  INVTR: '#CC79A7',
  DUP: '#F0E442',
  INVDP: '#D55E00',
}

const PROTANOPIA_SYNTENY_COLORS = {
  FORWARD: '#0072B2',
  REVERSE: '#D55E00',
  BLOCK_FORWARD: '#0072B2',
  BLOCK_REVERSE: '#D55E00',
}

// Tritanopia-safe (blue-yellow, ~0.01%)
const TRITANOPIA_MUTATION_COLORS = {
  SYN: '#009E73',    // Bluish Green
  INV: '#D55E00',    // Vermillion
  TRANS: '#0072B2',  // Blue
  INVTR: '#CC79A7',  // Reddish Purple
  DUP: '#E69F00',    // Orange
  INVDP: '#56B4E9',  // Sky Blue
}

const TRITANOPIA_SYNTENY_COLORS = {
  FORWARD: '#009E73',  // Bluish Green
  REVERSE: '#D55E00',  // Vermillion
  BLOCK_FORWARD: '#009E73',
  BLOCK_REVERSE: '#D55E00',
}

// Genome palettes per mode
const DEFAULT_GENOME_PALETTE = [
  '#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6',
  '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2',
]

const DEUTERANOPIA_GENOME_PALETTE = [
  '#0072B2', '#E69F00', '#56B4E9', '#CC79A7', '#009E73',
  '#F0E442', '#D55E00', '#000000', '#BBBBBB',
]

const PROTANOPIA_GENOME_PALETTE = [
  '#0072B2', '#E69F00', '#56B4E9', '#CC79A7', '#009E73',
  '#F0E442', '#D55E00', '#000000', '#BBBBBB',
]

const TRITANOPIA_GENOME_PALETTE = [
  '#009E73', '#D55E00', '#0072B2', '#CC79A7', '#E69F00',
  '#56B4E9', '#F0E442', '#000000', '#BBBBBB',
]

// High contrast overlays
const HIGH_CONTRAST_OFFSET: Record<string, string> = {}

const AccessibilityContext = createContext<AccessibilityState | null>(null)

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [colorBlindMode, setColorBlindModeState] = useState<ColorBlindMode>('none')
  const [highContrast, setHighContrastState] = useState(false)

  // Persist to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chitra-accessibility')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.colorBlindMode) setColorBlindModeState(parsed.colorBlindMode)
        if (parsed.highContrast) setHighContrastState(parsed.highContrast)
      } catch {}
    }
  }, [])

  const setColorBlindMode = useCallback((mode: ColorBlindMode) => {
    setColorBlindModeState(mode)
    localStorage.setItem('chitra-accessibility', JSON.stringify({ colorBlindMode: mode, highContrast }))
  }, [highContrast])

  const setHighContrast = useCallback((enabled: boolean) => {
    setHighContrastState(enabled)
    localStorage.setItem('chitra-accessibility', JSON.stringify({ colorBlindMode, highContrast: enabled }))
  }, [colorBlindMode])

  const getMutationColors = useCallback(() => {
    switch (colorBlindMode) {
      case 'deuteranopia': return DEUTERANOPIA_MUTATION_COLORS
      case 'protanopia': return PROTANOPIA_MUTATION_COLORS
      case 'tritanopia': return TRITANOPIA_MUTATION_COLORS
      default: return DEFAULT_MUTATION_COLORS
    }
  }, [colorBlindMode])

  const getSyntenyColors = useCallback(() => {
    switch (colorBlindMode) {
      case 'deuteranopia': return DEUTERANOPIA_SYNTENY_COLORS
      case 'protanopia': return PROTANOPIA_SYNTENY_COLORS
      case 'tritanopia': return TRITANOPIA_SYNTENY_COLORS
      default: return DEFAULT_SYNTENY_COLORS
    }
  }, [colorBlindMode])

  const getGenomePalette = useCallback(() => {
    switch (colorBlindMode) {
      case 'deuteranopia': return DEUTERANOPIA_GENOME_PALETTE
      case 'protanopia': return PROTANOPIA_GENOME_PALETTE
      case 'tritanopia': return TRITANOPIA_GENOME_PALETTE
      default: return DEFAULT_GENOME_PALETTE
    }
  }, [colorBlindMode])

  return (
    <AccessibilityContext.Provider value={{
      colorBlindMode,
      setColorBlindMode,
      highContrast,
      setHighContrast,
      getMutationColors,
      getSyntenyColors,
      getGenomePalette,
    }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) {
    // Return safe defaults when not wrapped in provider
    return {
      colorBlindMode: 'none' as ColorBlindMode,
      setColorBlindMode: () => {},
      highContrast: false,
      setHighContrast: () => {},
      getMutationColors: () => DEFAULT_MUTATION_COLORS,
      getSyntenyColors: () => DEFAULT_SYNTENY_COLORS,
      getGenomePalette: () => DEFAULT_GENOME_PALETTE,
    }
  }
  return ctx
}
