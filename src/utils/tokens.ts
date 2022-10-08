import { Token } from '@uniswap/sdk-core'
import { NetworkInfo } from 'constants/networks'

const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const ARBITRUM_WETH_ADDRESS = '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'
export const WETH_ADDRESSES = [WETH_ADDRESS, ARBITRUM_WETH_ADDRESS]

export interface SerializedToken {
  chainId: number
  address: string
  decimals: number
  symbol?: string
  name?: string
}

export function serializeToken(token: Token): SerializedToken {
  return {
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
  }
}

export function formatTokenSymbol(address: string, symbol: string, activeNetwork?: NetworkInfo) {
  // // dumb catch for matic
  // if (address === MATIC_ADDRESS && activeNetwork === PolygonNetworkInfo) {
  //   return 'MATIC'
  // }

  // // dumb catch for Celo
  // if (address === CELO_ADDRESS && activeNetwork === CeloNetworkInfo) {
  //   return 'CELO'
  // }

  if (WETH_ADDRESSES.includes(address)) {
    return 'ETH'
  }
  return symbol
}

export function formatTokenName(address: string, name: string, activeNetwork?: NetworkInfo) {
  // // dumb catch for matic
  // if (address === MATIC_ADDRESS && activeNetwork === PolygonNetworkInfo) {
  //   return 'MATIC'
  // }

  // // dumb catch for Celo
  // if (address === CELO_ADDRESS && activeNetwork === CeloNetworkInfo) {
  //   return 'CELO'
  // }

  if (WETH_ADDRESSES.includes(address)) {
    return 'Ether'
  }
  return name
}
