'use client';

import { Skeleton } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'

export type SkeletonColumn = {
  label: string
  align?: 'left' | 'right' | 'center'
  width?: number
}

type DataTableSkeletonProps = {
  columns: SkeletonColumn[]
  rowCount?: number
}

export function DataTableSkeleton({
  columns,
  rowCount = 8,
}: DataTableSkeletonProps) {
  const gridColumns: GridColDef[] = columns.map((col, index) => ({
    field: `col${index}`,
    headerName: col.label,
    headerAlign: col.align ?? 'left',
    align: col.align ?? 'left',
    width: col.width,
    flex: col.width ? undefined : 1,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    renderCell: () => <Skeleton width={col.width ?? '80%'} />,
  }))

  const rows = Array.from({ length: rowCount }, (_, id) => ({ id }))

  return (
    <div style={{ height: rowCount * 40 + 56, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={gridColumns}
        hideFooter
        disableRowSelectionOnClick
        density="compact"
        columnHeaderHeight={32}
        rowHeight={40}
      />
    </div>
  )
}

export default DataTableSkeleton


