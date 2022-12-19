import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Loader from 'components/Loader'
import { LoadingRows } from 'components/Loader/styled'
import Percent from 'components/Percent'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Fund } from 'types/fund'
import { shortenAddress } from 'utils'
import { unixToDate } from 'utils/date'

const Wrapper = styled(DarkGreyCard)`
  width: 100%;
`

const PageButtons = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.2em;
  margin-bottom: 0.5em;
`

const Arrow = styled.div<{ faded: boolean }>`
  color: ${({ theme }) => theme.deprecated_primary1};
  opacity: ${(props) => (props.faded ? 0.3 : 1)};
  padding: 0 20px;
  user-select: none;
  :hover {
    cursor: pointer;
  }
`

const Break = styled.div`
  height: 1px;
  background-color: ${({ theme }) => theme.deprecated_bg1};
  width: 100%;
`

// responsive text
const Label = styled(ThemedText.DeprecatedLabel)<{ end?: number }>`
  display: flex;
  font-size: 16px;
  font-weight: 400;
  justify-content: ${({ end }) => (end ? 'flex-end' : 'flex-start')};
  align-items: center;
  font-variant-numeric: tabular-nums;
  @media screen and (max-width: 640px) {
    font-size: 14px;
  }
`

const ClickableText = styled(Label)`
  text-align: end;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
  user-select: none;
  @media screen and (max-width: 640px) {
    font-size: 12px;
  }
`

const ResponsiveGrid = styled.div`
  display: grid;
  grid-gap: 1em;
  align-items: center;

  grid-template-columns: 20px 3.5fr repeat(6, 1fr);

  @media screen and (max-width: 900px) {
    grid-template-columns: 20px 1.5fr repeat(4, 1fr);
    & :nth-child(3) {
      display: none;
    }
  }

  @media screen and (max-width: 500px) {
    grid-template-columns: 20px 1.5fr repeat(3, 1fr);
    & :nth-child(5) {
      display: none;
    }
  }

  @media screen and (max-width: 480px) {
    grid-template-columns: 2.5fr repeat(2, 1fr);
    > *:nth-child(1) {
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
  created: 'createdAtTimestamp',
  volumeUSD: 'volumeUSD',
  principalUSD: 'principalUSD',
  profitRatioUSD: 'profitRatioUSD',
  investorCount: 'investorCount',
}

const DataRow = ({ fundData, index }: { fundData: Fund; index: number }) => {
  return (
    <LinkWrapper to={'/fund/' + fundData.address}>
      <ResponsiveGrid>
        <Label fontWeight={400}>{index + 1}</Label>
        <Label fontWeight={400}>{shortenAddress(fundData.address)}</Label>
        <Label end={1} fontWeight={400}>
          {(fundData.volumeUSD + fundData.liquidityVolumeUSD).toFixed(3)}
        </Label>
        <Label end={1} fontWeight={400}>
          {fundData.principalUSD.toFixed(3)}
        </Label>
        <Label end={1} fontWeight={400}>
          <Percent value={fundData.profitRatio} wrap={false} />
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

export default function FundTable({ fundDatas, maxItems = MAX_ITEMS }: { fundDatas: Fund[]; maxItems?: number }) {
  // theming
  const theme = useTheme()

  // for sorting
  const [sortField, setSortField] = useState(SORT_FIELD.volumeUSD)
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
              return a[sortField as keyof Fund] > b[sortField as keyof Fund]
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
    return <Loader />
  }

  return (
    <Wrapper>
      {sortedFunds.length > 0 ? (
        <AutoColumn gap="16px">
          <ResponsiveGrid>
            <Label color={theme.deprecated_text2}>#</Label>
            <ClickableText color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.fund)}>
              Fund {arrow(SORT_FIELD.fund)}
            </ClickableText>
            <ClickableText color={theme.deprecated_text2} end={1} onClick={() => handleSort(SORT_FIELD.volumeUSD)}>
              Volume USD {arrow(SORT_FIELD.volumeUSD)}
            </ClickableText>
            <ClickableText color={theme.deprecated_text2} end={1} onClick={() => handleSort(SORT_FIELD.principalUSD)}>
              Principal {arrow(SORT_FIELD.principalUSD)}
            </ClickableText>
            <ClickableText color={theme.deprecated_text2} end={1} onClick={() => handleSort(SORT_FIELD.profitRatioUSD)}>
              Ratio {arrow(SORT_FIELD.profitRatioUSD)}
            </ClickableText>
            <ClickableText color={theme.deprecated_text2} end={1} onClick={() => handleSort(SORT_FIELD.investorCount)}>
              Investors {arrow(SORT_FIELD.investorCount)}
            </ClickableText>
            <ClickableText color={theme.deprecated_text2} end={1} onClick={() => handleSort(SORT_FIELD.created)}>
              Created {arrow(SORT_FIELD.created)}
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
          <div />
        </LoadingRows>
      )}
    </Wrapper>
  )
}
