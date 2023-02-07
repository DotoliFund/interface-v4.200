export interface FundDetails {
  fund: string
  investor: string
}

export interface FeeToken {
  tokenAddress: string
  amount: number
}

export interface Token {
  address: string
  symbol: string
  updatedTimestamp: string
}

export interface TokenFields {
  id: string
  address: string
  symbol: string
  updatedTimestamp: string
}

export interface Factory {
  id: string
  fundCount: number
  investorCount: number
  managerFee: number
  minPoolAmount: number
}

export interface FactoryFields {
  id: string
  fundCount: string
  investorCount: string
  managerFee: string
  minPoolAmount: string
}

export interface FactorySnapshot {
  id: string
  timestamp: number
  fundCount: number
  investorCount: number
  totalCurrentETH: number
  totalCurrentUSD: number
}

export interface FactorySnapshotFields {
  id: string
  timestamp: string
  fundCount: string
  investorCount: string
  totalCurrentETH: string
  totalCurrentUSD: string
}

export interface Fund {
  address: string
  createdAtTimestamp: number
  manager: string
  investorCount: number
  currentETH: number
  currentUSD: number
  currentTokens: string[]
  currentTokensSymbols: string[]
  currentTokensDecimals: number[]
  currentTokensAmount: number[]
  currentTokensAmountETH: number[]
  currentTokensAmountUSD: number[]
  feeTokens: string[]
  feeSymbols: string[]
  feeTokensAmount: number[]
}

export interface FundFields {
  id: string
  address: string
  createdAtTimestamp: string
  manager: string
  investorCount: string
  currentETH: string
  currentUSD: string
  currentTokens: string[]
  currentTokensSymbols: string[]
  currentTokensDecimals: string[]
  currentTokensAmount: string[]
  currentTokensAmountETH: string[]
  currentTokensAmountUSD: string[]
  feeTokens: string[]
  feeSymbols: string[]
  feeTokensAmount: string[]
}

export interface Investor {
  id: string
  createdAtTimestamp: number
  fund: string
  manager: string
  investor: string
  principalETH: number
  principalUSD: number
  currentETH: number
  currentUSD: number
  currentTokens: string[]
  currentTokensSymbols: string[]
  currentTokensDecimals: number[]
  currentTokensAmount: number[]
  currentTokensAmountETH: number[]
  currentTokensAmountUSD: number[]
  tokenIds: number[]
  profitETH: number
  profitUSD: number
  profitRatio: number
}

export interface InvestorFields {
  id: string
  createdAtTimestamp: string
  fund: string
  manager: string
  investor: string
  principalETH: string
  principalUSD: string
  currentETH: string
  currentUSD: string
  currentTokens: string[]
  currentTokensSymbols: string[]
  currentTokensDecimals: string[]
  currentTokensAmount: string[]
  currentTokensAmountETH: string[]
  currentTokensAmountUSD: string[]
  tokenIds: string[]
  profitETH: string
  profitUSD: string
  profitRatio: string
}

export interface FundSnapshot {
  id: string
  timestamp: number
  fund: string
  manager: string
  investorCount: number
  currentETH: number
  currentUSD: number
  currentTokens: string[]
  currentTokensSymbols: string[]
  currentTokensDecimals: number[]
  currentTokensAmountETH: number[]
  currentTokensAmountUSD: number[]
}

export interface FundSnapshotFields {
  id: string
  timestamp: string
  fund: string
  manager: string
  investorCount: string
  currentETH: string
  currentUSD: string
  currentTokens: string[]
  currentTokensSymbols: string[]
  currentTokensDecimals: string[]
  currentTokensAmountETH: string[]
  currentTokensAmountUSD: string[]
}

export interface InvestorSnapshot {
  id: string
  timestamp: number
  fund: string
  manager: string
  investor: string
  principalETH: number
  principalUSD: number
  tokens: string[]
  tokensSymbols: string[]
  tokensDecimals: number[]
  tokensAmountETH: number[]
  tokensAmountUSD: number[]
  currentETH: number
  currentUSD: number
  tokenIds: number[]
  poolETH: number
  poolUSD: number
  profitETH: number
  profitUSD: number
  profitRatio: number
}

export interface InvestorSnapshotFields {
  id: string
  timestamp: string
  fund: string
  manager: string
  investor: string
  principalETH: string
  principalUSD: string
  tokens: string[]
  tokensSymbols: string[]
  tokensDecimals: string[]
  tokensAmountETH: string[]
  tokensAmountUSD: string[]
  currentETH: string
  currentUSD: string
  tokenIds: string[]
  poolETH: string
  poolUSD: string
  profitETH: string
  profitUSD: string
  profitRatio: string
}
