import { Interface } from '@ethersproject/abi'
import { Protocol, RouteV3, Trade } from '@uniswap/router-sdk'
import { BigintIsh, Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { encodeRouteToPath, Position, Trade as V3Trade } from '@uniswap/v3-sdk'
import IXXXFund2 from 'abis/XXXFund2.json'
import { NULL_ADDRESS } from 'constants/addresses'
import JSBI from 'jsbi'
import invariant from 'tiny-invariant'

import { MethodParameters, toHex } from './utils/calldata'

const MaxUint128 = toHex(JSBI.subtract(JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)), JSBI.BigInt(1)))

enum SwapType {
  EXACT_INPUT_SINGLE_HOP,
  EXACT_INPUT_MULTI_HOP,
  EXACT_OUTPUT_SINGLE_HOP,
  EXACT_OUTPUT_MULTI_HOP,
}

/**
 * SwapParams for producing the arguments to send calls to the router.
 */
export interface SwapParams {
  swapType: SwapType
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

export interface MintPositionParams {
  investor: string
  token0: string
  token1: string
  fee: number
  tickLower: number
  tickUpper: number
  amount0Desired: string
  amount1Desired: string
  amount0Min: string
  amount1Min: string
  deadline: string
}

export interface IncreaseLiquidityParams {
  investor: string
  tokenId: string
  amount0Desired: string
  amount1Desired: string
  amount0Min: string
  amount1Min: string
  deadline: string
}

export interface CollectPositionFeeParams {
  investor: string
  tokenId: string
  amount0Max: string
  amount1Max: string
}

export interface DecreaseLiquidityParams {
  investor: string
  tokenId: string
  liquidity: string
  amount0Min: string
  amount1Min: string
  deadline: string
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

export interface MintSpecificOptions {
  /**
   * Creates pool if not initialized before mint.
   */
  createPool?: boolean
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
   * How much the pool price is allowed to move.
   */
  slippageTolerance: Percent

  /**
   * When the transaction expires, in epoch seconds.
   */
  deadline: BigintIsh
}

export type MintOptions = CommonAddLiquidityOptions & MintSpecificOptions
export type IncreaseOptions = CommonAddLiquidityOptions & IncreaseSpecificOptions

export type AddLiquidityOptions = MintOptions | IncreaseOptions

const ZERO = JSBI.BigInt(0)
const ONE = JSBI.BigInt(1)

// type guard
function isMint(options: AddLiquidityOptions): options is MintOptions {
  return Object.keys(options).some((k) => k === 'createPool')
}

export interface CollectOptions {
  /**
   * Indicates the ID of the position to collect for.
   */
  tokenId: BigintIsh

  /**
   * Expected value of tokensOwed0, including as-of-yet-unaccounted-for fees/liquidity value to be burned
   */
  expectedCurrencyOwed0: CurrencyAmount<Currency>

  /**
   * Expected value of tokensOwed1, including as-of-yet-unaccounted-for fees/liquidity value to be burned
   */
  expectedCurrencyOwed1: CurrencyAmount<Currency>

  /**
   * The account that should receive the tokens.
   */
  recipient: string
}

export interface NFTPermitOptions {
  v: 0 | 1 | 27 | 28
  r: string
  s: string
  deadline: BigintIsh
  spender: string
}

/**
 * Options for producing the calldata to exit a position.
 */
export interface RemoveLiquidityOptions {
  /**
   * The ID of the token to exit
   */
  tokenId: BigintIsh

  /**
   * The percentage of position liquidity to exit.
   */
  liquidityPercentage: Percent

  /**
   * How much the pool price is allowed to move.
   */
  slippageTolerance: Percent

  /**
   * When the transaction expires, in epoch seconds.
   */
  deadline: BigintIsh

  /**
   * Whether the NFT should be burned if the entire position is being exited, by default false.
   */
  burnToken?: boolean

  /**
   * The optional permit of the token ID being exited, in case the exit transaction is being sent by an account that does not own the NFT
   */
  permit?: NFTPermitOptions

  /**
   * Parameters to be passed on to collect
   */
  collectOptions: Omit<CollectOptions, 'tokenId'>
}

export abstract class XXXFund2 {
  public static INTERFACE: Interface = new Interface(IXXXFund2.abi)

  public static depositCallParameters(token: string, amount: CurrencyAmount<Currency>): MethodParameters {
    const calldata: string = XXXFund2.INTERFACE.encodeFunctionData('deposit', [token, toHex(amount.quotient)])
    const value: string = toHex(0)
    return {
      calldata,
      value,
    }
  }

  public static withdrawCallParameters(token: string, amount: CurrencyAmount<Currency>): MethodParameters {
    const calldata: string = XXXFund2.INTERFACE.encodeFunctionData('withdraw', [token, toHex(amount.quotient)])
    const value: string = toHex(0)
    return {
      calldata,
      value,
    }
  }

