import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { ReactNode } from 'react'
import { ArrowLeft } from 'react-feather'
import { Link as HistoryLink } from 'react-router-dom'
import { Box } from 'rebass'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

import { RowBetween } from '../Row'
import SettingsTab from '../Settings'

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  border-radius: 3rem;
  justify-content: space-evenly;
`

const StyledHistoryLink = styled(HistoryLink)<{ flex: string | undefined }>`
  flex: ${({ flex }) => flex ?? 'none'};

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    flex: none;
    margin-right: 10px;
  `};
`

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${({ theme }) => theme.deprecated_text1};
`

export function NavigationsTabs({
  adding,
  defaultSlippage,
  fundId,
  investor,
  tokenId,
  children,
}: {
  adding: boolean
  defaultSlippage: Percent
  fundId: string | undefined
  investor: string | undefined
  tokenId?: string | undefined
  children?: ReactNode | undefined
}) {
  const theme = useTheme()

  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem 1rem 0 1rem' }}>
        {tokenId ? (
          <StyledHistoryLink to={`/pool/${fundId}/${investor}/${tokenId}`} flex={children ? '1' : undefined}>
            <StyledArrowLeft stroke={theme.deprecated_text2} />
          </StyledHistoryLink>
        ) : (
          <StyledHistoryLink to={`/fund/${fundId}/${investor}`} flex={children ? '1' : undefined}>
            <StyledArrowLeft stroke={theme.deprecated_text2} />
          </StyledHistoryLink>
        )}
        <ThemedText.DeprecatedMediumHeader
          fontWeight={500}
          fontSize={20}
          style={{ flex: '1', margin: 'auto', textAlign: children ? 'start' : 'center' }}
        >
          {adding ? <Trans>Add Liquidity</Trans> : <Trans>Remove Liquidity</Trans>}
        </ThemedText.DeprecatedMediumHeader>
        <Box style={{ marginRight: '.5rem' }}>{children}</Box>
        <SettingsTab placeholderSlippage={defaultSlippage} />
      </RowBetween>
    </Tabs>
  )
}

export function AddRemoveTabs({
  adding,
  creating,
  defaultSlippage,
  fundId,
  investor,
  positionID,
  children,
}: {
  adding: boolean
  creating: boolean
  defaultSlippage: Percent
  fundId: string
  investor: string
  positionID?: string | undefined
  showBackLink?: boolean
  children?: ReactNode | undefined
}) {
  const theme = useTheme()

  const poolLink = `/pool/${fundId}/${investor}/${positionID}`

  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem 1rem 0 1rem' }}>
        <StyledHistoryLink to={poolLink} flex={children ? '1' : undefined}>
          <StyledArrowLeft stroke={theme.textSecondary} />
        </StyledHistoryLink>
        <ThemedText.DeprecatedMediumHeader
          fontWeight={500}
          fontSize={20}
          style={{ flex: '1', margin: 'auto', textAlign: children ? 'start' : 'center' }}
        >
          {creating ? (
            <Trans>Create a pair</Trans>
          ) : adding ? (
            <Trans>Add Liquidity</Trans>
          ) : (
            <Trans>Remove Liquidity</Trans>
          )}
        </ThemedText.DeprecatedMediumHeader>
        <Box style={{ marginRight: '.5rem' }}>{children}</Box>
        <SettingsTab placeholderSlippage={defaultSlippage} />
      </RowBetween>
    </Tabs>
  )
}
