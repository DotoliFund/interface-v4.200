import type { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PageName, SectionName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { sendEvent } from 'components/analytics'
import { ButtonError, ButtonLight } from 'components/Button'
import { AutoColumn } from 'components/Column'
import WithdrawCurrencyInputPanel from 'components/CurrencyInputPanel/WithdrawInputPanel'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import { RowBetween, RowFixed } from 'components/Row'
import { PageWrapper, SwapWrapper as WithdrawWrapper } from 'components/swap/styleds'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from 'components/TransactionConfirmationModal'
import { DOTOLI_FUND_ADDRESSES } from 'constants/addresses'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { DotoliFund } from 'interface/DotoliFund'
import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import { useToggleWalletModal } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { useExpertModeManager } from 'state/user/hooks'
import { Field } from 'state/withdraw/actions'
import { useDerivedWithdrawInfo, useWithdrawActionHandlers, useWithdrawState } from 'state/withdraw/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { maxAmountSpend } from 'utils/maxAmountSpend'

const StyledWithdrawHeader = styled.div`
  padding: 8px 12px;
  margin-bottom: 8px;
  width: 100%;
  color: ${({ theme }) => theme.deprecated_text2};
`

const WithdrawSection = styled.div`
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

export default function Withdraw() {
  const params = useParams()
  const fundId = params.fundId
  const { account, chainId, provider } = useWeb3React()

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)
  const [withdrawErrorMessage, setWithdrawErrorMessage] = useState<string | undefined>(undefined)
  const [txHash, setTxHash] = useState<string | undefined>(undefined)

  // toggle wallet when disconnected
  const toggleWalletModal = useToggleWalletModal()

  // for expert mode
  const [isExpertMode] = useExpertModeManager()

  // withdraw state
  const { typedValue } = useWithdrawState()
  const { currencyBalances, parsedAmount, currencies, inputError: withdrawInputError } = useDerivedWithdrawInfo(fundId)
  const parsedAmounts = useMemo(() => ({ [Field.INPUT]: parsedAmount }), [parsedAmount])
  const fiatValueInput = useStablecoinValue(parsedAmounts[Field.INPUT])

  const { onCurrencySelection, onUserInput, onChangeRecipient } = useWithdrawActionHandlers()
  const isValid = !withdrawInputError
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

  const currency = currencies[Field.INPUT]
  const tokenAddress = currency?.wrapped.address

  const addTransaction = useTransactionAdder()

  async function onWithdraw() {
    if (!chainId || !provider || !account) return
    if (!currency || !parsedAmount || !fundId || !tokenAddress) return

    const { calldata, value } = DotoliFund.withdrawCallParameters(fundId, currency?.wrapped.address, parsedAmount)
    const txn: { to: string; data: string; value: string } = {
      to: DOTOLI_FUND_ADDRESSES,
      data: calldata,
      value,
    }

    const amount = parsedAmount.quotient.toString()

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
              type: TransactionType.WITHDRAW,
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
      .catch((error) => {
        setAttemptingTxn(false)
        //setWithdrawErrorMessage(error.message)
        setWithdrawErrorMessage('Withdraw failed')
      })
  }

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      onCurrencySelection(inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(maxInputAmount.toExact())
    sendEvent({
      category: 'Withdraw',
      action: 'Max',
    })
  }, [maxInputAmount, onUserInput])

  const handleDismissConfirmation = () => {
    setShowConfirm(false)
    setTxHash('')
  }

  return (
    <Trace page={PageName.WITHDRAW_PAGE} shouldLogImpression>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => {
          handleDismissConfirmation()
        }}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={() =>
          withdrawErrorMessage ? (
            <TransactionErrorContent onDismiss={handleDismissConfirmation} message={withdrawErrorMessage} />
          ) : (
            <ConfirmationModalContent
              title={<Trans>Confirm Withdraw</Trans>}
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
        pendingText={
          <Trans>
            {/* Withdrawing {trade?.inputAmount?.toSignificant(6)} {trade?.inputAmount?.currency?.symbol} for{' '}
          {trade?.outputAmount?.toSignificant(6)} {trade?.outputAmount?.currency?.symbol} */}
            Withdrawing
          </Trans>
        }
        currencyToAdd={undefined}
      />
      <PageWrapper>
        <WithdrawWrapper id="withdraw-page">
          <StyledWithdrawHeader>
            <RowBetween>
              <RowFixed>
                <ThemedText.DeprecatedBlack fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
                  <Trans>Withdraw</Trans>
                </ThemedText.DeprecatedBlack>
              </RowFixed>
            </RowBetween>
          </StyledWithdrawHeader>
          <AutoColumn gap={'6px'}>
            <div style={{ display: 'relative' }}>
              <WithdrawSection>
                <Trace section={SectionName.CURRENCY_INPUT_PANEL}>
                  <WithdrawCurrencyInputPanel
                    label={<Trans>Withdraw</Trans>}
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
              </WithdrawSection>
            </div>
            <div>
              {!account ? (
                <ButtonLight onClick={toggleWalletModal}>
                  <Trans>Connect Wallet</Trans>
                </ButtonLight>
              ) : (
                <ButtonError
                  onClick={() => {
                    if (isExpertMode) {
                      //onWithdraw()
                    } else {
                      onWithdraw()
                    }
                  }}
                  id="withdraw-button"
                  disabled={!isValid}
                  error={isValid}
                >
                  <Text fontSize={20} fontWeight={500}>
                    {withdrawInputError ? withdrawInputError : <Trans>Withdraw</Trans>}
                  </Text>
                </ButtonError>
              )}
            </div>
          </AutoColumn>
        </WithdrawWrapper>
        <NetworkAlert />
      </PageWrapper>
      <SwitchLocaleLink />
    </Trace>
  )
}
