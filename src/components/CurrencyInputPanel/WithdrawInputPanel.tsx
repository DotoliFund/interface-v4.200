import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { useWeb3React } from '@web3-react/core'
import { AutoColumn } from 'components/Column'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { CurrencySearchType } from 'components/SearchModal/styleds'
import { isSupportedChain } from 'constants/chains'
import useInvestorCurrencyBalance from 'hooks/useInvestorCurrencyBalance'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { Lock } from 'react-feather'
import { useParams } from 'react-router-dom'
import { useTheme } from 'styled-components/macro'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { ThemedText } from '../../theme'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween, RowFixed } from '../Row'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import { FiatValue } from './FiatValue'
import {
  Aligner,
  Container,
  CurrencySelect,
  FiatRow,
  FixedContainer,
  InputPanel,
  InputRow,
  StyledBalanceMax,
  StyledDropDown,
  StyledNumericalInput,
  StyledTokenName,
} from './styled'

interface WithdrawInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label?: ReactNode
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  fiatValue?: CurrencyAmount<Token> | null
  priceImpact?: Percent
  id: string
  showCommonBases?: boolean
  showCurrencyAmount?: boolean
  disableNonToken?: boolean
  renderBalance?: (amount: CurrencyAmount<Currency>) => ReactNode
  locked?: boolean
  loading?: boolean
}

export default function WithdrawInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  onCurrencySelect,
  currency,
  otherCurrency,
  id,
  showCommonBases,
  showCurrencyAmount,
  disableNonToken,
  renderBalance,
  fiatValue,
  priceImpact,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  locked = false,
  loading = false,
  ...rest
}: WithdrawInputPanelProps) {
  const params = useParams()
  const fundId = params.fundId
  const investor = params.investor
  const [modalOpen, setModalOpen] = useState(false)
  const { account, chainId } = useWeb3React()
  const selectedCurrencyBalance = useInvestorCurrencyBalance(
    fundId ?? undefined,
    investor,
    currency?.wrapped.address ?? undefined
  )
  const theme = useTheme()
  const [fiatValueIsLoading, setFiatValueIsLoading] = useState(false)

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const chainAllowed = isSupportedChain(chainId)

  useEffect(() => {
    !!value && !fiatValue ? setFiatValueIsLoading(true) : setFiatValueIsLoading(false)
  }, [fiatValueIsLoading, value, fiatValue])

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

          <CurrencySelect
            disabled={!chainAllowed}
            visible={currency !== undefined}
            selected={!!currency}
            hideInput={hideInput}
            className="open-currency-select-button"
            onClick={() => {
              if (onCurrencySelect) {
                setModalOpen(true)
              }
            }}
          >
            <Aligner>
              <RowFixed>
                {pair ? (
                  <span style={{ marginRight: '0.5rem' }}>
                    <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={24} margin={true} />
                  </span>
                ) : currency ? (
                  <CurrencyLogo style={{ marginRight: '2px' }} currency={currency} size={'24px'} />
                ) : null}
                {pair ? (
                  <StyledTokenName className="pair-name-container">
                    {pair?.token0.symbol}:{pair?.token1.symbol}
                  </StyledTokenName>
                ) : (
                  <StyledTokenName className="token-symbol-container" active={Boolean(currency && currency.symbol)}>
                    {(currency && currency.symbol && currency.symbol.length > 20
                      ? currency.symbol.slice(0, 4) +
                        '...' +
                        currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                      : currency?.symbol) || <Trans>Select token</Trans>}
                  </StyledTokenName>
                )}
              </RowFixed>
              {onCurrencySelect && <StyledDropDown selected={!!currency} />}
            </Aligner>
          </CurrencySelect>
        </InputRow>

        {Boolean(!hideInput && !hideBalance) && (
          <FiatRow>
            <RowBetween>
              <LoadingOpacityContainer $loading={loading}>
                <FiatValue fiatValue={fiatValue} priceImpact={priceImpact} isLoading={fiatValueIsLoading} />
              </LoadingOpacityContainer>
              {account ? (
                <RowFixed style={{ height: '17px' }}>
                  <ThemedText.DeprecatedBody
                    color={theme.textSecondary}
                    fontWeight={400}
                    fontSize={14}
                    style={{ display: 'inline' }}
                  >
                    {!hideBalance && currency && selectedCurrencyBalance ? (
                      renderBalance ? (
                        renderBalance(selectedCurrencyBalance)
                      ) : (
                        <Trans>Balance: {formatCurrencyAmount(selectedCurrencyBalance, 4)}</Trans>
                      )
                    ) : null}
                  </ThemedText.DeprecatedBody>
                  {showMaxButton && selectedCurrencyBalance ? (
                    <StyledBalanceMax onClick={onMax}>
                      <Trans>Max</Trans>
                    </StyledBalanceMax>
                  ) : null}
                </RowFixed>
              ) : (
                <span />
              )}
            </RowBetween>
          </FiatRow>
        )}
      </Container>
      {onCurrencySelect && fundId && investor ? (
        <CurrencySearchModal
          isOpen={modalOpen}
          currencySearchType={CurrencySearchType.FUND_CURRENCY}
          showWrappedETH={false}
          fundId={fundId}
          investor={investor}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          showCommonBases={showCommonBases}
          showCurrencyAmount={showCurrencyAmount}
          disableNonToken={disableNonToken}
        />
      ) : null}
    </InputPanel>
  )
}
