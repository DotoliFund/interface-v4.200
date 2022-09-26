import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import AddressInputPanel from 'components/AddressInputPanel'
import { PageName, SectionName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import {
  formatPercentInBasisPointsNumber,
  formatToDecimal,
  getDurationFromDateMilliseconds,
  getTokenAddress,
} from 'components/AmplitudeAnalytics/utils'
import { sendEvent } from 'components/analytics'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Loader from 'components/Loader'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import { AutoRow } from 'components/Row'
import { ArrowWrapper, PageWrapper, SwapWrapper } from 'components/swap/styleds'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TokensBanner from 'components/Tokens/TokensBanner'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import TokenWarningModal from 'components/TokenWarningModal'
import { MouseoverTooltip } from 'components/Tooltip'
import { NEWFUND_ADDRESS } from 'constants/addresses'
import { TOKEN_SHORTHANDS } from 'constants/tokens'
import { NavBarVariant, useNavBarFlag } from 'featureFlags/flags/navBar'
import { RedesignVariant, useRedesignFlag } from 'featureFlags/flags/redesign'
import { TokensVariant, useTokensFlag } from 'featureFlags/flags/tokens'
import { useAllTokens, useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useTokenContract } from 'hooks/useContract'
import useENSAddress from 'hooks/useENSAddress'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
import { XXXFund2 } from 'interface/XXXFund2'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ReactNode } from 'react'
import { ArrowDown, CheckCircle, HelpCircle } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { useToggleWalletModal } from 'state/application/hooks'
import {
  useDefaultsFromURLSearch,
  useDepositActionHandlers,
  useDepositState,
  useDerivedDepositInfo,
} from 'state/deposit/hooks'
import { InterfaceTrade } from 'state/routing/types'
import { TradeState } from 'state/routing/types'
import { Field } from 'state/swap/actions'
import { useExpertModeManager } from 'state/user/hooks'
import styled, { css, useTheme } from 'styled-components/macro'
import { LinkStyledButton, ThemedText } from 'theme'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { computeRealizedPriceImpact } from 'utils/prices'
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

