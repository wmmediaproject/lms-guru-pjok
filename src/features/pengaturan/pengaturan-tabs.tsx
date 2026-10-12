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
      <TabsList className="flex w-full sm:w-auto flex-wrap h-auto gap-1 p-1">
        <TabsTrigger value="periode" className="gap-1.5 cursor-pointer">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          <span>Periode</span>
        </TabsTrigger>
        <TabsTrigger value="penilaian" className="gap-1.5 cursor-pointer">
          <Sliders className="h-4 w-4" aria-hidden="true" />
          <span>Penilaian</span>
        </TabsTrigger>
        <TabsTrigger value="tampilan" className="gap-1.5 cursor-pointer">
          <Palette className="h-4 w-4" aria-hidden="true" />
          <span>Tampilan</span>
        </TabsTrigger>
        <TabsTrigger value="akun" className="gap-1.5 cursor-pointer">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          <span>Akun</span>
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
