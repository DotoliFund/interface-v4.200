// eslint-disable-next-line no-restricted-imports
import { Interface } from '@ethersproject/abi'
import { Trans } from '@lingui/macro'
import { Currency, Token } from '@uniswap/sdk-core'
import IERC20Metadata from '@uniswap/v3-periphery/artifacts/contracts/interfaces/IERC20Metadata.sol/IERC20Metadata.json'
import { useWeb3React } from '@web3-react/core'
import { sendEvent } from 'components/analytics'
import Column from 'components/Column'
import { RowBetween } from 'components/Row'
import { useSearchInactiveTokenLists } from 'hooks/Tokens'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useToggle from 'hooks/useToggle'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { tokenComparator, useSortTokensByQuery } from 'lib/hooks/useTokenList/sorting'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { useAllTokenBalances } from 'state/connection/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { CloseIcon, ThemedText } from 'theme'
import { FundToken } from 'types/fund'
import { IERC20MetadataInterface } from 'types/v3/v3-periphery/artifacts/contracts/interfaces/IERC20Metadata'
import { isAddress } from 'utils'

import { PaddedColumn, Separator } from '../styleds'
import FeeCurrencyList from './FeeCurrencyList'

const ContentWrapper = styled(Column)`
  background-color: ${({ theme }) => theme.backgroundSurface};
  width: 100%;
  flex: 1 1;
  position: relative;
`

interface FeeCurrencySearchProps {
  feeTokens: FundToken[]
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency, hasWarning?: boolean) => void
  otherSelectedCurrency?: Currency | null
  showCommonBases?: boolean
  showCurrencyAmount?: boolean
  disableNonToken?: boolean
}

function isTokenExist(tokens: FundToken[], token: string) {
  let isExist = false
  tokens.map((value, index) => {
    if (value.token.toUpperCase() === token.toUpperCase()) {
      isExist = true
    }
    return value
  })
  return isExist
}

