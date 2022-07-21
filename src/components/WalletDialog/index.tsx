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
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { ConnectionType } from 'connection'
import { getConnection, getIsInjected, getIsMetaMask } from 'connection/utils'
import { useCallback, useEffect, useState } from 'react'
import { InjectedOption, InstallMetaMaskOption, MetaMaskOption } from './InjectedOption'
import { isMobile } from 'utils/userAgent'
import Typography from '@mui/material/Typography';
import AccountDetails from '../AccountDetails'
import { updateConnectionError } from 'state/connection/reducer'
import { updateSelectedWallet } from 'state/user/reducer'
import PendingView from './PendingView'


const WALLET_VIEWS = {
  OPTIONS: 'options',
  ACCOUNT: 'account',
  PENDING: 'pending',
}

const tokens = ['ETH', 'WBTC', 'DAI', 'USDC'];

export default function WalletDialog({
  open,
  onClose,
  ENSName,
} : { 
  open: boolean;
  onClose: () => void;
  ENSName?: string | undefined
}) {

  const dispatch = useAppDispatch()
  const { account } = useWeb3React()
  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)

  const [pendingConnector, setPendingConnector] = useState<Connector | undefined>()
  const pendingError = useAppSelector((state) =>
    pendingConnector ? state.connection.errorByConnectionType[getConnection(pendingConnector).type] : undefined
  )

  useEffect(() => {
    if (pendingConnector && walletView !== WALLET_VIEWS.PENDING) {
      updateConnectionError({ connectionType: getConnection(pendingConnector).type, error: undefined })
      setPendingConnector(undefined)
    }
  }, [pendingConnector, walletView])

  const handleClose = () => {
    onClose();
  };

  const handleListItemClick = (value: string) => {
    onClose();
  };

  const openOptions = useCallback(() => {
    setWalletView(WALLET_VIEWS.OPTIONS)
  }, [setWalletView])


  useEffect(() => {
    if (open) {
      setWalletView(account ? WALLET_VIEWS.ACCOUNT : WALLET_VIEWS.OPTIONS)
    }
  }, [open, setWalletView, account])


  const tryActivation = useCallback(
    async (connector: Connector) => {
      const connectionType = getConnection(connector).type

      try {
        setPendingConnector(connector)
        setWalletView(WALLET_VIEWS.PENDING)
        dispatch(updateConnectionError({ connectionType, error: undefined }))

        await connector.activate()
        
        dispatch(updateSelectedWallet({ wallet: connectionType }))
      } catch (error) {
        console.debug(`web3-react connection error: ${error}`)
        if (error instanceof Error) {
          dispatch(updateConnectionError({ connectionType, error: error.message }))
        } else {
          dispatch(updateConnectionError({ connectionType, error: undefined }))
        }
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


  // return (
  //   <Dialog onClose={handleClose} open={open}>
  //     {getModalContent()}
  //   </Dialog>
  // );


  return (
    <Dialog onClose={handleClose} open={open}>
      {walletView === WALLET_VIEWS.ACCOUNT ? (
        <>
          <DialogTitle>Account</DialogTitle>
          <AccountDetails 
            ENSName={ENSName}
          />
        </>
      ) : walletView === WALLET_VIEWS.PENDING && pendingConnector ? (
        <>
          <PendingView
            openOptions={openOptions}
            connector={pendingConnector}
            error={!!pendingError}
            tryActivation={tryActivation}
          />
        </>
      ) : (
        <>
          <DialogTitle>Select a wallet</DialogTitle>
          {getOptions()}
        </>
      )}
    </Dialog>
  );

}