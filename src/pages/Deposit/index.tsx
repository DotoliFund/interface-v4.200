import type { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PageName, SectionName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { sendEvent } from 'components/analytics'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import DepositCurrencyInputPanel from 'components/CurrencyInputPanel/DepositInputPanel'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import { RowBetween, RowFixed } from 'components/Row'
import { PageWrapper, SwapWrapper as DepositWrapper } from 'components/swap/styleds'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from 'components/TransactionConfirmationModal'
import { DOTOLI_FUND_ADDRESSES } from 'constants/addresses'
import { isSupportedChain } from 'constants/chains'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { DotoliFund } from 'interface/DotoliFund'
import { toHex } from 'interface/utils/calldata'
import JSBI from 'jsbi'
import { ErrorContainer, NetworkIcon } from 'pages/Account'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Info } from 'react-feather'
import { Link, useParams } from 'react-router-dom'
import { Text } from 'rebass'
import { useToggleWalletModal } from 'state/application/hooks'
import { useDepositActionHandlers, useDepositState, useDerivedDepositInfo } from 'state/deposit/hooks'
import { Field } from 'state/swap/actions'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import Loader from '../../components/Loader'

const StyledDepositHeader = styled.div`
  padding: 8px 12px;
  margin-bottom: 8px;
  width: 100%;
  color: ${({ theme }) => theme.deprecated_text4};
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

const HoverText = styled(ThemedText.DeprecatedMain)`
  text-decoration: none;
  color: ${({ theme }) => theme.deprecated_text4};
  :hover {
    color: ${({ theme }) => theme.deprecated_text4};
    text-decoration: none;
  }
