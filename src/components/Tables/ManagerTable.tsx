import { Trans } from '@lingui/macro'
import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { LoadingRows } from 'components/Loader/styled'
import Percent from 'components/Percent'
import { Break } from 'components/shared'
import { ClickableText, Label } from 'components/Text'
import React from 'react'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Manager } from 'types/fund'
import { shortenAddress } from 'utils'
import { formatTime } from 'utils/date'
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

const DataRow = ({ managerData }: { managerData: Manager }) => {
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
          {formatTime(managerData.updatedAtTimestamp.toString(), 8)}
        </Label>
      </ResponsiveGrid>
    </LinkWrapper>
  )
}

export default function ManagerTable({ managerData }: { managerData: Manager }) {
  // theming
  const theme = useTheme()

  if (!managerData) {
    return (
      <LoadingRows>
        <div />
      </LoadingRows>
    )
  }

  return (
    <Wrapper>
      {managerData ? (
        <AutoColumn gap="16px">
          <ResponsiveGrid>
            <ClickableText color={theme.deprecated_text4}>
              <ThemedText.DeprecatedDarkGray>
                <Trans>Manager</Trans>
              </ThemedText.DeprecatedDarkGray>
            </ClickableText>
            <ClickableText end={1} color={theme.deprecated_text4}>
              <ThemedText.DeprecatedDarkGray>
                <Trans>Current</Trans>
              </ThemedText.DeprecatedDarkGray>
            </ClickableText>
            <ClickableText end={1} color={theme.deprecated_text4}>
              <ThemedText.DeprecatedDarkGray>
                <Trans>Principal</Trans>
              </ThemedText.DeprecatedDarkGray>
            </ClickableText>
            <ClickableText end={1} color={theme.deprecated_text4}>
              <ThemedText.DeprecatedDarkGray>
                <Trans>Profit</Trans>
              </ThemedText.DeprecatedDarkGray>
            </ClickableText>
            <ClickableText end={1} color={theme.deprecated_text4}>
              <ThemedText.DeprecatedDarkGray>
                <Trans>Time</Trans>
              </ThemedText.DeprecatedDarkGray>
            </ClickableText>
          </ResponsiveGrid>
          <Break />
          <React.Fragment>
            <DataRow managerData={managerData} />
            <Break />
          </React.Fragment>
        </AutoColumn>
      ) : (
        <LoadingRows>
          <div />
        </LoadingRows>
      )}
    </Wrapper>
  )
}
