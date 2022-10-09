import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'

export const INVESTOR_DATA = () => {
  const queryString = `
    query investor {
      investor(id: investor, subgraphError: allow) {
        id
        createdAtTimestamp
        createdAtBlockNumber
        fund
        investor
        principalETH
        principalUSD
        volumeETH
        volumeUSD
        profitETH
        profitUSD
        profitRatioETH
        profitRatioUSD
      }
    }
    `
  return gql(queryString)
}

export const INVESTOR_SNAPSHOTS_BULK = () => {
  const queryString = `
    query investorSnpashots {
      investorSnpashots(fund: fundAddress, investor: account, orderBy: createdAtTimestamp, orderDirection: desc, subgraphError: allow) {
        id
        timestamp: number
        fund: string
        investor: string
        principalETH
        principalUSD
        volumeETH
        volumeUSD
        profitETH
        profitUSD
        profitRatioETH
        profitRatioUSD
      }
    }
    `
  return gql(queryString)
}

export interface InvestorData {
  address: string
  createdAtTimestamp: number
  createdAtBlockNumber: number
  fund: string
  principalETH: number
  principalUSD: number
  volumeETH: number
  volumeUSD: number
  profitETH: number
  profitUSD: number
  profitRatioETH: number
  profitRatioUSD: number
  feeVolumeUSD: number
  feeVolumeETH: number
}

export interface InvestorSnapshotData {
  id: string
  timestamp: number
  fund: string
  investor: string
  principalUSD: number
  principalETH: number
  volumeUSD: number
  volumeETH: number
  profitETH: number
  profitUSD: number
  profitRatioETH: number
  profitRatioUSD: number
  feeVolumeUSD: number
  feeVolumeETH: number
}

interface InvestorDataFields {
  id: string
  createdAtTimestamp: string
  createdAtBlockNumber: string
  fund: string
  principalETH: string
  principalUSD: string
  volumeETH: string
  volumeUSD: string
  profitETH: string
  profitUSD: string
  profitRatioETH: string
  profitRatioUSD: string
  feeVolumeUSD: string
  feeVolumeETH: string
}

interface InvestorSnapshotFields {
  id: string
  timestamp: string
  fund: string
  investor: string
  principalUSD: string
  principalETH: string
  volumeUSD: string
  volumeETH: string
  profitETH: string
  profitUSD: string
  profitRatioETH: string
  profitRatioUSD: string
  feeVolumeUSD: string
  feeVolumeETH: string
}

interface InvestorDataResponse {
  investorData: InvestorDataFields[]
}

interface InvestorSnapshotsResponse {
  investorSnapshots: InvestorSnapshotFields[]
}

/**
 * Fetch InvestorData
 */
export function useInvestorData(): {
  loading: boolean
  error: boolean
  data: InvestorData[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<InvestorDataResponse>(INVESTOR_DATA(), {
    client: dataClient,
  })

  const anyError = Boolean(error)
  const anyLoading = Boolean(loading)

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: [],
    }
  }

  const formatted: InvestorData[] = data
    ? data.investorData.map((value, index) => {
        const investorDataFields = data.investorData[index]
        const investorData: InvestorData = {
          address: investorDataFields.id,
          createdAtTimestamp: parseFloat(investorDataFields.createdAtTimestamp),
          createdAtBlockNumber: parseFloat(investorDataFields.createdAtBlockNumber),
          fund: investorDataFields.fund,
          principalETH: parseFloat(investorDataFields.principalETH),
          principalUSD: parseFloat(investorDataFields.principalUSD),
          volumeETH: parseFloat(investorDataFields.volumeETH),
          volumeUSD: parseFloat(investorDataFields.volumeUSD),
          profitETH: parseFloat(investorDataFields.profitETH),
          profitUSD: parseFloat(investorDataFields.profitUSD),
          profitRatioETH: parseFloat(investorDataFields.profitRatioETH),
          profitRatioUSD: parseFloat(investorDataFields.profitRatioUSD),
          feeVolumeUSD: parseFloat(investorDataFields.feeVolumeUSD),
          feeVolumeETH: parseFloat(investorDataFields.feeVolumeETH),
        }
        return investorData
      })
    : []

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}

/**
 * Fetch InvestorSnapshots
 */
export function useInvestorSnapshotDatas(): {
  loading: boolean
  error: boolean
  data: InvestorSnapshotData[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<InvestorSnapshotsResponse>(INVESTOR_SNAPSHOTS_BULK(), {
    client: dataClient,
  })

  const anyError = Boolean(error)
  const anyLoading = Boolean(loading)

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: [],
    }
  }

  const formatted: InvestorSnapshotData[] = data
    ? data.investorSnapshots.map((value, index) => {
        const investorSnapshotFields = data.investorSnapshots[index]
        const investorSnapshotData: InvestorSnapshotData = {
          id: investorSnapshotFields.id,
          timestamp: parseFloat(investorSnapshotFields.timestamp),
          fund: investorSnapshotFields.fund,
          investor: investorSnapshotFields.investor,
          principalETH: parseFloat(investorSnapshotFields.principalETH),
          principalUSD: parseFloat(investorSnapshotFields.principalUSD),
          volumeETH: parseFloat(investorSnapshotFields.volumeETH),
          volumeUSD: parseFloat(investorSnapshotFields.volumeUSD),
          profitETH: parseFloat(investorSnapshotFields.profitETH),
          profitUSD: parseFloat(investorSnapshotFields.profitUSD),
          profitRatioETH: parseFloat(investorSnapshotFields.profitRatioETH),
          profitRatioUSD: parseFloat(investorSnapshotFields.profitRatioUSD),
          feeVolumeUSD: parseFloat(investorSnapshotFields.feeVolumeUSD),
          feeVolumeETH: parseFloat(investorSnapshotFields.feeVolumeETH),
        }
        return investorSnapshotData
      })
    : []

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
