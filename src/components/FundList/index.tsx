import { Trans } from '@lingui/macro'
import FundListItem from 'components/FundListItem'
import React from 'react'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'
import { FundDetails } from 'types/fund'

const DesktopHeader = styled.div`
  display: none;
  font-size: 14px;
  font-weight: 500;
  padding: 8px;

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    align-items: center;
    display: flex;
    justify-content: space-between;
    & > div:last-child {
      text-align: right;
      margin-right: 12px;
    }
  }
`

const MobileHeader = styled.div`
  font-weight: medium;
  font-size: 16px;
  font-weight: 500;
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    display: none;
  }

  @media screen and (max-width: ${MEDIA_WIDTHS.deprecated_upToExtraSmall}px) {
    display: flex;
    flex-direction: column;
    align-items: start;
  }
`

type FundListProps = React.PropsWithChildren<{
  isManagingFund: boolean
  funds: FundDetails[]
}>

export default function FundList({ isManagingFund, funds }: FundListProps) {
  return (
    <>
      <DesktopHeader>
        <div>
          {!isManagingFund ? <Trans>Investing Funds</Trans> : <Trans>Managing Fund</Trans>}
          {!isManagingFund ? funds && ' (' + funds.length + ')' : null}
        </div>
      </DesktopHeader>
      <MobileHeader>
        {!isManagingFund ? <Trans>Investing Funds</Trans> : <Trans>Managing Fund</Trans>}
        {!isManagingFund ? funds && ' (' + funds.length + ')' : null}
      </MobileHeader>
      {funds.map((p) => {
        return <FundListItem key={p.fundId} fundDetails={p} />
      })}
    </>
  )
}
