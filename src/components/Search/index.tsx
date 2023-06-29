import { AutoColumn } from 'components/Column'
import Row, { RowFixed } from 'components/Row'
import React, { useRef, useState } from 'react'
import styled from 'styled-components/macro'
import { HideSmall, ThemedText } from 'theme'

const Container = styled.div`
  position: relative;
  z-index: 30;
  width: 100%;
`

const Wrapper = styled(Row)`
  background-color: ${({ theme }) => theme.black};
  padding: 10px 16px;
  width: 500px;
  height: 38px;
  border-radius: 20px;
  positon: relative;
  z-index: 9999;

  @media (max-width: 1080px) {
    width: 100%;
  }
`

const StyledInput = styled.input`
  position: relative;
  display: flex;
  align-items: center;
  white-space: nowrap;
  background: none;
  border: none;
  width: 100%;
  font-size: 16px;
  outline: none;
  color: ${({ theme }) => theme.deprecated_text4};

  ::placeholder {
    color: ${({ theme }) => theme.deprecated_text4};
    font-size: 16px;
  }

  @media screen and (max-width: 640px) {
    ::placeholder {
      font-size: 1rem;
    }
  }
`

const Menu = styled.div<{ hide: boolean }>`
  display: flex;
  flex-direction: column;
  z-index: 9999;
  width: 800px;
  top: 50px;
  max-height: 600px;
  overflow: auto;
  right: 0;
  padding: 1.5rem;
  padding-bottom: 1.5rem;
  position: absolute;
  background: ${({ theme }) => theme.deprecated_bg1};
  border-radius: 8px;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.04);
  display: ${({ hide }) => hide && 'none'};
  border: 1px solid ${({ theme }) => theme.deprecated_yellow1};

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    position: absolute;
    margin-top: 4px;
    z-index: 9999;
    width: 100%;
    max-height: 400px;
  `};
`

const Blackout = styled.div`
  position: absolute;
  min-height: 100vh;
  width: 100vw;
  z-index: -40;
  background-color: black;
  opacity: 0.7;
  left: 0;
  top: 0;
`

const ResponsiveGrid = styled.div`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: 1.5fr repeat(3, 1fr);
  align-items: center;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    grid-template-columns: 1fr;
  `};
`

const Break = styled.div`
  height: 1px;
  background-color: ${({ theme }) => theme.deprecated_bg1};
  width: 100%;
`

const HoverText = styled.div<{ hide?: boolean | undefined }>`
  color: ${({ theme }) => theme.deprecated_blue4};
  display: ${({ hide = false }) => hide && 'none'};
  :hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const Search = ({ ...rest }: React.HTMLAttributes<HTMLDivElement>) => {
  const [showMenu, setShowMenu] = useState(false)
  const [value, setValue] = useState('')

  const ref = useRef<HTMLInputElement>(null)

  const [focused, setFocused] = useState<boolean>(false)

  return (
    <>
      {showMenu ? <Blackout /> : null}
      <Container>
        <Wrapper {...rest}>
          <StyledInput
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
            }}
            placeholder="Search pools or tokens"
            ref={ref}
            onFocus={() => {
              setFocused(true)
              setShowMenu(true)
            }}
            onBlur={() => setFocused(false)}
          />
          {!focused && <ThemedText.DeprecatedGray pl="2px">⌘/</ThemedText.DeprecatedGray>}
        </Wrapper>
        <Menu hide={!showMenu}>
          <AutoColumn gap="lg">
            <AutoColumn gap="sm">
              <RowFixed>Search</RowFixed>
            </AutoColumn>
            <ResponsiveGrid>
              <ThemedText.DeprecatedMain>Tokens</ThemedText.DeprecatedMain>
              <HideSmall>
                <ThemedText.DeprecatedMain textAlign="end" fontSize="12px">
                  Volume 24H
                </ThemedText.DeprecatedMain>
              </HideSmall>
              <HideSmall>
                <ThemedText.DeprecatedMain textAlign="end" fontSize="12px">
                  TVL
                </ThemedText.DeprecatedMain>
              </HideSmall>
              <HideSmall>
                <ThemedText.DeprecatedMain textAlign="end" fontSize="12px">
                  Price
                </ThemedText.DeprecatedMain>
              </HideSmall>
            </ResponsiveGrid>

            <HoverText>See more...</HoverText>
            <Break />
            <ResponsiveGrid>
              <ThemedText.DeprecatedMain>Pools</ThemedText.DeprecatedMain>
              <HideSmall>
                <ThemedText.DeprecatedMain textAlign="end" fontSize="12px">
                  Volume 24H
                </ThemedText.DeprecatedMain>
              </HideSmall>
              <HideSmall>
                <ThemedText.DeprecatedMain textAlign="end" fontSize="12px">
                  TVL
                </ThemedText.DeprecatedMain>
              </HideSmall>
              <HideSmall>
                <ThemedText.DeprecatedMain textAlign="end" fontSize="12px">
                  Price
                </ThemedText.DeprecatedMain>
              </HideSmall>
            </ResponsiveGrid>

            <HoverText>See more...</HoverText>
          </AutoColumn>
        </Menu>
      </Container>
    </>
  )
}

export default Search
