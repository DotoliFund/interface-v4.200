import { Trans } from '@lingui/macro'
import { Percent, Price, Token } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import Badge from 'components/Badge'
import RangeBadge from 'components/Badge/RangeBadge'
import Loader from 'components/Loader'
import { RowBetween } from 'components/Row'
import { useToken } from 'hooks/Tokens'
//import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { Link } from 'react-router-dom'
//import { Bound } from 'state/mint/v3/actions'
import styled from 'styled-components/macro'
import { HideSmall, MEDIA_WIDTHS, SmallOnly } from 'theme'
import { FundDetails } from 'types/fund'

//import { formatTickPrice } from 'utils/formatTickPrice'
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

const DoubleArrow = styled.span`
  margin: 0 2px;
  color: ${({ theme }) => theme.deprecated_text3};
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    margin: 4px;
    padding: 20px;
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
  //const { token0: token0Address, token1: token1Address, fee: feeAmount, liquidity, tickLower, tickUpper } = fundDetails
  const { fund: fundAddress, investor: investorAddress, tokens } = fundDetails
  const { account } = useWeb3React()

  // console.log('fundAddress :', fundAddress)
  // console.log('investorAddress :', investorAddress)
  // console.log('tokens :', tokens)

  const token0 = useToken(tokens[0])
  const token1 = useToken(tokens[1])

  const fundLink = '/fund/' + fundAddress + '/' + account

  return (
    <LinkRow to={fundLink}>
      <RowBetween>
        <PrimaryPositionIdData>
          {/* <DoubleCurrencyLogo currency0={currencyBase} currency1={currencyQuote} size={18} margin /> */}
          <DataText>
            {/* &nbsp;{currencyQuote?.symbol}&nbsp;/&nbsp;{currencyBase?.symbol} */}
            test12345
          </DataText>
          &nbsp;
          <Badge>
            <BadgeText>
              <Trans>{new Percent(123, 1_000_000).toSignificant()}%</Trans>
            </BadgeText>
          </Badge>
        </PrimaryPositionIdData>
        {/* <RangeBadge removed={removed} inRange={!outOfRange} /> */}
        <RangeBadge removed={true} inRange={true} />
      </RowBetween>

      {true ? (
        <RangeLineItem>
          <RangeText>
            <ExtentsText>
              <Trans>Min: </Trans>
            </ExtentsText>
            <Trans>
              {/* {tokens[0][0]} */}
              ddddddddddddddddd
              {/* {formatTickPrice(priceLower, tickAtLimit, Bound.LOWER)} <HoverInlineText text={currencyQuote?.symbol} />{' '}
              per <HoverInlineText text={currencyBase?.symbol ?? ''} /> */}
            </Trans>
          </RangeText>{' '}
          <HideSmall>
            <DoubleArrow>⟷</DoubleArrow>{' '}
          </HideSmall>
          <SmallOnly>
            <DoubleArrow>⟷</DoubleArrow>{' '}
          </SmallOnly>
          <RangeText>
            <ExtentsText>
              <Trans>Max:</Trans>
            </ExtentsText>
            <Trans>
              {/* {tokens[0][1]} */}
              hhhhhhhhhhhhhhhhhhh
              {/* {formatTickPrice(priceUpper, tickAtLimit, Bound.UPPER)} <HoverInlineText text={currencyQuote?.symbol} />{' '}
              per <HoverInlineText maxCharacters={10} text={currencyBase?.symbol} /> */}
            </Trans>
          </RangeText>
        </RangeLineItem>
      ) : (
        <Loader />
      )}
    </LinkRow>
  )
}
