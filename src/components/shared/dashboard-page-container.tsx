"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { PageTransition } from "./page-transition"

export interface DashboardPageContainerProps {
  children: React.ReactNode
}

export function DashboardPageContainer({
  children,
}: DashboardPageContainerProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 lg:overflow-x-hidden">
      <PageTransition transitionKey={pathname}>
        {children}
      </PageTransition>
    </div>
  )
}
