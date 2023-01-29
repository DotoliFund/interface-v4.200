import { Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { useTokensPriceInETH } from 'hooks/usePools'

interface TokensData {
  token: string
  symbol: string
  decimal: number
  amount: number
}

export function useTokensPriceInUSD(
  chainId: number | undefined,
  weth9: Token | undefined,
  ethPriceInUSDC: number | undefined,
  tokensData: TokensData[] | undefined
): [Token, number][] {
  // get current volume token's price
  const volumeTokenPools: [Token | undefined, Token | undefined, FeeAmount | undefined][] = []
  const volumeTokensAmount: [Token, number][] = []

  if (tokensData) {
    tokensData.map((data, index) => {
      volumeTokenPools.push([new Token(chainId ? chainId : 0, data.token, data.decimal), weth9, FeeAmount.HIGH])
      volumeTokenPools.push([new Token(chainId ? chainId : 0, data.token, data.decimal), weth9, FeeAmount.MEDIUM])
      volumeTokenPools.push([new Token(chainId ? chainId : 0, data.token, data.decimal), weth9, FeeAmount.LOW])
      volumeTokensAmount.push([new Token(chainId ? chainId : 0, data.token, data.decimal), data.amount])
    })
  }

  const volumeTokensPriceInETH = useTokensPriceInETH(chainId, volumeTokenPools)
  const volumeTokensPriceInUSD: [Token, number][] = []
  if (ethPriceInUSDC && volumeTokensPriceInETH && weth9 !== undefined) {
    volumeTokensAmount.map((data, index) => {
      const token = data[0].address
      const tokenAmount = data[1]

      if (token.toUpperCase() === weth9.address.toUpperCase()) {
        volumeTokensPriceInUSD.push([weth9, tokenAmount * ethPriceInUSDC])
      } else {
        volumeTokensPriceInETH.map((data2: any, index2: any) => {
          const token2 = data2[0].address
          const priceInETH = data2[1]
          if (token.toUpperCase() === token2.toUpperCase()) {
            volumeTokensPriceInUSD.push([data2[0], tokenAmount * priceInETH * ethPriceInUSDC])
          }
        })
      }
    })
  }
  return volumeTokensPriceInUSD
}
