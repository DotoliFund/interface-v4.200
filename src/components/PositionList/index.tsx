import { Trans } from '@lingui/macro'
import PositionListItem from 'components/PositionListItem'
import Toggle from 'components/Toggle'
import React from 'react'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'
import { PositionDetails } from 'types/position'

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

const ToggleWrap = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const ToggleLabel = styled.div`
  opacity: ${({ theme }) => theme.hoverDefault};
  margin-right: 10px;
`

const MobileTogglePosition = styled.div`
  @media screen and (max-width: ${MEDIA_WIDTHS.deprecated_upToExtraSmall}px) {
    position: absolute;
    right: 20px;
  }
`

type PositionListProps = React.PropsWithChildren<{
  positions: PositionDetails[]
  setUserHideClosedPositions: any
  userHideClosedPositions: boolean
}>

export default function PositionList({
  positions,
  setUserHideClosedPositions,
  userHideClosedPositions,
}: PositionListProps) {
  return (
    <>
      <DesktopHeader>
        <div>
          <Trans>Your positions</Trans>
          {positions && ' (' + positions.length + ')'}
        </div>
        {/* <ToggleWrap>
          <ToggleLabel>
            <Trans>Show closed positions</Trans>
          </ToggleLabel>
          <Toggle
            id="desktop-hide-closed-positions"
            isActive={!userHideClosedPositions}
            toggle={() => {
              setUserHideClosedPositions(!userHideClosedPositions)
            }}
          />
        </ToggleWrap> */}
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
              isActive={!userHideClosedPositions}
              toggle={() => {
                setUserHideClosedPositions(!userHideClosedPositions)
              }}
            />
          </MobileTogglePosition>
        </ToggleWrap>
      </MobileHeader>
      {positions.map((p) => {
        return <PositionListItem key={p.tokenId.toString()} positionDetails={p} />
      })}
    </>
  )
}
