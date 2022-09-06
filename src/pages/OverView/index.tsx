import { Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PageName, SectionName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { sendEvent } from 'components/analytics'
import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import SwapCurrencyInputPanel from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import { PageWrapper, SwapCallbackError, SwapWrapper } from 'components/swap/styleds'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
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
//import { useIsDepositUnsupported } from 'hooks/useIsDepositUnsupported'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { useToggleWalletModal } from 'state/application/hooks'
import { Field } from 'state/deposit/actions'
import {
  useDefaultsFromURLSearch,
  useDepositActionHandlers,
  useDepositState,
  useDerivedDepositInfo,
} from 'state/deposit/hooks'
import styled, { css, useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { supportedChainId } from 'utils/supportedChainId'

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

// export function getIsValidSwapQuote(
//   trade: InterfaceTrade<Currency, Currency, TradeType> | undefined,
//   tradeState: TradeState,
//   swapInputError?: ReactNode
// ): boolean {
//   return !!swapInputError && !!trade && (tradeState === TradeState.VALID || tradeState === TradeState.SYNCING)
// }

export default function Swap() {
  const navigate = useNavigate()
  const navBarFlag = useNavBarFlag()
  const navBarFlagEnabled = navBarFlag === NavBarVariant.Enabled
  const redesignFlag = useRedesignFlag()
  const redesignFlagEnabled = redesignFlag === RedesignVariant.Enabled
  const tokensFlag = useTokensFlag()
  const { account, chainId } = useWeb3React()
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

  const theme = useTheme()

  // toggle wallet when disconnected
  const toggleWalletModal = useToggleWalletModal()

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

  const parsedAmounts = {
    [Field.INPUT]: parsedAmount,
  }

  // show price estimates based on wrap trade
  const inputValue = parsedAmount
  const fiatValueInput = useStablecoinValue(inputValue)

  const { onCurrencySelection, onUserInput } = useDepositActionHandlers()
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

  const formattedAmounts = {
    [Field.INPUT]: typedValue,
  }

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT]),
    [currencyBalances]
  )
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))

  //TODO : change investor
  const investor = '0x1234'

  // the callback to execute the swap
  // const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
  //   trade,
  //   allowedSlippage,
  //   recipient,
  //   investor
  // )

  const handleSwap = useCallback(
    () => {
      // if (!swapCallback) {
      //   return
      // }
      // if (stablecoinPriceImpact && !confirmPriceImpactWithoutFee(stablecoinPriceImpact)) {
      //   return
      // }
      // setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
      // swapCallback()
      //   .then((hash) => {
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
      //   .catch((error) => {
      //     setSwapState({
      //       attemptingTxn: false,
      //       tradeToConfirm,
      //       showConfirm,
      //       swapErrorMessage: error.message,
      //       txHash: undefined,
      //     })
      //   })
    },
    [
      // swapCallback,
      // stablecoinPriceImpact,
      // tradeToConfirm,
      // showConfirm,
      // recipient,
      // recipientAddress,
      // account,
      // trade?.inputAmount?.currency?.symbol,
      // trade?.outputAmount?.currency?.symbol,
    ]
  )

  // errors
  //const [swapQuoteReceivedDate] = useState<Date | undefined>()

  // const handleConfirmDismiss = useCallback(() => {
  //   setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash })
  //   // if there was a tx hash, we want to clear the input
  //   if (txHash) {
  //     onUserInput(Field.INPUT, '')
  //   }
  // }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  // const handleAcceptChanges = useCallback(() => {
  //   setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm })
  // }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash])

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

  // const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])
  //const depositIsUnsupported = useIsDepositUnsupported(currencies[Field.INPUT])
  const depositIsUnsupported = false

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
            {/* <SwapHeader allowedSlippage={allowedSlippage} /> */}
            {/* <ConfirmSwapModal
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
            /> */}
            <AutoColumn gap={'0px'}>
              <div style={{ display: 'relative' }}>
                <TopInputWrapper redesignFlag={redesignFlagEnabled}>
                  <Trace section={SectionName.CURRENCY_INPUT_PANEL}>
                    <SwapCurrencyInputPanel
                      label={<Trans>From</Trans>}
                      value={formattedAmounts[Field.INPUT]}
                      showMaxButton={showMaxButton}
                      currency={currencies[Field.INPUT] ?? null}
                      onUserInput={handleTypeInput}
                      onMax={handleMaxInput}
                      fiatValue={fiatValueInput ?? undefined}
                      onCurrencySelect={handleInputSelect}
                      otherCurrency={null}
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
                  <div>
                    {depositIsUnsupported ? (
                      <ButtonPrimary disabled={true}>
                        <ThemedText.DeprecatedMain mb="4px">
                          <Trans>Unsupported Asset</Trans>
                        </ThemedText.DeprecatedMain>
                      </ButtonPrimary>
                    ) : !account ? (
                      <ButtonLight onClick={toggleWalletModal} redesignFlag={redesignFlagEnabled}>
                        <Trans>Connect Wallet</Trans>
                      </ButtonLight>
                    ) : (
                      <ButtonError
                        onClick={() => {
                          // setSwapState({
                          //   tradeToConfirm: trade,
                          //   attemptingTxn: false,
                          //   swapErrorMessage: undefined,
                          //   showConfirm: true,
                          //   txHash: undefined,
                          // })
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
                    {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
                  </div>
                </AutoColumn>
              </BottomWrapper>
            </AutoColumn>
          </SwapWrapper>
          <NetworkAlert />
        </PageWrapper>
        <SwitchLocaleLink />
        {!depositIsUnsupported ? null : (
          <UnsupportedCurrencyFooter show={depositIsUnsupported} currencies={[currencies[Field.INPUT]]} />
        )}
      </>
    </Trace>
  )
}
