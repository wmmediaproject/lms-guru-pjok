"use client"

import * as React from "react"
import { CalendarDays, KeyRound, Palette, Sliders } from "lucide-react"

import type { Period, Settings } from "@/lib/supabase/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PeriodTab } from "./period-tab"
import { WeightSettingsForm } from "./weight-settings-form"
import { AppearanceTab } from "./appearance-tab"
import { AccountTab, type AdminProfileData } from "./account-tab"

export interface PengaturanTabsProps {
  initialPeriods?: Period[]
  initialSettings?: Settings | null
  userEmail?: string | null
  profile?: AdminProfileData | null
}

export function PengaturanTabs({
  initialPeriods,
  initialSettings,
  userEmail,
  profile,
}: PengaturanTabsProps) {
  return (
    <Tabs defaultValue="periode" className="w-full space-y-4">
      <TabsList className="grid w-full grid-cols-4 gap-1 p-1 group-data-horizontal/tabs:h-10 sm:inline-flex sm:w-auto sm:group-data-horizontal/tabs:h-9">
        <TabsTrigger
          value="periode"
          className="h-full gap-1 px-1.5 text-xs sm:gap-1.5 sm:px-3 sm:text-sm cursor-pointer"
        >
          <CalendarDays
            className="size-3.5 sm:size-4 shrink-0"
            aria-hidden="true"
          />
          <span className="truncate">Periode</span>
        </TabsTrigger>
        <TabsTrigger
          value="penilaian"
          className="h-full gap-1 px-1.5 text-xs sm:gap-1.5 sm:px-3 sm:text-sm cursor-pointer"
        >
          <Sliders
            className="size-3.5 sm:size-4 shrink-0"
            aria-hidden="true"
          />
          <span className="truncate">Penilaian</span>
        </TabsTrigger>
        <TabsTrigger
          value="tampilan"
          className="h-full gap-1 px-1.5 text-xs sm:gap-1.5 sm:px-3 sm:text-sm cursor-pointer"
        >
          <Palette
            className="size-3.5 sm:size-4 shrink-0"
            aria-hidden="true"
          />
          <span className="truncate">Tampilan</span>
        </TabsTrigger>
        <TabsTrigger
          value="akun"
          className="h-full gap-1 px-1.5 text-xs sm:gap-1.5 sm:px-3 sm:text-sm cursor-pointer"
        >
          <KeyRound
            className="size-3.5 sm:size-4 shrink-0"
            aria-hidden="true"
          />
          <span className="truncate">Akun</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="periode">
        <PeriodTab initialPeriods={initialPeriods} />
      </TabsContent>

      <TabsContent value="penilaian">
        <WeightSettingsForm initialSettings={initialSettings} />
      </TabsContent>

      <TabsContent value="tampilan">
        <AppearanceTab initialSettings={initialSettings} />
      </TabsContent>

      <TabsContent value="akun">
        <AccountTab userEmail={userEmail} profile={profile} />
      </TabsContent>
    </Tabs>
  )
}
