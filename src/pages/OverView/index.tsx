import { Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ElementName, Event, EventName, PageName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { TraceEvent } from 'components/AmplitudeAnalytics/TraceEvent'
import {
  formatPercentInBasisPointsNumber,
  formatToDecimal,
  getDurationFromDateMilliseconds,
  getTokenAddress,
} from 'components/AmplitudeAnalytics/utils'
import { sendEvent } from 'components/analytics'
import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import ConfirmSwapModal from 'components/swap/ConfirmSwapModal'
import { PageWrapper, SwapCallbackError, SwapWrapper } from 'components/swap/styleds'
import SwapHeader from 'components/swap/SwapHeader'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TokensBanner from 'components/Tokens/TokensBanner'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import TokenWarningModal from 'components/TokenWarningModal'
import { TOKEN_SHORTHANDS } from 'constants/tokens'
import { NavBarVariant, useNavBarFlag } from 'featureFlags/flags/navBar'
import { RedesignVariant, useRedesignFlag } from 'featureFlags/flags/redesign'
import { TokensVariant, useTokensFlag } from 'featureFlags/flags/tokens'
import { useAllTokens, useCurrency } from 'hooks/Tokens'
import useENSAddress from 'hooks/useENSAddress'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useWrapCallback, { WrapErrorText, WrapType } from 'hooks/useWrapCallback'
import JSBI from 'jsbi'
import { useCallback, useMemo, useState } from 'react'
import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { useToggleWalletModal } from 'state/application/hooks'
import {
  useDefaultsFromURLSearch,
  useDepositActionHandlers,
  useDepositState,
  useDerivedDepositInfo,
} from 'state/deposit/hooks'
import { useExpertModeManager } from 'state/user/hooks'
import styled, { css, useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { computeFiatValuePriceImpact } from 'utils/computeFiatValuePriceImpact'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { computeRealizedPriceImpact, warningSeverity } from 'utils/prices'
import { supportedChainId } from 'utils/supportedChainId'

const ArrowContainer = styled.div`
  display: inline-block;
  margin-left: 6%;
`
const ArrowDownWrapper = styled.div`
  margin-top: -80%;
  margin-left: 24%;
`
const ArrowUpWrapper = styled.div`
  margin-left: 56%;
  margin-top: -18%;
`
const BottomWrapper = styled.div<{ redesignFlag: boolean }>`
  ${({ redesignFlag }) =>
    redesignFlag &&
    css`
      background-color: ${({ theme }) => theme.backgroundModule};
      border-radius: 12px;
      padding: 8px 12px 10px;
      color: ${({ theme }) => theme.textSecondary};
      font-size: 14px;
      line-height: 20px;
      font-weight: 500;
    `}
`
const TopInputWrapper = styled.div<{ redesignFlag: boolean }>`
  padding: ${({ redesignFlag }) => redesignFlag && '0px 12px'};
  visibility: ${({ redesignFlag }) => !redesignFlag && 'none'};
`
const BottomInputWrapper = styled.div<{ redesignFlag: boolean }>`
  padding: ${({ redesignFlag }) => redesignFlag && '8px 0px'};
`

export function getIsValidSwapQuote(
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined,
  tradeState: TradeState,
  swapInputError?: ReactNode
): boolean {
  return !!swapInputError && !!trade && (tradeState === TradeState.VALID || tradeState === TradeState.SYNCING)
}

function largerPercentValue(a?: Percent, b?: Percent) {
  if (a && b) {
    return a.greaterThan(b) ? a : b
  } else if (a) {
    return a
  } else if (b) {
    return b
  }
  return undefined
}

const formatSwapQuoteReceivedEventProperties = (
  trade: InterfaceTrade<Currency, Currency, TradeType>,
  fetchingSwapQuoteStartTime: Date | undefined
) => {
  return {
    token_in_symbol: trade.inputAmount.currency.symbol,
    token_out_symbol: trade.outputAmount.currency.symbol,
    token_in_address: getTokenAddress(trade.inputAmount.currency),
    token_out_address: getTokenAddress(trade.outputAmount.currency),
    price_impact_basis_points: trade ? formatPercentInBasisPointsNumber(computeRealizedPriceImpact(trade)) : undefined,
    estimated_network_fee_usd: trade.gasUseEstimateUSD ? formatToDecimal(trade.gasUseEstimateUSD, 2) : undefined,
    chain_id:
      trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
        ? trade.inputAmount.currency.chainId
        : undefined,
    token_in_amount: formatToDecimal(trade.inputAmount, trade.inputAmount.currency.decimals),
    token_out_amount: formatToDecimal(trade.outputAmount, trade.outputAmount.currency.decimals),
    quote_latency_milliseconds: fetchingSwapQuoteStartTime
      ? getDurationFromDateMilliseconds(fetchingSwapQuoteStartTime)
      : undefined,
  }
}

const TRADE_STRING = 'SwapRouter'

export default function Swap() {
  const navigate = useNavigate()
  const navBarFlag = useNavBarFlag()
  const navBarFlagEnabled = navBarFlag === NavBarVariant.Enabled
  const redesignFlag = useRedesignFlag()
  const redesignFlagEnabled = redesignFlag === RedesignVariant.Enabled
  const tokensFlag = useTokensFlag()
  const { account, chainId } = useWeb3React()
  const loadedUrlParams = useDefaultsFromURLSearch()
  const [newSwapQuoteNeedsLogging, setNewSwapQuoteNeedsLogging] = useState(true)
  const [fetchingSwapQuoteStartTime, setFetchingSwapQuoteStartTime] = useState<Date | undefined>()

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.[Field.INPUT]?.currencyId),
    useCurrency(loadedUrlParams?.[Field.OUTPUT]?.currencyId),
  ]
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c?.isToken ?? false) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useAllTokens()
  const importTokensNotInDefault = useMemo(
    () =>
      urlLoadedTokens &&
      urlLoadedTokens
        .filter((token: Token) => {
          return !Boolean(token.address in defaultTokens)
        })
        .filter((token: Token) => {
          // Any token addresses that are loaded from the shorthands map do not need to show the import URL
          const supported = supportedChainId(chainId)
          if (!supported) return true
          return !Object.keys(TOKEN_SHORTHANDS).some((shorthand) => {
            const shorthandTokenAddress = TOKEN_SHORTHANDS[shorthand][supported]
            return shorthandTokenAddress && shorthandTokenAddress === token.address
          })
        }),
    [chainId, defaultTokens, urlLoadedTokens]
  )

  const theme = useTheme()

  // toggle wallet when disconnected
  const toggleWalletModal = useToggleWalletModal()

  // for expert mode
  const [isExpertMode] = useExpertModeManager()

  // deposit state
  const { typedValue, recipient } = useDepositState()
  const { currencyBalances, parsedAmount, currency, inputError: swapInputError } = useDerivedDepositInfo()

  const { wrapType, execute: onWrap, inputError: wrapInputError } = useWrapCallback(currency, typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const { address: recipientAddress } = useENSAddress(recipient)

  const parsedAmounts = useMemo(
    () =>
      showWrap
        ? {
            [Field.INPUT]: parsedAmount,
            [Field.OUTPUT]: parsedAmount,
          }
        : {
            [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
            [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
          },
    [independentField, parsedAmount, showWrap, trade]
  )

  // show price estimates based on wrap trade
  const inputValue = showWrap ? parsedAmount : trade?.inputAmount
  const outputValue = showWrap ? parsedAmount : trade?.outputAmount
  const fiatValueInput = useStablecoinValue(inputValue)
  const fiatValueOutput = useStablecoinValue(outputValue)
  const stablecoinPriceImpact = useMemo(
    () => computeFiatValuePriceImpact(fiatValueInput, fiatValueOutput),
    [fiatValueInput, fiatValueOutput]
  )

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useDepositActionHandlers()
  const isValid = !swapInputError

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(value)
    },
    [onUserInput]
  )

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
    navigate('/swap/')
  }, [navigate])

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Trade<Currency, Currency, TradeType> | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const userHasSpecifiedInputOutput = Boolean(currency && parsedAmounts?.greaterThan(JSBI.BigInt(0)))

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(currencyBalances),
    [currencyBalances]
  )
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts?.equalTo(maxInputAmount))

  //TODO : change investor
  const investor = '0x1234'

  // the callback to execute the swap
  const { callback: depositCallback, error: depositCallbackError } = useDepositCallback(recipient, investor)

  const handleSwap = useCallback(() => {
    // if (!swapCallback) {
    //   return
    // }
    // setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
    // swapCallback()
    //   .then((hash: any) => {
    //     setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash })
    //     sendEvent({
    //       category: 'Swap',
    //       action: 'transaction hash',
    //       label: hash,
    //     })
    //     sendEvent({
    //       category: 'Swap',
    //       action:
    //         recipient === null
    //           ? 'Swap w/o Send'
    //           : (recipientAddress ?? recipient) === account
    //           ? 'Swap w/o Send + recipient'
    //           : 'Swap w/ Send',
    //       label: [TRADE_STRING, trade?.inputAmount?.currency?.symbol, trade?.outputAmount?.currency?.symbol, 'MH'].join(
    //         '/'
    //       ),
    //     })
    //   })
    //   .catch((error: any) => {
    //     setSwapState({
    //       attemptingTxn: false,
    //       tradeToConfirm,
    //       showConfirm,
    //       swapErrorMessage: error.message,
    //       txHash: undefined,
    //     })
    //   })
    //}, [swapCallback, showConfirm, recipient, recipientAddress, account])
  }, [])

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const [swapQuoteReceivedDate, setSwapQuoteReceivedDate] = useState<Date | undefined>()

  // warnings on the greater of fiat value price impact and execution price impact
  const { priceImpactSeverity, largerPriceImpact } = useMemo(() => {
    const marketPriceImpact = trade?.priceImpact ? computeRealizedPriceImpact(trade) : undefined
    const largerPriceImpact = largerPercentValue(marketPriceImpact, stablecoinPriceImpact)
    return { priceImpactSeverity: warningSeverity(largerPriceImpact), largerPriceImpact }
  }, [stablecoinPriceImpact, trade])

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput('')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash])

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      onCurrencySelection(inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(maxInputAmount.toExact())
    sendEvent({
      category: 'Swap',
      action: 'Max',
    })
  }, [maxInputAmount, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency: Currency) => onCurrencySelection(outputCurrency),
    [onCurrencySelection]
  )

  return (
    <Trace page={PageName.SWAP_PAGE} shouldLogImpression>
      <>
        {tokensFlag === TokensVariant.Enabled && <TokensBanner />}
        {redesignFlagEnabled ? (
          <TokenSafetyModal
            isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
            tokenAddress={importTokensNotInDefault[0]?.address}
            secondTokenAddress={importTokensNotInDefault[1]?.address}
            onContinue={handleConfirmTokenWarning}
            onCancel={handleDismissTokenWarning}
            showCancel={true}
          />
        ) : (
          <TokenWarningModal
            isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
            tokens={importTokensNotInDefault}
            onConfirm={handleConfirmTokenWarning}
            onDismiss={handleDismissTokenWarning}
          />
        )}
        <PageWrapper redesignFlag={redesignFlagEnabled} navBarFlag={navBarFlagEnabled}>
          <SwapWrapper id="swap-page" redesignFlag={redesignFlagEnabled}>
            <SwapHeader allowedSlippage={allowedSlippage} />
            <ConfirmSwapModal
              isOpen={showConfirm}
              trade={trade}
              originalTrade={tradeToConfirm}
              onAcceptChanges={handleAcceptChanges}
              attemptingTxn={attemptingTxn}
              txHash={txHash}
              recipient={recipient}
              allowedSlippage={allowedSlippage}
              onConfirm={handleSwap}
              swapErrorMessage={swapErrorMessage}
              onDismiss={handleConfirmDismiss}
              swapQuoteReceivedDate={swapQuoteReceivedDate}
            />
            <AutoColumn gap={'0px'}>
              <div style={{ display: 'relative' }}>
                <TopInputWrapper redesignFlag={redesignFlagEnabled}></TopInputWrapper>
              </div>
              <BottomWrapper redesignFlag={redesignFlagEnabled}>
                {redesignFlagEnabled && 'For'}
                <AutoColumn gap={redesignFlagEnabled ? '0px' : '8px'}>
                  <div>
                    {!account ? (
                      <TraceEvent
                        events={[Event.onClick]}
                        name={EventName.CONNECT_WALLET_BUTTON_CLICKED}
                        properties={{ received_swap_quote: getIsValidSwapQuote(trade, tradeState, swapInputError) }}
                        element={ElementName.CONNECT_WALLET_BUTTON}
                      >
                        <ButtonLight onClick={toggleWalletModal} redesignFlag={redesignFlagEnabled}>
                          <Trans>Connect Wallet</Trans>
                        </ButtonLight>
                      </TraceEvent>
                    ) : showWrap ? (
                      <ButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap}>
                        {wrapInputError ? (
                          <WrapErrorText wrapInputError={wrapInputError} />
                        ) : wrapType === WrapType.WRAP ? (
                          <Trans>Wrap</Trans>
                        ) : wrapType === WrapType.UNWRAP ? (
                          <Trans>Unwrap</Trans>
                        ) : null}
                      </ButtonPrimary>
                    ) : userHasSpecifiedInputOutput ? (
                      <GreyCard style={{ textAlign: 'center' }}>
                        <ThemedText.DeprecatedMain mb="4px">
                          <Trans>Insufficient liquidity for this trade.</Trans>
                        </ThemedText.DeprecatedMain>
                      </GreyCard>
                    ) : (
                      <ButtonError
                        onClick={() => {
                          if (isExpertMode) {
                            handleSwap()
                          } else {
                            setSwapState({
                              tradeToConfirm: trade,
                              attemptingTxn: false,
                              swapErrorMessage: undefined,
                              showConfirm: true,
                              txHash: undefined,
                            })
                          }
                        }}
                        id="swap-button"
                        disabled={!isValid}
                        error={isValid && priceImpactSeverity > 2}
                      >
                        <Text fontSize={20} fontWeight={500}>
                          {swapInputError ? swapInputError : <Trans>Swap</Trans>}
                        </Text>
                      </ButtonError>
                    )}
                    {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
                  </div>
                </AutoColumn>
              </BottomWrapper>
            </AutoColumn>
          </SwapWrapper>
          <NetworkAlert />
        </PageWrapper>
        <SwitchLocaleLink />
      </>
    </Trace>
  )
}
