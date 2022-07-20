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


  if (!chainId) {
    return (
      <>
        <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { handleClickOpen }>
          <Typography>No ChainId</Typography>
        </Fab>
        <WalletDialog 
          open={open}
          onClose={handleClose}
        />
      </>
    )
  } else if (!chainAllowed) {
    return (
      <>
        <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { handleClickOpen }>
          <Typography>Wrong Network</Typography>
        </Fab>
        <WalletDialog 
          open={open}
          onClose={handleClose}
        />
      </>
    )
  } else if (error) {
    return (
      <>
        <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { handleClickOpen }>
          <Trans>Error</Trans>
        </Fab>
        <WalletDialog 
          open={open}
          onClose={handleClose}
        />
      </>
    )
  } else if (account) {
    return (
      <>
        <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { handleClickOpen }>
          <Typography>{ENSName || shortenAddress(account)}</Typography>
        </Fab>
        <WalletDialog 
          open={open}
          onClose={handleClose}
        />
      </>
    )
  } else {
    return (
      <>
        <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { handleClickOpen }>
          <Typography>Connect Wallet</Typography>
        </Fab>
        <WalletDialog 
          open={open}
          onClose={handleClose}
        />
      </>
    )
  }


  // if (!chainId) {
  //   return null
  // } else if (!chainAllowed) {
  //   return (
  //     <>
  //       <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { toggleWalletModal }>
  //         <Trans>Wrong Network</Trans>
  //       </Fab>
  //       <WalletDialog 
  //         ENSName={ENSName ?? undefined}
  //         open={open}
  //       />
  //     </>
  //   )
  // } else if (error) {
  //   return (
  //     <>
  //       <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { toggleWalletModal }>
  //         <Trans>Error</Trans>
  //       </Fab>
  //       <WalletDialog 
  //         ENSName={ENSName ?? undefined}
  //         open={open}
  //       />
  //     </>
  //   )
  // } else if (account) {
  //   return (
  //     <>
  //       <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { toggleWalletModal }>
  //         <Trans>{ENSName || shortenAddress(account)}</Trans>
  //       </Fab>
  //       <WalletDialog 
  //         ENSName={ENSName ?? undefined}
  //         open={open}
  //       />
  //     </>
  //   )
  // } else {
  //   return (
  //     <>
  //       <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { toggleWalletModal }>
  //         <Trans>Connect Wallet</Trans>
  //       </Fab>
  //       <WalletDialog 
  //         ENSName={ENSName ?? undefined}
  //         open={open}
  //       />
  //     </>
  //   )
  // }
}