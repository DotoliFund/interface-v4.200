// eslint-disable-next-line no-restricted-imports
import { Interface } from '@ethersproject/abi'
import { Trans } from '@lingui/macro'
import { Currency, Token } from '@uniswap/sdk-core'
import IERC20Metadata from '@uniswap/v3-periphery/artifacts/contracts/interfaces/IERC20Metadata.sol/IERC20Metadata.json'
import { useWeb3React } from '@web3-react/core'
import { useDotoliInfoContract } from 'hooks/useContract'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useToggle from 'hooks/useToggle'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { tokenComparator, useSortTokensByQuery } from 'lib/hooks/useTokenList/sorting'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { useAllTokenBalances } from 'state/connection/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { FundToken } from 'types/fund'
import { IERC20MetadataInterface } from 'types/v3/v3-periphery/artifacts/contracts/interfaces/IERC20Metadata'

import { CloseIcon, ThemedText } from '../../theme'
import Column from '../Column'
import { RowBetween } from '../Row'
import InvestorCurrecyList from './CurrencyList/InvestorCurrecyList'
import { PaddedColumn, Separator } from './styleds'

const ContentWrapper = styled(Column)`
  background-color: ${({ theme }) => theme.backgroundSurface};
  width: 100%;
  flex: 1 1;
  position: relative;
`

interface FundCurrencyListProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency, hasWarning?: boolean) => void
  otherSelectedCurrency?: Currency | null
  showCurrencyAmount?: boolean
  disableNonToken?: boolean
}

export function FundCurrencyList({
  isOpen,
  onDismiss,
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCurrencyAmount,
  disableNonToken,
}: FundCurrencyListProps) {
  const { chainId } = useWeb3React()
  const theme = useTheme()
  const params = useParams()
  const fundId = params.fundId
  const investor = params.investor

  const DotoliInfoContract = useDotoliInfoContract()
  const { result: [getInvestorTokens] = [] } = useSingleCallResult(DotoliInfoContract, 'getInvestorTokens', [
    fundId ?? undefined,
    investor ?? undefined,
  ])
  const investorTokenInfo: FundToken[] = getInvestorTokens
  const investorTokensAddresses: string[] = useMemo(() => {
    if (investorTokenInfo && investorTokenInfo.length > 0) {
      return investorTokenInfo.map((data) => {
        return data.token
      })
    } else {
      return []
    }
  }, [investorTokenInfo])

  const ERC20_METADATA_INTERFACE = new Interface(IERC20Metadata.abi) as IERC20MetadataInterface

  const investorTokensDecimalsInfo = useMultipleContractSingleData(
    investorTokensAddresses,
    ERC20_METADATA_INTERFACE,
    'decimals'
  )
  const investorTokensDecimals = useMemo(() => {
    const decimals: number[] = []
    for (let i = 0; i < investorTokensDecimalsInfo.length; i++) {
      const decimal = investorTokensDecimalsInfo[i].result
      if (decimal) {
        decimals.push(Number(decimal))
      } else {
        decimals.push(0)
      }
    }
    return decimals
  }, [investorTokensDecimalsInfo])

  const investorTokensSymbolInfo = useMultipleContractSingleData(
    investorTokensAddresses,
    ERC20_METADATA_INTERFACE,
    'symbol'
  )
  const investorTokensSymbols = useMemo(() => {
    const symbols: string[] = []
    for (let i = 0; i < investorTokensSymbolInfo.length; i++) {
      const symbol = investorTokensSymbolInfo[i].result
      if (symbol) {
        symbols.push(symbol.toString())
      } else {
        symbols.push('Unknown')
      }
    }
    return symbols
  }, [investorTokensSymbolInfo])

  const investorTokens: Token[] = useMemo(() => {
    if (
      chainId &&
      investorTokensAddresses &&
      investorTokensAddresses.length > 0 &&
      investorTokensDecimals.length > 0 &&
      investorTokensSymbols.length > 0
    ) {
      const tokens: Token[] = investorTokensAddresses.map((data, index) => {
        const token: string = data
        const decimals: number = investorTokensDecimals[index]
        const symbol: string = investorTokensSymbols[index]
        return new Token(chainId, token, decimals, symbol)
      })
      return tokens
    } else {
      return []
    }
  }, [chainId, investorTokensAddresses, investorTokensDecimals, investorTokensSymbols])

  const [tokenLoaderTimerElapsed, setTokenLoaderTimerElapsed] = useState(false)

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  const [balances, balancesAreLoading] = useAllTokenBalances()
  const sortedTokens: Token[] = useMemo(
    () => (!balancesAreLoading ? [...investorTokens].sort(tokenComparator.bind(null, balances)) : []),
    [balances, investorTokens, balancesAreLoading]
  )
  const isLoading = Boolean(balancesAreLoading && !tokenLoaderTimerElapsed)

  const filteredSortedTokens = useSortTokensByQuery(debouncedQuery, sortedTokens)

  const native = useNativeCurrency()
  const wrapped = native.wrapped

  const searchCurrencies: Currency[] = useMemo(() => {
    const s = debouncedQuery.toLowerCase().trim()

    const tokens = filteredSortedTokens.filter((t) => !(t.equals(wrapped) || (disableNonToken && t.isNative)))
    const natives = (disableNonToken || native.equals(wrapped) ? [] : [native]).filter(
      (n) => n.symbol?.toLowerCase()?.indexOf(s) !== -1 || n.name?.toLowerCase()?.indexOf(s) !== -1
    )
    return [...natives, ...tokens]
  }, [debouncedQuery, filteredSortedTokens, wrapped, disableNonToken, native])

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
      {searchCurrencies?.length > 0 || isLoading ? (
        <div style={{ flex: '1' }}>
          <AutoSizer disableWidth>
            {({ height }) => (
              <InvestorCurrecyList
                height={height ? height : 0}
                currencies={searchCurrencies}
                otherListTokens={undefined}
                onCurrencySelect={handleCurrencySelect}
                otherCurrency={otherSelectedCurrency}
                selectedCurrency={selectedCurrency}
                fixedListRef={fixedList}
                showCurrencyAmount={showCurrencyAmount}
                isLoading={isLoading}
                searchQuery={searchQuery}
              />
            )}
          </AutoSizer>
        </div>
      ) : (
        <Column style={{ padding: '20px', height: '100%' }}>
          <ThemedText.DeprecatedMain color={theme.deprecated_text4} textAlign="center" mb="20px">
            <Trans>No results found.</Trans>
          </ThemedText.DeprecatedMain>
        </Column>
      )}
    </ContentWrapper>
  )
}
