export enum TransactionType {
  SWAP,
  MINT,
  BURN,
  DEPOSIT,
  WITHDRAW,
  ADD_LIQUIDITY,
  REMOVE_LIQUIDITY,
  SUBSCRIBE,
}

export type Transaction = {
  type: TransactionType
  hash: string
  timestamp: string
  sender: string
  token0Address: string
  token1Address: string
  amountToken0: number
  amountToken1: number
  amountETH: number
  amountUSD: number
}
