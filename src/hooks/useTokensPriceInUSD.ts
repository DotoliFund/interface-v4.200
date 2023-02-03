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
): [Token, number, number][] {
  // get token's price
  const tokensPools: [Token | undefined, Token | undefined, FeeAmount | undefined][] = []
  const tokensAmount: [Token, number][] = []

  if (tokensData) {
    tokensData.map((data, index) => {
      tokensPools.push([new Token(chainId ? chainId : 0, data.token, data.decimal), weth9, FeeAmount.HIGH])
      tokensPools.push([new Token(chainId ? chainId : 0, data.token, data.decimal), weth9, FeeAmount.MEDIUM])
      tokensPools.push([new Token(chainId ? chainId : 0, data.token, data.decimal), weth9, FeeAmount.LOW])
      tokensAmount.push([new Token(chainId ? chainId : 0, data.token, data.decimal), data.amount])
    })
  }

  const tokensPriceInETH = useTokensPriceInETH(chainId, tokensPools)
  const tokensPriceInUSD: [Token, number, number][] = []
  if (ethPriceInUSDC && tokensPriceInETH && weth9 !== undefined) {
    tokensAmount.map((data, index) => {
      const token = data[0].address
      const tokenAmount = data[1]

      if (token.toUpperCase() === weth9.address.toUpperCase()) {
        tokensPriceInUSD.push([weth9, tokenAmount, tokenAmount * ethPriceInUSDC])
      } else {
        tokensPriceInETH.map((data2: any, index2: any) => {
          const token2 = data2[0].address
          const priceInETH = data2[1]
          if (token.toUpperCase() === token2.toUpperCase()) {
            tokensPriceInUSD.push([data2[0], tokenAmount, tokenAmount * priceInETH * ethPriceInUSDC])
          }
        })
      }
    })
  }
  return tokensPriceInUSD
}
