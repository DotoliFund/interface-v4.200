import { Trans } from '@lingui/macro'
import { LoadingRows } from 'components/Loader/styled'
import { useFundData } from 'data/FundPage/fundData'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'
import { FundDetails } from 'types/fund'
import { unixToDate } from 'utils/date'
import { formatDollarAmount } from 'utils/numbers'

const LinkRow = styled(Link)`
  align-items: center;
  border-radius: 20px;
  display: flex;
  cursor: pointer;
  user-select: none;
  flex-direction: column;

  justify-content: space-between;
  color: ${({ theme }) => theme.textPrimary};
  padding: 12px;
  text-decoration: none;
  font-weight: 360;

  &:last-of-type {
    margin: 8px 0 0 0;
  }
  & > div:not(:first-child) {
    text-align: center;
  }
  :hover {
    background-color: ${({ theme }) => theme.deprecated_bg1};
  }

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    /* flex-direction: row; */
  }

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-direction: column;
    row-gap: 12px;
  `};
`

const DataLineItem = styled.div`
  font-size: 18px;
`

const RangeLineItem = styled(DataLineItem)`
  display: flex;
  flex-direction: row;
  align-items: center;

  width: 100%;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
  background-color: ${({ theme }) => theme.deprecated_bg1};
    border-radius: 12px;
    padding: 4px 0;
`};
`

const RangeText = styled.span`
  /* background-color: ${({ theme }) => theme.deprecated_bg1}; */
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
`

const ExtentsText = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.textSecondary};
  margin-right: 4px;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: none;
  `};
`

interface FundListItemProps {
  fundDetails: FundDetails
}

export default function FundListItem({ fundDetails }: FundListItemProps) {
  const { fundId } = fundDetails
  const fundData = useFundData(fundId).data
  const fundLink = '/fund/' + fundId

  return (
    <>
      {fundData ? (
        <LinkRow to={fundLink}>
          <RangeLineItem>
            &nbsp;
            <RangeText>
              <ExtentsText>
                <Trans>Current Asset : </Trans>
              </ExtentsText>
              {formatDollarAmount(fundData.currentUSD)}
            </RangeText>
            <RangeText>
              <ExtentsText>
                <Trans>Investors : </Trans>
              </ExtentsText>
              {fundData.investorCount}
            </RangeText>
            <RangeText>
              <ExtentsText>
                <Trans>Created : </Trans>
              </ExtentsText>
              {unixToDate(fundData.createdAtTimestamp)}
            </RangeText>
          </RangeLineItem>
        </LinkRow>
      ) : (
        <LoadingRows>
          <div style={{ height: '60px' }} />
        </LoadingRows>
      )}
    </>
  )
}
