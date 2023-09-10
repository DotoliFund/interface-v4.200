import styled from 'styled-components/macro'
import { Z_INDEX } from 'theme/zIndex'

interface BodyWrapperProps {
  $margin?: string
  $maxWidth?: string
}

export const BodyWrapper = styled.main<BodyWrapperProps>`
  position: relative;
  margin-top: ${({ $margin }) => $margin ?? '0px'};
  max-width: ${({ $maxWidth }) => $maxWidth ?? '420px'};
  width: 100%;
  background: ${({ theme }) => theme.deprecated_bg1};
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  margin-top: 1rem;
  margin-left: auto;
  margin-right: auto;
  z-index: ${Z_INDEX.deprecated_zero};
  font-feature-settings: 'ss01' on, 'ss02' on, 'cv01' on, 'cv03' on;
`
