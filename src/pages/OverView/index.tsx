import { Trans } from '@lingui/macro'
import FundTable from 'components/funds/FundTable'
import { Suspense } from 'react'
import { useFundListData } from 'state/funds/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const MEDIUM_MEDIA_BREAKPOINT = '720px'
const MAX_WIDTH_MEDIA_BREAKPOINT = '960px'

const ExploreContainer = styled.div`
  width: 100%;
  min-width: 320px;
  padding: 68px 12px 0px;
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`
export const TitleContainer = styled.div`
  margin-bottom: 32px;
  max-width: 960px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
`
const FiltersContainer = styled.div`
  display: flex;
  gap: 8px;
  height: 40px;
  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    order: 2;
  }
`
const SearchContainer = styled(FiltersContainer)`
  width: 100%;
  margin-left: 8px;
  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    margin: 0px;
    order: 1;
  }
`
const FiltersWrapper = styled.div`
  display: flex;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin: 0 auto;
  margin-bottom: 20px;
  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    flex-direction: column;
    gap: 8px;
  }
`

export default function Overview() {
  const fundListData = useFundListData()

  return (
    <div>
      <ExploreContainer>
        <TitleContainer>
          <ThemedText.LargeHeader>
            <Trans>Top tokens on Uniswap</Trans>
          </ThemedText.LargeHeader>{' '}
        </TitleContainer>
        <FiltersWrapper>
          <FiltersContainer></FiltersContainer>
          <SearchContainer></SearchContainer>
        </FiltersWrapper>
      </ExploreContainer>
      <Suspense>
        <FundTable fundDatas={fundListData.data} />
      </Suspense>
    </div>
  )
}
