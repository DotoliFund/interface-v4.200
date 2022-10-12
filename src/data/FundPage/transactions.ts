import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Transaction, TransactionType } from 'types/fund'

const FUND_TRANSACTIONS = gql`
  query transactions($fund: Bytes!) {
    swaps(first: 100, orderBy: timestamp, orderDirection: desc, where: { fund: $fund }, subgraphError: allow) {
      id
      timestamp
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
export async function useFundTransactions(fund: string): Promise<{
  loading: boolean
  error: boolean
  data: Transaction[] | undefined
}> {
  // get client
  const { dataClient } = useClients()

  const { data, error, loading } = await dataClient.query<FundTransactionResults>({
    query: FUND_TRANSACTIONS,
    variables: {
      fund,
    },
    fetchPolicy: 'cache-first',
  })

  if (error) {
    return {
      data: undefined,
      error: true,
      loading: false,
    }
  }

  if (loading && !data) {
    return {
      data: undefined,
      error: false,
      loading: true,
    }
  }

  const swaps = data.swaps.map((m) => {
    return {
      type: TransactionType.SWAP,
      hash: m.transaction.id,
      timestamp: m.timestamp,
      sender: m.manager,
      token0Address: m.token0,
      token1Address: m.token1,
      amountUSD: parseFloat(m.amountUSD),
      amountToken0: parseFloat(m.amount0),
      amountToken1: parseFloat(m.amount1),
    }
  })

  return { data: [...swaps], error: false, loading: false }
}
