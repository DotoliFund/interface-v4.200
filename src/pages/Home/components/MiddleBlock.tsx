import { Col, Row } from 'antd'
import styled from 'styled-components/macro'

import { Button } from '../common'

const MiddleBlockSection = styled('section')`
  position: relative;
  padding: 7.5rem 0 3rem;
  text-align: center;
  display: flex;
  justify-content: center;

  @media screen and (max-width: 768px) {
    padding: 5.5rem 0 3rem;
  }
`

const Content = styled('p')`
  padding: 0.75rem 0 0.75rem;
`

const ContentWrapper = styled('div')`
  max-width: 570px;

  @media only screen and (max-width: 768px) {
    max-width: 100%;
  }
`

interface MiddleBlockProps {
  title: string
  content: string
  button: string
}

const MiddleBlock = ({ title, content, button }: MiddleBlockProps) => {
  const scrollTo = (id: string) => {
    const element = document.getElementById(id) as HTMLDivElement
    element.scrollIntoView({
      behavior: 'smooth',
    })
  }
  return (
    <MiddleBlockSection>
      <Row justify="center" align="middle">
        <ContentWrapper>
          <Col lg={24} md={24} sm={24} xs={24}>
            <h6>{title}</h6>
            <Content>{content}</Content>
            {button && (
              <Button name="submit" onClick={() => scrollTo('mission')}>
                {button}
              </Button>
            )}
          </Col>
        </ContentWrapper>
      </Row>
    </MiddleBlockSection>
  )
}

export default MiddleBlock
