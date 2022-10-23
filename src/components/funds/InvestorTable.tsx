import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import HoverInlineText from 'components/HoverInlineText'
import Loader from 'components/Loader'
import { Arrow, Break, PageButtons } from 'components/shared'
import { ClickableText, Label } from 'components/Text'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { Investor } from 'types/fund'
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

const LinkWrapper = styled(Link)`
  text-decoration: none;
  :hover {
    cursor: pointer;
    opacity: 0.7;
  }
`

const SORT_FIELD = {
  amountUSD: 'amountUSD',
  timestamp: 'timestamp',
  sender: 'sender',
  amountToken0: 'amountToken0',
  amountToken1: 'amountToken1',
}

const DataRow = ({ investor, color }: { investor: Investor; color?: string }) => {
  const abs0 = Math.abs(investor.profitRatioETH)
  const abs1 = Math.abs(investor.principalUSD)
  const [activeNetwork] = useActiveNetworkVersion()
  const theme = useTheme()

  return (
    <LinkWrapper to={'/fund/' + investor.fund + '/' + investor.investor}>
      <ResponsiveGrid>
        <Label end={1} fontWeight={400}>
          {formatDollarAmount(investor.principalETH)}
        </Label>
        <Label end={1} fontWeight={400}>
          <HoverInlineText text={`${formatAmount(abs0)}  token0Symbol`} maxCharacters={16} />
        </Label>
        <Label end={1} fontWeight={400}>
          <HoverInlineText text={`${formatAmount(abs1)}  token1Symbol`} maxCharacters={16} />
        </Label>
        <Label end={1} fontWeight={400}>
          <ExternalLink
            href={getEtherscanLink(1, investor.manager, 'address', activeNetwork)}
            style={{ color: color ?? theme.deprecated_blue1 }}
          >
            {shortenAddress(investor.investor)}
          </ExternalLink>
        </Label>
        <Label end={1} fontWeight={400}>
          {formatTime(investor.createdAtTimestamp.toString(), 8)}
        </Label>
      </ResponsiveGrid>
    </LinkWrapper>
  )
}

export default function InvestorTable({
  investors,
  maxItems = 10,
  color,
}: {
  investors: Investor[]
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
    if (investors.length % maxItems === 0) {
      extraPages = 0
    }
    setMaxPage(Math.floor(investors.length / maxItems) + extraPages)
  }, [maxItems, investors])

  const sortedInvestors = useMemo(() => {
    return investors
      ? investors
          .slice()
          .sort((a, b) => {
            if (a && b) {
              return a[sortField as keyof Investor] > b[sortField as keyof Investor]
                ? (sortDirection ? -1 : 1) * 1
                : (sortDirection ? -1 : 1) * -1
            } else {
              return -1
            }
          })
          .slice(maxItems * (page - 1), page * maxItems)
      : []
  }, [investors, maxItems, page, sortField, sortDirection])

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

  if (!investors) {
    return <Loader />
  }

  return (
    <Wrapper>
      <AutoColumn gap="16px">
        <ResponsiveGrid>
          <ClickableText color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.amountUSD)} end={1}>
            Total Value {arrow(SORT_FIELD.amountUSD)}
          </ClickableText>
          <ClickableText color={theme.deprecated_text2} end={1} onClick={() => handleSort(SORT_FIELD.amountToken0)}>
            Token Amount {arrow(SORT_FIELD.amountToken0)}
          </ClickableText>
          <ClickableText color={theme.deprecated_text2} end={1} onClick={() => handleSort(SORT_FIELD.amountToken1)}>
            Token Amount {arrow(SORT_FIELD.amountToken1)}
          </ClickableText>
          <ClickableText color={theme.deprecated_text2} end={1} onClick={() => handleSort(SORT_FIELD.sender)}>
            Account {arrow(SORT_FIELD.sender)}
          </ClickableText>
          <ClickableText color={theme.deprecated_text2} end={1} onClick={() => handleSort(SORT_FIELD.timestamp)}>
            Time {arrow(SORT_FIELD.timestamp)}
          </ClickableText>
        </ResponsiveGrid>
        <Break />

        {sortedInvestors.map((t, i) => {
          if (t) {
            return (
              <React.Fragment key={i}>
                <DataRow investor={t} color={color} />
                <Break />
              </React.Fragment>
            )
          }
          return null
        })}
        {sortedInvestors.length === 0 ? <ThemedText.DeprecatedMain>No Investors</ThemedText.DeprecatedMain> : undefined}
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