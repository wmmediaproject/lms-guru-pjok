"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface PageTransitionProps {
  children: React.ReactNode
  className?: string
  /**
   * Kunci unik untuk memicu animasi ulang (misal: pathname)
   */
  transitionKey?: string
}

export function PageTransition({
  children,
  className,
  transitionKey,
}: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      key={transitionKey}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.28,
        ease: [0.22, 1, 0.36, 1], // easeOutQuint smooth sporty curve
      }}
      className={cn("w-full flex-1", className)}
    >
      {children}
    </motion.div>
  )
}
