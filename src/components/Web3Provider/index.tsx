import { useWeb3React, Web3ReactHooks, Web3ReactProvider } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { Connection } from 'connection'
import { getConnectionName } from 'connection/utils'
import { getConnection } from 'connection/utils'
import useEagerlyConnect from 'hooks/useEagerlyConnect'
import useOrderedConnections from 'hooks/useOrderedConnections'
import usePrevious from 'hooks/usePrevious'
import { ReactNode, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useConnectedWallets } from 'state/wallets/hooks'
import { Wallet } from 'state/wallets/types'

export default function Web3Provider({ children }: { children: ReactNode }) {
  useEagerlyConnect()
  const connections = useOrderedConnections()
  const connectors: [Connector, Web3ReactHooks][] = connections.map(({ hooks, connector }) => [connector, hooks])

  const key = useMemo(() => connections.map(({ type }: Connection) => getConnectionName(type)).join('-'), [connections])

  return (
    <Web3ReactProvider connectors={connectors} key={key}>
      <Updater />
      {children}
    </Web3ReactProvider>
  )
}

/** A component to run hooks under the Web3ReactProvider context. */
function Updater() {
  const { account, chainId, connector, provider } = useWeb3React()
  const { pathname } = useLocation()

  // // Trace RPC calls (for debugging).
  // const networkProvider = isSupportedChain(chainId) ? RPC_PROVIDERS[chainId] : undefined
  // const shouldTrace = useTraceJsonRpcFlag() === TraceJsonRpcVariant.Enabled
  // useEffect(() => {
  //   if (shouldTrace) {
  //     provider?.on('debug', trace)
  //     if (provider !== networkProvider) {
  //       networkProvider?.on('debug', trace)
  //     }
  //   }
  //   return () => {
  //     provider?.off('debug', trace)
  //     networkProvider?.off('debug', trace)
  //   }
  // }, [networkProvider, provider, shouldTrace])

  // Send analytics events when the active account changes.
  const previousAccount = usePrevious(account)
  const [connectedWallets, addConnectedWallet] = useConnectedWallets()
  useEffect(() => {
    if (account && account !== previousAccount) {
      const walletType = getConnection(connector).type
      const wallet: Wallet = { walletType, account }
      addConnectedWallet(wallet)
    }
  }, [account, addConnectedWallet, chainId, connectedWallets, connector, previousAccount, provider])

  return null
}
