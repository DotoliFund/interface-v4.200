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
import { TOKEN_SHORTHANDS } from 'constants/tokens'
import { NavBarVariant, useNavBarFlag } from 'featureFlags/flags/navBar'
import { RedesignVariant, useRedesignFlag } from 'featureFlags/flags/redesign'
import { TokensVariant, useTokensFlag } from 'featureFlags/flags/tokens'
import { useAllTokens, useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
import { XXXFund2 } from 'interface/XXXFund2'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ReactNode } from 'react'
import { ArrowDown, CheckCircle, HelpCircle } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useParams } from 'react-router-dom'
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
  const params = useParams()
  const fundAddress = params.fundAddress
  const investorAddress = params.investorAddress
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

  const parsedAmounts = useMemo(() => ({ [Field.INPUT]: parsedAmount }), [parsedAmount])

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

  const [approvalState, approveCallback] = useApproveCallback(parsedAmounts[Field.INPUT], fundAddress)

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

  async function onDeposit() {
    if (!chainId || !provider || !account) return
    if (!currency || !parsedAmount || !fundAddress || !tokenAddress) return

    console.log(tokenAddress)
    const { calldata, value } = XXXFund2.depositCallParameters(tokenAddress, parsedAmount)
    const txn: { to: string; data: string; value: string } = {
      to: fundAddress,
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
        <PageWrapper>
          <SwapWrapper id="swap-page">
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
                          <ArrowWrapper clickable={false}>
                            <ArrowDown size="16" color={theme.deprecated_text2} />
                          </ArrowWrapper>
                          <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                            <Trans>- Remove recipient</Trans>
                          </LinkStyledButton>
                        </AutoRow>
                        <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
                      </>
                    ) : null}
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
                          {swapInputError ? swapInputError : <Trans>Deposit</Trans>}
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
