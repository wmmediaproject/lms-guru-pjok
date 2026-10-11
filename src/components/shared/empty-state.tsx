import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed border-border/80 bg-card/50", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {action && <div className="mt-5">{action}</div>}
      </CardContent>
    </Card>
  )
}
