import * as React from 'react';
import { useWeb3React } from '@web3-react/core'
import { getConnection } from 'connection/utils'
import { useAppSelector } from 'state/hooks'
import { isChainAllowed } from 'utils/switchChain'

import { shortenAddress } from 'utils'
import WalletDialog from '../WalletDialog'
import Fab from '@mui/material/Fab';
import { Trans } from '@lingui/macro'
import Typography from '@mui/material/Typography';



export default function Web3Status() {
  const { account, connector, chainId, ENSName } = useWeb3React()
  const chainAllowed =  isChainAllowed(connector)
  const error = useAppSelector((state) => state.connection.errorByConnectionType[getConnection(connector).type])

  const [open, setOpen] = React.useState(false)

  const handleClickOpen = () => {
    setOpen(true)
  };

  const handleClose = () => {
    setOpen(false)
  };


  function Web3StatusInner() {
    if (!chainId) {
      return (
      <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { handleClickOpen }>
        <Typography>No ChainId</Typography>
      </Fab>
      )
    } else if (!chainAllowed) {
      return (
        <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { handleClickOpen }>
          <Typography>Wrong Network</Typography>
        </Fab>
      )
    } else if (error) {
      return (
        <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { handleClickOpen }>
          <Trans>Error</Trans>
        </Fab>
      )
    } else if (account) {
      return (
        <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { handleClickOpen }>
          <Typography>{ENSName || shortenAddress(account)}</Typography>
        </Fab>
      )
    } else {
      return (
        <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { handleClickOpen }>
          <Typography>Connect Wallet</Typography>
        </Fab>
      )
    }
  }

  return (
    <>
      <Web3StatusInner />
      <WalletDialog 
        open={open}
        onClose={handleClose}
        ENSName={ENSName ?? undefined}
      />    
    </>
  )
}