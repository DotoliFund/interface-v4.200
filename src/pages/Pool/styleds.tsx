import { LoadingRows as BaseLoadingRows } from 'components/Loader/styled'
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

export const LoadingRows = styled(BaseLoadingRows)`
  padding-top: 48px;
  min-width: 75%;
  max-width: 960px;
  grid-column-gap: 0.5em;
  grid-row-gap: 0.8em;
  grid-template-columns: repeat(3, 1fr);

  & > div:nth-child(4n + 1) {
    grid-column: 1 / 3;
  }
  & > div:nth-child(4n) {
    grid-column: 3 / 4;
    margin-bottom: 2em;
  }
`
