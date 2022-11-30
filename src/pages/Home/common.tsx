import { useEffect, useState } from 'react'
import styled from 'styled-components/macro'

import { ButtonProps, ContainerProps, InputProps, SvgIconProps } from './types'
import { getScroll } from './utils'

export const ContactContainer = styled('div')`
  padding: 5rem 0;

  @media only screen and (max-width: 1024px) {
    padding: 3rem 0;
  }
`

export const FormGroup = styled('form')`
  width: 100%;
  max-width: 520px;

  @media only screen and (max-width: 1045px) {
    max-width: 100%;
    margin-top: 2rem;
  }
`

export const Span = styled('span')<any>`
  display: block;
  font-weight: 600;
  color: rgb(255, 130, 92);
  height: 0.775rem;
  padding: 0 0.675rem;
`

export const ButtonContainer = styled('div')`
  text-align: end;
  position: relative;

  @media only screen and (max-width: 414px) {
    padding-top: 0.75rem;
  }
`
export const StyledButton = styled('button')<any>`
  background: ${(p) => p.color || '#2e186a'};
  color: ${(p) => (p.color ? '#2E186A' : '#fff')};
  font-size: 1rem;
  font-weight: 700;
  width: 100%;
  border: 1px solid #edf3f5;
  border-radius: 4px;
  padding: 13px 0;
  cursor: pointer;
  margin-top: 0.625rem;
  max-width: 180px;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 16px 30px rgb(23 31 114 / 20%);
  &:hover,
  &:active,
  &:focus {
    color: #fff;
    border: 1px solid rgb(255, 130, 92);
    background-color: rgb(255, 130, 92);
  }
`

export const StyledContainer = styled('div')<any>`
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin-right: auto;
  margin-left: auto;
  padding: 0 60px;
  border-top: ${(p) => (p.border ? '1px solid #CDD1D4' : '')};
  @media only screen and (max-width: 1024px) {
    max-width: calc(100% - 68px);
    padding: 0 30px;
  }
  @media only screen and (max-width: 768px) {
    max-width: calc(100% - 38px);
    padding: 0 18px;
  }
  @media only screen and (max-width: 414px) {
    max-width: 100%;
    padding: 0 18px;
  }
`

export const InputContainer = styled('div')`
  display: inline-block;
  width: 100%;
  padding: 10px 5px;
`

export const StyledInput = styled('input')`
  font-size: 0.875rem;
`

export const TextAreaContainer = styled('div')`
  display: inline-block;
  width: 100%;
  padding: 10px 5px;
  margin-bottom: -0.625rem;
`

export const StyledTextArea = styled('textarea')`
  resize: none;
  font-size: 0.875rem;
  height: 185px;
`

export const Label = styled('label')`
  display: block;
  padding-bottom: 10px;
  text-transform: capitalize;
`

export const ScrollUpContainer = styled('div')<any>`
  padding: 10px;
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 10;
  cursor: pointer;
  background: rgb(241, 242, 243);
  text-align: center;
  align-items: center;
  border-radius: 4px;
  transition: all 0.3s ease-in-out;
  visibility: ${(p) => (p.show ? 'visible' : 'hidden')};
  opacity: ${(p) => (p.show ? '1' : '0')};
  display: flex;
  &:hover,
  &:active,
  &:focus {
    background: rgb(224, 224, 224);
  }
  @media screen and (max-width: 1240px) {
    display: none;
  }
`

export const Button = ({ color, fixedWidth, children, onClick }: ButtonProps) => (
  <StyledButton color={color} fixedWidth={fixedWidth} onClick={onClick}>
    {children}
  </StyledButton>
)

export const Container = ({ border, children }: ContainerProps) => (
  <StyledContainer border={border}>{children}</StyledContainer>
)

export const Input = ({ name, placeholder, onChange }: InputProps) => (
  <InputContainer>
    <Label htmlFor={name}>{name}</Label>
    <StyledInput placeholder={placeholder} name={name} id={name} onChange={onChange} />
  </InputContainer>
)

export const TextArea = ({ name, placeholder, onChange }: InputProps) => (
  <TextAreaContainer>
    <Label htmlFor={name}>{name}</Label>
    <StyledTextArea placeholder={placeholder} id={name} name={name} onChange={onChange} />
  </TextAreaContainer>
)

export const ScrollToTop = () => {
  const [showScroll, setShowScroll] = useState(false)

  const checkScrollTop = (event: any) => {
    const offsetFromTop = getScroll(event.target, true)

    if (!showScroll && offsetFromTop > 350) {
      setShowScroll(true)
    } else if (offsetFromTop <= 350) {
      setShowScroll(false)
    }
  }

  useEffect(() => {
    window.addEventListener('scroll', checkScrollTop)
    return () => {
      window.removeEventListener('scroll', checkScrollTop)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scrollUp = () => {
    const element = document.getElementById('intro') as HTMLDivElement
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest',
    })
  }

  return (
    <ScrollUpContainer onClick={scrollUp} show={showScroll}>
      <SvgIcon src="scroll-top.svg" width="20px" height="20px" />
    </ScrollUpContainer>
  )
}

export const SvgIcon = ({ src, width, height }: SvgIconProps) => (
  <img src={`/img/svg/${src}`} alt={src} width={width} height={height} />
)
