import { Interface } from '@ethersproject/abi'
import { Protocol, RouteV3, Trade } from '@uniswap/router-sdk'
import { BigintIsh, Currency, CurrencyAmount, NativeCurrency, Percent, TradeType } from '@uniswap/sdk-core'
import { encodeRouteToPath, Trade as V3Trade } from '@uniswap/v3-sdk'
import IXXXFund2 from 'abis/XXXFund2.json'
import { NEWFUND_ADDRESS, NULL_ADDRESS, XXXToken_ADDRESS } from 'constants/addresses'
import JSBI from 'jsbi'
import invariant from 'tiny-invariant'

//import { Trade } from '@uniswap/router-sdk'
import { MethodParameters, toHex } from './utils/calldata'

const MaxUint128 = toHex(JSBI.subtract(JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)), JSBI.BigInt(1)))
const token_address = XXXToken_ADDRESS

export interface MintSpecificOptions {
  /**
   * The account that should receive the minted NFT.
   */
  recipient: string

  /**
   * When the transaction expires, in epoch seconds.
   */
  deadline: BigintIsh
}

export interface IncreaseSpecificOptions {
  /**
   * Indicates the ID of the position to increase liquidity for.
   */
  tokenId: BigintIsh
}

/**
 * Options for producing the calldata to add liquidity.
 */
export interface CommonAddLiquidityOptions {
  /**
   * When the transaction expires, in epoch seconds.
   */
  deadline: BigintIsh

  /**
   * Whether to spend ether. If true, one of the pool tokens must be WETH, by default false
   */
  useNative?: NativeCurrency
}

enum V3TradeType {
  EXACT_INPUT,
  EXACT_OUTPUT,
}

enum V3SwapType {
  SINGLE_HOP,
  MULTI_HOP,
}

/**
 * V3TradeParams for producing the arguments to send calls to the router.
 */
export interface V3TradeParams {
  tradeType: V3TradeType
  swapType: V3SwapType
  investor: string
  tokenIn: string
  tokenOut: string
  recipient: string
  fee: number
  amountIn: string
  amountOut: string
  amountInMaximum: string
  amountOutMinimum: string
  sqrtPriceLimitX96: number
  path: string
}

/**
 * Options for producing the arguments to send calls to the router.
 */
export interface SwapOptions {
  /**
   * How much the execution price is allowed to move unfavorably from the trade execution price.
   */
  slippageTolerance: Percent
}

export type MintOptions = CommonAddLiquidityOptions & MintSpecificOptions
export type IncreaseOptions = CommonAddLiquidityOptions & IncreaseSpecificOptions

export type AddLiquidityOptions = MintOptions | IncreaseOptions

export abstract class XXXFund2 {
  public static INTERFACE: Interface = new Interface(IXXXFund2)

  public static depositCallParameters(token: string, amount: CurrencyAmount<Currency>): MethodParameters {
    //const calldatas: string[] = []
    //const deadline = toHex(JSBI.BigInt(fund.deadline))
    // console.log(_amount)
    // console.log(_amount.quotient)
    // console.log(toHex(_amount.quotient))
    // console.log(_amount.toExact())
    // console.log(_amount.toFixed())
    // console.log(_amount.toSignificant(6))
    console.log('amount.currency.name : ' + amount.currency.name)
    console.log('amount.currency.symbol : ' + amount.currency.symbol)
    console.log('token : ' + token)
    console.log('amount.quotient toHex(): ' + toHex(amount.quotient))
    console.log('amount.quotient : ' + amount.quotient)
    // calldatas.push(
    //   XXXFund2.INTERFACE.encodeFunctionData('deposit', [
    //     investor,
    //     token,
    //     toHex(amount.quotient),
    //     //amount.quotient.toString(),
    //     //deadline: deadline
    //   ])
    // )
    const calldata: string = XXXFund2.INTERFACE.encodeFunctionData('deposit', [
      token,
      toHex(amount.quotient),
      //amount.quotient.toString(),
      //deadline: deadline
    ])

    const value: string = toHex(0)

    return {
      calldata,
      value,
    }
  }

