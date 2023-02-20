import { Trans } from '@lingui/macro'
import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { LoadingRows } from 'components/Loader/styled'
import { Arrow, Break, PageButtons } from 'components/shared'
import { ClickableText, Label } from 'components/Text'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'
import { TopFund } from 'types/fund'
import { shortenAddress } from 'utils'
import { unixToDate } from 'utils/date'
import { formatDollarAmount } from 'utils/numbers'

const Wrapper = styled(DarkGreyCard)`
  width: 100%;
`

const ResponsiveGrid = styled.div`
  display: grid;
  grid-gap: 1em;
  align-items: center;

  grid-template-columns: 1.5fr repeat(4, 1fr);

  @media screen and (max-width: 940px) {
    grid-template-columns: 1.5fr repeat(3, 1fr);
    & > *:nth-child(5) {import { Trans } from '@lingui/macro'

      display: none;
    }
  }

  @media screen and (max-width: 800px) {
    grid-template-columns: 1.5fr repeat(2, 1fr);
    & > *:nth-child(5) {
      display: none;
    }
  }

  @media screen and (max-width: 500px) {
    grid-template-columns: 1.5fr repeat(2, 1fr);
    & > *:nth-child(5) {
      display: none;
    }
    & > *:nth-child(4) {
      display: none;
    }
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
  fund: 'fund',
  current: 'current',
  manager: 'manager',
  investorCount: 'investorCount',
  created: 'createdAtTimestamp',
}

const DataRow = ({ fundData, index }: { fundData: TopFund; index: number }) => {
  return (
    <LinkWrapper to={'/fund/' + fundData.fundId}>
      <ResponsiveGrid>
        <Label fontWeight={400}>{fundData.fundId}</Label>
        <Label end={1} fontWeight={400}>
          {formatDollarAmount(fundData.currentUSD)}
        </Label>
        <Label end={1} fontWeight={400}>
          {shortenAddress(fundData.manager)}
        </Label>
        <Label end={1} fontWeight={400}>
          {fundData.investorCount}
        </Label>
        <Label end={1} fontWeight={400}>
          {unixToDate(fundData.createdAtTimestamp)}
        </Label>
      </ResponsiveGrid>
    </LinkWrapper>
  )
}

const MAX_ITEMS = 10

export default function FundTable({ fundDatas, maxItems = MAX_ITEMS }: { fundDatas: TopFund[]; maxItems?: number }) {
  // theming
  const theme = useTheme()

  // for sorting
  const [sortField, setSortField] = useState(SORT_FIELD.current)
  const [sortDirection, setSortDirection] = useState<boolean>(true)

  // pagination
  const [page, setPage] = useState(1)
  const [maxPage, setMaxPage] = useState(1)
  useEffect(() => {
    let extraPages = 1
    if (fundDatas.length % maxItems === 0) {
      extraPages = 0
    }
    setMaxPage(Math.floor(fundDatas.length / maxItems) + extraPages)
  }, [maxItems, fundDatas])

  const sortedFunds = useMemo(() => {
    return fundDatas
      ? fundDatas
          .filter((x) => !!x)
          .sort((a, b) => {
            if (a && b) {
              return a[sortField as keyof TopFund] > b[sortField as keyof TopFund]
                ? (sortDirection ? -1 : 1) * 1
                : (sortDirection ? -1 : 1) * -1
            } else {
              return -1
            }
          })
          .slice(maxItems * (page - 1), page * maxItems)
      : []
  }, [maxItems, page, fundDatas, sortDirection, sortField])

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

  if (!fundDatas) {
    return (
      <LoadingRows>
        <div />
      </LoadingRows>
    )
  }

  return (
    <Wrapper>
      {sortedFunds.length > 0 ? (
        <AutoColumn gap="16px">
          <ResponsiveGrid>
            <ClickableText color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.fund)}>
              <Trans>Fund</Trans> {arrow(SORT_FIELD.fund)}
            </ClickableText>
            <ClickableText end={1} color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.current)}>
              <Trans>Current</Trans> {arrow(SORT_FIELD.current)}
            </ClickableText>
            <ClickableText end={1} color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.manager)}>
              <Trans>Manager</Trans> {arrow(SORT_FIELD.manager)}
            </ClickableText>
            <ClickableText end={1} color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.investorCount)}>
              <Trans>Investors</Trans> {arrow(SORT_FIELD.investorCount)}
            </ClickableText>
            <ClickableText end={1} color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.created)}>
              <Trans>Created</Trans> {arrow(SORT_FIELD.created)}
            </ClickableText>
          </ResponsiveGrid>
          <Break />
          {sortedFunds.map((fundData, i) => {
            if (fundData) {
              return (
                <React.Fragment key={i}>
                  <DataRow index={(page - 1) * MAX_ITEMS + i} fundData={fundData} />
                  <Break />
                </React.Fragment>
              )
            }
            return null
          })}
          <PageButtons>
            <div
              onClick={() => {
                setPage(page === 1 ? page : page - 1)
              }}
            >
              <Arrow faded={page === 1 ? true : false}>←</Arrow>
            </div>
            {'Page ' + page + ' of ' + maxPage}
            <div
              onClick={() => {
                setPage(page === maxPage ? page : page + 1)
              }}
            >
              <Arrow faded={page === maxPage ? true : false}>→</Arrow>
            </div>
          </PageButtons>
        </AutoColumn>
      ) : (
        <LoadingRows>
          <div />
        </LoadingRows>
      )}
    </Wrapper>
  )
}
