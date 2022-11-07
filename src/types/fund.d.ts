export interface FundDetails {
  fund: string
  investor: string
}

export interface Fund {
  address: string
  createdAtTimestamp: number
  createdAtBlockNumber: number
  manager: string
  investorCount: number
  principalETH: number
  principalUSD: number
  volumeETH: number
  volumeUSD: number
  profitETH: number
  profitUSD: number
  profitRatioETH: number
  profitRatioUSD: number
  feeVolumeETH: number
  feeVolumeUSD: number
}

export interface FundFields {
  id: string
  address: string
  createdAtTimestamp: string
  createdAtBlockNumber: string
  manager: string
  investorCount: string
  principalETH: string
  principalUSD: string
  volumeETH: string
  volumeUSD: string
  profitETH: string
  profitUSD: string
  profitRatioETH: string
  profitRatioUSD: string
  feeVolumeETH: string
  feeVolumeUSD: string
}

export interface Investor {
  id: string
  createdAtTimestamp: number
  createdAtBlockNumber: number
  fund: string
  manager: string
  investor: string
  principalETH: number
  principalUSD: number
  volumeETH: number
  volumeUSD: number
  profitETH: number
  profitUSD: number
  profitRatioETH: number
  profitRatioUSD: number
}

export interface InvestorFields {
  id: string
  createdAtTimestamp: string
  createdAtBlockNumber: string
  fund: string
  manager: string
  investor: string
  principalETH: string
  principalUSD: string
  volumeETH: string
  volumeUSD: string
  profitETH: string
  profitUSD: string
  profitRatioETH: string
  profitRatioUSD: string
}

export interface FundSnapshot {
  id: string
  timestamp: number
  fund: string
  manager: string
  investorCount: number
  principalETH: number
  principalUSD: number
  volumeETH: number
  volumeUSD: number
  profitETH: number
  profitUSD: number
  profitRatioETH: number
  profitRatioUSD: number
  feeVolumeETH: number
  feeVolumeUSD: number
}

export interface FundSnapshotFields {
  id: string
  timestamp: string
  fund: string
  manager: string
  investorCount: string
  principalETH: string
  principalUSD: string
  volumeETH: string
  volumeUSD: string
  profitETH: string
  profitUSD: string
  profitRatioETH: string
  profitRatioUSD: string
  feeVolumeETH: string
  feeVolumeUSD: string
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
  profitETH: number
  profitUSD: number
  profitRatioETH: number
  profitRatioUSD: number
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
  profitETH: string
  profitUSD: string
  profitRatioETH: string
  profitRatioUSD: string
}
