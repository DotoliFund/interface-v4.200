import { AutoColumn } from 'components/Column'
import FundTable from 'components/funds/FundTable'
import LineChart from 'components/AreaChart/alt'
import Row from 'components/Row'
import { MonoSpace } from 'components/shared'
import { useXXXFund2ChartData } from 'data/Overview/chartData'
import React, { useEffect, useMemo, useState } from 'react'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useFundListData } from 'state/funds/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { unixToDate } from 'utils/date'

const RowBetween = styled(Row)`
  justify-content: space-between;
`

const ResponsiveRow = styled(RowBetween)`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-direction: column;
    row-gap: 1rem;
  `};
`

const PageWrapper = styled.div`
  width: 90%;
`

const ThemedBackgroundGlobal = styled.div<{ backgroundColor: string }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  max-width: 100vw !important;
  height: 200vh;
  mix-blend-mode: color;
  background: ${({ backgroundColor }) =>
    `radial-gradient(50% 50% at 50% 50%, ${backgroundColor} 0%, rgba(255, 255, 255, 0) 100%)`};
  transform: translateY(-150vh);
`

const ChartWrapper = styled.div`
  width: 49%;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    width: 100%;
  `};
`

export default function Home() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const theme = useTheme()

  const [activeNetwork] = useActiveNetworkVersion()

  const [volumeHover, setVolumeHover] = useState<number | undefined>()
  const [liquidityHover, setLiquidityHover] = useState<number | undefined>()
  const [leftLabel, setLeftLabel] = useState<string | undefined>()

  const fundListData = useFundListData()
  const chartData = useXXXFund2ChartData().data

  const formattedTvlData = useMemo(() => {
    if (chartData) {
      return chartData.map((day) => {
        return {
          time: unixToDate(day.timestamp),
          value: day.totalVolumeUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const formattedCountData = useMemo(() => {
    if (chartData) {
      return chartData.map((day) => {
        return {
          time: unixToDate(day.timestamp),
          value: day.investorCount,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  return (
    <PageWrapper>
      <ThemedBackgroundGlobal backgroundColor={activeNetwork.bgColor} />
      <AutoColumn gap="16px">
        <ThemedText.DeprecatedMain>Uniswap Overview</ThemedText.DeprecatedMain>
        <ResponsiveRow>
          <ChartWrapper>
            <LineChart
              data={formattedTvlData}
              height={220}
              minHeight={332}
              color={activeNetwork.primaryColor}
              value={liquidityHover}
              label={leftLabel}
              setValue={setLiquidityHover}
              setLabel={setLeftLabel}
              topLeft={
                <AutoColumn gap="4px">
                  <ThemedText.MediumHeader fontSize="16px">TVL</ThemedText.MediumHeader>
                  <ThemedText.LargeHeader fontSize="32px">
                    <MonoSpace>
                      {formattedTvlData.length > 0 ? formattedTvlData[formattedTvlData.length - 1].value : 0}{' '}
                    </MonoSpace>
                  </ThemedText.LargeHeader>
                  <ThemedText.DeprecatedMain fontSize="12px" height="14px">
                    {leftLabel ? <MonoSpace>{leftLabel} (UTC)</MonoSpace> : null}
                  </ThemedText.DeprecatedMain>
                </AutoColumn>
              }
            />
          </ChartWrapper>
          <ChartWrapper>
            <LineChart
              data={formattedCountData}
              height={220}
              minHeight={332}
              color={activeNetwork.primaryColor}
              value={liquidityHover}
              label={leftLabel}
              setValue={setLiquidityHover}
              setLabel={setLeftLabel}
              topLeft={
                <AutoColumn gap="4px">
                  <ThemedText.MediumHeader fontSize="16px">Investors</ThemedText.MediumHeader>
                  <ThemedText.LargeHeader fontSize="32px">
                    <MonoSpace>
                      {formattedCountData.length > 0 ? formattedCountData[formattedCountData.length - 1].value : 0}{' '}
                    </MonoSpace>
                  </ThemedText.LargeHeader>
                  <ThemedText.DeprecatedMain fontSize="12px" height="14px">
                    {leftLabel ? <MonoSpace>{leftLabel} (UTC)</MonoSpace> : null}
                  </ThemedText.DeprecatedMain>
                </AutoColumn>
              }
            />
          </ChartWrapper>
        </ResponsiveRow>
        <RowBetween>
          <ThemedText.DeprecatedMain>Top Funds</ThemedText.DeprecatedMain>
        </RowBetween>
        <FundTable fundDatas={fundListData.data} />
      </AutoColumn>
    </PageWrapper>
  )
}
