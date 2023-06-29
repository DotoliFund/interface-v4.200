import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { RowBetween } from 'components/Row'
import { VOTE_URL } from 'constants/addresses'
import { isSupportedChain } from 'constants/chains'
import { ErrorContainer, NetworkIcon } from 'pages/Account'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button as RebassButton } from 'rebass/styled-components'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

import {
  ArrowForward,
  ArrowRight,
  CoverBtnWrapper,
  CoverContainer,
  CoverContent,
  CoverH1,
  CoverP,
} from './CoverElements'

const Button = styled(RebassButton)<{ primary?: boolean; big?: boolean; dark?: boolean; fontBig?: boolean }>`
  border-radius: 50px;
  background: ${({ primary }) => (primary ? '#01BF71' : '#010606')};
  white-space: nowrap;
  padding: ${({ big }) => (big ? '14px 48px' : '12px 30px')};
  color: ${({ dark }) => (dark ? '#010606' : '#fff')};
  font-size: ${({ fontBig }) => (fontBig ? '20px' : '16px')};
  outline: none;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease-in-out;
  &:hover {
    transition: all 0.2s ease-in-out;
    background: ${({ primary }) => (primary ? '#fff' : '#01BF71')};
  }
`

export default function Home() {
  const { chainId } = useWeb3React()
  const navigate = useNavigate()
  const theme = useTheme()

  const [hover, setHover] = useState(false)

  return (
    <div>
      {isSupportedChain(chainId) ? (
        <>
          <CoverContainer>
            <CoverContent>
              <CoverH1>
                <Trans>Manage or Invest crypto fund with confidence</Trans>
              </CoverH1>
              <CoverP>
                <Trans>Swap and Provide Liquidity via Uniswap</Trans>
              </CoverP>
              <CoverBtnWrapper>
                <Button
                  primary={true}
                  big={true}
                  dark={true}
                  fontBig={true}
                  marginRight="15px"
                  onClick={() => navigate(`/account`)}
                >
                  <Trans>Get Started</Trans> {hover ? <ArrowForward /> : <ArrowRight />}
                </Button>
              </CoverBtnWrapper>
            </CoverContent>
          </CoverContainer>

          <CoverContainer>
            <CoverContent>
              <CoverH1>
                <Trans>More benefits for investors and fund managers</Trans>
              </CoverH1>
              <CoverP>
                <Trans>
                  Since the investor invests directly to the fund manager, the fee is low, and the fund manager get
                  rewards in proportion to the investment performance
                </Trans>
              </CoverP>
            </CoverContent>
          </CoverContainer>

          <CoverContainer>
            <CoverContent>
              <CoverH1>
                <Trans>Decentralized fund investment</Trans>
              </CoverH1>
              <CoverP>
                <Trans>
                  Only investors can withdraw their own funds. Fund managers can only swap token or manage pool via
                  Dotoli and Uniswap
                </Trans>
              </CoverP>
            </CoverContent>
          </CoverContainer>

          <CoverContainer>
            <CoverContent>
              <CoverH1>
                <Trans>Transparent fund management</Trans>
              </CoverH1>
              <CoverP>
                <Trans>
                  All investments made by the fund manager are recorded. Investors can find great fund managers. Also,
                  fund managers can attract investors through investment performance.
                </Trans>
              </CoverP>
            </CoverContent>
          </CoverContainer>

          <CoverContainer>
            <CoverContent>
              <CoverH1>
                <Trans>Governance</Trans>
              </CoverH1>
              <CoverP>
                <Trans>
                  Fee rate and investable cryptos are determined by voting. You can vote with governance token and
                  increase governance token by staking
                </Trans>
              </CoverP>

              <CoverBtnWrapper>
                <RowBetween>
                  <Button
                    primary={true}
                    big={true}
                    dark={true}
                    fontBig={true}
                    marginRight="15px"
                    onClick={() => navigate(`/staking`)}
                  >
                    <Trans>Staking</Trans> {hover ? <ArrowForward /> : <ArrowRight />}
                  </Button>
                  <Button
                    primary={true}
                    big={true}
                    dark={true}
                    fontBig={true}
                    onClick={() => {
                      window.open(VOTE_URL)
                    }}
                  >
                    <Trans>Governance</Trans> {hover ? <ArrowForward /> : <ArrowRight />}
                  </Button>
                </RowBetween>
              </CoverBtnWrapper>
            </CoverContent>
          </CoverContainer>
        </>
      ) : chainId !== undefined ? (
        <ErrorContainer>
          <ThemedText.DeprecatedBody color={theme.deprecated_text4} textAlign="center">
            <NetworkIcon strokeWidth={1.2} />
            <div data-testid="pools-unsupported-err">
              <Trans>Your connected network is unsupported.</Trans>
            </div>
          </ThemedText.DeprecatedBody>
        </ErrorContainer>
      ) : null}
    </div>
  )
}
