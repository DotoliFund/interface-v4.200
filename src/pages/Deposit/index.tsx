import type { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PageName, SectionName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { sendEvent } from 'components/analytics'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Loader from 'components/Loader'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import { AutoRow } from 'components/Row'
import { RowBetween, RowFixed } from 'components/Row'
import { PageWrapper, SwapWrapper } from 'components/swap/styleds'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { DotoliFund } from 'interface/DotoliFund'
import { toHex } from 'interface/utils/calldata'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ReactNode } from 'react'
import { CheckCircle, HelpCircle } from 'react-feather'
import { useNavigate, useParams } from 'react-router-dom'
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
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { maxAmountSpend } from 'utils/maxAmountSpend'

const StyledDepositHeader = styled.div`
  padding: 8px 12px;
  margin-bottom: 8px;
  width: 100%;
  color: ${({ theme }) => theme.deprecated_text2};
`

const DepositSection = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.backgroundModule};
  border-radius: 12px;
  padding: 16px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  &:before {
    box-sizing: border-box;
    background-size: 100%;
    border-radius: inherit;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    content: '';
    border: 1px solid ${({ theme }) => theme.backgroundModule};
  }
  &:hover:before {
    border-color: ${({ theme }) => theme.stateOverlayHover};
  }
  &:focus-within:before {
    border-color: ${({ theme }) => theme.stateOverlayPressed};
  }
`

export function getIsValidSwapQuote(
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined,
  tradeState: TradeState,
  swapInputError?: ReactNode
): boolean {
  return !!swapInputError && !!trade && (tradeState === TradeState.VALID || tradeState === TradeState.SYNCING)
}

export default function Deposit() {
  const params = useParams()
  const fundAddress = params.fundAddress
  const investorAddress = params.investorAddress
  const { account, chainId, provider } = useWeb3React()
  const loadedUrlParams = useDefaultsFromURLSearch()
  const navigate = useNavigate()

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  const theme = useTheme()

  // toggle wallet when disconnected
  const toggleWalletModal = useToggleWalletModal()

  // for expert mode
  const [isExpertMode] = useExpertModeManager()

  // Deposit state
  const { typedValue } = useDepositState()
  const { currencyBalances, parsedAmount, currencies, inputError: swapInputError } = useDerivedDepositInfo()
  const parsedAmounts = useMemo(() => ({ [Field.INPUT]: parsedAmount }), [parsedAmount])
  const fiatValueInput = useStablecoinValue(parsedAmounts[Field.INPUT])

  const { onCurrencySelection, onUserInput } = useDepositActionHandlers()
  const isValid = !swapInputError
  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(value)
    },
    [onUserInput]
  )

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

    let txn = {}
    if (currency?.isNative) {
      txn = {
        from: account,
        to: fundAddress,
        value: toHex(parsedAmount.quotient),
      }
    } else {
      const { calldata, value } = DotoliFund.depositCallParameters(tokenAddress, parsedAmount)
      txn = {
        to: fundAddress,
        data: calldata,
        value,
      }
    }

    setAttemptingTxn(true)

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
          .then((response: TransactionResponse) => {
            setAttemptingTxn(false)
            // addTransaction(response, {
            //   type: TransactionType.ADD_LIQUIDITY_V3_POOL,
            //   baseCurrencyId: currencyId(baseCurrency),
            //   quoteCurrencyId: currencyId(quoteCurrency),
            //   createPool: Boolean(noLiquidity),
            //   expectedAmountBaseRaw: parsedAmounts[Field.CURRENCY_A]?.quotient?.toString() ?? '0',
            //   expectedAmountQuoteRaw: parsedAmounts[Field.CURRENCY_B]?.quotient?.toString() ?? '0',
            //   feeAmount: position.pool.fee,
            // })
            // setTxHash(response.hash)
            // sendEvent({
            //   category: 'Liquidity',
            //   action: 'Add',
            //   label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/'),
            // })
          })
      })
      .catch((error) => {
        setAttemptingTxn(false)
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

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings

  const [txHash, setTxHash] = useState<string>('')

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    if (txHash) {
      navigate(`/deposit/${fundAddress}/${investorAddress}`)
    }
    setTxHash('')
  }, [navigate, txHash, fundAddress, investorAddress])

  const pendingText = 'pendingText test'

  return (
    <Trace page={PageName.SWAP_PAGE} shouldLogImpression>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={() => (
          <ConfirmationModalContent
            title={<Trans>Deposit</Trans>}
            onDismiss={handleDismissConfirmation}
            topContent={() => (
              <></>
              // <Review
              //   parsedAmounts={parsedAmounts}
              //   position={position}
              //   existingPosition={existingPosition}
              //   priceLower={priceLower}
              //   priceUpper={priceUpper}
              //   outOfRange={outOfRange}
              //   ticksAtLimit={ticksAtLimit}
              // />
            )}
            bottomContent={() => (
              <ButtonPrimary style={{ marginTop: '1rem' }} onClick={undefined}>
                <Text fontWeight={500} fontSize={20}>
                  <Trans>Add</Trans>
                </Text>
              </ButtonPrimary>
            )}
          />
        )}
        pendingText={pendingText}
        currencyToAdd={undefined}
      />
      <PageWrapper>
        <SwapWrapper id="swap-page">
          <StyledDepositHeader>
            <RowBetween>
              <RowFixed>
                <ThemedText.DeprecatedBlack fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
                  <Trans>Deposit</Trans>
                </ThemedText.DeprecatedBlack>
              </RowFixed>
            </RowBetween>
          </StyledDepositHeader>
          <AutoColumn gap={'6px'}>
            <div style={{ display: 'relative' }}>
              <DepositSection>
                <Trace section={SectionName.CURRENCY_INPUT_PANEL}>
                  <CurrencyInputPanel
                    label={<Trans>Deposit</Trans>}
                    value={formattedAmounts[Field.INPUT]}
                    showMaxButton={showMaxButton}
                    currency={currencies[Field.INPUT] ?? null}
                    onUserInput={handleTypeInput}
                    onMax={handleMaxInput}
                    fiatValue={fiatValueInput ?? undefined}
                    onCurrencySelect={handleInputSelect}
                    otherCurrency={currencies[Field.INPUT]}
                    showCommonBases={true}
                    id={SectionName.CURRENCY_INPUT_PANEL}
                    loading={false}
                  />
                </Trace>
              </DepositSection>
            </div>
            <div>
              {addIsUnsupported ? (
                <ButtonPrimary disabled={true}>
                  <ThemedText.DeprecatedMain mb="4px">
                    <Trans>Unsupported Asset</Trans>
                  </ThemedText.DeprecatedMain>
                </ButtonPrimary>
              ) : !account ? (
                <ButtonLight onClick={toggleWalletModal}>
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
                            <Trans>You can now deposit {currencies[Field.INPUT]?.symbol}</Trans>
                          ) : (
                            <Trans>Allow the Dotoli Protocol to use your {currencies[Field.INPUT]?.symbol}</Trans>
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
                                You must give the Dotoli smart contracts permission to use your{' '}
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
        </SwapWrapper>
        <NetworkAlert />
      </PageWrapper>
      <SwitchLocaleLink />
    </Trace>
  )
}
