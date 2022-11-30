import styled from 'styled-components/macro'

const Content = styled('p')`
  margin-top: 1.5rem;
`

const Container = styled('div')`
  position: relative;
  max-width: 700px;
`

const TextWrapper = styled('div')`
  border-radius: 3rem;
  max-width: 400px;
`

interface Props {
  title: string
  content: string
}

const Block = ({ title, content }: Props) => {
  return (
    <Container>
      <h6>{title}</h6>
      <TextWrapper>
        <Content>{content}</Content>
      </TextWrapper>
    </Container>
  )
}

export default Block
