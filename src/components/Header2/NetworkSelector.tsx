import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import PersonIcon from '@mui/icons-material/Person'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import { blue } from '@mui/material/colors'
import Fab from '@mui/material/Fab'
import Popover from '@mui/material/Popover'
import Typography from '@mui/material/Typography'
import * as React from 'react'

export default function NetworkSelector() {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined

  return (
    <div>
      <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick={handleClick}>
        <Avatar sx={{ bgcolor: blue[100], color: blue[600], width: 24, height: 24, mr: 1 }}>
          <PersonIcon />
        </Avatar>
        <Typography sx={{ mr: 0.5 }}>ethereum</Typography>
        <KeyboardArrowDownIcon />
      </Fab>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Typography sx={{ m: 1.5 }}>Select a Network</Typography>
        <Typography sx={{ m: 1.5 }}>Ethereum</Typography>
        <Typography sx={{ m: 1.5 }}>Albirtum</Typography>
        <Button variant="contained">button</Button>
      </Popover>
    </div>
  )
}