  public static withdrawCallParameters(token: string, amount: CurrencyAmount<Currency>): MethodParameters {
    //const deadline = toHex(JSBI.BigInt(fund.deadline))

    // console.log(_amount)
    // console.log(_amount.quotient)
    // console.log(toHex(_amount.quotient))
    // console.log(_amount.toExact())
    // console.log(_amount.toFixed())
    // console.log(_amount.toSignificant(6))

    console.log('amount.quotient : ' + toHex(amount.quotient))
    const calldata: string = XXXFund2.INTERFACE.encodeFunctionData('withdraw', [
      token,
      toHex(amount.quotient),
      //deadline: deadline
    ])

    // calldatas.push(
    //     XXXFactory.INTERFACE.encodeFunctionData('createFund', [
    //     {
    //       manager: manager,
    //       //token: fund.token,
    //       token: '0xEAE906dC299ccd9Cd94584377d0F96Ce144c942f',
    //       amount: 1
    //       //amount: toHex(_amount.quotient),
    //       //deadline: deadline
    //     }
    //   ])
    // )

    const value: string = toHex(0)

    return {
      calldata,
      value,
    }
  }

  /**
   * @notice Generates the calldata for a Swap with a V3 Route.
   * @param trade The V3Trade to encode.
   * @param options SwapOptions to use for the trade.
   * @returns A string array of calldatas for the trade.
   */
  private static encodeV3Swap(
    investor: string,
    trade: V3Trade<Currency, Currency, TradeType>,
    options: SwapOptions
  ): V3TradeParams[] {
    const params: V3TradeParams[] = []

    for (const { route, inputAmount, outputAmount } of trade.swaps) {
      const amountIn: string = toHex(trade.maximumAmountIn(options.slippageTolerance, inputAmount).quotient)
      const amountOut: string = toHex(trade.minimumAmountOut(options.slippageTolerance, outputAmount).quotient)

      // flag for whether the trade is single hop or not
      const singleHop = route.pools.length === 1

      const recipient = NEWFUND_ADDRESS

      if (singleHop) {
        if (trade.tradeType === TradeType.EXACT_INPUT) {
          //exactInputSingleParams
          params.push({
            tradeType: V3TradeType.EXACT_INPUT,
            swapType: V3SwapType.SINGLE_HOP,
            investor,
            tokenIn: route.tokenPath[0].address,
            tokenOut: route.tokenPath[1].address,
            recipient,
            fee: route.pools[0].fee,
            amountIn,
            amountOut: toHex(0),
            amountInMaximum: toHex(0),
            amountOutMinimum: amountOut,
            sqrtPriceLimitX96: 0,
            path: toHex(''),
          })
        } else {
          //exactOutputSingleParams
          params.push({
            tradeType: V3TradeType.EXACT_OUTPUT,
            swapType: V3SwapType.SINGLE_HOP,
            investor,
            tokenIn: route.tokenPath[0].address,
            tokenOut: route.tokenPath[1].address,
            recipient,
            fee: route.pools[0].fee,
            amountIn: toHex(0),
            amountOut,
            amountInMaximum: amountIn,
            amountOutMinimum: toHex(0),
            sqrtPriceLimitX96: 0,
            path: toHex(''),
          })
        }
      } else {
        const path: string = encodeRouteToPath(route, trade.tradeType === TradeType.EXACT_OUTPUT)

        if (trade.tradeType === TradeType.EXACT_INPUT) {
          //exactInputParams
          params.push({
            tradeType: V3TradeType.EXACT_INPUT,
            swapType: V3SwapType.MULTI_HOP,
            investor,
            tokenIn: NULL_ADDRESS,
            tokenOut: NULL_ADDRESS,
            recipient,
            fee: 0,
            amountIn,
            amountOut: toHex(0),
            amountInMaximum: toHex(0),
            amountOutMinimum: amountOut,
            sqrtPriceLimitX96: 0,
            path,
          })
        } else {
          //exactOutputParams
          params.push({
            tradeType: V3TradeType.EXACT_OUTPUT,
            swapType: V3SwapType.MULTI_HOP,
            investor,
            tokenIn: NULL_ADDRESS,
            tokenOut: NULL_ADDRESS,
            recipient,
            fee: 0,
            amountIn: toHex(0),
            amountOut,
            amountInMaximum: amountIn,
            amountOutMinimum: toHex(0),
            sqrtPriceLimitX96: 0,
            path,
          })
        }
      }
    }

    return params
  }

