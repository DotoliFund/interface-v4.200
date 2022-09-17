import { Trans } from '@lingui/macro'
import FundListItem from 'components/FundListItem'
import Toggle from 'components/Toggle'
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

const ToggleWrap = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const ToggleLabel = styled.div`
  opacity: 0.6;
  margin-right: 10px;
`

const MobileTogglePosition = styled.div`
  @media screen and (max-width: ${MEDIA_WIDTHS.deprecated_upToExtraSmall}px) {
    position: absolute;
    right: 20px;
  }
`

type FundListProps = React.PropsWithChildren<{
  funds: FundDetails[]
  setUserHideClosedFunds: any
  userHideClosedFunds: boolean
}>

export default function FundList({ funds, setUserHideClosedFunds, userHideClosedFunds }: FundListProps) {
  return (
    <>
      <DesktopHeader>
        <div>
          <Trans>Your positions</Trans>
          {funds && ' (' + funds.length + ')'}
        </div>
        <ToggleWrap>
          <ToggleLabel>
            <Trans>Show closed positions</Trans>
          </ToggleLabel>
          <Toggle
            id="desktop-hide-closed-positions"
            isActive={!userHideClosedFunds}
            toggle={() => {
              setUserHideClosedFunds(!userHideClosedFunds)
            }}
          />
        </ToggleWrap>
      </DesktopHeader>
      <MobileHeader>
        <Trans>Your positions</Trans>
        <ToggleWrap>
          <ToggleLabel>
            <Trans>Show closed positions</Trans>
          </ToggleLabel>
          <MobileTogglePosition>
            <Toggle
              id="mobile-hide-closed-positions"
              isActive={!userHideClosedFunds}
              toggle={() => {
                setUserHideClosedFunds(!userHideClosedFunds)
              }}
            />
          </MobileTogglePosition>
        </ToggleWrap>
      </MobileHeader>
      {funds.map((p) => {
        return <FundListItem key={p.fund.toString()} fundDetails={p} />
      })}
    </>
  )
}
