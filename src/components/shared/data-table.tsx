"use client"

import * as React from "react"
import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type PaginationState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    text: sortFn_text,
    datetime: sortFn_datetime,
  },
})

export type DataTableFeatures = typeof dataTableFeatures

export interface DataTableColumnMeta {
  sticky?: boolean
  headerClassName?: string
  cellClassName?: string
}

export interface DataTableProps<TData extends RowData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<DataTableFeatures, TData, any>[]
  data: TData[]
  searchPlaceholder?: string
  emptyMessage?: string
  defaultPageSize?: number
  toolbarActions?: React.ReactNode
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  searchPlaceholder = "Cari nama atau NISN...",
  emptyMessage = "Tidak ada data yang ditemukan.",
  defaultPageSize = 10,
  toolbarActions,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    globalFilterFn: filterFn_includesString,
    state: {
      globalFilter,
      sorting,
      pagination,
    },
    onGlobalFilterChange: (updater) => {
      setGlobalFilter((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      )
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  })

  const filteredRowCount = table.getFilteredRowModel().rows.length
  const pageCount = Math.max(1, table.getPageCount())
  const currentRows = table.getRowModel().rows

  const startRow =
    filteredRowCount === 0
      ? 0
      : pagination.pageIndex * pagination.pageSize + 1
  const endRow = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    filteredRowCount,
  )

  return (
    <div className="space-y-4">
      {/* Toolbar Pencarian & Aksi */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value)
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-8 pr-8"
          />
          {globalFilter && (
            <button
              type="button"
              onClick={() => {
                setGlobalFilter("")
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
              aria-label="Bersihkan pencarian"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {toolbarActions && (
          <div className="flex flex-wrap items-center gap-2">
            {toolbarActions}
          </div>
        )}
      </div>

      {/* Tabel Data */}
      <div className="overflow-x-auto rounded-md border border-border/80 bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as
                    | DataTableColumnMeta
                    | undefined
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        meta?.sticky &&
                          "sticky left-0 z-10 bg-card shadow-[1px_0_0_0_var(--border)]",
                        meta?.headerClassName,
                      )}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary cursor-pointer"
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUp
                              className="h-3.5 w-3.5 text-primary"
                              aria-label="Urut naik"
                            />
                          ) : sorted === "desc" ? (
                            <ArrowDown
                              className="h-3.5 w-3.5 text-primary"
                              aria-label="Urut turun"
                            />
                          ) : (
                            <ArrowUpDown
                              className="h-3.5 w-3.5 text-muted-foreground/70"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {currentRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              currentRows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | DataTableColumnMeta
                      | undefined
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          meta?.sticky &&
                            "sticky left-0 z-10 bg-card shadow-[1px_0_0_0_var(--border)]",
                          meta?.cellClassName,
                        )}
                      >
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Baris Paginasi */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
        <div>
          Menampilkan <strong className="text-foreground">{startRow}</strong>–
          <strong className="text-foreground">{endRow}</strong> dari{" "}
          <strong className="text-foreground">{filteredRowCount}</strong> siswa
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Baris per halaman:</span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(val) =>
                setPagination({ pageIndex: 0, pageSize: Number(val) })
              }
            >
              <SelectTrigger
                size="sm"
                aria-label="Jumlah baris per halaman"
                className="h-7 w-16 text-xs cursor-pointer"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem
                    key={size}
                    value={String(size)}
                    className="text-xs cursor-pointer"
                  >
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span>
              Halaman{" "}
              <strong className="text-foreground">
                {pagination.pageIndex + 1}
              </strong>{" "}
              dari <strong className="text-foreground">{pageCount}</strong>
            </span>

            <div className="inline-flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                aria-label="Halaman sebelumnya"
                className="cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                aria-label="Halaman berikutnya"
                className="cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
