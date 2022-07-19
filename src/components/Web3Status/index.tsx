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
  // const { account, connector, chainId, ENSName } = useWeb3React()
  // const connectionType = getConnection(connector).type
  // const chainAllowed = chainId && isChainAllowed(connector, chainId)

  const [open, setOpen] = React.useState(false)

  const handleClickOpen = () => {
    setOpen(true)
  };

  const handleClose = () => {
    setOpen(false)
  };

  return (
    <>
      <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { handleClickOpen }>
        Select Wallet
      </Fab>
      <WalletDialog 
        open={open}
        onClose={handleClose}
      />
    </>
  )

  // if (!chainId) {
  //   return null
  // } else if (!chainAllowed) {
  //   return (
  //     <>
  //       <Fab variant="extended" size="medium" color="primary" aria-label="edit" onClick = { toggleWalletModal }>
  //         <Trans>Wrong Network</Trans>
  //       </Fab>
  //       <WalletDialog 
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
  //         open={open}
  //       />
  //     </>
  //   )
  // }


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