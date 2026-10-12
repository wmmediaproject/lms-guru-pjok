import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from("settings").select("id").limit(1)

    if (error) {
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    return NextResponse.json(
      { ok: true, waktu: new Date().toISOString() },
      { status: 200 },
    )
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
