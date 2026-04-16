'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Accessibility, Eye, EyeOff, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAccessibility, type ColorBlindMode } from './accessibility-context'

const COLOR_BLIND_OPTIONS: { value: ColorBlindMode; label: string; description: string; preview: string[] }[] = [
  {
    value: 'none',
    label: 'Default',
    description: 'Standard color palette',
    preview: ['#4ade80', '#f87171', '#60a5fa', '#c084fc'],
  },
  {
    value: 'deuteranopia',
    label: 'Deuteranopia',
    description: 'Red-green (most common)',
    preview: ['#0072B2', '#E69F00', '#56B4E9', '#CC79A7'],
  },
  {
    value: 'protanopia',
    label: 'Protanopia',
    description: 'Red-green (red weak)',
    preview: ['#0072B2', '#E69F00', '#56B4E9', '#CC79A7'],
  },
  {
    value: 'tritanopia',
    label: 'Tritanopia',
    description: 'Blue-yellow (rare)',
    preview: ['#009E73', '#D55E00', '#0072B2', '#CC79A7'],
  },
]

export function AccessibilityButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { colorBlindMode, setColorBlindMode } = useAccessibility()

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
              "absolute bottom-14 right-0",
              "w-72 p-4 rounded-2xl",
              "bg-white/95 dark:bg-gray-900/95",
              "backdrop-blur-xl",
              "border border-gray-200 dark:border-gray-700",
              "shadow-2xl shadow-black/20"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Accessibility className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Accessibility</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              Color-blind friendly palettes based on Wong (2011), Nature Methods.
            </p>

            <div className="space-y-1.5">
              {COLOR_BLIND_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setColorBlindMode(option.value)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-200",
                    colorBlindMode === option.value
                      ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20"
                      : "hover:bg-accent/50 border border-transparent"
                  )}
                >
                  <div className="flex gap-0.5 shrink-0">
                    {option.preview.map((color, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{option.label}</div>
                    <div className="text-[10px] text-muted-foreground">{option.description}</div>
                  </div>
                  {colorBlindMode === option.value && (
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] text-muted-foreground text-center">
                Changes apply to synteny ribbons, mutation tags, and genome colors.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-11 w-11 rounded-full flex items-center justify-center",
          "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
          "backdrop-blur-md",
          "border border-blue-500 dark:border-blue-500",
          "shadow-lg shadow-blue-500/25",
          "transition-colors duration-200",
          colorBlindMode !== 'none' && "ring-2 ring-blue-400/40",
          isOpen && "bg-blue-700"
        )}
        aria-label="Accessibility settings"
      >
        <Accessibility className="h-5 w-5 text-white" />
      </motion.button>
    </div>
  )
}
