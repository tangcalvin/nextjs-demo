'use client';

import { PropsWithChildren } from 'react'
import { Backdrop, Box, Typography } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'

type LoadingBackdropProps = {
  open: boolean
  text?: string
}

export function LoadingBackdrop({
  open,
  text = 'Loading…',
}: PropsWithChildren<LoadingBackdropProps>) {
  return (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={open}
    >
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CircularProgress color="inherit" />
        <Typography variant="subtitle1">{text}</Typography>
      </Box>
    </Backdrop>
  )
}

export default LoadingBackdrop


