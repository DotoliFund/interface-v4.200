import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import HoverInlineText from 'components/HoverInlineText'
import { LoadingRows } from 'components/Loader/styled'
import { RowFixed } from 'components/Row'
import { Arrow, Break, PageButtons } from 'components/shared'
import { ClickableText, Label } from 'components/Text'
import { OptimismNetworkInfo } from 'constants/networks'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useActiveNetworkVersion } from 'state/application/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { Transaction, TransactionType } from 'types'
import { getEtherscanLink, shortenAddress } from 'utils'
import { formatTime } from 'utils/date'
import { formatAmount, formatDollarAmount } from 'utils/numbers'

const Wrapper = styled(DarkGreyCard)`
  width: 100%;
`

const ResponsiveGrid = styled.div`
  display: grid;
  grid-gap: 1em;
  align-items: center;

  grid-template-columns: 1.5fr repeat(5, 1fr);

  @media screen and (max-width: 940px) {
    grid-template-columns: 1.5fr repeat(4, 1fr);
    & > *:nth-child(5) {
      display: none;
    }
  }

  @media screen and (max-width: 800px) {
    grid-template-columns: 1.5fr repeat(2, 1fr);
    & > *:nth-child(5) {
      display: none;
    }
    & > *:nth-child(3) {
      display: none;
    }
    & > *:nth-child(4) {
      display: none;
    }
  }

  @media screen and (max-width: 500px) {
    grid-template-columns: 1.5fr repeat(1, 1fr);
    & > *:nth-child(5) {
      display: none;
    }
    & > *:nth-child(3) {
      display: none;
    }
    & > *:nth-child(4) {
      display: none;
    }
    & > *:nth-child(2) {
      display: none;
    }
  }
`

const SortText = styled.button<{ active: boolean }>`
  cursor: pointer;
  font-weight: ${({ active }) => (active ? 500 : 400)};
  margin-right: 0.75rem !important;
  border: none;
  background-color: transparent;
  font-size: 1rem;
  padding: 0px;
  color: ${({ active, theme }) => (active ? theme.deprecated_text1 : theme.deprecated_text3)};
  outline: none;
  @media screen and (max-width: 600px) {
    font-size: 14px;
  }
`

const SORT_FIELD = {
  amountUSD: 'amountUSD',
  timestamp: 'timestamp',
  sender: 'sender',
  amountToken0: 'amountToken0',
  amountToken1: 'amountToken1',
}

const DataRow = ({ transaction, color }: { transaction: Transaction; color?: string }) => {
  const { chainId } = useWeb3React()
  const abs0 = Math.abs(transaction.amount0)
  const abs1 = Math.abs(transaction.amount1) > 0 ? Math.abs(transaction.amount1) : undefined
  const [activeNetwork] = useActiveNetworkVersion()
  const theme = useTheme()

  return (
    <ResponsiveGrid>
      <ExternalLink href={getEtherscanLink(chainId ? chainId : 1, transaction.hash, 'transaction', activeNetwork)}>
        <Label color={color ?? theme.deprecated_blue1} fontWeight={400}>
          {transaction.type === TransactionType.SWAP ? (
            <Trans>
              Swap ${transaction.token0Symbol} to ${transaction.token1Symbol}
            </Trans>
          ) : transaction.type === TransactionType.DEPOSIT ? (
            <Trans>Deposit ${transaction.token0Symbol}</Trans>
          ) : transaction.type === TransactionType.WITHDRAW ? (
            <Trans>Withdraw ${transaction.token0Symbol}</Trans>
          ) : (
            <Trans>Error</Trans>
          )}
        </Label>
      </ExternalLink>
      <Label end={1} fontWeight={400}>
        {formatDollarAmount(transaction.amountUSD)}
      </Label>
      <Label end={1} fontWeight={400}>
        <HoverInlineText text={`${formatAmount(abs0)}`} maxCharacters={16} />
      </Label>
      <Label end={1} fontWeight={400}>
        <HoverInlineText text={`${formatAmount(abs1)}`} maxCharacters={16} />
      </Label>
      <Label end={1} fontWeight={400}>
        <ExternalLink
          href={getEtherscanLink(chainId ? chainId : 1, transaction.sender, 'address', activeNetwork)}
          style={{ color: color ?? theme.deprecated_blue1 }}
        >
          {shortenAddress(transaction.sender)}
        </ExternalLink>
      </Label>
      <Label end={1} fontWeight={400}>
        {formatTime(transaction.timestamp, activeNetwork === OptimismNetworkInfo ? 8 : 0)}
      </Label>
    </ResponsiveGrid>
  )
}