  public static feeOutCallParameters(token: string, amount: CurrencyAmount<Currency>): MethodParameters {
    const calldata: string = XXXFund2.INTERFACE.encodeFunctionData('feeOut', [token, toHex(amount.quotient)])
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
    fundAddress: string,
    investor: string,
    trade: V3Trade<Currency, Currency, TradeType>,
    options: SwapOptions
  ): SwapParams[] {
    const params: SwapParams[] = []

    for (const { route, inputAmount, outputAmount } of trade.swaps) {
      const amountIn: string = toHex(trade.maximumAmountIn(options.slippageTolerance, inputAmount).quotient)
      const amountOut: string = toHex(trade.minimumAmountOut(options.slippageTolerance, outputAmount).quotient)

      // flag for whether the trade is single hop or not
      const singleHop = route.pools.length === 1

      const recipient = fundAddress

      if (singleHop) {
        if (trade.tradeType === TradeType.EXACT_INPUT) {
          //exactInputSingleParams
          params.push({
            swapType: SwapType.EXACT_INPUT_SINGLE_HOP,
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
            swapType: SwapType.EXACT_OUTPUT_SINGLE_HOP,
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
            swapType: SwapType.EXACT_INPUT_MULTI_HOP,
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
            swapType: SwapType.EXACT_OUTPUT_MULTI_HOP,
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
    fundAddress: string,
    investor: string,
    trades:
      | Trade<Currency, Currency, TradeType>
      | V3Trade<Currency, Currency, TradeType>
      | V3Trade<Currency, Currency, TradeType>[],
    options: SwapOptions
  ): {
    params: SwapParams[]
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

    const params: SwapParams[] = []

    for (const trade of trades) {
      if (trade instanceof V3Trade) {
        for (const param of XXXFund2.encodeV3Swap(fundAddress, investor, trade, options)) {
          params.push(param)
        }
      } else {
        throw new Error('Unsupported trade object')
      }
    }

    return {
      params,
    }
  }

  public static swapCallParameters(
    fundAddress: string,
    investorAddress: string,
    trades:
      | Trade<Currency, Currency, TradeType>
      | V3Trade<Currency, Currency, TradeType>
      | V3Trade<Currency, Currency, TradeType>[],
    options: SwapOptions
  ): MethodParameters {
    const value = toHex(0)

    const { params } = XXXFund2.encodeSwaps(fundAddress, investorAddress, trades, options)

    return {
      calldata: XXXFund2.INTERFACE.encodeFunctionData('swap', [params]),
      value,
    }
  }

  public static addLiquidityCallParameters(
    investorAddress: string,
    position: Position,
    options: AddLiquidityOptions
  ): MethodParameters {
    invariant(JSBI.greaterThan(position.liquidity, ZERO), 'ZERO_LIQUIDITY')

    // get amounts
    const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts

    // adjust for slippage
    const minimumAmounts = position.mintAmountsWithSlippage(options.slippageTolerance)
    const amount0Min = toHex(minimumAmounts.amount0)
    const amount1Min = toHex(minimumAmounts.amount1)

    const deadline = toHex(options.deadline)

    // mint
    if (isMint(options)) {
      const params: MintPositionParams = {
        investor: investorAddress,
        token0: position.pool.token0.address,
        token1: position.pool.token1.address,
        fee: position.pool.fee,
        tickLower: position.tickLower,
        tickUpper: position.tickUpper,
        amount0Desired: toHex(amount0Desired),
        amount1Desired: toHex(amount1Desired),
        amount0Min,
        amount1Min,
        deadline,
      }

      return {
        calldata: XXXFund2.INTERFACE.encodeFunctionData('mintNewPosition', [params]),
        value: toHex(0),
      }
    } else {
      // increase
      const params: IncreaseLiquidityParams = {
        investor: investorAddress,
        tokenId: toHex(options.tokenId),
        amount0Desired: toHex(amount0Desired),
        amount1Desired: toHex(amount1Desired),
        amount0Min,
        amount1Min,
        deadline,
      }
      return {
        calldata: XXXFund2.INTERFACE.encodeFunctionData('increaseLiquidity', [params]),
        value: toHex(0),
      }
    }
  }

  public static collectPositionFeeCallParameters(investorAddress: string, options: CollectOptions): MethodParameters {
    const tokenId = toHex(options.tokenId)

    // collect
    const params: CollectPositionFeeParams = {
      investor: investorAddress,
      tokenId,
      amount0Max: MaxUint128,
      amount1Max: MaxUint128,
    }

    return {
      calldata: XXXFund2.INTERFACE.encodeFunctionData('collectPositionFee', [params]),
      value: toHex(0),
    }
  }

  public static decreaseLiquidityCallParameters(
    investorAddress: string,
    position: Position,
    options: RemoveLiquidityOptions
  ): MethodParameters {
    const deadline = toHex(options.deadline)
    const tokenId = toHex(options.tokenId)

    // construct a partial position with a percentage of liquidity
    const partialPosition = new Position({
      pool: position.pool,
      liquidity: options.liquidityPercentage.multiply(position.liquidity).quotient,
      tickLower: position.tickLower,
      tickUpper: position.tickUpper,
    })
    invariant(JSBI.greaterThan(partialPosition.liquidity, ZERO), 'ZERO_LIQUIDITY')

    // slippage-adjusted underlying amounts
    const { amount0: amount0Min, amount1: amount1Min } = partialPosition.burnAmountsWithSlippage(
      options.slippageTolerance
    )

    // remove liquidity
    const params: DecreaseLiquidityParams = {
      investor: investorAddress,
      tokenId,
      liquidity: toHex(partialPosition.liquidity),
      amount0Min: toHex(amount0Min),
      amount1Min: toHex(amount1Min),
      deadline,
    }

    return {
      calldata: XXXFund2.INTERFACE.encodeFunctionData('decreaseLiquidity', [params]),
      value: toHex(0),
    }
  }
}