export default function Deposit() {
  const navigate = useNavigate()
  const navBarFlag = useNavBarFlag()
  const navBarFlagEnabled = navBarFlag === NavBarVariant.Enabled
  const redesignFlag = useRedesignFlag()
  const redesignFlagEnabled = redesignFlag === RedesignVariant.Enabled
  const tokensFlag = useTokensFlag()
  const { account, chainId, provider } = useWeb3React()
  const loadedUrlParams = useDefaultsFromURLSearch()
  const [newSwapQuoteNeedsLogging, setNewSwapQuoteNeedsLogging] = useState(true)
  const [fetchingSwapQuoteStartTime, setFetchingSwapQuoteStartTime] = useState<Date | undefined>()

  // token warning stuff
  const [loadedInputCurrency] = [useCurrency(loadedUrlParams?.[Field.INPUT]?.currencyId)]
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency]?.filter((c): c is Token => c?.isToken ?? false) ?? [],
    [loadedInputCurrency]
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

  // swap state
  const { typedValue, recipient } = useDepositState()
  const { currencyBalances, parsedAmount, currencies, inputError: swapInputError } = useDerivedDepositInfo()

  // const {
  //   wrapType,
  //   execute: onWrap,
  //   inputError: wrapInputError,
  // } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  // const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const { address: recipientAddress } = useENSAddress(recipient)

  const parsedAmounts = useMemo(() => ({ [Field.INPUT]: parsedAmount }), [parsedAmount])

  // const [routeNotFound, routeIsLoading, routeIsSyncing] = useMemo(
  //   () => [!trade?.swaps, TradeState.LOADING === tradeState, TradeState.SYNCING === tradeState],
  //   [trade, tradeState]
  // )

  // show price estimates based on wrap trade
  // const inputValue = showWrap ? parsedAmount : trade?.inputAmount
  // const fiatValueInput = useStablecoinValue(inputValue)
  // const stablecoinPriceImpact = useMemo(
  //   () => (routeIsSyncing ? undefined : computeFiatValuePriceImpact(fiatValueInput, fiatValueOutput)),
  //   [fiatValueInput, routeIsSyncing]
  // )

  const { onCurrencySelection, onUserInput, onChangeRecipient } = useDepositActionHandlers()
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
    navigate('/deposit/')
  }, [navigate])

  // modal and loading
  const [{ showConfirm, swapErrorMessage, attemptingTxn, txHash }, setDepositState] = useState<{
    showConfirm: boolean
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const formattedAmounts = useMemo(
    () => ({
      [Field.INPUT]: typedValue,
    }),
    [typedValue]
  )

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT]),
    [currencyBalances]
  )
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))

  const [approvalState, approveCallback] = useApproveCallback(parsedAmounts[Field.INPUT], NEWFUND_ADDRESS)

  const handleApprove = useCallback(async () => {
    await approveCallback()
  }, [approveCallback])

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    approvalState === ApprovalState.NOT_APPROVED ||
    approvalState === ApprovalState.PENDING ||
    (approvalSubmitted && approvalState === ApprovalState.APPROVED)

  const currency = currencies[Field.INPUT]
  const tokenAddress = currency?.wrapped.address
  const tokenContract = useTokenContract(tokenAddress)

  async function onDeposit() {
    if (!chainId || !provider || !account) return
    if (!currency || !parsedAmount) return

    // if (!tokenContract) return
    // let useExact = false
    // const estimatedGas = await tokenContract.estimateGas.approve(NEWFUND_ADDRESS, MaxUint256).catch(() => {
    //   // general fallback for tokens which restrict approval amounts
    //   useExact = true
    //   return tokenContract.estimateGas.approve(NEWFUND_ADDRESS, parsedAmount.quotient.toString())
    // })

    // await tokenContract
    //   .approve(NEWFUND_ADDRESS, parsedAmount.quotient.toString(), {
    //     gasLimit: calculateGasMargin(estimatedGas),
    //   })
    //   .then((response) => {
    //     console.log(response)
    //   })
    //   .catch((error: Error) => {
    //     throw error
    //   })

    console.log(0)
    const { calldata, value } = XXXFund2.depositCallParameters(currency?.wrapped.address, parsedAmount)
    const txn: { to: string; data: string; value: string } = {
      to: NEWFUND_ADDRESS,
      data: calldata,
      value,
    }
    provider
      .getSigner()
      .estimateGas(txn)
      .then((estimate) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }
        return provider
          .getSigner()
          .sendTransaction(newTxn)
          .then((response) => {
            console.log(response)
          })
      })
      .catch((error) => {
        //setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }

  const addIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], null)

  //   return
  // }, [account, chainId, provider, parsedAmount, currency, tokenContract])

  // // the callback to execute the swap
  // const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(trade, allowedSlippage, recipient)

  // const handleSwap = useCallback(() => {
  //   if (!swapCallback) {
  //     return
  //   }
  //   // if (stablecoinPriceImpact && !confirmPriceImpactWithoutFee(stablecoinPriceImpact)) {
  //   //   return
  //   // }
  //   setDepositState({ attemptingTxn: true, showConfirm, swapErrorMessage: undefined, txHash: undefined })
  //   swapCallback()
  //     .then((hash) => {
  //       setDepositState({ attemptingTxn: false, showConfirm, swapErrorMessage: undefined, txHash: hash })
  //       // sendEvent({
  //       //   category: 'Swap',
  //       //   action: 'transaction hash',
  //       //   label: hash,
  //       // })
  //       // sendEvent({
  //       //   category: 'Swap',
  //       //   action:
  //       //     recipient === null
  //       //       ? 'Swap w/o Send'
  //       //       : (recipientAddress ?? recipient) === account
  //       //       ? 'Swap w/o Send + recipient'
  //       //       : 'Swap w/ Send',
  //       //   label: [TRADE_STRING, trade?.inputAmount?.currency?.symbol, trade?.outputAmount?.currency?.symbol, 'MH'].join(
  //       //     '/'
  //       //   ),
  //       // })
  //     })
  //     .catch((error) => {
  //       setDepositState({
  //         attemptingTxn: false,
  //         showConfirm,
  //         swapErrorMessage: error.message,
  //         txHash: undefined,
  //       })
  //     })
  // }, [swapCallback, showConfirm])

  // // warnings on the greater of fiat value price impact and execution price impact
  // const { priceImpactSeverity, largerPriceImpact } = useMemo(() => {
  //   const marketPriceImpact = trade?.priceImpact ? computeRealizedPriceImpact(trade) : undefined
  //   const largerPriceImpact = largerPercentValue(marketPriceImpact, stablecoinPriceImpact)
  //   return { priceImpactSeverity: warningSeverity(largerPriceImpact), largerPriceImpact }
  // }, [stablecoinPriceImpact, trade])

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(maxInputAmount.toExact())
    sendEvent({
      category: 'Deposit',
      action: 'Max',
    })
  }, [maxInputAmount, onUserInput])

  // const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])

  // const priceImpactTooHigh = priceImpactSeverity > 3 && !isExpertMode
  // const showPriceImpactWarning = largerPriceImpact && priceImpactSeverity > 3

  // // Handle time based logging events and event properties.
  // useEffect(() => {
  //   const now = new Date()
  //   // If a trade exists, and we need to log the receipt of this new swap quote:
  //   if (newSwapQuoteNeedsLogging && !!trade) {
  //     // Set the current datetime as the time of receipt of latest swap quote.
  //     setSwapQuoteReceivedDate(now)
  //     // Log swap quote.
  //     sendAnalyticsEvent(
  //       EventName.SWAP_QUOTE_RECEIVED,
  //       formatSwapQuoteReceivedEventProperties(trade, fetchingSwapQuoteStartTime)
  //     )
  //     // Latest swap quote has just been logged, so we don't need to log the current trade anymore
  //     // unless user inputs change again and a new trade is in the process of being generated.
  //     setNewSwapQuoteNeedsLogging(false)
  //     // New quote is not being fetched, so set start time of quote fetch to undefined.
  //     setFetchingSwapQuoteStartTime(undefined)
  //   }
  //   // If another swap quote is being loaded based on changed user inputs:
  //   if (routeIsLoading) {
  //     setNewSwapQuoteNeedsLogging(true)
  //     if (!fetchingSwapQuoteStartTime) setFetchingSwapQuoteStartTime(now)
  //   }
  // }, [
  //   newSwapQuoteNeedsLogging,
  //   routeIsSyncing,
  //   routeIsLoading,
  //   fetchingSwapQuoteStartTime,
  //   trade,
  //   setSwapQuoteReceivedDate,
  // ])

  const approveTokenButtonDisabled = approvalState !== ApprovalState.NOT_APPROVED || approvalSubmitted

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
            {/* <SwapHeader allowedSlippage={undefined} />
            <ConfirmSwapModal
              isOpen={showConfirm}
              trade={undefined}
              originalTrade={undefined}
              onAcceptChanges={handleAcceptChanges}
              attemptingTxn={attemptingTxn}
              txHash={txHash}
              recipient={recipient}
              allowedSlippage={undefined}
              onConfirm={handleDeposit}
              swapErrorMessage={swapErrorMessage}
              onDismiss={handleConfirmDismiss}
              swapQuoteReceivedDate={swapQuoteReceivedDate}
            /> */}
            <AutoColumn gap={'0px'}>
              <div style={{ display: 'relative' }}>
                <TopInputWrapper redesignFlag={redesignFlagEnabled}>
                  <Trace section={SectionName.CURRENCY_INPUT_PANEL}>
                    <CurrencyInputPanel
                      label={<Trans>deposit123</Trans>}
                      value={formattedAmounts[Field.INPUT]}
                      showMaxButton={showMaxButton}
                      currency={currencies[Field.INPUT] ?? null}
                      onUserInput={handleTypeInput}
                      onMax={handleMaxInput}
                      fiatValue={undefined}
                      onCurrencySelect={handleInputSelect}
                      otherCurrency={currencies[Field.INPUT]}
                      showCommonBases={true}
                      id={SectionName.CURRENCY_INPUT_PANEL}
                      loading={false}
                    />
                  </Trace>
                </TopInputWrapper>
              </div>
              <BottomWrapper redesignFlag={redesignFlagEnabled}>
                {redesignFlagEnabled && 'For'}
                <AutoColumn gap={redesignFlagEnabled ? '0px' : '8px'}>
                  <BottomInputWrapper redesignFlag={redesignFlagEnabled}>
                    {recipient !== null ? (
                      <>
                        <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                          <ArrowWrapper clickable={false} redesignFlag={redesignFlagEnabled}>
                            <ArrowDown size="16" color={theme.deprecated_text2} />
                          </ArrowWrapper>
                          <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                            <Trans>- Remove recipient</Trans>
                          </LinkStyledButton>
                        </AutoRow>
                        <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
                      </>
                    ) : null}
                    {/* {userHasSpecifiedInput && (
                      <SwapDetailsDropdown
                        trade={trade}
                        syncing={routeIsSyncing}
                        loading={routeIsLoading}
                        showInverted={showInverted}
                        setShowInverted={setShowInverted}
                        allowedSlippage={allowedSlippage}
                      />
                    )} */}
                    {/* {showPriceImpactWarning && <PriceImpactWarning priceImpact={largerPriceImpact} />} */}
                  </BottomInputWrapper>

                  <div>
                    {addIsUnsupported ? (
                      <ButtonPrimary disabled={true}>
                        <ThemedText.DeprecatedMain mb="4px">
                          <Trans>Unsupported Asset</Trans>
                        </ThemedText.DeprecatedMain>
                      </ButtonPrimary>
                    ) : !account ? (
                      <ButtonLight onClick={toggleWalletModal} redesignFlag={redesignFlagEnabled}>
                        <Trans>Connect Wallet</Trans>
                      </ButtonLight>
                    ) : showApproveFlow ? (
                      <AutoRow style={{ flexWrap: 'nowrap', width: '100%' }}>
                        <AutoColumn style={{ width: '100%' }} gap="12px">
                          <ButtonConfirmed
                            onClick={handleApprove}
                            disabled={approveTokenButtonDisabled}
                            width="100%"
                            altDisabledStyle={approvalState === ApprovalState.PENDING} // show solid button while waiting
                            confirmed={approvalState === ApprovalState.APPROVED}
                          >
                            <AutoRow justify="space-between" style={{ flexWrap: 'nowrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center' }}>
                                {/* we need to shorten this string on mobile */}
                                {approvalState === ApprovalState.APPROVED ? (
                                  <Trans>You can now trade {currencies[Field.INPUT]?.symbol}</Trans>
                                ) : (
                                  <Trans>
                                    Allow the Uniswap Protocol to use your {currencies[Field.INPUT]?.symbol}
                                  </Trans>
                                )}
                              </span>
                              {approvalState === ApprovalState.PENDING ? (
                                <Loader stroke="white" />
                              ) : approvalSubmitted && approvalState === ApprovalState.APPROVED ? (
                                <CheckCircle size="20" color={theme.deprecated_green1} />
                              ) : (
                                <MouseoverTooltip
                                  text={
                                    <Trans>
                                      You must give the Uniswap smart contracts permission to use your{' '}
                                      {currencies[Field.INPUT]?.symbol}. You only have to do this once per token.
                                    </Trans>
                                  }
                                >
                                  <HelpCircle size="20" color={'deprecated_white'} style={{ marginLeft: '8px' }} />
                                </MouseoverTooltip>
                              )}
                            </AutoRow>
                          </ButtonConfirmed>
                          <ButtonError
                            onClick={() => {
                              if (isExpertMode) {
                                //handleSwap()
                              } else {
                                onDeposit()
                                // setDepositState({
                                //   attemptingTxn: false,
                                //   swapErrorMessage: undefined,
                                //   showConfirm: true,
                                //   txHash: undefined,
                                // })
                              }
                            }}
                            width="100%"
                            id="swap-button"
                            disabled={!isValid || approvalState !== ApprovalState.APPROVED}
                            error={isValid}
                          >
                            <Text fontSize={16} fontWeight={500}>
                              <Trans>Deposit</Trans>
                            </Text>
                          </ButtonError>
                        </AutoColumn>
                      </AutoRow>
                    ) : (
                      <ButtonError
                        onClick={() => {
                          if (isExpertMode) {
                            //handleSwap()
                          } else {
                            onDeposit()
                            // setDepositState({
                            //   attemptingTxn: false,
                            //   swapErrorMessage: undefined,
                            //   showConfirm: true,
                            //   txHash: undefined,
                            // })
                          }
                        }}
                        id="swap-button"
                        disabled={!isValid}
                        error={isValid}
                      >
                        <Text fontSize={20} fontWeight={500}>
                          {swapInputError ? swapInputError : <Trans>Swap</Trans>}
                        </Text>
                      </ButtonError>
                    )}
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

