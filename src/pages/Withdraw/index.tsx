import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PageName, SectionName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { sendEvent } from 'components/analytics'
import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import FundCurrencyInputPanel from 'components/CurrencyInputPanel/FundCurrencyInputPanel'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import { RowBetween, RowFixed } from 'components/Row'
import { PageWrapper, SwapWrapper } from 'components/swap/styleds'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TokenWarningModal from 'components/TokenWarningModal'
import { TOKEN_SHORTHANDS } from 'constants/tokens'
import { useAllTokens, useCurrency } from 'hooks/Tokens'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { DotoliFund } from 'interface/DotoliFund'
import { useCallback, useMemo, useState } from 'react'
import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import { useToggleWalletModal } from 'state/application/hooks'
import { InterfaceTrade } from 'state/routing/types'
import { TradeState } from 'state/routing/types'
import { Field } from 'state/swap/actions'
import { useExpertModeManager } from 'state/user/hooks'
import {
  useDefaultsFromURLSearch,
  useDerivedWithdrawInfo,
  useWithdrawActionHandlers,
  useWithdrawState,
} from 'state/withdraw/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { supportedChainId } from 'utils/supportedChainId'

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

export function getIsValidSwapQuote(
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined,
  tradeState: TradeState,
  swapInputError?: ReactNode
): boolean {
  return !!swapInputError && !!trade && (tradeState === TradeState.VALID || tradeState === TradeState.SYNCING)
}

export default function Withdraw() {
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

  // withdraw state
  const { typedValue } = useWithdrawState()
  const { currencyBalances, parsedAmount, currencies, inputError: swapInputError } = useDerivedWithdrawInfo(fundAddress)
  const parsedAmounts = useMemo(() => ({ [Field.INPUT]: parsedAmount }), [parsedAmount])
  const fiatValueInput = useStablecoinValue(parsedAmounts[Field.INPUT])

  const { onCurrencySelection, onUserInput, onChangeRecipient } = useWithdrawActionHandlers()
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
    navigate('/withdraw/')
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

  const currency = currencies[Field.INPUT]

  async function onWithdraw() {
    if (!chainId || !provider || !account) return
    if (!currency || !parsedAmount || !fundAddress) return

    const { calldata, value } = DotoliFund.withdrawCallParameters(currency?.wrapped.address, parsedAmount)
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
                    <FundCurrencyInputPanel
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
                        onWithdraw()
                      }
                    }}
                    id="swap-button"
                    disabled={!isValid}
                    error={isValid}
                  >
                    <Text fontSize={20} fontWeight={500}>
                      {swapInputError ? swapInputError : <Trans>Withdraw</Trans>}
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
