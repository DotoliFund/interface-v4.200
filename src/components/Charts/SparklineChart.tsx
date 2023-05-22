import { curveCardinal, scaleLinear } from 'd3'
import { SparklineMap, TopToken } from 'graphql/data/TopTokens'
import { lighten } from 'polished'
import { memo } from 'react'
import styled, { useTheme, keyframes } from 'styled-components/macro'

import LineChart from './LineChart'

const loadingAnimation = keyframes`
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`

type PricePoint = { timestamp: number; value: number }

/* Loading state bubbles (animation style from: src/components/Loader/styled.tsx) */
const LoadingBubble = styled.div<{
  height?: string
  width?: string
  round?: boolean
  delay?: string
  margin?: string
}>`
  border-radius: 12px;
  border-radius: ${({ round }) => (round ? '50%' : '12px')};
  ${({ margin }) => margin && `margin: ${margin}`};
  height: ${({ height }) => height ?? '24px'};
  width: 50%;
  width: ${({ width }) => width ?? '50%'};
  animation: ${loadingAnimation} 1.5s infinite;
  ${({ delay }) => delay && `animation-delay: ${delay};`}
  animation-fill-mode: both;
  background: linear-gradient(
    to left,
    ${({ theme }) => theme.backgroundInteractive} 25%,
    ${({ theme }) => lighten(0.075, theme.backgroundInteractive)} 50%,
    ${({ theme }) => theme.backgroundInteractive} 75%
  );
  will-change: background-position;
  background-size: 400%;
`

const LongLoadingBubble = styled(LoadingBubble)`
  width: 90%;
`

const SparkLineLoadingBubble = styled(LongLoadingBubble)`
  height: 4px;
`

const LoadingContainer = styled.div`
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`

interface SparklineChartProps {
  width: number
  height: number
  tokenData: TopToken
  pricePercentChange: number | undefined | null
  sparklineMap: SparklineMap
}

function getPriceBounds(pricePoints: PricePoint[]): [number, number] {
  const prices = pricePoints.map((x) => x.value)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return [min, max]
}

function _SparklineChart({ width, height, tokenData, pricePercentChange, sparklineMap }: SparklineChartProps) {
  const theme = useTheme()
  // for sparkline
  const pricePoints = tokenData?.address ? sparklineMap[tokenData.address] : null

  // Don't display if there's one or less pricepoints
  if (!pricePoints || pricePoints.length <= 1) {
    return (
      <LoadingContainer>
        <SparkLineLoadingBubble />
      </LoadingContainer>
    )
  }

  const startingPrice = pricePoints[0]
  const endingPrice = pricePoints[pricePoints.length - 1]
  const widthScale = scaleLinear()
    .domain(
      // the range of possible input values
      [startingPrice.timestamp, endingPrice.timestamp]
    )
    .range(
      // the range of possible output values that the inputs should be transformed to (see https://www.d3indepth.com/scales/ for details)
      [0, 110]
    )
  const rdScale = scaleLinear().domain(getPriceBounds(pricePoints)).range([30, 0])
  const curveTension = 0.9

  return (
    <LineChart
      data={pricePoints}
      getX={(p: PricePoint) => widthScale(p.timestamp)}
      getY={(p: PricePoint) => rdScale(p.value)}
      curve={curveCardinal.tension(curveTension)}
      marginTop={5}
      color={pricePercentChange && pricePercentChange < 0 ? theme.accentFailure : theme.accentSuccess}
      strokeWidth={1.5}
      width={width}
      height={height}
    />
  )
}

export default memo(_SparklineChart)
