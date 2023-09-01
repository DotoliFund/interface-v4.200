import type { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PageName, SectionName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { sendEvent } from 'components/analytics'
import { ButtonError, ButtonLight, ButtonYellow } from 'components/Button'
import { AutoColumn } from 'components/Column'
import FeeCurrencyInputPanel from 'components/CurrencyInputPanel/FeeInputPanel'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import { RowBetween, RowFixed } from 'components/Row'
import { PageWrapper, SwapWrapper as FeeWrapper } from 'components/swap/styleds'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from 'components/TransactionConfirmationModal'
import { DOTOLI_FUND_ADDRESSES } from 'constants/addresses'
import { isSupportedChain } from 'constants/chains'
import { useDotoliInfoContract } from 'hooks/useContract'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { DotoliFund } from 'interface/DotoliFund'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { ErrorContainer, NetworkIcon } from 'pages/Account'
import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import { useToggleWalletModal } from 'state/application/hooks'
import { Field } from 'state/fee/actions'
import { useDerivedFeeInfo, useFeeActionHandlers, useFeeState } from 'state/fee/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { useExpertModeManager } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { FundToken } from 'types/fund'
import { calculateGasMargin } from 'utils/calculateGasMargin'

const StyledFeeHeader = styled.div`
  padding: 8px 12px;
  margin-bottom: 8px;
  width: 100%;
  color: ${({ theme }) => theme.deprecated_text4};
`

const FeeSection = styled.div`
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

export default function Fee() {
  const params = useParams()
  const fundId = params.fundId
  const { account, chainId, provider } = useWeb3React()
  const theme = useTheme()

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)
  const [feeErrorMessage, setFeeErrorMessage] = useState<string | undefined>(undefined)
  const [txHash, setTxHash] = useState<string | undefined>(undefined)

  // toggle wallet when disconnected
  const toggleWalletModal = useToggleWalletModal()

  // for expert mode
  const [isExpertMode] = useExpertModeManager()

  const DotoliInfoContract = useDotoliInfoContract()
  const { loading: getFeeTokensLoading, result: [getFeeTokens] = [] } = useSingleCallResult(
    DotoliInfoContract,
    'getFeeTokens',
    [fundId]
  )
  const feeTokens: FundToken[] = getFeeTokens
  const isFeeEmpty = feeTokens && feeTokens.length === 0 ? true : false

  // fee state
  const { typedValue } = useFeeState()
  const { currencyBalance, parsedAmount, currency, inputError: feeInputError } = useDerivedFeeInfo(feeTokens)
  const fiatValueInput = useStablecoinValue(parsedAmount)

  const { onCurrencySelection, onUserInput } = useFeeActionHandlers()
  const isValid = !feeInputError
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

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(() => currencyBalance, [currencyBalance])
  const showMaxButton = Boolean(currencyBalance?.greaterThan(0) && !parsedAmount?.equalTo(currencyBalance))

  const addTransaction = useTransactionAdder()

  async function onFee() {
    if (!chainId || !provider || !account) return
    if (!currency || !parsedAmount || !fundId) return

    const { calldata, value } = DotoliFund.withdrawFeeCallParameters(fundId, currency?.wrapped.address, parsedAmount)
    const txn: { to: string; data: string; value: string } = {
      to: DOTOLI_FUND_ADDRESSES,
      data: calldata,
      value,
    }

    const tokenAddress = currency?.wrapped.address

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
              type: TransactionType.FEE,
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
        //setFeeErrorMessage(error.message)
        setFeeErrorMessage('Failed to receive fees')
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
      category: 'Fee',
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
      <Trace page={PageName.FEE_PAGE} shouldLogImpression>
        <>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={() => {
              handleDismissConfirmation()
            }}
            attemptingTxn={attemptingTxn}
            hash={txHash}
            content={() =>
              feeErrorMessage ? (
                <TransactionErrorContent onDismiss={handleDismissConfirmation} message={feeErrorMessage} />
              ) : (
                <ConfirmationModalContent
                  title={<Trans>Confirm Fee</Trans>}
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
                {/* Withdrawing Fee {trade?.inputAmount?.toSignificant(6)} {trade?.inputAmount?.currency?.symbol} for{' '}
          {trade?.outputAmount?.toSignificant(6)} {trade?.outputAmount?.currency?.symbol} */}
                Fee receiving
              </Trans>
            }
            currencyToAdd={undefined}
          />
          <PageWrapper>
            <FeeWrapper id="fee-page">
              <StyledFeeHeader>
                <RowBetween>
                  <RowFixed>
                    <ThemedText.DeprecatedBlack fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
                      <Trans>Fee</Trans>
                    </ThemedText.DeprecatedBlack>
                  </RowFixed>
                </RowBetween>
              </StyledFeeHeader>
              <AutoColumn gap="6px">
                <div style={{ display: 'relative' }}>
                  <FeeSection>
                    <Trace section={SectionName.CURRENCY_INPUT_PANEL}>
                      <FeeCurrencyInputPanel
                        label={<Trans>Fee</Trans>}
                        value={formattedAmounts[Field.INPUT]}
                        showMaxButton={showMaxButton}
                        currency={currency ?? null}
                        feeTokens={feeTokens}
                        onUserInput={handleTypeInput}
                        onMax={handleMaxInput}
                        fiatValue={fiatValueInput ?? undefined}
                        onCurrencySelect={handleInputSelect}
                        otherCurrency={currency}
                        showCommonBases={true}
                        id={SectionName.CURRENCY_INPUT_PANEL}
                        loading={false}
                      />
                    </Trace>
                  </FeeSection>
                </div>
                <div>
                  {isFeeEmpty ? (
                    <ButtonYellow disabled={true}>
                      <ThemedText.DeprecatedMain mb="4px">
                        <Trans>No Fees</Trans>
                      </ThemedText.DeprecatedMain>
                    </ButtonYellow>
                  ) : !account ? (
                    <ButtonLight onClick={toggleWalletModal}>
                      <Trans>Connect Wallet</Trans>
                    </ButtonLight>
                  ) : (
                    <ButtonError
                      onClick={() => {
                        if (isExpertMode) {
                          //onFee()
                        } else {
                          onFee()
                        }
                      }}
                      id="fee-button"
                      disabled={!isValid}
                      error={isValid}
                    >
                      <Text fontSize={20} fontWeight={500}>
                        {feeInputError ? feeInputError : <Trans>Fee</Trans>}
                      </Text>
                    </ButtonError>
                  )}
                </div>
              </AutoColumn>
            </FeeWrapper>
            <NetworkAlert />
          </PageWrapper>
          <SwitchLocaleLink />
        </>
      </Trace>
    )
  }
}
