import AreaChart from 'components/AreaChart'
import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import FundTable from 'components/funds/TopFundTable'
import Row from 'components/Row'
import { MonoSpace } from 'components/shared'
import TokenTable from 'components/TokensTable'
import { useXXXFund2ChartData } from 'data/Overview/chartData'
import { useEffect, useMemo, useState } from 'react'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useFundListData, useTokenListData } from 'state/funds/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { formatTime, unixToDate } from 'utils/date'
import { formatDollarAmount } from 'utils/numbers'

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

export default function Overview() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [activeNetwork] = useActiveNetworkVersion()

  const [volumeDateHover, setVolumeDateHover] = useState<string | undefined>()
  const [volumeHover, setVolumeHover] = useState<number | undefined>()
  const [liquidityDateHover, setLiquidityDateHover] = useState<string | undefined>()
  const [liquidityHover, setLiquidityHover] = useState<number | undefined>()

  const fundListData = useFundListData()
  const tokenListData = useTokenListData()
  const chartData = useXXXFund2ChartData().data

  const formattedTotalVolume = useMemo(() => {
    if (chartData) {
      return chartData.map((day) => {
        return {
          time: day.timestamp,
          value: day.totalVolumeUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const formattedTotalLiquidityVolume = useMemo(() => {
    if (chartData) {
      return chartData.map((day) => {
        return {
          time: day.timestamp,
          value: day.totalLiquidityVolumeUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const latestVolumeData = useMemo(() => {
    if (chartData && chartData.length > 0) {
      return {
        time: chartData[chartData.length - 1].timestamp,
        value: chartData[chartData.length - 1].totalVolumeUSD,
      }
    } else {
      return undefined
    }
  }, [chartData])

  const latestLiquidityData = useMemo(() => {
    if (chartData && chartData.length > 0) {
      return {
        time: chartData[chartData.length - 1].timestamp,
        value: chartData[chartData.length - 1].totalLiquidityVolumeUSD,
      }
    } else {
      return undefined
    }
  }, [chartData])

  return (
    <PageWrapper>
      <ThemedBackgroundGlobal backgroundColor={activeNetwork.bgColor} />
      <AutoColumn gap="16px">
        <ThemedText.DeprecatedMain mt={'16px'} fontSize="22px">
          Overview
        </ThemedText.DeprecatedMain>
        <ResponsiveRow>
          <ChartWrapper>
            <AreaChart
              data={formattedTotalVolume}
              color={activeNetwork.primaryColor}
              setLabel={setVolumeDateHover}
              setValue={setVolumeHover}
              topLeft={
                <AutoColumn gap="4px">
                  <ThemedText.MediumHeader fontSize="16px">Volume</ThemedText.MediumHeader>
                  <ThemedText.LargeHeader fontSize="32px">
                    <MonoSpace>
                      {formatDollarAmount(
                        volumeHover !== undefined ? volumeHover : latestVolumeData ? latestVolumeData.value : 0
                      )}
                    </MonoSpace>
                  </ThemedText.LargeHeader>
                </AutoColumn>
              }
              topRight={
                <AutoColumn gap="4px">
                  <ThemedText.DeprecatedMain fontSize="14px" height="14px">
                    {volumeDateHover ? (
                      <MonoSpace>
                        {unixToDate(Number(volumeDateHover))} ( {formatTime(volumeDateHover.toString(), 8)} )
                      </MonoSpace>
                    ) : latestVolumeData ? (
                      <MonoSpace>
                        {unixToDate(latestVolumeData.time)} ( {formatTime(latestVolumeData.time.toString(), 8)} )
                      </MonoSpace>
                    ) : null}
                  </ThemedText.DeprecatedMain>
                  <br />
                  <br />
                </AutoColumn>
              }
            />
          </ChartWrapper>
          <ChartWrapper>
            <AreaChart
              data={formattedTotalLiquidityVolume}
              color={activeNetwork.primaryColor}
              setLabel={setLiquidityDateHover}
              setValue={setLiquidityHover}
              topLeft={
                <AutoColumn gap="4px">
                  <ThemedText.MediumHeader fontSize="16px">Liquidity</ThemedText.MediumHeader>
                  <ThemedText.LargeHeader fontSize="32px">
                    <MonoSpace>
                      {formatDollarAmount(
                        liquidityHover !== undefined
                          ? liquidityHover
                          : latestLiquidityData
                          ? latestLiquidityData.value
                          : 0
                      )}
                    </MonoSpace>
                  </ThemedText.LargeHeader>
                </AutoColumn>
              }
              topRight={
                <AutoColumn gap="4px">
                  <ThemedText.DeprecatedMain fontSize="14px" height="14px">
                    {liquidityDateHover ? (
                      <MonoSpace>
                        {unixToDate(Number(liquidityDateHover))} ( {formatTime(liquidityDateHover.toString(), 8)} )
                      </MonoSpace>
                    ) : latestVolumeData ? (
                      <MonoSpace>
                        {unixToDate(latestVolumeData.time)} ( {formatTime(latestVolumeData.time.toString(), 8)} )
                      </MonoSpace>
                    ) : null}
                  </ThemedText.DeprecatedMain>
                  <br />
                  <br />
                </AutoColumn>
              }
            />
          </ChartWrapper>
        </ResponsiveRow>
        <RowBetween mt={'16px'}>
          <ThemedText.DeprecatedMain fontSize="22px">Top Funds</ThemedText.DeprecatedMain>
        </RowBetween>
        <DarkGreyCard>
          <FundTable fundDatas={fundListData.data} />
        </DarkGreyCard>
        <RowBetween mt={'16px'}>
          <ThemedText.DeprecatedMain fontSize="22px">Tokens</ThemedText.DeprecatedMain>
        </RowBetween>
        <DarkGreyCard>
          <TokenTable tokenDatas={tokenListData.data} />
        </DarkGreyCard>
      </AutoColumn>
    </PageWrapper>
  )
}
