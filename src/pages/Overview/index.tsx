import AreaChart from 'components/AreaChart'
import { AutoColumn } from 'components/Column'
import FundTable from 'components/funds/FundTable'
import Row from 'components/Row'
import { MonoSpace } from 'components/shared'
import { useXXXFund2ChartData } from 'data/Overview/chartData'
import { useEffect, useMemo, useState } from 'react'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useFundListData } from 'state/funds/hooks'
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

  const [dateHover, setDateHover] = useState<string | undefined>()
  const [tvlHover, setTvlHover] = useState<number | undefined>()
  const [investorCountHover, setInvestorCountHover] = useState<number | undefined>()
  const [investorCountLabel, setInvestorCountLabel] = useState<string | undefined>()

  const fundListData = useFundListData()
  const chartData = useXXXFund2ChartData().data

  const formattedTvlData = useMemo(() => {
    if (chartData) {
      return chartData.map((day) => {
        return {
          time: day.timestamp,
          value: day.totalVolumeUSD + day.totalLiquidityVolumeUSD,
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
          time: day.timestamp,
          value: day.investorCount,
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
        value: chartData[chartData.length - 1].totalVolumeUSD + chartData[chartData.length - 1].totalLiquidityVolumeUSD,
      }
    } else {
      return undefined
    }
  }, [chartData])

  const latestCountData = useMemo(() => {
    if (chartData && chartData.length > 0) {
      return {
        time: chartData[chartData.length - 1].timestamp,
        value: chartData[chartData.length - 1].investorCount,
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
              data={formattedTvlData}
              color={activeNetwork.primaryColor}
              label={dateHover}
              value={tvlHover}
              setLabel={setDateHover}
              setValue={setTvlHover}
              topLeft={
                <AutoColumn gap="4px">
                  <ThemedText.MediumHeader fontSize="16px">TVL</ThemedText.MediumHeader>
                  <ThemedText.LargeHeader fontSize="32px">
                    <MonoSpace>
                      {formatDollarAmount(
                        tvlHover !== undefined ? tvlHover : latestVolumeData ? latestVolumeData.value : 0
                      )}
                    </MonoSpace>
                  </ThemedText.LargeHeader>
                </AutoColumn>
              }
              topRight={
                <AutoColumn gap="4px">
                  <ThemedText.DeprecatedMain fontSize="14px" height="14px">
                    {dateHover ? (
                      <MonoSpace>
                        {unixToDate(Number(dateHover))} ( {formatTime(dateHover.toString(), 8)} )
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
              data={formattedCountData}
              height={220}
              minHeight={332}
              color={activeNetwork.primaryColor}
              value={investorCountHover}
              label={investorCountLabel}
              setValue={setInvestorCountHover}
              setLabel={setInvestorCountLabel}
              topLeft={
                <AutoColumn gap="4px">
                  <ThemedText.MediumHeader fontSize="16px">Investors</ThemedText.MediumHeader>
                  <ThemedText.LargeHeader fontSize="32px">
                    <MonoSpace>
                      {investorCountHover !== undefined
                        ? investorCountHover
                        : latestCountData !== undefined
                        ? latestCountData.value
                        : 0}
                    </MonoSpace>
                  </ThemedText.LargeHeader>
                </AutoColumn>
              }
              topRight={
                <AutoColumn gap="4px">
                  <ThemedText.DeprecatedMain fontSize="14px" height="14px">
                    {investorCountLabel ? (
                      <MonoSpace>
                        {unixToDate(Number(investorCountLabel))} ( {formatTime(investorCountLabel, 8)} )
                      </MonoSpace>
                    ) : latestCountData ? (
                      <MonoSpace>
                        {unixToDate(Number(latestCountData.time))} ( {formatTime(latestCountData.time.toString(), 8)} )
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
        <FundTable fundDatas={fundListData.data} />
      </AutoColumn>
    </PageWrapper>
  )
}
