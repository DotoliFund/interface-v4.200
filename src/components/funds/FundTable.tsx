import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Loader from 'components/Loader'
import { LoadingRows } from 'components/Loader/styled'
import { RowFixed } from 'components/Row'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import { FundData } from 'state/funds/reducer'
import styled, { useTheme } from 'styled-components/macro'
import { Color } from 'theme/styled'

const Wrapper = styled(DarkGreyCard)`
  width: 100%;
`

export const PageButtons = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.2em;
  margin-bottom: 0.5em;
`

export const Arrow = styled.div<{ faded: boolean }>`
  color: ${({ theme }) => theme.deprecated_primary1};
  opacity: ${(props) => (props.faded ? 0.3 : 1)};
  padding: 0 20px;
  user-select: none;
  :hover {
    cursor: pointer;
  }
`

export const Break = styled.div`
  height: 1px;
  background-color: ${({ theme }) => theme.deprecated_bg1};
  width: 100%;
`

const ClickableText = styled(Text)`
  :hover {
    cursor: pointer;
  }
  color: ${({ theme }) => theme.deprecated_primary1};
`

const Label = styled.div<{ color: Color }>`
  padding: 4px 4px;
  font-size: 12px;
  background-color: ${({ color }) => color + '1F'};
  border-radius: 8px;
  color: ${({ color }) => color};
  display: inline-flex;
  align-items: center;
`

const ResponsiveGrid = styled.div`
  display: grid;
  grid-gap: 1em;
  align-items: center;

  grid-template-columns: 20px 3.5fr repeat(3, 1fr);

  @media screen and (max-width: 900px) {
    grid-template-columns: 20px 1.5fr repeat(2, 1fr);
    & :nth-child(3) {
      display: none;
    }
  }

  @media screen and (max-width: 500px) {
    grid-template-columns: 20px 1.5fr repeat(1, 1fr);
    & :nth-child(5) {
      display: none;
    }
  }

  @media screen and (max-width: 480px) {
    grid-template-columns: 2.5fr repeat(1, 1fr);
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
  feeTier: 'feeTier',
  volumeUSD: 'volumeUSD',
  tvlUSD: 'tvlUSD',
  volumeUSDWeek: 'volumeUSDWeek',
}

const DataRow = ({ fundData, index }: { fundData: FundData; index: number }) => {
  return (
    //<LinkWrapper to={networkPrefix(activeNetwork) + 'pools/' + poolData.address}>
    <LinkWrapper to={'/overview'}>
      <ResponsiveGrid>
        <Label color="textPrimary">{index + 1}</Label>
        <Label color="textPrimary">
          <RowFixed>
            {/* <DoubleCurrencyLogo address0={poolData.token0.address} address1={poolData.token1.address} /> */}
            <DoubleCurrencyLogo />
            {/* <TYPE.label ml="8px"> */}
            {fundData.address}
            {/* </TYPE.label> */}
          </RowFixed>
        </Label>
        <Label color="textPrimary">
          {/* {formatDollarAmount(poolData.tvlUSD)} */}
          {fundData.manager}
        </Label>
        <Label color="textPrimary">
          {/* {formatDollarAmount(poolData.volumeUSD)} */}
          {fundData.volumeETH}
        </Label>
        <Label color="textPrimary">
          {/* {formatDollarAmount(poolData.volumeUSDWeek)} */}
          {fundData.volumeUSD}
        </Label>
      </ResponsiveGrid>
    </LinkWrapper>
  )
}

const MAX_ITEMS = 10

export default function FundTable({ fundDatas, maxItems = MAX_ITEMS }: { fundDatas: FundData[]; maxItems?: number }) {
  // theming
  const theme = useTheme()

  // for sorting
  const [sortField, setSortField] = useState(SORT_FIELD.tvlUSD)
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
              return a[sortField as keyof FundData] > b[sortField as keyof FundData]
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
            <ClickableText color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.feeTier)}>
              Fund {arrow(SORT_FIELD.feeTier)}
            </ClickableText>
            <ClickableText color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.tvlUSD)}>
              Manager {arrow(SORT_FIELD.tvlUSD)}
            </ClickableText>
            <ClickableText color={theme.deprecated_text1} onClick={() => handleSort(SORT_FIELD.volumeUSD)}>
              Volume 24H {arrow(SORT_FIELD.volumeUSD)}
            </ClickableText>
            <ClickableText color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.volumeUSDWeek)}>
              Volume 7D {arrow(SORT_FIELD.volumeUSDWeek)}
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
