export const SIDEBAR_STORAGE_KEY = "sidebar_state"
export const KELAS_LIST = [1, 2, 3, 4, 5, 6] as const

/**
 * Pure helper to parse the server-side `sidebar_state` cookie value.
 * Safe to call from both Server Components and Client Components.
 * Defaults to `true` (expanded) when cookie is not yet set.
 */
export function parseSidebarCookie(cookieValue?: string): boolean {
  if (cookieValue === "false") return false
  if (cookieValue === "true") return true
  return true
}

export interface BreadcrumbEntry {
  label: string
  href: string
  isCurrent: boolean
}

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  kelas: "Kelola Kelas",
  nilai: "Nilai Siswa",
  pengaturan: "Pengaturan",
}

/**
 * Pure helper to build Indonesian breadcrumb items from a Next.js pathname.
 */
export function getBreadcrumbItems(pathname: string): BreadcrumbEntry[] {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) {
    return [{ label: "Dashboard", href: "/dashboard", isCurrent: true }]
  }

  return segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const isCurrent = index === segments.length - 1
    const prevSegment = index > 0 ? segments[index - 1] : null

    let label = SEGMENT_LABELS[segment] ?? segment
    if (prevSegment === "kelas" && /^[1-6]$/.test(segment)) {
      label = `Kelas ${segment}`
    }

    return {
      label,
      href,
      isCurrent,
    }
  })
}
