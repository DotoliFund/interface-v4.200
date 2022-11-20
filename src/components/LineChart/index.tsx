import Card from 'components/Card'
import { LoadingRows } from 'components/Loader'
import { RowBetween } from 'components/Row'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { darken } from 'polished'
import React, { Dispatch, ReactNode, SetStateAction } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styled, { useTheme } from 'styled-components/macro'

dayjs.extend(utc)

const DEFAULT_HEIGHT = 300

const Wrapper = styled(Card)`
  width: 100%;
  height: ${DEFAULT_HEIGHT}px;
  padding: 1rem;
  padding-right: 2rem;
  display: flex;
  background-color: ${({ theme }) => theme.deprecated_bg0};
  flex-direction: column;
  > * {
    font-size: 1rem;
  }
`

export type LineChartProps = {
  data: any[]
  color?: string | undefined
  color2?: string | undefined
  height?: number | undefined
  minHeight?: number
  setValue?: Dispatch<SetStateAction<number | undefined>> // used for value on hover
  setLabel?: Dispatch<SetStateAction<string | undefined>> // used for label of valye
  value?: number
  label?: string
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
} & React.HTMLAttributes<HTMLDivElement>

const Chart = ({
  data,
  color = '#56B2A4',
  color2 = '#4A2B65',
  value,
  label,
  setValue,
  setLabel,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  minHeight = DEFAULT_HEIGHT,
  ...rest
}: LineChartProps) => {
  const theme = useTheme()
  const parsedValue = value
  const series: any = []

  data.map((value, index) => {
    const time = value.time
    const tokens = value.tokens
    const tokensVolumeUSD = value.tokensVolumeUSD

    tokens.map((token: any, index: any) => {
      const i = series.findIndex((element: any) => element.token === token)
      if (i >= 0) {
        series[i].data.push({
          time,
          value: tokensVolumeUSD[index],
        })
      } else {
        series.push({
          token,
          data: [{ time, value: tokensVolumeUSD[index] }],
        })
      }
    })
    console.log(1234, series)
  })

  // const series = [
  //   {
  //     token: 'Series 1',
  //     data: [
  //       { time: 'A', value: Math.random() },
  //       { time: 'B', value: Math.random() },
  //       { time: 'C', value: Math.random() },
  //     ],
  //   },
  //   {
  //     token: 'Series 2',
  //     data: [
  //       { time: 'B', value: Math.random() },
  //       { time: 'C', value: Math.random() },
  //       { time: 'D', value: Math.random() },
  //     ],
  //   },
  //   {
  //     token: 'Series 3',
  //     data: [
  //       { time: 'C', value: Math.random() },
  //       { time: 'D', value: Math.random() },
  //       { time: 'E', value: Math.random() },
  //     ],
  //   },
  // ]
  return (
    <Wrapper minHeight={minHeight} {...rest}>
      <RowBetween>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>
      {series?.length === 0 ? (
        <LoadingRows>
          <div />
          <div />
          <div />
        </LoadingRows>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            width={500}
            height={300}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            onMouseLeave={() => {
              setLabel && setLabel(undefined)
              setValue && setValue(undefined)
            }}
          >
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={darken(0.36, color)} stopOpacity={0.5} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tickFormatter={(time) => dayjs(time).format('DD')}
              minTickGap={10}
            />
            <YAxis dataKey="value" />
            <Tooltip
              wrapperStyle={{ backgroundColor: 'red' }}
              labelStyle={{ color: 'green' }}
              itemStyle={{ color: 'cyan' }}
              formatter={function (value, name) {
                return `${value}`
              }}
              labelFormatter={function (value) {
                return `${value}`
              }}
            />
            {series.map((s: any) => (
              <Line dataKey="value" data={s.data} name={s.token} key={s.token} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
      <RowBetween>
        {bottomLeft ?? null}
        {bottomRight ?? null}
      </RowBetween>
    </Wrapper>
  )
}

export default Chart
