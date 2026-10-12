import http from "node:http"
import crypto from "node:crypto"
import { URL } from "node:url"

const PORT = Number(process.env.MOCK_SUPABASE_PORT || 54329)

const ADMIN_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "guru@sekolah.sch.id",
  email_confirmed_at: "2026-07-01T00:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {
    nama_lengkap: "Budi Santoso, S.Pd.",
    nip: "198501012010011001",
  },
  created_at: "2026-07-01T00:00:00Z",
  updated_at: "2026-07-01T00:00:00Z",
}

function createInitialDb() {
  return {
    profiles: [
      {
        id: ADMIN_USER.id,
        role: "admin",
        created_at: "2026-07-01T00:00:00Z",
      },
    ],
    periods: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        tahun_mulai: 2026,
        semester: "ganjil",
        nama: "Semester Ganjil 2026-2027",
        is_active: true,
        created_at: "2026-07-01T00:00:00Z",
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        tahun_mulai: 2026,
        semester: "genap",
        nama: "Semester Genap 2026-2027",
        is_active: false,
        created_at: "2026-07-02T00:00:00Z",
      },
    ],
    settings: [
      {
        id: "33333333-3333-4333-8333-333333333333",
        nama_sekolah: "SDN 1 Nusantara",
        kkm: 75,
        bobot_praktek: 25,
        bobot_uh: 25,
        bobot_asts: 25,
        bobot_asas: 25,
        last_promoted_at: null,
        updated_at: "2026-07-01T00:00:00Z",
      },
    ],
    students: [
      {
        id: "66666666-6666-4666-8666-666666666666",
        nisn: "0066666666",
        nama: "Raka Kelas Enam",
        kelas: 6,
        jenis_kelamin: "L",
        status: "aktif",
        created_at: "2026-07-01T00:00:00Z",
        updated_at: "2026-07-01T00:00:00Z",
      },
    ],
    grades: [],
  }
}

let db = createInitialDb()

function computeGradeFields(row, settings) {
  const p = row.nilai_praktek ?? null
  const u = row.nilai_uh ?? null
  const s = row.nilai_asts ?? null
  const a = row.nilai_asas ?? null

  if (p === null || u === null || s === null || a === null) {
    return {
      ...row,
      nilai_akhir: null,
      predikat: null,
    }
  }

  const bp = Number(settings.bobot_praktek ?? 25)
  const bu = Number(settings.bobot_uh ?? 25)
  const bs = Number(settings.bobot_asts ?? 25)
  const ba = Number(settings.bobot_asas ?? 25)
  const kkm = Number(settings.kkm ?? 75)

  const raw =
    (Number(p) * bp + Number(u) * bu + Number(s) * bs + Number(a) * ba) / 100
  const nilai_akhir = Math.round(raw * 100) / 100
  const predikat = nilai_akhir >= kkm ? "Tuntas" : "Belum Tuntas"

  return {
    ...row,
    nilai_akhir,
    predikat,
  }
}

function recalculateAllGrades() {
  const s = db.settings[0]
  db.grades = db.grades.map((g) => computeGradeFields(g, s))
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = ""
    req.on("data", (chunk) => {
      data += chunk
    })
    req.on("end", () => {
      if (!data) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(data))
      } catch {
        resolve({})
      }
    })
  })
}

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = payload === undefined ? "" : JSON.stringify(payload)
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Expose-Headers": "Content-Range",
    ...extraHeaders,
  })
  res.end(body)
}

function applyPostgrestFilters(rows, searchParams) {
  let result = [...rows]
  for (const [key, val] of searchParams.entries()) {
    if (["select", "order", "limit", "offset", "on_conflict"].includes(key)) {
      continue
    }
    if (val.startsWith("eq.")) {
      const target = val.slice(3)
      result = result.filter((r) => String(r[key]) === target)
    } else if (val.startsWith("in.(") && val.endsWith(")")) {
      const inner = val.slice(4, -1)
      const list = inner
        .split(",")
        .map((s) => s.replace(/^"|"$/g, ""))
      result = result.filter((r) => list.includes(String(r[key])))
    }
  }

  const orderParam = searchParams.get("order")
  if (orderParam) {
    const [col, dir] = orderParam.split(".")
    const asc = dir !== "desc"
    result.sort((a, b) => {
      if (a[col] < b[col]) return asc ? -1 : 1
      if (a[col] > b[col]) return asc ? 1 : -1
      return 0
    })
  }

  const limitParam = searchParams.get("limit")
  if (limitParam) {
    result = result.slice(0, Number(limitParam))
  }

  return result
}

