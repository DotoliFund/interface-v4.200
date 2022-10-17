import { useQuery } from '@apollo/client'
import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Transaction, TransactionType } from 'types'

const FUND_TRANSACTIONS = gql`
  query transactions($fund: Bytes!) {
    deposits(first: 100, orderBy: timestamp, orderDirection: desc, where: { fund: $fund }, subgraphError: allow) {
      timestamp
      transaction {
        id
      }
      fund
      investor
      token
      amount
      amountETH
      amountUSD
    }
    withdraws(first: 100, orderBy: timestamp, orderDirection: desc, where: { fund: $fund }, subgraphError: allow) {
      timestamp
      transaction {
        id
      }
      fund
      investor
      token
      amount
      amountETH
      amountUSD
    }
    swaps(first: 100, orderBy: timestamp, orderDirection: desc, where: { fund: $fund }, subgraphError: allow) {
      timestamp
      transaction {
        id
      }
      fund
      manager
      investor
      token0
      token1
      amount0
      amount1
      amountETH
      amountUSD
    }
  }
`

interface FundTransactionResults {
  deposits: {
    id: string
    transaction: {
      id: string
    }
    timestamp: string
    fund: string
    investor: string
    token: string
    amount: string
    amountETH: string
    amountUSD: string
  }[]
  withdraws: {
    id: string
    transaction: {
      id: string
    }
    timestamp: string
    fund: string
    investor: string
    token: string
    amount: string
    amountETH: string
    amountUSD: string
  }[]
  swaps: {
    id: string
    transaction: {
      id: string
    }
    timestamp: string
    fund: string
    manager: string
    investor: string
    token0: string
    token1: string
    amount0: string
    amount1: string
    amountETH: string
    amountUSD: string
  }[]
}

/**
 * Fetch ManagerData
 */
export function useFundTransactions(fund: string | undefined): {
  loading: boolean
  error: boolean
  data: Transaction[] | undefined
} {
  if (!fund) {
    fund = NULL_ADDRESS
  }
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<FundTransactionResults>(FUND_TRANSACTIONS, {
    variables: { fund },
    client: dataClient,
  })

  const anyError = Boolean(error)
  const anyLoading = Boolean(loading)

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: undefined,
    }
  }

  const deposits = data
    ? data.deposits.map((m) => {
        return {
          type: TransactionType.DEPOSIT,
          hash: m.transaction.id,
          timestamp: m.timestamp,
          sender: m.investor,
          token0Address: m.token,
          token1Address: NULL_ADDRESS,
          amountToken0: parseFloat(m.amount),
          amountToken1: 0,
          amountETH: parseFloat(m.amountETH),
          amountUSD: parseFloat(m.amountUSD),
        }
      })
    : []

  const withdraws = data
    ? data.withdraws.map((m) => {
        return {
          type: TransactionType.WITHDRAW,
          hash: m.transaction.id,
          timestamp: m.timestamp,
          sender: m.investor,
          token0Address: m.token,
          token1Address: NULL_ADDRESS,
          amountToken0: parseFloat(m.amount),
          amountToken1: 0,
          amountETH: parseFloat(m.amountETH),
          amountUSD: parseFloat(m.amountUSD),
        }
      })
    : []

  const swaps = data
    ? data.swaps.map((m) => {
        return {
          type: TransactionType.WITHDRAW,
          hash: m.transaction.id,
          timestamp: m.timestamp,
          sender: m.manager,
          token0Address: m.token0,
          token1Address: m.token1,
          amountToken0: parseFloat(m.amount0),
          amountToken1: parseFloat(m.amount1),
          amountETH: parseFloat(m.amountETH),
          amountUSD: parseFloat(m.amountUSD),
        }
      })
    : []

  return { data: [...deposits, ...withdraws, ...swaps], error: false, loading: false }
}
