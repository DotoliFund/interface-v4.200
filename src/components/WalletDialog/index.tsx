import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import { blue } from '@mui/material/colors';
import { useAppDispatch } from 'state/hooks'
import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { ConnectionType } from 'connection'
import { getConnection, getIsInjected, getIsMetaMask } from 'connection/utils'
import { useCallback, useEffect, useState } from 'react'
import { InjectedOption, InstallMetaMaskOption, MetaMaskOption } from './InjectedOption'
import { isMobile } from 'utils/userAgent'
import Typography from '@mui/material/Typography';


const WALLET_VIEWS = {
  OPTIONS: 'options',
  ACCOUNT: 'account',
  PENDING: 'pending',
}

const tokens = ['ETH', 'WBTC', 'DAI', 'USDC'];

export default function WalletDialog({
  open,
  onClose
} : { 
  open: boolean;
  onClose: () => void;
}) {

  const dispatch = useAppDispatch()
  const { account } = useWeb3React()
  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)


  const handleClose = () => {
    onClose();
  };

  const handleListItemClick = (value: string) => {
    onClose();
  };

  const openOptions = useCallback(() => {
    setWalletView(WALLET_VIEWS.OPTIONS)
  }, [setWalletView])

  // useEffect(() => {
  //   if (walletModalOpen) {
  //     setWalletView(account ? WALLET_VIEWS.ACCOUNT : WALLET_VIEWS.OPTIONS)
  //   }
  // }, [walletModalOpen, setWalletView, account])


  const tryActivation = useCallback(
    async (connector: Connector) => {
      const connectionType = getConnection(connector).type

      try {
        await connector.activate()
        //dispatch(updateSelectedWallet({ wallet: connectionType }))
      } catch (error) {
        console.debug(`web3-react connection error: ${error}`)
      }
    },
    [dispatch]
  )

  function getOptions() {
    const isInjected = getIsInjected()
    const isMetaMask = getIsMetaMask()

    const isMetaMaskBrowser = isMobile && isMetaMask
    const isInjectedMobileBrowser = isMetaMaskBrowser

    let injectedOption
    if (!isInjected) {
      if (!isMobile) {
        injectedOption = <InstallMetaMaskOption />
      }
    } else {
      if (isMetaMask) {
        injectedOption = <MetaMaskOption tryActivation={tryActivation} />
      } else {
        injectedOption = <InjectedOption tryActivation={tryActivation} />
      }
    }

    return (
      <>
        {injectedOption}
      </>
    )
  }

  function getModalContent() {
    return (
      <>
        <Typography>Connect a wallet</Typography>
        {walletView !== WALLET_VIEWS.PENDING && <>{getOptions()}</>}
      </>
    )
  }


  // return (
  //   <Dialog onClose={handleClose} open={open}>
  //     <DialogTitle>Select a token</DialogTitle>
  //     <List sx={{ pt: 0 }}>
  //       {tokens.map((token) => (
  //         <ListItem button onClick={() => handleListItemClick(token)} key={token}>
  //           <ListItemAvatar>
  //             <Avatar sx={{ bgcolor: blue[100], color: blue[600] }}>
  //               <PersonIcon />
  //             </Avatar>
  //           </ListItemAvatar>
  //           <ListItemText primary={token} />
  //         </ListItem>
  //       ))}
  //     </List>
  //   </Dialog>
  // );


  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Select a token</DialogTitle>
      {getModalContent()}
    </Dialog>
  );




  // return (
  //   <Modal isOpen={walletModalOpen} onDismiss={toggleWalletModal} minHeight={false} maxHeight={90}>
  //     <>{getModalContent()}</>
  //   </Modal>
  // )
}