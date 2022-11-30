import { Col, Row } from 'antd'
import styled from 'styled-components/macro'

import { Button, SvgIcon } from '../common'

export const LeftContentSection = styled('section')`
  position: relative;
  padding: 10rem 0 8rem;

  @media only screen and (max-width: 768px) {
    padding: 4rem 0 4rem;
  }
`

export const Content = styled('p')`
  margin: 1.5rem 0 2rem 0;
`

export const ContentWrapper = styled('div')`
  position: relative;
  max-width: 540px;

  @media only screen and (max-width: 480px) {
    margin: 2rem 0;
  }
`

export const ServiceWrapper = styled('div')`
  display: flex;
  justify-content: space-between;
  max-width: 100%;
`

export const MinTitle = styled('h6')`
  font-size: 1rem;
  line-height: 1rem;
  padding: 0.5rem 0;
`

export const MinPara = styled('p')`
  font-size: 0.75rem;
`

export const RightBlockContainer = styled('section')`
  position: relative;
  padding: 10rem 0 8rem;

  @media only screen and (max-width: 768px) {
    padding: 8rem 0 6rem;
  }
`

export const ButtonWrapper = styled('div')`
  display: flex;
  justify-content: space-between;
  max-width: 400px;
`

const LeftContentBlock = ({ icon, title, content, section, id }: ContentBlockProps) => {
  return (
    <LeftContentSection>
      <Row justify="space-between" align="middle" id={id}>
        <Col lg={11} md={11} sm={12} xs={24}>
          <SvgIcon src={icon} width="100%" height="100%" />
        </Col>
        <Col lg={11} md={11} sm={11} xs={24}>
          <ContentWrapper>
            <h6>{title}</h6>
            <Content>{content}</Content>
            <ServiceWrapper>
              <Row justify="space-between">
                {typeof section === 'object' &&
                  section.map((item: any, id: number) => {
                    return (
                      <Col key={id} span={11}>
                        <SvgIcon src={item.icon} width="60px" height="60px" />
                        <MinTitle>{item.title}</MinTitle>
                        <MinPara>{item.content}</MinPara>
                      </Col>
                    )
                  })}
              </Row>
            </ServiceWrapper>
          </ContentWrapper>
        </Col>
      </Row>
    </LeftContentSection>
  )
}

const RightContentBlock = ({ title, content, button, icon, id }: ContentBlockProps) => {
  const scrollTo = (id: string) => {
    const element = document.getElementById(id) as HTMLDivElement
    element.scrollIntoView({
      behavior: 'smooth',
    })
  }
  return (
    <RightBlockContainer>
      <Row justify="space-between" align="middle" id={id}>
        <Col lg={11} md={11} sm={11} xs={24}>
          <ContentWrapper>
            <h6>{title}</h6>
            <Content>{content}</Content>
            <ButtonWrapper>
              {typeof button === 'object' &&
                button.map((item: any, id: number) => {
                  return (
                    <Button key={id} color={item.color} fixedWidth={true} onClick={() => scrollTo('about')}>
                      {item.title}
                    </Button>
                  )
                })}
            </ButtonWrapper>
          </ContentWrapper>
        </Col>
        <Col lg={11} md={11} sm={12} xs={24}>
          <SvgIcon src={icon} width="100%" height="100%" />
        </Col>
      </Row>
    </RightBlockContainer>
  )
}

interface ContentBlockProps {
  icon: string
  title: string
  content: string
  section?: any
  button?: any
  id: string
  type?: string
}

const ContentBlock = (props: ContentBlockProps) => {
  if (props.type === 'left') return <LeftContentBlock {...props} />
  if (props.type === 'right') return <RightContentBlock {...props} />
  return null
}

export default ContentBlock
