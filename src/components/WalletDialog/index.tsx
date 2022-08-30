import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import { useWeb3React } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { getConnection, getIsInjected, getIsMetaMask } from 'connection/utils'
import { useCallback, useEffect, useState } from 'react'
import { updateConnectionError } from 'state/connection/reducer'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import { isMobile } from 'utils/userAgent'

import AccountDetails from '../AccountDetails'
import { InjectedOption, InstallMetaMaskOption, MetaMaskOption } from './InjectedOption'
import PendingView from './PendingView'

const WALLET_VIEWS = {
  OPTIONS: 'options',
  ACCOUNT: 'account',
  PENDING: 'pending',
}

const tokens = ['ETH', 'WBTC', 'DAI', 'USDC']

export default function WalletDialog({
  open,
  onClose,
  ENSName,
}: {
  open: boolean
  onClose: () => void
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

  useEffect(() => {
    if (open) {
      setWalletView(account ? WALLET_VIEWS.ACCOUNT : WALLET_VIEWS.OPTIONS)
    }
  }, [open, setWalletView, account])

  const handleClose = () => {
    onClose()
  }

  const handleListItemClick = (value: string) => {
    onClose()
  }

  const openOptions = useCallback(() => {
    setWalletView(WALLET_VIEWS.OPTIONS)
  }, [setWalletView])

  const tryActivation = useCallback(
    async (connector: Connector) => {
      const connectionType = getConnection(connector).type

      try {
        setPendingConnector(connector)
        setWalletView(WALLET_VIEWS.PENDING)
        dispatch(updateConnectionError({ connectionType, error: undefined }))

        await connector.activate()

        dispatch(updateSelectedWallet({ wallet: connectionType }))
      } catch (error: any) {
        console.debug(`web3-react connection error: ${error}`)
        dispatch(updateConnectionError({ connectionType, error: error.message }))
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

    return <>{injectedOption}</>
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
          <AccountDetails ENSName={ENSName} openOptions={openOptions} />
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
  )
}