export function FeeCurrencySearch({
  feeTokens,
  isOpen,
  onDismiss,
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCurrencyAmount,
  disableNonToken,
}: FeeCurrencySearchProps) {
  const { chainId } = useWeb3React()
  const theme = useTheme()

  const feeTokensAddresses: string[] = useMemo(() => {
    if (feeTokens && feeTokens.length > 0) {
      return feeTokens.map((data, index) => {
        return data.token
      })
    } else {
      return []
    }
  }, [feeTokens])

  const ERC20_METADATA_INTERFACE = new Interface(IERC20Metadata.abi) as IERC20MetadataInterface

  const feeTokensDecimalsInfo = useMultipleContractSingleData(feeTokensAddresses, ERC20_METADATA_INTERFACE, 'decimals')
  const feeTokensDecimals = useMemo(() => {
    const decimals: number[] = []
    for (let i = 0; i < feeTokensDecimalsInfo.length; i++) {
      const decimal = feeTokensDecimalsInfo[i].result
      if (decimal) {
        decimals.push(Number(decimal))
      } else {
        decimals.push(0)
      }
    }
    return decimals
  }, [feeTokensDecimalsInfo])

  const feeTokensSymbolInfo = useMultipleContractSingleData(feeTokensAddresses, ERC20_METADATA_INTERFACE, 'symbol')
  const feeTokensSymbols = useMemo(() => {
    const symbols: string[] = []
    for (let i = 0; i < feeTokensSymbolInfo.length; i++) {
      const symbol = feeTokensSymbolInfo[i].result
      if (symbol) {
        symbols.push(symbol.toString())
      } else {
        symbols.push('Unknown')
      }
    }
    return symbols
  }, [feeTokensSymbolInfo])

  const feeTokensInfo: Token[] = useMemo(() => {
    if (
      chainId &&
      feeTokensAddresses &&
      feeTokensAddresses.length > 0 &&
      feeTokensDecimals.length > 0 &&
      feeTokensSymbols.length > 0
    ) {
      const tokens: Token[] = feeTokensAddresses.map((data, index) => {
        const token: string = data
        const decimals: number = feeTokensDecimals[index]
        const symbol: string = feeTokensSymbols[index]
        return new Token(chainId, token, decimals, symbol)
      })
      return tokens
    } else {
      return []
    }
  }, [chainId, feeTokensAddresses, feeTokensDecimals, feeTokensSymbols])

  const [tokenLoaderTimerElapsed, setTokenLoaderTimerElapsed] = useState(false)

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  // if they input an address, use it
  const isAddressSearch = isAddress(debouncedQuery)

  useEffect(() => {
    if (isAddressSearch) {
      sendEvent({
        category: 'Currency Select',
        action: 'Search by address',
        label: isAddressSearch,
      })
    }
  }, [isAddressSearch])

  const [balances, balancesAreLoading] = useAllTokenBalances()
  const sortedTokens: Token[] = useMemo(
    () => (!balancesAreLoading ? [...feeTokensInfo].sort(tokenComparator.bind(null, balances)) : []),
    [balances, feeTokensInfo, balancesAreLoading]
  )
  const isLoading = Boolean(balancesAreLoading && !tokenLoaderTimerElapsed)

  const filteredSortedTokens = useSortTokensByQuery(debouncedQuery, sortedTokens)

  const native = useNativeCurrency()
  const wrapped = native.wrapped

  const feeCurrencies: Currency[] = useMemo(() => {
    const tokens = filteredSortedTokens.filter(
      (t) => !t.equals(wrapped) && !(disableNonToken && t.isNative) && isTokenExist(feeTokens, t.address)
    )
    if (feeTokens) {
      for (let i = 0; i < feeTokens.length; i++) {
        if (feeTokens[i].token.toUpperCase() === wrapped.address.toUpperCase()) {
          return [native, ...tokens]
        }
      }
    }
    return [...tokens]
  }, [filteredSortedTokens, disableNonToken, wrapped, native, feeTokens])

  const sortedFeeTokens: FundToken[] = feeCurrencies.map((value, index) => {
    const feeCurrency = value.wrapped.address
    for (let i = 0; i < feeTokens.length; i++) {
      const unsortedFeeToken = feeTokens[i].token
      if (unsortedFeeToken.toUpperCase() === feeCurrency.toUpperCase()) {
        return {
          token: unsortedFeeToken,
          amount: feeTokens[i].amount,
        }
      }
    }
    return {
      token: 'Unknown',
      amount: 0,
    }
  })

  const handleCurrencySelect = useCallback(
    (currency: Currency, hasWarning?: boolean) => {
      onCurrencySelect(currency, hasWarning)
      if (!hasWarning) onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  // clear the input on open
  useEffect(() => {
    if (isOpen) setSearchQuery('')
  }, [isOpen])

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // if no results on main list, show option to expand into inactive
  const filteredInactiveTokens = useSearchInactiveTokenLists(
    feeTokensInfo.length === 0 || (debouncedQuery.length > 2 && !isAddressSearch) ? debouncedQuery : undefined
  )

  // Timeout token loader after 3 seconds to avoid hanging in a loading state.
  useEffect(() => {
    const tokenLoaderTimer = setTimeout(() => {
      setTokenLoaderTimerElapsed(true)
    }, 3000)
    return () => clearTimeout(tokenLoaderTimer)
  }, [])

  return (
    <ContentWrapper>
      <PaddedColumn gap="16px">
        <RowBetween>
          <Text fontWeight={500} fontSize={16}>
            <Trans>Select a token</Trans>
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
      </PaddedColumn>
      <Separator />
      {feeCurrencies?.length > 0 || filteredInactiveTokens?.length > 0 || isLoading ? (
        <div style={{ flex: '1' }}>
          <AutoSizer disableWidth>
            {({ height }) => (
              <FeeCurrencyList
                height={height}
                currencies={feeCurrencies}
                feeTokens={sortedFeeTokens}
                otherListTokens={filteredInactiveTokens}
                onCurrencySelect={handleCurrencySelect}
                otherCurrency={otherSelectedCurrency}
                selectedCurrency={selectedCurrency}
                fixedListRef={fixedList}
                showCurrencyAmount={showCurrencyAmount}
                isLoading={isLoading}
                searchQuery={searchQuery}
                isAddressSearch={isAddressSearch}
              />
            )}
          </AutoSizer>
        </div>
      ) : (
        <Column style={{ padding: '20px', height: '100%' }}>
          <ThemedText.DeprecatedMain color={theme.deprecated_text3} textAlign="center" mb="20px">
            <Trans>No results found.</Trans>
          </ThemedText.DeprecatedMain>
        </Column>
      )}
    </ContentWrapper>
  )
}
