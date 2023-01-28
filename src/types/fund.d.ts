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

export interface DotoliFundSnapshot {
  id: string
  timestamp: number
  fundCount: number
  investorCount: number
  totalVolumeETH: number
  totalVolumeUSD: number
}

export interface DotoliFundSnapshotFields {
  id: string
  timestamp: string
  fundCount: string
  investorCount: string
  totalVolumeETH: string
  totalVolumeUSD: string
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

export interface Fund {
  address: string
  createdAtTimestamp: number
  manager: string
  investorCount: number
  volumeETH: number
  volumeUSD: number
  tokens: string[]
  symbols: string[]
  decimals: number[]
  tokensAmount: number[]
  tokensVolumeETH: number[]
  tokensVolumeUSD: number[]
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
  volumeETH: string
  volumeUSD: string
  tokens: string[]
  symbols: string[]
  decimals: string[]
  tokensAmount: string[]
  tokensVolumeETH: string[]
  tokensVolumeUSD: string[]
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
  volumeETH: number
  volumeUSD: number
  liquidityVolumeETH: number
  liquidityVolumeUSD: number
  tokens: string[]
  symbols: string[]
  decimals: number[]
  tokensAmount: number[]
  tokensVolumeETH: number[]
  tokensVolumeUSD: number[]
  liquidityTokens: string[]
  liquiditySymbols: string[]
  liquidityDecimals: number[]
  liquidityTokensAmount: number[]
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
  volumeETH: string
  volumeUSD: string
  liquidityVolumeETH: string
  liquidityVolumeUSD: string
  tokens: string[]
  symbols: string[]
  decimals: string[]
  tokensAmount: string[]
  tokensVolumeETH: string[]
  tokensVolumeUSD: string[]
  liquidityTokens: string[]
  liquiditySymbols: string[]
  liquidityDecimals: string[]
  liquidityTokensAmount: string[]
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
  volumeETH: number
  volumeUSD: number
  tokens: string[]
  symbols: string[]
  decimals: number[]
  tokensVolumeETH: number[]
  tokensVolumeUSD: number[]
}

export interface FundSnapshotFields {
  id: string
  timestamp: string
  fund: string
  manager: string
  investorCount: string
  volumeETH: string
  volumeUSD: string
  tokens: string[]
  symbols: string[]
  decimals: string[]
  tokensVolumeETH: string[]
  tokensVolumeUSD: string[]
}

export interface InvestorSnapshot {
  id: string
  timestamp: number
  fund: string
  manager: string
  investor: string
  principalETH: number
  principalUSD: number
  volumeETH: number
  volumeUSD: number
  liquidityVolumeETH: number
  liquidityVolumeUSD: number
  tokens: string[]
  symbols: string[]
  tokensVolumeETH: number[]
  tokensVolumeUSD: number[]
}

export interface InvestorSnapshotFields {
  id: string
  timestamp: string
  fund: string
  manager: string
  investor: string
  principalETH: string
  principalUSD: string
  volumeETH: string
  volumeUSD: string
  liquidityVolumeETH: string
  liquidityVolumeUSD: string
  tokens: string[]
  symbols: string[]
  tokensVolumeETH: string[]
  tokensVolumeUSD: string[]
}