  /**
   * @notice Generates the calldata for a Swap with a V3 Route.
   * @param trade The V3Trade to encode.
   * @param options SwapOptions to use for the trade.
   * @returns A string array of calldatas for the trade.
   */
  private static encodeSwaps(
    investor: string,
    trades:
      | Trade<Currency, Currency, TradeType>
      | V3Trade<Currency, Currency, TradeType>
      | V3Trade<Currency, Currency, TradeType>[],
    options: SwapOptions
  ): {
    params: V3TradeParams[]
  } {
    // If dealing with an instance of the aggregated Trade object, unbundle it to individual trade objects.
    if (trades instanceof Trade) {
      invariant(
        trades.swaps.every((swap) => swap.route.protocol === Protocol.V3),
        'UNSUPPORTED_PROTOCOL'
      )

      const individualTrades: V3Trade<Currency, Currency, TradeType>[] = []

      for (const { route, inputAmount, outputAmount } of trades.swaps) {
        if (route.protocol === Protocol.V3) {
          individualTrades.push(
            V3Trade.createUncheckedTrade({
              route: route as RouteV3<Currency, Currency>,
              inputAmount,
              outputAmount,
              tradeType: trades.tradeType,
            })
          )
        } else {
          throw new Error('UNSUPPORTED_TRADE_PROTOCOL')
        }
      }
      trades = individualTrades
    }

    if (!Array.isArray(trades)) {
      trades = [trades]
    }

    const numberOfTrades = trades.reduce((numberOfTrades, trade) => numberOfTrades + trade.swaps.length, 0)

    const sampleTrade = trades[0]

    // All trades should have the same starting/ending currency and trade type
    invariant(
      trades.every((trade) => trade.inputAmount.currency.equals(sampleTrade.inputAmount.currency)),
      'TOKEN_IN_DIFF'
    )
    invariant(
      trades.every((trade) => trade.outputAmount.currency.equals(sampleTrade.outputAmount.currency)),
      'TOKEN_OUT_DIFF'
    )
    invariant(
      trades.every((trade) => trade.tradeType === sampleTrade.tradeType),
      'TRADE_TYPE_DIFF'
    )

    const params: V3TradeParams[] = []

    const inputIsNative = sampleTrade.inputAmount.currency.isNative
    const outputIsNative = sampleTrade.outputAmount.currency.isNative

    for (const trade of trades) {
      if (trade instanceof V3Trade) {
        for (const param of XXXFund2.encodeV3Swap(investor, trade, options)) {
          params.push(param)
        }
      } else {
        throw new Error('Unsupported trade object')
      }
    }

    const ZERO_IN: CurrencyAmount<Currency> = CurrencyAmount.fromRawAmount(sampleTrade.inputAmount.currency, 0)
    const ZERO_OUT: CurrencyAmount<Currency> = CurrencyAmount.fromRawAmount(sampleTrade.outputAmount.currency, 0)

    const minimumAmountOut: CurrencyAmount<Currency> = trades.reduce(
      (sum, trade) => sum.add(trade.minimumAmountOut(options.slippageTolerance)),
      ZERO_OUT
    )

    const quoteAmountOut: CurrencyAmount<Currency> = trades.reduce(
      (sum, trade) => sum.add(trade.outputAmount),
      ZERO_OUT
    )

    const totalAmountIn: CurrencyAmount<Currency> = trades.reduce(
      (sum, trade) => sum.add(trade.maximumAmountIn(options.slippageTolerance)),
      ZERO_IN
    )

    return {
      params,
    }
  }

  public static swapCallParameters(
    investor: string,
    trades:
      | Trade<Currency, Currency, TradeType>
      | V3Trade<Currency, Currency, TradeType>
      | V3Trade<Currency, Currency, TradeType>[],
    options: SwapOptions
  ): MethodParameters {
    const value = toHex(0)

    const { params } = XXXFund2.encodeSwaps(investor, trades, options)
    console.log(params.length)
    console.log(params[0])
    console.log(params)

    return {
      calldata: XXXFund2.INTERFACE.encodeFunctionData('swap', [params]),
      value,
    }
  }
}
