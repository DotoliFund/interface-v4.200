import { useQuery } from '@apollo/client'
import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { LiquidityTransaction, LiquidityTransactionType } from 'types'

const FUND_ACCOUNT_TRANSACTIONS = gql`
  query transactions($fund: Bytes!, $investor: Bytes!) {
    mintNewPositions(
      first: 100
      orderBy: timestamp
      orderDirection: desc
      where: { fund: $fund, investor: $investor }
      subgraphError: allow
    ) {
      timestamp
      transaction {
        id
      }
      fund
      manager
      investor
      token0
      token1
      token0Symbol
      token1Symbol
      amount0
      amount1
      amountETH
      amountUSD
    }
    increaseLiquidities(
      first: 100
      orderBy: timestamp
      orderDirection: desc
      where: { fund: $fund, investor: $investor }
      subgraphError: allow
    ) {
      timestamp
      transaction {
        id
      }
      fund
      manager
      investor
      token0
      token1
      token0Symbol
      token1Symbol
      amount0
      amount1
      amountETH
      amountUSD
    }
    collectPositionFees(
      first: 100
      orderBy: timestamp
      orderDirection: desc
      where: { fund: $fund, investor: $investor }
      subgraphError: allow
    ) {
      timestamp
      transaction {
        id
      }
      fund
      manager
      investor
      token0
      token1
      token0Symbol
      token1Symbol
      amount0
      amount1
      amountETH
      amountUSD
    }
    decreaseLiquidities(
      first: 100
      orderBy: timestamp
      orderDirection: desc
      where: { fund: $fund, investor: $investor }
      subgraphError: allow
    ) {
      timestamp
      transaction {
        id
      }
      fund
      manager
      investor
      token0
      token1
      token0Symbol
      token1Symbol
      amount0
      amount1
      amountETH
      amountUSD
    }
  }
`

interface InvestorTransactionResults {
  mintNewPositions: {
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
    token0Symbol: string
    token1Symbol: string
    amount0: string
    amount1: string
    amountETH: string
    amountUSD: string
  }[]
  increaseLiquidities: {
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
    token0Symbol: string
    token1Symbol: string
    amount0: string
    amount1: string
    amountETH: string
    amountUSD: string
  }[]
  collectPositionFees: {
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
    token0Symbol: string
    token1Symbol: string
    amount0: string
    amount1: string
    amountETH: string
    amountUSD: string
  }[]
  decreaseLiquidities: {
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
    token0Symbol: string
    token1Symbol: string
    amount0: string
    amount1: string
    amountETH: string
    amountUSD: string
  }[]
}

/**
 * Fetch ManagerData
 */
export function useFundAccountLiquidityTransactions(
  fund: string | undefined,
  investor: string | undefined
): {
  loading: boolean
  error: boolean
  data: LiquidityTransaction[] | undefined
} {
  if (!fund) {
    fund = NULL_ADDRESS
  }
  if (!investor) {
    investor = NULL_ADDRESS
  }
  // get client
  const { dataClient } = useClients()

  const id = fund.toUpperCase() + '-' + investor.toUpperCase()
  const { loading, error, data } = useQuery<InvestorTransactionResults>(FUND_ACCOUNT_TRANSACTIONS, {
    variables: { fund, investor },
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

  const mintNewPositions = data
    ? data.mintNewPositions.map((m) => {
        return {
          type: LiquidityTransactionType.MINT,
          hash: m.transaction.id,
          timestamp: m.timestamp,
          sender: m.manager,
          token0: m.token0,
          token1: m.token1,
          token0Symbol: m.token0Symbol,
          token1Symbol: m.token1Symbol,
          amount0: parseFloat(m.amount0),
          amount1: parseFloat(m.amount1),
          amountETH: parseFloat(m.amountETH),
          amountUSD: parseFloat(m.amountUSD),
        }
      })
    : []

  const increaseLiquidities = data
    ? data.increaseLiquidities.map((m) => {
        return {
          type: LiquidityTransactionType.ADD,
          hash: m.transaction.id,
          timestamp: m.timestamp,
          sender: m.manager,
          token0: m.token0,
          token1: m.token1,
          token0Symbol: m.token0Symbol,
          token1Symbol: m.token1Symbol,
          amount0: parseFloat(m.amount0),
          amount1: parseFloat(m.amount1),
          amountETH: parseFloat(m.amountETH),
          amountUSD: parseFloat(m.amountUSD),
        }
      })
    : []

  const collectPositionFees = data
    ? data.collectPositionFees.map((m) => {
        return {
          type: LiquidityTransactionType.COLLECT,
          hash: m.transaction.id,
          timestamp: m.timestamp,
          sender: m.manager,
          token0: m.token0,
          token1: m.token1,
          token0Symbol: m.token0Symbol,
          token1Symbol: m.token1Symbol,
          amount0: parseFloat(m.amount0),
          amount1: parseFloat(m.amount1),
          amountETH: parseFloat(m.amountETH),
          amountUSD: parseFloat(m.amountUSD),
        }
      })
    : []

  const decreaseLiquidities = data
    ? data.decreaseLiquidities.map((m) => {
        return {
          type: LiquidityTransactionType.REMOVE,
          hash: m.transaction.id,
          timestamp: m.timestamp,
          sender: m.manager,
          token0: m.token0,
          token1: m.token1,
          token0Symbol: m.token0Symbol,
          token1Symbol: m.token1Symbol,
          amount0: parseFloat(m.amount0),
          amount1: parseFloat(m.amount1),
          amountETH: parseFloat(m.amountETH),
          amountUSD: parseFloat(m.amountUSD),
        }
      })
    : []

  return {
    data: [...mintNewPositions, ...increaseLiquidities, ...collectPositionFees, ...decreaseLiquidities],
    error: false,
    loading: false,
  }
}