// import { MaxUint256 } from '@ethersproject/constants'
// import Box from '@mui/material/Box'
// import Grid from '@mui/material/Grid'
// import Typography from '@mui/material/Typography'
// import { useWeb3React } from '@web3-react/core'
// import { CustomButton } from 'components/Button2'
// import CurrencyInputPanel from 'components/createFund/CurrencyInputPanel'
// import { NEWFUND_ADDRESS, XXXToken_ADDRESS } from 'constants/addresses'
// import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
// import { useXXXFactoryContract } from 'hooks/useContract'
// //import { useToggleWalletModal } from 'state/application/hooks'
// import { useTokenContract } from 'hooks/useContract'
// import useTransactionDeadline from 'hooks/useTransactionDeadline'
// import { useCallback } from 'react'
// import { useState } from 'react'
// import { useParams } from 'react-router-dom'
// import { useCreateActionHandlers, useCreateState, useDerivedCreateInfo } from 'state/create/hooks'
// import { useTransactionAdder } from 'state/transactions/hooks'
// import { calculateGasMargin } from 'utils/calculateGasMargin'

// export default function FundDeposit() {
//   const { account, chainId, provider } = useWeb3React()
//   const { onCurrencySelection, onUserInput, onChangeSender } = useCreateActionHandlers()
//   const factory = useXXXFactoryContract()
//   const addTransaction = useTransactionAdder()
//   //const toggleWalletModal = useToggleWalletModal()
//   const { currencyIdA, tokenId } = useParams<{ currencyIdA?: string; tokenId?: string }>()
//   //const baseCurrency = useCurrency(currencyIdA)

