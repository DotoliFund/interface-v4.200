import { Trans } from '@lingui/macro'
import AreaChart from 'components/AreaChart'
import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import FundTable from 'components/funds/TopFundTable'
import Row, { RowFixed } from 'components/Row'
import { MonoSpace } from 'components/shared'
import TokenTable from 'components/TokensTable'
import { useFactoryChartData } from 'data/Overview/chartData'
import { useFactoryData } from 'data/Overview/factoryData'
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

export const HideMedium = styled.span`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    display: none;
  `};
`

export const HideSmall = styled.span`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: none;
  `};
`

export default function Overview() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [activeNetwork] = useActiveNetworkVersion()

  const [currentVolumeIndexHover, setCurrentVolumeIndexHover] = useState<number | undefined>()
  const [investorCountIndexHover, setInvestorCountIndexHover] = useState<number | undefined>()

  const factoryData = useFactoryData()
  const fundListData = useFundListData()
  const tokenListData = useTokenListData()
  const chartData = useFactoryChartData().data

  const formattedTotalCurrent = useMemo(() => {
    if (chartData) {
      return chartData.map((day, index) => {
        return {
          time: day.timestamp,
          value: day.totalCurrentUSD,
          index,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const formattedInvestorCount = useMemo(() => {
    if (chartData) {
      return chartData.map((day, index) => {
        return {
          time: day.timestamp,
          value: day.investorCount,
          index,
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
        <ThemedText.DeprecatedMain mt={'16px'} fontSize="22px">
          <Trans>Overview</Trans>
        </ThemedText.DeprecatedMain>
        <ResponsiveRow>
          <ChartWrapper>
            <AreaChart
              data={formattedTotalCurrent}
              color={activeNetwork.primaryColor}
              setIndex={setCurrentVolumeIndexHover}
              topLeft={
                <AutoColumn gap="4px">
                  <ThemedText.MediumHeader fontSize="16px">Current</ThemedText.MediumHeader>
                  <ThemedText.LargeHeader fontSize="32px">
                    <MonoSpace>
                      {formatDollarAmount(
                        currentVolumeIndexHover !== undefined &&
                          formattedTotalCurrent &&
                          formattedTotalCurrent.length > 0
                          ? formattedTotalCurrent[currentVolumeIndexHover].value
                          : formattedTotalCurrent && formattedTotalCurrent.length > 0
                          ? formattedTotalCurrent[formattedTotalCurrent.length - 1].value
                          : 0
                      )}
                    </MonoSpace>
                  </ThemedText.LargeHeader>
                </AutoColumn>
              }
              topRight={
                <AutoColumn gap="4px">
                  <ThemedText.DeprecatedMain fontSize="14px" height="14px">
                    {currentVolumeIndexHover !== undefined &&
                    formattedTotalCurrent &&
                    formattedTotalCurrent.length > 0 ? (
                      <MonoSpace>
                        {unixToDate(Number(formattedTotalCurrent[currentVolumeIndexHover].time))} ({' '}
                        {formatTime(formattedTotalCurrent[currentVolumeIndexHover].time.toString(), 8)} )
                      </MonoSpace>
                    ) : formattedTotalCurrent && formattedTotalCurrent.length > 0 ? (
                      <MonoSpace>
                        {unixToDate(formattedTotalCurrent[formattedTotalCurrent.length - 1].time)} ({' '}
                        {formatTime(formattedTotalCurrent[formattedTotalCurrent.length - 1].time.toString(), 8)} )
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
              data={formattedInvestorCount}
              color={activeNetwork.primaryColor}
              setIndex={setInvestorCountIndexHover}
              topLeft={
                <AutoColumn gap="4px">
                  <ThemedText.MediumHeader fontSize="16px">
                    <Trans>Investor</Trans>
                  </ThemedText.MediumHeader>
                  <ThemedText.LargeHeader fontSize="32px">
                    <MonoSpace>
                      {investorCountIndexHover !== undefined &&
                      formattedInvestorCount &&
                      formattedInvestorCount.length > 0
                        ? formattedInvestorCount[investorCountIndexHover].value
                        : formattedInvestorCount && formattedInvestorCount.length > 0
                        ? formattedInvestorCount[formattedInvestorCount.length - 1].value
                        : 0}
                    </MonoSpace>
                  </ThemedText.LargeHeader>
                </AutoColumn>
              }
              topRight={
                <AutoColumn gap="4px">
                  <ThemedText.DeprecatedMain fontSize="14px" height="14px">
                    {investorCountIndexHover !== undefined &&
                    formattedInvestorCount &&
                    formattedInvestorCount.length > 0 ? (
                      <MonoSpace>
                        {unixToDate(Number(formattedInvestorCount[investorCountIndexHover].time))} ({' '}
                        {formatTime(formattedInvestorCount[investorCountIndexHover].time.toString(), 8)} )
                      </MonoSpace>
                    ) : formattedInvestorCount && formattedInvestorCount.length > 0 ? (
                      <MonoSpace>
                        {unixToDate(Number(formattedInvestorCount[formattedInvestorCount.length - 1].time))} ({' '}
                        {formatTime(formattedInvestorCount[formattedInvestorCount.length - 1].time.toString(), 8)} )
                      </MonoSpace>
                    ) : (
                      0
                    )}
                  </ThemedText.DeprecatedMain>
                  <br />
                  <br />
                </AutoColumn>
              }
            />
          </ChartWrapper>
        </ResponsiveRow>
        <HideSmall>
          <DarkGreyCard mt="10px">
            <RowBetween>
              <RowFixed>
                <RowFixed mr="20px">
                  <ThemedText.DeprecatedMain ml="10px">
                    <Trans>Funds :</Trans>
                  </ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel ml="10px">{factoryData.data?.fundCount}</ThemedText.DeprecatedLabel>
                  <ThemedText.DeprecatedMain></ThemedText.DeprecatedMain>
                </RowFixed>
                <RowFixed mr="20px">
                  <ThemedText.DeprecatedMain ml="10px">
                    <Trans>Investors : </Trans>
                  </ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel ml="10px">{factoryData.data?.investorCount}</ThemedText.DeprecatedLabel>
                  <ThemedText.DeprecatedMain></ThemedText.DeprecatedMain>
                </RowFixed>
                <HideMedium>
                  <RowFixed mr="20px">
                    <ThemedText.DeprecatedMain ml="10px">
                      <Trans>Manager Fee : </Trans>
                    </ThemedText.DeprecatedMain>
                    <ThemedText.DeprecatedLabel ml="10px">
                      {factoryData.data ? (factoryData.data.managerFee / 10000).toFixed(2) : ''} %
                    </ThemedText.DeprecatedLabel>
                  </RowFixed>
                </HideMedium>
                <HideMedium>
                  <RowFixed mr="20px">
                    <ThemedText.DeprecatedMain ml="10px">
                      <Trans>Pool size to be whitelisted tokens: </Trans>
                    </ThemedText.DeprecatedMain>
                    <ThemedText.DeprecatedLabel ml="10px">
                      {factoryData.data ? factoryData.data.minPoolAmount / 1e18 : ''} ETH
                    </ThemedText.DeprecatedLabel>
                  </RowFixed>
                </HideMedium>
              </RowFixed>
            </RowBetween>
          </DarkGreyCard>
        </HideSmall>
        <RowBetween mt={'16px'}>
          <ThemedText.DeprecatedMain fontSize="22px">
            <Trans>Top Funds</Trans>
          </ThemedText.DeprecatedMain>
        </RowBetween>
        <DarkGreyCard>
          <FundTable fundDatas={fundListData.data} />
        </DarkGreyCard>
        <RowBetween mt={'16px'}>
          <ThemedText.DeprecatedMain fontSize="22px">
            <Trans>Tokens</Trans>
          </ThemedText.DeprecatedMain>
        </RowBetween>
        <DarkGreyCard>
          <TokenTable tokenDatas={tokenListData.data} />
        </DarkGreyCard>
      </AutoColumn>
    </PageWrapper>
  )
}
