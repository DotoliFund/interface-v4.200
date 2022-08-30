import { ConnectionType } from 'connection'
import { getConnection } from 'connection/utils'
import { useMemo } from 'react'
import { BACKFILLABLE_WALLETS } from 'state/connection/constants'
import { useAppSelector } from 'state/hooks'

const SELECTABLE_WALLETS = [...BACKFILLABLE_WALLETS]

export default function useOrderedConnections() {
  const selectedWallet = useAppSelector((state) => state.user.selectedWallet)
  return useMemo(() => {
    const orderedConnectionTypes: ConnectionType[] = []

    // Add the `selectedWallet` to the top so it's prioritized, then add the other selectable wallets.
    if (selectedWallet) {
      orderedConnectionTypes.push(selectedWallet)
    }
    orderedConnectionTypes.push(...SELECTABLE_WALLETS.filter((wallet) => wallet !== selectedWallet))

    return orderedConnectionTypes.map(getConnection)
  }, [selectedWallet])
}
