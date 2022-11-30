import { Col, Row } from 'antd'
import styled from 'styled-components/macro'

import { Button, Input, TextArea } from '../common'
import validate, { useForm } from '../utils'
import Block from './Block'

const ContactContainer = styled('div')`
  padding: 5rem 0;
`

const FormGroup = styled('form')`
  width: 100%;
  max-width: 520px;

  @media only screen and (max-width: 1045px) {
    max-width: 100%;
    margin-top: 2rem;
  }
`

const Span = styled('span')<any>`
  display: block;
  font-weight: 600;
  color: rgb(255, 130, 92);
  height: 0.775rem;
  padding: 0 0.675rem;
`

const ButtonContainer = styled('div')`
  text-align: end;
  position: relative;

  @media only screen and (max-width: 414px) {
    padding-top: 0.75rem;
  }
`

interface ContactProps {
  title: string
  content: string
  id: string
}

interface ValidationTypeProps {
  type: any
}

const Contact = ({ title, content, id }: ContactProps) => {
  const { values, errors, handleChange, handleSubmit } = useForm(validate) as any

  const ValidationType = ({ type }: ValidationTypeProps) => {
    const ErrorMessage = errors[type]
    return <Span erros={errors[type]}>{ErrorMessage}</Span>
  }

  return (
    <ContactContainer id={id}>
      <Row justify="space-between" align="middle">
        <Col lg={12} md={11} sm={24}>
          <Block title={title} content={content} />
        </Col>
        <Col lg={12} md={12} sm={24}>
          <FormGroup autoComplete="off" onSubmit={handleSubmit}>
            <Col span={24}>
              <Input
                type="text"
                name="name"
                placeholder="Your Name"
                value={values.name || ''}
                onChange={handleChange}
              />
              <ValidationType type="name" />
            </Col>
            <Col span={24}>
              <Input
                type="text"
                name="email"
                placeholder="Your Email"
                value={values.email || ''}
                onChange={handleChange}
              />
              <ValidationType type="email" />
            </Col>
            <Col span={24}>
              <TextArea
                placeholder="Your Message"
                value={values.message || ''}
                name="message"
                onChange={handleChange}
              />
              <ValidationType type="message" />
            </Col>
            <ButtonContainer>
              <Button name="submit">{'Submit'}</Button>
            </ButtonContainer>
          </FormGroup>
        </Col>
      </Row>
    </ContactContainer>
  )
}

export default Contact
