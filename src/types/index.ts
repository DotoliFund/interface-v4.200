export enum TransactionType {
  SWAP,
  DEPOSIT,
  WITHDRAW,
}

export enum LiquidityTransactionType {
  MINT,
  ADD,
  REMOVE,
}

export interface Transaction {
  type: TransactionType
  hash: string
  timestamp: string
  sender: string
  token0: string
  token1: string
  token0Symbol: string
  token1Symbol: string
  amount0: number
  amount1: number
  amountETH: number
  amountUSD: number
}

export interface LiquidityTransaction {
  type: LiquidityTransactionType
  hash: string
  timestamp: string
  sender: string
  token0: string
  token1: string
  token0Symbol: string
  token1Symbol: string
  amount0: number
  amount1: number
  amountETH: number
  amountUSD: number
}
