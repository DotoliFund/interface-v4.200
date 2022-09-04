import { Interface } from '@ethersproject/abi'
import { Protocol, RouteV3, Trade } from '@uniswap/router-sdk'
import {
  BigintIsh,
  Currency,
  CurrencyAmount,
  NativeCurrency,
  Percent,
  TradeType,
  validateAndParseAddress,
} from '@uniswap/sdk-core'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import IXXXFund from 'abis/XXXFund.json'
import { XXXToken_ADDRESS } from 'constants/addresses'
import JSBI from 'jsbi'
import invariant from 'tiny-invariant'

//import { Trade } from '@uniswap/router-sdk'
import { MethodParameters, toHex } from './utils/calldata'
import { Multicall } from './utils/multicall'

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

export abstract class XXXFund {
  public static INTERFACE: Interface = new Interface(IXXXFund.abi)

  public static depositCallParameters(
    account: string,
    token: string,
    amount: CurrencyAmount<Currency>
  ): MethodParameters {
    const calldatas: string[] = []
    //const deadline = toHex(JSBI.BigInt(fund.deadline))
    const investor: string = validateAndParseAddress(account)
    // console.log(_amount)
    // console.log(_amount.quotient)
    // console.log(toHex(_amount.quotient))
    // console.log(_amount.toExact())
    // console.log(_amount.toFixed())
    // console.log(_amount.toSignificant(6))

    console.log('investor : ' + investor)
    console.log('amount.quotient : ' + toHex(amount.quotient))
    calldatas.push(
      XXXFund.INTERFACE.encodeFunctionData('deposit', [
        investor,
        token_address,
        toHex(amount.quotient),
        //deadline: deadline
      ])
    )
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
      calldata: Multicall.encodeMulticall(calldatas),
      value,
    }
  }

  public static withdrawCallParameters(
    account: string,
    token: string,
    amount: CurrencyAmount<Currency>
  ): MethodParameters {
    const calldatas: string[] = []
    //const deadline = toHex(JSBI.BigInt(fund.deadline))
    const investor: string = validateAndParseAddress(account)

    // console.log(_amount)
    // console.log(_amount.quotient)
    // console.log(toHex(_amount.quotient))
    // console.log(_amount.toExact())
    // console.log(_amount.toFixed())
    // console.log(_amount.toSignificant(6))

    console.log('investor : ' + investor)
    console.log('amount.quotient : ' + toHex(amount.quotient))
    calldatas.push(
      XXXFund.INTERFACE.encodeFunctionData('withdraw', [
        investor,
        token_address,
        toHex(amount.quotient),
        //deadline: deadline
      ])
    )
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
      calldata: Multicall.encodeMulticall(calldatas),
      value,
    }
  }

  /**
   * @notice Generates the calldata for a Swap with a V3 Route.
   * @param trade The V3Trade to encode.
   * @param options SwapOptions to use for the trade.
   * @returns A string array of calldatas for the trade.
   */
  private static encodeV3Swap(trade: V3Trade<Currency, Currency, TradeType>, options: SwapOptions): string[] {
    const calldatas: string[] = []

    // for (const { route, inputAmount, outputAmount } of trade.swaps) {
    //   const amountIn: string = toHex(trade.maximumAmountIn(options.slippageTolerance, inputAmount).quotient)
    //   const amountOut: string = toHex(trade.minimumAmountOut(options.slippageTolerance, outputAmount).quotient)

    //   // flag for whether the trade is single hop or not
    //   const singleHop = route.pools.length === 1

    //   const recipient = routerMustCustody
    //     ? ADDRESS_THIS
    //     : typeof options.recipient === 'undefined'
    //     ? MSG_SENDER
    //     : validateAndParseAddress(options.recipient)

    //   if (singleHop) {
    //     if (trade.tradeType === TradeType.EXACT_INPUT) {
    //       const exactInputSingleParams = {
    //         tokenIn: route.tokenPath[0].address,
    //         tokenOut: route.tokenPath[1].address,
    //         fee: route.pools[0].fee,
    //         recipient,
    //         amountIn,
    //         amountOutMinimum: performAggregatedSlippageCheck ? 0 : amountOut,
    //         sqrtPriceLimitX96: 0,
    //       }

    //       calldatas.push(SwapRouter.INTERFACE.encodeFunctionData('exactInputSingle', [exactInputSingleParams]))
    //     } else {
    //       const exactOutputSingleParams = {
    //         tokenIn: route.tokenPath[0].address,
    //         tokenOut: route.tokenPath[1].address,
    //         fee: route.pools[0].fee,
    //         recipient,
    //         amountOut,
    //         amountInMaximum: amountIn,
    //         sqrtPriceLimitX96: 0,
    //       }

    //       calldatas.push(SwapRouter.INTERFACE.encodeFunctionData('exactOutputSingle', [exactOutputSingleParams]))
    //     }
    //   } else {
    //     const path: string = encodeRouteToPath(route, trade.tradeType === TradeType.EXACT_OUTPUT)

    //     if (trade.tradeType === TradeType.EXACT_INPUT) {
    //       const exactInputParams = {
    //         path,
    //         recipient,
    //         amountIn,
    //         amountOutMinimum: performAggregatedSlippageCheck ? 0 : amountOut,
    //       }

    //       calldatas.push(SwapRouter.INTERFACE.encodeFunctionData('exactInput', [exactInputParams]))
    //     } else {
    //       const exactOutputParams = {
    //         path,
    //         recipient,
    //         amountOut,
    //         amountInMaximum: amountIn,
    //       }

    //       calldatas.push(SwapRouter.INTERFACE.encodeFunctionData('exactOutput', [exactOutputParams]))
    //     }
    //   }
    // }

    return calldatas
  }

  public static swapCallParameters(
    trades:
      | Trade<Currency, Currency, TradeType>
      | V3Trade<Currency, Currency, TradeType>
      | V3Trade<Currency, Currency, TradeType>[],
    options: SwapOptions
  ): MethodParameters {
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

    const calldatas: string[] = []

    for (const trade of trades) {
      if (trade instanceof V3Trade) {
        for (const calldata of XXXFund.encodeV3Swap(trade, options)) {
          calldatas.push(calldata)
        }
      } else {
        throw new Error('Unsupported trade object')
      }
    }

    const value: string = toHex(0)

    return {
      calldata: Multicall.encodeMulticall(calldatas),
      value,
    }
  }
}
