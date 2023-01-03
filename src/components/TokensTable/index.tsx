import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { LoadingRows } from 'components/Loader/styled'
import { Arrow, Break, PageButtons } from 'components/shared'
import { ClickableText, Label } from 'components/Text'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'
import { Token } from 'types/fund'
import { shortenAddress } from 'utils'

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
    grid-template-columns: 1.5fr repeat(4, 1fr);
    & > *:nth-child(5) {
      display: none;
    }
  }

  @media screen and (max-width: 500px) {
    grid-template-columns: 1.5fr repeat(3, 1fr);
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
  name: 'name',
}

const DataRow = ({ tokenData, index }: { tokenData: Token; index: number }) => {
  return (
    <ResponsiveGrid>
      <Label>{index + 1}</Label>
      <Label fontWeight={400}>{shortenAddress(tokenData.address)}</Label>
      <Label end={1} fontWeight={400}>
        {tokenData.address}
      </Label>
      <Label end={1} fontWeight={400}>
        {tokenData.symbol}
      </Label>
    </ResponsiveGrid>
  )
}

const MAX_ITEMS = 10

export default function TokenTable({ tokenDatas, maxItems = MAX_ITEMS }: { tokenDatas: Token[]; maxItems?: number }) {
  // theming
  const theme = useTheme()

  // for sorting
  const [sortField, setSortField] = useState(SORT_FIELD.name)
  const [sortDirection, setSortDirection] = useState<boolean>(true)

  // pagination
  const [page, setPage] = useState(1)
  const [maxPage, setMaxPage] = useState(1)
  useEffect(() => {
    let extraPages = 1
    if (tokenDatas.length % maxItems === 0) {
      extraPages = 0
    }
    setMaxPage(Math.floor(tokenDatas.length / maxItems) + extraPages)
  }, [maxItems, tokenDatas])

  const sortedTokens = useMemo(() => {
    return tokenDatas
      ? tokenDatas
          .filter((x) => !!x)
          .sort((a, b) => {
            if (a && b) {
              return a[sortField as keyof Token] > b[sortField as keyof Token]
                ? (sortDirection ? -1 : 1) * 1
                : (sortDirection ? -1 : 1) * -1
            } else {
              return -1
            }
          })
          .slice(maxItems * (page - 1), page * maxItems)
      : []
  }, [maxItems, page, tokenDatas, sortDirection, sortField])

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

  if (!tokenDatas) {
    return (
      <LoadingRows>
        <div />
      </LoadingRows>
    )
  }

  return (
    <Wrapper>
      {sortedTokens.length > 0 ? (
        <AutoColumn gap="16px">
          <ResponsiveGrid>
            <Label color={theme.deprecated_text2}>#</Label>
            <ClickableText color={theme.deprecated_text2} onClick={() => handleSort(SORT_FIELD.name)}>
              Name {arrow(SORT_FIELD.name)}
            </ClickableText>
          </ResponsiveGrid>
          <Break />
          {sortedTokens.map((tokenData, i) => {
            if (tokenData) {
              return (
                <React.Fragment key={i}>
                  <DataRow index={(page - 1) * MAX_ITEMS + i} tokenData={tokenData} />
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
