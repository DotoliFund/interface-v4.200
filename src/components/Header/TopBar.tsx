import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { getChainInfoOrDefault } from 'constants/chainInfo'
import React from 'react'
import { Text } from 'rebass'
import { useNativeCurrencyBalances } from 'state/connection/hooks'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'

import { SupportedNetwork } from '../../constants/networks'
import { useActiveNetworkVersion } from '../../state/application/hooks'
import Web3Status from '../Web3Status'
import NetworkSelector from './NetworkSelector'
import Polling from './Polling'

const Wrapper = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.black};
  padding: 10px 20px;
`

const Item = styled(ThemedText.DeprecatedMain)`
  font-size: 12px;
`

const StyledLink = styled(ExternalLink)`
  font-size: 12px;
  color: ${({ theme }) => theme.deprecated_text1};
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;

  &:not(:first-child) {
    margin-left: 0.5em;
  }

  /* addresses safaris lack of support for "gap" */
  & > *:not(:first-child) {
    margin-left: 8px;
  }

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    align-items: center;
  `};
`

const BalanceText = styled(Text)`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToExtraSmall`
    display: none;
  `};
`

const TopBar = () => {
  const { account, chainId } = useWeb3React()

  const {
    infoLink,
    nativeCurrency: { symbol: nativeCurrencySymbol },
  } = getChainInfoOrDefault(chainId)

  const userEthBalance = useNativeCurrencyBalances(account ? [account] : [])?.[account ?? '']

  const [activeNetwork] = useActiveNetworkVersion()
  return (
    <Wrapper>
      <RowBetween>
        <Polling />
        <AutoRow gap="6px">
          <RowFixed>
            {activeNetwork.id === SupportedNetwork.CELO ? <Item>Celo Price:</Item> : <Item>Eth Price:</Item>}
            <Item fontWeight="700" ml="4px">
              123
            </Item>
          </RowFixed>
        </AutoRow>
        <AutoRow gap="6px" style={{ justifyContent: 'flex-end' }}>
          <HeaderElement>
            <NetworkSelector />
          </HeaderElement>
          {account && userEthBalance ? (
            <BalanceText style={{ flexShrink: 0, userSelect: 'none' }} pl="0.75rem" pr=".4rem" fontWeight={500}>
              <Trans>
                {userEthBalance?.toSignificant(3)} {nativeCurrencySymbol}
              </Trans>
            </BalanceText>
          ) : null}
          <Web3Status />
        </AutoRow>
      </RowBetween>
    </Wrapper>
  )
}

export default TopBar
