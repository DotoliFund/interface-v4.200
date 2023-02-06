import { RowBetween } from 'components/Row'
import { VOTE_URL } from 'constants/addresses'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button as RebassButton } from 'rebass/styled-components'
import styled from 'styled-components/macro'

import {
  ArrowForward,
  ArrowRight,
  CoverBtnWrapper,
  CoverContainer,
  CoverContent,
  CoverH1,
  CoverP,
} from './CoverElements'
import {
  BtnWrap,
  Column1,
  Column2,
  Heading,
  Img,
  ImgWrap,
  InfoContainer,
  InfoRow,
  InfoWrapper,
  Subtitle,
  TextWrapper,
  TopLine,
} from './InfoElements'

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

interface CoverSectionProps {
  headline: string
  description: string
  buttonNameA: string | undefined
}

const CoverSection = ({ headline, description, buttonNameA }: CoverSectionProps) => {
  const [hover, setHover] = useState(false)

  const onHover = () => {
    setHover(!hover)
  }

  return (
    <CoverContainer>
      <CoverContent>
        <CoverH1>{headline}</CoverH1>
        <CoverP>{description}</CoverP>
        <CoverBtnWrapper>
          <Button primary={true} big={true} dark={true} fontBig={true} marginRight={'15px'}>
            {buttonNameA} {hover ? <ArrowForward /> : <ArrowRight />}
          </Button>
        </CoverBtnWrapper>
      </CoverContent>
    </CoverContainer>
  )
}

interface InfoSectionProps {
  lightBg: boolean
  id: string
  imgStart: boolean
  topLine: string
  lightText: boolean
  headline: string
  darkText: boolean
  description: string
  buttonLabel: string
  img: string
  alt: string
}

const InfoSection = ({
  lightBg,
  id,
  imgStart,
  topLine,
  lightText,
  headline,
  darkText,
  description,
  buttonLabel,
  img,
  alt,
}: InfoSectionProps) => {
  return (
    <>
      <InfoContainer lightBg={lightBg} id={id}>
        <InfoWrapper>
          <InfoRow imgStart={imgStart}>
            <Column1>
              <TextWrapper>
                <TopLine>{topLine}</TopLine>
                <Heading lightText={lightText}>{headline}</Heading>
                <Subtitle darkText={darkText}>{description}</Subtitle>
                <BtnWrap>
                  <Button primary={true} big={true} dark={true} fontBig={true}>
                    {buttonLabel}
                  </Button>
                </BtnWrap>
              </TextWrapper>
            </Column1>
            <Column2>
              <ImgWrap>
                <Img src={img} alt={alt} />
              </ImgWrap>
            </Column2>
          </InfoRow>
        </InfoWrapper>
      </InfoContainer>
    </>
  )
}

export default function Home() {
  const [hover, setHover] = useState(false)
  const navigate = useNavigate()

  const onHover = () => {
    setHover(!hover)
  }

  return (
    <div>
      <CoverContainer>
        <CoverContent>
          <CoverH1>{'Manage or Invest crypto fund with confidence'}</CoverH1>
          <CoverP>{'Swap and Provide Liquidity with Uniswap'}</CoverP>
          <CoverBtnWrapper>
            <Button
              primary={true}
              big={true}
              dark={true}
              fontBig={true}
              marginRight={'15px'}
              onClick={() => navigate(`/account`)}
            >
              {'Get Started'} {hover ? <ArrowForward /> : <ArrowRight />}
            </Button>
          </CoverBtnWrapper>
        </CoverContent>
      </CoverContainer>

      <CoverContainer>
        <CoverContent>
          <CoverH1>{'Efficient Profits and Fees'}</CoverH1>
          <CoverP>
            {
              'More benefits for managers and investors. Because of no third parties, Managers are rewarded according to their investment results'
            }
          </CoverP>
        </CoverContent>
      </CoverContainer>

      <CoverContainer>
        <CoverContent>
          <CoverH1>{'Decentralized fund investment'}</CoverH1>
          <CoverP>
            {'Only investors can withdraw their own funds. Managers can only swap or provide Uniswap liquidity'}
          </CoverP>
        </CoverContent>
      </CoverContainer>

      <CoverContainer>
        <CoverContent>
          <CoverH1>{'Transparent fund management'}</CoverH1>
          <CoverP>
            {'All investments of the manager are recorded. Investors can choose the best manager at any time'}
          </CoverP>
        </CoverContent>
      </CoverContainer>

      <CoverContainer>
        <CoverContent>
          <CoverH1>{'Governance'}</CoverH1>
          <CoverP>
            {
              'Fee rate and investable cryptos are determined by voting. You can vote with governance token and increase governance token by staking'
            }
          </CoverP>

          <CoverBtnWrapper>
            <RowBetween>
              <Button
                primary={true}
                big={true}
                dark={true}
                fontBig={true}
                marginRight={'15px'}
                onClick={() => navigate(`/staking`)}
              >
                {'Staking'} {hover ? <ArrowForward /> : <ArrowRight />}
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
                {'Governance'} {hover ? <ArrowForward /> : <ArrowRight />}
              </Button>
            </RowBetween>
          </CoverBtnWrapper>
        </CoverContent>
      </CoverContainer>

      {/* <InfoSection
        id={'about'}
        lightBg={false}
        lightText={true}
        topLine={'Efficient Profits and Fees'}
        headline={'More benefits for managers and investors because of no third parties'}
        description={'Managers are rewarded according to their investment results'}
        buttonLabel={'Get started'}
        imgStart={false}
        img={'logo192.png'}
        alt={'Car'}
        darkText={false}
      />
      <InfoSection
        id={'about'}
        lightBg={false}
        lightText={true}
        topLine={'Decentralized fund investment'}
        headline={'Only investors can withdraw their own funds'}
        description={'Managers can only swap or provide Uniswap liquidity'}
        buttonLabel={'Get started'}
        imgStart={false}
        img={'logo192.png'}
        alt={'Car'}
        darkText={false}
      />
      <InfoSection
        id={'about'}
        lightBg={false}
        lightText={true}
        topLine={'Transparent fund management'}
        headline={'All investments of the manager are recorded'}
        description={'Investors can choose the best manager at any time'}
        buttonLabel={'Get started'}
        imgStart={false}
        img={'logo192.png'}
        alt={'Car'}
        darkText={false}
      />
      <InfoSection
        id={'about'}
        lightBg={false}
        lightText={true}
        topLine={'Governance'}
        headline={'Fee rate and investable cryptos are determined by voting'}
        description={'You can vote with governance token and increase governance token by staking'}
        buttonLabel={'Get started'}
        imgStart={false}
        img={'logo192.png'}
        alt={'Car'}
        darkText={false}
      /> */}
    </div>
  )
}
