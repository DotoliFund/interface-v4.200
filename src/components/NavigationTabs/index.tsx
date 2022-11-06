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
  fundAddress,
  investorAddress,
  tokenId,
  children,
}: {
  adding: boolean
  defaultSlippage: Percent
  fundAddress: string | undefined
  investorAddress: string | undefined
  tokenId?: string | undefined
  children?: ReactNode | undefined
}) {
  const theme = useTheme()

  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem 1rem 0 1rem' }}>
        {tokenId ? (
          <StyledHistoryLink
            to={`/pool/${fundAddress}/${investorAddress}/${tokenId}`}
            flex={children ? '1' : undefined}
          >
            <StyledArrowLeft stroke={theme.deprecated_text2} />
          </StyledHistoryLink>
        ) : (
          <StyledHistoryLink to={`/fund/${fundAddress}/${investorAddress}`} flex={children ? '1' : undefined}>
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
