import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { PageTransition } from "./page-transition"

describe("PageTransition Component", () => {
  it("merender children dengan benar", () => {
    render(
      <PageTransition>
        <div data-testid="test-content">Konten Halaman</div>
      </PageTransition>
    )

    expect(screen.getByTestId("test-content")).toBeDefined()
    expect(screen.getByText("Konten Halaman")).toBeDefined()
  })

  it("menerapkan className kustom ke kontainer wrapper", () => {
    const { container } = render(
      <PageTransition className="custom-class-123">
        <span>Halo</span>
      </PageTransition>
    )

    expect(container.firstChild).toHaveProperty("className")
    expect((container.firstChild as HTMLElement).className).toContain("custom-class-123")
  })
})
