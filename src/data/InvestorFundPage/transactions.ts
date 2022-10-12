import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Transaction, TransactionType } from 'types/fund'

const INVESTOR_TRANSACTIONS = gql`
  query transactions($fund: Bytes!, $investor: Bytes!) {
    swaps(
      first: 100
      orderBy: timestamp
      orderDirection: desc
      where: { fund: $fund, investor: $investor }
      subgraphError: allow
    ) {
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
    investorDeposits(
      first: 100
      orderBy: timestamp
      orderDirection: desc
      where: { fund: $fund }
      subgraphError: allow
    ) {
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
    investorWithdraws(
      first: 100
      orderBy: timestamp
      orderDirection: desc
      where: { fund: $fund }
      subgraphError: allow
    ) {
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

interface InvestorTransactionResults {
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
  managerDeposits: {
    id: string
    transaction: {
      id: string
    }
    timestamp: string
    fund: string
    manager: string
    token: string
    amount: string
    amountETH: string
    amountUSD: string
    origin: string
    logIndex: string
  }[]
  managerWithdraws: {
    id: string
    transaction: {
      id: string
    }
    timestamp: string
    fund: string
    manager: string
    token: string
    amount: string
    amountETH: string
    amountUSD: string
    origin: string
    logIndex: string
  }[]
  investorDeposits: {
    id: string
    transaction: {
      id: string
    }
    timestamp: string
    fund: string
    manager: string
    token: string
    amount: string
    amountETH: string
    amountUSD: string
    origin: string
    logIndex: string
  }[]
  investorWithdraws: {
    id: string
    transaction: {
      id: string
    }
    timestamp: string
    fund: string
    manager: string
    token: string
    amount: string
    amountETH: string
    amountUSD: string
    origin: string
    logIndex: string
  }[]
}

/**
 * Fetch ManagerData
 */
export async function useInvestorTransactions(
  fund: string,
  investor: string
): Promise<{
  loading: boolean
  error: boolean
  data: Transaction[] | undefined
}> {
  // get client
  const { dataClient } = useClients()

  const { data, error, loading } = await dataClient.query<InvestorTransactionResults>({
    query: INVESTOR_TRANSACTIONS,
    variables: {
      fund,
      investor,
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

  const investorDeposits = data.investorDeposits.map((m) => {
    return {
      type: TransactionType.DEPOSIT,
      hash: m.transaction.id,
      timestamp: m.timestamp,
      sender: m.manager,
      token0Address: m.token,
      token1Address: NULL_ADDRESS,
      amountUSD: parseFloat(m.amountUSD),
      amountToken0: parseFloat(m.amount),
      amountToken1: 0,
    }
  })

  const investorWithdraws = data.investorWithdraws.map((m) => {
    return {
      type: TransactionType.WITHDRAW,
      hash: m.transaction.id,
      timestamp: m.timestamp,
      sender: m.manager,
      token0Address: m.token,
      token1Address: NULL_ADDRESS,
      amountUSD: parseFloat(m.amountUSD),
      amountToken0: parseFloat(m.amount),
      amountToken1: 0,
    }
  })

  return {
    data: [...swaps, ...investorDeposits, ...investorWithdraws],
    error: false,
    loading: false,
  }
}