function formatPostgrestResponse(res, req, rows, status = 200) {
  const accept = String(req.headers["accept"] || "")
  const prefer = String(req.headers["prefer"] || "")
  const isSingle = accept.includes("application/vnd.pgrst.object+json")
  const isHead = req.method === "HEAD"

  const headers = {
    "Content-Range": `0-${Math.max(0, rows.length - 1)}/${rows.length}`,
  }

  if (isHead) {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "Content-Range",
      ...headers,
    })
    res.end()
    return
  }

  if (isSingle) {
    if (rows.length === 0) {
      if (prefer.includes("return=representation") || accept.includes("object")) {
        sendJson(res, 200, null, headers)
        return
      }
    }
    sendJson(res, status, rows[0] ?? null, headers)
    return
  }

  sendJson(res, status, rows, headers)
}

function makeFakeJwt() {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")
  const exp = Math.floor(Date.now() / 1000) + 3600 * 24
  const payload = Buffer.from(
    JSON.stringify({
      sub: ADMIN_USER.id,
      email: ADMIN_USER.email,
      aud: "authenticated",
      role: "authenticated",
      exp,
    }),
  ).toString("base64url")
  return `${header}.${payload}.signature`
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Expose-Headers": "Content-Range",
    })
    res.end()
    return
  }

  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`)
  const pathname = url.pathname

  // Reset helper for E2E tests
  if (pathname === "/__reset" && req.method === "POST") {
    db = createInitialDb()
    sendJson(res, 200, { reset: true })
    return
  }

  // Auth endpoints
  if (pathname.startsWith("/auth/v1/")) {
    if (pathname === "/auth/v1/token" && req.method === "POST") {
      const body = await parseBody(req)
      if (
        body.email === "guru@sekolah.sch.id" &&
        body.password === "password123"
      ) {
        const token = makeFakeJwt()
        sendJson(res, 200, {
          access_token: token,
          token_type: "bearer",
          expires_in: 86400,
          expires_at: Math.floor(Date.now() / 1000) + 86400,
          refresh_token: "mock-refresh-token",
          user: ADMIN_USER,
        })
        return
      }
      sendJson(res, 400, {
        error: "invalid_grant",
        error_description: "Invalid login credentials",
      })
      return
    }

    if (pathname === "/auth/v1/user" && req.method === "GET") {
      const authHeader = String(req.headers["authorization"] || "")
      if (authHeader.includes(".")) {
        sendJson(res, 200, ADMIN_USER)
        return
      }
      sendJson(res, 401, { message: "Invalid token" })
      return
    }

    if (pathname === "/auth/v1/user" && req.method === "PUT") {
      const body = await parseBody(req)
      if (body.data) {
        ADMIN_USER.user_metadata = {
          ...ADMIN_USER.user_metadata,
          ...body.data,
        }
      }
      sendJson(res, 200, ADMIN_USER)
      return
    }

    if (pathname === "/auth/v1/logout" && req.method === "POST") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
      })
      res.end()
      return
    }
  }

  // RPC endpoints
  if (pathname.startsWith("/rest/v1/rpc/")) {
    const rpcName = pathname.replace("/rest/v1/rpc/", "")
    const body = await parseBody(req)

    if (rpcName === "ensure_admin_profile") {
      sendJson(res, 200, true)
      return
    }

    if (rpcName === "upsert_students_csv") {
      const rows = Array.isArray(body.p_rows) ? body.p_rows : []
      let inserted = 0
      let updated = 0
      for (const item of rows) {
        const idx = db.students.findIndex((s) => s.nisn === item.nisn)
        if (idx >= 0) {
          db.students[idx] = {
            ...db.students[idx],
            nama: item.nama,
            kelas: Number(item.kelas),
            jenis_kelamin: item.jenis_kelamin ?? null,
            updated_at: new Date().toISOString(),
          }
          updated++
        } else {
          db.students.push({
            id: crypto.randomUUID(),
            nisn: String(item.nisn),
            nama: String(item.nama),
            kelas: Number(item.kelas),
            jenis_kelamin: item.jenis_kelamin ?? null,
            status: "aktif",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          inserted++
        }
      }
      sendJson(res, 200, { inserted, updated })
      return
    }

    if (rpcName === "set_active_period") {
      const targetId = body.p_period_id
      db.periods = db.periods.map((p) => ({
        ...p,
        is_active: p.id === targetId,
      }))
      sendJson(res, 200, true)
      return
    }

    if (rpcName === "promote_students_massal") {
      let p12 = 0
      let p23 = 0
      let p34 = 0
      let p45 = 0
      let p56 = 0
      let grad6 = 0

      db.students = db.students.map((s) => {
        if (s.status === "lulus") return s
        if (s.kelas === 6) {
          grad6++
          return { ...s, status: "lulus" }
        }
        if (s.kelas === 5) p56++
        if (s.kelas === 4) p45++
        if (s.kelas === 3) p34++
        if (s.kelas === 2) p23++
        if (s.kelas === 1) p12++
        return { ...s, kelas: s.kelas + 1 }
      })

      const executed_at = new Date().toISOString()
      db.settings[0].last_promoted_at = executed_at

      sendJson(res, 200, {
        promoted_1_to_2: p12,
        promoted_2_to_3: p23,
        promoted_3_to_4: p34,
        promoted_4_to_5: p45,
        promoted_5_to_6: p56,
        graduated_kelas_6: grad6,
        total_affected: p12 + p23 + p34 + p45 + p56 + grad6,
        executed_at,
      })
      return
    }

    if (rpcName === "get_dashboard_summary") {
      // Return empty so fetchDashboardData uses its built-in fallback aggregation
      sendJson(res, 200, [])
      return
    }
  }

  // Table REST endpoints
  if (pathname.startsWith("/rest/v1/")) {
    const table = pathname.replace("/rest/v1/", "")
    if (!db[table]) {
      sendJson(res, 404, { message: `Table ${table} not found` })
      return
    }

    if (req.method === "GET" || req.method === "HEAD") {
      const filtered = applyPostgrestFilters(db[table], url.searchParams)
      formatPostgrestResponse(res, req, filtered, 200)
      return
    }

    if (req.method === "POST") {
      const body = await parseBody(req)
      const items = Array.isArray(body) ? body : [body]
      const onConflict = url.searchParams.get("on_conflict")
      const created = []

      for (const item of items) {
        if (table === "grades" && onConflict === "student_id,period_id") {
          const existingIdx = db.grades.findIndex(
            (g) =>
              g.student_id === item.student_id &&
              g.period_id === item.period_id,
          )
          const baseRow = {
            id:
              existingIdx >= 0
                ? db.grades[existingIdx].id
                : crypto.randomUUID(),
            student_id: item.student_id,
            period_id: item.period_id,
            kelas_saat_nilai: Number(item.kelas_saat_nilai ?? 1),
            nilai_praktek: item.nilai_praktek ?? null,
            nilai_uh: item.nilai_uh ?? null,
            nilai_asts: item.nilai_asts ?? null,
            nilai_asas: item.nilai_asas ?? null,
            keterangan: item.keterangan ?? null,
            updated_at: new Date().toISOString(),
          }
          const computed = computeGradeFields(baseRow, db.settings[0])
          if (existingIdx >= 0) {
            db.grades[existingIdx] = computed
          } else {
            db.grades.push(computed)
          }
          created.push(computed)
        } else if (table === "students" && onConflict === "nisn") {
          const existingIdx = db.students.findIndex((s) => s.nisn === item.nisn)
          if (existingIdx >= 0) {
            db.students[existingIdx] = {
              ...db.students[existingIdx],
              ...item,
              updated_at: new Date().toISOString(),
            }
            created.push(db.students[existingIdx])
          } else {
            const newRow = {
              id: crypto.randomUUID(),
              status: "aktif",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...item,
            }
            db.students.push(newRow)
            created.push(newRow)
          }
        } else if (table === "profiles" && onConflict === "id") {
          const existingIdx = db.profiles.findIndex((p) => p.id === item.id)
          if (existingIdx >= 0) {
            db.profiles[existingIdx] = {
              ...db.profiles[existingIdx],
              ...item,
            }
            created.push(db.profiles[existingIdx])
          } else {
            const newRow = {
              created_at: new Date().toISOString(),
              ...item,
            }
            db.profiles.push(newRow)
            created.push(newRow)
          }
        } else {
          const newRow = {
            id: item.id || crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...item,
          }
          db[table].push(newRow)
          created.push(newRow)
        }
      }

      formatPostgrestResponse(res, req, created, 201)
      return
    }

    if (req.method === "PATCH") {
      const body = await parseBody(req)
      const matched = applyPostgrestFilters(db[table], url.searchParams)
      const matchedIds = new Set(matched.map((r) => r.id))
      const updatedRows = []

      db[table] = db[table].map((row) => {
        if (!matchedIds.has(row.id)) return row
        const next = {
          ...row,
          ...body,
          updated_at: new Date().toISOString(),
        }
        updatedRows.push(next)
        return next
      })

      if (table === "settings") {
        recalculateAllGrades()
      }

      formatPostgrestResponse(res, req, updatedRows, 200)
      return
    }

    if (req.method === "DELETE") {
      const matched = applyPostgrestFilters(db[table], url.searchParams)
      const matchedIds = new Set(matched.map((r) => r.id))
      db[table] = db[table].filter((row) => !matchedIds.has(row.id))
      formatPostgrestResponse(res, req, matched, 200)
      return
    }
  }

  sendJson(res, 404, { error: "Not found" })
})

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Mock Supabase server listening on http://127.0.0.1:${PORT}`)
})
