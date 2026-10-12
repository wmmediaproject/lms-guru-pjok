import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

const mockLimit = vi.fn()
const mockSelect = vi.fn(() => ({ limit: mockLimit }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}))

describe("GET /api/keep-alive — Supabase Keep-Alive Cron Endpoint", () => {
  const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = "test-cron-secret-12345"
  })

  afterEach(() => {
    if (ORIGINAL_CRON_SECRET === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = ORIGINAL_CRON_SECRET
    }
  })

  it("menolak permintaan tanpa header Authorization atau dengan token salah dengan status 401", async () => {
    const { GET } = await import("./route")

    // 1. Tanpa header Authorization
    const reqNoHeader = new NextRequest("http://localhost:3000/api/keep-alive")
    const resNoHeader = await GET(reqNoHeader)
    expect(resNoHeader.status).toBe(401)
    expect(await resNoHeader.json()).toEqual({ ok: false })
    expect(mockFrom).not.toHaveBeenCalled()

    // 2. Header Authorization salah
    const reqWrongToken = new NextRequest(
      "http://localhost:3000/api/keep-alive",
      {
        headers: { authorization: "Bearer salah-token" },
      },
    )
    const resWrongToken = await GET(reqWrongToken)
    expect(resWrongToken.status).toBe(401)
    expect(await resWrongToken.json()).toEqual({ ok: false })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it("mengembalikan 200 dengan { ok: true, waktu } saat header benar dan query ringan ke tabel settings sukses", async () => {
    mockLimit.mockResolvedValueOnce({ data: [], error: null })

    const { GET, dynamic } = await import("./route")
    expect(dynamic).toBe("force-dynamic")

    const req = new NextRequest("http://localhost:3000/api/keep-alive", {
      headers: {
        authorization: "Bearer test-cron-secret-12345",
      },
    })

    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = (await res.json()) as { ok: boolean; waktu: string }
    expect(body.ok).toBe(true)
    expect(typeof body.waktu).toBe("string")
    expect(Number.isNaN(Date.parse(body.waktu))).toBe(false)

    expect(mockFrom).toHaveBeenCalledWith("settings")
    expect(mockSelect).toHaveBeenCalledWith("id")
    expect(mockLimit).toHaveBeenCalledWith(1)
  })

  it("mengembalikan 500 dengan { ok: false } tanpa membocorkan detail error saat query Supabase gagal", async () => {
    mockLimit.mockResolvedValueOnce({
      data: null,
      error: {
        code: "08006",
        message: "connection to database failed: secret internal detail",
      },
    })

    const { GET } = await import("./route")

    const req = new NextRequest("http://localhost:3000/api/keep-alive", {
      headers: {
        authorization: "Bearer test-cron-secret-12345",
      },
    })

    const res = await GET(req)
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body).toEqual({ ok: false })
    expect(JSON.stringify(body)).not.toContain("secret internal detail")
  })

  it("memastikan proxy.ts tidak mengalihkan atau memblokir /api/keep-alive", async () => {
    const { proxy, config } = await import("@/proxy")

    const req = new NextRequest("http://localhost:3000/api/keep-alive")
    const res = await proxy(req)

    expect(res.status).toBe(200)
    expect(res.headers.get("location")).toBeNull()
    expect(config.matcher[0]).toContain("api/keep-alive")
  })
})
