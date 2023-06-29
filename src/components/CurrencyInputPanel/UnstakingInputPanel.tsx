import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ElementName, Event, EventName } from 'components/AmplitudeAnalytics/constants'
import { TraceEvent } from 'components/AmplitudeAnalytics/TraceEvent'
import { AutoColumn } from 'components/Column'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { RowBetween, RowFixed } from 'components/Row'
import { isSupportedChain } from 'constants/chains'
import { ReactNode } from 'react'
import { Lock } from 'react-feather'
import { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { FiatValue } from './FiatValue'
import {
  Container,
  FiatRow,
  FixedContainer,
  InputPanel,
  InputRow,
  StyledBalanceMax,
  StyledNumericalInput,
} from './styled'

interface UnstakingInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label?: ReactNode
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  unstakingCurrencyBalance: CurrencyAmount<Currency> | undefined
  hideBalance?: boolean
  hideInput?: boolean
  otherCurrency?: Currency | null
  fiatValue?: CurrencyAmount<Token> | null
  priceImpact?: Percent
  id: string
  renderBalance?: (amount: CurrencyAmount<Currency>) => ReactNode
  locked?: boolean
  loading?: boolean
}

export default function UnstakingInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  currency,
  unstakingCurrencyBalance,
  id,
  renderBalance,
  fiatValue,
  priceImpact,
  hideBalance = false,
  hideInput = false,
  locked = false,
  loading = false,
  ...rest
}: UnstakingInputPanelProps) {
  const { account, chainId } = useWeb3React()
  const theme = useTheme()

  const chainAllowed = isSupportedChain(chainId)

  return (
    <InputPanel id={id} hideInput={hideInput} {...rest}>
      {locked && (
        <FixedContainer>
          <AutoColumn gap="sm" justify="center">
            <Lock />
            <ThemedText.DeprecatedLabel fontSize="12px" textAlign="center" padding="0 12px">
              <Trans>The market price is outside your specified price range. Single-asset deposit only.</Trans>
            </ThemedText.DeprecatedLabel>
          </AutoColumn>
        </FixedContainer>
      )}
      <Container hideInput={hideInput}>
        <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}}>
          {!hideInput && (
            <StyledNumericalInput
              className="token-amount-input"
              value={value}
              onUserInput={onUserInput}
              disabled={!chainAllowed}
              $loading={loading}
            />
          )}
        </InputRow>
        {!hideInput && !hideBalance && currency && (
          <FiatRow>
            <RowBetween>
              <LoadingOpacityContainer $loading={loading}>
                <FiatValue fiatValue={fiatValue} priceImpact={priceImpact} />
              </LoadingOpacityContainer>
              {account ? (
                <RowFixed style={{ height: '17px' }}>
                  <ThemedText.DeprecatedBody
                    onClick={onMax}
                    color={theme.deprecated_text4}
                    fontWeight={500}
                    fontSize={14}
                    style={{ display: 'inline', cursor: 'pointer' }}
                  >
                    {!hideBalance && currency && unstakingCurrencyBalance ? (
                      renderBalance ? (
                        renderBalance(unstakingCurrencyBalance)
                      ) : (
                        <Trans>Balance: {formatCurrencyAmount(unstakingCurrencyBalance, currency.decimals)}</Trans>
                      )
                    ) : null}
                  </ThemedText.DeprecatedBody>
                  {showMaxButton && unstakingCurrencyBalance ? (
                    <TraceEvent
                      events={[Event.onClick]}
                      name={EventName.SWAP_MAX_TOKEN_AMOUNT_SELECTED}
                      element={ElementName.MAX_TOKEN_AMOUNT_BUTTON}
                    >
                      <StyledBalanceMax onClick={onMax}>
                        <Trans>MAX</Trans>
                      </StyledBalanceMax>
                    </TraceEvent>
                  ) : null}
                </RowFixed>
              ) : (
                <span />
              )}
            </RowBetween>
          </FiatRow>
        )}
      </Container>
    </InputPanel>
  )
}
