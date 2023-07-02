import { Trans } from '@lingui/macro'
import Card from 'components/Card'
import { LoadingRows } from 'components/Loader/styled'
import { RowBetween } from 'components/Row'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { darken } from 'polished'
import { useEffect } from 'react'
import React, { Dispatch, ReactNode, SetStateAction } from 'react'
import { BarChart as BarChartIcon } from 'react-feather'
import { Bar, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import styled, { css, useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { unixToDate } from 'utils/date'

dayjs.extend(utc)

const DEFAULT_HEIGHT = 340

const Wrapper = styled(Card)`
  width: 100%;
  height: ${DEFAULT_HEIGHT}px;
  padding: 1rem;
  padding-right: 1rem;
  display: flex;
  background-color: ${({ theme }) => theme.backgroundSurface};
  flex-direction: column;
  > * {
    font-size: 1rem;
  }
`

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`

const BarChartIconComponent = styled(BarChartIcon)`
  ${IconStyle}
`

type ComposedChartProps = {
  data: any[]
  color?: string | undefined
  color2?: string | undefined
  color3?: string | undefined
  minHeight?: number
  setIndex: Dispatch<SetStateAction<number | undefined>>
  label?: string
  symbol?: string
  value?: number
  amount?: number
  liquidityValue?: number
  liquidityAmount?: number
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
} & React.HTMLAttributes<HTMLDivElement>

const Chart = ({
  data,
  color = '#56B2A4',
  color2 = '#1E90FF',
  color3 = '#99FF99',
  setIndex,
  topLeft,
  topRight,
}: ComposedChartProps) => {
  const theme = useTheme()
  const isEmptyData = !data || data.length === 0

  const CustomTooltip = (props: any) => {
    const payload = props.payload && props.payload.length > 0 ? props.payload[0] : undefined
    const index = payload ? payload.payload.index : undefined

    useEffect(() => {
      setIndex(index)
    }, [index])

    return null
  }

  return (
    <Wrapper backgroundColor={!isEmptyData ? theme.deprecated_bg1 : undefined}>
      <RowBetween>
        {isEmptyData ? null : (
          <>
            {topLeft ?? null}
            {topRight ?? null}
          </>
        )}
      </RowBetween>
      {data?.length === 0 ? (
        <LoadingRows>
          <div style={{ height: '250px' }} />
        </LoadingRows>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          {isEmptyData ? (
            <ThemedText.DeprecatedBody color={theme.deprecated_text4} textAlign="center" paddingTop="80px">
              <BarChartIconComponent strokeWidth={1} />
              <div>
                <Trans>No volume data</Trans>
              </div>
            </ThemedText.DeprecatedBody>
          ) : (
            <ComposedChart
              width={500}
              height={300}
              data={data}
              margin={{
                top: 5,
                right: 5,
                left: 5,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={darken(0.36, color)} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <defs>
                <linearGradient id="gradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={darken(0.36, color2)} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={color2} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tickFormatter={(time) => dayjs(unixToDate(time)).format('DD')}
                minTickGap={10}
              />
              <Tooltip cursor={false} content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="current" stackId="a" stroke={color} fill={color} maxBarSize={80} />
              <Bar dataKey="pool" stackId="a" stroke={color2} fill={color2} maxBarSize={80} />
              <Line dataKey="principal" type="monotone" stroke={color3} />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      )}
    </Wrapper>
  )
}

export default Chart
