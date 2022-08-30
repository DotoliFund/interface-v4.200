import { Trans } from '@lingui/macro'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import PersonIcon from '@mui/icons-material/Person'
import Avatar from '@mui/material/Avatar'
import { blue } from '@mui/material/colors'
import Fab from '@mui/material/Fab'
import Typography from '@mui/material/Typography'
import * as React from 'react'

import CurrencySelectDialog from './CurrencySelectDialog'

interface CurrencySelectButtonProps {
  onCurrencySelect: (currency: string) => void
  currency: string
  locked?: boolean
  loading?: boolean
}

export default function CurrencySelectButton({
  onCurrencySelect,
  currency,
  locked = false,
  loading = false,
}: CurrencySelectButtonProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState('ETH')

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleClose = (value: string) => {
    setOpen(false)
    setSelectedValue(value)
    onCurrencySelect(value)
  }

  return (
    <div>
      <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick={handleClickOpen}>
        <Avatar sx={{ bgcolor: blue[100], color: blue[600], width: 24, height: 24 }}>
          <PersonIcon />
        </Avatar>
        <Typography variant="body1" display="block" gutterBottom sx={{ ml: 1, mt: 1, mr: 0.5 }}>
          {currency ? currency : <Trans>Select a token</Trans>}
        </Typography>
        <KeyboardArrowDownIcon />
      </Fab>
      <CurrencySelectDialog selectedCurrency={currency} open={open} onClose={handleClose} />
    </div>
  )
}
