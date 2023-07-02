import { loadingOpacityMixin } from 'components/Loader/styled'
import { darken } from 'polished'
import styled from 'styled-components/macro'
import { flexColumnNoWrap, flexRowNoWrap } from 'theme/styles'

import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import { ButtonGray } from '../Button'
import { Input as NumericalInput } from '../NumericalInput'

export const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${flexColumnNoWrap};
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '16px' : '20px')};
  z-index: 1;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  transition: height 1s ease;
  will-change: height;
`

export const FixedContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`

export const Container = styled.div<{ hideInput: boolean }>`
  min-height: 44px;
  border-radius: ${({ hideInput }) => (hideInput ? '16px' : '20px')};
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
`

export const CurrencySelect = styled(ButtonGray)<{
  visible: boolean
  selected: boolean
  hideInput?: boolean
  disabled?: boolean
}>`
  align-items: center;
  background-color: ${({ selected, theme }) => (selected ? theme.backgroundInteractive : theme.accentAction)};
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')};
  color: ${({ selected, theme }) => (selected ? theme.textPrimary : theme.white)};
  cursor: pointer;
  height: unset;
  border-radius: 16px;
  outline: none;
  user-select: none;
  border: none;
  font-size: 24px;
  font-weight: 400;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  padding: ${({ selected }) => (selected ? '4px 8px 4px 4px' : '6px 6px 6px 8px')};
  gap: 8px;
  justify-content: space-between;
  margin-left: ${({ hideInput }) => (hideInput ? '0' : '12px')};
  &:hover,
  &:active {
    background-color: ${({ theme, selected }) => (selected ? theme.deprecated_bg3 : theme.accentAction)};
  }
  &:before {
    background-size: 100%;
    border-radius: inherit;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: '';
  }
  &:hover:before {
    background-color: ${({ theme }) => theme.stateOverlayHover};
  }
  &:active:before {
    background-color: ${({ theme }) => theme.stateOverlayPressed};
  }
  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
`

export const InputRow = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  justify-content: space-between;
`

const LabelRow = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 0.75rem;
  line-height: 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.deprecated_text4)};
  }
`

export const FiatRow = styled(LabelRow)`
  justify-content: flex-end;
  min-height: 20px;
  padding: 8px 0px 0px 0px;
`

export const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

export const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  margin: 0 0.25rem 0 0.35rem;
  height: 35%;
  margin-left: 8px;
  path {
    stroke: ${({ selected, theme }) => (selected ? theme.deprecated_text4 : theme.deprecated_blue4)};
    stroke-width: 2px;
  }
`

export const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.25rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size: 20px;
  font-weight: 600;
`

export const StyledBalanceMax = styled.button<{ disabled?: boolean }>`
  background-color: transparent;
  border: none;
  color: ${({ theme }) => theme.accentAction};
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  padding: 4px 6px;
  pointer-events: ${({ disabled }) => (!disabled ? 'initial' : 'none')};
  :hover {
    opacity: ${({ disabled }) => (!disabled ? 0.8 : 0.4)};
  }
  :focus {
    outline: none;
  }
`

export const StyledNumericalInput = styled(NumericalInput)<{ $loading: boolean }>`
  ${loadingOpacityMixin};
  text-align: left;
  font-size: 36px;
  line-height: 44px;
  font-variant: small-caps;
`
