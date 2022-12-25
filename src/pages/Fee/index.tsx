import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PageName, SectionName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { sendEvent } from 'components/analytics'
import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import FeeCurrencyInputPanel from 'components/CurrencyInputPanel/FeeCurrencyInputPanel'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import { RowBetween, RowFixed } from 'components/Row'
import { PageWrapper, SwapWrapper } from 'components/swap/styleds'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TokenWarningModal from 'components/TokenWarningModal'
import { TOKEN_SHORTHANDS } from 'constants/tokens'
import { useAllTokens, useCurrency } from 'hooks/Tokens'
import { useXXXFund2Contract } from 'hooks/useContract'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { XXXFund2 } from 'interface/XXXFund2'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useCallback, useMemo, useState } from 'react'
import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import { useToggleWalletModal } from 'state/application/hooks'
import { useDefaultsFromURLSearch, useDerivedFeeInfo, useFeeActionHandlers, useFeeState } from 'state/fee/hooks'
import { InterfaceTrade } from 'state/routing/types'
import { TradeState } from 'state/routing/types'
import { Field } from 'state/swap/actions'
import { useExpertModeManager } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { FeeToken } from 'types/fund'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { supportedChainId } from 'utils/supportedChainId'

const StyledFeeHeader = styled.div`
  padding: 8px 12px;
  margin-bottom: 8px;
  width: 100%;
  color: ${({ theme }) => theme.deprecated_text2};
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

export function getIsValidSwapQuote(
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined,
  tradeState: TradeState,
  swapInputError?: ReactNode
): boolean {
  return !!swapInputError && !!trade && (tradeState === TradeState.VALID || tradeState === TradeState.SYNCING)
}

export default function Fee() {
  const params = useParams()
  const fundAddress = params.fundAddress
  const navigate = useNavigate()
  const { account, chainId, provider } = useWeb3React()
  const loadedUrlParams = useDefaultsFromURLSearch()

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

  // toggle wallet when disconnected
  const toggleWalletModal = useToggleWalletModal()

  // for expert mode
  const [isExpertMode] = useExpertModeManager()

  const XXXFund2Contract = useXXXFund2Contract(fundAddress)
  const { loading: getFeeTokensLoading, result: [getFeeTokens] = [] } = useSingleCallResult(
    XXXFund2Contract,
    'getFeeTokens',
    []
  )
  const feeTokens: FeeToken[] = getFeeTokens

  // fee state
  const { typedValue } = useFeeState()
  const { currencyBalance, parsedAmount, currency, inputError: swapInputError } = useDerivedFeeInfo(feeTokens)
  const fiatValueInput = useStablecoinValue(parsedAmount)

  const { onCurrencySelection, onUserInput } = useFeeActionHandlers()
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
    navigate('/fee/')
  }, [navigate])

  const formattedAmounts = useMemo(
    () => ({
      [Field.INPUT]: typedValue,
    }),
    [typedValue]
  )

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(() => currencyBalance, [currencyBalance])
  const showMaxButton = Boolean(currencyBalance?.greaterThan(0) && !parsedAmount?.equalTo(currencyBalance))

  async function onFee() {
    if (!chainId || !provider || !account) return
    if (!currency || !parsedAmount || !fundAddress) return

    const { calldata, value } = XXXFund2.feeOutCallParameters(currency?.wrapped.address, parsedAmount)
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

  const addIsUnsupported = useIsSwapUnsupported(currency, null)

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

  return (
    <Trace page={PageName.SWAP_PAGE} shouldLogImpression>
      <>
        {/* {tokensFlag === TokensVariant.Enabled && <TokensBanner />} */}
        <TokenWarningModal
          isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
          tokens={importTokensNotInDefault}
          onConfirm={handleConfirmTokenWarning}
          onDismiss={handleDismissTokenWarning}
        />
        <PageWrapper>
          <SwapWrapper id="swap-page">
            <StyledFeeHeader>
              <RowBetween>
                <RowFixed>
                  <ThemedText.DeprecatedBlack fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
                    <Trans>Fee</Trans>
                  </ThemedText.DeprecatedBlack>
                </RowFixed>
              </RowBetween>
            </StyledFeeHeader>
            <AutoColumn gap={'6px'}>
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
                ) : (
                  <ButtonError
                    onClick={() => {
                      if (isExpertMode) {
                        //handleSwap()
                      } else {
                        onFee()
                      }
                    }}
                    id="swap-button"
                    disabled={!isValid}
                    error={isValid}
                  >
                    <Text fontSize={20} fontWeight={500}>
                      {swapInputError ? swapInputError : <Trans>Fee</Trans>}
                    </Text>
                  </ButtonError>
                )}
              </div>
            </AutoColumn>
          </SwapWrapper>
          <NetworkAlert />
        </PageWrapper>
        <SwitchLocaleLink />
      </>
    </Trace>
  )
}