//   const handleCurrencySelect = useCallback(
//     (currency: string) => {
//       onCurrencySelection(currency)
//     },
//     [onCurrencySelection]
//   )

//   const handleTypeInput = useCallback(
//     (value: string) => {
//       onUserInput(value)
//     },
//     [onUserInput]
//   )

//   //TODO the graph
//   function isExistingFund(account: string): boolean {
//     return false
//   }

//   // modal and loading
//   const [showConfirm, setShowConfirm] = useState<boolean>(false)
//   const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

//   // txn values
//   const deadline = useTransactionDeadline() // custom from users settings
//   const [txHash, setTxHash] = useState<string>('')

//   // create state
//   const { inputCurrencyId, typedValue, sender } = useCreateState()
//   const { currency, currencyBalance, parsedAmount, inputError } = useDerivedCreateInfo()

//   const new_fund_address = NEWFUND_ADDRESS

//   // check whether the user has approved the router on the tokens
//   const [approval, approveCallback] = useApproveCallback(parsedAmount, new_fund_address)
//   // we need an existence check on parsed amounts for single-asset deposits
//   const showApproval = approval !== ApprovalState.APPROVED && !!parsedAmount

//   const tokenContract = useTokenContract(XXXToken_ADDRESS)

//   async function onDeposit() {
//     if (!chainId || !provider || !account) return
//     if (isExistingFund(account) || !parsedAmount) return
//     console.log(0)

