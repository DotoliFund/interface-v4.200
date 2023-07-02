import { Trans } from '@lingui/macro'
import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { LoadingRows } from 'components/Loader/styled'
import Percent from 'components/Percent'
import { Arrow, Break, PageButtons } from 'components/shared'
import { ClickableText, Label } from 'components/Text'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { TopManager } from 'types/fund'
import { shortenAddress } from 'utils'
import { unixToDate } from 'utils/date'
import { formatDollarAmount } from 'utils/numbers'

const Wrapper = styled(OutlineCard)`
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
  manager: 'manager',
  current: 'current',
  principal: 'principal',
  profitRatio: 'profitRatio',
  created: 'createdAtTimestamp',
}

const DataRow = ({ managerData }: { managerData: TopManager; index: number }) => {
  return (
    <LinkWrapper to={'/fund/' + managerData.fundId + '/' + managerData.investor}>
      <ResponsiveGrid>
        <Label fontWeight={400}>{shortenAddress(managerData.investor)}</Label>
        <Label end={1} fontWeight={400}>
          {formatDollarAmount(managerData.currentUSD)}
        </Label>
        <Label end={1} fontWeight={400}>
          {formatDollarAmount(managerData.principalUSD)}
        </Label>
        <Label end={1} fontWeight={400}>
          <Percent value={managerData.profitRatio} wrap={false} />
        </Label>
        <Label end={1} fontWeight={400}>
          {unixToDate(managerData.createdAtTimestamp)}
        </Label>
      </ResponsiveGrid>
    </LinkWrapper>
  )
}

const MAX_ITEMS = 10

export default function TopManagerTable({
  managerDatas,
  maxItems = MAX_ITEMS,
}: {
  managerDatas: TopManager[]
  maxItems?: number
}) {
  // for sorting
  const [sortField, setSortField] = useState(SORT_FIELD.current)
  const [sortDirection, setSortDirection] = useState<boolean>(true)

  // pagination
  const [page, setPage] = useState(1)
  const [maxPage, setMaxPage] = useState(1)
  useEffect(() => {
    let extraPages = 1
    if (managerDatas.length % maxItems === 0) {
      extraPages = 0
    }
    setMaxPage(Math.floor(managerDatas.length / maxItems) + extraPages)
  }, [maxItems, managerDatas])

  const sortedManagers = useMemo(() => {
    return managerDatas
      ? managerDatas
          .filter((x) => !!x)
          .sort((a, b) => {
            if (a && b) {
              return a[sortField as keyof TopManager] > b[sortField as keyof TopManager]
                ? (sortDirection ? -1 : 1) * 1
                : (sortDirection ? -1 : 1) * -1
            } else {
              return -1
            }
          })
          .slice(maxItems * (page - 1), page * maxItems)
      : []
  }, [maxItems, page, managerDatas, sortDirection, sortField])

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

  if (!managerDatas) {
    return (
      <LoadingRows>
        <div />
      </LoadingRows>
    )
  }

  return (
    <Wrapper>
      {sortedManagers.length > 0 ? (
        <AutoColumn gap="16px">
          <ResponsiveGrid>
            <ClickableText onClick={() => handleSort(SORT_FIELD.manager)}>
              <ThemedText.DeprecatedDarkGray>
                <Trans>Manager</Trans> {arrow(SORT_FIELD.manager)}
              </ThemedText.DeprecatedDarkGray>
            </ClickableText>
            <ClickableText end={1} onClick={() => handleSort(SORT_FIELD.current)}>
              <ThemedText.DeprecatedDarkGray>
                <Trans>Current</Trans> {arrow(SORT_FIELD.current)}
              </ThemedText.DeprecatedDarkGray>
            </ClickableText>
            <ClickableText end={1} onClick={() => handleSort(SORT_FIELD.principal)}>
              <ThemedText.DeprecatedDarkGray>
                <Trans>Principal</Trans> {arrow(SORT_FIELD.principal)}
              </ThemedText.DeprecatedDarkGray>
            </ClickableText>
            <ClickableText end={1} onClick={() => handleSort(SORT_FIELD.profitRatio)}>
              <ThemedText.DeprecatedDarkGray>
                <Trans>Profit</Trans> {arrow(SORT_FIELD.profitRatio)}
              </ThemedText.DeprecatedDarkGray>
            </ClickableText>
            <ClickableText end={1} onClick={() => handleSort(SORT_FIELD.created)}>
              <ThemedText.DeprecatedDarkGray>
                <Trans>Created</Trans> {arrow(SORT_FIELD.created)}
              </ThemedText.DeprecatedDarkGray>
            </ClickableText>
          </ResponsiveGrid>
          <Break />
          {sortedManagers.map((managerData, i) => {
            if (managerData) {
              return (
                <React.Fragment key={i}>
                  <DataRow index={(page - 1) * MAX_ITEMS + i} managerData={managerData} />
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