`

export default function Deposit() {
  const params = useParams()
  const fundId = params.fundId
  const investor = params.investor
  const { account, chainId, provider } = useWeb3React()

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)
  const [depositErrorMessage, setDepositErrorMessage] = useState<string | undefined>(undefined)
  const [txHash, setTxHash] = useState<string | undefined>(undefined)

  const theme = useTheme()

  // toggle wallet when disconnected
  const toggleWalletModal = useToggleWalletModal()

  // Deposit state
  const { typedValue } = useDepositState()
  const { currencyBalances, parsedAmount, currencies, inputError: depositInputError } = useDerivedDepositInfo()
  const parsedAmounts = useMemo(() => ({ [Field.INPUT]: parsedAmount }), [parsedAmount])
  const fiatValueInput = useStablecoinValue(parsedAmounts[Field.INPUT])

  const { onCurrencySelection, onUserInput } = useDepositActionHandlers()
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

  const [approvalState, approveCallback] = useApproveCallback(parsedAmounts[Field.INPUT], DOTOLI_FUND_ADDRESSES)

  const handleApprove = useCallback(async () => {
    try {
      await approveCallback()
    } catch (e) {
      console.error(e)
    }
  }, [approveCallback])

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  const currency = currencies[Field.INPUT]
  const tokenAddress = currency?.wrapped.address

  const addTransaction = useTransactionAdder()

  async function onDeposit() {
    if (!chainId || !provider || !account) return
    if (!currency || !parsedAmount || !fundId || !tokenAddress) return

    let txn = {}
    if (currency?.isNative) {
      // if transfer ETH, must send data which is fundId
      txn = {
        from: account,
        to: DOTOLI_FUND_ADDRESSES,
        value: toHex(parsedAmount.quotient),
        data: toHex(JSBI.BigInt(fundId)),
      }
    } else {
      const { calldata, value } = DotoliFund.depositCallParameters(fundId, tokenAddress, parsedAmount)
      txn = {
        to: DOTOLI_FUND_ADDRESSES,
        data: calldata,
        value,
      }
    }

    const amount = parsedAmount.quotient.toString()
    //const decimal = 10 ** parsedAmount.currency.decimals
    //const deAmount = amount / decimal

    setAttemptingTxn(true)
    setShowConfirm(true)

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
            addTransaction(response, {
              type: TransactionType.DEPOSIT,
              tokenAddress,
              amountRaw: amount,
            })
            setTxHash(response.hash)
            // sendEvent({
            //   category: 'Liquidity',
            //   action: 'Add',
            //   label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/'),
            // })
          })
      })
      .catch(() => {
        setAttemptingTxn(false)
        //setDepositErrorMessage(error.message)
        setDepositErrorMessage('Deposit failed')
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

  const handleDismissConfirmation = () => {
    setShowConfirm(false)
    setTxHash('')
  }

  if (!isSupportedChain(chainId)) {
    return (
      <ErrorContainer>
        <ThemedText.DeprecatedBody color={theme.deprecated_text4} textAlign="center">
          <NetworkIcon strokeWidth={1.2} />
          <div data-testid="pools-unsupported-err">
            <Trans>Your connected network is unsupported.</Trans>
          </div>
        </ThemedText.DeprecatedBody>
      </ErrorContainer>
    )
  } else {
    return (
      <Trace page={PageName.DEPOSIT_PAGE} shouldLogImpression>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={() => {
            handleDismissConfirmation()
          }}
          attemptingTxn={attemptingTxn}
          hash={txHash}
          content={() =>
            depositErrorMessage ? (
              <TransactionErrorContent onDismiss={handleDismissConfirmation} message={depositErrorMessage} />
            ) : (
              <ConfirmationModalContent
                title={<Trans>Confirm Deposit</Trans>}
                onDismiss={handleDismissConfirmation}
                topContent={() => {
                  return null
                }}
                bottomContent={() => {
                  return null
                }}
              />
            )
          }
          pendingText={<Trans>Depositing</Trans>}
          currencyToAdd={undefined}
        />

        <PageWrapper>
          <Link
            data-cy="visit-pool"
            style={{ textDecoration: 'none', width: 'fit-content', marginBottom: '0.5rem' }}
            to={`/fund/${fundId}/${investor}`}
          >
            <HoverText>
              <ThemedText.DeprecatedDarkGray>
                <Trans>← Go Back</Trans>
              </ThemedText.DeprecatedDarkGray>
            </HoverText>
          </Link>
          <br></br>
          <DepositWrapper id="deposit-page">
            <StyledDepositHeader>
              <RowBetween>
                <RowFixed>
                  <ThemedText.DeprecatedBlack fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
                    <Trans>Deposit</Trans>
                  </ThemedText.DeprecatedBlack>
                </RowFixed>
              </RowBetween>
            </StyledDepositHeader>
            <AutoColumn gap="6px">
              <div style={{ display: 'relative' }}>
                <DepositSection>
                  <Trace section={SectionName.CURRENCY_INPUT_PANEL}>
                    <DepositCurrencyInputPanel
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
                ) : approvalState === ApprovalState.NOT_APPROVED ? (
                  <ButtonPrimary onClick={handleApprove} disabled={false} width="100%" style={{ gap: 14 }}>
                    <div style={{ height: 20 }}>
                      <MouseoverTooltip
                        text={
                          <Trans>
                            Permission is required for Uniswap to swap each token. This will expire after one month for
                            your security.
                          </Trans>
                        }
                      >
                        <Info size={20} />
                      </MouseoverTooltip>
                    </div>
                    <Trans>Approve use of {currencies[Field.INPUT]?.symbol}</Trans>
                  </ButtonPrimary>
                ) : approvalState === ApprovalState.PENDING ? (
                  <ButtonPrimary
                    onClick={() => {
                      return
                    }}
                    id="deposit-button"
                    disabled={true}
                    style={{ gap: 14 }}
                  >
                    {depositInputError ? (
                      depositInputError
                    ) : (
                      <>
                        <Loader size="20px" />
                        <Trans>Approval pending</Trans>{' '}
                      </>
                    )}
                  </ButtonPrimary>
                ) : (
                  <ButtonPrimary
                    onClick={() => {
                      onDeposit()
                    }}
                    id="deposit-button"
                    disabled={false}
                  >
                    <Text fontSize={20} fontWeight={500}>
                      {depositInputError ? depositInputError : <Trans>Deposit</Trans>}
                    </Text>
                  </ButtonPrimary>
                )}
              </div>
            </AutoColumn>
          </DepositWrapper>
          <NetworkAlert />
        </PageWrapper>
        <SwitchLocaleLink />
      </Trace>
    )
  }
}