//     if (!tokenContract) return
//     let useExact = false
//     const estimatedGas = await tokenContract.estimateGas.approve(new_fund_address, MaxUint256).catch(() => {
//       // general fallback for tokens which restrict approval amounts
//       useExact = true
//       return tokenContract.estimateGas.approve(new_fund_address, parsedAmount.quotient.toString())
//     })

//     await tokenContract
//       .approve(new_fund_address, parsedAmount.quotient.toString(), {
//         gasLimit: calculateGasMargin(estimatedGas),
//       })
//       .then((response) => {
//         const eventProperties = {
//           chain_id: chainId,
//           token_symbol: 'XXX',
//           token_address: '0xEAE906dC299ccd9Cd94584377d0F96Ce144c942f',
//         }
//         //sendAnalyticsEvent(EventName.APPROVE_TOKEN_TXN_SUBMITTED, eventProperties)
//         return {
//           response,
//           tokenAddress: '0xEAE906dC299ccd9Cd94584377d0F96Ce144c942f',
//           spenderAddress: new_fund_address,
//         }
//       })
//       .catch((error: Error) => {
//         throw error
//       })

//     console.log(1)
//     // if (!factory || !baseCurrency) {
//     //   return
//     // }
//     //if (currency && account && deadline) {

//     // if (factory && currency && account) {
//     //   console.log(3)
//     //   //const useNative = baseCurrency.isNative ? baseCurrency : undefined
//     //   const { calldata, value } = XXXFund.depositParameters(
//     //     account,
//     //     inputCurrencyId,
//     //     parsedAmount
//     //     //deadline: deadline,
//     //   )
//     //   const txn: { to: string; data: string; value: string } = {
//     //     to: new_fund_address,
//     //     data: calldata,
//     //     value,
//     //   }
//     //   // setAttemptingTxn(true)
//     //   provider
//     //     .getSigner()
//     //     .estimateGas(txn)
//     //     .then((estimate) => {
//     //       const newTxn = {
//     //         ...txn,
//     //         gasLimit: calculateGasMargin(estimate),
//     //       }
//     //       return provider
//     //         .getSigner()
//     //         .sendTransaction(newTxn)
//     //         .then((response: TransactionResponse) => {
//     //           console.log(response)
//     //           //setAttemptingTxn(false)
//     //           addTransaction(response, {
//     //             type: TransactionType.CREATE_FUND,
//     //           })
//     //           setTxHash(response.hash)
//     //           // sendEvent({
//     //           //   category: 'Fund',
//     //           //   action: 'Create',
//     //           //   label: ['test11111', 'test22222'].join('/'),
//     //           // })
//     //         })
//     //     })
//     //     .catch((error) => {
//     //       console.error('Failed to send transaction', error)
//     //       //setAttemptingTxn(false)
//     //       // we only care if the error is something _other_ than the user rejected the tx
//     //       if (error?.code !== 4001) {
//     //         console.error(error)
//     //       }
//     //     })
//     // } else {
//     //   return
//     // }
//   }

