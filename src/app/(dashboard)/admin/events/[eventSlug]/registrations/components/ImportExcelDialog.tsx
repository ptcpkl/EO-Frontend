'use client'

import { useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'

type Props = {
  open: boolean
  onClose: () => void
}

const ImportExcelDialog = ({ open, onClose }: Props) => {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) return

    setFile(selectedFile)
  }

  const handleClose = () => {
    setFile(null)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth='sm'
    >
      <DialogTitle>
        Import Internal Participants
      </DialogTitle>

      <DialogContent>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ mb: 4 }}
        >
          Upload the employee Excel file provided by the
          authorized company representative.
        </Typography>

        <Alert
          severity='info'
          sx={{ mb: 4 }}
        >
          All required columns and rows must follow the
          event import template.
        </Alert>

        <Box
          sx={{
            border: theme =>
              `1px dashed ${theme.palette.divider}`,
            p: 6,
            textAlign: 'center',
            cursor: 'pointer'
          }}
          onClick={() =>
            document.getElementById(
              'registration-excel-input'
            )?.click()
          }
        >
          <i className='tabler-file-spreadsheet text-4xl' />

          <Typography
            variant='h6'
            sx={{ mt: 2 }}
          >
            {file ? file.name : 'Choose Excel file'}
          </Typography>

          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ mt: 1 }}
          >
            .xlsx or .xls
          </Typography>

          <input
            id='registration-excel-input'
            type='file'
            hidden
            accept='.xlsx,.xls'
            onChange={handleFileChange}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleClose}
          color='secondary'
        >
          Cancel
        </Button>

        <Button
          variant='contained'
          disabled={!file}
          onClick={() => {
            // Backend/import processing will be implemented
            // after the frontend flow is finalized.
          }}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ImportExcelDialog
