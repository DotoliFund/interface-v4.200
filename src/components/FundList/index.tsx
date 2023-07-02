import { Trans } from '@lingui/macro'
import FundListItem from 'components/FundListItem'
import React from 'react'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'
import { FundDetails } from 'types/fund'

const DesktopHeader = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  display: none;
  font-size: 14px;
  font-weight: 350;
  padding: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};

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
  color: ${({ theme }) => theme.textPrimary};
  font-size: 14px;
  font-weight: 350;
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    display: none;
  }

  @media screen and (max-width: ${MEDIA_WIDTHS.deprecated_upToExtraSmall}px) {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
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