export default function TransactionTable({
  transactions,
  maxItems = 10,
  color,
}: {
  transactions: Transaction[]
  maxItems?: number
  color?: string
}) {
  // theming
  const theme = useTheme()

  // for sorting
  const [sortField, setSortField] = useState(SORT_FIELD.timestamp)
  const [sortDirection, setSortDirection] = useState<boolean>(true)

  // pagination
  const [page, setPage] = useState(1)
  const [maxPage, setMaxPage] = useState(1)

  useEffect(() => {
    let extraPages = 1
    if (transactions.length % maxItems === 0) {
      extraPages = 0
    }
    setMaxPage(Math.floor(transactions.length / maxItems) + extraPages)
  }, [maxItems, transactions])

  // filter on txn type
  const [txFilter, setTxFilter] = useState<TransactionType | undefined>(undefined)

  const sortedTransactions = useMemo(() => {
    return transactions
      ? transactions
          .slice()
          .sort((a, b) => {
            if (a && b) {
              return a[sortField as keyof Transaction] > b[sortField as keyof Transaction]
                ? (sortDirection ? -1 : 1) * 1
                : (sortDirection ? -1 : 1) * -1
            } else {
              return -1
            }
          })
          .filter((x) => {
            return txFilter === undefined || x.type === txFilter
          })
          .slice(maxItems * (page - 1), page * maxItems)
      : []
  }, [transactions, maxItems, page, sortField, sortDirection, txFilter])

  const handleSort = useCallback(
    (newField: string) => {
      setSortField(newField)
      setSortDirection(sortField !== newField ? true : !sortDirection)
    },
    [sortDirection, sortField]
  )

  const arrow = useCallback(
    (field: string) => {
      return sortField === field ? (!sortDirection ? '↑' : '↓') : ''
    },
    [sortDirection, sortField]
  )

  if (!transactions) {
    return (
      <LoadingRows>
        <div />
      </LoadingRows>
    )
  }

  return (
    <Wrapper>
      <AutoColumn gap="16px">
        <ResponsiveGrid>
          <RowFixed>
            <SortText
              onClick={() => {
                setTxFilter(undefined)
              }}
              active={txFilter === undefined}
            >
              <Trans>All</Trans>
            </SortText>
            <SortText
              onClick={() => {
                setTxFilter(TransactionType.SWAP)
              }}
              active={txFilter === TransactionType.SWAP}
            >
              <Trans>Swap</Trans>
            </SortText>
            <SortText
              onClick={() => {
                setTxFilter(TransactionType.DEPOSIT)
              }}
              active={txFilter === TransactionType.DEPOSIT}
            >
              <Trans>Deposit</Trans>
            </SortText>
            <SortText
              onClick={() => {
                setTxFilter(TransactionType.WITHDRAW)
              }}
              active={txFilter === TransactionType.WITHDRAW}
            >
              <Trans>Withdraw</Trans>
            </SortText>
          </RowFixed>
          <ClickableText color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.amountUSD)} end={1}>
            <Trans>Total Value</Trans> {arrow(SORT_FIELD.amountUSD)}
          </ClickableText>
          <ClickableText end={1} color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.amountToken0)}>
            <Trans>Token Amount</Trans> {arrow(SORT_FIELD.amountToken0)}
          </ClickableText>
          <ClickableText end={1} color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.amountToken1)}>
            <Trans>Token Amount</Trans> {arrow(SORT_FIELD.amountToken1)}
          </ClickableText>
          <ClickableText end={1} color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.sender)}>
            <Trans>Account</Trans> {arrow(SORT_FIELD.sender)}
          </ClickableText>
          <ClickableText end={1} color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.timestamp)}>
            <Trans>Time</Trans> {arrow(SORT_FIELD.timestamp)}
          </ClickableText>
        </ResponsiveGrid>
        <Break />

        {sortedTransactions.map((t, i) => {
          if (t) {
            return (
              <React.Fragment key={i}>
                <DataRow transaction={t} color={color} />
                <Break />
              </React.Fragment>
            )
          }
          return null
        })}
        {sortedTransactions.length === 0 ? (
          <ThemedText.DeprecatedMain>No Transactions</ThemedText.DeprecatedMain>
        ) : undefined}
        <PageButtons>
          <div
            onClick={() => {
              setPage(page === 1 ? page : page - 1)
            }}
          >
            <Arrow faded={page === 1 ? true : false}>←</Arrow>
          </div>
          <ThemedText.DeprecatedBody>{'Page ' + page + ' of ' + maxPage}</ThemedText.DeprecatedBody>
          <div
            onClick={() => {
              setPage(page === maxPage ? page : page + 1)
            }}
          >
            <Arrow faded={page === maxPage ? true : false}>→</Arrow>
          </div>
        </PageButtons>
      </AutoColumn>
    </Wrapper>
  )
}
