import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import TokenSafetyIcon from 'components/TokenSafety/TokenSafetyIcon'
import { checkWarning } from 'constants/tokenSafety'
import { useDotoliFundContract } from 'hooks/useContract'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { CSSProperties, MutableRefObject, useCallback, useMemo } from 'react'
import { XOctagon } from 'react-feather'
import { Check } from 'react-feather'
import { useParams } from 'react-router-dom'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import styled from 'styled-components/macro'

import { WrappedTokenInfo } from '../../../state/lists/wrappedTokenInfo'
import { ThemedText } from '../../../theme'
import Column, { AutoColumn } from '../../Column'
import CurrencyLogo from '../../CurrencyLogo'
import Loader from '../../Loader'
import Row, { RowFixed } from '../../Row'
import { MouseoverTooltip } from '../../Tooltip'
import { LoadingRows, MenuItem } from '../styleds'

function currencyKey(currency: Currency): string {
  return currency.isToken ? currency.address : 'ETHER'
}

const CheckIcon = styled(Check)`
  height: 20px;
  width: 20px;
  margin-left: 4px;
  color: ${({ theme }) => theme.accentAction};
`

const StyledBalanceText = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  max-width: 5rem;
  text-overflow: ellipsis;
`

const CurrencyName = styled(Text)`
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Tag = styled.div`
  background-color: ${({ theme }) => theme.deprecated_bg3};
  color: ${({ theme }) => theme.deprecated_text2};
  font-size: 14px;
  border-radius: 4px;
  padding: 0.25rem 0.3rem 0.25rem 0.3rem;
  max-width: 6rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  justify-self: flex-end;
  margin-right: 4px;
`

export const BlockedTokenIcon = styled(XOctagon)<{ size?: string }>`
  margin-left: 0.3em;
  width: 1em;
  height: 1em;
`

function Balance({ balance }: { balance: CurrencyAmount<Currency> }) {
  return <StyledBalanceText title={balance.toExact()}>{balance.toSignificant(4)}</StyledBalanceText>
}

const TagContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`

function TokenTags({ currency }: { currency: Currency }) {
  if (!(currency instanceof WrappedTokenInfo)) {
    return null
  }

  const tags = currency.tags
  if (!tags || tags.length === 0) return <span />

  const tag = tags[0]

  return (
    <TagContainer>
      <MouseoverTooltip text={tag.description}>
        <Tag key={tag.id}>{tag.name}</Tag>
      </MouseoverTooltip>
      {tags.length > 1 ? (
        <MouseoverTooltip
          text={tags
            .slice(1)
            .map(({ name, description }) => `${name}: ${description}`)
            .join('; \n')}
        >
          <Tag>...</Tag>
        </MouseoverTooltip>
      ) : null}
    </TagContainer>
  )
}

export function CurrencyRow({
  currency,
  onSelect,
  isSelected,
  otherSelected,
  style,
  showCurrencyAmount,
  eventProperties,
}: {
  currency: Currency
  onSelect: (hasWarning: boolean) => void
  isSelected: boolean
  otherSelected: boolean
  style?: CSSProperties
  showCurrencyAmount?: boolean
  eventProperties: Record<string, unknown>
}) {
  const params = useParams()
  const fundAddress = params.fundAddress
  const investorAddress = params.investorAddress

  const key = currencyKey(currency)

  const DotoliFundContract = useDotoliFundContract()
  const { loading: getInvestorTokenAmountLoading, result: [getInvestorTokenAmount] = [] } = useSingleCallResult(
    DotoliFundContract,
    'getInvestorTokenAmount',
    [investorAddress ?? undefined, currency.wrapped.address]
  )
  const balance = useMemo(() => {
    if (!getInvestorTokenAmountLoading && getInvestorTokenAmount) {
      return CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(getInvestorTokenAmount.toString()))
    } else {
      return CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(0))
    }
  }, [getInvestorTokenAmountLoading, getInvestorTokenAmount, currency])

  const warning = currency.isNative ? null : checkWarning(currency.address)
  const isBlockedToken = !!warning && !warning.canProceed
  const blockedTokenOpacity = '0.6'

  // only show add or remove buttons if not on selected list
  return (
    <MenuItem
      tabIndex={0}
      style={style}
      className={`token-item-${key}`}
      onKeyPress={(e) => (!isSelected && e.key === 'Enter' ? onSelect(!!warning) : null)}
      onClick={() => (isSelected ? null : onSelect(!!warning))}
      disabled={isSelected}
      selected={otherSelected}
      dim={isBlockedToken}
    >
      <Column>
        <CurrencyLogo
          currency={currency}
          size={'36px'}
          style={{ opacity: isBlockedToken ? blockedTokenOpacity : '1' }}
        />
      </Column>
      <AutoColumn style={{ opacity: isBlockedToken ? blockedTokenOpacity : '1' }}>
        <Row>
          <CurrencyName title={currency.name}>{currency.name}</CurrencyName>
          <TokenSafetyIcon warning={warning} />
          {isBlockedToken && <BlockedTokenIcon />}
        </Row>
        <ThemedText.DeprecatedDarkGray ml="0px" fontSize={'12px'} fontWeight={300}>
          {currency.symbol}
        </ThemedText.DeprecatedDarkGray>
      </AutoColumn>
      <Column>
        <RowFixed style={{ justifySelf: 'flex-end' }}>
          <TokenTags currency={currency} />
        </RowFixed>
      </Column>
      {showCurrencyAmount ? (
        <RowFixed style={{ justifySelf: 'flex-end' }}>
          {balance ? <Balance balance={balance} /> : investorAddress ? <Loader /> : null}
          {isSelected && <CheckIcon />}
        </RowFixed>
      ) : (
        isSelected && (
          <RowFixed style={{ justifySelf: 'flex-end' }}>
            <CheckIcon />
          </RowFixed>
        )
      )}
    </MenuItem>
  )
}

interface TokenRowProps {
  data: Array<Currency>
  index: number
  style: CSSProperties
}

export const formatAnalyticsEventProperties = (
  token: Token,
  index: number,
  data: any[],
  searchQuery: string,
  isAddressSearch: string | false
) => ({
  token_symbol: token?.symbol,
  token_address: token?.address,
  is_suggested_token: false,
  is_selected_from_list: true,
  scroll_position: '',
  token_list_index: index,
  token_list_length: data.length,
  ...(isAddressSearch === false
    ? { search_token_symbol_input: searchQuery }
    : { search_token_address_input: isAddressSearch }),
})

const LoadingRow = () => (
  <LoadingRows>
    <div />
    <div />
    <div />
  </LoadingRows>
)

export default function InvestorCurrencyList({
  height,
  currencies,
  otherListTokens,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  fixedListRef,
  showCurrencyAmount,
  isLoading,
  searchQuery,
}: {
  height: number
  currencies: Currency[]
  otherListTokens?: WrappedTokenInfo[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency, hasWarning?: boolean) => void
  otherCurrency?: Currency | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showCurrencyAmount?: boolean
  isLoading: boolean
  searchQuery: string
}) {
  const itemData: Currency[] = useMemo(() => {
    if (otherListTokens && otherListTokens?.length > 0) {
      return [...currencies, ...otherListTokens]
    }
    return currencies
  }, [currencies, otherListTokens])

  const Row = useCallback(
    function TokenRow({ data, index, style }: TokenRowProps) {
      const row: Currency = data[index]

      const currency = row

      const isSelected = Boolean(currency && selectedCurrency && selectedCurrency.equals(currency))
      const otherSelected = Boolean(currency && otherCurrency && otherCurrency.equals(currency))
      const handleSelect = (hasWarning: boolean) => currency && onCurrencySelect(currency, hasWarning)

      const token = currency?.wrapped

      if (isLoading) {
        return LoadingRow()
      } else if (currency) {
        return (
          <CurrencyRow
            style={style}
            currency={currency}
            isSelected={isSelected}
            onSelect={handleSelect}
            otherSelected={otherSelected}
            showCurrencyAmount={showCurrencyAmount}
            eventProperties={formatAnalyticsEventProperties(token, index, data, searchQuery, false)}
          />
        )
      } else {
        return null
      }
    },
    [onCurrencySelect, otherCurrency, selectedCurrency, showCurrencyAmount, isLoading, searchQuery]
  )

  const itemKey = useCallback((index: number, data: typeof itemData) => {
    const currency = data[index]
    return currencyKey(currency)
  }, [])

  return isLoading ? (
    <FixedSizeList height={height} ref={fixedListRef as any} width="100%" itemData={[]} itemCount={10} itemSize={56}>
      {LoadingRow}
    </FixedSizeList>
  ) : (
    <FixedSizeList
      height={height}
      ref={fixedListRef as any}
      width="100%"
      itemData={itemData}
      itemCount={itemData.length}
      itemSize={56}
      itemKey={itemKey}
    >
      {Row}
    </FixedSizeList>
  )
}
