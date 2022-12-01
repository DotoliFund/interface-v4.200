import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Button as RebassButton } from 'rebass/styled-components'
import styled from 'styled-components/macro'

import {
  ArrowForward,
  ArrowRight,
  CoverBg,
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

const CoverSection = () => {
  const [hover, setHover] = useState(false)

  const onHover = () => {
    setHover(!hover)
  }

  return (
    <CoverContainer>
      <CoverBg></CoverBg>
      <CoverContent>
        <CoverH1>Awesome Title Goes Here</CoverH1>
        <CoverP>Sign up for a new account today and consume awesome features from our website.</CoverP>
        <CoverBtnWrapper>
          <Button primary={true} big={true} dark={true} fontBig={true}>
            Get started {hover ? <ArrowForward /> : <ArrowRight />}
          </Button>
        </CoverBtnWrapper>
      </CoverContent>
    </CoverContainer>
  )
}

export default function Home() {
  return (
    <div>
      <Trans>h1. Heading</Trans>
      <CoverSection />
      <InfoSection
        id={'about'}
        lightBg={false}
        lightText={true}
        topLine={'Title of the Company'}
        headline={'Sample headline goes here'}
        description={'Here we will place a detailed description of the service we are providing'}
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
        topLine={'4444444444444'}
        headline={'S33333333333333re'}
        description={'H333333333333333333333333333333333333333333oviding'}
        buttonLabel={'G4444444444ted'}
        imgStart={false}
        img={'logo192.png'}
        alt={'Car'}
        darkText={false}
      />
      <InfoSection
        id={'about'}
        lightBg={false}
        lightText={true}
        topLine={'Titlrrrrrrrrrrrrrrrrany'}
        headline={'Samplerrrrrrrrrrrrrrrrrrs here'}
        description={'Here we fffffffffffffffffffffffffffffffffffffffffroviding'}
        buttonLabel={'Gedddddddddddddted'}
        imgStart={false}
        img={'logo192.png'}
        alt={'Car'}
        darkText={false}
      />
    </div>
  )
}
