import { Trans } from '@lingui/macro'
import { Price, Token } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import Badge from 'components/Badge'
import { LoadingRows } from 'components/Loader/styled'
import Percent from 'components/Percent'
import { RowBetween } from 'components/Row'
import { useFundData } from 'data/FundPage/fundData'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'
import { FundDetails } from 'types/fund'
import { shortenAddress } from 'utils'
import { formatDollarAmount } from 'utils/numbers'

import { DAI, USDC_MAINNET, USDT, WBTC, WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'

const LinkRow = styled(Link)`
  align-items: center;
  border-radius: 20px;
  display: flex;
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;

  justify-content: space-between;
  color: ${({ theme }) => theme.deprecated_text1};
  margin: 8px 0;
  padding: 16px;
  text-decoration: none;
  font-weight: 500;
  background-color: ${({ theme }) => theme.deprecated_bg1};

  &:last-of-type {
    margin: 8px 0 0 0;
  }
  & > div:not(:first-child) {
    text-align: center;
  }
  :hover {
    background-color: ${({ theme }) => theme.deprecated_bg2};
  }

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    /* flex-direction: row; */
  }

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-direction: column;
    row-gap: 12px;
  `};
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    font-size: 12px;
  `};
`

const DataLineItem = styled.div`
  font-size: 14px;
`

const RangeLineItem = styled(DataLineItem)`
  display: flex;
  flex-direction: row;
  align-items: center;

  margin-top: 4px;
  width: 100%;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
  background-color: ${({ theme }) => theme.deprecated_bg2};
    border-radius: 12px;
    padding: 8px 0;
`};
`

const RangeText = styled.span`
  /* background-color: ${({ theme }) => theme.deprecated_bg2}; */
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
`

const ExtentsText = styled.span`
  color: ${({ theme }) => theme.deprecated_text3};
  font-size: 14px;
  margin-right: 4px;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: none;
  `};
`

const PrimaryPositionIdData = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  > * {
    margin-right: 8px;
  }
`

const DataText = styled.div`
  font-weight: 600;
  font-size: 18px;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    font-size: 14px;
  `};
`

interface FundListItemProps {
  fundDetails: FundDetails
}

export function getPriceOrderingFromPositionForUI(position?: Position): {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} {
  if (!position) {
    return {}
  }

  const token0 = position.amount0.currency
  const token1 = position.amount1.currency

  // if token0 is a dollar-stable asset, set it as the quote token
  const stables = [DAI, USDC_MAINNET, USDT]
  if (stables.some((stable) => stable.equals(token0))) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // if token1 is an ETH-/BTC-stable asset, set it as the base token
  const bases = [...Object.values(WRAPPED_NATIVE_CURRENCY), WBTC]
  if (bases.some((base) => base && base.equals(token1))) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // if both prices are below 1, invert
  if (position.token0PriceUpper.lessThan(1)) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // otherwise, just return the default
  return {
    priceLower: position.token0PriceLower,
    priceUpper: position.token0PriceUpper,
    quote: token1,
    base: token0,
  }
}

export default function FundListItem({ fundDetails }: FundListItemProps) {
  const { fund: fundAddress } = fundDetails
  const fundData = useFundData(fundAddress).data
  const fundLink = '/fund/' + fundAddress
  return (
    <>
      {fundData ? (
        <LinkRow to={fundLink}>
          <RowBetween>
            <PrimaryPositionIdData>
              <DataText>{shortenAddress(fundData.address)}</DataText>
              &nbsp;
              <Badge>
                <BadgeText>
                  <Percent value={fundData.profitRatio} wrap={false} fontSize="14px" />
                </BadgeText>
              </Badge>
            </PrimaryPositionIdData>
          </RowBetween>

          <RangeLineItem>
            <RangeText>
              <ExtentsText>
                <Trans>TVL : </Trans>
              </ExtentsText>
              {formatDollarAmount(fundData.volumeUSD)}
            </RangeText>
            <RangeText>
              <ExtentsText>
                <Trans>Principal : </Trans>
              </ExtentsText>
              {formatDollarAmount(fundData.principalUSD)}
            </RangeText>
            <RangeText>
              <RangeText>
                <ExtentsText>
                  <Trans>Profit : </Trans>
                </ExtentsText>
                {formatDollarAmount(fundData.profitUSD)}
              </RangeText>
              <RangeText></RangeText>
              <ExtentsText>
                <Trans>Investors:</Trans>
              </ExtentsText>
              {fundData.investorCount}
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
