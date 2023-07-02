import styled from 'styled-components/macro'

export const MaxButton = styled.button<{ width: string }>`
  padding: 0.5rem 1rem;
  background-color: ${({ theme }) => theme.deprecated_primary5};
  border: 1px solid ${({ theme }) => theme.deprecated_primary5};
  border-radius: 0.5rem;
  font-size: 1rem;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    padding: 0.25rem 0.5rem;
  `};
  font-weight: 500;
  cursor: pointer;
  margin: 0.25rem;
  overflow: hidden;
  color: ${({ theme }) => theme.deprecated_primary2};
  :hover {
    border: 1px solid ${({ theme }) => theme.deprecated_primary3};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.deprecated_primary2};
    outline: none;
  }
`