//   return (
//     <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center">
//       <Grid item xs={3}>
//         <Box
//           sx={{
//             width: 500,
//             height: 260,
//             mt: 12,
//             px: 1,
//             backgroundColor: 'success.main',
//             borderRadius: '18px',
//             display: 'flex',
//             flexDirection: 'column',
//           }}
//         >
//           <Typography variant="button" display="block" gutterBottom sx={{ mt: 2 }}>
//             Deposit
//           </Typography>
//           <CurrencyInputPanel
//             value={typedValue}
//             onUserInput={handleTypeInput}
//             onCurrencySelect={handleCurrencySelect}
//             currency={inputCurrencyId}
//           />
//           {(approval === ApprovalState.NOT_APPROVED || approval === ApprovalState.PENDING) && showApproval ? (
//             <CustomButton onClick={() => approveCallback()} disabled={approval === ApprovalState.PENDING}>
//               {approval === ApprovalState.PENDING ? (
//                 <Typography>Approving {inputCurrencyId}</Typography>
//               ) : (
//                 <Typography>Approve {inputCurrencyId}</Typography>
//               )}
//             </CustomButton>
//           ) : (
//             <CustomButton onClick={() => onDeposit()}>Deposit</CustomButton>
//           )}
//         </Box>
//       </Grid>
//     </Grid>
//   )
// }
